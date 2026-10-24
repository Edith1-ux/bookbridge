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


class ChatConversationTests(TestCase):
    """Regression tests for the Messages tab fixes."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/messages/'
        self.alice = User.objects.create_user(email='alice@rcti.ac.in', password='Password123!', full_name='Alice', role='STUDENT')
        self.bob = User.objects.create_user(email='bob@rcti.ac.in', password='Password123!', full_name='Bob', role='STUDENT')
        self.carol = User.objects.create_user(email='carol@rcti.ac.in', password='Password123!', full_name='Carol', role='STUDENT')

    def test_with_filter_returns_only_that_conversation(self):
        ChatMessage.objects.create(sender=self.alice, receiver_email=self.bob.email, text='alice->bob')
        ChatMessage.objects.create(sender=self.bob, receiver_email=self.alice.email, text='bob->alice')
        ChatMessage.objects.create(sender=self.carol, receiver_email=self.alice.email, text='carol->alice')

        self.client.force_authenticate(user=self.alice)
        res = self.client.get(self.url, {'with': self.bob.email})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([m['text'] for m in res.data], ['alice->bob', 'bob->alice'])

    def test_list_is_a_plain_array_and_not_cut_at_20(self):
        for i in range(25):
            ChatMessage.objects.create(sender=self.alice, receiver_email=self.bob.email, text=f'msg {i}')
        self.client.force_authenticate(user=self.alice)
        res = self.client.get(self.url)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 25)

    def test_response_includes_receiver_name(self):
        ChatMessage.objects.create(sender=self.alice, receiver_email=self.bob.email, text='hello')
        self.client.force_authenticate(user=self.alice)
        res = self.client.get(self.url)
        self.assertEqual(res.data[0]['receiver_name'], 'Bob')
        self.assertEqual(res.data[0]['sender_name'], 'Alice')

    def test_cannot_message_yourself(self):
        self.client.force_authenticate(user=self.alice)
        res = self.client.post(self.url, {'receiver_email': self.alice.email, 'text': 'hi me'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_receiver_is_rejected(self):
        self.client.force_authenticate(user=self.alice)
        res = self.client.post(self.url, {'receiver_email': 'nobody@example.com', 'text': 'hello'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_support_system_address_is_allowed(self):
        self.client.force_authenticate(user=self.alice)
        res = self.client.post(self.url, {'receiver_email': 'support@bookbridge.local', 'text': 'Need help'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_blank_message_is_rejected(self):
        self.client.force_authenticate(user=self.alice)
        res = self.client.post(self.url, {'receiver_email': self.bob.email, 'text': '   '}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_notification_link_opens_messages_tab(self):
        self.client.force_authenticate(user=self.alice)
        self.client.post(self.url, {'receiver_email': self.bob.email, 'text': 'Is it available?'}, format='json')
        notif = Notification.objects.filter(recipient=self.bob).first()
        self.assertEqual(notif.link, '/dashboard.html?tab=messages')


class ChatReceiverIdTests(TestCase):
    """Buyer messages a seller by user id (listings never expose the seller's email)."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/messages/'
        self.seller = User.objects.create_user(email='seller@rcti.ac.in', password='Password123!', full_name='Sam Seller', role='STUDENT')
        self.buyer = User.objects.create_user(email='buyer@rcti.ac.in', password='Password123!', full_name='Bea Buyer', role='STUDENT')

    def test_buyer_to_seller_and_seller_reply(self):
        self.client.force_authenticate(user=self.buyer)
        res = self.client.post(self.url, {'receiver_id': self.seller.id, 'text': 'Is it available?', 'book_title': 'DBMS'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['receiver_email'], self.seller.email)

        self.client.force_authenticate(user=self.seller)
        inbox = self.client.get(self.url, {'with': self.buyer.email})
        self.assertEqual([m['text'] for m in inbox.data], ['Is it available?'])

        reply = self.client.post(self.url, {'receiver_email': self.buyer.email, 'text': 'Yes!', 'book_title': 'DBMS'}, format='json')
        self.assertEqual(reply.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.buyer)
        thread = self.client.get(self.url, {'with': self.seller.email})
        self.assertEqual([m['text'] for m in thread.data], ['Is it available?', 'Yes!'])

    def test_cannot_message_yourself_by_id(self):
        self.client.force_authenticate(user=self.buyer)
        res = self.client.post(self.url, {'receiver_id': self.buyer.id, 'text': 'hi'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_receiver_id_and_missing_receiver(self):
        self.client.force_authenticate(user=self.buyer)
        self.assertEqual(self.client.post(self.url, {'receiver_id': 999999, 'text': 'hi'}, format='json').status_code, 400)
        self.assertEqual(self.client.post(self.url, {'text': 'hi'}, format='json').status_code, 400)

    def test_third_person_cannot_read_conversation(self):
        other = User.objects.create_user(email='other@rcti.ac.in', password='Password123!', full_name='Oz', role='STUDENT')
        self.client.force_authenticate(user=self.buyer)
        self.client.post(self.url, {'receiver_id': self.seller.id, 'text': 'private'}, format='json')
        self.client.force_authenticate(user=other)
        res = self.client.get(self.url, {'with': self.buyer.email})
        self.assertEqual(list(res.data), [])
