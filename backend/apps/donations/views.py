from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import DonationClaim
from .serializers import DonationClaimSerializer

class DonationClaimListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DonationClaim.objects.filter(claimer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(claimer=self.request.user)
