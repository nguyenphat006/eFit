"""Test trang Tổng quan: số liệu gộp, khối lọc theo quyền, dữ liệu lọc theo quyền sở hữu."""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.clients.models import Client
from apps.core.permissions import invalidate_user_permissions
from apps.daily_logs.models import DailyLog
from apps.seasons.models import Phase, Season

User = get_user_model()
URL = '/api/v1/dashboard/overview/'


@override_settings(DEBUG=True)
class DashboardOverviewTests(TestCase):
    def setUp(self):
        cache.clear()
        invalidate_user_permissions()
        self.admin = User.objects.create_superuser(username='root', email='root@x.vn', password='Password123!')
        self.client = APIClient()
        self.today = timezone.localdate()

    def _user_with(self, *codes):
        role = Role.objects.create(role_code='R_' + '_'.join(codes)[:40], role_name='Thử')
        for code in codes:
            perm, _ = Permission.objects.get_or_create(permission_code=code, defaults={'permission_name': code, 'module': code.rsplit('_', 1)[0]})
            RolePermission.objects.create(role=role, permission=perm)
        user = User.objects.create_user(username='u_' + role.role_code.lower(), email=f'{role.role_code}@x.vn', password='Password123!')
        user.roles.add(role)
        return user

    def test_requires_login(self):
        self.assertEqual(self.client.get(URL).status_code, 401)

    def test_admin_gets_all_blocks(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.get(URL)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual({k['key'] for k in data['kpis']}, {'clients', 'seasons', 'workouts', 'compliance', 'users'})
        self.assertEqual(len(data['activity']), 14)
        self.assertEqual(len(data['compliance_trend']), 14)
        self.assertFalse(data['today']['has_log'])
        self.assertIsInstance(data['weight_trend'], list)
        self.assertIsInstance(data['active_seasons'], list)
        self.assertIsInstance(data['recent_activity'], list)

    def test_blocks_filtered_by_permission(self):
        user = self._user_with('USER_READ')
        self.client.force_authenticate(user)
        data = self.client.get(URL).json()['data']
        self.assertEqual({k['key'] for k in data['kpis']}, {'users'})
        for block in ('today', 'weight_trend', 'compliance_trend', 'active_seasons', 'activity', 'recent_activity'):
            self.assertIsNone(data[block], block)

    def test_coach_only_sees_own_data(self):
        coach = self._user_with('CLIENT_READ', 'SEASON_READ', 'DAILY_LOG_READ')
        other = User.objects.create_user(username='other', email='o@x.vn', password='Password123!')
        Client.objects.create(coach=coach, full_name='HV của tôi')
        Client.objects.create(coach=other, full_name='HV người khác')
        season = Season.objects.create(
            owner=coach, name='Mùa hè', status='ACTIVE',
            start_date=self.today - timedelta(days=10), end_date=self.today + timedelta(days=10),
        )
        Phase.objects.create(season=season, name='Siết', start_date=self.today - timedelta(days=1), end_date=self.today + timedelta(days=1))
        Season.objects.create(owner=other, name='Khác', status='ACTIVE', start_date=self.today, end_date=self.today)
        DailyLog.objects.create(owner=coach, log_date=self.today, weight=70, is_workout_completed=True, compliance_score=80)
        DailyLog.objects.create(owner=other, log_date=self.today, is_workout_completed=True, compliance_score=10)

        self.client.force_authenticate(coach)
        data = self.client.get(URL).json()['data']
        kpis = {k['key']: k for k in data['kpis']}
        self.assertEqual(kpis['clients']['value'], 1)
        self.assertEqual(kpis['seasons']['value'], 1)
        self.assertEqual(kpis['workouts']['value'], 1)
        self.assertEqual(kpis['compliance']['value'], 80.0)
        self.assertTrue(data['today']['has_log'])
        self.assertEqual(data['weight_trend'], [{'date': self.today.isoformat(), 'weight': 70.0}])
        self.assertEqual(len(data['active_seasons']), 1)
        self.assertEqual(data['active_seasons'][0]['current_phase'], 'Siết')
        self.assertEqual(data['active_seasons'][0]['progress'], 50)
