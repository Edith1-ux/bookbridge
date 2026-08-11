from django.urls import path
from .views import DonationClaimListCreateView

urlpatterns = [
    path('claims/', DonationClaimListCreateView.as_view(), name='donation-claims'),
]
