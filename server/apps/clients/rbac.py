"""
Phân quyền phân hệ học viên — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'CLIENT',
        'module_name': 'Học viên',
        'module_name_en': 'Clients',
        'icon': 'TeamOutlined',
        'route_path': '/clients',
        'parent_code': None,
        'sort_order': 20,
        'is_navigation': True,
        'is_active': True,
        'description': 'Quản lý hồ sơ học viên do HLV phụ trách',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('CLIENT', 'học viên'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('CLIENT', 'VIEW', 'READ'),
    ],
    'COACH': [
        *perm_codes('CLIENT', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
}
