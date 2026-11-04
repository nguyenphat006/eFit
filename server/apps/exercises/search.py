"""Nguồn tìm kiếm toàn cục của phân hệ bài tập — apps/core/search_registry.py tự gom file này."""
from apps.core.search_registry import SearchProvider

from .models import Exercise

SEARCH_PROVIDERS = [
    SearchProvider(
        module_code='EXERCISE',
        model=Exercise,
        code_field='name',
        title_field='name',
        subtitle='target',
        extra_fields=('muscle_group',),
        image_field='image_url',
        url='/library/exercises/{id}',
    ),
]
