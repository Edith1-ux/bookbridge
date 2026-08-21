from django.urls import path
from .views import WalletBalanceView, CreatePaymentIntentView, RazorpayWebhookView

urlpatterns = [
    path('wallet/', WalletBalanceView.as_view(), name='wallet-balance'),
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent-alt'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
]
