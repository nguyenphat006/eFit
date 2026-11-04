import pghistory
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditModel


class CheatStatus(models.TextChoices):
    NONE = 'NONE', _('Không')
    PLANNED = 'PLANNED', _('Có kế hoạch')
    UNPLANNED = 'UNPLANNED', _('Ngoài kế hoạch')


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class DailyLog(AuditModel):
    """
    Nhật ký chỉ số 1 ngày (bảng DailyLogs theo DBML) — UPSERT theo (owner, ngày) khi client trống,
    hoặc (client, ngày) khi có học viên. Mục tiêu macro chụp lại từ Phase lúc tạo log.
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='daily_logs', verbose_name=_("Người ghi")
    )
    client = models.ForeignKey(
        'clients.Client', on_delete=models.PROTECT, null=True, blank=True, related_name='daily_logs', verbose_name=_("Học viên")
    )
    phase = models.ForeignKey(
        'seasons.Phase', on_delete=models.SET_NULL, null=True, blank=True, related_name='daily_logs', verbose_name=_("Giai đoạn")
    )
    log_date = models.DateField(verbose_name=_("Ngày"))

    target_calories_snapshot = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Calo mục tiêu"))
    target_protein_snapshot = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Đạm mục tiêu"))
    target_carbs_snapshot = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Tinh bột mục tiêu"))
    target_fat_snapshot = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Chất béo mục tiêu"))

    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Cân nặng (kg)"))
    calories_in = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Calo nạp"))
    protein_in = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Đạm nạp (g)"))
    carbs_in = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Tinh bột nạp (g)"))
    fat_in = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Chất béo nạp (g)"))
    sleep_hours = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(24)], verbose_name=_("Giờ ngủ")
    )
    work_hours = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(24)], verbose_name=_("Giờ làm việc")
    )
    fatigue_level = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name=_("Mức mệt mỏi")
    )
    is_workout_completed = models.BooleanField(default=False, verbose_name=_("Đã tập"))

    diet_meals_completed = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Số bữa đúng thực đơn"))
    diet_completed_meal_ids = models.JSONField(null=True, blank=True, verbose_name=_("Bữa đã hoàn thành"))
    diet_target_meals = models.PositiveSmallIntegerField(null=True, blank=True, default=4, verbose_name=_("Số bữa mục tiêu"))
    diet_protein_estimated = models.BooleanField(null=True, blank=True, verbose_name=_("Ước lượng đủ đạm"))
    diet_cheat_status = models.CharField(
        max_length=20, choices=CheatStatus.choices, default=CheatStatus.NONE, verbose_name=_("Ăn ngoài thực đơn")
    )
    diet_notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú ăn uống"))

    steps = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Số bước chân"))
    cardio_duration_minutes = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Cardio (phút)"))
    cardio_type = models.CharField(max_length=50, null=True, blank=True, verbose_name=_("Loại cardio"))

    body_images = models.JSONField(null=True, blank=True, verbose_name=_("Ảnh check-in"))

    chest_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng ngực (cm)"))
    waist_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng eo (cm)"))
    hips_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng mông (cm)"))
    arm_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng tay (cm)"))
    leg_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng đùi (cm)"))

    compliance_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name=_("Điểm kỷ luật (%)")
    )
    compliance_notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú kỷ luật"))

    class Meta:
        db_table = "DailyLogs"
        verbose_name = _("nhật ký hằng ngày")
        verbose_name_plural = _("Nhật ký hằng ngày")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['owner', 'log_date']),
            models.Index(fields=['client', 'log_date']),
            models.Index(fields=['phase']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'log_date'], condition=Q(client__isnull=True, deleted_at__isnull=True),
                name='uq_dailylog_owner_date',
            ),
            models.UniqueConstraint(
                fields=['client', 'log_date'], condition=Q(client__isnull=False, deleted_at__isnull=True),
                name='uq_dailylog_client_date',
            ),
        ]

    def __str__(self):
        return f"DailyLog<{self.log_date}>"
