import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from apps.colleges.models import College, Department


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('FACULTY', 'Faculty'),
        ('DEPT_ADMIN', 'Department Administrator'),
        ('COLLEGE_ADMIN', 'College Administrator'),
        ('SUPER_ADMIN', 'Super Administrator'),
    )

    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT', db_index=True)
    
    avatar_url = models.URLField(blank=True, null=True)
    is_college_verified = models.BooleanField(default=False, db_index=True)
    is_2fa_enabled = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.email}) - {self.role}"


class TwoFactorAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='two_factor')
    secret_key = models.CharField(max_length=64)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_2fa'


class DeviceTrust(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_fingerprint = models.CharField(max_length=255, db_index=True)
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    is_trusted = models.BooleanField(default=True)

    class Meta:
        db_table = 'user_devices'
        unique_together = ('user', 'device_fingerprint')


class CollegeEmailVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    token = models.CharField(max_length=128, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'college_email_verifications'
