from django.urls import path
from .views import RegisterView, CustomLoginView, ProfileView, UserListView, AdminStatsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('admin/users/', UserListView.as_view(), name='user-list-admin'),
    path('admin/stats/', AdminStatsView.as_view(), name='user-stats-admin'),
]
