from django.contrib import admin
from .models import DonationClaim


@admin.register(DonationClaim)
class DonationClaimAdmin(admin.ModelAdmin):
    list_display = ('claimer', 'book', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('claimer__email', 'book__title')
    ordering = ('-created_at',)
