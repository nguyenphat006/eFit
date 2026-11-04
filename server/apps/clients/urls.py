from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClientViewSet, MyFitnessProfileView

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('fitness-profile/me/', MyFitnessProfileView.as_view(), name='fitness-profile-me'),
    path('', include(router.urls)),
]
