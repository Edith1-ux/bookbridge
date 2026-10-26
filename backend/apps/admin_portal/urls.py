from django.urls import path
from .views import (
    AdminOverviewView,
    AdminAnalyticsView,
    AdminSystemHealthView,
    AdminBroadcastNotificationView,
    AdminReportExportView,
)

urlpatterns = [
    path('overview/', AdminOverviewView.as_view(), name='admin-overview'),
    path('analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('system-health/', AdminSystemHealthView.as_view(), name='admin-system-health'),
    path('broadcast/', AdminBroadcastNotificationView.as_view(), name='admin-broadcast'),
    path('export/', AdminReportExportView.as_view(), name='admin-export'),
    path('reports/export/', AdminReportExportView.as_view(), name='admin-reports-export'),
]
