from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import BusinessError
from apps.core.ownership import OwnedQuerysetMixin, is_data_admin
from apps.core.permissions import ModulePermissionChecker
from apps.core.responses import success_response
from apps.core.viewsets import BaseERPViewSet

from .models import Client, FitnessProfile
from .serializers import (
    ClientCreateUpdateSerializer,
    ClientLinkAccountSerializer,
    ClientSerializer,
    FitnessProfileSerializer,
)

User = get_user_model()
TAG = "Học viên"


@extend_schema_view(
    list=extend_schema(tags=[TAG], summary="Danh sách học viên"),
    retrieve=extend_schema(tags=[TAG], summary="Chi tiết học viên"),
    create=extend_schema(tags=[TAG], summary="Tạo mới học viên"),
    update=extend_schema(tags=[TAG], summary="Cập nhật học viên"),
    partial_update=extend_schema(tags=[TAG], summary="Cập nhật một phần học viên"),
    destroy=extend_schema(tags=[TAG], summary="Xóa mềm học viên"),
)
class ClientViewSet(OwnedQuerysetMixin, BaseERPViewSet):
    """
    Học viên do HLV quản lý. HLV chỉ thấy học viên của mình (lọc queryset theo coach); ADMIN thấy tất cả
    và được đổi HLV phụ trách. Không xóa được học viên còn mùa giải / nhật ký — chuyển trạng thái Lưu trữ.
    """
    queryset = Client.objects.select_related('coach', 'user', 'created_by', 'updated_by').order_by('-updated_at', 'id')
    serializer_class = ClientSerializer
    write_serializer_class = ClientCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'CLIENT'
    owner_field = 'coach'
    owner_assign_field = 'coach'
    custom_action_permissions = {'link_account': 'CLIENT_UPDATE'}
    filterset_fields = {
        'is_active': ['exact'],
        'full_name': ['icontains'],
        'phone': ['icontains'],
        'status': ['exact', 'in'],
        'fitness_goal': ['exact', 'in'],
        'gender': ['exact', 'in'],
        'coach': ['exact'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['full_name', 'phone', 'email']
    ordering_fields = ['created_at', 'updated_at', 'full_name', 'status', 'current_weight']

    def perform_create(self, serializer):
        if not is_data_admin(self.request.user):
            serializer.validated_data.pop('coach', None)
        return super().perform_create(serializer)

    def perform_update(self, serializer):
        if not is_data_admin(self.request.user):
            serializer.validated_data.pop('coach', None)
        return super().perform_update(serializer)

    def check_can_destroy(self, instance):
        for relation in ('seasons', 'daily_logs', 'workout_programs'):
            manager = getattr(instance, relation, None)
            if manager is not None and manager.exists():
                raise BusinessError(_("Học viên đã có mùa giải / giáo án / nhật ký — hãy chuyển sang trạng thái Lưu trữ."))

    @extend_schema(tags=[TAG], summary="Liên kết tài khoản eFit với học viên", request=ClientLinkAccountSerializer,
                   responses=ClientSerializer, methods=['POST'])
    @extend_schema(tags=[TAG], summary="Hủy liên kết tài khoản khỏi học viên", request=None,
                   responses=ClientSerializer, methods=['DELETE'])
    @action(detail=True, methods=['post', 'delete'], url_path='link-account')
    def link_account(self, request, pk=None):
        client = self.get_object()
        if request.method == 'DELETE':
            client.user = None
            client.updated_by = request.user
            client.save(update_fields=['user', 'updated_by', 'updated_at'])
            return success_response(data=ClientSerializer(client).data, message=_("Đã hủy liên kết tài khoản"))

        payload = ClientLinkAccountSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        user = User.objects.filter(pk=payload.validated_data['user_id'], deleted_at__isnull=True).first()
        if user is None:
            raise NotFound(_("Tài khoản không tồn tại."))
        existing = Client.all_objects.filter(user=user).exclude(pk=client.pk).first()
        if existing:
            raise ValidationError({'user_id': [
                _("Tài khoản này đã được liên kết với học viên '%(name)s'.") % {"name": existing.full_name}
            ]})
        client.user = user
        client.updated_by = request.user
        client.save(update_fields=['user', 'updated_by', 'updated_at'])
        return success_response(data=ClientSerializer(client).data, message=_("Liên kết tài khoản thành công"))


class MyFitnessProfileView(APIView):
    """
    Hồ sơ thể chất của chính người đăng nhập (GET tự tạo khi chưa có, PUT/PATCH cập nhật).
    Chỉ cần đăng nhập (không qua RBAC): mỗi người chỉ đọc / ghi hồ sơ của mình, không truy cập được hồ sơ người khác.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _profile(self, request):
        profile, _created = FitnessProfile.objects.get_or_create(
            user=request.user, defaults={'created_by': request.user, 'updated_by': request.user}
        )
        return profile

    @extend_schema(tags=["Hồ sơ thể chất"], summary="Hồ sơ thể chất của tôi", responses=FitnessProfileSerializer)
    def get(self, request):
        return Response(FitnessProfileSerializer(self._profile(request)).data)

    @extend_schema(tags=["Hồ sơ thể chất"], summary="Cập nhật hồ sơ thể chất của tôi",
                   request=FitnessProfileSerializer, responses=FitnessProfileSerializer)
    def put(self, request):
        return self._save(request, partial=False)

    @extend_schema(tags=["Hồ sơ thể chất"], summary="Cập nhật một phần hồ sơ thể chất của tôi",
                   request=FitnessProfileSerializer, responses=FitnessProfileSerializer)
    def patch(self, request):
        return self._save(request, partial=True)

    def _save(self, request, partial):
        profile = self._profile(request)
        serializer = FitnessProfileSerializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return success_response(data=serializer.data, message=_("Đã cập nhật hồ sơ thể chất"))
