import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    """Real-time 1-on-1 and department group chat WebSocket consumer with typing indicators and read receipts."""

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type', 'message')

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_event',
                'event_type': event_type,
                'sender': data.get('sender', 'Anonymous'),
                'message': data.get('message', ''),
                'timestamp': data.get('timestamp', '')
            }
        )

    async def chat_event(self, event):
        await self.send(text_data=json.dumps(event))
