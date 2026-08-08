from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import User
from .models import Conversation, ConversationParticipant
from .realtime import send_to_conversation, send_to_users


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = await self.authenticate()
        if user is None:
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = f'user_{user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.set_status('online')
        await self.broadcast_presence('online')

    async def disconnect(self, code):
        if not hasattr(self, 'user'):
            return
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.set_status('offline')
        await self.broadcast_presence('offline')

    async def receive_json(self, content, **kwargs):
        action = content.get('action')
        if action == 'typing':
            await self.handle_typing(content)

    async def handle_typing(self, content):
        conversation_id = content.get('conversation_id')
        is_typing = bool(content.get('is_typing'))
        if conversation_id:
            await self.emit_typing(conversation_id, is_typing)

    # -- group event handlers: forward whatever was broadcast straight to the client --
    async def _forward(self, event):
        await self.send_json({'type': event['type'], **event['payload']})

    message_created = _forward
    message_updated = _forward
    conversation_created = _forward
    conversation_updated = _forward
    conversation_deleted = _forward
    conversation_read = _forward
    typing = _forward
    presence = _forward

    # -- helpers that touch the database --
    @database_sync_to_async
    def authenticate(self):
        query_string = self.scope['query_string'].decode()
        token = parse_qs(query_string).get('token', [None])[0]
        if not token:
            return None
        try:
            access = AccessToken(token)
            return User.objects.get(pk=access['user_id'])
        except (TokenError, KeyError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def set_status(self, status):
        self.user.status = status
        self.user.last_seen_at = timezone.now()
        self.user.save(update_fields=['status', 'last_seen_at'])

    @database_sync_to_async
    def emit_typing(self, conversation_id, is_typing):
        try:
            conversation = Conversation.objects.get(id=conversation_id, memberships__user=self.user)
        except Conversation.DoesNotExist:
            return
        send_to_conversation(
            conversation,
            'typing',
            {'conversation_id': str(conversation_id), 'user_id': str(self.user.id), 'is_typing': is_typing},
            exclude_user_id=self.user.id,
        )

    @database_sync_to_async
    def broadcast_presence(self, status):
        conversation_ids = Conversation.objects.filter(memberships__user=self.user).values_list('id', flat=True)
        contact_ids = set(
            ConversationParticipant.objects.filter(conversation_id__in=conversation_ids)
            .exclude(user=self.user)
            .values_list('user_id', flat=True)
        )
        send_to_users(
            contact_ids,
            'presence',
            {
                'user_id': str(self.user.id),
                'status': status,
                'last_seen_at': self.user.last_seen_at.isoformat() if self.user.last_seen_at else None,
            },
        )
