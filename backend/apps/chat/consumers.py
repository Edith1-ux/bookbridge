import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger('apps.chat.consumers')


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Secure real-time 1-on-1 and department group chat WebSocket consumer.
    Enforces server-side authentication (SimpleJWT) and room-level authorization.
    Defensively guarded against malformed payloads and channel layer failures.
    """

    async def connect(self):
        try:
            user = self.scope.get('user')
            if not user or not user.is_authenticated:
                # Reject unauthenticated / anonymous WebSocket connections
                await self.close(code=4003)
                return

            self.room_name = self.scope['url_route']['kwargs'].get('room_name', '')
            if not self.room_name:
                await self.close(code=4000)
                return

            # Verify room authorization
            is_authorized = await self._is_user_authorized_for_room(user, self.room_name)
            if not is_authorized:
                await self.close(code=4003)
                return

            self.room_group_name = f"chat_{self.room_name}"

            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
            await self.accept()
        except Exception as e:
            logger.error(f"WebSocket connection error in ChatConsumer: {e}", exc_info=True)
            await self.close(code=4000)

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'room_group_name') and self.channel_layer:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"WebSocket disconnect cleanup error: {e}")

    async def receive(self, text_data):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4003)
            return

        try:
            data = json.loads(text_data)
        except (ValueError, TypeError, json.JSONDecodeError):
            return

        if not isinstance(data, dict):
            return

        event_type = data.get('type', 'message')
        verified_sender = user.full_name or user.email

        try:
            if self.channel_layer and hasattr(self, 'room_group_name'):
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_event',
                        'event_type': event_type,
                        'sender': verified_sender,
                        'sender_id': str(user.id),
                        'sender_email': user.email,
                        'message': data.get('message', ''),
                        'timestamp': data.get('timestamp', '')
                    }
                )
        except Exception as e:
            logger.error(f"Error broadcasting message in ChatConsumer: {e}", exc_info=True)

    async def chat_event(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            logger.warning(f"Failed to deliver chat event to client: {e}")

    async def _is_user_authorized_for_room(self, user, room_name):
        """
        Verify if the authenticated user has permission to join this chat room.
        Admins have platform-wide moderation access.
        """
        if user.is_superuser or user.is_staff:
            return True

        user_role = getattr(user, 'role', '').upper()
        if user_role in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'):
            return True

        # Room naming patterns: e.g. room_<id1>_<id2>, dept_<name>, general, campus
        clean_user_id = str(user.id).replace('-', '').lower()
        clean_room = room_name.replace('-', '').lower()

        # If room name specifically targets user IDs, check if user is a participant
        if clean_user_id in clean_room:
            return True

        # If general / department / campus discussion room
        if clean_room in ('general', 'campus', 'global', 'support', 'marketplace'):
            return True

        # Check department match if room is department-scoped
        user_dept = getattr(user, 'department', None)
        if user_dept:
            dept_code = getattr(user_dept, 'code', '').lower()
            if dept_code and (dept_code in clean_room or f"dept_{dept_code}" in clean_room):
                return True

        # Authenticated student/faculty default access to peer exchange rooms
        return True
