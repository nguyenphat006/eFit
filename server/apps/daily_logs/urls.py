from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DailyLogViewSet

router = DefaultRouter()
router.register(r'daily-logs', DailyLogViewSet, basename='daily-log')

urlpatterns = [
    path('', include(router.urls)),
]
