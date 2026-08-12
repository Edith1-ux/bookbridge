from django.urls import path
from .views import PublicDocsView

urlpatterns = [
    path('docs/', PublicDocsView.as_view(), name='public-docs'),
]
