from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from config.page_views import serve_html_page, statistics_api
from apps.users.views import RegisterView, CustomLoginView, UserListView, AdminStatsView
from apps.books.views import BookListCreateView, BookDetailView
from apps.exchange.views import ExchangeProposalListCreateView
from apps.donations.views import DonationClaimListCreateView

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # ── Root HTML Pages ───────────────────────────────────────────────────────
    path('', serve_html_page('index.html'), name='home-page'),
    path('index.html', serve_html_page('index.html')),
    path('browse', serve_html_page('browse.html'), name='browse-page'),
    path('browse.html', serve_html_page('browse.html')),
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
    path('api/books', BookListCreateView.as_view(), name='api-books'),
    path('api/books/', BookListCreateView.as_view()),
    path('api/books/<int:pk>/', BookDetailView.as_view(), name='api-book-detail'),
    path('api/statistics', statistics_api, name='api-statistics'),
    path('api/statistics/', statistics_api),
    path('api/admin/stats', AdminStatsView.as_view(), name='api-admin-stats'),
    path('api/admin/stats/', AdminStatsView.as_view()),
    path('api/admin/users', UserListView.as_view(), name='api-admin-users'),
    path('api/admin/users/', UserListView.as_view()),
    path('api/exchanges', ExchangeProposalListCreateView.as_view(), name='api-exchanges'),
    path('api/exchanges/', ExchangeProposalListCreateView.as_view()),
    path('api/donations', DonationClaimListCreateView.as_view(), name='api-donations'),
    path('api/donations/', DonationClaimListCreateView.as_view()),

    # ── API v1 Versioned Endpoint Routes ──────────────────────────────────────
    path('api/v1/auth/', include(('apps.users.urls', 'users'), namespace='v1-users')),
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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
