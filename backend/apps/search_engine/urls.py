from django.urls import path
from .views import HybridSearchView, SearchAutoCompleteView

urlpatterns = [
    path('', HybridSearchView.as_view(), name='hybrid-search'),
    path('autocomplete/', SearchAutoCompleteView.as_view(), name='search-autocomplete'),
]
