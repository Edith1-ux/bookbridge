from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.books.models import Book
from apps.donations.models import DonationClaim


class DonationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.donations_url = '/api/donations/'

        self.donor = User.objects.create_user(
            email='donor@rcti.ac.in',
            password='Password123!',
            full_name='Book Donor',
            role='STUDENT'
        )

        self.claimer = User.objects.create_user(
            email='claimer@rcti.ac.in',
            password='Password123!',
            full_name='Book Claimer',
            role='STUDENT'
        )

        self.donated_book = Book.objects.create(
            seller=self.donor,
            title='Engineering Physics Lab Manual',
            branch='Science',
            semester=1,
            price=0.00,
            mode='donate',
            status='Available'
        )

        self.sell_book = Book.objects.create(
            seller=self.donor,
            title='Engineering Mechanics',
            branch='ME',
            semester=2,
            price=200.00,
            mode='sell',
            status='Available'
        )

    def test_self_claim_is_rejected(self):
        self.client.force_authenticate(user=self.donor)
        payload = {
            'book': self.donated_book.id,
            'message': 'Claiming my own book'
        }
        res = self.client.post(self.donations_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_claiming_non_donation_mode_book_is_rejected(self):
        self.client.force_authenticate(user=self.claimer)
        payload = {
            'book': self.sell_book.id,
            'message': 'Want this for free'
        }
        res = self.client.post(self.donations_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_claim_donation_success(self):
        self.client.force_authenticate(user=self.claimer)
        payload = {
            'book': self.donated_book.id,
            'message': 'First year student needing lab manual'
        }
        res = self.client.post(self.donations_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')

    def test_duplicate_pending_claim_is_rejected(self):
        self.client.force_authenticate(user=self.claimer)
        payload = {
            'book': self.donated_book.id,
            'message': 'First claim'
        }
        res1 = self.client.post(self.donations_url, payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(self.donations_url, payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_donation_status_lifecycle_and_completion(self):
        claim = DonationClaim.objects.create(
            claimer=self.claimer,
            book=self.donated_book,
            message='Need manual',
            status='pending'
        )

        # Donor approves claim
        self.client.force_authenticate(user=self.donor)
        res_approve = self.client.patch(f'/api/donations/{claim.id}/', {'status': 'approved'}, format='json')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.assertEqual(res_approve.data['status'], 'approved')

        # Donor completes donation
        res_complete = self.client.patch(f'/api/donations/{claim.id}/', {'status': 'completed'}, format='json')
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)

        self.donated_book.refresh_from_db()
        self.assertEqual(self.donated_book.status, 'Donated')
