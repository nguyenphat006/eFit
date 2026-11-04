from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import WorkoutProgramViewSet

router = DefaultRouter()
router.register(r'workout-programs', WorkoutProgramViewSet, basename='workout-program')

urlpatterns = [
    path('', include(router.urls)),
]
