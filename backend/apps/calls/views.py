from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class ICEServersView(APIView):
    """
    Returns standard STUN and optional TURN ICE configuration for WebRTC voice/video calls.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ice_servers = [
            {"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]},
            {"urls": ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"]}
        ]
        return Response({"iceServers": ice_servers}, status=status.HTTP_200_OK)
