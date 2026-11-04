"""Test API nhóm thực phẩm / thực phẩm + lệnh seed_nutrition."""
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.core.permissions import invalidate_user_permissions

from .models import FoodCategory, FoodItem

User = get_user_model()
CAT_URL = '/api/v1/food-categories/'
FOOD_URL = '/api/v1/food-items/'


def make_user_with_perms(username, *codes):
    role = Role.objects.create(role_code=f'ROLE_{username.upper()}', role_name=username)
    for code in codes:
        perm, _ = Permission.objects.get_or_create(
            permission_code=code, defaults={'permission_name': code, 'module': code.rsplit('_', 1)[0]}
        )
        RolePermission.objects.create(role=role, permission=perm)
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='Password123!')
    user.roles.add(role)
    return user


FOOD = {'name': 'Cơm', 'calories': '130', 'protein': '2.7', 'carbs': '28', 'fat': '0.3'}


class FoodCategoryApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin_nu', email='a_nu@example.com', password='Password123!')
        self.client.force_authenticate(self.admin)

    def test_create_uppercases_code_and_rejects_duplicate(self):
        resp = self.client.post(CAT_URL, {'category_code': 'grains', 'category_name': 'Tinh bột'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.json()['data']['category_code'], 'GRAINS')
        body = self.client.post(CAT_URL, {'category_code': 'Grains', 'category_name': 'Trùng'}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('category_code', body['errors'])

    def test_cannot_delete_category_with_foods(self):
        cat = FoodCategory.objects.create(category_code='MEATS', category_name='Thịt')
        FoodItem.objects.create(category=cat, **FOOD)
        listing = self.client.get(CAT_URL).json()['data']['results']
        self.assertEqual(listing[0]['food_count'], 1)
        body = self.client.delete(f'{CAT_URL}{cat.id}/').json()
        self.assertEqual(body['code'], 'business_rule')


class FoodItemApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin_fd', email='a_fd@example.com', password='Password123!')
        self.cat = FoodCategory.objects.create(category_code='GRAINS', category_name='Tinh bột')
        self.other = FoodCategory.objects.create(category_code='MEATS', category_name='Thịt')
        self.coach_perms = ('FOOD_ITEM_READ', 'FOOD_ITEM_CREATE', 'FOOD_ITEM_UPDATE', 'FOOD_ITEM_DELETE')

    def test_admin_creates_system_food_and_filters_by_category(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.post(FOOD_URL, {**FOOD, 'category': self.cat.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()['data']
        self.assertTrue(data['is_system_data'])
        self.assertEqual(data['category_code'], 'GRAINS')
        FoodItem.objects.create(category=self.other, **{**FOOD, 'name': 'Ức gà'})
        results = self.client.get(FOOD_URL, {'category__category_code': 'MEATS'}).json()['data']['results']
        self.assertEqual([r['name'] for r in results], ['Ức gà'])

    def test_negative_macro_is_validation_error(self):
        self.client.force_authenticate(self.admin)
        body = self.client.post(FOOD_URL, {**FOOD, 'protein': '-1', 'category': self.cat.id}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('protein', body['errors'])

    def test_non_admin_food_is_user_data_and_system_food_is_protected(self):
        coach = make_user_with_perms('coach_fd', *self.coach_perms)
        self.client.force_authenticate(coach)
        resp = self.client.post(FOOD_URL, {**FOOD, 'category': self.cat.id, 'is_system_data': True}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertFalse(resp.json()['data']['is_system_data'])
        own_id = resp.json()['data']['id']
        self.assertEqual(self.client.patch(f'{FOOD_URL}{own_id}/', {'name': 'Cơm gạo lứt'}, format='json').status_code, 200)

        system = FoodItem.objects.create(category=self.cat, is_system_data=True, **{**FOOD, 'name': 'Bún'})
        self.assertEqual(self.client.patch(f'{FOOD_URL}{system.id}/', {'name': 'X'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'{FOOD_URL}{system.id}/').status_code, 403)

        other = make_user_with_perms('coach_fd2', *self.coach_perms)
        self.client.force_authenticate(other)
        self.assertEqual(self.client.delete(f'{FOOD_URL}{own_id}/').status_code, 403)

    def test_requires_module_permission(self):
        viewer = make_user_with_perms('viewer_fd', 'FOOD_ITEM_READ')
        self.client.force_authenticate(viewer)
        self.assertEqual(self.client.get(FOOD_URL).status_code, status.HTTP_200_OK)
        resp = self.client.post(FOOD_URL, {**FOOD, 'category': self.cat.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class SeedNutritionCommandTests(TestCase):
    def test_seed_is_idempotent(self):
        call_command('seed_nutrition', stdout=StringIO())
        cats, foods = FoodCategory.objects.count(), FoodItem.objects.count()
        self.assertEqual(cats, 8)
        self.assertGreater(foods, 10)
        call_command('seed_nutrition', stdout=StringIO())
        self.assertEqual(FoodCategory.objects.count(), cats)
        self.assertEqual(FoodItem.objects.count(), foods)
        self.assertTrue(FoodItem.objects.filter(category__category_code='RECIPE', base_unit='1 tô').exists())
