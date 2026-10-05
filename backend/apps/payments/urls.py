from django.urls import path
from .views import (
    WalletBalanceView,
    CreatePaymentIntentView,
    VerifyPaymentView,
    RazorpayWebhookView,
    CancelOrReleasePaymentView,
    BuyerOrdersListView,
    SellerSalesListView,
    SellerPaymentAccountView,
    AdminOrdersListView,
)

urlpatterns = [
    path('wallet/', WalletBalanceView.as_view(), name='wallet-balance'),
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent-alt'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('cancel/', CancelOrReleasePaymentView.as_view(), name='cancel-payment'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    path('my-orders/', BuyerOrdersListView.as_view(), name='my-orders'),
    path('my-sales/', SellerSalesListView.as_view(), name='my-sales'),
    path('seller-account/', SellerPaymentAccountView.as_view(), name='seller-payment-account'),
    path('admin/orders/', AdminOrdersListView.as_view(), name='admin-orders-list'),
]
