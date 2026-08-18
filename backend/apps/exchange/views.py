from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import ExchangeProposal
from .serializers import ExchangeProposalSerializer

class ExchangeProposalListCreateView(generics.ListCreateAPIView):
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ExchangeProposal.objects.filter(
            Q(proposer=user) | Q(target_book__seller=user)
        ).select_related('proposer', 'target_book', 'offered_book')

    def perform_create(self, serializer):
        serializer.save(proposer=self.request.user)

class ExchangeProposalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ExchangeProposal.objects.filter(
            Q(proposer=user) | Q(target_book__seller=user)
        )
