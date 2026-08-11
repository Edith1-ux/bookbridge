"""
BookBridge Main URL Configuration
Serves both REST API endpoints, static frontend HTML pages, and frontend assets.
"""

import os
import mimetypes
from pathlib import Path
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.books.views import StatisticsAPIView, BookListCreateView
from apps.users.views import RegisterView, CustomLoginView, AdminStatsView, UserListView
from apps.chat.views import ChatMessageListCreateView

PROJECT_ROOT = Path(settings.BASE_DIR).parent

def serve_static_page(request, page='login.html'):
    if not page.endswith('.html'):
        page = f"{page}.html"
    filepath = PROJECT_ROOT / page
    if filepath.exists() and filepath.is_file():
        with open(filepath, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return HttpResponse("<h2>BookBridge Online</h2><p><a href='/browse'>Go to Browse Books</a></p>", content_type='text/html; charset=utf-8')

def serve_root_asset(request, asset_path):
    filepath = PROJECT_ROOT / asset_path
    if filepath.exists() and filepath.is_file():
        content_type, _ = mimetypes.guess_type(str(filepath))
        content_type = content_type or 'application/octet-stream'
        with open(filepath, 'rb') as f:
            return HttpResponse(f.read(), content_type=content_type)
    return HttpResponse("Asset not found", status=404)

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'service': 'BookBridge Enterprise Django Engine',
        'database': 'MySQL'
    })

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # Health & Stats API Endpoints
    path('api/health', health_check, name='api-health'),
    path('api/statistics/', StatisticsAPIView.as_view(), name='api-statistics'),
    path('api/v1/statistics/', StatisticsAPIView.as_view(), name='api-v1-statistics'),

    # Legacy REST API Endpoints for Backward Compatibility
    path('api/register', RegisterView.as_view()),
    path('api/login', CustomLoginView.as_view()),
    path('api/books', BookListCreateView.as_view()),
    path('api/admin/stats', AdminStatsView.as_view()),
    path('api/admin/users', UserListView.as_view()),
    path('api/messages', ChatMessageListCreateView.as_view()),

    # JWT Authentication Endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # OpenAPI / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # App API Endpoints
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/books/', include('apps.books.urls')),
    path('api/v1/exchange/', include('apps.exchange.urls')),
    path('api/v1/donations/', include('apps.donations.urls')),
    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),

    # Frontend Page Routes
    path('', lambda req: serve_static_page(req, 'login.html')),
    path('index', lambda req: serve_static_page(req, 'index.html')),
    path('browse', lambda req: serve_static_page(req, 'browse.html')),
    path('browse-books', lambda req: serve_static_page(req, 'browse.html')),
    path('exchange', lambda req: serve_static_page(req, 'exchange.html')),
    path('donate', lambda req: serve_static_page(req, 'donate.html')),
    path('about', lambda req: serve_static_page(req, 'about.html')),
    path('contact', lambda req: serve_static_page(req, 'contact.html')),
    path('login', lambda req: serve_static_page(req, 'login.html')),
    path('register', lambda req: serve_static_page(req, 'register.html')),
    path('admin', lambda req: serve_static_page(req, 'admin.html')),
    path('dashboard', lambda req: serve_static_page(req, 'dashboard.html')),

    # Static Assets & Catch-All Page Routes
    re_path(r'^(?P<asset_path>.+\.(css|js|png|jpg|jpeg|svg|json|ico|woff2|woff|ttf))$', serve_root_asset),
    re_path(r'^(?P<page>[a-zA-Z0-9_\-]+)\.html$', serve_static_page),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
