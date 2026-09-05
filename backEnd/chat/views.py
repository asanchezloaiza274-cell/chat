import json

from django.conf import settings
from django.db.models import Max, Q
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Block, User
from accounts.serializers import PublicUserSerializer
from .models import Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction, Report
from .realtime import send_to_conversation, send_to_users
from .serializers import (
    ConversationSerializer,
    CreateDirectConversationSerializer,
    CreateGroupConversationSerializer,
    MessageSerializer,
)


def _is_blocked_either_way(user_a, user_b):
    return Block.objects.filter(blocker=user_a, blocked=user_b).exists() or \
        Block.objects.filter(blocker=user_b, blocked=user_a).exists()


def get_membership_or_403(conversation_id, user):
    membership = (
        ConversationParticipant.objects.select_related('conversation')
        .filter(conversation_id=conversation_id, user=user)
        .first()
    )
    if not membership:
        raise PermissionDenied('You are not a participant in this conversation.')
    return membership


class ConversationListCreateView(generics.ListAPIView):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return (
            Conversation.objects.filter(memberships__user=self.request.user)
            .distinct()
            .annotate(last_activity=Coalesce(Max('messages__created_at'), 'created_at'))
            .order_by('-last_activity')
            .prefetch_related('memberships', 'messages')
        )

    def get_serializer_context(self):
        return {'request': self.request}

    def post(self, request):
        conv_type = request.data.get('type')

        if conv_type == 'direct':
            serializer = CreateDirectConversationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            other_id = serializer.validated_data['user_id']
            other_user = get_object_or_404(User, pk=other_id)
            if _is_blocked_either_way(request.user, other_user):
                raise PermissionDenied('You cannot start a conversation with this user.')

            existing = (
                Conversation.objects.filter(type=Conversation.Type.DIRECT, memberships__user=request.user)
                .filter(memberships__user=other_user)
                .first()
            )
            if existing:
                return Response(
                    ConversationSerializer(existing, context={'request': request}).data,
                    status=status.HTTP_200_OK,
                )

            conversation = Conversation.objects.create(type=Conversation.Type.DIRECT, created_by=request.user)
            ConversationParticipant.objects.create(conversation=conversation, user=request.user)
            ConversationParticipant.objects.create(conversation=conversation, user=other_user)

        elif conv_type == 'group':
            serializer = CreateGroupConversationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            conversation = Conversation.objects.create(
                type=Conversation.Type.GROUP,
                name=data['name'],
                avatar_color=data.get('avatar_color', ''),
                created_by=request.user,
            )
            ConversationParticipant.objects.create(conversation=conversation, user=request.user)
            for user_id in data['participant_ids']:
                user = User.objects.filter(pk=user_id).first()
                if user:
                    ConversationParticipant.objects.get_or_create(conversation=conversation, user=user)
        else:
            raise ValidationError({'type': 'Must be "direct" or "group".'})

        payload_data = ConversationSerializer(conversation, context={'request': request}).data
        send_to_conversation(conversation, 'conversation.created', {'conversation': payload_data})
        return Response(payload_data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    def get(self, request, conversation_id):
        get_membership_or_403(conversation_id, request.user)
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        return Response(ConversationSerializer(conversation, context={'request': request}).data)

    def patch(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        conversation = membership.conversation
        if conversation.type != Conversation.Type.GROUP:
            raise ValidationError({'name': 'Only group conversations can be renamed.'})

        name = request.data.get('name', '').strip()
        if not name:
            raise ValidationError({'name': 'This field is required.'})

        conversation.name = name
        conversation.save(update_fields=['name'])

        payload = ConversationSerializer(conversation, context={'request': request}).data
        member_ids = list(conversation.memberships.values_list('user_id', flat=True))
        send_to_users(member_ids, 'conversation.updated', {'conversation': payload})
        return Response(payload)

    def delete(self, request, conversation_id):
        get_membership_or_403(conversation_id, request.user)
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        conversation_id_str = str(conversation.id)
        participant_ids = list(conversation.memberships.values_list('user_id', flat=True))
        conversation.delete()
        send_to_users(participant_ids, 'conversation.deleted', {'conversation_id': conversation_id_str})
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConversationReadView(APIView):
    def post(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        membership.last_read_at = timezone.now()
        membership.save(update_fields=['last_read_at'])
        send_to_conversation(
            membership.conversation,
            'conversation.read',
            {
                'conversation_id': str(conversation_id),
                'user_id': str(request.user.id),
                'read_at': membership.last_read_at.isoformat(),
            },
        )
        return Response({'detail': 'Marked as read.'})


class ConversationMuteView(APIView):
    def post(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        membership.is_muted = not membership.is_muted
        membership.save(update_fields=['is_muted'])
        payload = ConversationSerializer(membership.conversation, context={'request': request}).data
        send_to_users([request.user.id], 'conversation.updated', {'conversation': payload})
        return Response(payload)


class ConversationPinView(APIView):
    def post(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        membership.is_pinned = not membership.is_pinned
        membership.save(update_fields=['is_pinned'])
        payload = ConversationSerializer(membership.conversation, context={'request': request}).data
        send_to_users([request.user.id], 'conversation.updated', {'conversation': payload})
        return Response(payload)


class ConversationParticipantsView(APIView):
    def post(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        conversation = membership.conversation
        if conversation.type != Conversation.Type.GROUP:
            raise ValidationError({'detail': 'Only group conversations support adding participants.'})

        user_id = request.data.get('user_id')
        if not user_id:
            raise ValidationError({'user_id': 'This field is required.'})
        user = get_object_or_404(User, pk=user_id)

        _, created = ConversationParticipant.objects.get_or_create(conversation=conversation, user=user)
        if not created:
            raise ValidationError({'user_id': 'This user is already a participant.'})

        payload = ConversationSerializer(conversation, context={'request': request}).data
        member_ids = list(conversation.memberships.values_list('user_id', flat=True))
        send_to_users(member_ids, 'conversation.updated', {'conversation': payload})
        return Response(payload, status=status.HTTP_201_CREATED)

    def delete(self, request, conversation_id, user_id):
        membership = get_membership_or_403(conversation_id, request.user)
        conversation = membership.conversation
        if conversation.type != Conversation.Type.GROUP:
            raise ValidationError({'detail': 'Only group conversations support removing participants.'})

        is_self = str(user_id) == str(request.user.id)
        if not is_self and (not conversation.created_by_id or str(conversation.created_by_id) != str(request.user.id)):
            raise PermissionDenied('Only the group owner can remove other participants.')

        target_membership = ConversationParticipant.objects.filter(conversation=conversation, user_id=user_id).first()
        if not target_membership:
            raise ValidationError({'user_id': 'This user is not a participant.'})
        target_membership.delete()

        send_to_users([user_id], 'conversation.deleted', {'conversation_id': str(conversation.id)})

        remaining_ids = list(conversation.memberships.values_list('user_id', flat=True))
        if remaining_ids:
            payload = ConversationSerializer(conversation, context={'request': request}).data
            send_to_users(remaining_ids, 'conversation.updated', {'conversation': payload})
        else:
            conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConversationReportView(APIView):
    def post(self, request, conversation_id):
        get_membership_or_403(conversation_id, request.user)
        reason = request.data.get('reason', '').strip()
        Report.objects.create(conversation_id=conversation_id, reporter=request.user, reason=reason)
        return Response({'detail': 'Report submitted.'}, status=status.HTTP_201_CREATED)


class MessageListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, conversation_id):
        get_membership_or_403(conversation_id, request.user)
        try:
            limit = min(int(request.query_params.get('limit', 50)), 100)
        except (TypeError, ValueError):
            limit = 50
        limit = max(limit, 1)

        qs = (
            Message.objects.filter(conversation_id=conversation_id)
            .select_related('reply_to', 'conversation')
            .prefetch_related('attachments', 'reactions')
        )

        before = request.query_params.get('before')
        if before:
            qs = qs.filter(created_at__lt=before)

        # Fetch newest-first so `before` pagination is cheap, then reverse
        # to the ascending order the client renders. Over-fetch by one to
        # know whether there are still older messages left.
        page = list(qs.order_by('-created_at')[:limit + 1])
        has_more = len(page) > limit
        page = page[:limit]
        page.reverse()

        return Response({
            'results': MessageSerializer(page, many=True, context={'request': request}).data,
            'has_more': has_more,
        })

    def post(self, request, conversation_id):
        membership = get_membership_or_403(conversation_id, request.user)
        text = request.data.get('text', '').strip()
        reply_to_id = request.data.get('reply_to_id') or None
        files = request.FILES.getlist('files')

        if not text and not files:
            raise ValidationError({'text': 'Message must have text or an attachment.'})

        for file in files:
            if file.size > settings.MAX_ATTACHMENT_SIZE:
                raise ValidationError({'files': f'"{file.name}" exceeds the maximum size of '
                                                  f'{settings.MAX_ATTACHMENT_SIZE // (1024 * 1024)}MB.'})
            content_type = getattr(file, 'content_type', '') or ''
            if content_type not in settings.ALLOWED_ATTACHMENT_CONTENT_TYPES:
                raise ValidationError({'files': f'"{file.name}" has an unsupported file type.'})

        if membership.conversation.type == Conversation.Type.DIRECT:
            other = membership.conversation.memberships.exclude(user=request.user).select_related('user').first()
            if other and _is_blocked_either_way(request.user, other.user):
                raise PermissionDenied('You cannot message this user.')

        reply_to = None
        if reply_to_id:
            reply_to = Message.objects.filter(pk=reply_to_id, conversation_id=conversation_id).first()

        try:
            meta_list = json.loads(request.data.get('meta', '[]'))
        except (TypeError, ValueError):
            meta_list = []

        message = Message.objects.create(
            conversation=membership.conversation,
            sender=request.user,
            text=text or None,
            reply_to=reply_to,
        )

        for index, file in enumerate(files):
            meta = meta_list[index] if index < len(meta_list) else {}
            _create_attachment(message, file, meta)

        message.refresh_from_db()
        payload = MessageSerializer(message, context={'request': request}).data
        send_to_conversation(membership.conversation, 'message.created', {
            'conversation_id': str(conversation_id),
            'message': payload,
        })
        return Response(payload, status=status.HTTP_201_CREATED)


def _create_attachment(message, file, meta):
    content_type = getattr(file, 'content_type', '') or ''
    if content_type.startswith('image/'):
        attachment_type = MessageAttachment.Type.IMAGE
    elif content_type.startswith('audio/'):
        attachment_type = MessageAttachment.Type.AUDIO
    else:
        attachment_type = MessageAttachment.Type.FILE

    attachment = MessageAttachment(
        message=message,
        file=file,
        attachment_type=attachment_type,
        original_name=getattr(file, 'name', 'file'),
        size=getattr(file, 'size', 0),
        duration=meta.get('duration'),
    )

    if attachment_type == MessageAttachment.Type.IMAGE:
        try:
            image = Image.open(file)
            attachment.width, attachment.height = image.size
        except Exception:
            pass
        file.seek(0)

    attachment.save()
    return attachment


def _get_message_or_403(message_id, user, require_own=False):
    message = get_object_or_404(Message.objects.select_related('conversation'), pk=message_id)
    if not message.conversation.memberships.filter(user=user).exists():
        raise PermissionDenied('You are not a participant in this conversation.')
    if require_own and message.sender_id != user.id:
        raise PermissionDenied('You can only modify your own messages.')
    return message


class MessageDetailView(APIView):
    def patch(self, request, message_id):
        message = _get_message_or_403(message_id, request.user, require_own=True)
        text = request.data.get('text', '').strip()
        if not text:
            raise ValidationError({'text': 'Text cannot be empty.'})
        message.text = text
        message.edited_at = timezone.now()
        message.save(update_fields=['text', 'edited_at'])
        return _broadcast_message_update(message, request)

    def delete(self, request, message_id):
        message = _get_message_or_403(message_id, request.user, require_own=True)
        message.is_deleted = True
        message.is_pinned = False
        message.text = None
        message.save(update_fields=['is_deleted', 'is_pinned', 'text'])
        message.attachments.all().delete()
        message.reactions.all().delete()
        return _broadcast_message_update(message, request)


class MessagePinView(APIView):
    def post(self, request, message_id):
        message = _get_message_or_403(message_id, request.user)
        message.is_pinned = not message.is_pinned
        message.save(update_fields=['is_pinned'])
        return _broadcast_message_update(message, request)


class MessageReactView(APIView):
    def post(self, request, message_id):
        message = _get_message_or_403(message_id, request.user)
        emoji = request.data.get('emoji')
        if not emoji:
            raise ValidationError({'emoji': 'This field is required.'})

        reaction, created = MessageReaction.objects.get_or_create(message=message, user=request.user, emoji=emoji)
        if not created:
            reaction.delete()

        return _broadcast_message_update(message, request)


def _broadcast_message_update(message, request):
    message.refresh_from_db()
    payload = MessageSerializer(message, context={'request': request}).data
    send_to_conversation(message.conversation, 'message.updated', {
        'conversation_id': str(message.conversation_id),
        'message': payload,
    })
    return Response(payload)


class GlobalSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'conversations': [], 'people': [], 'messages': []})

        conversations = (
            Conversation.objects.filter(memberships__user=request.user)
            .filter(
                Q(name__icontains=query)
                | Q(memberships__user__full_name__icontains=query)
                | Q(memberships__user__username__icontains=query)
            )
            .distinct()[:10]
        )

        people = User.objects.exclude(pk=request.user.pk).filter(
            Q(username__icontains=query) | Q(full_name__icontains=query)
        )[:10]

        messages = (
            Message.objects.filter(conversation__memberships__user=request.user, is_deleted=False)
            .filter(text__icontains=query)
            .select_related('conversation', 'sender')
            .order_by('-created_at')[:20]
        )

        context = {'request': request, 'request_user': request.user}
        return Response({
            'conversations': ConversationSerializer(conversations, many=True, context=context).data,
            'people': PublicUserSerializer(people, many=True, context=context).data,
            'messages': MessageSerializer(messages, many=True, context=context).data,
        })
