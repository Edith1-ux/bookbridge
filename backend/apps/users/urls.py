from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CustomLoginView, ProfileView, UserListView, UserAdminDetailView, AdminStatsView, LogoutView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('token/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('admin/users/', UserListView.as_view(), name='user-list-admin'),
    path('admin/users/<uuid:pk>/', UserAdminDetailView.as_view(), name='user-detail-admin'),
    path('admin/stats/', AdminStatsView.as_view(), name='user-stats-admin'),
]
