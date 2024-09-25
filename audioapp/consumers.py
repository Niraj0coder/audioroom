import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AudioConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'audio_{self.room_code}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_leave',
                'peer': self.scope['user'].username
            }
        )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data['action']

        if action == 'join':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'peer': data['peer']
                }
            )
        else:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_message',
                    'data': data
                }
            )

    async def user_join(self, event):
        await self.send(text_data=json.dumps({
            'peer': event['peer'],
            'action': 'join'
        }))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps({
            'peer': event['peer'],
            'action': 'leave'
        }))

    async def signal_message(self, event):
        data = event['data']
        await self.send(text_data=json.dumps(data))