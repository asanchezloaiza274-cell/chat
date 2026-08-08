from django.contrib import admin

from .models import Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'name', 'created_by', 'created_at']
    list_filter = ['type']
    inlines = [ConversationParticipantInline]


class MessageAttachmentInline(admin.TabularInline):
    model = MessageAttachment
    extra = 0


class MessageReactionInline(admin.TabularInline):
    model = MessageReaction
    extra = 0


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'created_at', 'is_deleted', 'is_pinned']
    list_filter = ['is_deleted', 'is_pinned']
    inlines = [MessageAttachmentInline, MessageReactionInline]
