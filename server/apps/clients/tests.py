"""Test API học viên (quyền sở hữu theo HLV, liên kết tài khoản) + hồ sơ thể chất của tôi."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.core.permissions import invalidate_user_permissions

from .models import Client, FitnessProfile

User = get_user_model()
URL = '/api/v1/clients/'
PROFILE_URL = '/api/v1/fitness-profile/me/'
COACH_PERMS = ('CLIENT_READ', 'CLIENT_CREATE', 'CLIENT_UPDATE', 'CLIENT_DELETE')


def make_user_with_perms(username, *codes):
    role, _ = Role.objects.get_or_create(role_code=f'ROLE_{username.upper()}', defaults={'role_name': username})
    for code in codes:
        perm, _ = Permission.objects.get_or_create(
            permission_code=code, defaults={'permission_name': code, 'module': code.rsplit('_', 1)[0]}
        )
        RolePermission.objects.create(role=role, permission=perm)
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='Password123!',
                                    full_name=username)
    user.roles.add(role)
    return user


class ClientApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.client = APIClient()
        self.coach_a = make_user_with_perms('coach_a', *COACH_PERMS)
        self.coach_b = make_user_with_perms('coach_b', *COACH_PERMS)
        self.client.force_authenticate(self.coach_a)

    def test_create_assigns_current_coach_and_ignores_coach_field(self):
        resp = self.client.post(URL, {
            'full_name': 'Nguyễn Văn A', 'phone': '0900000000', 'fitness_goal': 'CUTTING',
            'current_weight': '72.5', 'coach': self.coach_b.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()['data']
        self.assertEqual(data['coach'], self.coach_a.id)
        self.assertEqual(data['coach_name'], 'coach_a')
        self.assertEqual(data['status'], 'ACTIVE')

    def test_coach_cannot_see_other_coach_client(self):
        other = Client.objects.create(coach=self.coach_b, full_name='Của B')
        Client.objects.create(coach=self.coach_a, full_name='Của A')
        listing = self.client.get(URL).json()['data']
        self.assertEqual([r['full_name'] for r in listing['results']], ['Của A'])
        self.assertEqual(self.client.get(f'{URL}{other.id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.patch(f'{URL}{other.id}/', {'full_name': 'X'}, format='json').status_code, 404)

    def test_admin_sees_all_and_can_reassign_coach(self):
        admin = User.objects.create_superuser(username='admin_cl', email='a_cl@example.com', password='Password123!')
        item = Client.objects.create(coach=self.coach_a, full_name='Học viên')
        Client.objects.create(coach=self.coach_b, full_name='Học viên B')
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.get(URL).json()['data']['count'], 2)
        resp = self.client.patch(f'{URL}{item.id}/', {'coach': self.coach_b.id}, format='json')
        self.assertEqual(resp.json()['data']['coach'], self.coach_b.id)

    def test_activity_level_out_of_range(self):
        body = self.client.post(URL, {'full_name': 'A', 'activity_level': '2.5'}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('activity_level', body['errors'])

    def test_link_and_unlink_account(self):
        item = Client.objects.create(coach=self.coach_a, full_name='Học viên')
        member = User.objects.create_user(username='member1', email='m1@example.com', password='Password123!')
        resp = self.client.post(f'{URL}{item.id}/link-account/', {'user_id': member.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()['data']['user'], member.id)

        second = Client.objects.create(coach=self.coach_a, full_name='Học viên 2')
        body = self.client.post(f'{URL}{second.id}/link-account/', {'user_id': member.id}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')

        resp = self.client.delete(f'{URL}{item.id}/link-account/')
        self.assertIsNone(resp.json()['data']['user'])

    def test_soft_delete(self):
        item = Client.objects.create(coach=self.coach_a, full_name='Xóa')
        self.assertEqual(self.client.delete(f'{URL}{item.id}/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(f'{URL}{item.id}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_requires_module_permission(self):
        viewer = make_user_with_perms('viewer_cl', 'CLIENT_READ')
        self.client.force_authenticate(viewer)
        self.assertEqual(self.client.get(URL).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(URL, {'full_name': 'X'}, format='json').status_code, 403)


class MyFitnessProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='member_fp', email='fp@example.com', password='Password123!')
        self.client.force_authenticate(self.user)

    def test_get_creates_profile_and_put_updates(self):
        body = self.client.get(PROFILE_URL).json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['fitness_goal'], 'MAINTAINING')
        self.assertEqual(FitnessProfile.objects.filter(user=self.user).count(), 1)

        resp = self.client.put(PROFILE_URL, {
            'gender': 'MALE', 'height_cm': '175', 'current_weight': '70', 'activity_level': '1.55',
            'fitness_goal': 'BULKING',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()['data']['fitness_goal'], 'BULKING')
        self.assertEqual(FitnessProfile.objects.count(), 1)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.get(PROFILE_URL).status_code, (401, 403))
