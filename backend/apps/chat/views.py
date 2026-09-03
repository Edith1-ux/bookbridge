import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from apps.users.models import User
from apps.notifications.models import Notification

logger = logging.getLogger('apps.chat')


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatMessage.objects.filter(
            Q(sender=user) | Q(receiver_email__iexact=user.email)
        ).select_related('sender').order_by('timestamp')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        # Attempt to notify recipient if they are a registered user
        if msg.receiver_email:
            try:
                recipient = User.objects.filter(email__iexact=msg.receiver_email).first()
                if recipient and recipient != self.request.user:
                    Notification.objects.create(
                        recipient=recipient,
                        title=f"New message from {self.request.user.full_name or self.request.user.email}",
                        message=f"{msg.text[:100]}...",
                        notification_type='MESSAGE',
                        link='/dashboard.html'
                    )
            except Exception:
                logger.exception(
                    "Failed to create notification for chat message to %s", msg.receiver_email
                )


class ChatInboxView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target_email = request.query_params.get('with')
        if target_email:
            messages = ChatMessage.objects.filter(
                (Q(sender=request.user) & Q(receiver_email__iexact=target_email)) |
                (Q(sender__email__iexact=target_email) & Q(receiver_email__iexact=request.user.email))
            ).select_related('sender').order_by('timestamp')
        else:
            messages = ChatMessage.objects.filter(
                Q(sender=request.user) | Q(receiver_email__iexact=request.user.email)
            ).select_related('sender').order_by('timestamp')

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
