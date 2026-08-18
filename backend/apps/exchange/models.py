import uuid
from django.db import models
from django.conf import settings
from apps.books.models import Book

class ExchangeProposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exchange_proposals')
    target_book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='received_swaps')
    offered_book = models.ForeignKey(Book, on_delete=models.SET_NULL, null=True, blank=True, related_name='offered_swaps')
    offered_book_title = models.CharField(max_length=255, blank=True, null=True)
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exchange_proposals'
        ordering = ['-created_at']

    def __str__(self):
        return f"Swap proposal by {self.proposer.full_name} for {self.target_book.title} ({self.status})"
