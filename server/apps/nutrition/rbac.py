"""
Phân quyền phân hệ thực phẩm — seed_core tự gom file này (apps/core/rbac_registry.py).
Sửa quyền mặc định theo vai trò ở ROLE_PERMISSIONS; ADMIN luôn có toàn bộ quyền.
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'FOOD_ITEM',
        'module_name': 'Thực phẩm',
        'module_name_en': 'Foods',
        'icon': 'SaladOutlined',
        'route_path': '/library/foods',
        'parent_code': 'LIBRARY',
        'sort_order': 2,
        'is_navigation': True,
        'is_active': True,
        'description': 'Thư viện thực phẩm & giá trị dinh dưỡng',
        'description_en': None,
    },
    {
        'module_code': 'FOOD_CATEGORY',
        'module_name': 'Nhóm thực phẩm',
        'module_name_en': 'Food categories',
        'icon': 'FolderOutlined',
        'route_path': '/library/food-categories',
        'parent_code': 'LIBRARY',
        'sort_order': 3,
        'is_navigation': True,
        'is_active': True,
        'description': 'Danh mục nhóm thực phẩm',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('FOOD_ITEM', 'thực phẩm'),
    *crud_permissions('FOOD_CATEGORY', 'nhóm thực phẩm'),
]

ROLE_PERMISSIONS = {
    'MANAGER': [
        *perm_codes('FOOD_ITEM', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
        *perm_codes('FOOD_CATEGORY', 'VIEW', 'READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'),
    ],
    'COACH': [
        *perm_codes('FOOD_ITEM', 'VIEW', 'READ', 'CREATE', 'UPDATE'),
        *perm_codes('FOOD_CATEGORY', 'VIEW', 'READ'),
    ],
    'MEMBER': [
        *perm_codes('FOOD_ITEM', 'VIEW', 'READ'),
        *perm_codes('FOOD_CATEGORY', 'READ'),
    ],
}
