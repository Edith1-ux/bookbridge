from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver_email = models.EmailField(blank=True, null=True)
    book_title = models.CharField(max_length=255, blank=True, null=True)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['sender', 'timestamp'], name='chat_sender_ts_idx'),
            models.Index(fields=['receiver_email', 'timestamp'], name='chat_recver_ts_idx'),
            models.Index(fields=['timestamp'], name='chat_ts_idx'),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} to {self.receiver_email}: {self.text[:30]}"
