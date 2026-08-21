from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.books.models import Book
from apps.exchange.models import ExchangeProposal


class ExchangeAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.exchanges_url = '/api/exchanges/'

        self.seller = User.objects.create_user(
            email='seller@rcti.ac.in',
            password='Password123!',
            full_name='Book Seller',
            role='STUDENT'
        )

        self.proposer = User.objects.create_user(
            email='proposer@rcti.ac.in',
            password='Password123!',
            full_name='Book Proposer',
            role='STUDENT'
        )

        self.target_book = Book.objects.create(
            seller=self.seller,
            title='Digital Electronics',
            branch='EE',
            semester=3,
            mode='exchange',
            status='Available'
        )

        self.proposer_book = Book.objects.create(
            seller=self.proposer,
            title='Analog Circuits',
            branch='EE',
            semester=3,
            mode='exchange',
            status='Available'
        )

    def test_self_exchange_is_rejected(self):
        self.client.force_authenticate(user=self.seller)
        payload = {
            'target_book': self.target_book.id,
            'offered_book_title': 'Another Book'
        }
        res = self.client.post(self.exchanges_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_proposing_exchange_success(self):
        self.client.force_authenticate(user=self.proposer)
        payload = {
            'target_book': self.target_book.id,
            'offered_book': self.proposer_book.id,
            'note': 'Looking to swap for sem 3!'
        }
        res = self.client.post(self.exchanges_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')

    def test_duplicate_pending_exchange_is_rejected(self):
        self.client.force_authenticate(user=self.proposer)
        payload = {
            'target_book': self.target_book.id,
            'offered_book_title': 'Some Book'
        }
        res1 = self.client.post(self.exchanges_url, payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(self.exchanges_url, payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_exchange_status_transition_lifecycle(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.proposer,
            target_book=self.target_book,
            offered_book=self.proposer_book,
            status='pending'
        )

        # Proposer cannot accept the proposal (only target book owner can)
        self.client.force_authenticate(user=self.proposer)
        res_fail = self.client.patch(f'/api/exchanges/{proposal.id}/', {'status': 'accepted'}, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Target book owner accepts the proposal
        self.client.force_authenticate(user=self.seller)
        res_accept = self.client.patch(f'/api/exchanges/{proposal.id}/', {'status': 'accepted'}, format='json')
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        self.assertEqual(res_accept.data['status'], 'accepted')

        # Either participant marks completed
        res_complete = self.client.patch(f'/api/exchanges/{proposal.id}/', {'status': 'completed'}, format='json')
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)
        self.assertEqual(res_complete.data['status'], 'completed')

        # Verify books status updated
        self.target_book.refresh_from_db()
        self.assertEqual(self.target_book.status, 'Exchanged')
