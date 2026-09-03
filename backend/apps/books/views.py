from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book, Wishlist
from .serializers import BookSerializer, BookCreateSerializer, WishlistSerializer
from .permissions import IsOwnerOrAdmin
from apps.users.models import User
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim


from django.core.cache import cache
from django.db.models import Count, Q


class StatisticsAPIView(APIView):
    """
    GET /api/statistics/
    GET /api/v1/statistics/
    Production-ready endpoint returning real-time platform statistics from Django ORM with caching.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cache_key = 'bookbridge_public_platform_statistics'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        active_students = User.objects.filter(is_active=True, role__iexact='STUDENT').count()
        book_stats = Book.objects.aggregate(
            books_listed=Count('id', filter=Q(status='Available')),
            books_donated=Count('id', filter=Q(mode='donate'))
        )
        books_listed = book_stats['books_listed'] or 0
        books_donated = book_stats['books_donated'] or 0

        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()
        completed_donations = DonationClaim.objects.filter(status__in=['approved', 'completed']).count()

        payload = {
            "active_students": active_students,
            "books_listed": books_listed,
            "successful_exchanges": successful_exchanges,
            "books_donated": books_donated,
            "completed_donations": completed_donations,
            "students": active_students,
            "books": books_listed,
            "exchanges": successful_exchanges,
            "donated": books_donated,
        }
        cache.set(cache_key, payload, timeout=30)
        return Response(payload, status=status.HTTP_200_OK)


class BookStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cache_key = 'bookbridge_book_stats_overview'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        user_stats = User.objects.aggregate(
            total_users=Count('id'),
            active_students=Count('id', filter=Q(is_active=True, role__iexact='STUDENT'))
        )
        book_stats = Book.objects.aggregate(
            total_books=Count('id'),
            books_listed=Count('id', filter=Q(status='Available')),
            books_donated=Count('id', filter=Q(mode='donate'))
        )
        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()

        active_students = user_stats['active_students'] or 0
        books_listed = book_stats['books_listed'] or 0
        books_donated = book_stats['books_donated'] or 0
        total_users = user_stats['total_users'] or 0
        total_listings = book_stats['total_books'] or 0

        payload = {
            'active_students': active_students,
            'books_listed': books_listed,
            'successful_exchanges': successful_exchanges,
            'books_donated': books_donated,
            'totalUsers': total_users,
            'totalListings': total_listings,
            'successfulExchanges': successful_exchanges,
            'students': active_students,
            'books': books_listed,
            'exchanges': successful_exchanges,
            'donated': books_donated,
        }
        cache.set(cache_key, payload, timeout=30)
        return Response(payload, status=status.HTTP_200_OK)


class BookListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'semester', 'mode', 'condition', 'resource_type', 'status']
    search_fields = ['title', 'author', 'gtu_code', 'isbn', 'subject', 'genre', 'description']
    ordering_fields = ['price', 'rating', 'created_at', 'semester', 'views_count']
    ordering = ['-created_at']

    def get_queryset(self):
        # Support optional status filter or default to Available unless all is requested
        status_param = self.request.query_params.get('status')
        all_param = self.request.query_params.get('all', '').lower() in ('true', '1')

        qs = Book.objects.select_related('seller', 'seller__college', 'seller__department')
        if not all_param and not status_param:
            qs = qs.filter(status='Available')
        elif status_param:
            qs = qs.filter(status__iexact=status_param)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookCreateSerializer
        return BookSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        book = serializer.instance

        from apps.analytics.models import log_activity
        action_type = 'BOOK_SELL'
        if book.mode == 'exchange':
            action_type = 'BOOK_EXCHANGE'
        elif book.mode == 'donate':
            action_type = 'BOOK_DONATE'

        log_activity(
            request=request,
            user=request.user,
            action=action_type,
            title=f"Book listed ({book.mode.upper()}): {book.title} (₹{book.price})",
            details={
                'book_id': book.id,
                'title': book.title,
                'mode': book.mode,
                'price': float(book.price),
                'branch': book.branch,
                'semester': book.semester
            }
        )

        # Return full BookSerializer representation with seller_name
        response_serializer = BookSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.select_related('seller', 'seller__college', 'seller__department').all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Use F() for atomic increment to avoid race conditions in concurrent requests
        Book.objects.filter(pk=instance.pk).update(views_count=models.F('views_count') + 1)
        return super().retrieve(request, *args, **kwargs)


class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id') or request.data.get('book')
        if not book_id:
            return Response({'error': 'book_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            book = Book.objects.get(pk=book_id)
        except (Book.DoesNotExist, ValueError):
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, book=book)
        if not created:
            wishlist_item.delete()
            return Response({'added': False, 'message': 'Removed from wishlist'}, status=status.HTTP_200_OK)
        return Response({'added': True, 'message': 'Added to wishlist'}, status=status.HTTP_201_CREATED)


class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related(
            'book', 'book__seller', 'book__seller__college', 'book__seller__department'
        ).order_by('-created_at')
