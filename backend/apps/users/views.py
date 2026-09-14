from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import UserSerializer, RegisterSerializer, PublicUserSerializer
from .permissions import IsBookBridgeeAdmin
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
        
        from apps.analytics.models import log_activity
        log_activity(
            request=request,
            user=user,
            action='REGISTER',
            title=f"New student registration: {user.full_name or user.email}",
            details={'email': user.email, 'role': user.role}
        )

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

        # Robust case-insensitive user lookup and authentication
        user = None
        try:
            u = User.objects.filter(email__iexact=email).first()
            if u and u.check_password(password):
                user = u
        except Exception:
            user = None

        if user is None:
            user = authenticate(request, email=email, password=password)
        if user is None:
            user = authenticate(request, username=email, password=password)

        if user is None:
            return Response({'error': 'Invalid email or password. Please check your credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is inactive. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)

        from apps.analytics.models import log_activity
        log_activity(
            request=request,
            user=user,
            action='LOGIN',
            title=f"Student login: {user.full_name or user.email}",
            details={'email': user.email}
        )

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


from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .serializers import UserSerializer, RegisterSerializer, PublicUserSerializer, UserAdminSerializer, UserAdminDetailSerializer
from apps.colleges.models import College, Department, Course
from apps.analytics.models import ActivityLog


class UserListView(generics.ListCreateAPIView):
    """Admin-only endpoint to list and search all registered users."""
    queryset = User.objects.all().select_related('college', 'department').order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_college_verified', 'college', 'department']
    search_fields = ['full_name', 'email', 'enrollment_number', 'phone_number']
    ordering_fields = ['date_joined', 'full_name', 'email', 'role', 'last_login']

    def perform_create(self, serializer):
        user = serializer.save()
        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=self.request.user,
            action='REGISTER',
            title=f"Admin created user: {user.full_name or user.email}",
            details={'created_user_id': str(user.id), 'email': user.email, 'role': user.role}
        )


class UserAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin-only endpoint to retrieve details, update, or deactivate a specific user."""
    queryset = User.objects.all().select_related('college', 'department')
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get_serializer_class(self):
        if self.request.method in ('GET',):
            return UserAdminDetailSerializer
        return UserAdminSerializer

    def perform_update(self, serializer):
        prev_user = self.get_object()
        prev_role = prev_user.role
        prev_active = prev_user.is_active

        updated_user = serializer.save()

        from apps.analytics.models import log_activity
        # Log role changes
        if prev_role != updated_user.role:
            log_activity(
                request=self.request,
                user=self.request.user,
                action='REGISTER',
                title=f"Admin updated role for {updated_user.email}: {prev_role} -> {updated_user.role}",
                details={'target_user': str(updated_user.id), 'old_role': prev_role, 'new_role': updated_user.role}
            )
        # Log activation / deactivation
        if prev_active != updated_user.is_active:
            action_desc = "activated" if updated_user.is_active else "deactivated"
            log_activity(
                request=self.request,
                user=self.request.user,
                action='LOGIN' if updated_user.is_active else 'LOGOUT',
                title=f"Admin {action_desc} account: {updated_user.email}",
                details={'target_user': str(updated_user.id), 'is_active': updated_user.is_active}
            )

    def perform_destroy(self, instance):
        actor = self.request.user
        is_super = actor.is_superuser or getattr(actor, 'role', '').upper() == 'SUPER_ADMIN'
        if not is_super:
            raise permissions.exceptions.PermissionDenied("Only Super Administrators can delete user accounts.")
        if instance.id == actor.id:
            raise permissions.exceptions.PermissionDenied("You cannot delete your own active administrator account.")

        from apps.analytics.models import log_activity
        log_activity(
            request=self.request,
            user=actor,
            action='LOGOUT',
            title=f"Admin deleted user account: {instance.full_name or instance.email}",
            details={'deleted_email': instance.email, 'deleted_id': str(instance.id)}
        )
        instance.delete()


class AdminStatsView(APIView):
    """Admin-only endpoint returning accurate platform statistics and analytics."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get(self, request):
        from django.db.models import Count, Q

        user_stats = User.objects.aggregate(
            total_users=Count('id'),
            active_users=Count('id', filter=Q(is_active=True)),
            inactive_users=Count('id', filter=Q(is_active=False)),
            student_users=Count('id', filter=Q(role__iexact='STUDENT')),
            faculty_users=Count('id', filter=Q(role__iexact='FACULTY')),
            admin_users=Count('id', filter=Q(role__in=['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'])),
        )

        book_stats = Book.objects.aggregate(
            total_books=Count('id'),
            available_books=Count('id', filter=Q(status='Available')),
            sold_books=Count('id', filter=Q(status__iexact='Sold')),
            exchanged_books=Count('id', filter=Q(status__iexact='Exchanged')),
            donated_books=Count('id', filter=Q(status__iexact='Donated')),
        )

        swap_stats = ExchangeProposal.objects.aggregate(
            active_swaps=Count('id', filter=Q(status='pending')),
            completed_swaps=Count('id', filter=Q(status='completed')),
        )

        donation_stats = DonationClaim.objects.aggregate(
            total_claims=Count('id'),
            approved_donations=Count('id', filter=Q(status__in=['approved', 'completed'])),
        )

        total_colleges = College.objects.count()
        total_departments = Department.objects.count()
        total_courses = Course.objects.count()

        total_users = user_stats['total_users']
        active_users = user_stats['active_users']
        inactive_users = user_stats['inactive_users']
        student_users = user_stats['student_users']
        faculty_users = user_stats['faculty_users']
        admin_users = user_stats['admin_users']

        total_books = book_stats['total_books']
        available_books = book_stats['available_books']
        sold_books = book_stats['sold_books']
        exchanged_books = book_stats['exchanged_books']
        donated_books = book_stats['donated_books']

        active_swaps = swap_stats['active_swaps']
        completed_swaps = swap_stats['completed_swaps']
        total_claims = donation_stats['total_claims']
        approved_donations = donation_stats['approved_donations']

        # Recent records
        recent_users = list(User.objects.order_by('-date_joined')[:5].values('id', 'full_name', 'email', 'role', 'is_active', 'date_joined'))
        for u in recent_users:
            u['id'] = str(u['id'])
            u['date_joined'] = u['date_joined'].isoformat() if u.get('date_joined') else None

        recent_books = list(Book.objects.select_related('seller').order_by('-created_at')[:5].values(
            'id', 'title', 'author', 'branch', 'price', 'mode', 'status', 'created_at', 'seller__full_name'
        ))
        for b in recent_books:
            b['created_at'] = b['created_at'].isoformat() if b.get('created_at') else None

        recent_exchanges = list(ExchangeProposal.objects.select_related('target_book', 'proposer').order_by('-created_at')[:5].values(
            'id', 'status', 'created_at', 'target_book__title', 'proposer__full_name'
        ))
        for ex in recent_exchanges:
            ex['id'] = str(ex.get('id', ''))
            ex['created_at'] = ex['created_at'].isoformat() if ex.get('created_at') else None

        recent_donations = list(DonationClaim.objects.select_related('book', 'claimer').order_by('-created_at')[:5].values(
            'id', 'status', 'created_at', 'book__title', 'claimer__full_name'
        ))
        for d in recent_donations:
            d['created_at'] = d['created_at'].isoformat() if d.get('created_at') else None

        recent_activity = list(ActivityLog.objects.order_by('-created_at')[:10].values(
            'id', 'action', 'title', 'user_email', 'user_name', 'created_at', 'ip_address'
        ))
        for a in recent_activity:
            a['id'] = str(a.get('id', ''))
            a['created_at'] = a['created_at'].isoformat() if a.get('created_at') else None

        # Department distribution of books
        from django.db.models import Count
        dept_counts = list(Book.objects.values('branch').annotate(count=Count('id')).order_by('-count')[:8])
        # Listing type breakdown
        mode_counts = list(Book.objects.values('mode').annotate(count=Count('id')).order_by('-count'))

        return Response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'inactiveUsers': inactive_users,
            'studentUsers': student_users,
            'facultyUsers': faculty_users,
            'adminUsers': admin_users,
            'totalListings': total_books,
            'totalBooks': total_books,
            'availableListings': available_books,
            'availableBooks': available_books,
            'soldBooks': sold_books,
            'exchangedBooks': exchanged_books,
            'donatedBooks': donated_books,
            'activeSwaps': active_swaps,
            'completedSwaps': completed_swaps,
            'freeDonations': total_claims,
            'approvedDonations': approved_donations,
            'totalColleges': total_colleges,
            'totalDepartments': total_departments,
            'totalCourses': total_courses,
            'totalTransactions': completed_swaps + approved_donations,
            'recentRegistrations': recent_users,
            'recentListings': recent_books,
            'recentExchanges': recent_exchanges,
            'recentDonations': recent_donations,
            'recentActivity': recent_activity,
            'departmentDistribution': dept_counts,
            'listingTypeBreakdown': mode_counts,
        }, status=status.HTTP_200_OK)


ProfileView = UserProfileView


class LogoutView(APIView):
    """
    Secure logout endpoint:
    1. Blacklists the SimpleJWT refresh token server-side if provided.
    2. Logs the logout event for audit trails.
    3. Handles expired or missing tokens gracefully without throwing errors.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh') or request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Expired, already blacklisted, or malformed token - handled safely
                pass

        if request.user and request.user.is_authenticated:
            try:
                from apps.analytics.models import log_activity
                log_activity(
                    request=request,
                    user=request.user,
                    action='LOGOUT',
                    title=f"User logout: {request.user.full_name or request.user.email}",
                    details={'email': request.user.email}
                )
            except Exception:
                pass

        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

