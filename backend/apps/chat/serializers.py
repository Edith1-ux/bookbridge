from rest_framework import serializers

from apps.users.models import User
from .models import ChatMessage

# Messages sent to these system addresses (e.g. the Contact Support form) are allowed
# even though no real user account exists for them.
SYSTEM_EMAIL_DOMAIN = '@bookbridge.local'
MAX_MESSAGE_LENGTH = 2000


class ChatMessageSerializer(serializers.ModelSerializer):
    # Listings only expose the seller's id (never their email), so the buyer's
    # "Contact Seller" box sends receiver_id and the server finds the email.
    receiver_id = serializers.CharField(write_only=True, required=False)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            'id', 'sender', 'sender_name', 'sender_email',
            'receiver_id', 'receiver_email', 'receiver_name', 'book_title', 'text', 'timestamp',
        )
        read_only_fields = ('id', 'sender', 'sender_name', 'sender_email', 'receiver_name', 'timestamp')
        extra_kwargs = {
            # A message with no receiver can never be shown to anyone, so require it.
            # (either receiver_email or receiver_id must be sent - see validate())
            'receiver_email': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    # ── Display names ────────────────────────────────────────────────────────
    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.email

    def get_receiver_name(self, obj):
        """Look up the receiver's name once per distinct email (cached on the serializer context)."""
        email = (obj.receiver_email or '').lower()
        if not email:
            return ''
        cache = self.context.setdefault('_receiver_name_cache', {})
        if email not in cache:
            user = User.objects.filter(email__iexact=email).only('full_name', 'email').first()
            cache[email] = (user.full_name or user.email) if user else email
        return cache[email]

    # ── Validation ───────────────────────────────────────────────────────────
    def validate_text(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Message cannot be empty.')
        if len(value) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(f'Message is too long (max {MAX_MESSAGE_LENGTH} characters).')
        return value

    def validate(self, attrs):
        receiver_id = attrs.pop('receiver_id', None)
        if receiver_id is not None:
            user = None
            try:
                user = User.objects.filter(pk=receiver_id, is_active=True).first()
            except Exception:
                user = None
            if not user:
                raise serializers.ValidationError({'receiver_id': 'No BookBridge user was found.'})
            request = self.context.get('request')
            if request and request.user.is_authenticated and user.pk == request.user.pk:
                raise serializers.ValidationError({'receiver_id': 'You cannot send a message to yourself.'})
            attrs['receiver_email'] = user.email.lower()
        if not (attrs.get('receiver_email') or '').strip():
            raise serializers.ValidationError({'receiver_email': 'Choose who to send this message to.'})
        return attrs

    def validate_receiver_email(self, value):
        if not (value or '').strip():
            return ''   # validate() reports the missing receiver
        value = (value or '').strip().lower()
        request = self.context.get('request')
        if request and request.user.is_authenticated and value == (request.user.email or '').lower():
            raise serializers.ValidationError('You cannot send a message to yourself.')
        if value.endswith(SYSTEM_EMAIL_DOMAIN):
            return value
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('No BookBridge user was found with this email address.')
        return value
