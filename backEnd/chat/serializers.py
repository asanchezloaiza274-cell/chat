from rest_framework import serializers

from accounts.serializers import PublicUserSerializer
from .models import Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction


class MessageAttachmentSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='attachment_type')
    name = serializers.CharField(source='original_name')
    url = serializers.SerializerMethodField()

    class Meta:
        model = MessageAttachment
        fields = ['id', 'type', 'name', 'url', 'size', 'duration', 'width', 'height']

    def get_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class ReplyToSerializer(serializers.Serializer):
    message_id = serializers.UUIDField(source='id')
    sender_id = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()

    def get_sender_id(self, obj):
        return str(obj.sender_id) if obj.sender_id else None

    def get_preview(self, obj):
        if obj.is_deleted:
            return 'This message was deleted'
        if obj.text:
            return obj.text
        if obj.attachments.exists():
            return 'Attachment'
        return ''


class MessageSerializer(serializers.ModelSerializer):
    conversation_id = serializers.UUIDField(source='conversation.id', read_only=True)
    sender_id = serializers.SerializerMethodField()
    edited = serializers.SerializerMethodField()
    deleted = serializers.BooleanField(source='is_deleted')
    pinned = serializers.BooleanField(source='is_pinned')
    reply_to = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'conversation_id', 'sender_id', 'text', 'created_at', 'edited_at',
            'edited', 'deleted', 'pinned', 'reply_to', 'reactions', 'attachments', 'status',
        ]

    def get_sender_id(self, obj):
        return str(obj.sender_id) if obj.sender_id else None

    def get_edited(self, obj):
        return obj.edited_at is not None

    def get_reply_to(self, obj):
        if not obj.reply_to_id:
            return None
        return ReplyToSerializer(obj.reply_to, context=self.context).data

    def get_reactions(self, obj):
        grouped = {}
        for reaction in obj.reactions.all():
            grouped.setdefault(reaction.emoji, []).append(str(reaction.user_id))
        return [{'emoji': emoji, 'user_ids': user_ids} for emoji, user_ids in grouped.items()]

    def get_status(self, obj):
        others = list(obj.conversation.memberships.exclude(user_id=obj.sender_id).select_related('user'))
        if not others:
            return 'sent'

        all_read = True
        any_online = False
        for membership in others:
            is_read = membership.last_read_at and membership.last_read_at >= obj.created_at
            if not is_read:
                all_read = False
                if membership.user.status == 'online':
                    any_online = True

        if all_read:
            return 'read'
        if any_online:
            return 'delivered'
        return 'sent'


class ConversationSerializer(serializers.ModelSerializer):
    participant_ids = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    muted = serializers.SerializerMethodField()
    pinned = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'type', 'name', 'avatar_color', 'created_at', 'created_by',
            'participant_ids', 'unread_count', 'muted', 'pinned', 'last_message',
        ]

    def get_created_by(self, obj):
        return str(obj.created_by_id) if obj.created_by_id else None

    def _membership(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        cache = self.context.setdefault('_membership_cache', {})
        if obj.id not in cache:
            cache[obj.id] = obj.memberships.filter(user=request.user).first()
        return cache[obj.id]

    def get_participant_ids(self, obj):
        return [str(pid) for pid in obj.memberships.values_list('user_id', flat=True)]

    def get_unread_count(self, obj):
        membership = self._membership(obj)
        return membership.unread_count() if membership else 0

    def get_muted(self, obj):
        membership = self._membership(obj)
        return bool(membership and membership.is_muted)

    def get_pinned(self, obj):
        membership = self._membership(obj)
        return bool(membership and membership.is_pinned)

    def get_last_message(self, obj):
        last = obj.last_message
        return MessageSerializer(last, context=self.context).data if last else None


class CreateDirectConversationSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class CreateGroupConversationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    participant_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    avatar_color = serializers.CharField(max_length=7, required=False, allow_blank=True)
