from django.urls import path
from .views import (
    BookListCreateView, BookDetailView,
    WishlistToggleView, WishlistListView,
    StatisticsAPIView, BookStatsView
)

urlpatterns = [
    path('', BookListCreateView.as_view(), name='book-list-create'),
    path('<int:pk>/', BookDetailView.as_view(), name='book-detail'),
    path('stats/', BookStatsView.as_view(), name='book-stats'),
    path('statistics/', StatisticsAPIView.as_view(), name='statistics'),
    path('wishlist/', WishlistListView.as_view(), name='wishlist-list'),
    path('wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
]
