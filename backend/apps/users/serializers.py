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
            'date_joined', 'is_active', 'is_staff'
        )
        read_only_fields = ('id', 'is_college_verified', 'date_joined', 'is_staff')


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    enrollment = serializers.CharField(write_only=True, required=False, allow_blank=True)
    college_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    branch = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'name', 'enrollment', 'college_name', 'branch', 'college', 'department', 'phone_number')

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
            is_college_verified=is_verified,
            phone_number=validated_data.get('phone_number', '')
        )
        return user


RegisterSerializer = UserRegisterSerializer
