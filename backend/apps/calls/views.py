import os
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
        turn_url = os.environ.get('TURN_URL') or os.environ.get('COTURN_URL')
        turn_user = os.environ.get('TURN_USERNAME')
        turn_cred = os.environ.get('TURN_CREDENTIAL') or os.environ.get('TURN_PASSWORD')

        if turn_url:
            turn_config = {"urls": [turn_url]}
            if turn_user and turn_cred:
                turn_config["username"] = turn_user
                turn_config["credential"] = turn_cred
            ice_servers.append(turn_config)

        return Response({"iceServers": ice_servers}, status=status.HTTP_200_OK)

