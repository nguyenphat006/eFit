"""Nguồn tìm kiếm toàn cục của thư viện thực phẩm — apps/core/search_registry.py tự gom file này."""
from apps.core.search_registry import SearchProvider

from .models import FoodCategory, FoodItem

SEARCH_PROVIDERS = [
    SearchProvider(
        module_code='FOOD_ITEM',
        model=FoodItem,
        code_field='name',
        title_field='name',
        subtitle=lambda obj: obj.category.category_name,
        image_field='image_url',
        select_related=('category',),
        url='/library/foods?q={code}',
    ),
    SearchProvider(
        module_code='FOOD_CATEGORY',
        model=FoodCategory,
        code_field='category_code',
        title_field='category_name',
        url='/library/food-categories?q={code}',
    ),
]
