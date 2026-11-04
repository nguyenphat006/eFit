import pghistory
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditModel


class Gender(models.TextChoices):
    MALE = 'MALE', _('Nam')
    FEMALE = 'FEMALE', _('Nữ')
    OTHER = 'OTHER', _('Khác')


class FitnessGoal(models.TextChoices):
    BULKING = 'BULKING', _('Tăng cơ')
    CUTTING = 'CUTTING', _('Giảm mỡ')
    MAINTAINING = 'MAINTAINING', _('Duy trì')
    RECOMP = 'RECOMP', _('Tái cấu trúc cơ thể')


class ClientStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Đang theo')
    INACTIVE = 'INACTIVE', _('Tạm ngưng')
    ARCHIVED = 'ARCHIVED', _('Lưu trữ')


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class Client(AuditModel):
    """
    Học viên do HLV quản lý (bảng Clients theo DBML) — tách khỏi Users (tài khoản đăng nhập).
    HLV chỉ thấy học viên của mình (coach); ADMIN thấy tất cả.
    """
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='coached_clients', verbose_name=_("HLV phụ trách")
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='client_profile', verbose_name=_("Tài khoản liên kết")
    )
    full_name = models.CharField(max_length=255, verbose_name=_("Họ và tên"))
    phone = models.CharField(max_length=30, null=True, blank=True, verbose_name=_("Số điện thoại"))
    email = models.EmailField(max_length=255, null=True, blank=True, verbose_name=_("Email liên hệ"))
    gender = models.CharField(max_length=10, choices=Gender.choices, null=True, blank=True, verbose_name=_("Giới tính"))
    date_of_birth = models.DateField(null=True, blank=True, verbose_name=_("Ngày sinh"))
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Chiều cao (cm)"))
    current_weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Cân nặng (kg)"))
    body_fat_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name=_("Tỷ lệ mỡ (%)"))
    chest_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng ngực (cm)"))
    waist_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng eo (cm)"))
    hips_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng mông (cm)"))
    arm_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng tay (cm)"))
    leg_measure = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Vòng đùi (cm)"))
    fitness_goal = models.CharField(
        max_length=20, choices=FitnessGoal.choices, default=FitnessGoal.MAINTAINING, verbose_name=_("Mục tiêu")
    )
    activity_level = models.DecimalField(
        max_digits=4, decimal_places=3, null=True, blank=True, default=1.2, verbose_name=_("Hệ số vận động")
    )
    training_frequency = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Số buổi tập / tuần"))
    notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú của HLV"))
    status = models.CharField(
        max_length=20, choices=ClientStatus.choices, default=ClientStatus.ACTIVE, verbose_name=_("Tình trạng")
    )

    class Meta:
        db_table = "Clients"
        verbose_name = _("học viên")
        verbose_name_plural = _("Danh sách học viên")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['coach']),
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.full_name


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class FitnessProfile(AuditModel):
    """Hồ sơ thể chất của chính người dùng (bảng FitnessProfiles, 1-1 với Users) — dùng cho tự theo dõi + tính TDEE."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fitness_profile', verbose_name=_("Người dùng")
    )
    gender = models.CharField(max_length=10, choices=Gender.choices, null=True, blank=True, verbose_name=_("Giới tính"))
    date_of_birth = models.DateField(null=True, blank=True, verbose_name=_("Ngày sinh"))
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Chiều cao (cm)"))
    current_weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name=_("Cân nặng (kg)"))
    body_fat_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name=_("Tỷ lệ mỡ (%)"))
    activity_level = models.DecimalField(
        max_digits=4, decimal_places=3, null=True, blank=True, default=1.2, verbose_name=_("Hệ số vận động")
    )
    fitness_goal = models.CharField(
        max_length=20, choices=FitnessGoal.choices, default=FitnessGoal.MAINTAINING, verbose_name=_("Mục tiêu")
    )
    training_frequency = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Số buổi tập / tuần"))

    class Meta:
        db_table = "FitnessProfiles"
        verbose_name = _("hồ sơ thể chất")
        verbose_name_plural = _("Hồ sơ thể chất")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
        ]

    def __str__(self):
        return f"FitnessProfile<{self.user_id}>"
