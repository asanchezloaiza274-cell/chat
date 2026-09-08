import uuid

from django.conf import settings
from django.db import models


from django.utils import timezone
from .storage import AttachmentCloudinaryStorage


class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = 'direct', 'Direct'
        GROUP = 'group', 'Group'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=Type.choices)
    name = models.CharField(max_length=150, blank=True)
    avatar_color = models.CharField(max_length=7, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='created_conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through='ConversationParticipant', related_name='conversations'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name or f'Conversation {self.id}'

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversation_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f'{self.user.username} in {self.conversation_id}'

    def unread_count(self):
        qs = self.conversation.messages.exclude(sender=self.user)
        if self.last_read_at:
            qs = qs.filter(created_at__gt=self.last_read_at)
        return qs.count()


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='sent_messages'
    )
    text = models.TextField(blank=True, null=True)
    reply_to = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message {self.id} in {self.conversation_id}'

def attachment_upload_path(instance, filename):
    subfolder = {
        'image': 'images',
        'audio': 'audio',
        'video': 'video',
    }.get(instance.attachment_type, 'files')
    now = timezone.now()
    return f'attachments/{subfolder}/{now:%Y/%m}/{filename}'

class MessageAttachment(models.Model):
    class Type(models.TextChoices):
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'
        AUDIO = 'audio', 'Audio'
        VIDEO = 'video', 'Video'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=attachment_upload_path, storage=AttachmentCloudinaryStorage())
    attachment_type = models.CharField(max_length=10, choices=Type.choices)
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField(default=0)
    duration = models.FloatField(null=True, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.original_name


class Report(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_filed')
    reason = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report on {self.conversation_id} by {self.reporter_id}'


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reactions')
    emoji = models.CharField(max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f'{self.emoji} by {self.user.username}'
