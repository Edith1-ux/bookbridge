from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.chat.models import ChatMessage
from apps.notifications.models import Notification


class ChatAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.messages_url = '/api/messages/'

        self.student1 = User.objects.create_user(
            email='student1@rcti.ac.in',
            password='Password123!',
            full_name='Student One',
            role='STUDENT'
        )

        self.student2 = User.objects.create_user(
            email='student2@rcti.ac.in',
            password='Password123!',
            full_name='Student Two',
            role='STUDENT'
        )

    def test_unauthenticated_cannot_access_messages(self):
        res = self.client.get(self.messages_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_send_and_retrieve_message(self):
        self.client.force_authenticate(user=self.student1)
        payload = {
            'receiver_email': self.student2.email,
            'text': 'Hi, is your DBMS book still available?',
            'book_title': 'DBMS Book'
        }
        res = self.client.post(self.messages_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['text'], 'Hi, is your DBMS book still available?')
        self.assertEqual(res.data['sender_email'], self.student1.email)

        # Verify notification was generated for recipient
        notif = Notification.objects.filter(recipient=self.student2).first()
        self.assertIsNotNone(notif)
        self.assertIn('Student One', notif.title)

        # Retrieve conversation as recipient
        self.client.force_authenticate(user=self.student2)
        get_res = self.client.get(self.messages_url, {'with': self.student1.email})
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        results = get_res.data if isinstance(get_res.data, list) else get_res.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['text'], 'Hi, is your DBMS book still available?')
