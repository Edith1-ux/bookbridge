from rest_framework import serializers
from .models import ExchangeProposal
from apps.books.serializers import BookSerializer
from apps.users.serializers import UserSerializer

class ExchangeProposalSerializer(serializers.ModelSerializer):
    proposer_details = UserSerializer(source='proposer', read_only=True)
    target_book_details = BookSerializer(source='target_book', read_only=True)
    offered_book_details = BookSerializer(source='offered_book', read_only=True)

    class Meta:
        model = ExchangeProposal
        fields = [
            'id', 'proposer', 'proposer_details',
            'target_book', 'target_book_details',
            'offered_book', 'offered_book_details',
            'offered_book_title', 'note', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'proposer', 'created_at', 'updated_at']
