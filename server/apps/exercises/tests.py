"""Test API thư viện bài tập + lệnh import_exercises."""
import json
import tempfile
from io import StringIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.core.permissions import invalidate_user_permissions

from .models import Exercise

User = get_user_model()
URL = '/api/v1/exercises/'


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


class ExerciseApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin_ex', email='a_ex@example.com', password='Password123!')
        self.client.force_authenticate(self.admin)

    def test_create_list_update_delete(self):
        resp = self.client.post(URL, {
            'name': 'Bench press', 'body_part': 'chest', 'equipment': 'barbell', 'target': 'pectorals',
            'secondary_muscles': ['triceps'], 'instructions': {'en': ['Lie down', 'Press']},
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['secondary_muscles'], ['triceps'])
        item_id = body['data']['id']

        listing = self.client.get(URL).json()
        self.assertEqual(listing['data']['count'], 1)

        resp = self.client.patch(f'{URL}{item_id}/', {'name': 'Barbell bench press'}, format='json')
        self.assertEqual(resp.json()['data']['name'], 'Barbell bench press')

        self.assertEqual(self.client.delete(f'{URL}{item_id}/').status_code, status.HTTP_200_OK)
        self.assertTrue(Exercise.all_objects.filter(id=item_id, deleted_at__isnull=False).exists())

    def test_blank_name_is_validation_error(self):
        body = self.client.post(URL, {'name': '   '}, format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('name', body['errors'])

    def test_filters_and_filter_options(self):
        Exercise.objects.create(name='Squat', body_part='upper legs', equipment='barbell', target='quads')
        Exercise.objects.create(name='Push-up', body_part='chest', equipment='body weight', target='pectorals')
        data = self.client.get(URL, {'equipment__in': 'barbell'}).json()['data']
        self.assertEqual([r['name'] for r in data['results']], ['Squat'])

        opts = self.client.get(f'{URL}filter-options/').json()['data']
        self.assertEqual(opts['equipment'], ['barbell', 'body weight'])
        self.assertEqual(opts['body_part'], ['chest', 'upper legs'])

    def test_requires_module_permission(self):
        viewer = make_user_with_perms('viewer_ex', 'EXERCISE_READ')
        self.client.force_authenticate(viewer)
        self.assertEqual(self.client.get(URL).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(f'{URL}filter-options/').status_code, status.HTTP_200_OK)
        resp = self.client.post(URL, {'name': 'Không quyền'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class ImportExercisesCommandTests(TestCase):
    def test_import_is_idempotent(self):
        data = [
            {'name': 'Air bike', 'category': 'waist', 'body_part': 'waist', 'equipment': 'body weight',
             'target': 'abs', 'secondary_muscles': ['obliques'], 'instruction_steps': {'en': ['a', 'b']},
             'media_id': 'M1'},
            {'name': 'Plank', 'body_part': 'waist', 'media_id': None},
        ]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'exercises.json'
            path.write_text(json.dumps(data), encoding='utf-8')
            call_command('import_exercises', file=str(path), stdout=StringIO())
            self.assertEqual(Exercise.objects.count(), 2)
            data[0]['target'] = 'core'
            path.write_text(json.dumps(data), encoding='utf-8')
            call_command('import_exercises', file=str(path), stdout=StringIO())
        self.assertEqual(Exercise.objects.count(), 2)
        air = Exercise.objects.get(media_id='M1')
        self.assertEqual(air.target, 'core')
        self.assertEqual(air.instructions, {'en': ['a', 'b']})
