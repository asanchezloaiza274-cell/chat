from rest_framework.permissions import BasePermission


class IsConversationParticipant(BasePermission):
    message = 'You are not a participant in this conversation.'

    def has_object_permission(self, request, view, obj):
        conversation = obj if hasattr(obj, 'memberships') else obj.conversation
        return conversation.memberships.filter(user=request.user).exists()
