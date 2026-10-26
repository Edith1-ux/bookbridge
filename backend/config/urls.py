from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Versioned Endpoint Routes
    path('api/v1/auth/', include(('apps.users.urls', 'users'), namespace='v1-users')),
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
