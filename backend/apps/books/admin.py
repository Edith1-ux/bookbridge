from django.contrib import admin
from .models import Book, Wishlist


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'branch', 'semester', 'mode', 'price', 'condition', 'status', 'seller', 'created_at')
    list_filter = ('mode', 'status', 'branch', 'semester', 'condition')
    search_fields = ('title', 'author', 'gtu_code', 'subject', 'seller__email', 'seller__full_name')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'created_at')
    search_fields = ('user__email', 'book__title')
    ordering = ('-created_at',)
