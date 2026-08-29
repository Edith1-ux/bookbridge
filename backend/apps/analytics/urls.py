from django.urls import path
from .views import StudentEngagementDashboardView, ActivityLogListView

urlpatterns = [
    path('dashboard/', StudentEngagementDashboardView.as_view(), name='engagement-dashboard'),
    path('logs/', ActivityLogListView.as_view(), name='activity-logs'),
]
