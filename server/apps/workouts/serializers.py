from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.clients.models import Client
from apps.core.messages import NAME_REQUIRED
from apps.exercises.models import Exercise

from .models import WorkoutDay, WorkoutExercise, WorkoutProgram
from .services.program_service import validate_client_for_user


# ----------------------------------------------------------------------- đọc
class WorkoutExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutExercise
        fields = [
            'id', 'exercise', 'exercise_name', 'sort_order', 'sets', 'reps',
            'target_rpe', 'tempo', 'rest_seconds', 'notes',
        ]
        read_only_fields = fields


class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = ['id', 'day_label', 'day_of_week', 'sort_order', 'exercises']
        read_only_fields = fields


class WorkoutProgramListSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC cho danh sách — không nhúng buổi tập."""
    owner_name = serializers.CharField(source='owner.full_name', read_only=True, default='')
    client_name = serializers.CharField(source='client.full_name', read_only=True, default=None)
    source_program_name = serializers.CharField(source='source_program.name', read_only=True, default=None)
    day_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = WorkoutProgram
        fields = [
            'id', 'name', 'owner', 'owner_name', 'client', 'client_name', 'frequency_per_week',
            'start_date', 'end_date', 'notes', 'is_template', 'source_program', 'source_program_name',
            'day_count', 'description', 'is_active',
            'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_day_count(self, obj) -> int:
        annotated = getattr(obj, 'day_count', None)
        if annotated is not None:
            return annotated
        return len(obj.days.all())


class WorkoutProgramSerializer(WorkoutProgramListSerializer):
    """Serializer ĐỌC chi tiết — nhúng buổi tập + bài tập (dùng cho chi tiết và mọi response ghi)."""
    days = WorkoutDaySerializer(many=True, read_only=True)

    class Meta(WorkoutProgramListSerializer.Meta):
        fields = WorkoutProgramListSerializer.Meta.fields + ['days']
        read_only_fields = fields


# ----------------------------------------------------------------------- ghi
class WorkoutExerciseInputSerializer(serializers.Serializer):
    exercise = serializers.PrimaryKeyRelatedField(queryset=Exercise.objects.all(), required=False, allow_null=True)
    exercise_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    sort_order = serializers.IntegerField(min_value=0, required=False)
    sets = serializers.IntegerField(min_value=1, max_value=50, required=False, default=3)
    reps = serializers.CharField(max_length=20, required=False, default='8-10')
    target_rpe = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=5, max_value=10, required=False, allow_null=True)
    tempo = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    rest_seconds = serializers.IntegerField(min_value=0, required=False, allow_null=True, default=120)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if not attrs.get('exercise') and not (attrs.get('exercise_name') or '').strip():
            raise serializers.ValidationError({'exercise_name': [_("Chọn bài tập hoặc nhập tên bài tập.")]})
        return attrs


class WorkoutDayInputSerializer(serializers.Serializer):
    day_label = serializers.CharField(max_length=100)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6, required=False, allow_null=True)
    sort_order = serializers.IntegerField(min_value=0, required=False)
    exercises = WorkoutExerciseInputSerializer(many=True, required=False)


class WorkoutProgramCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer GHI — `days` (tùy chọn) thay toàn bộ cây buổi tập -> bài tập trong cùng transaction.
    Gửi `days` thì `frequency_per_week` tự tính = số buổi (tối đa 7) nếu không gửi kèm.
    """
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    days = WorkoutDayInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = WorkoutProgram
        fields = [
            'id', 'name', 'client', 'frequency_per_week', 'start_date', 'end_date', 'notes',
            'is_template', 'description', 'is_active', 'days',
        ]
        read_only_fields = ['id']

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_client(self, value):
        return validate_client_for_user(value, self.context['request'].user)

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': [_("Ngày kết thúc phải sau ngày bắt đầu.")]})
        if 'days' in attrs and 'frequency_per_week' not in attrs:
            attrs['frequency_per_week'] = min(len(attrs['days']), 7)
        return attrs

    def create(self, validated_data):
        from .services.program_service import write_program_tree
        days = validated_data.pop('days', None)
        program = super().create(validated_data)
        if days is not None:
            write_program_tree(program, days)
        return program

    def update(self, instance, validated_data):
        from .services.program_service import write_program_tree
        days = validated_data.pop('days', None)
        program = super().update(instance, validated_data)
        if days is not None:
            write_program_tree(program, days)
        return program


class WorkoutProgramCloneSerializer(serializers.Serializer):
    """Clone giáo án: sang học viên, sang chính mình, hoặc thành giáo án mẫu."""
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_template = serializers.BooleanField(required=False, default=False)

    def validate_client(self, value):
        return validate_client_for_user(value, self.context['request'].user)
