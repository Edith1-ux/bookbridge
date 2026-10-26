import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path for ASGI server execution
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.core.channels_middleware import JWTAuthMiddlewareStack
import apps.chat.routing
import apps.calls.routing
import apps.notifications.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            apps.chat.routing.websocket_urlpatterns +
            apps.calls.routing.websocket_urlpatterns +
            apps.notifications.routing.websocket_urlpatterns
        )
    ),
})

