import pghistory
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditModel


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class WorkoutProgram(AuditModel):
    """
    Giáo án tập (bảng WorkoutPrograms theo DBML). Ghi cả cây days -> exercises trong 1 transaction.
    IsTemplate = mẫu dùng lại; clone sang học viên lưu SourceProgramId.
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='workout_programs', verbose_name=_("Người sở hữu")
    )
    client = models.ForeignKey(
        'clients.Client', on_delete=models.PROTECT, null=True, blank=True,
        related_name='workout_programs', verbose_name=_("Học viên")
    )
    name = models.CharField(max_length=255, verbose_name=_("Tên giáo án"))
    frequency_per_week = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(7)], verbose_name=_("Số buổi / tuần")
    )
    start_date = models.DateField(null=True, blank=True, verbose_name=_("Ngày bắt đầu"))
    end_date = models.DateField(null=True, blank=True, verbose_name=_("Ngày kết thúc"))
    notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú"))
    is_template = models.BooleanField(default=False, verbose_name=_("Là giáo án mẫu"))
    source_program = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='clones', verbose_name=_("Giáo án gốc")
    )

    class Meta:
        db_table = "WorkoutPrograms"
        verbose_name = _("giáo án tập")
        verbose_name_plural = _("Danh sách giáo án tập")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['owner']),
            models.Index(fields=['is_template']),
        ]

    def __str__(self):
        return self.name


class WorkoutDay(models.Model):
    """Buổi tập trong giáo án (bảng WorkoutDays) — nhật ký nằm ở giáo án cha."""
    program = models.ForeignKey(WorkoutProgram, on_delete=models.CASCADE, related_name='days', verbose_name=_("Giáo án"))
    day_label = models.CharField(max_length=100, verbose_name=_("Tên buổi tập"))
    day_of_week = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MaxValueValidator(6)], verbose_name=_("Thứ trong tuần")
    )
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "WorkoutDays"
        verbose_name = _("buổi tập")
        verbose_name_plural = _("Buổi tập")
        ordering = ['sort_order', 'id']
        indexes = [models.Index(fields=['program', 'sort_order'])]

    def __str__(self):
        return self.day_label


class WorkoutExercise(models.Model):
    """Bài tập trong buổi tập (bảng WorkoutExercises) — ExerciseName là snapshot tên bài tập."""
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='exercises', verbose_name=_("Buổi tập"))
    exercise = models.ForeignKey(
        'exercises.Exercise', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='workout_usages', verbose_name=_("Bài tập")
    )
    exercise_name = models.CharField(max_length=255, verbose_name=_("Tên bài tập"))
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))
    sets = models.PositiveSmallIntegerField(default=3, validators=[MinValueValidator(1)], verbose_name=_("Số hiệp"))
    reps = models.CharField(max_length=20, default='8-10', verbose_name=_("Số lần"))
    target_rpe = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(5), MaxValueValidator(10)], verbose_name=_("RPE mục tiêu")
    )
    tempo = models.CharField(max_length=20, null=True, blank=True, verbose_name=_("Nhịp độ"))
    rest_seconds = models.PositiveIntegerField(null=True, blank=True, default=120, verbose_name=_("Nghỉ (giây)"))
    notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "WorkoutExercises"
        verbose_name = _("bài tập trong buổi")
        verbose_name_plural = _("Bài tập trong buổi")
        ordering = ['sort_order', 'id']
        indexes = [models.Index(fields=['workout_day', 'sort_order'])]

    def __str__(self):
        return self.exercise_name
