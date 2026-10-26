from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, UserRegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        # Support both 'name' and 'full_name' from frontend
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'name' in data and 'full_name' not in data:
            data['full_name'] = data['name']

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'user': user_data,
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user is None:
            try:
                user_obj = User.objects.get(email__iexact=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                user = None

        if user is None or not user.is_active:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            from apps.books.models import Book
            total_books = Book.objects.count()
            active_swaps = Book.objects.filter(mode='exchange').count()
            free_donations = Book.objects.filter(mode='donate').count()
        except Exception:
            total_books = 0
            active_swaps = 0
            free_donations = 0

        total_users = User.objects.count()

        return Response({
            'totalUsers': total_users,
            'totalListings': total_books,
            'activeSwaps': active_swaps,
            'freeDonations': free_donations,
            'totalTransactions': 0,
            'totalOffers': 0,
        })


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')
