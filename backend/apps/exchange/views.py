from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import ExchangeProposal
from .serializers import ExchangeProposalSerializer


class ExchangeProposalListCreateView(generics.ListCreateAPIView):
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
        if is_admin:
            return ExchangeProposal.objects.all().select_related(
                'proposer', 'target_book', 'offered_book', 'target_book__seller'
            ).order_by('-created_at')

        return ExchangeProposal.objects.filter(
            Q(proposer=user) | Q(target_book__seller=user)
        ).select_related(
            'proposer', 'target_book', 'offered_book', 'target_book__seller'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(proposer=self.request.user)
        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=self.request.user,
            action='EXCHANGE_PROPOSAL',
            title=f"Exchange proposed for: {instance.target_book.title}",
            details={
                'proposal_id': str(instance.id),
                'target_book_id': instance.target_book.id,
                'target_book_title': instance.target_book.title,
                'offered_book_title': instance.offered_book_title or (instance.offered_book.title if instance.offered_book else None)
            }
        )


class ExchangeProposalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
        if is_admin:
            return ExchangeProposal.objects.all().select_related(
                'proposer', 'target_book', 'offered_book', 'target_book__seller'
            )
        return ExchangeProposal.objects.filter(
            Q(proposer=user) | Q(target_book__seller=user)
        ).select_related(
            'proposer', 'target_book', 'offered_book', 'target_book__seller'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        
        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=self.request.user,
            action='EXCHANGE_STATUS',
            title=f"Exchange proposal {instance.status.upper()} for: {instance.target_book.title}",
            details={
                'proposal_id': str(instance.id),
                'status': instance.status,
                'target_book_title': instance.target_book.title
            }
        )

        if instance.status == 'completed':
            # Mark the target book and offered book as Exchanged/Sold if appropriate
            target_book = instance.target_book
            target_book.status = 'Exchanged'
            target_book.save(update_fields=['status'])

            if instance.offered_book:
                offered_book = instance.offered_book
                offered_book.status = 'Exchanged'
                offered_book.save(update_fields=['status'])
