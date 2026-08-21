from django.urls import path
from .views import StudentEngagementDashboardView

urlpatterns = [
    path('dashboard/', StudentEngagementDashboardView.as_view(), name='analytics-dashboard'),
]
