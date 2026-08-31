from django.urls import path

from . import views

urlpatterns = [
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation_list'),
    path('conversations/<uuid:conversation_id>/', views.ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<uuid:conversation_id>/read/', views.ConversationReadView.as_view(), name='conversation_read'),
    path('conversations/<uuid:conversation_id>/mute/', views.ConversationMuteView.as_view(), name='conversation_mute'),
    path('conversations/<uuid:conversation_id>/pin/', views.ConversationPinView.as_view(), name='conversation_pin'),
    path('conversations/<uuid:conversation_id>/report/', views.ConversationReportView.as_view(), name='conversation_report'),
    path(
        'conversations/<uuid:conversation_id>/participants/',
        views.ConversationParticipantsView.as_view(),
        name='conversation_participants',
    ),
    path(
        'conversations/<uuid:conversation_id>/participants/<uuid:user_id>/',
        views.ConversationParticipantsView.as_view(),
        name='conversation_participant_detail',
    ),
    path(
        'conversations/<uuid:conversation_id>/messages/',
        views.MessageListCreateView.as_view(),
        name='message_list',
    ),

    path('messages/<uuid:message_id>/', views.MessageDetailView.as_view(), name='message_detail'),
    path('messages/<uuid:message_id>/pin/', views.MessagePinView.as_view(), name='message_pin'),
    path('messages/<uuid:message_id>/react/', views.MessageReactView.as_view(), name='message_react'),

    path('search/', views.GlobalSearchView.as_view(), name='global_search'),
]
