from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import DonationClaim
from .serializers import DonationClaimSerializer


class DonationClaimListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
        if is_admin:
            return DonationClaim.objects.all().select_related(
                'claimer', 'book', 'book__seller'
            ).order_by('-created_at')

        return DonationClaim.objects.filter(
            Q(claimer=user) | Q(book__seller=user)
        ).select_related(
            'claimer', 'book', 'book__seller'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(claimer=self.request.user)
        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=self.request.user,
            action='DONATION_CLAIM',
            title=f"Donation claimed for: {instance.book.title}",
            details={
                'claim_id': instance.id,
                'book_id': instance.book.id,
                'book_title': instance.book.title,
                'message': instance.message
            }
        )


class DonationClaimDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DonationClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or user.is_superuser or getattr(user, 'role', '').upper() in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
        if is_admin:
            return DonationClaim.objects.all().select_related('claimer', 'book', 'book__seller')
        return DonationClaim.objects.filter(
            Q(claimer=user) | Q(book__seller=user)
        ).select_related('claimer', 'book', 'book__seller')

    def perform_update(self, serializer):
        instance = serializer.save()
        
        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=self.request.user,
            action='DONATION_STATUS',
            title=f"Donation claim {instance.status.upper()} for: {instance.book.title}",
            details={
                'claim_id': instance.id,
                'status': instance.status,
                'book_title': instance.book.title
            }
        )

        if instance.status == 'completed':
            book = instance.book
            book.status = 'Donated'
            book.save(update_fields=['status'])
