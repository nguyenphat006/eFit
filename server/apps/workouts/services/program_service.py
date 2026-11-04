"""
Nghiệp vụ giáo án tập: ghi cả cây buổi tập -> bài tập, clone giáo án, chụp snapshot cho Phase.
Mọi hàm ghi phải được gọi bên trong `transaction.atomic()` (ViewSet đã bọc sẵn) hoặc tự bọc.
"""
from django.db import transaction
from django.utils.translation import gettext as _
from rest_framework.exceptions import ValidationError

from apps.core.ownership import is_data_admin

from ..models import WorkoutDay, WorkoutExercise, WorkoutProgram

EXERCISE_FIELDS = ('exercise_name', 'sort_order', 'sets', 'reps', 'target_rpe', 'tempo', 'rest_seconds', 'notes')


def validate_client_for_user(client, user):
    """Học viên phải thuộc HLV đang thao tác (ADMIN được chọn mọi học viên)."""
    if client is None or is_data_admin(user):
        return client
    if client.coach_id != user.id:
        raise ValidationError({'client': [_("Học viên không tồn tại hoặc không thuộc quyền quản lý của bạn.")]})
    return client


def write_program_tree(program: WorkoutProgram, days_data: list):
    """Thay toàn bộ buổi tập + bài tập của giáo án bằng `days_data` (dữ liệu đã validate)."""
    program.days.all().delete()
    exercises = []
    for day_index, day in enumerate(days_data):
        day_obj = WorkoutDay.objects.create(
            program=program,
            day_label=day['day_label'],
            day_of_week=day.get('day_of_week'),
            sort_order=day.get('sort_order', day_index),
        )
        for ex_index, ex in enumerate(day.get('exercises') or []):
            exercise = ex.get('exercise')
            exercises.append(WorkoutExercise(
                workout_day=day_obj,
                exercise=exercise,
                exercise_name=ex.get('exercise_name') or (exercise.name if exercise else ''),
                sort_order=ex.get('sort_order', ex_index),
                sets=ex.get('sets', 3),
                reps=ex.get('reps', '8-10'),
                target_rpe=ex.get('target_rpe'),
                tempo=ex.get('tempo'),
                rest_seconds=ex.get('rest_seconds', 120),
                notes=ex.get('notes'),
            ))
    WorkoutExercise.objects.bulk_create(exercises)


def clone_program(source: WorkoutProgram, *, owner, user, client=None, name=None, is_template=False) -> WorkoutProgram:
    """Sao chép giáo án (kèm buổi tập + bài tập); lưu `source_program` để truy vết."""
    with transaction.atomic():
        clone = WorkoutProgram.objects.create(
            owner=owner,
            client=client,
            name=name or source.name,
            frequency_per_week=source.frequency_per_week,
            start_date=source.start_date,
            end_date=source.end_date,
            notes=source.notes,
            description=source.description,
            is_template=is_template,
            source_program=source,
            created_by=user,
            updated_by=user,
        )
        exercises = []
        for day in source.days.prefetch_related('exercises').all():
            day_clone = WorkoutDay.objects.create(
                program=clone, day_label=day.day_label, day_of_week=day.day_of_week, sort_order=day.sort_order,
            )
            for ex in day.exercises.all():
                exercises.append(WorkoutExercise(
                    workout_day=day_clone, exercise_id=ex.exercise_id,
                    **{f: getattr(ex, f) for f in EXERCISE_FIELDS},
                ))
        WorkoutExercise.objects.bulk_create(exercises)
    return clone


def _num(value):
    return float(value) if value is not None else None


def snapshot_program(program: WorkoutProgram) -> dict:
    """Ảnh chụp JSON của giáo án (dùng cho Phase.workout_program_snapshot)."""
    days = []
    for day in program.days.prefetch_related('exercises').all():
        days.append({
            'id': day.id,
            'day_label': day.day_label,
            'day_of_week': day.day_of_week,
            'sort_order': day.sort_order,
            'exercises': [
                {
                    'id': ex.id,
                    'exercise_id': ex.exercise_id,
                    'exercise_name': ex.exercise_name,
                    'sort_order': ex.sort_order,
                    'sets': ex.sets,
                    'reps': ex.reps,
                    'target_rpe': _num(ex.target_rpe),
                    'tempo': ex.tempo,
                    'rest_seconds': ex.rest_seconds,
                    'notes': ex.notes,
                }
                for ex in day.exercises.all()
            ],
        })
    return {
        'id': program.id,
        'name': program.name,
        'frequency_per_week': program.frequency_per_week,
        'notes': program.notes,
        'days': days,
    }
