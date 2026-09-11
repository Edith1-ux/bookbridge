from django.urls import path
from .views import ICEServersView

urlpatterns = [
    path('ice-servers/', ICEServersView.as_view(), name='ice-servers'),
]
