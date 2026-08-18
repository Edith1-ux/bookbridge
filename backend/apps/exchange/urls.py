from django.urls import path
from .views import ExchangeProposalListCreateView, ExchangeProposalDetailView

urlpatterns = [
    path('', ExchangeProposalListCreateView.as_view(), name='exchange-list-create'),
    path('<uuid:pk>/', ExchangeProposalDetailView.as_view(), name='exchange-detail'),
]
