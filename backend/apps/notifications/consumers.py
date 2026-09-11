import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger('apps.notifications.consumers')


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Real-time notification consumer for delivering direct push notifications
    to authenticated users via their private channel group `user_{user.id}`.
    """

    async def connect(self):
        try:
            user = self.scope.get('user')
            if not user or not user.is_authenticated:
                await self.close(code=4003)
                return

            self.user_group_name = f"user_{user.id}"

            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.user_group_name,
                    self.channel_name
                )
            await self.accept()
        except Exception as e:
            logger.error(f"WebSocket connect error in NotificationConsumer: {e}", exc_info=True)
            await self.close(code=4000)

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'user_group_name') and self.channel_layer:
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"WebSocket disconnect cleanup error in NotificationConsumer: {e}")

    async def receive(self, text_data):
        """
        Clients can send ping/ack payloads to maintain heartbeat or acknowledge read.
        """
        try:
            data = json.loads(text_data) if text_data else {}
            if data.get('action') == 'ping':
                await self.send(text_data=json.dumps({'action': 'pong'}))
        except Exception:
            pass

    async def notification_message(self, event):
        """
        Handler invoked by Channels layer `group_send` from `push_notification`.
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'notification': event.get('notification', {})
            }))
        except Exception as e:
            logger.warning(f"Failed to deliver notification to WebSocket client: {e}")
