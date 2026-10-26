from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book, Wishlist
from .serializers import BookSerializer, BookCreateSerializer, WishlistSerializer


class StatisticsAPIView(APIView):
    """
    GET /api/statistics/
    GET /api/v1/statistics/
    Production-ready endpoint returning real-time platform statistics from Django ORM.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            from apps.users.models import User
            try:
                from apps.exchange.models import ExchangeOffer
            except ImportError:
                ExchangeOffer = None

            # 1. Active Students: Count of active users with role="student"
            active_students = User.objects.filter(is_active=True, role='student').count()

            # 2. Books Listed: Total books available
            books_listed = Book.objects.filter(status='Available').count()

            # 3. Successful Exchanges: Total completed transactions from Exchange model where status="completed"
            if ExchangeOffer is not None:
                successful_exchanges = ExchangeOffer.objects.filter(status='completed').count()
            else:
                successful_exchanges = 0

            return Response({
                "active_students": active_students,
                "books_listed": books_listed,
                "successful_exchanges": successful_exchanges
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "active_students": 0,
                "books_listed": 0,
                "successful_exchanges": 0
            }, status=status.HTTP_200_OK)


class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.select_related('seller').filter(status='Available')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'semester', 'mode', 'condition', 'resource_type']
    search_fields = ['title', 'author', 'gtu_code', 'isbn', 'subject', 'genre']
    ordering_fields = ['price', 'rating', 'created_at', 'semester']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookCreateSerializer
        return BookSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


from .permissions import IsOwnerOrAdmin


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.select_related('seller').all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        if not book_id:
            return Response({'error': 'book_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, book=book)
        if not created:
            wishlist_item.delete()
            return Response({'added': False, 'message': 'Removed from wishlist'})
        return Response({'added': True, 'message': 'Added to wishlist'}, status=status.HTTP_201_CREATED)


class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('book', 'book__seller')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class BookStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.users.models import User
        try:
            from apps.exchange.models import ExchangeOffer
        except ImportError:
            ExchangeOffer = None

        total_users = User.objects.filter(is_active=True, role='student').count()
        total_books = Book.objects.filter(status='Available').count()
        successful_exchanges = ExchangeOffer.objects.filter(status='completed').count() if ExchangeOffer else 0

        return Response({
            'active_students': total_users,
            'books_listed': total_books,
            'successful_exchanges': successful_exchanges,
            'totalUsers': total_users,
            'totalListings': total_books,
            'successfulExchanges': successful_exchanges,
        })
