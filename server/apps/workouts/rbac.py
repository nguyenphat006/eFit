"""
Phân quyền phân hệ giáo án tập — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'WORKOUT_PROGRAM',
        'module_name': 'Giáo án tập',
        'module_name_en': 'Workout programs',
        'icon': 'ClipboardOutlined',
        'route_path': '/workouts',
        'parent_code': 'PLANNING',
        'sort_order': 2,
        'is_navigation': True,
        'is_active': True,
        'description': 'Quản lý giáo án tập và giáo án mẫu',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('WORKOUT_PROGRAM', 'giáo án tập'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('WORKOUT_PROGRAM', 'VIEW', 'READ'),
    ],
    'COACH': [
        *perm_codes('WORKOUT_PROGRAM', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
    'MEMBER': [
        *perm_codes('WORKOUT_PROGRAM', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
}
