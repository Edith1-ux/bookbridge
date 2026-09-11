import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('SWAP_PROPOSAL', 'Swap Proposal'),
        ('SWAP_UPDATE', 'Swap Update'),
        ('DONATION_CLAIM', 'Donation Claim'),
        ('DONATION_UPDATE', 'Donation Update'),
        ('MESSAGE', 'New Message'),
        ('SYSTEM', 'System Alert'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='SYSTEM')
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at'], name='notif_recip_read_created_idx'),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"


def push_notification(recipient, title, message, notification_type='SYSTEM', link=None):
    """
    Creates a Notification record in the database and broadcasts a real-time event
    to the recipient's WebSocket channel layer group if active.
    """
    notif = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    "type": "notification_message",
                    "notification": {
                        "id": str(notif.id),
                        "title": notif.title,
                        "message": notif.message,
                        "notification_type": notif.notification_type,
                        "is_read": notif.is_read,
                        "link": notif.link,
                        "created_at": notif.created_at.isoformat(),
                    }
                }
            )
    except Exception:
        pass
    return notif
