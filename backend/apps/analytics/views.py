from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import ActivityLog
from .serializers import ActivityLogSerializer
from apps.users.permissions import IsBookBridgeAdmin


class ActivityLogListView(generics.ListAPIView):
    """
    Admin-only endpoint to inspect all activity audit logs:
    Logins, Buy/Sell, Exchanges, Donations, and User Registrations.
    """
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'user_email']
    search_fields = ['title', 'user_email', 'user_name']
    ordering_fields = ['created_at', 'action']


class StudentEngagementDashboardView(APIView):
    """Business Intelligence Telemetry: Student engagement, popular resources, demand forecasting."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            'total_activity_count': ActivityLog.objects.count(),
            'recent_logs': ActivityLogSerializer(ActivityLog.objects.all()[:10], many=True).data,
            'daily_active_students': ActivityLog.objects.filter(action='LOGIN').count(),
        })
