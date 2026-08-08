from django.urls import path

from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/me/', views.MeView.as_view(), name='me'),
    path('users/me/settings/', views.MeSettingsView.as_view(), name='me_settings'),
    path('users/me/sessions/', views.UserSessionListView.as_view(), name='session_list'),
    path('users/me/sessions/<uuid:session_id>/', views.UserSessionDeleteView.as_view(), name='session_delete'),
]
