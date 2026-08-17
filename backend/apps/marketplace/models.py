import uuid
from django.db import models
from apps.users.models import User
from apps.colleges.models import College, Department, Course


class AcademicResource(models.Model):
    RESOURCE_TYPES = (
        ('BOOK', 'Textbook / Reference Book'),
        ('NOTE', 'Class Notes / Lecture Notes'),
        ('LAB_MANUAL', 'GTU Lab Manual'),
        ('ASSIGNMENT', 'Assignment Solution'),
        ('PPT', 'Presentation Slides'),
        ('QUESTION_PAPER', 'Previous Year Question Paper'),
        ('RESEARCH_PAPER', 'Research Paper'),
        ('PROJECT', 'Academic Project'),
        ('SOURCE_CODE', 'Source Code Repository'),
        ('RECORDED_LECTURE', 'Recorded Lecture'),
        ('VIDEO', 'Video Tutorial'),
        ('CHEAT_SHEET', 'Exam Revision Cheat Sheet'),
        ('STUDY_PLAN', 'Semester Study Plan'),
    )

    CONDITION_CHOICES = (
        ('NEW', 'Brand New / Unused'),
        ('LIKE_NEW', 'Like New / Minimal Wear'),
        ('GOOD', 'Good / Readable'),
        ('ANNOTATED', 'Annotated / Highlighted Notes'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='resources')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    uploader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_resources')

    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, blank=True)
    isbn = models.CharField(max_length=20, blank=True, db_index=True)
    gtu_code = models.CharField(max_length=50, blank=True, db_index=True)
    description = models.TextField()
    resource_type = models.CharField(max_length=30, choices=RESOURCE_TYPES, default='BOOK', db_index=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    
    file_url = models.URLField(blank=True, null=True) # For digital attachments (PDF/ZIP)
    cover_image_url = models.URLField(blank=True, null=True)
    is_watermarked = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'academic_resources'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.get_resource_type_display()}]"


class Listing(models.Model):
    LISTING_TYPES = (
        ('SELL', 'Sell'),
        ('BUY', 'Buy Request'),
        ('EXCHANGE', '100% Free Swap'),
        ('DONATE', 'Free Donation'),
        ('BORROW', 'Borrow Request'),
        ('RENT', 'Rental'),
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('RESERVED', 'Reserved in Escrow'),
        ('COMPLETED', 'Completed Trade'),
        ('CANCELLED', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource = models.ForeignKey(AcademicResource, on_delete=models.CASCADE, related_name='listings')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='active_listings')
    
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPES, default='SELL', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # For rentals/borrow
    qr_code_url = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_listings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Listing: {self.resource.title} ({self.listing_type}) - ₹{self.price}"


class EscrowTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='transactions')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_escrow_held = models.BooleanField(default=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'escrow_transactions'
