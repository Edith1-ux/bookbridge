from django.urls import path
from .views import DonationClaimListCreateView, DonationClaimDetailView

urlpatterns = [
    path('', DonationClaimListCreateView.as_view(), name='donation-claims'),
    path('claims/', DonationClaimListCreateView.as_view(), name='donation-claims-alt'),
    path('claims/<int:pk>/', DonationClaimDetailView.as_view(), name='donation-claim-detail'),
    path('<int:pk>/', DonationClaimDetailView.as_view(), name='donation-claim-detail-direct'),
]
