from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _group_name(user_id):
    return f'user_{user_id}'


def send_to_users(user_ids, event_type, payload, exclude_user_id=None):
    layer = get_channel_layer()
    if layer is None:
        return
    for user_id in user_ids:
        if exclude_user_id is not None and str(user_id) == str(exclude_user_id):
            continue
        async_to_sync(layer.group_send)(_group_name(user_id), {'type': event_type, 'payload': payload})


def send_to_conversation(conversation, event_type, payload, exclude_user_id=None):
    user_ids = list(conversation.memberships.values_list('user_id', flat=True))
    send_to_users(user_ids, event_type, payload, exclude_user_id=exclude_user_id)
