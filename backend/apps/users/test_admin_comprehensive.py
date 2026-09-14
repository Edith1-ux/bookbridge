import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User
from apps.books.models import Book
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim
from apps.colleges.models import College, Department, Course
from apps.analytics.models import ActivityLog


class BookBridgeeAdminComprehensiveTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create Super Admin
        self.super_admin = User.objects.create_user(
            email='superadmin@rcti.ac.in',
            password='Password123!',
            full_name='Super Admin User',
            role='SUPER_ADMIN',
            is_staff=True,
            is_superuser=True
        )

        # 2. Create College Admin
        self.college_admin = User.objects.create_user(
            email='collegeadmin@rcti.ac.in',
            password='Password123!',
            full_name='College Admin User',
            role='COLLEGE_ADMIN'
        )

        # 3. Create Department Admin
        self.dept_admin = User.objects.create_user(
            email='deptadmin@rcti.ac.in',
            password='Password123!',
            full_name='Dept Admin User',
            role='DEPT_ADMIN'
        )

        # 4. Create Normal Student 1
        self.student1 = User.objects.create_user(
            email='student1@rcti.ac.in',
            password='Password123!',
            full_name='Student One',
            role='STUDENT'
        )

        # 5. Create Normal Student 2
        self.student2 = User.objects.create_user(
            email='student2@rcti.ac.in',
            password='Password123!',
            full_name='Student Two',
            role='STUDENT'
        )

        # 6. Create College & Department
        self.college = College.objects.create(
            name='R.C. Technical Institute',
            code='RCTI',
            city='Ahmedabad',
            state='Gujarat'
        )
        self.department = Department.objects.create(
            college=self.college,
            name='Computer Engineering',
            code='CE'
        )
        self.course = Course.objects.create(
            department=self.department,
            name='Data Structures & Algorithms',
            code='3350701',
            semester=5
        )

        # 7. Create Books
        self.book1 = Book.objects.create(
            title='DSA in Python',
            author='Author One',
            branch='CE',
            semester=5,
            price=250.00,
            mode='sell',
            status='Available',
            seller=self.student1
        )
        self.book2 = Book.objects.create(
            title='Digital Electronics',
            author='Author Two',
            branch='EC',
            semester=3,
            price=0.00,
            mode='donate',
            status='Available',
            seller=self.student2
        )

        # 8. Create Exchange Proposal & Donation Claim
        self.exchange = ExchangeProposal.objects.create(
            target_book=self.book1,
            proposer=self.student2,
            offered_book_title='Database Fundamentals',
            status='pending'
        )
        self.donation = DonationClaim.objects.create(
            book=self.book2,
            claimer=self.student1,
            message='I need this textbook for my 3rd semester studies.',
            status='pending'
        )

    # ── AUTHENTICATION TESTS ──────────────────────────────────────────────────

    def test_01_registration_creates_user(self):
        payload = {
            'email': 'newstudent@rcti.ac.in',
            'password': 'Password123!',
            'full_name': 'New Student User',
            'college_name': 'R.C. Technical Institute',
            'branch': 'CE'
        }
        res = self.client.post('/api/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newstudent@rcti.ac.in').exists())
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)

    def test_02_login_and_jwt_generation(self):
        res = self.client.post('/api/login/', {'email': 'student1@rcti.ac.in', 'password': 'Password123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['email'], 'student1@rcti.ac.in')

    def test_03_profile_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'student1@rcti.ac.in')

    def test_04_logout_and_token_blacklisting(self):
        refresh = RefreshToken.for_user(self.student1)
        res = self.client.post('/api/logout/', {'refresh': str(refresh)}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Attempting to refresh with blacklisted token must fail with 401
        ref_res = self.client.post('/api/token/refresh/', {'refresh': str(refresh)}, format='json')
        self.assertEqual(ref_res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── ADMIN ACCESS CONTROL & RBAC TESTS ─────────────────────────────────────

    def test_05_student_cannot_access_admin_stats(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_06_student_cannot_access_admin_users(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get('/api/admin/users/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_07_super_admin_can_access_admin_stats(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('totalUsers', res.data)
        self.assertIn('totalListings', res.data)
        self.assertIn('departmentDistribution', res.data)
        self.assertIn('listingTypeBreakdown', res.data)
        self.assertGreaterEqual(res.data['totalUsers'], 5)

    def test_08_college_admin_can_access_admin_users(self):
        self.client.force_authenticate(user=self.college_admin)
        res = self.client.get('/api/admin/users/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results'] if 'results' in res.data else res.data), 5)

    def test_09_user_search_and_filtering(self):
        self.client.force_authenticate(user=self.super_admin)
        # Search by student name
        res = self.client.get('/api/admin/users/?search=Student One')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data['results'] if 'results' in res.data else res.data
        self.assertTrue(any(u['email'] == 'student1@rcti.ac.in' for u in data))

        # Filter by role
        res_role = self.client.get('/api/admin/users/?role=SUPER_ADMIN')
        self.assertEqual(res_role.status_code, status.HTTP_200_OK)
        role_data = res_role.data['results'] if 'results' in res_role.data else res_role.data
        self.assertTrue(all(u['role'] == 'SUPER_ADMIN' for u in role_data))

    def test_10_admin_can_activate_and_deactivate_user(self):
        self.client.force_authenticate(user=self.super_admin)
        # Deactivate student1
        res = self.client.patch(f'/api/admin/users/{self.student1.id}/', {'is_active': False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.is_active)

        # Deactivated user cannot log in
        login_res = self.client.post('/api/login/', {'email': 'student1@rcti.ac.in', 'password': 'Password123!'}, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_403_FORBIDDEN)

        # Reactivate
        res_reactivate = self.client.patch(f'/api/admin/users/{self.student1.id}/', {'is_active': True}, format='json')
        self.assertEqual(res_reactivate.status_code, status.HTTP_200_OK)
        self.student1.refresh_from_db()
        self.assertTrue(self.student1.is_active)

    def test_11_privilege_escalation_protection(self):
        # Student attempting role escalation via profile must be ignored/prevented
        self.client.force_authenticate(user=self.student1)
        res = self.client.patch('/api/profile/', {'role': 'SUPER_ADMIN', 'is_superuser': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student1.refresh_from_db()
        self.assertEqual(self.student1.role, 'STUDENT')
        self.assertFalse(self.student1.is_superuser)

        # Non-superadmin admin attempting to grant SUPER_ADMIN must be rejected
        self.client.force_authenticate(user=self.dept_admin)
        res_esc = self.client.patch(f'/api/admin/users/{self.student2.id}/', {'role': 'SUPER_ADMIN'}, format='json')
        self.assertEqual(res_esc.status_code, status.HTTP_400_BAD_REQUEST)
        self.student2.refresh_from_db()
        self.assertEqual(self.student2.role, 'STUDENT')

    # ── BOOK & MARKETPLACE OWNERSHIP & ADMIN TESTS ─────────────────────────────

    def test_12_owner_can_modify_own_book(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.patch(f'/api/books/{self.book1.id}/', {'price': 220.00}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.book1.refresh_from_db()
        self.assertEqual(float(self.book1.price), 220.00)

    def test_13_non_owner_cannot_modify_another_students_book(self):
        self.client.force_authenticate(user=self.student2)
        res = self.client.patch(f'/api/books/{self.book1.id}/', {'price': 10.00}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_14_admin_can_modify_and_delete_any_book(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.patch(f'/api/books/{self.book1.id}/', {'status': 'Sold'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.book1.refresh_from_db()
        self.assertEqual(self.book1.status, 'Sold')

        del_res = self.client.delete(f'/api/books/{self.book1.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=self.book1.id).exists())

    # ── ACADEMIC STRUCTURE (COLLEGE / DEPT / COURSE) TESTS ────────────────────

    def test_15_admin_can_create_college_dept_course(self):
        self.client.force_authenticate(user=self.super_admin)
        # Create college
        c_res = self.client.post('/api/v1/colleges/', {
            'name': 'L.D. College of Engineering',
            'code': 'LDCE',
            'city': 'Ahmedabad',
            'state': 'Gujarat'
        }, format='json')
        self.assertEqual(c_res.status_code, status.HTTP_201_CREATED)
        college_id = c_res.data['id']

        # Create department
        d_res = self.client.post('/api/v1/colleges/departments/', {
            'college': college_id,
            'name': 'Information Technology',
            'code': 'IT'
        }, format='json')
        self.assertEqual(d_res.status_code, status.HTTP_201_CREATED)
        dept_id = d_res.data['id']

        # Create course
        cr_res = self.client.post('/api/v1/colleges/courses/', {
            'department': dept_id,
            'name': 'Operating Systems',
            'code': '3350703',
            'semester': 5
        }, format='json')
        self.assertEqual(cr_res.status_code, status.HTTP_201_CREATED)

    def test_16_non_admin_cannot_create_college(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.post('/api/v1/colleges/', {
            'name': 'Fake College',
            'code': 'FC',
            'city': 'Surat',
            'state': 'Gujarat'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ── EXCHANGES & DONATIONS ADMINISTRATION ──────────────────────────────────

    def test_17_admin_can_manage_exchanges(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.get('/api/exchanges/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results'] if 'results' in res.data else res.data), 1)

        patch_res = self.client.patch(f'/api/exchanges/{self.exchange.id}/', {'status': 'completed'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.exchange.refresh_from_db()
        self.assertEqual(self.exchange.status, 'completed')

    def test_18_admin_can_manage_donations(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.get('/api/donations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results'] if 'results' in res.data else res.data), 1)

        patch_res = self.client.patch(f'/api/donations/{self.donation.id}/', {'status': 'completed'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, 'completed')

    # ── AUDIT LOGS, NOTIFICATIONS, SYSTEM HEALTH & CSV EXPORT ─────────────────

    def test_19_admin_broadcast_notification(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.post('/api/admin/broadcast/', {
            'title': 'Semester Exam Alert',
            'message': 'Winter 2026 examination schedule is now published.',
            'target': 'all'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('count', res.data)
        self.assertGreaterEqual(res.data['count'], 1)

    def test_20_system_health_endpoint(self):
        self.client.force_authenticate(user=self.super_admin)
        res = self.client.get('/api/admin/system-health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'HEALTHY')
        self.assertTrue(res.data['database']['connected'])

    def test_21_csv_reports_export(self):
        self.client.force_authenticate(user=self.super_admin)
        for report_type in ['users', 'books', 'exchanges', 'donations', 'colleges', 'logs']:
            res = self.client.get(f'/api/admin/export/?type={report_type}')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res['Content-Type'], 'text/csv; charset=utf-8')
            expected_prefix = 'bookbridge_audit_logs_' if report_type == 'logs' else f'bookbridge_{report_type}_'
            self.assertIn(f'attachment; filename="{expected_prefix}', res['Content-Disposition'])
