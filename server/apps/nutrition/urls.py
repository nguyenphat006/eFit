from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FoodCategoryViewSet, FoodItemViewSet

router = DefaultRouter()
router.register(r'food-categories', FoodCategoryViewSet, basename='food-category')
router.register(r'food-items', FoodItemViewSet, basename='food-item')

urlpatterns = [
    path('', include(router.urls)),
]
