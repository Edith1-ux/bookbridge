from django.contrib import admin
from .models import AcademicResource, Listing, EscrowTransaction


@admin.register(AcademicResource)
class AcademicResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'uploader', 'condition', 'gtu_code', 'created_at')
    list_filter = ('resource_type', 'condition', 'created_at')
    search_fields = ('title', 'author', 'gtu_code', 'uploader__email')


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('resource', 'seller', 'listing_type', 'status', 'price', 'created_at')
    list_filter = ('listing_type', 'status', 'created_at')
    search_fields = ('resource__title', 'seller__email')


@admin.register(EscrowTransaction)
class EscrowTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'buyer', 'seller', 'amount', 'is_escrow_held', 'is_completed', 'created_at')
    list_filter = ('is_escrow_held', 'is_completed', 'created_at')
    search_fields = ('buyer__email', 'seller__email', 'listing__resource__title')
