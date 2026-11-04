"""Test API mùa giải / giai đoạn / thực đơn: envelope, quyền sở hữu, máy trạng thái, 1 mùa ACTIVE, giao mẫu, thực đơn."""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.clients.models import Client
from apps.core.permissions import invalidate_user_permissions
from apps.nutrition.models import FoodCategory, FoodItem
from apps.workouts.models import WorkoutDay, WorkoutExercise, WorkoutProgram
from apps.workouts.tests import make_user

from .models import Phase, Season, SeasonStatus

User = get_user_model()
URL = '/api/v1/seasons/'
PHASE_URL = '/api/v1/phases/'
FULL = [f'SEASON_{a}' for a in ('VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE')]


class SeasonApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.api = APIClient()
        self.coach = make_user('coach_s', FULL)
        self.other = make_user('other_s', FULL)
        self.api.force_authenticate(self.coach)
        self.client_a = Client.objects.create(coach=self.coach, full_name='Học viên A')

    def create(self, **extra):
        data = {'name': 'Mùa siết cơ', 'start_date': '2026-01-01', 'end_date': '2026-03-31'}
        data.update(extra)
        return self.api.post(URL, data, format='json')

    def test_create_auto_phase(self):
        resp = self.create()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        data = resp.json()['data']
        self.assertEqual(data['status'], SeasonStatus.DRAFT)
        self.assertEqual(len(data['phases']), 1)
        self.assertEqual(data['phases'][0]['start_date'], '2026-01-01')

    def test_create_with_workout_template_clones_program(self):
        template = WorkoutProgram.objects.create(owner=self.coach, name='Mẫu PPL', is_template=True)
        day = WorkoutDay.objects.create(program=template, day_label='Push')
        WorkoutExercise.objects.create(workout_day=day, exercise_name='Bench')
        phase = self.create(workout_template=template.id).json()['data']['phases'][0]
        self.assertNotEqual(phase['workout_program'], template.id)
        self.assertEqual(phase['workout_program_snapshot']['days'][0]['exercises'][0]['exercise_name'], 'Bench')

    def test_end_before_start_is_validation_error(self):
        body = self.create(end_date='2025-12-01').json()
        self.assertEqual(body['code'], 'validation_error')

    def test_only_one_active_per_client(self):
        first = self.create(client=self.client_a.id, activate=True).json()['data']
        self.assertEqual(first['status'], SeasonStatus.ACTIVE)
        second = self.create(client=self.client_a.id, activate=True).json()['data']
        self.assertEqual(second['status'], SeasonStatus.ACTIVE)
        self.assertEqual(Season.objects.get(pk=first['id']).status, SeasonStatus.COMPLETED)
        # Mùa của chính HLV (không học viên) không bị ảnh hưởng
        own = self.create(activate=True).json()['data']
        self.assertEqual(Season.objects.get(pk=second['id']).status, SeasonStatus.ACTIVE)
        self.assertEqual(own['status'], SeasonStatus.ACTIVE)

    def test_status_machine(self):
        season_id = self.create().json()['data']['id']
        url = f'{URL}{season_id}/change-status/'
        self.assertEqual(self.api.post(url, {'status': 'COMPLETED'}, format='json').json()['code'], 'business_rule')
        self.assertEqual(self.api.post(url, {'status': 'ACTIVE'}, format='json').json()['data']['status'], 'ACTIVE')
        self.assertEqual(self.api.post(url, {'status': 'COMPLETED'}, format='json').json()['data']['status'], 'COMPLETED')
        self.assertEqual(self.api.post(url, {'status': 'ACTIVE'}, format='json').json()['code'], 'business_rule')

    def test_activate_requires_phase(self):
        season = Season.objects.create(owner=self.coach, name='Trống', start_date=date(2026, 1, 1), end_date=date(2026, 2, 1))
        body = self.api.post(f'{URL}{season.id}/change-status/', {'status': 'ACTIVE'}, format='json').json()
        self.assertEqual(body['code'], 'business_rule')

    def test_delete_only_draft_or_abandoned(self):
        season_id = self.create(activate=True).json()['data']['id']
        self.assertEqual(self.api.delete(f'{URL}{season_id}/').json()['code'], 'business_rule')
        draft_id = self.create().json()['data']['id']
        self.assertEqual(self.api.delete(f'{URL}{draft_id}/').status_code, status.HTTP_200_OK)

    def test_active_endpoint(self):
        self.assertEqual(self.api.get(f'{URL}active/').status_code, status.HTTP_404_NOT_FOUND)
        season_id = self.create(client=self.client_a.id, activate=True).json()['data']['id']
        resp = self.api.get(f'{URL}active/', {'client': self.client_a.id})
        self.assertEqual(resp.json()['data']['id'], season_id)

    def test_ownership_isolation(self):
        foreign = Season.objects.create(owner=self.other, name='Khác', start_date=date(2026, 1, 1), end_date=date(2026, 2, 1))
        self.assertEqual(self.api.get(f'{URL}{foreign.id}/').status_code, status.HTTP_404_NOT_FOUND)
        body = self.api.post(PHASE_URL, {
            'season': foreign.id, 'name': 'X', 'start_date': '2026-01-01', 'end_date': '2026-01-10',
        }, format='json').json()
        self.assertEqual(body['code'], 'validation_error')

    def test_phase_dates_within_season_and_no_overlap(self):
        season = self.create().json()['data']
        base = {'season': season['id'], 'name': 'P2'}
        out_of_range = self.api.post(PHASE_URL, {**base, 'start_date': '2025-12-01', 'end_date': '2026-01-10'}, format='json')
        self.assertEqual(out_of_range.json()['code'], 'validation_error')
        overlap = self.api.post(PHASE_URL, {**base, 'start_date': '2026-02-01', 'end_date': '2026-02-10'}, format='json')
        self.assertEqual(overlap.json()['code'], 'validation_error')
        # Thu hẹp Phase 1 rồi thêm Phase 2
        p1 = season['phases'][0]['id']
        self.assertEqual(self.api.patch(f'{PHASE_URL}{p1}/', {'end_date': '2026-01-31'}, format='json').status_code, 200)
        ok = self.api.post(PHASE_URL, {**base, 'start_date': '2026-02-01', 'end_date': '2026-03-31'}, format='json')
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED, ok.content)
        listing = self.api.get(PHASE_URL, {'season': season['id']}).json()['data']
        self.assertEqual(listing['count'], 2)

    def test_assign_template_shifts_dates(self):
        template = Season.objects.create(
            owner=self.coach, name='Mẫu 12 tuần', is_template=True, start_date=date(2026, 1, 1), end_date=date(2026, 3, 31)
        )
        program = WorkoutProgram.objects.create(owner=self.coach, name='GA')
        Phase.objects.create(season=template, name='P1', sort_order=1, start_date=date(2026, 1, 1), end_date=date(2026, 1, 31),
                             workout_program=program, target_calories=Decimal('2000'))
        Phase.objects.create(season=template, name='P2', sort_order=2, start_date=date(2026, 2, 1), end_date=date(2026, 3, 31))
        resp = self.api.post(f'{URL}assign/', {
            'template': template.id, 'client': self.client_a.id, 'start_date': '2026-05-01', 'activate': True,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        data = resp.json()['data']
        self.assertEqual(data['status'], 'ACTIVE')
        self.assertEqual(data['source_season'], template.id)
        self.assertEqual(data['end_date'], '2026-07-29')
        self.assertEqual([p['start_date'] for p in data['phases']], ['2026-05-01', '2026-06-01'])
        self.assertNotEqual(data['phases'][0]['workout_program'], program.id)

    def test_nutrition_plan_save_and_generate(self):
        phase_id = self.create().json()['data']['phases'][0]['id']
        url = f'{PHASE_URL}{phase_id}/nutrition-plan/'
        self.assertIsNone(self.api.get(url).json()['data'])
        grains = FoodCategory.objects.create(category_code='GRAINS', category_name='Lương thực')
        meats = FoodCategory.objects.create(category_code='MEATS', category_name='Thịt')
        FoodItem.objects.create(category=grains, name='Cơm trắng', calories=130, protein=3, carbs=28, fat=0)
        FoodItem.objects.create(category=meats, name='Ức gà', calories=165, protein=31, carbs=0, fat=4)

        resp = self.api.put(url, {'notes': 'Ghi chú', 'meals': [{
            'name': 'Bữa 1', 'target_calories': 500, 'target_protein': 40, 'target_carbs': 50, 'target_fat': 10,
            'items': [{'food_category': grains.id, 'target_calories': 200, 'target_protein': 4, 'target_carbs': 45,
                       'target_fat': 0, 'primary_food_text': '160g Cơm trắng'}],
        }]}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        self.assertEqual(resp.json()['data']['meals'][0]['items'][0]['food_category_code'], 'GRAINS')

        gen = f'{url}generate/'
        self.assertEqual(self.api.post(gen, {}, format='json').json()['code'], 'business_rule')  # chưa có macro
        Phase.objects.filter(pk=phase_id).update(target_calories=2000, target_protein=160, target_carbs=200, target_fat=60)
        data = self.api.post(gen, {'meal_count': 4}, format='json').json()['data']
        self.assertEqual(len(data['meals']), 4)
        texts = [i['primary_food_text'] for i in data['meals'][0]['items']]
        self.assertIn('130g Ức gà', texts)  # 40g đạm / 31g mỗi 100g -> 129 -> làm tròn 130

    def test_phase_daily_logs_read_only(self):
        from apps.daily_logs.models import DailyLog
        phase_id = self.create().json()['data']['phases'][0]['id']
        DailyLog.objects.create(owner=self.coach, phase_id=phase_id, log_date=date(2026, 1, 2), weight=Decimal('70.5'))
        data = self.api.get(f'{PHASE_URL}{phase_id}/daily-logs/').json()['data']
        self.assertEqual(len(data), 1)

    def test_read_only_user_cannot_edit_phase(self):
        season_id = self.create().json()['data']['id']
        viewer = make_user('viewer_s', ['SEASON_READ'])
        Season.objects.filter(pk=season_id).update(owner=viewer)
        self.api.force_authenticate(viewer)
        self.assertEqual(self.api.get(f'{URL}{season_id}/').status_code, status.HTTP_200_OK)
        resp = self.api.post(PHASE_URL, {
            'season': season_id, 'name': 'X', 'start_date': '2026-01-01', 'end_date': '2026-01-02',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
