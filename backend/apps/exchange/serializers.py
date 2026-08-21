from rest_framework import serializers
from .models import ExchangeProposal
from apps.books.models import Book
from apps.books.serializers import BookSerializer
from apps.users.serializers import PublicUserSerializer


class ExchangeProposalSerializer(serializers.ModelSerializer):
    proposer_details = PublicUserSerializer(source='proposer', read_only=True)
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

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if self.instance is None:
            # Creation validation
            target_book = attrs.get('target_book')
            if not target_book:
                raise serializers.ValidationError({'target_book': 'Target book is required.'})

            if user and target_book.seller == user:
                raise serializers.ValidationError({'target_book': 'You cannot propose an exchange for your own book.'})

            offered_book = attrs.get('offered_book')
            if offered_book and user and offered_book.seller != user:
                raise serializers.ValidationError({'offered_book': 'You can only offer books that you own.'})

            # Check duplicate pending proposals
            if user and ExchangeProposal.objects.filter(
                proposer=user,
                target_book=target_book,
                status='pending'
            ).exists():
                raise serializers.ValidationError('You already have an active pending exchange proposal for this book.')
        else:
            # Update validation (status transition)
            new_status = attrs.get('status')
            if new_status and new_status != self.instance.status:
                current_status = self.instance.status
                is_admin = user and (user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'))
                is_target_seller = user and self.instance.target_book.seller == user
                is_proposer = user and self.instance.proposer == user

                valid_transitions = {
                    'pending': ['accepted', 'rejected'],
                    'accepted': ['completed', 'rejected'],
                    'rejected': [],
                    'completed': [],
                }

                if not is_admin and new_status not in valid_transitions.get(current_status, []):
                    raise serializers.ValidationError(
                        f"Cannot transition status from '{current_status}' to '{new_status}'."
                    )

                # Permission rules per transition
                if new_status in ('accepted', 'rejected') and not (is_target_seller or is_admin or (is_proposer and new_status == 'rejected')):
                    raise serializers.ValidationError("Only the book owner or an administrator can accept or reject this proposal.")

                if new_status == 'completed' and not (is_target_seller or is_proposer or is_admin):
                    raise serializers.ValidationError("Only exchange participants or an administrator can mark an exchange as completed.")

        return attrs
