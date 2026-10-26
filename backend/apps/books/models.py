from django.db import models
from django.conf import settings

class Book(models.Model):
    MODE_CHOICES = (
        ('sell', 'Sell'),
        ('exchange', 'Exchange'),
        ('donate', 'Donate'),
    )

    CONDITION_CHOICES = (
        ('Like New', 'Like New'),
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Worn', 'Worn'),
    )

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listed_books')
    title = models.CharField('Book Title', max_length=255)
    author = models.CharField('Author', max_length=255)
    isbn = models.CharField('ISBN Number', max_length=50, blank=True, null=True)
    gtu_code = models.CharField('GTU Subject Code', max_length=20, blank=True, null=True)
    branch = models.CharField('Department', max_length=20, default='CE')
    semester = models.IntegerField('Semester', default=1)
    edition = models.CharField('Edition', max_length=50, default='Latest Edition')
    resource_type = models.CharField('Resource Type', max_length=50, default='textbook')
    genre = models.CharField('Genre', max_length=100, default='Computer Science')
    subject = models.CharField('Subject', max_length=100, default='Computer Science')
    condition = models.CharField('Condition', max_length=20, choices=CONDITION_CHOICES, default='Good')
    language = models.CharField('Language', max_length=50, default='English')
    mode = models.CharField('Listing Type', max_length=20, choices=MODE_CHOICES, default='sell')
    price = models.DecimalField('Price in INR', max_digits=10, decimal_places=2, default=0.00)
    original_price = models.DecimalField('Original Price', max_digits=10, decimal_places=2, blank=True, null=True)
    rating = models.FloatField('Rating', default=4.8)
    exchange_for = models.CharField('Looking to Swap For', max_length=255, blank=True, null=True)
    description = models.TextField('Description', blank=True)
    location = models.CharField('Campus Pickup Location', max_length=255, default='RCTI Campus')
    cover_url = models.URLField('Cover Image URL', blank=True, null=True)
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    pdf_url = models.URLField('PDF URL', blank=True, null=True)
    pdf_file = models.FileField(upload_to='lab_manuals/', blank=True, null=True)
    status = models.CharField('Status', max_length=20, default='Available')
    views_count = models.IntegerField('Views', default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'mode'], name='book_status_mode_idx'),
            models.Index(fields=['branch', 'semester'], name='book_branch_sem_idx'),
            models.Index(fields=['gtu_code'], name='book_gtu_code_idx'),
            models.Index(fields=['created_at'], name='book_created_at_idx'),
            models.Index(fields=['seller'], name='book_seller_idx'),
        ]

    def __str__(self):
        return f"{self.title} - {self.branch} ({self.mode.upper()})"

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlists'
        unique_together = ('user', 'book')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='wish_user_created_idx'),
        ]
