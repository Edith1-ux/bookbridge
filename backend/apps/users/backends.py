from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User


class FlexibleAuthBackend(ModelBackend):
    """
    Enhanced authentication backend allowing login via:
    1. Full email (e.g. admin@bookbridge.com, admin@bookbridge.edu, admin@rcti.ac.in)
    2. Admin alias ('admin', 'superadmin', 'superuser')
    3. Student enrollment number
    With case-insensitive identifier matching and support for standard credentials.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = username or kwargs.get('email') or kwargs.get('username')
        if not identifier or not password:
            return None

        clean_id = str(identifier).strip()
        user = None

        if clean_id.lower() in ('admin', 'superadmin', 'superuser'):
            superusers = list(User.objects.filter(
                Q(is_superuser=True) | Q(role='SUPER_ADMIN'),
                is_active=True
            ).order_by('-date_joined'))

            for su in superusers:
                if su.check_password(password) or (
                    password.lower() in ('admin@123', 'admin@123456') and
                    (su.check_password('Admin@123') or su.check_password('Admin@123456'))
                ):
                    return su

            user = superusers[0] if superusers else None
        else:
            user = User.objects.filter(
                Q(email__iexact=clean_id) | Q(enrollment_number__iexact=clean_id),
                is_active=True
            ).first()

        if user:
            # Check exact password, or accept standard admin password variations for superadmin
            if user.check_password(password):
                return user
            if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
                if (
                    password.lower() in ('admin@123', 'admin@123456') and
                    (user.check_password('Admin@123') or user.check_password('Admin@123456'))
                ):
                    return user

        return None
