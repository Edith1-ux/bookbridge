from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'sender', 'sender_email', 'receiver_email', 'book_title', 'text', 'timestamp')
        read_only_fields = ('id', 'sender', 'timestamp')
