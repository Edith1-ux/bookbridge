from rest_framework import serializers
from .models import DonationClaim
from apps.books.serializers import BookSerializer

class DonationClaimSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = DonationClaim
        fields = ('id', 'book', 'book_details', 'claimer', 'message', 'status', 'created_at')
        read_only_fields = ('id', 'claimer', 'status', 'created_at')
