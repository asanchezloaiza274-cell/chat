from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Block, User, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['username']
    list_display = ['username', 'email', 'full_name', 'status', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('full_name', 'bio', 'avatar', 'status', 'last_seen_at')}),
        ('Notifications', {'fields': ('notify_messages', 'notify_sounds', 'notify_mentions', 'notify_desktop')}),
        ('Privacy', {'fields': ('show_online_status', 'last_seen_visibility', 'profile_photo_visibility')}),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device', 'ip_address', 'created_at', 'last_active_at']
    list_filter = ['device']


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['blocker', 'blocked', 'created_at']
