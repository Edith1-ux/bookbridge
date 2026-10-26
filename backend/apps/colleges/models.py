import uuid
from django.db import models


class College(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, db_index=True)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'colleges'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class CollegeDomain(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='domains')
    domain = models.CharField(max_length=255, unique=True, db_index=True) # e.g. "gtu.ac.in", "nirmauni.ac.in"
    is_verified = models.BooleanField(default=True)

    class Meta:
        db_table = 'college_domains'

    def __str__(self):
        return self.domain


class CollegeBranding(models.Model):
    college = models.OneToOneField(College, on_delete=models.CASCADE, primary_key=True, related_name='branding')
    logo_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    primary_color = models.CharField(max_length=20, default='#059669')
    accent_color = models.CharField(max_length=20, default='#10B981')
    custom_css = models.TextField(blank=True)

    class Meta:
        db_table = 'college_branding'


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255) # e.g. "Computer Engineering"
    code = models.CharField(max_length=50) # e.g. "CE"
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'
        unique_together = ('college', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.college.code}"


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255) # e.g. "Data Structures & Algorithms"
    code = models.CharField(max_length=50, db_index=True) # e.g. "3140705" (GTU Code)
    semester = models.PositiveIntegerField(default=1, db_index=True)
    syllabus_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = 'courses'
        unique_together = ('department', 'code')

    def __str__(self):
        return f"{self.code}: {self.name} (Sem {self.semester})"
