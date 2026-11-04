"""
Trang Tổng quan eFit: 1 endpoint gộp mọi số liệu (KPI, hôm nay, xu hướng, mùa giải đang chạy, hoạt động gần đây).

- Mỗi khối chỉ trả khi user có quyền READ tương ứng, ngược lại trả `null` (frontend ẩn khối).
- Dữ liệu nghiệp vụ lọc theo quyền sở hữu (ADMIN thấy tất cả, HLV / người tập chỉ thấy dữ liệu của mình).
- Cache 60 giây theo user (Redis) — trang tổng quan không cần số liệu từng giây.
- Thêm KPI: viết 1 hàm `_kpi_<ten>` trả dict theo `KpiSerializer` rồi gắn vào `KPI_BUILDERS`.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from django.utils import timezone, translation
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers
from rest_framework.views import APIView

from apps.clients.models import Client, ClientStatus
from apps.core.ownership import is_data_admin
from apps.core.permissions import get_user_permissions
from apps.core.responses import success_response
from apps.daily_logs.models import DailyLog
from apps.daily_logs.services.metrics import calculate_dfi
from apps.seasons.models import Season, SeasonStatus

CACHE_SECONDS = 60
ACTIVITY_DAYS = 14
WEIGHT_DAYS = 30
COMPLIANCE_DAYS = 14
RECENT_LIMIT = 8
ACTIVE_SEASONS_LIMIT = 5


def _can(perms: set, code: str) -> bool:
    return '*' in perms or code in perms


def _num(value):
    return float(value) if value is not None else None


def _owned(qs, user, field='owner'):
    return qs if is_data_admin(user) else qs.filter(**{field: user})


def _kpi(key, label, value, previous, hint, href, unit=None):
    delta = round(value - previous, 1) if value is not None and previous is not None else None
    return {'key': key, 'label': label, 'value': value, 'previous': previous, 'delta': delta, 'hint': hint,
            'href': href, 'unit': unit}


# ------------------------------------------------------------------------ KPI
def _kpi_clients(user, perms, today):
    if not _can(perms, 'CLIENT_READ'):
        return None
    qs = _owned(Client.objects.all(), user, 'coach')
    active = qs.filter(status=ClientStatus.ACTIVE).count()
    created_before = qs.filter(status=ClientStatus.ACTIVE, created_at__date__lt=today - timedelta(days=30)).count()
    return _kpi('clients', _('Học viên đang theo'), active, created_before, _('so với 30 ngày trước'), '/clients')


def _kpi_seasons(user, perms, today):
    if not _can(perms, 'SEASON_READ'):
        return None
    qs = _owned(Season.objects.filter(is_template=False), user)
    active = qs.filter(status=SeasonStatus.ACTIVE).count()
    ending = qs.filter(status=SeasonStatus.ACTIVE, end_date__lte=today + timedelta(days=7)).count()
    return _kpi('seasons', _('Mùa giải đang chạy'), active, None, _('%(n)s mùa kết thúc trong 7 ngày') % {'n': ending}, '/seasons')


def _kpi_workouts(user, perms, today):
    if not _can(perms, 'DAILY_LOG_READ'):
        return None
    qs = _owned(DailyLog.objects.filter(is_workout_completed=True), user)
    week_start = today - timedelta(days=today.weekday())
    current = qs.filter(log_date__gte=week_start, log_date__lte=today).count()
    previous = qs.filter(log_date__gte=week_start - timedelta(days=7), log_date__lt=week_start).count()
    return _kpi('workouts', _('Buổi tập tuần này'), current, previous, _('so với tuần trước'), '/daily-logs')


def _kpi_compliance(user, perms, today):
    if not _can(perms, 'DAILY_LOG_READ'):
        return None
    qs = _owned(DailyLog.objects.all(), user)
    start = today - timedelta(days=6)
    current = qs.filter(log_date__gte=start, log_date__lte=today).aggregate(v=Avg('compliance_score'))['v']
    previous = qs.filter(log_date__gte=start - timedelta(days=7), log_date__lt=start).aggregate(v=Avg('compliance_score'))['v']
    current = round(float(current), 1) if current is not None else None
    previous = round(float(previous), 1) if previous is not None else None
    return _kpi('compliance', _('Điểm kỷ luật TB 7 ngày'), current, previous, _('so với 7 ngày trước'), '/daily-logs', '%')


def _kpi_users(user, perms, today):
    if not _can(perms, 'USER_READ'):
        return None
    users = get_user_model().objects.filter(deleted_at__isnull=True)
    active = users.filter(is_active=True).count()
    previous = users.filter(is_active=True, date_joined__date__lt=today - timedelta(days=30)).count()
    return _kpi('users', _('Tài khoản hoạt động'), active, previous, _('so với 30 ngày trước'), '/users')


KPI_BUILDERS = [_kpi_clients, _kpi_seasons, _kpi_workouts, _kpi_compliance, _kpi_users]


# --------------------------------------------------------------------- blocks
def _today(user, perms, today):
    """Nhật ký hôm nay của chính user (tự theo dõi)."""
    if not _can(perms, 'DAILY_LOG_READ'):
        return None
    log = DailyLog.objects.filter(owner=user, client__isnull=True, log_date=today).first()
    return {
        'date': today,
        'has_log': log is not None,
        'log_id': log.id if log else None,
        'weight': _num(log.weight) if log else None,
        'calories_in': _num(log.calories_in) if log else None,
        'target_calories': _num(log.target_calories_snapshot) if log else None,
        'is_workout_completed': log.is_workout_completed if log else False,
        'compliance_score': _num(log.compliance_score) if log else None,
        'dfi': calculate_dfi(log.sleep_hours, log.work_hours, log.fatigue_level) if log else None,
    }


def _weight_trend(user, perms, today):
    if not _can(perms, 'DAILY_LOG_READ'):
        return None
    rows = (
        DailyLog.objects
        .filter(owner=user, client__isnull=True, weight__isnull=False, log_date__gt=today - timedelta(days=WEIGHT_DAYS))
        .order_by('log_date')
        .values('log_date', 'weight')
    )
    return [{'date': r['log_date'], 'weight': float(r['weight'])} for r in rows]


def _compliance_trend(user, perms, today):
    if not _can(perms, 'DAILY_LOG_READ'):
        return None
    start = today - timedelta(days=COMPLIANCE_DAYS - 1)
    rows = (
        _owned(DailyLog.objects.all(), user)
        .filter(log_date__gte=start, log_date__lte=today)
        .values('log_date')
        .annotate(avg=Avg('compliance_score'), logs=Count('id'))
    )
    by_day = {r['log_date']: r for r in rows}
    points = []
    for i in range(COMPLIANCE_DAYS):
        day = start + timedelta(days=i)
        row = by_day.get(day)
        points.append({
            'date': day,
            'compliance': round(float(row['avg']), 1) if row and row['avg'] is not None else None,
            'logs': row['logs'] if row else 0,
        })
    return points


def _active_seasons(user, perms, today):
    if not _can(perms, 'SEASON_READ'):
        return None
    seasons = (
        _owned(Season.objects.filter(status=SeasonStatus.ACTIVE, is_template=False), user)
        .select_related('client')
        .prefetch_related('phases')
        .order_by('end_date', 'id')[:ACTIVE_SEASONS_LIMIT]
    )
    result = []
    for s in seasons:
        total = max((s.end_date - s.start_date).days, 1)
        elapsed = min(max((today - s.start_date).days, 0), total)
        phase = next((p for p in s.phases.all() if p.deleted_at is None and p.start_date <= today <= p.end_date), None)
        result.append({
            'id': s.id, 'name': s.name, 'goal_type': s.goal_type,
            'client_name': s.client.full_name if s.client else None,
            'start_date': s.start_date, 'end_date': s.end_date,
            'progress': round(elapsed / total * 100),
            'days_left': max((s.end_date - today).days, 0),
            'current_phase': phase.name if phase else None,
        })
    return result


def _events():
    import pghistory.models
    return pghistory.models.Events.objects.all()


def _activity_series(perms, today):
    if not _can(perms, 'AUDIT_LOGS_READ'):
        return None
    start = today - timedelta(days=ACTIVITY_DAYS - 1)
    rows = (
        _events()
        .filter(pgh_created_at__date__gte=start)
        .annotate(day=TruncDate('pgh_created_at'))
        .values('day')
        .annotate(count=Count('pgh_slug'))
    )
    counts = {r['day']: r['count'] for r in rows}
    return [{'date': start + timedelta(days=i), 'count': counts.get(start + timedelta(days=i), 0)} for i in range(ACTIVITY_DAYS)]


def _recent_activity(perms):
    if not _can(perms, 'AUDIT_LOGS_READ'):
        return None
    from apps.audit.serializers import AuditLogEventSerializer
    events = _events().order_by('-pgh_created_at')[:RECENT_LIMIT]
    data = AuditLogEventSerializer(events, many=True).data
    return [
        {
            'id': e['id'], 'created_at': e['created_at'],
            'user': (e.get('user') or {}).get('full_name') or (e.get('user') or {}).get('username') or _('Hệ thống'),
            'action_code': e['action_code'], 'model_name': e['model_name'], 'object_id': e['object_id'],
        }
        for e in data
    ]


# ---------------------------------------------------------------- serializers
class KpiSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    value = serializers.FloatField(allow_null=True)
    previous = serializers.FloatField(allow_null=True)
    delta = serializers.FloatField(allow_null=True)
    hint = serializers.CharField()
    href = serializers.CharField(allow_null=True)
    unit = serializers.CharField(allow_null=True)


class TodaySerializer(serializers.Serializer):
    date = serializers.DateField()
    has_log = serializers.BooleanField()
    log_id = serializers.IntegerField(allow_null=True)
    weight = serializers.FloatField(allow_null=True)
    calories_in = serializers.FloatField(allow_null=True)
    target_calories = serializers.FloatField(allow_null=True)
    is_workout_completed = serializers.BooleanField()
    compliance_score = serializers.FloatField(allow_null=True)
    dfi = serializers.FloatField(allow_null=True)


class WeightPointSerializer(serializers.Serializer):
    date = serializers.DateField()
    weight = serializers.FloatField()


class CompliancePointSerializer(serializers.Serializer):
    date = serializers.DateField()
    compliance = serializers.FloatField(allow_null=True)
    logs = serializers.IntegerField()


class ActiveSeasonSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    goal_type = serializers.CharField()
    client_name = serializers.CharField(allow_null=True)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    progress = serializers.IntegerField()
    days_left = serializers.IntegerField()
    current_phase = serializers.CharField(allow_null=True)


class ActivityPointSerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()


class RecentActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    created_at = serializers.CharField()
    user = serializers.CharField()
    action_code = serializers.CharField()
    model_name = serializers.CharField()
    object_id = serializers.IntegerField(allow_null=True)


class DashboardOverviewSerializer(serializers.Serializer):
    kpis = KpiSerializer(many=True)
    today = TodaySerializer(allow_null=True)
    weight_trend = WeightPointSerializer(many=True, allow_null=True)
    compliance_trend = CompliancePointSerializer(many=True, allow_null=True)
    active_seasons = ActiveSeasonSerializer(many=True, allow_null=True)
    activity = ActivityPointSerializer(many=True, allow_null=True)
    recent_activity = RecentActivitySerializer(many=True, allow_null=True)


class DashboardOverviewView(APIView):
    """Số liệu trang Tổng quan (chỉ cần đăng nhập; từng khối tự lọc theo quyền và quyền sở hữu của user)."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Tổng quan (Dashboard)'], summary='Số liệu trang Tổng quan', responses=DashboardOverviewSerializer)
    def get(self, request):
        user = request.user
        cache_key = f'dashboard_overview_{user.id}_{translation.get_language()}'  # nhãn theo ngôn ngữ
        data = cache.get(cache_key)
        if data is None:
            perms = get_user_permissions(user)
            today = timezone.localdate()
            data = DashboardOverviewSerializer({
                'kpis': [k for k in (builder(user, perms, today) for builder in KPI_BUILDERS) if k],
                'today': _today(user, perms, today),
                'weight_trend': _weight_trend(user, perms, today),
                'compliance_trend': _compliance_trend(user, perms, today),
                'active_seasons': _active_seasons(user, perms, today),
                'activity': _activity_series(perms, today),
                'recent_activity': _recent_activity(perms),
            }).data
            cache.set(cache_key, data, CACHE_SECONDS)
        return success_response(data=data)
