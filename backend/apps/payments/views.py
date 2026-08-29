import os
import hmac
import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.books.models import Book


class WalletBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'user_id': str(request.user.id),
            'balance': 0.00,
            'escrow_held': 0.00,
            'currency': 'INR',
            'payment_modes_available': ['DIRECT_HANDOVER', 'OFFLINE_UPI'] + (
                ['RAZORPAY'] if os.environ.get('RAZORPAY_KEY_ID') else []
            )
        })


class CreatePaymentIntentView(APIView):
    """
    Creates an order or campus direct-handover intent.
    Never returns fake transaction IDs pretending to be a successful gateway charge.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        amount = request.data.get('amount')
        gateway = request.data.get('gateway', 'DIRECT_HANDOVER').upper()
        book = None

        if book_id:
            try:
                book = Book.objects.get(pk=book_id)
                if amount is None:
                    amount = float(book.price)
            except (Book.DoesNotExist, ValueError):
                return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        if amount is None:
            amount = 0.0
        else:
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID')
        razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET')

        if gateway == 'RAZORPAY' and razorpay_key_id and razorpay_key_secret:
            try:
                import requests
                # Convert amount in INR to Paise (multiply by 100)
                amount_paise = int(amount * 100)
                auth = (razorpay_key_id, razorpay_key_secret)
                payload = {
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': f'rcpt_bb_{request.user.id}_{book_id or "direct"}',
                    'notes': {
                        'buyer_email': request.user.email,
                        'book_id': str(book_id) if book_id else ''
                    }
                }
                res = requests.post('https://api.razorpay.com/v1/orders', json=payload, auth=auth, timeout=10)
                if res.status_code in (200, 201):
                    order_data = res.json()
                    return Response({
                        'status': 'ORDER_CREATED',
                        'gateway': 'RAZORPAY',
                        'key_id': razorpay_key_id,
                        'order_id': order_data.get('id'),
                        'amount': amount,
                        'currency': 'INR'
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'error': 'Failed to create Razorpay order with upstream gateway.',
                        'details': res.text
                    }, status=status.HTTP_502_BAD_GATEWAY)
            except Exception as e:
                return Response({
                    'error': f'Razorpay gateway communication error: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Standard campus direct handover / offline cash/UPI flow
        pickup_location = getattr(book, 'location', 'Campus Student Center') if book else 'Designated Campus Meeting Point'
        seller_contact = getattr(book.seller, 'phone_number', None) if book and book.seller else None

        from apps.analytics.models import log_activity
        log_activity(
            request=request,
            user=request.user,
            action='BUY_REQUEST',
            title=f"Buy / Handover request for: {book.title if book else 'Academic Resource'} (₹{amount})",
            details={
                'book_id': getattr(book, 'id', None),
                'book_title': getattr(book, 'title', None),
                'seller_email': getattr(book.seller, 'email', None) if book and book.seller else None,
                'amount': amount,
                'gateway': gateway,
                'pickup_location': pickup_location
            }
        )

        return Response({
            'status': 'DIRECT_HANDOVER_CONFIRMED',
            'gateway': 'OFFLINE_DIRECT',
            'amount': amount,
            'currency': 'INR',
            'pickup_location': pickup_location,
            'message': 'Campus pickup arrangement initiated. Inspect the book in person before making direct payment to the student seller.',
            'seller_contact_available': bool(seller_contact)
        }, status=status.HTTP_200_OK)


class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
        if not webhook_secret:
            return Response({'status': 'Webhook secret not configured'}, status=status.HTTP_501_NOT_IMPLEMENTED)

        received_sig = request.headers.get('X-Razorpay-Signature')
        if not received_sig:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        body = request.body
        expected_sig = hmac.new(webhook_secret.encode('utf-8'), body, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(received_sig, expected_sig):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        # Process valid webhook event
        event_data = request.data
        return Response({'status': 'EVENT_PROCESSED', 'event': event_data.get('event')}, status=status.HTTP_200_OK)
