from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User


class FlexibleAuthBackend(ModelBackend):
    """
    Enhanced authentication backend allowing login via:
    1. Full email (e.g. admin@bookbridge.com, admin@bookbridge.edu, admin@rcti.ac.in, pved95605@gmail.com)
    2. Admin alias ('admin', 'superadmin', 'superuser')
    3. Student alias ('student', 'demostudent')
    4. Student enrollment number (e.g. 246400307192)
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
                    password.lower() in ('admin@123', 'admin@123456', 'admin123', 'admin') and
                    (su.check_password('Admin@123') or su.check_password('Admin@123456'))
                ):
                    return su

            user = superusers[0] if superusers else None
        elif clean_id.lower() in ('student', 'demostudent'):
            student_users = list(User.objects.filter(role='STUDENT', is_active=True).order_by('-date_joined'))
            for st in student_users:
                if st.check_password(password) or (
                    password.lower() in ('student@123', 'student', 'password123!') and
                    (st.check_password('Student@123') or st.check_password('Password123!'))
                ):
                    return st
            user = student_users[0] if student_users else None
        else:
            user = User.objects.filter(
                Q(email__iexact=clean_id) |
                Q(enrollment_number__iexact=clean_id) |
                Q(full_name__iexact=clean_id) |
                Q(phone_number__iexact=clean_id) |
                Q(email__istartswith=f"{clean_id}@"),
                is_active=True
            ).first()

        if user:
            clean_pw = str(password).strip()
            # Check exact password and stripped password
            if user.check_password(password) or user.check_password(clean_pw):
                return user
            # Superadmin standard password variations
            if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
                if (
                    clean_pw.lower() in ('admin@123', 'admin@123456', 'admin123', 'admin') and
                    (user.check_password('Admin@123') or user.check_password('Admin@123456'))
                ):
                    return user
            # Student standard password variations
            if getattr(user, 'role', '') == 'STUDENT':
                if (
                    clean_pw.lower() in ('student@123', 'student', 'password123!') and
                    (user.check_password('Student@123') or user.check_password('Password123!'))
                ):
                    return user

        return None
