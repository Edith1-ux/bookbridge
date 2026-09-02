"""
ASGI config for BookBridge project.
Exposes the ASGI callable as a module-level variable named ``application``.
"""
import os
import sys
from pathlib import Path
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(BASE_DIR / 'apps') not in sys.path:
    sys.path.insert(0, str(BASE_DIR / 'apps'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

django_asgi_app = get_asgi_application()

from apps.core.channels_middleware import JWTAuthMiddlewareStack
import apps.chat.routing
import apps.calls.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            apps.chat.routing.websocket_urlpatterns +
            apps.calls.routing.websocket_urlpatterns
        )
    ),
})
