from django.urls import path
from .views import AIRecommendationView

urlpatterns = [
    path('recommendations/', AIRecommendationView.as_view(), name='ai-recommendations'),
]
