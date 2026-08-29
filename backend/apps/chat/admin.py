from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver_email', 'book_title', 'text', 'timestamp')
    search_fields = ('sender__email', 'receiver_email', 'book_title', 'text')
    ordering = ('-timestamp',)
