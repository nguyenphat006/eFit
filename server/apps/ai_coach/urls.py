from django.urls import path

from .views import AskView, MealPlanView, SuggestNutritionView, StatusView

urlpatterns = [
    path('ai-coach/status/', StatusView.as_view(), name='ai-coach-status'),
    path('ai-coach/ask/', AskView.as_view(), name='ai-coach-ask'),
    path('ai-coach/suggest-nutrition/', SuggestNutritionView.as_view(), name='ai-coach-suggest-nutrition'),
    path('ai-coach/meal-plan/', MealPlanView.as_view(), name='ai-coach-meal-plan'),
]
