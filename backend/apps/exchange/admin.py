from django.contrib import admin
from .models import ExchangeProposal


@admin.register(ExchangeProposal)
class ExchangeProposalAdmin(admin.ModelAdmin):
    list_display = ('proposer', 'target_book', 'offered_book_title', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('proposer__email', 'target_book__title', 'offered_book_title')
    ordering = ('-created_at',)
