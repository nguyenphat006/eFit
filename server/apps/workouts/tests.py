"""Test API giáo án tập: CRUD theo envelope, ghi cả cây, quyền sở hữu, clone, chặn xóa khi đang dùng."""
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import Permission, Role, RolePermission
from apps.clients.models import Client
from apps.core.permissions import invalidate_user_permissions
from apps.exercises.models import Exercise

from .models import WorkoutDay, WorkoutExercise, WorkoutProgram
from .services.program_service import snapshot_program

User = get_user_model()
URL = '/api/v1/workout-programs/'


def make_user(username, codes):
    role = Role.objects.create(role_code=f'R_{username.upper()}', role_name=username)
    for code in codes:
        perm, _ = Permission.objects.get_or_create(
            permission_code=code, defaults={'permission_name': code, 'module': code.rsplit('_', 1)[0]}
        )
        RolePermission.objects.create(role=role, permission=perm)
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password='Password123!', full_name=username)
    user.roles.add(role)
    return user


FULL = [f'WORKOUT_PROGRAM_{a}' for a in ('VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE')]


class WorkoutProgramApiTests(TestCase):
    def setUp(self):
        invalidate_user_permissions()
        self.api = APIClient()
        self.coach = make_user('coach_w', FULL)
        self.other = make_user('other_w', FULL)
        self.api.force_authenticate(self.coach)
        self.squat = Exercise.objects.create(name='Back Squat')
        self.my_client = Client.objects.create(coach=self.coach, full_name='Học viên A')
        self.foreign_client = Client.objects.create(coach=self.other, full_name='Học viên B')

    def payload(self, **extra):
        data = {
            'name': 'PPL Hypertrophy',
            'days': [
                {'day_label': 'Push', 'day_of_week': 0, 'exercises': [
                    {'exercise_name': 'Bench Press', 'sets': 4, 'reps': '6-8', 'target_rpe': '8.0'},
                ]},
                {'day_label': 'Legs', 'exercises': [{'exercise': self.squat.id, 'sets': 5}]},
            ],
        }
        data.update(extra)
        return data

    def test_create_with_nested_tree(self):
        resp = self.api.post(URL, self.payload(), format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        body = resp.json()
        self.assertTrue(body['success'])
        data = body['data']
        self.assertEqual(data['owner'], self.coach.id)
        self.assertEqual(data['frequency_per_week'], 2)
        self.assertEqual(len(data['days']), 2)
        self.assertEqual(data['days'][1]['exercises'][0]['exercise_name'], 'Back Squat')

    def test_update_replaces_children(self):
        program_id = self.api.post(URL, self.payload(), format='json').json()['data']['id']
        resp = self.api.patch(f'{URL}{program_id}/', {'days': [{'day_label': 'Full body', 'exercises': []}]}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual([d['day_label'] for d in resp.json()['data']['days']], ['Full body'])
        self.assertEqual(WorkoutDay.objects.filter(program_id=program_id).count(), 1)
        self.assertEqual(WorkoutExercise.objects.filter(workout_day__program_id=program_id).count(), 0)

    def test_list_is_light_with_day_count(self):
        self.api.post(URL, self.payload(), format='json')
        row = self.api.get(URL).json()['data']['results'][0]
        self.assertEqual(row['day_count'], 2)
        self.assertNotIn('days', row)

    def test_exercise_requires_name_or_reference(self):
        body = self.api.post(URL, self.payload(days=[{'day_label': 'X', 'exercises': [{'sets': 3}]}]), format='json').json()
        self.assertEqual(body['code'], 'validation_error')

    def test_ownership_isolation(self):
        foreign = WorkoutProgram.objects.create(owner=self.other, name='Của người khác')
        self.assertEqual(self.api.get(f'{URL}{foreign.id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.api.get(URL).json()['data']['count'], 0)

    def test_cannot_assign_foreign_client(self):
        body = self.api.post(URL, self.payload(client=self.foreign_client.id), format='json').json()
        self.assertEqual(body['code'], 'validation_error')
        self.assertIn('client', body['errors'])

    def test_clone_to_client(self):
        program_id = self.api.post(URL, self.payload(is_template=True), format='json').json()['data']['id']
        resp = self.api.post(f'{URL}{program_id}/clone/', {'client': self.my_client.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()['data']
        self.assertEqual(data['source_program'], program_id)
        self.assertEqual(data['client'], self.my_client.id)
        self.assertFalse(data['is_template'])
        self.assertEqual(len(data['days']), 2)

    def test_cannot_delete_program_used_by_phase(self):
        from apps.seasons.models import Phase, Season
        program = WorkoutProgram.objects.create(owner=self.coach, name='Đang dùng')
        season = Season.objects.create(owner=self.coach, name='S', start_date=date(2026, 1, 1), end_date=date(2026, 3, 1))
        Phase.objects.create(season=season, name='P1', start_date=date(2026, 1, 1), end_date=date(2026, 2, 1), workout_program=program)
        body = self.api.delete(f'{URL}{program.id}/').json()
        self.assertEqual(body['code'], 'business_rule')

    def test_requires_module_permission(self):
        viewer = make_user('viewer_w', ['WORKOUT_PROGRAM_READ'])
        self.api.force_authenticate(viewer)
        self.assertEqual(self.api.get(URL).status_code, status.HTTP_200_OK)
        self.assertEqual(self.api.post(URL, {'name': 'X'}, format='json').status_code, status.HTTP_403_FORBIDDEN)

    def test_snapshot_program(self):
        program_id = self.api.post(URL, self.payload(), format='json').json()['data']['id']
        snap = snapshot_program(WorkoutProgram.objects.get(pk=program_id))
        self.assertEqual(snap['name'], 'PPL Hypertrophy')
        self.assertEqual(snap['days'][0]['exercises'][0]['target_rpe'], 8.0)
