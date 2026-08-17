import json
from channels.generic.websocket import AsyncWebsocketConsumer


class WebRTCSignalingConsumer(AsyncWebsocketConsumer):
    """WebRTC signaling consumer for voice calls, video calls, and screen sharing negotiation."""

    async def connect(self):
        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.call_group_name = f"call_{self.call_id}"

        await self.channel_layer.group_add(
            self.call_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.call_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # WebRTC signaling events: offer, answer, ice-candidate, hangup
        await self.channel_layer.group_send(
            self.call_group_name,
            {
                'type': 'signal_event',
                'signal_data': data,
                'sender_channel': self.channel_name
            }
        )

    async def signal_event(self, event):
        # Relay signaling messages to all other peers in room except sender
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps(event['signal_data']))
