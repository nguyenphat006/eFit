"""Test Trợ lý AI: quyền, chế độ offline khi thiếu khóa, gọi AI (mock), lỗi nhà cung cấp."""
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.core.permissions import invalidate_user_permissions

from .services import gemini, nutrition

User = get_user_model()
BASE = '/api/v1/ai-coach/'


def make_user(username, *codes):
    user = User.objects.create_user(username=username, email=f'{username}@x.vn', password='Password123!')
    if codes:
        role = Role.objects.create(role_code=f'R_{username}'.upper(), role_name=username)
        for code in codes:
            perm, _ = Permission.objects.get_or_create(permission_code=code, defaults={'permission_name': code, 'module': 'AI_COACH'})
            RolePermission.objects.create(role=role, permission=perm)
        user.roles.add(role)
    return user


@override_settings(GEMINI_API_KEY=None)
class AiCoachOfflineTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.api = APIClient()
        self.api.force_authenticate(make_user('member', 'AI_COACH_READ'))

    def test_requires_permission(self):
        self.api.force_authenticate(make_user('nobody'))
        self.assertEqual(self.api.get(f'{BASE}status/').status_code, status.HTTP_403_FORBIDDEN)

    def test_status_not_configured(self):
        data = self.api.get(f'{BASE}status/').json()['data']
        self.assertFalse(data['configured'])

    def test_ask_without_key_is_business_rule(self):
        body = self.api.post(f'{BASE}ask/', {'question': 'Nên ăn gì trước tập?'}, format='json').json()
        self.assertEqual(body['code'], 'business_rule')

    def test_ask_validation(self):
        body = self.api.post(f'{BASE}ask/', {}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('question', body['errors'])

    def test_suggest_nutrition_offline(self):
        resp = self.api.post(f'{BASE}suggest-nutrition/', {
            'goal': 'CUTTING', 'gender': 'MALE', 'age': 30, 'height': 175, 'current_weight': 80, 'activity_level': 1.5,
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['source'], 'offline')
        self.assertEqual(data['protein'], int(80 * 2.2))
        self.assertEqual(data['calories'], data['protein'] * 4 + data['carbs'] * 4 + data['fat'] * 9)

    def test_meal_plan_offline_totals_match(self):
        resp = self.api.post(f'{BASE}meal-plan/', {
            'target_calories': 2200, 'target_protein': 160, 'target_carbs': 230, 'target_fat': 70,
        }, format='json')
        data = resp.json()['data']
        self.assertEqual(data['source'], 'offline')
        self.assertEqual(len(data['meals']), 3)
        self.assertEqual(sum(m['target_protein'] for m in data['meals']), 160)
        self.assertEqual(sum(m['target_carbs'] for m in data['meals']), 230)
        for meal in data['meals']:
            self.assertEqual(sum(i['target_fat'] for i in meal['items']), meal['target_fat'])


@override_settings(GEMINI_API_KEY='test-key')
class AiCoachProviderTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.api = APIClient()
        self.api.force_authenticate(make_user('coach', 'AI_COACH_READ'))

    @mock.patch.object(gemini, 'generate_text', return_value='Ăn chuối và yến mạch.')
    def test_ask_uses_provider(self, mocked):
        body = self.api.post(f'{BASE}ask/', {
            'question': 'Trước tập ăn gì?', 'history': [{'role': 'user', 'content': 'Chào'}],
        }, format='json').json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['answer'], 'Ăn chuối và yến mạch.')
        self.assertIn('Trước tập ăn gì?', mocked.call_args.args[0])

    @mock.patch.object(gemini, 'generate_text', side_effect=gemini.AIProviderError('quota'))
    def test_provider_error_is_business_rule(self, _mocked):
        body = self.api.post(f'{BASE}ask/', {'question': 'Hi'}, format='json').json()
        self.assertEqual(body['code'], 'business_rule')

    @mock.patch.object(gemini, 'generate_json', return_value={'calories': 2500, 'protein': 180, 'carbs': 280, 'fat': 70, 'explanation': 'OK'})
    def test_suggest_nutrition_ai(self, _mocked):
        data = self.api.post(f'{BASE}suggest-nutrition/', {'goal': 'BULKING'}, format='json').json()['data']
        self.assertEqual(data['source'], 'ai')
        self.assertEqual(data['calories'], 2500)

    @mock.patch.object(gemini, 'generate_json', side_effect=gemini.AIProviderError('down'))
    def test_suggest_falls_back_when_provider_fails(self, _mocked):
        data = self.api.post(f'{BASE}suggest-nutrition/', {'goal': 'MAINTAINING'}, format='json').json()['data']
        self.assertEqual(data['source'], 'offline')


class OfflineCalculationTests(SimpleTestCase):
    def test_high_body_fat_bulking_becomes_recomp(self):
        profile = {'gender': 'MALE', 'age': 30, 'height': 175, 'current_weight': 90, 'body_fat_percentage': 25, 'activity_level': 1.2}
        result = nutrition._offline_suggestion(profile, 'BULKING')
        self.assertIn('Recomposition', result['explanation'])

    def test_minimum_calories_and_macros(self):
        # Sàn 1200 kcal, đạm >= 60 g; calo cuối = tổng macro (làm tròn xuống từng macro -> sai số < 13 kcal)
        profile = {'gender': 'FEMALE', 'age': 60, 'height': 140, 'current_weight': 35, 'activity_level': 1.2}
        result = nutrition._offline_suggestion(profile, 'CUTTING')
        self.assertGreater(result['calories'], 1200 - 13)
        self.assertGreaterEqual(result['protein'], 60)
        self.assertEqual(result['calories'], result['protein'] * 4 + result['carbs'] * 4 + result['fat'] * 9)
