"""
Phân quyền phân hệ mùa giải — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'PLANNING',
        'module_name': 'Kế hoạch',
        'module_name_en': 'Planning',
        'icon': 'CalendarRangeOutlined',
        'route_path': None,
        'parent_code': None,
        'sort_order': 30,
        'is_navigation': True,
        'is_active': True,
        'description': 'Nhóm menu kế hoạch tập luyện & dinh dưỡng',
        'description_en': None,
    },
    {
        'module_code': 'SEASON',
        'module_name': 'Mùa giải',
        'module_name_en': 'Seasons',
        'icon': 'CalendarRangeOutlined',
        'route_path': '/seasons',
        'parent_code': 'PLANNING',
        'sort_order': 1,
        'is_navigation': True,
        'is_active': True,
        'description': 'Quản lý mùa giải, giai đoạn và thực đơn',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('SEASON', 'mùa giải'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('SEASON', 'VIEW', 'READ'),
    ],
    'COACH': [
        *perm_codes('SEASON', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
    'MEMBER': [
        *perm_codes('SEASON', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
}
