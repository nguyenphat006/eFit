"""
Quyền sở hữu dữ liệu eFit: ADMIN (hoặc superuser) thấy mọi bản ghi; người dùng khác chỉ thấy bản ghi mình sở hữu.

Dùng trong ViewSet:
    class SeasonViewSet(OwnedQuerysetMixin, BaseERPViewSet):
        owner_field = 'owner'          # đường dẫn ORM tới user sở hữu (vd. 'season__owner', 'coach')
        owner_assign_field = 'owner'   # trường gán người tạo khi create (None = không tự gán)

Lọc ở queryset (không chỉ ở UI) nên bản ghi của người khác trả 404 khi truy cập theo id.
"""
from apps.core.permissions import get_user_permissions


def is_data_admin(user) -> bool:
    """ADMIN / superuser: xem và sửa dữ liệu của mọi HLV."""
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or '*' in get_user_permissions(user)


class OwnedQuerysetMixin:
    owner_field = 'owner'
    owner_assign_field = 'owner'

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_data_admin(user):
            return qs
        return qs.filter(**{self.owner_field: user})

    def perform_create(self, serializer):
        if self.owner_assign_field and self.owner_assign_field not in serializer.validated_data:
            serializer.validated_data[self.owner_assign_field] = self.request.user
        return super().perform_create(serializer)
