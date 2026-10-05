import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('CAMPUS_DEAL', 'Campus Direct Handover'),
        ('ONLINE_RAZORPAY', 'Razorpay Online (UPI / Card / NetBanking)'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('AUTHORIZED', 'Authorized'),
        ('PAID', 'Paid / Captured'),
        ('FAILED', 'Payment Failed'),
        ('CANCELLED', 'Cancelled'),
    )

    ORDER_STATUS_CHOICES = (
        ('CREATED', 'Order Created'),
        ('RESERVED', 'Reserved in Escrow / Awaiting Meetup'),
        ('PAID', 'Payment Verified / Confirmed'),
        ('COMPLETED', 'Transaction Completed'),
        ('CANCELLED', 'Order Cancelled'),
    )

    SETTLEMENT_STATUS_CHOICES = (
        ('SETTLEMENT_PENDING_CAMPUS_HANDOVER', 'Settlement Pending Campus Handover'),
        ('TEST_CAPTURED', 'Test Mode Payment Captured (Sandbox)'),
        ('ROUTE_PENDING_APPROVAL', 'Route Marketplace Approval Required'),
        ('ROUTE_TRANSFER_EXECUTED', 'Route Transfer Executed'),
        ('SETTLEMENT_FAILED', 'Settlement Failed'),
        ('NOT_APPLICABLE', 'Not Applicable'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    book = models.ForeignKey('books.Book', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    book_title = models.CharField(max_length=255)
    
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_orders')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_orders')
    
    # Financial breakdowns (server-calculated, never trust frontend client)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Total price of book listing
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Configured platform fee
    seller_amount = models.DecimalField(max_digits=10, decimal_places=2)  # amount - platform_fee
    currency = models.CharField(max_length=10, default='INR')
    
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='CAMPUS_DEAL', db_index=True)
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)
    order_status = models.CharField(max_length=30, choices=ORDER_STATUS_CHOICES, default='CREATED', db_index=True)
    settlement_status = models.CharField(max_length=50, choices=SETTLEMENT_STATUS_CHOICES, default='NOT_APPLICABLE', db_index=True)
    
    # Razorpay Gateway Metadata
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    razorpay_transfer_id = models.CharField(max_length=100, blank=True, null=True)
    
    pickup_location = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'payment_status'], name='order_buyer_paystatus_idx'),
            models.Index(fields=['seller', 'payment_status'], name='order_seller_paystatus_idx'),
            models.Index(fields=['book', 'order_status'], name='order_book_status_idx'),
            models.Index(fields=['created_at', 'payment_status'], name='order_created_paystatus_idx'),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.book_title} (₹{self.amount}) [{self.payment_status}]"


class SellerPaymentAccount(models.Model):
    ACCOUNT_STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified / Active'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_account')
    razorpay_account_id = models.CharField(max_length=100, blank=True, null=True, help_text="Linked Account ID in Razorpay Route")
    account_status = models.CharField(max_length=30, choices=ACCOUNT_STATUS_CHOICES, default='NOT_STARTED', db_index=True)
    
    payout_upi_id = models.CharField(max_length=100, blank=True, null=True)
    bank_account_last4 = models.CharField(max_length=4, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments_seller_accounts'

    def __str__(self):
        return f"SellerAccount: {self.user.email} [{self.account_status}]"


class PaymentWebhookEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(max_length=100, unique=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict)
    processed = models.BooleanField(default=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments_webhook_events'
        ordering = ['-processed_at']

    def __str__(self):
        return f"WebhookEvent {self.event_id} ({self.event_type})"
