import os
import mimetypes
from pathlib import Path
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.db import connection

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from config.page_views import serve_html_page, statistics_api
from apps.users.views import RegisterView, CustomLoginView, UserListView, UserAdminDetailView, AdminStatsView, UserProfileView, LogoutView
from apps.admin_portal.views import AdminOverviewView, AdminAnalyticsView, AdminSystemHealthView, AdminBroadcastNotificationView, AdminReportExportView
from apps.books.views import BookListCreateView, BookDetailView, WishlistListView, WishlistToggleView, StatisticsAPIView
from apps.exchange.views import ExchangeProposalListCreateView, ExchangeProposalDetailView
from apps.donations.views import DonationClaimListCreateView, DonationClaimDetailView
from apps.chat.views import ChatMessageListCreateView, ChatInboxView
from apps.payments.views import CreatePaymentIntentView, WalletBalanceView
from apps.ai.views import AIRecommendationView, AIAssistantView
from apps.analytics.views import ActivityLogListView


PROJECT_ROOT = Path(settings.BASE_DIR).parent if os.path.basename(str(settings.BASE_DIR)) == 'backend' else Path(settings.BASE_DIR)


def health_check(request):
    """Production health check verifying database and application status."""
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        db_ok = False

    http_status = 200 if db_ok else 503
    return JsonResponse({
        'status': 'healthy' if db_ok else 'degraded',
        'service': 'BookBridge Enterprise Django Engine',
        'version': '2.0.0',
        'database_connected': db_ok,
        'demo_mode': getattr(settings, 'DEMO_MODE', False),
    }, status=http_status)


def health_liveness(request):
    """Liveness probe: verifies the application worker process is alive and accepting requests."""
    return JsonResponse({'status': 'alive', 'service': 'BookBridge'}, status=200)


def health_readiness(request):
    """Readiness probe: verifies critical dependencies (database) are operational."""
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        db_ok = False

    if db_ok:
        return JsonResponse({'status': 'ready', 'database': 'connected'}, status=200)
    else:
        return JsonResponse({'status': 'unready', 'database': 'disconnected'}, status=503)


def serve_robots_txt(request):
    robots_path = PROJECT_ROOT / 'robots.txt'
    if robots_path.exists():
        with open(robots_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/plain')
    return HttpResponse("User-agent: *\nAllow: /\nSitemap: /sitemap.xml", content_type='text/plain')


def serve_sitemap_xml(request):
    sitemap_path = PROJECT_ROOT / 'sitemap.xml'
    if sitemap_path.exists():
        with open(sitemap_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='application/xml')
    return HttpResponse("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>/</loc></url></urlset>", content_type='application/xml')


MIME_MAP = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.html': 'text/html; charset=utf-8',
}


def serve_root_asset(request, asset_path):
    filepath = PROJECT_ROOT / asset_path
    if filepath.exists() and filepath.is_file():
        ext = filepath.suffix.lower()
        content_type = MIME_MAP.get(ext)
        if not content_type:
            guessed, _ = mimetypes.guess_type(str(filepath))
            content_type = guessed or 'application/octet-stream'
        with open(filepath, 'rb') as f:
            return HttpResponse(f.read(), content_type=content_type)
    return HttpResponse("Asset not found", status=404)


urlpatterns = [
    path('django-admin/', admin.site.urls),

    # ── SEO & Health Endpoints ────────────────────────────────────────────────
    path('robots.txt', serve_robots_txt, name='robots-txt'),
    path('sitemap.xml', serve_sitemap_xml, name='sitemap-xml'),
    path('api/health', health_check, name='api-health'),
    path('api/health/', health_check),
    path('api/health/liveness', health_liveness, name='api-health-liveness'),
    path('api/health/liveness/', health_liveness),
    path('api/health/readiness', health_readiness, name='api-health-readiness'),
    path('api/health/readiness/', health_readiness),

    # ── Root HTML Pages ───────────────────────────────────────────────────────
    path('', serve_html_page('index.html'), name='home-page'),
    path('index.html', serve_html_page('index.html')),
    path('browse', serve_html_page('browse.html'), name='browse-page'),
    path('browse.html', serve_html_page('browse.html')),
    path('browse-books', serve_html_page('browse.html')),
    path('exchange', serve_html_page('exchange.html'), name='exchange-page'),
    path('exchange.html', serve_html_page('exchange.html')),
    path('donate', serve_html_page('donate.html'), name='donate-page'),
    path('donate.html', serve_html_page('donate.html')),
    path('login', serve_html_page('login.html'), name='login-page'),
    path('login.html', serve_html_page('login.html')),
    path('register', serve_html_page('register.html'), name='register-page'),
    path('register.html', serve_html_page('register.html')),
    path('admin', serve_html_page('admin.html'), name='admin-page'),
    path('admin.html', serve_html_page('admin.html')),
    path('dashboard', serve_html_page('dashboard.html'), name='dashboard-page'),
    path('dashboard.html', serve_html_page('dashboard.html')),
    path('about', serve_html_page('about.html'), name='about-page'),
    path('about.html', serve_html_page('about.html')),
    path('contact', serve_html_page('contact.html'), name='contact-page'),
    path('contact.html', serve_html_page('contact.html')),
    path('privacy', serve_html_page('privacy.html'), name='privacy-page'),
    path('privacy.html', serve_html_page('privacy.html')),
    path('terms', serve_html_page('terms.html'), name='terms-page'),
    path('terms.html', serve_html_page('terms.html')),
    path('forgot-password', serve_html_page('forgot-password.html'), name='forgot-password-page'),
    path('forgot-password.html', serve_html_page('forgot-password.html')),
    path('demo', serve_html_page('demo.html'), name='demo-page'),
    path('demo.html', serve_html_page('demo.html')),

    # ── Compatibility REST Endpoints (/api/*) ──────────────────────────────────
    path('api/register', RegisterView.as_view(), name='api-register'),
    path('api/register/', RegisterView.as_view()),
    path('api/login', CustomLoginView.as_view(), name='api-login'),
    path('api/login/', CustomLoginView.as_view()),
    path('api/logout', LogoutView.as_view(), name='api-logout'),
    path('api/logout/', LogoutView.as_view()),
    path('api/token/login/', TokenObtainPairView.as_view(), name='api-token-login'),
    path('api/token/login', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('api/token/refresh', TokenRefreshView.as_view()),
    path('api/profile', UserProfileView.as_view(), name='api-profile'),
    path('api/profile/', UserProfileView.as_view()),
    path('api/books', BookListCreateView.as_view(), name='api-books'),
    path('api/books/', BookListCreateView.as_view()),
    path('api/books/<int:pk>/', BookDetailView.as_view(), name='api-book-detail'),
    path('api/books/<int:pk>', BookDetailView.as_view()),
    path('api/statistics', statistics_api, name='api-statistics'),
    path('api/statistics/', statistics_api),
    path('api/admin/stats', AdminStatsView.as_view(), name='api-admin-stats'),
    path('api/admin/stats/', AdminStatsView.as_view()),
    path('api/admin/users', UserListView.as_view(), name='api-admin-users'),
    path('api/admin/users/', UserListView.as_view()),
    path('api/admin/users/<uuid:pk>/', UserAdminDetailView.as_view(), name='api-admin-user-detail'),
    path('api/admin/users/<uuid:pk>', UserAdminDetailView.as_view()),
    path('api/admin/overview', AdminOverviewView.as_view(), name='api-admin-overview'),
    path('api/admin/overview/', AdminOverviewView.as_view()),
    path('api/admin/analytics', AdminAnalyticsView.as_view(), name='api-admin-analytics'),
    path('api/admin/analytics/', AdminAnalyticsView.as_view()),
    path('api/admin/system-health', AdminSystemHealthView.as_view(), name='api-admin-system-health'),
    path('api/admin/system-health/', AdminSystemHealthView.as_view()),
    path('api/admin/broadcast', AdminBroadcastNotificationView.as_view(), name='api-admin-broadcast'),
    path('api/admin/broadcast/', AdminBroadcastNotificationView.as_view()),
    path('api/admin/export', AdminReportExportView.as_view(), name='api-admin-export'),
    path('api/admin/export/', AdminReportExportView.as_view()),
    path('api/admin/logs', ActivityLogListView.as_view(), name='api-admin-logs'),
    path('api/admin/logs/', ActivityLogListView.as_view()),
    path('api/exchanges', ExchangeProposalListCreateView.as_view(), name='api-exchanges'),
    path('api/exchanges/', ExchangeProposalListCreateView.as_view()),
    path('api/exchanges/<uuid:pk>/', ExchangeProposalDetailView.as_view(), name='api-exchange-detail'),
    path('api/donations', DonationClaimListCreateView.as_view(), name='api-donations'),
    path('api/donations/', DonationClaimListCreateView.as_view()),
    path('api/donations/<int:pk>/', DonationClaimDetailView.as_view(), name='api-donation-detail'),
    path('api/messages', ChatMessageListCreateView.as_view(), name='api-messages'),
    path('api/messages/', ChatMessageListCreateView.as_view()),
    path('api/wishlist', WishlistListView.as_view(), name='api-wishlist'),
    path('api/wishlist/', WishlistListView.as_view()),
    path('api/wishlist/toggle', WishlistToggleView.as_view(), name='api-wishlist-toggle'),
    path('api/wishlist/toggle/', WishlistToggleView.as_view()),
    path('api/payments/intent', CreatePaymentIntentView.as_view(), name='api-payment-intent'),
    path('api/payments/intent/', CreatePaymentIntentView.as_view()),
    path('api/ai/recommend', AIRecommendationView.as_view(), name='api-ai-recommend'),
    path('api/ai/recommend/', AIRecommendationView.as_view()),
    path('api/ai/assistant', AIAssistantView.as_view(), name='api-ai-assistant'),
    path('api/ai/assistant/', AIAssistantView.as_view()),

    # ── API v1 Versioned Endpoint Routes ──────────────────────────────────────
    path('api/v1/auth/', include(('apps.users.urls', 'users'), namespace='v1-users')),
    path('api/v1/users/', include(('apps.users.urls', 'users_direct'), namespace='v1-users-direct')),
    path('api/v1/books/', include(('apps.books.urls', 'books'), namespace='v1-books')),
    path('api/v1/exchange/', include(('apps.exchange.urls', 'exchange'), namespace='v1-exchange')),
    path('api/v1/donations/', include(('apps.donations.urls', 'donations'), namespace='v1-donations')),
    path('api/v1/colleges/', include(('apps.colleges.urls', 'colleges'), namespace='v1-colleges')),
    path('api/v1/marketplace/', include(('apps.marketplace.urls', 'marketplace'), namespace='v1-marketplace')),
    path('api/v1/search/', include(('apps.search_engine.urls', 'search_engine'), namespace='v1-search')),
    path('api/v1/ai/', include(('apps.ai.urls', 'ai'), namespace='v1-ai')),
    path('api/v1/chat/', include(('apps.chat.urls', 'chat'), namespace='v1-chat')),
    path('api/v1/calls/', include(('apps.calls.urls', 'calls'), namespace='v1-calls')),
    path('api/v1/notifications/', include(('apps.notifications.urls', 'notifications'), namespace='v1-notifications')),
    path('api/v1/payments/', include(('apps.payments.urls', 'payments'), namespace='v1-payments')),
    path('api/v1/public/', include(('apps.public_api.urls', 'public_api'), namespace='v1-public-api')),
    path('api/v1/analytics/', include(('apps.analytics.urls', 'analytics'), namespace='v1-analytics')),
    path('api/v1/admin-portal/', include(('apps.admin_portal.urls', 'admin_portal'), namespace='v1-admin-portal')),

    # Static Assets & Catch-All Asset Route
    re_path(r'^(?P<asset_path>.+\.(css|js|png|jpg|jpeg|svg|json|ico|woff2|woff|ttf|pdf))$', serve_root_asset),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
