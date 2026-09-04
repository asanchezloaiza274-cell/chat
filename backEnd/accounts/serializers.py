from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from .models import User, UserSession


def _avatar_url(user, request):
    if not user.avatar:
        return None
    url = user.avatar.url
    return request.build_absolute_uri(url) if request else url


class PublicUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    last_seen_at = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'bio', 'status', 'last_seen_at',
            'avatar_url', 'date_joined',
        ]

    def get_name(self, obj):
        return obj.display_name

    def get_avatar_url(self, obj):
        if obj.profile_photo_visibility == 'nobody' and obj != self.context.get('request_user'):
            return None
        return _avatar_url(obj, self.context.get('request'))

    def get_status(self, obj):
        if not obj.show_online_status and obj != self.context.get('request_user'):
            return 'offline'
        return obj.status

    def get_last_seen_at(self, obj):
        if obj.last_seen_visibility == 'nobody' and obj != self.context.get('request_user'):
            return None
        return obj.last_seen_at


class MeSerializer(PublicUserSerializer):
    class Meta(PublicUserSerializer.Meta):
        fields = PublicUserSerializer.Meta.fields + [
            'email', 'first_name', 'last_name',
            'notify_messages', 'notify_sounds', 'notify_mentions', 'notify_desktop',
            'show_online_status', 'last_seen_visibility', 'profile_photo_visibility',
        ]
        read_only_fields = ['email']


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'username', 'bio', 'avatar']
        extra_kwargs = {field: {'required': False} for field in ['full_name', 'username', 'bio', 'avatar']}

    def validate_username(self, value):
        qs = User.objects.exclude(pk=self.instance.pk).filter(username__iexact=value)
        if qs.exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_avatar(self, value):
        if value.size > settings.MAX_AVATAR_SIZE:
            raise serializers.ValidationError(
                f'Avatar exceeds the maximum size of {settings.MAX_AVATAR_SIZE // (1024 * 1024)}MB.'
            )
        content_type = getattr(value, 'content_type', '') or ''
        if content_type not in settings.ALLOWED_AVATAR_CONTENT_TYPES:
            raise serializers.ValidationError('Unsupported image type.')
        return value


class UpdateSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'notify_messages', 'notify_sounds', 'notify_mentions', 'notify_desktop',
            'show_online_status', 'last_seen_visibility', 'profile_photo_visibility',
        ]
        extra_kwargs = {field: {'required': False} for field in fields}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'full_name', 'password']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self):
        email = self.validated_data['email']
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        return user, uid, token


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError('This reset link is invalid.')

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError('This reset link has expired or already been used.')

        password_validation.validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserSessionSerializer(serializers.ModelSerializer):
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = ['id', 'device', 'ip_address', 'created_at', 'last_active_at', 'is_current']

    def get_is_current(self, obj):
        return obj.refresh_jti == self.context.get('current_jti')
