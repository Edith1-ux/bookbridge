from django.urls import path
from .views import AdminOverviewView

urlpatterns = [
    path('overview/', AdminOverviewView.as_view(), name='admin-overview'),
]
