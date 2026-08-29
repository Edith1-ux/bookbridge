import uuid
from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('REGISTER', 'User Registration'),
        ('BOOK_SELL', 'Book Listed for Sale'),
        ('BOOK_EXCHANGE', 'Book Listed for Exchange'),
        ('BOOK_DONATE', 'Book Listed for Donation'),
        ('BUY_REQUEST', 'Book Buy / Handover Request'),
        ('EXCHANGE_PROPOSAL', 'Exchange Proposal Created'),
        ('EXCHANGE_STATUS', 'Exchange Status Updated'),
        ('DONATION_CLAIM', 'Donation Claimed'),
        ('DONATION_STATUS', 'Donation Status Updated'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    user_email = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    user_name = models.CharField(max_length=255, blank=True, null=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    title = models.CharField(max_length=255)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] {self.user_email or 'Anonymous'}: {self.title} ({self.created_at})"


def log_activity(request=None, user=None, action='UNKNOWN', title='', details=None):
    """Utility function to safely create activity audit records without breaking main request flow."""
    try:
        ip = None
        ua = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
            ua = request.META.get('HTTP_USER_AGENT')
            if not user and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user

        user_email = getattr(user, 'email', None) if user else None
        user_name = getattr(user, 'full_name', getattr(user, 'name', None)) if user else None

        return ActivityLog.objects.create(
            user=user if user and user.is_authenticated else None,
            user_email=user_email,
            user_name=user_name,
            action=action,
            title=title,
            details=details or {},
            ip_address=ip,
            user_agent=ua
        )
    except Exception:
        # Prevent database logging errors from interfering with primary business operations
        return None
