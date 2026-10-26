from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(
            Q(sender=self.request.user) | Q(receiver_email=self.request.user.email)
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ChatInboxView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target_email = request.query_params.get('with')
        if target_email:
            messages = ChatMessage.objects.filter(
                (Q(sender=request.user) & Q(receiver_email=target_email)) |
                (Q(sender__email=target_email) & Q(receiver_email=request.user.email))
            )
        else:
            messages = ChatMessage.objects.filter(
                Q(sender=request.user) | Q(receiver_email=request.user.email)
            )

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
