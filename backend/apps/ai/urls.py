from django.urls import path
from .views import AIQueryParserView, AIAssistantView, AIPrivacyPurgeView

urlpatterns = [
    path('parse-query/', AIQueryParserView.as_view(), name='ai-parse-query'),
    path('assistant/', AIAssistantView.as_view(), name='ai-assistant'),
    path('purge-memory/', AIPrivacyPurgeView.as_view(), name='ai-purge-memory'),
]
