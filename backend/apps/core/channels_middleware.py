import urllib.parse
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import User


@database_sync_to_async
def get_user_from_jwt(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token.get('user_id')
        if not user_id:
            return AnonymousUser()
        user = User.objects.filter(id=user_id, is_active=True).first()
        return user or AnonymousUser()
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom Channels middleware to authenticate WebSocket connections using SimpleJWT.
    Supports JWT provided via:
    1. Query parameters: ?token=<access_token>
    2. Authorization header: Bearer <access_token>
    3. Sec-WebSocket-Protocol (subprotocols)
    """

    async def __call__(self, scope, receive, send):
        token = None

        # 1. Check Query String (?token=...)
        query_string = scope.get('query_string', b'').decode('utf-8')
        if query_string:
            qs_params = urllib.parse.parse_qs(query_string)
            if 'token' in qs_params and qs_params['token']:
                token = qs_params['token'][0]

        # 2. Check Headers if not found in query string
        if not token:
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode('utf-8')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()

        # 3. Check subprotocols
        if not token and 'subprotocols' in scope:
            for proto in scope['subprotocols']:
                if proto.startswith('token.'):
                    token = proto.split('.', 1)[1]
                    break

        if token:
            scope['user'] = await get_user_from_jwt(token)
        else:
            # Fall back to existing scope user or AnonymousUser
            if 'user' not in scope or not scope['user'].is_authenticated:
                scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
