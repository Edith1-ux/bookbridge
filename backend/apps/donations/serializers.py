from rest_framework import serializers
from .models import DonationClaim
from apps.books.models import Book
from apps.books.serializers import BookSerializer
from apps.users.serializers import PublicUserSerializer


class DonationClaimSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)
    claimer_details = PublicUserSerializer(source='claimer', read_only=True)

    class Meta:
        model = DonationClaim
        fields = (
            'id', 'book', 'book_details', 'claimer', 'claimer_details',
            'message', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'claimer', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if self.instance is None:
            # Creating a claim
            book = attrs.get('book')
            if not book:
                raise serializers.ValidationError({'book': 'Book is required.'})

            if user and book.seller == user:
                raise serializers.ValidationError({'book': 'You cannot claim your own donated book.'})

            if book.mode != 'donate':
                raise serializers.ValidationError({'book': 'This book is not listed for free donation.'})

            if book.status != 'Available':
                raise serializers.ValidationError({'book': 'This book is no longer available for donation.'})

            if user and DonationClaim.objects.filter(book=book, claimer=user, status='pending').exists():
                raise serializers.ValidationError('You already have an active pending claim for this book.')
        else:
            # Updating claim status
            new_status = attrs.get('status')
            if new_status and new_status != self.instance.status:
                current_status = self.instance.status
                is_admin = user and (user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'))
                is_book_owner = user and self.instance.book.seller == user
                is_claimer = user and self.instance.claimer == user

                valid_transitions = {
                    'pending': ['approved', 'rejected'],
                    'approved': ['completed', 'rejected'],
                    'rejected': [],
                    'completed': [],
                }

                if not is_admin and new_status not in valid_transitions.get(current_status, []):
                    raise serializers.ValidationError(
                        f"Cannot transition donation status from '{current_status}' to '{new_status}'."
                    )

                if new_status in ('approved', 'rejected') and not (is_book_owner or is_admin or (is_claimer and new_status == 'rejected')):
                    raise serializers.ValidationError("Only the book donor or an administrator can approve or reject this claim.")

                if new_status == 'completed' and not (is_book_owner or is_claimer or is_admin):
                    raise serializers.ValidationError("Only the donor, recipient, or an administrator can mark the donation as completed.")

        return attrs
