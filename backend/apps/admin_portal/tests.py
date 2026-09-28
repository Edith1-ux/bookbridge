from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.books.models import Book


class AdminPortalAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.overview_url = '/api/admin/overview/'
        self.analytics_url = '/api/admin/analytics/'
        self.health_url = '/api/admin/system-health/'
        self.broadcast_url = '/api/admin/broadcast/'
        self.export_url = '/api/admin/export/'

        self.student = User.objects.create_user(
            email='regularstudent@rcti.ac.in',
            password='Password123!',
            full_name='Regular Student',
            role='STUDENT'
        )

        self.admin = User.objects.create_user(
            email='superadmin@bookbridge.edu',
            password='AdminPassword123!',
            full_name='Super Admin',
            role='SUPER_ADMIN',
            is_staff=True,
            is_superuser=True
        )

        Book.objects.create(
            seller=self.student,
            title='Admin Test Book',
            author='Author Test',
            branch='CE',
            semester=5,
            price=200.00,
            status='Available'
        )

    def test_student_cannot_access_admin_overview(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.overview_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_overview(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.overview_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', res.data)
        self.assertIn('total_books', res.data)
        self.assertEqual(res.data['total_books'], 1)

    def test_admin_can_access_system_health(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.health_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['database_status'], 'CONNECTED')

    def test_admin_can_broadcast_notification(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'title': 'Semester Exam Alert',
            'message': 'Upload past exam papers now!',
            'target_role': 'ALL'
        }
        res = self.client.post(self.broadcast_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['recipients_count'], 1)

    def test_admin_can_export_csv_report(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(f'{self.export_url}?type=books')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="bookbridge_books_', res['Content-Disposition'])
