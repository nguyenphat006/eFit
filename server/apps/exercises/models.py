import pghistory
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditModel


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class Exercise(AuditModel):
    """Thư viện bài tập dùng chung toàn hệ thống (bảng Exercises theo DBML)."""
    name = models.CharField(max_length=255, verbose_name=_("Tên bài tập"))
    category = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Phân loại"))
    body_part = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Vùng cơ thể"))
    equipment = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Dụng cụ"))
    target = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Cơ mục tiêu"))
    muscle_group = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Nhóm cơ"))
    secondary_muscles = models.JSONField(null=True, blank=True, verbose_name=_("Cơ phụ"))
    instructions = models.JSONField(null=True, blank=True, verbose_name=_("Hướng dẫn thực hiện"))
    media_id = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Mã media"))
    image_url = models.CharField(max_length=500, null=True, blank=True, verbose_name=_("Ảnh minh họa"))
    video_url = models.CharField(max_length=500, null=True, blank=True, verbose_name=_("Video hướng dẫn"))

    class Meta:
        db_table = "Exercises"
        verbose_name = _("bài tập")
        verbose_name_plural = _("Thư viện bài tập")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['name']),
            models.Index(fields=['body_part']),
            models.Index(fields=['equipment']),
        ]

    def __str__(self):
        return self.name
