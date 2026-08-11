from django.urls import path
from .views import ChatMessageListCreateView, ChatInboxView

urlpatterns = [
    path('messages/', ChatMessageListCreateView.as_view(), name='chat-messages'),
    path('inbox/', ChatInboxView.as_view(), name='chat-inbox'),
]
