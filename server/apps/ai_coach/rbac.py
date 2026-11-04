"""
Phân quyền phân hệ Trợ lý AI — seed_core tự gom file này (apps/core/rbac_registry.py).
Chỉ có quyền vào màn hình (VIEW) và gửi câu hỏi / nhận gợi ý (READ).
"""
from apps.core.rbac_registry import crud_permissions, perm_codes

MODULES = [
    {
        'module_code': 'AI_COACH',
        'module_name': 'Trợ lý AI',
        'module_name_en': 'AI coach',
        'icon': 'RobotOutlined',
        'route_path': '/ai-coach',
        'parent_code': None,
        'sort_order': 60,
        'is_navigation': True,
        'is_active': True,
        'description': 'Hỏi đáp và gợi ý dinh dưỡng / thực đơn bằng AI',
        'description_en': None,
    },
]

PERMISSIONS = [
    *crud_permissions('AI_COACH', 'trợ lý AI', actions=[('VIEW', 'Truy cập màn hình'), ('READ', 'Sử dụng')]),
]

ROLE_PERMISSIONS = {
    'COACH': perm_codes('AI_COACH', 'VIEW', 'READ'),
    'MEMBER': perm_codes('AI_COACH', 'VIEW', 'READ'),
}
