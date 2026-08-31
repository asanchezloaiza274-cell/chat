import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


def avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'avatars/{instance.id}.{ext}'


class VisibilityChoices(models.TextChoices):
    EVERYONE = 'everyone', 'Everyone'
    CONTACTS = 'contacts', 'Contacts'
    NOBODY = 'nobody', 'Nobody'


class StatusChoices(models.TextChoices):
    ONLINE = 'online', 'Online'
    AWAY = 'away', 'Away'
    OFFLINE = 'offline', 'Offline'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    bio = models.CharField(max_length=160, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)

    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.OFFLINE)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    # Notification preferences
    notify_messages = models.BooleanField(default=True)
    notify_sounds = models.BooleanField(default=True)
    notify_mentions = models.BooleanField(default=True)
    notify_desktop = models.BooleanField(default=False)

    # Privacy preferences
    show_online_status = models.BooleanField(default=True)
    last_seen_visibility = models.CharField(
        max_length=10, choices=VisibilityChoices.choices, default=VisibilityChoices.EVERYONE
    )
    profile_photo_visibility = models.CharField(
        max_length=10, choices=VisibilityChoices.choices, default=VisibilityChoices.EVERYONE
    )

    def __str__(self):
        return self.username

    @property
    def display_name(self):
        return self.full_name or self.username


class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f'{self.blocker.username} blocked {self.blocked.username}'


class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_jti = models.CharField(max_length=255, unique=True)
    device = models.CharField(max_length=255, default='Unknown device')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_active_at']

    def __str__(self):
        return f'{self.user.username} · {self.device}'
