from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import UserSerializer, RegisterSerializer, PublicUserSerializer
from .permissions import IsBookBridgeAdmin
from apps.books.models import Book
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        if user is None:
            # Check if user exists but case differs
            try:
                u = User.objects.get(email__iexact=email)
                if u.check_password(password):
                    user = u
            except User.DoesNotExist:
                user = None

        if user is None:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is inactive. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """Admin-only endpoint to list all registered users."""
    queryset = User.objects.all().select_related('college', 'department').order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeAdmin]


class AdminStatsView(APIView):
    """Admin-only endpoint returning accurate platform statistics."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeAdmin]

    def get(self, request):
        total_users = User.objects.count()
        student_users = User.objects.filter(role__iexact='STUDENT').count()
        total_books = Book.objects.count()
        available_books = Book.objects.filter(status='Available').count()
        active_swaps = ExchangeProposal.objects.filter(status='pending').count()
        completed_swaps = ExchangeProposal.objects.filter(status='completed').count()
        total_claims = DonationClaim.objects.count()
        approved_donations = DonationClaim.objects.filter(status__in=['approved', 'completed']).count()

        return Response({
            'totalUsers': total_users,
            'studentUsers': student_users,
            'totalListings': total_books,
            'availableListings': available_books,
            'activeSwaps': active_swaps,
            'completedSwaps': completed_swaps,
            'freeDonations': total_claims,
            'approvedDonations': approved_donations,
            'totalTransactions': completed_swaps + approved_donations,
        }, status=status.HTTP_200_OK)


ProfileView = UserProfileView
