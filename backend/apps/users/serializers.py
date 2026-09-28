from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, TwoFactorAuth, DeviceTrust


class PublicUserSerializer(serializers.ModelSerializer):
    """Safe public representation of a user without sensitive private fields."""
    college_name = serializers.CharField(source='college.name', read_only=True, default='')
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    class Meta:
        model = User
        fields = ('id', 'full_name', 'college_name', 'department_name', 'role', 'avatar_url', 'is_college_verified')
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    """Full user profile representation for authenticated owners and staff/admins."""
    college_name = serializers.CharField(source='college.name', read_only=True, default='')
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone_number',
            'college', 'college_name', 'department', 'department_name',
            'enrollment_number', 'semester',
            'role', 'avatar_url', 'is_college_verified', 'is_2fa_enabled',
            'date_joined', 'is_active', 'is_staff', 'is_superuser'
        )
        read_only_fields = (
            'id', 'email', 'role', 'is_staff', 'is_superuser',
            'is_college_verified', 'is_2fa_enabled', 'date_joined', 'is_active'
        )

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        is_admin = user and (
            user.is_staff or user.is_superuser or
            getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
        )
        # Prevent non-admin users from altering security-sensitive attributes
        if not is_admin:
            for sensitive_field in ('role', 'is_staff', 'is_superuser', 'is_college_verified', 'is_2fa_enabled', 'is_active'):
                attrs.pop(sensitive_field, None)
        return attrs


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    enrollment = serializers.CharField(write_only=True, required=False, allow_blank=True)
    college_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    branch = serializers.CharField(write_only=True, required=False, allow_blank=True)
    semester = serializers.IntegerField(required=False, default=1)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'name', 'enrollment', 'college_name', 'branch', 'semester', 'college', 'department', 'phone_number')

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return normalized

    def validate(self, attrs):
        # Allow 'name' as alias for 'full_name' for frontend compatibility
        full_name = attrs.get('full_name') or attrs.get('name', '').strip()
        if not full_name:
            raise serializers.ValidationError({'full_name': 'Full name is required.'})
        attrs['full_name'] = full_name
        attrs.pop('name', None)

        password = attrs.get('password')
        if password and len(password) < 6:
            raise serializers.ValidationError({'password': 'Password must be at least 6 characters.'})

        return attrs

    def create(self, validated_data):
        enrollment = validated_data.pop('enrollment', '').strip()
        college_name = validated_data.pop('college_name', '').strip()
        branch = validated_data.pop('branch', '').strip()
        semester = validated_data.pop('semester', 1)

        college = validated_data.get('college')
        department = validated_data.get('department')

        from apps.colleges.models import College, Department
        if not college and college_name:
            college, _ = College.objects.get_or_create(
                name=college_name,
                defaults={'code': college_name[:10].upper().replace(' ', ''), 'city': 'Gujarat', 'state': 'Gujarat'}
            )

        if not department and branch and college:
            department, _ = Department.objects.get_or_create(
                college=college,
                code=branch.upper(),
                defaults={'name': f'{branch.upper()} Department'}
            )

        # Verified college student if enrollment or college is provided
        is_verified = bool(enrollment or college)

        clean_email = validated_data['email'].strip().lower()
        user = User.objects.create_user(
            email=clean_email,
            password=validated_data['password'],
            full_name=validated_data['full_name'].strip(),
            college=college,
            department=department,
            enrollment_number=enrollment or None,
            semester=semester,
            is_college_verified=is_verified,
            phone_number=validated_data.get('phone_number', '')
        )
        return user


RegisterSerializer = UserRegisterSerializer


class UserAdminSerializer(serializers.ModelSerializer):
    """Admin-facing user serializer for listing and updating user accounts."""
    college_name = serializers.CharField(source='college.name', read_only=True, default='')
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone_number',
            'college', 'college_name', 'department', 'department_name',
            'enrollment_number', 'semester',
            'role', 'avatar_url', 'is_college_verified', 'is_2fa_enabled',
            'date_joined', 'last_login', 'is_active', 'is_staff', 'is_superuser'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')

    def validate(self, attrs):
        request = self.context.get('request')
        actor = getattr(request, 'user', None) if request else None

        if not actor or not (actor.is_staff or actor.is_superuser or getattr(actor, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')):
            raise serializers.ValidationError('You do not have administrative permissions to perform this action.')

        # Role change validation
        new_role = attrs.get('role')
        if new_role and self.instance and self.instance.role != new_role:
            is_super = actor.is_superuser or getattr(actor, 'role', '').upper() == 'SUPER_ADMIN'
            if not is_super:
                raise serializers.ValidationError({'role': 'Only Super Administrators can assign or modify administrative roles.'})
            if new_role == 'SUPER_ADMIN' and not (actor.is_superuser or getattr(actor, 'role', '').upper() == 'SUPER_ADMIN'):
                raise serializers.ValidationError({'role': 'Only a Super Administrator can assign the Super Admin role.'})

        # is_staff / is_superuser changes
        if ('is_staff' in attrs or 'is_superuser' in attrs) and not actor.is_superuser:
            raise serializers.ValidationError('Only Django superusers can modify is_staff or is_superuser flags.')

        return attrs


class UserAdminDetailSerializer(UserAdminSerializer):
    """Detailed user serializer including nested resource counts and recent activity."""
    books_count = serializers.SerializerMethodField()
    exchanges_count = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()
    recent_books = serializers.SerializerMethodField()
    recent_exchanges = serializers.SerializerMethodField()
    recent_donations = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()

    class Meta(UserAdminSerializer.Meta):
        fields = UserAdminSerializer.Meta.fields + (
            'books_count', 'exchanges_count', 'donations_count',
            'recent_books', 'recent_exchanges', 'recent_donations', 'recent_activity'
        )

    def get_books_count(self, obj):
        return obj.listed_books.count() if hasattr(obj, 'listed_books') else 0

    def get_exchanges_count(self, obj):
        from apps.exchange.models import ExchangeProposal
        from django.db.models import Q
        return ExchangeProposal.objects.filter(Q(proposer=obj) | Q(target_book__seller=obj)).count()

    def get_donations_count(self, obj):
        from apps.donations.models import DonationClaim
        from django.db.models import Q
        return DonationClaim.objects.filter(Q(claimer=obj) | Q(book__seller=obj)).count()

    def get_recent_books(self, obj):
        from apps.books.models import Book
        books = Book.objects.filter(seller=obj).order_by('-created_at')[:5]
        return [{
            'id': b.id,
            'title': b.title,
            'price': float(b.price),
            'status': b.status,
            'mode': b.mode,
            'created_at': b.created_at.isoformat() if hasattr(b, 'created_at') and b.created_at else None
        } for b in books]

    def get_recent_exchanges(self, obj):
        from apps.exchange.models import ExchangeProposal
        from django.db.models import Q
        exchanges = ExchangeProposal.objects.filter(
            Q(proposer=obj) | Q(target_book__seller=obj)
        ).select_related('target_book', 'proposer').order_by('-created_at')[:5]
        return [{
            'id': str(ex.id),
            'target_book_title': ex.target_book.title if ex.target_book else 'Unknown',
            'status': ex.status,
            'is_proposer': ex.proposer_id == obj.id,
            'created_at': ex.created_at.isoformat() if ex.created_at else None
        } for ex in exchanges]

    def get_recent_donations(self, obj):
        from apps.donations.models import DonationClaim
        from django.db.models import Q
        claims = DonationClaim.objects.filter(
            Q(claimer=obj) | Q(book__seller=obj)
        ).select_related('book', 'claimer').order_by('-created_at')[:5]
        return [{
            'id': cl.id,
            'book_title': cl.book.title if cl.book else 'Unknown',
            'status': cl.status,
            'is_claimer': cl.claimer_id == obj.id,
            'created_at': cl.created_at.isoformat() if cl.created_at else None
        } for cl in claims]

    def get_recent_activity(self, obj):
        from apps.analytics.models import ActivityLog
        logs = ActivityLog.objects.filter(user=obj).order_by('-created_at')[:5]
        return [{
            'id': str(l.id),
            'action': l.action,
            'title': l.title,
            'created_at': l.created_at.isoformat() if l.created_at else None
        } for l in logs]
