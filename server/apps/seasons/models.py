import pghistory
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.clients.models import FitnessGoal
from apps.core.models import AuditModel


class SeasonStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Nháp')
    ACTIVE = 'ACTIVE', _('Đang chạy')
    COMPLETED = 'COMPLETED', _('Hoàn thành')
    ABANDONED = 'ABANDONED', _('Bỏ dở')


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class Season(AuditModel):
    """
    Mùa giải — chu kỳ lớn (bảng Seasons theo DBML), VD "Mùa siết cơ Hè 2026".
    Mỗi (owner, client) chỉ có 1 mùa ACTIVE (kiểm tra ở service khi kích hoạt).
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='seasons', verbose_name=_("Người sở hữu")
    )
    client = models.ForeignKey(
        'clients.Client', on_delete=models.PROTECT, null=True, blank=True, related_name='seasons', verbose_name=_("Học viên")
    )
    name = models.CharField(max_length=255, verbose_name=_("Tên mùa giải"))
    goal_type = models.CharField(
        max_length=20, choices=FitnessGoal.choices, default=FitnessGoal.MAINTAINING, verbose_name=_("Mục tiêu")
    )
    start_date = models.DateField(verbose_name=_("Ngày bắt đầu"))
    end_date = models.DateField(verbose_name=_("Ngày kết thúc"))
    status = models.CharField(
        max_length=20, choices=SeasonStatus.choices, default=SeasonStatus.DRAFT, verbose_name=_("Trạng thái")
    )
    is_template = models.BooleanField(default=False, verbose_name=_("Là mùa giải mẫu"))
    source_season = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='clones', verbose_name=_("Mùa giải gốc")
    )

    class Meta:
        db_table = "Seasons"
        verbose_name = _("mùa giải")
        verbose_name_plural = _("Danh sách mùa giải")
        ordering = ['-updated_at', 'id']
        indexes = [
            models.Index(fields=['-updated_at', 'id']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['client']),
            models.Index(fields=['is_template']),
        ]

    def __str__(self):
        return self.name


@pghistory.track(
    pghistory.InsertEvent(),
    pghistory.UpdateEvent(),
    pghistory.DeleteEvent(),
)
class Phase(AuditModel):
    """Giai đoạn trong mùa giải (bảng Phases) — mục tiêu macro + giáo án (snapshot lúc gán)."""
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='phases', verbose_name=_("Mùa giải"))
    name = models.CharField(max_length=255, verbose_name=_("Tên giai đoạn"))
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))
    start_date = models.DateField(verbose_name=_("Ngày bắt đầu"))
    end_date = models.DateField(verbose_name=_("Ngày kết thúc"))
    target_calories = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Calo mục tiêu"))
    target_protein = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Đạm mục tiêu (g)"))
    target_carbs = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Tinh bột mục tiêu (g)"))
    target_fat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_("Chất béo mục tiêu (g)"))
    workout_program = models.ForeignKey(
        'workouts.WorkoutProgram', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='phases', verbose_name=_("Giáo án")
    )
    workout_program_snapshot = models.JSONField(null=True, blank=True, verbose_name=_("Ảnh chụp giáo án"))

    class Meta:
        db_table = "Phases"
        verbose_name = _("giai đoạn")
        verbose_name_plural = _("Giai đoạn")
        ordering = ['sort_order', 'start_date', 'id']
        indexes = [
            models.Index(fields=['season', 'sort_order']),
            models.Index(fields=['-updated_at', 'id']),
        ]

    def __str__(self):
        return self.name


class NutritionPlan(models.Model):
    """Thực đơn của giai đoạn (bảng NutritionPlans, 1-1 với Phases)."""
    phase = models.OneToOneField(Phase, on_delete=models.CASCADE, related_name='nutrition_plan', verbose_name=_("Giai đoạn"))
    target_calories = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Calo mục tiêu"))
    target_protein = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Đạm mục tiêu (g)"))
    target_carbs = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Tinh bột mục tiêu (g)"))
    target_fat = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Chất béo mục tiêu (g)"))
    notes = models.TextField(null=True, blank=True, verbose_name=_("Ghi chú"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "NutritionPlans"
        verbose_name = _("thực đơn")
        verbose_name_plural = _("Thực đơn")

    def __str__(self):
        return f"NutritionPlan<{self.phase_id}>"


class Meal(models.Model):
    """Bữa ăn trong thực đơn (bảng Meals)."""
    plan = models.ForeignKey(NutritionPlan, on_delete=models.CASCADE, related_name='meals', verbose_name=_("Thực đơn"))
    name = models.CharField(max_length=100, verbose_name=_("Tên bữa"))
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))
    target_calories = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Calo"))
    target_protein = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Đạm (g)"))
    target_carbs = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Tinh bột (g)"))
    target_fat = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Chất béo (g)"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Meals"
        verbose_name = _("bữa ăn")
        verbose_name_plural = _("Bữa ăn")
        ordering = ['sort_order', 'id']
        indexes = [models.Index(fields=['plan', 'sort_order'])]

    def __str__(self):
        return self.name


class MealItem(models.Model):
    """Món trong bữa ăn (bảng MealItems)."""
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='items', verbose_name=_("Bữa ăn"))
    food_category = models.ForeignKey(
        'nutrition.FoodCategory', on_delete=models.PROTECT, related_name='meal_items', verbose_name=_("Nhóm thực phẩm")
    )
    food_item = models.ForeignKey(
        'nutrition.FoodItem', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='meal_items', verbose_name=_("Thực phẩm")
    )
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_("Thứ tự"))
    target_calories = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Calo"))
    target_protein = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Đạm (g)"))
    target_carbs = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Tinh bột (g)"))
    target_fat = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Chất béo (g)"))
    primary_food_text = models.CharField(max_length=255, verbose_name=_("Món chính"))
    alternatives_text = models.TextField(null=True, blank=True, verbose_name=_("Món thay thế"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "MealItems"
        verbose_name = _("món ăn")
        verbose_name_plural = _("Món ăn")
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.primary_food_text
