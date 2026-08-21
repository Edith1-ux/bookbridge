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
            'role', 'avatar_url', 'is_college_verified', 'is_2fa_enabled',
            'date_joined', 'is_active', 'is_staff'
        )
        read_only_fields = ('id', 'is_college_verified', 'date_joined', 'is_staff')


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'name', 'college', 'department', 'phone_number')

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
        if password:
            try:
                validate_password(password)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': list(exc.messages)})

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            college=validated_data.get('college'),
            department=validated_data.get('department'),
            phone_number=validated_data.get('phone_number', '')
        )
        return user


RegisterSerializer = UserRegisterSerializer
