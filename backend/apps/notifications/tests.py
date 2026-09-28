from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.notifications.models import Notification, push_notification


class NotificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.notif_url = '/api/notifications/'
        self.read_url = '/api/notifications/read/'

        self.user = User.objects.create_user(
            email='notifuser@rcti.ac.in',
            password='Password123!',
            full_name='Notif User',
            role='STUDENT'
        )

        self.notif1 = push_notification(
            recipient=self.user,
            title='Test Alert 1',
            message='First notification message',
            notification_type='SYSTEM'
        )
        self.notif2 = push_notification(
            recipient=self.user,
            title='Test Alert 2',
            message='Second notification message',
            notification_type='EXCHANGE'
        )

    def test_unauthenticated_cannot_access_notifications(self):
        res = self.client.get(self.notif_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_notifications_count(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(self.notif_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)
        self.assertEqual(len(res.data['notifications']), 2)

    def test_mark_single_notification_read(self):
        self.client.force_authenticate(user=self.user)
        single_url = f'/api/notifications/{self.notif1.id}/read/'
        res = self.client.post(single_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

        # Count should now be 1
        res2 = self.client.get(self.notif_url)
        self.assertEqual(res2.data['count'], 1)

    def test_mark_all_notifications_read(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post(self.read_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res2 = self.client.get(self.notif_url)
        self.assertEqual(res2.data['count'], 0)
