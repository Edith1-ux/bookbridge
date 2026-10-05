import json
import hmac
import hashlib
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.colleges.models import College
from apps.books.models import Book
from apps.payments.models import Order, SellerPaymentAccount, PaymentWebhookEvent
from apps.payments.services import (
    calculate_fees,
    verify_razorpay_payment_signature,
    verify_webhook_signature,
    get_route_status,
)

User = get_user_model()


class PaymentServiceTests(TestCase):
    def test_fee_calculation_zero_percent(self):
        with patch.dict('os.environ', {'BOOKBRIDGE_PLATFORM_FEE_PERCENT': '0.0', 'BOOKBRIDGE_PLATFORM_FEE_FIXED': '0.0'}):
            fee, seller_amt = calculate_fees(500.00)
            self.assertEqual(fee, Decimal('0.00'))
            self.assertEqual(seller_amt, Decimal('500.00'))

    def test_fee_calculation_configured_percent(self):
        with patch.dict('os.environ', {'BOOKBRIDGE_PLATFORM_FEE_PERCENT': '5.0', 'BOOKBRIDGE_PLATFORM_FEE_FIXED': '0.0'}):
            fee, seller_amt = calculate_fees(500.00)
            self.assertEqual(fee, Decimal('25.00'))
            self.assertEqual(seller_amt, Decimal('475.00'))

    def test_signature_verification_valid_and_invalid(self):
        secret = 'test_secret_key_12345'
        order_id = 'order_test_98765'
        payment_id = 'pay_test_54321'
        
        # Valid signature computation
        msg = f"{order_id}|{payment_id}".encode('utf-8')
        valid_sig = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()

        with patch.dict('os.environ', {'RAZORPAY_KEY_SECRET': secret}):
            is_valid, err = verify_razorpay_payment_signature(order_id, payment_id, valid_sig)
            self.assertTrue(is_valid)
            self.assertIsNone(err)

            is_valid_fake, err_fake = verify_razorpay_payment_signature(order_id, payment_id, 'invalid_signature_hash')
            self.assertFalse(is_valid_fake)
            self.assertIsNotNone(err_fake)

    def test_route_status_handling(self):
        with patch.dict('os.environ', {'RAZORPAY_KEY_ID': 'rzp_test_123', 'RAZORPAY_KEY_SECRET': 'sec_123', 'RAZORPAY_ROUTE_STATUS': 'ROUTE_DISABLED'}):
            self.assertEqual(get_route_status(), 'ROUTE_DISABLED')


class PaymentAPIFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.college = College.objects.create(name="RCTI Campus", code="043")
        
        # Create Buyer
        self.buyer = User.objects.create_user(
            email="buyer@student.gtu.ac.in",
            password="StrongPassword123!",
            full_name="Alice Student",
            college=self.college
        )
        
        # Create Seller
        self.seller = User.objects.create_user(
            email="seller@student.gtu.ac.in",
            password="StrongPassword123!",
            full_name="Bob Seller",
            college=self.college
        )

        # Create Admin
        self.admin_user = User.objects.create_superuser(
            email="admin@bookbridge.local",
            password="AdminPassword123!",
            full_name="Super Administrator",
            college=self.college
        )

        # Create Book Listing
        self.book = Book.objects.create(
            seller=self.seller,
            title="Database System Concepts",
            author="Silberschatz",
            branch="CE",
            semester=5,
            price=Decimal('450.00'),
            status="Available",
            location="RCTI Central Library"
        )

    def test_unauthenticated_intent_rejected(self):
        url = reverse('v1-payments:create-payment-intent')
        res = self.client.post(url, {'book_id': self.book.id, 'gateway': 'CAMPUS_DEAL'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_buy_own_book(self):
        self.client.force_authenticate(user=self.seller)
        url = reverse('v1-payments:create-payment-intent')
        res = self.client.post(url, {'book_id': self.book.id, 'gateway': 'CAMPUS_DEAL'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('own listed book', res.data.get('error', ''))

    def test_campus_deal_intent_creation(self):
        self.client.force_authenticate(user=self.buyer)
        url = reverse('v1-payments:create-payment-intent')
        res = self.client.post(url, {
            'book_id': self.book.id,
            'gateway': 'CAMPUS_DEAL',
            'pickup_location': 'Campus Central Library',
            'notes': 'Can meet Monday at 2 PM'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'DIRECT_HANDOVER_CONFIRMED')
        self.assertEqual(res.data['gateway'], 'CAMPUS_DEAL')
        self.assertEqual(float(res.data['amount']), 450.00)

        # Verify database state
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, 'Reserved')

        order = Order.objects.filter(book=self.book, buyer=self.buyer).first()
        self.assertIsNotNone(order)
        self.assertEqual(order.payment_method, 'CAMPUS_DEAL')
        self.assertEqual(order.settlement_status, 'SETTLEMENT_PENDING_CAMPUS_HANDOVER')
        self.assertEqual(order.payment_status, 'PENDING')

    def test_online_razorpay_order_creation(self):
        self.client.force_authenticate(user=self.buyer)
        url = reverse('v1-payments:create-payment-intent')

        mock_rzp_order = {
            'id': 'order_test_rzp_112233',
            'amount': 45000,
            'currency': 'INR',
            'status': 'created'
        }

        with patch.dict('os.environ', {'RAZORPAY_KEY_ID': 'rzp_test_sample', 'RAZORPAY_KEY_SECRET': 'sample_secret_123'}):
            with patch('apps.payments.views.create_upstream_razorpay_order', return_value=(mock_rzp_order, None)):
                res = self.client.post(url, {
                    'book_id': self.book.id,
                    'gateway': 'ONLINE_RAZORPAY',
                    'pickup_location': 'Campus Library'
                })
                self.assertEqual(res.status_code, status.HTTP_201_CREATED)
                self.assertEqual(res.data['status'], 'ORDER_CREATED')
                self.assertEqual(res.data['gateway'], 'ONLINE_RAZORPAY')
                self.assertEqual(res.data['order_id'], 'order_test_rzp_112233')

                # Verify book is reserved
                self.book.refresh_from_db()
                self.assertEqual(self.book.status, 'Reserved')

    def test_double_purchase_prevention(self):
        """If book is already Reserved or Sold, concurrent buyer receives 409 Conflict"""
        self.book.status = 'Reserved'
        self.book.save()

        self.client.force_authenticate(user=self.buyer)
        url = reverse('v1-payments:create-payment-intent')
        res = self.client.post(url, {'book_id': self.book.id, 'gateway': 'CAMPUS_DEAL'})
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

    def test_payment_verification_success(self):
        secret = 'test_secret_verify_key'
        order = Order.objects.create(
            order_number='BBO-2026-TEST01',
            book=self.book,
            book_title=self.book.title,
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('450.00'),
            platform_fee=Decimal('0.00'),
            seller_amount=Decimal('450.00'),
            payment_method='ONLINE_RAZORPAY',
            payment_status='PENDING',
            order_status='RESERVED',
            razorpay_order_id='order_test_verify_999'
        )

        rzp_order_id = 'order_test_verify_999'
        rzp_pay_id = 'pay_test_verify_888'
        msg = f"{rzp_order_id}|{rzp_pay_id}".encode('utf-8')
        sig = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()

        self.client.force_authenticate(user=self.buyer)
        url = reverse('v1-payments:verify-payment')

        with patch.dict('os.environ', {'RAZORPAY_KEY_ID': 'rzp_test_sample', 'RAZORPAY_KEY_SECRET': secret}):
            res = self.client.post(url, {
                'razorpay_order_id': rzp_order_id,
                'razorpay_payment_id': rzp_pay_id,
                'razorpay_signature': sig,
                'bookbridge_order_id': str(order.id)
            })

            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res.data['payment_status'], 'PAID')

            order.refresh_from_db()
            self.assertEqual(order.payment_status, 'PAID')
            self.assertEqual(order.settlement_status, 'TEST_CAPTURED')

            self.book.refresh_from_db()
            self.assertEqual(self.book.status, 'Sold')

    def test_payment_verification_invalid_signature_rejected(self):
        order = Order.objects.create(
            order_number='BBO-2026-TEST02',
            book=self.book,
            book_title=self.book.title,
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('450.00'),
            platform_fee=Decimal('0.00'),
            seller_amount=Decimal('450.00'),
            payment_method='ONLINE_RAZORPAY',
            payment_status='PENDING',
            order_status='RESERVED',
            razorpay_order_id='order_test_tamper_111'
        )

        self.client.force_authenticate(user=self.buyer)
        url = reverse('v1-payments:verify-payment')

        with patch.dict('os.environ', {'RAZORPAY_KEY_ID': 'rzp_test_sample', 'RAZORPAY_KEY_SECRET': 'valid_secret'}):
            res = self.client.post(url, {
                'razorpay_order_id': 'order_test_tamper_111',
                'razorpay_payment_id': 'pay_fake_111',
                'razorpay_signature': 'tampered_fake_signature',
                'bookbridge_order_id': str(order.id)
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_idempotency_and_signature_verification(self):
        secret = 'webhook_secret_xyz'
        order = Order.objects.create(
            order_number='BBO-2026-HOOK01',
            book=self.book,
            book_title=self.book.title,
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('450.00'),
            platform_fee=Decimal('0.00'),
            seller_amount=Decimal('450.00'),
            payment_method='ONLINE_RAZORPAY',
            payment_status='PENDING',
            order_status='RESERVED',
            razorpay_order_id='order_webhook_test_555'
        )

        payload = {
            'event': 'payment.captured',
            'id': 'evt_test_unique_001',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_hook_555',
                        'order_id': 'order_webhook_test_555',
                        'amount': 45000,
                        'status': 'captured'
                    }
                }
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        sig = hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

        url = reverse('v1-payments:razorpay-webhook')
        with patch.dict('os.environ', {'RAZORPAY_KEY_ID': 'rzp_test_1', 'RAZORPAY_KEY_SECRET': 'sec', 'RAZORPAY_WEBHOOK_SECRET': secret}):
            # First execution
            res1 = self.client.post(
                url,
                data=body_bytes.decode('utf-8'),
                content_type='application/json',
                HTTP_X_RAZORPAY_SIGNATURE=sig
            )
            self.assertEqual(res1.status_code, status.HTTP_200_OK)

            order.refresh_from_db()
            self.assertEqual(order.payment_status, 'PAID')

            # Repeated webhook execution (Idempotency)
            res2 = self.client.post(
                url,
                data=body_bytes.decode('utf-8'),
                content_type='application/json',
                HTTP_X_RAZORPAY_SIGNATURE=sig
            )
            self.assertEqual(res2.status_code, status.HTTP_200_OK)
            self.assertEqual(res2.data['status'], 'EVENT_ALREADY_PROCESSED')

    def test_buyer_and_seller_dashboard_apis(self):
        Order.objects.create(
            order_number='BBO-2026-DASH01',
            book=self.book,
            book_title=self.book.title,
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('450.00'),
            platform_fee=Decimal('22.50'),
            seller_amount=Decimal('427.50'),
            payment_method='ONLINE_RAZORPAY',
            payment_status='PAID',
            order_status='PAID',
            settlement_status='TEST_CAPTURED'
        )

        # Buyer Dashboard
        self.client.force_authenticate(user=self.buyer)
        buyer_res = self.client.get(reverse('v1-payments:my-orders'))
        self.assertEqual(buyer_res.status_code, status.HTTP_200_OK)
        self.assertEqual(buyer_res.data['count'], 1)
        self.assertEqual(buyer_res.data['orders'][0]['order_number'], 'BBO-2026-DASH01')

        # Seller Dashboard
        self.client.force_authenticate(user=self.seller)
        seller_res = self.client.get(reverse('v1-payments:my-sales'))
        self.assertEqual(seller_res.status_code, status.HTTP_200_OK)
        self.assertEqual(seller_res.data['count'], 1)
        self.assertEqual(seller_res.data['sales'][0]['seller_amount'], '427.50')
        self.assertEqual(seller_res.data['sales'][0]['settlement_status'], 'TEST_CAPTURED')

    def test_admin_orders_access_control(self):
        # Normal student is denied access
        self.client.force_authenticate(user=self.buyer)
        res_denied = self.client.get(reverse('v1-payments:admin-orders-list'))
        self.assertEqual(res_denied.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user is granted access
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.get(reverse('v1-payments:admin-orders-list'))
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertIn('orders', res_admin.data)
