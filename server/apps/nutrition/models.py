import pghistory
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditModel


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class FoodCategory(AuditModel):
    """Nhóm thực phẩm (bảng FoodCategories theo DBML). Sắp theo sort_order trước — có index tương ứng."""
    category_code = models.CharField(max_length=50, unique=True, verbose_name=_("Mã nhóm"))
    category_name = models.CharField(max_length=255, verbose_name=_("Tên nhóm"))
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))

    class Meta:
        db_table = "FoodCategories"
        verbose_name = _("nhóm thực phẩm")
        verbose_name_plural = _("Nhóm thực phẩm")
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['sort_order', 'id']),
            models.Index(fields=['-updated_at', 'id']),
        ]

    def save(self, *args, **kwargs):
        if self.category_code:
            self.category_code = self.category_code.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category_name} ({self.category_code})"


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class FoodItem(AuditModel):
    """Thực phẩm (bảng FoodItems) — macro tính trên base_unit (100g / 100ml / 1 phần)."""
    category = models.ForeignKey(FoodCategory, on_delete=models.PROTECT, related_name='foods', verbose_name=_("Nhóm thực phẩm"))
    name = models.CharField(max_length=255, verbose_name=_("Tên thực phẩm"))
    calories = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Năng lượng (kcal)"))
    protein = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Đạm (g)"))
    carbs = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Tinh bột (g)"))
    fat = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Chất béo (g)"))
    fiber = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, default=0, verbose_name=_("Chất xơ (g)"))
    image_url = models.CharField(max_length=500, null=True, blank=True, verbose_name=_("Ảnh"))
    base_unit = models.CharField(max_length=30, default='100g', verbose_name=_("Đơn vị gốc"))
    default_serving_name = models.CharField(max_length=50, null=True, blank=True, verbose_name=_("Khẩu phần mặc định"))
    default_serving_weight = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Khối lượng khẩu phần (g)")
    )
    is_system_data = models.BooleanField(default=True, verbose_name=_("Dữ liệu hệ thống"))

    class Meta:
        db_table = "FoodItems"
        verbose_name = _("thực phẩm")
        verbose_name_plural = _("Thư viện thực phẩm")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['name']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.name
