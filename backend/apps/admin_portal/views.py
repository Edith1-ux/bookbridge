from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.core.feature_flags import FeatureFlagEngine


class AdminOverviewView(APIView):
    """Enterprise Admin Portal overview: Feature flags, moderation queue, audit logs."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            'status': 'HEALTHY',
            'feature_flags': FeatureFlagEngine.get_all_flags(),
            'pending_moderation_items': 0,
            'audit_log_status': 'ACTIVE'
        })
