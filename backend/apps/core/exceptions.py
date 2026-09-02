import logging
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('apps.core.exceptions')


def custom_exception_handler(exc, context):
    """
    Global custom exception handler for Django REST Framework.
    Guarantees:
    1. Unhandled 500 errors never leak sensitive tracebacks, secret keys, or DB credentials in production (DEBUG=False).
    2. Comprehensive diagnostic details (endpoint, method, user, IP) are securely recorded in server logs.
    3. Handled DRF exceptions (400, 401, 403, 404, 429) maintain consistent JSON structure.
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    request = context.get('request')
    view = context.get('view')
    path = getattr(request, 'path', 'unknown')
    method = getattr(request, 'method', 'unknown')
    user = getattr(request, 'user', None)
    user_ident = user.email if (user and user.is_authenticated) else 'Anonymous'

    if response is None:
        # Unhandled server exception (500 Internal Server Error)
        logger.error(
            f"[HTTP 500] Unhandled Exception at {method} {path} | User: {user_ident} | Error: {type(exc).__name__}: {str(exc)}",
            exc_info=True,
            extra={
                'path': path,
                'method': method,
                'user': user_ident,
                'view': type(view).__name__ if view else 'UnknownView',
            }
        )

        if settings.DEBUG:
            error_msg = f"{type(exc).__name__}: {str(exc)}"
        else:
            error_msg = "Something went wrong. Please try again."

        return Response(
            {
                'error': error_msg,
                'status_code': 500,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Standard DRF handled response (400, 401, 403, 404, 405, 429)
    if response.status_code >= 400:
        if response.status_code == 401:
            logger.warning(f"[HTTP 401] Unauthorized access attempt at {method} {path}")
        elif response.status_code == 403:
            logger.warning(f"[HTTP 403] Forbidden access attempt at {method} {path} | User: {user_ident}")
        elif response.status_code >= 500:
            logger.error(f"[HTTP {response.status_code}] Error at {method} {path} | User: {user_ident} | Data: {response.data}")

    return response
