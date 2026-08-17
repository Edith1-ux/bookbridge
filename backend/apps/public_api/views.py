from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

class PublicDocsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'name': 'BookBridge 2.0 Developer API',
            'version': 'v1',
            'documentation_url': '/api/v1/public/docs/',
            'supported_authentication': ['X-API-Key', 'Bearer JWT'],
            'webhooks_enabled': True
        })
