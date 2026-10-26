from django.urls import re_path
from .consumers import WebRTCSignalingConsumer

websocket_urlpatterns = [
    re_path(r'ws/call/(?P<call_id>\w+)/$', WebRTCSignalingConsumer.as_asgi()),
]
