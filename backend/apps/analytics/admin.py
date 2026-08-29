from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'user_email', 'user_name', 'title', 'ip_address')
    list_filter = ('action', 'created_at')
    search_fields = ('title', 'user_email', 'user_name', 'ip_address')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)
