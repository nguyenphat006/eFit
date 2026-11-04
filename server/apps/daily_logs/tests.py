"""Test nhật ký hằng ngày: hợp đồng API, upsert theo ngày, quyền sở hữu, gắn giai đoạn, điểm kỷ luật, DFI."""
from datetime import timedelta
from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.clients.models import Client
from apps.core.permissions import invalidate_user_permissions
from apps.seasons.models import Meal, NutritionPlan, Phase, Season

from .models import DailyLog
from .services.metrics import calculate_compliance, calculate_dfi

User = get_user_model()
URL = '/api/v1/daily-logs/'
UPSERT = f'{URL}upsert/'


def make_user(username, *codes):
    user = User.objects.create_user(username=username, email=f'{username}@x.vn', password='Password123!')
    if codes:
        role = Role.objects.create(role_code=f'R_{username}'.upper(), role_name=username)
        for code in codes:
            perm, _ = Permission.objects.get_or_create(
                permission_code=code, defaults={'permission_name': code, 'module': 'DAILY_LOG'}
            )
            RolePermission.objects.create(role=role, permission=perm)
        user.roles.add(role)
    return user


ALL = ('DAILY_LOG_READ', 'DAILY_LOG_CREATE', 'DAILY_LOG_UPDATE', 'DAILY_LOG_DELETE')


class DailyLogApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.api = APIClient()
        self.coach = make_user('coach', *ALL)
        self.other = make_user('other', *ALL)
        self.api.force_authenticate(self.coach)
        self.today = timezone.localdate()

    def test_create_list_envelope(self):
        resp = self.api.post(URL, {'log_date': self.today.isoformat(), 'weight': 70.5, 'is_workout_completed': True}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['owner'], self.coach.id)
        self.assertEqual(body['data']['weight'], 70.5)
        # tập + ghi cân = 100% của (0.3 + 0.2)
        self.assertEqual(body['data']['compliance_score'], 100.0)

        listing = self.api.get(URL, {'log_date__gte': (self.today - timedelta(days=3)).isoformat()}).json()
        self.assertEqual(listing['data']['count'], 1)

    def test_duplicate_day_is_validation_error(self):
        self.api.post(URL, {'log_date': self.today.isoformat()}, format='json')
        body = self.api.post(URL, {'log_date': self.today.isoformat()}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('log_date', body['errors'])

    def test_upsert_creates_then_updates_same_day(self):
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'weight': 80}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        log_id = resp.json()['data']['id']
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'sleep_hours': 7}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()['data']
        self.assertEqual(data['id'], log_id)
        self.assertEqual(data['weight'], 80.0)  # trường không gửi giữ nguyên
        self.assertEqual(DailyLog.objects.count(), 1)

    def test_upsert_after_soft_delete_creates_new(self):
        log_id = self.api.put(UPSERT, {'log_date': self.today.isoformat()}, format='json').json()['data']['id']
        self.api.delete(f'{URL}{log_id}/')
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat()}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(resp.json()['data']['id'], log_id)

    def test_other_user_log_is_404(self):
        log = DailyLog.objects.create(owner=self.other, log_date=self.today)
        self.assertEqual(self.api.get(f'{URL}{log.id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.api.get(URL).json()['data']['count'], 0)

    def test_cannot_log_for_other_coach_client(self):
        client = Client.objects.create(coach=self.other, full_name='HV khác')
        body = self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'client': client.id}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('client', body['errors'])

    def test_client_log_unique_per_day(self):
        client = Client.objects.create(coach=self.coach, full_name='HV')
        self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'client': client.id}, format='json')
        self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'client': client.id, 'weight': 60}, format='json')
        self.assertEqual(DailyLog.objects.filter(client=client).count(), 1)
        # nhật ký của chính HLV cùng ngày là bản ghi riêng
        self.api.put(UPSERT, {'log_date': self.today.isoformat()}, format='json')
        self.assertEqual(DailyLog.objects.count(), 2)

    def test_auto_attach_active_phase_and_meals(self):
        season = Season.objects.create(
            owner=self.coach, name='Mùa', start_date=self.today - timedelta(days=5),
            end_date=self.today + timedelta(days=30), status='ACTIVE',
        )
        phase = Phase.objects.create(
            season=season, name='P1', start_date=self.today - timedelta(days=5), end_date=self.today + timedelta(days=5),
            target_calories=2000, target_protein=150, target_carbs=200, target_fat=60,
        )
        plan = NutritionPlan.objects.create(phase=phase, target_calories=2000, target_protein=150, target_carbs=200, target_fat=60)
        m1 = Meal.objects.create(plan=plan, name='B1', target_calories=500, target_protein=40, target_carbs=50, target_fat=15)
        Meal.objects.create(plan=plan, name='B2', target_calories=1500, target_protein=110, target_carbs=150, target_fat=45)

        data = self.api.put(
            UPSERT, {'log_date': self.today.isoformat(), 'diet_completed_meal_ids': [m1.id]}, format='json'
        ).json()['data']
        self.assertEqual(data['phase'], phase.id)
        self.assertEqual(data['season_id'], season.id)
        self.assertEqual(data['target_calories_snapshot'], 2000.0)
        self.assertEqual(data['calories_in'], 500.0)
        self.assertEqual(data['diet_meals_completed'], 1)
        self.assertEqual(data['diet_target_meals'], 2)

    def test_upsert_with_phase_outside_range_is_validation_error(self):
        season = Season.objects.create(owner=self.coach, name='Mùa', start_date=self.today, end_date=self.today, status='ACTIVE')
        phase = Phase.objects.create(season=season, name='P1', start_date=self.today, end_date=self.today)
        body = self.api.put(
            UPSERT, {'log_date': (self.today + timedelta(days=1)).isoformat(), 'phase': phase.id}, format='json'
        ).json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('log_date', body['errors'])

    def test_upsert_with_foreign_phase_is_404(self):
        season = Season.objects.create(owner=self.other, name='Mùa', start_date=self.today, end_date=self.today)
        phase = Phase.objects.create(season=season, name='P1', start_date=self.today, end_date=self.today)
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'phase': phase.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_summary(self):
        DailyLog.objects.create(owner=self.coach, log_date=self.today, sleep_hours=8, fatigue_level=1, compliance_score=80)
        data = self.api.get(f'{URL}summary/').json()['data']
        self.assertTrue(data['today']['has_log'])
        self.assertEqual(data['log_adherence_7d'], round(1 / 7 * 100, 1))
        self.assertEqual(data['compliance_avg_7d'], 80.0)
        self.assertEqual(len(data['history_7d']), 1)

    def test_requires_module_permission(self):
        reader = make_user('reader', 'DAILY_LOG_READ')
        self.api.force_authenticate(reader)
        self.assertEqual(self.api.get(URL).status_code, status.HTTP_200_OK)
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat()}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(DailyLog.objects.exists())

    def test_upsert_existing_needs_update_permission(self):
        creator = make_user('creator', 'DAILY_LOG_READ', 'DAILY_LOG_CREATE')
        self.api.force_authenticate(creator)
        self.assertEqual(self.api.put(UPSERT, {'log_date': self.today.isoformat()}, format='json').status_code, 201)
        resp = self.api.put(UPSERT, {'log_date': self.today.isoformat(), 'weight': 1}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class MetricsTests(SimpleTestCase):
    def _log(self, **kw):
        base = dict(
            diet_meals_completed=None, diet_target_meals=4, diet_cheat_status='NONE', is_workout_completed=False,
            weight=None, steps=None, cardio_duration_minutes=None,
        )
        base.update(kw)
        return SimpleNamespace(**base)

    def test_compliance_empty_day_is_zero(self):
        self.assertEqual(calculate_compliance(self._log()), Decimal('0.0'))

    def test_compliance_full_day(self):
        log = self._log(diet_meals_completed=4, is_workout_completed=True, weight=70, steps=10000)
        self.assertEqual(calculate_compliance(log), Decimal('100.0'))

    def test_compliance_unplanned_cheat_penalty(self):
        # dinh dưỡng 100 - 30 = 70 (w 0.5), tập 100 (w 0.3), cân 100 (w 0.2) -> (35 + 30 + 20) / 1.0
        log = self._log(diet_meals_completed=4, diet_cheat_status='UNPLANNED', is_workout_completed=True, weight=70)
        self.assertEqual(calculate_compliance(log), Decimal('85.0'))

    def test_compliance_cardio_uses_best_of_steps_and_minutes(self):
        log = self._log(steps=5000, cardio_duration_minutes=30)
        # tập 0 (0.3) + cân 0 (0.2) + cardio 100 (0.2) -> 20 / 0.7
        self.assertEqual(calculate_compliance(log), Decimal(str(round(20 / 0.7, 1))))

    def test_dfi(self):
        self.assertIsNone(calculate_dfi(None, None, None))
        self.assertEqual(calculate_dfi(8, None, None), 0.0)
        self.assertEqual(calculate_dfi(4, 10, 5), round((0.4 * 50 + 0.3 * 100 + 0.3 * 100) / 1.0, 1))
        self.assertEqual(calculate_dfi(None, None, 3), 60.0)

