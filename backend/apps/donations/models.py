from django.db import models
from django.conf import settings

class DonationClaim(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )

    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='donation_claims')
    claimer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='donation_claims')
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donation_claims'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at'], name='don_status_created_idx'),
            models.Index(fields=['claimer', 'status'], name='don_claimer_status_idx'),
            models.Index(fields=['book', 'status'], name='don_book_status_idx'),
        ]

    def __str__(self):
        return f"Claim by {self.claimer.email} for {self.book.title} ({self.status})"
