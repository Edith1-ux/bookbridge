from django.contrib import admin
from .models import User, TwoFactorAuth, DeviceTrust, CollegeEmailVerification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'college', 'department', 'is_college_verified', 'is_active', 'date_joined')
    list_filter = ('role', 'is_college_verified', 'is_active', 'college', 'department')
    search_fields = ('email', 'full_name', 'phone_number')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login')


@admin.register(DeviceTrust)
class DeviceTrustAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_name', 'ip_address', 'is_trusted', 'last_login')
    list_filter = ('is_trusted',)
    search_fields = ('user__email', 'device_name', 'ip_address')
