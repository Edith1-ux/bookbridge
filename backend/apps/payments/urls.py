from django.urls import path
from .views import WalletBalanceView, CreatePaymentIntentView

urlpatterns = [
    path('wallet/', WalletBalanceView.as_view(), name='wallet-balance'),
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
]
