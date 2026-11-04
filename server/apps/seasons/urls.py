from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PhaseViewSet, SeasonViewSet

router = DefaultRouter()
router.register(r'seasons', SeasonViewSet, basename='season')
router.register(r'phases', PhaseViewSet, basename='phase')

urlpatterns = [
    path('', include(router.urls)),
]
