from rest_framework import serializers
from .models import User, TwoFactorAuth, DeviceTrust


class UserSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone_number', 'college', 'college_name', 'department', 'department_name', 'role', 'avatar_url', 'is_college_verified', 'is_2fa_enabled', 'date_joined')
        read_only_fields = ('id', 'is_college_verified', 'date_joined')


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'college', 'department')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            college=validated_data.get('college'),
            department=validated_data.get('department'),
        )
        return user
