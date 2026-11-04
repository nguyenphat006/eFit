"""
Phân quyền phân hệ bài tập — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'LIBRARY',
        'module_name': 'Thư viện',
        'module_name_en': 'Library',
        'icon': 'LibraryOutlined',
        'route_path': None,
        'parent_code': None,
        'sort_order': 50,
        'is_navigation': True,
        'is_active': True,
        'description': 'Nhóm menu thư viện dữ liệu dùng chung',
        'description_en': None,
    },
    {
        'module_code': 'EXERCISE',
        'module_name': 'Bài tập',
        'module_name_en': 'Exercises',
        'icon': 'DumbbellOutlined',
        'route_path': '/library/exercises',
        'parent_code': 'LIBRARY',
        'sort_order': 1,
        'is_navigation': True,
        'is_active': True,
        'description': 'Thư viện bài tập dùng chung',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('EXERCISE', 'bài tập'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('EXERCISE', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
    'COACH': [
        *perm_codes('EXERCISE', 'VIEW', 'READ', 'CREATE', 'UPDATE'),
    ],
    'MEMBER': [
        *perm_codes('EXERCISE', 'VIEW', 'READ'),
    ],
}
