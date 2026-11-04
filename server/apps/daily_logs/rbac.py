"""
Phân quyền phân hệ nhật ký hằng ngày — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'TRACKING',
        'module_name': 'Theo dõi',
        'module_name_en': 'Tracking',
        'icon': 'HeartPulseOutlined',
        'route_path': None,
        'parent_code': None,
        'sort_order': 40,
        'is_navigation': True,
        'is_active': True,
        'description': 'Nhóm menu theo dõi tiến độ',
        'description_en': None,
    },
    {
        'module_code': 'DAILY_LOG',
        'module_name': 'Nhật ký hằng ngày',
        'module_name_en': 'Daily logs',
        'icon': 'NotebookOutlined',
        'route_path': '/daily-logs',
        'parent_code': 'TRACKING',
        'sort_order': 1,
        'is_navigation': True,
        'is_active': True,
        'description': 'Ghi nhận cân nặng, dinh dưỡng, giấc ngủ, tập luyện hằng ngày',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('DAILY_LOG', 'nhật ký hằng ngày'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('DAILY_LOG', 'VIEW', 'READ'),
    ],
    'COACH': [
        *perm_codes('DAILY_LOG', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
    'MEMBER': [
        *perm_codes('DAILY_LOG', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
}
