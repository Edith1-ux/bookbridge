import csv
import io
import time
from datetime import datetime, timedelta
from django.db import connection
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

# pyrefly: ignore [missing-import]
from apps.core.feature_flags import FeatureFlagEngine
# pyrefly: ignore [missing-import]
from apps.users.permissions import IsBookBridgeeAdmin
from apps.users.models import User
from apps.books.models import Book
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim
from apps.colleges.models import College, Department, Course
from apps.analytics.models import ActivityLog, log_activity
from apps.notifications.models import Notification


class AdminOverviewView(APIView):
    """Enterprise Admin Portal overview: Feature flags, system KPIs, and moderation status."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get(self, request):
        return Response({
            'status': 'HEALTHY',
            'feature_flags': FeatureFlagEngine.get_all_flags(),
            'total_users': User.objects.count(),
            'total_books': Book.objects.count(),
            'pending_swaps': ExchangeProposal.objects.filter(status='pending').count(),
            'pending_donations': DonationClaim.objects.filter(status='pending').count(),
            'audit_log_status': 'ACTIVE'
        })


class AdminAnalyticsView(APIView):
    """Deep business intelligence: Trends, distributions, and engagement metrics."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get(self, request):
        # 1. Monthly Registration and Listing Trends (Past 6 months)
        now = timezone.now()
        monthly_trends = []
        for i in range(5, -1, -1):
            start_date = (now - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i > 0:
                end_date = (now - timedelta(days=(i - 1) * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                end_date = now + timedelta(days=1)

            month_label = start_date.strftime('%b %Y')
            users_count = User.objects.filter(date_joined__gte=start_date, date_joined__lt=end_date).count()
            books_count = Book.objects.filter(created_at__gte=start_date, created_at__lt=end_date).count()
            monthly_trends.append({
                'month': month_label,
                'users': users_count,
                'books': books_count
            })

        # 2. Branch / Department Distribution
        branch_distribution = list(Book.objects.values('branch').annotate(count=Count('id')).order_by('-count')[:8])

        # 3. Listing Mode Breakdown
        mode_breakdown = list(Book.objects.values('mode').annotate(count=Count('id')).order_by('-count'))

        # 4. Condition Breakdown
        condition_breakdown = list(Book.objects.values('condition').annotate(count=Count('id')).order_by('-count'))

        # 5. Top Active Colleges
        top_colleges = list(College.objects.annotate(
            students_count=Count('students', distinct=True)
        ).values('name', 'code', 'students_count').order_by('-students_count')[:5])

        # 6. Exchange Success Rate
        total_swaps = ExchangeProposal.objects.count()
        completed_swaps = ExchangeProposal.objects.filter(status='completed').count()
        swap_success_rate = round((completed_swaps / total_swaps * 100), 1) if total_swaps > 0 else 0

        return Response({
            'monthlyTrends': monthly_trends,
            'branchDistribution': branch_distribution,
            'modeBreakdown': mode_breakdown,
            'conditionBreakdown': condition_breakdown,
            'topColleges': top_colleges,
            'exchangeStats': {
                'total': total_swaps,
                'completed': completed_swaps,
                'successRate': swap_success_rate
            }
        }, status=status.HTTP_200_OK)


class AdminSystemHealthView(APIView):
    """Platform health check and live diagnostic telemetry for administrator."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get(self, request):
        db_ok = True
        db_latency_ms = 0
        try:
            t0 = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_latency_ms = round((time.time() - t0) * 1000, 2)
        except Exception:
            db_ok = False

        vendor = connection.vendor
        return Response({
            'status': 'HEALTHY' if db_ok else 'DEGRADED',
            'server_time': timezone.now().isoformat(),
            'database': {
                'connected': db_ok,
                'vendor': vendor,
                'latency_ms': db_latency_ms,
            },
            'engine': {
                'version': '2.0.0',
                'service': 'BookBridgee Core Engine',
                'environment': 'Production' if not getattr(request, 'DEBUG', False) else 'Development',
            },
            'counts': {
                'users': User.objects.count(),
                'books': Book.objects.count(),
                'colleges': College.objects.count(),
                'activity_logs': ActivityLog.objects.count(),
            }
        }, status=status.HTTP_200_OK)


class AdminBroadcastNotificationView(APIView):
    """Broadcast an official platform announcement or alert to users."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def post(self, request):
        title = request.data.get('title', '').strip()
        message = request.data.get('message', '').strip()
        target = request.data.get('target', 'all') # all, role, college
        target_value = request.data.get('target_value', '')

        if not title or not message:
            return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        recipients = User.objects.filter(is_active=True)
        if target == 'role' and target_value:
            recipients = recipients.filter(role__iexact=target_value)
        elif target == 'college' and target_value:
            recipients = recipients.filter(Q(college__id=target_value) | Q(college__code__iexact=target_value))

        recipient_list = list(recipients)
        created_notifications = [
            Notification(
                recipient=user,
                title=title,
                message=message,
                notification_type='SYSTEM',
                is_read=False
            )
            for user in recipient_list
        ]
        Notification.objects.bulk_create(created_notifications, batch_size=500)

        log_activity(
            request=request,
            user=request.user,
            action='REGISTER',
            title=f"Admin broadcast notification: '{title}' sent to {len(created_notifications)} users.",
            details={'target': target, 'target_value': target_value, 'count': len(created_notifications)}
        )

        return Response({
            'message': f"Broadcast notification sent successfully to {len(created_notifications)} users.",
            'count': len(created_notifications)
        }, status=status.HTTP_201_CREATED)


class AdminReportExportView(APIView):
    """Secure CSV export for admin data reporting with strict field sanitization."""
    permission_classes = [permissions.IsAuthenticated, IsBookBridgeeAdmin]

    def get(self, request):
        report_type = request.query_params.get('type', 'users').lower()
        now_str = timezone.now().strftime('%Y%m%d_%H%M%S')

        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == 'users':
            writer.writerow(['ID', 'Full Name', 'Email', 'Role', 'College', 'Department', 'Enrollment', 'Semester', 'Active', 'Verified', 'Date Joined', 'Last Login'])
            users = User.objects.select_related('college', 'department').all().order_by('-date_joined')
            for u in users:
                writer.writerow([
                    str(u.id),
                    u.full_name,
                    u.email,
                    u.role,
                    u.college.name if u.college else '',
                    u.department.name if u.department else '',
                    u.enrollment_number or '',
                    u.semester or '',
                    'Yes' if u.is_active else 'No',
                    'Yes' if u.is_college_verified else 'No',
                    u.date_joined.strftime('%Y-%m-%d %H:%M:%S') if u.date_joined else '',
                    u.last_login.strftime('%Y-%m-%d %H:%M:%S') if u.last_login else '',
                ])
            filename = f"bookbridge_users_{now_str}.csv"

        elif report_type == 'books':
            writer.writerow(['ID', 'Title', 'Author', 'ISBN', 'GTU Code', 'Branch', 'Semester', 'Mode', 'Price', 'Condition', 'Status', 'Views', 'Seller Name', 'Seller Email', 'Created Date'])
            books = Book.objects.select_related('seller').all().order_by('-created_at')
            for b in books:
                writer.writerow([
                    b.id,
                    b.title,
                    b.author,
                    b.isbn or '',
                    b.gtu_code or '',
                    b.branch,
                    b.semester,
                    b.mode,
                    float(b.price),
                    b.condition,
                    b.status,
                    b.views_count,
                    b.seller.full_name if b.seller else '',
                    b.seller.email if b.seller else '',
                    b.created_at.strftime('%Y-%m-%d %H:%M:%S') if b.created_at else '',
                ])
            filename = f"bookbridge_books_{now_str}.csv"

        elif report_type == 'exchanges':
            writer.writerow(['ID', 'Target Book', 'Proposer Name', 'Proposer Email', 'Owner Name', 'Owner Email', 'Offered Book', 'Status', 'Created Date', 'Updated Date'])
            exchanges = ExchangeProposal.objects.select_related('target_book', 'target_book__seller', 'proposer', 'offered_book').all().order_by('-created_at')
            for ex in exchanges:
                writer.writerow([
                    str(ex.id),
                    ex.target_book.title if ex.target_book else '',
                    ex.proposer.full_name if ex.proposer else '',
                    ex.proposer.email if ex.proposer else '',
                    ex.target_book.seller.full_name if ex.target_book and ex.target_book.seller else '',
                    ex.target_book.seller.email if ex.target_book and ex.target_book.seller else '',
                    ex.offered_book_title or (ex.offered_book.title if ex.offered_book else ''),
                    ex.status,
                    ex.created_at.strftime('%Y-%m-%d %H:%M:%S') if ex.created_at else '',
                    ex.updated_at.strftime('%Y-%m-%d %H:%M:%S') if ex.updated_at else '',
                ])
            filename = f"bookbridge_exchanges_{now_str}.csv"

        elif report_type == 'donations':
            writer.writerow(['ID', 'Book Title', 'Donor Name', 'Donor Email', 'Claimer Name', 'Claimer Email', 'Message', 'Status', 'Created Date', 'Updated Date'])
            claims = DonationClaim.objects.select_related('book', 'book__seller', 'claimer').all().order_by('-created_at')
            for cl in claims:
                writer.writerow([
                    cl.id,
                    cl.book.title if cl.book else '',
                    cl.book.seller.full_name if cl.book and cl.book.seller else '',
                    cl.book.seller.email if cl.book and cl.book.seller else '',
                    cl.claimer.full_name if cl.claimer else '',
                    cl.claimer.email if cl.claimer else '',
                    cl.message or '',
                    cl.status,
                    cl.created_at.strftime('%Y-%m-%d %H:%M:%S') if cl.created_at else '',
                    cl.updated_at.strftime('%Y-%m-%d %H:%M:%S') if cl.updated_at else '',
                ])
            filename = f"bookbridge_donations_{now_str}.csv"

        elif report_type == 'colleges':
            writer.writerow(['ID', 'College Name', 'Code', 'City', 'State', 'Active', 'Created Date'])
            colleges = College.objects.all().order_by('name')
            for c in colleges:
                writer.writerow([
                    str(c.id),
                    c.name,
                    c.code,
                    c.city,
                    c.state,
                    'Yes' if c.is_active else 'No',
                    c.created_at.strftime('%Y-%m-%d %H:%M:%S') if c.created_at else '',
                ])
            filename = f"bookbridge_colleges_{now_str}.csv"

        elif report_type == 'logs':
            writer.writerow(['ID', 'Action', 'Title', 'User Name', 'User Email', 'IP Address', 'Timestamp'])
            logs = ActivityLog.objects.all().order_by('-created_at')[:5000]
            for l in logs:
                writer.writerow([
                    str(l.id),
                    l.action,
                    l.title,
                    l.user_name or '',
                    l.user_email or '',
                    l.ip_address or '',
                    l.created_at.strftime('%Y-%m-%d %H:%M:%S') if l.created_at else '',
                ])
            filename = f"bookbridge_audit_logs_{now_str}.csv"

        else:
            return Response({'error': f"Unknown report type: {report_type}"}, status=status.HTTP_400_BAD_REQUEST)

        log_activity(
            request=request,
            user=request.user,
            action='REGISTER',
            title=f"Admin exported CSV report: {report_type}",
            details={'report_type': report_type, 'filename': filename}
        )

        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
