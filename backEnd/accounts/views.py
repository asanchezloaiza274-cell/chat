from django.core.mail import send_mail
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

from .models import Block, User, UserSession
from .serializers import (
    ChangePasswordSerializer,
    MeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UpdateSettingsSerializer,
    UserSessionSerializer,
)
from .utils import get_client_ip, parse_device


def _issue_session_response(user, request):
    refresh = RefreshToken.for_user(user)
    UserSession.objects.create(
        user=user,
        refresh_jti=str(refresh['jti']),
        device=parse_device(request),
        ip_address=get_client_ip(request),
    )
    user.status = 'online'
    user.save(update_fields=['status'])
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': MeSerializer(user, context={'request': request, 'request_user': user}).data,
    }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _issue_session_response(user, request)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('email', '')
        password = request.data.get('password', '')
        try:
            user = User.objects.get(Q(email__iexact=identifier) | Q(username__iexact=identifier))
        except User.DoesNotExist:
            user = None

        if user is None or not user.check_password(password) or not user.is_active:
            raise AuthenticationFailed('Invalid email or password.')

        return _issue_session_response(user, request)


class TokenRefreshView(BaseTokenRefreshView):
    def post(self, request, *args, **kwargs):
        old_jti = None
        try:
            old_jti = RefreshToken(request.data.get('refresh')).payload.get('jti')
        except TokenError:
            pass

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200 and old_jti:
            new_jti = None
            new_refresh = response.data.get('refresh')
            if new_refresh:
                try:
                    new_jti = RefreshToken(new_refresh).payload.get('jti')
                except TokenError:
                    pass
            UserSession.objects.filter(refresh_jti=old_jti).update(
                refresh_jti=new_jti or old_jti,
                last_active_at=timezone.now(),
            )
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_str = request.data.get('refresh')
        if refresh_str:
            try:
                token = RefreshToken(refresh_str)
                token.blacklist()
                UserSession.objects.filter(refresh_jti=token.payload.get('jti')).delete()
            except TokenError:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(MeSerializer(request.user, context={'request': request, 'request_user': request.user}).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user, context={'request': request, 'request_user': request.user}).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeSettingsView(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user, context={'request': request, 'request_user': request.user}).data)

    def patch(self, request):
        serializer = UpdateSettingsSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user, context={'request': request, 'request_user': request.user}).data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password updated.'})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        if result:
            user, uid, token = result
            reset_url = f'http://localhost:5173/reset-password/{uid}/{token}'
            send_mail(
                subject='Reset your Loop password',
                message=f'Hi {user.display_name},\n\nUse the link below to reset your password:\n{reset_url}\n\n'
                        f'If you did not request this, you can safely ignore this email.',
                from_email=None,
                recipient_list=[user.email],
            )
        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password has been reset.'})


class UserListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        qs = User.objects.exclude(pk=self.request.user.pk)
        query = self.request.query_params.get('q')
        if query:
            qs = qs.filter(Q(username__icontains=query) | Q(full_name__icontains=query))
        return qs.order_by('username')

    def get_serializer_context(self):
        return {'request': self.request, 'request_user': self.request.user}


class UserSessionListView(generics.ListAPIView):
    serializer_class = UserSessionSerializer

    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        return {'current_jti': self.request.query_params.get('current')}


class BlockedUsersView(APIView):
    def get(self, request):
        ids = Block.objects.filter(blocker=request.user).values_list('blocked_id', flat=True)
        return Response([str(pk) for pk in ids])


class BlockToggleView(APIView):
    def post(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        if target.id == request.user.id:
            raise ValidationError({'detail': 'You cannot block yourself.'})

        block = Block.objects.filter(blocker=request.user, blocked=target).first()
        if block:
            block.delete()
            return Response({'blocked': False})

        Block.objects.create(blocker=request.user, blocked=target)
        return Response({'blocked': True})


class UserSessionDeleteView(APIView):
    def delete(self, request, session_id):
        try:
            session = UserSession.objects.get(id=session_id, user=request.user)
        except UserSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            outstanding = OutstandingToken.objects.get(jti=session.refresh_jti)
            BlacklistedToken.objects.get_or_create(token=outstanding)
        except OutstandingToken.DoesNotExist:
            pass

        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
