from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book, Wishlist
from .serializers import BookSerializer, BookCreateSerializer, WishlistSerializer
from .permissions import IsOwnerOrAdmin
from apps.users.models import User
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim


class StatisticsAPIView(APIView):
    """
    GET /api/statistics/
    GET /api/v1/statistics/
    Production-ready endpoint returning real-time platform statistics from Django ORM.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        active_students = User.objects.filter(is_active=True, role__iexact='STUDENT').count()
        books_listed = Book.objects.filter(status='Available').count()
        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()
        books_donated = Book.objects.filter(mode='donate').count()
        completed_donations = DonationClaim.objects.filter(status__in=['approved', 'completed']).count()

        return Response({
            "active_students": active_students,
            "books_listed": books_listed,
            "successful_exchanges": successful_exchanges,
            "books_donated": books_donated,
            "completed_donations": completed_donations,
            "students": active_students,
            "books": books_listed,
            "exchanges": successful_exchanges,
            "donated": books_donated,
        }, status=status.HTTP_200_OK)


class BookStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        active_students = User.objects.filter(is_active=True, role__iexact='STUDENT').count()
        books_listed = Book.objects.filter(status='Available').count()
        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()
        books_donated = Book.objects.filter(mode='donate').count()

        return Response({
            'active_students': active_students,
            'books_listed': books_listed,
            'successful_exchanges': successful_exchanges,
            'books_donated': books_donated,
            'totalUsers': User.objects.count(),
            'totalListings': Book.objects.count(),
            'successfulExchanges': successful_exchanges,
            'students': active_students,
            'books': books_listed,
            'exchanges': successful_exchanges,
            'donated': books_donated,
        }, status=status.HTTP_200_OK)


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
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
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
