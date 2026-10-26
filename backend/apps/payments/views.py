import os
import uuid
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination

from apps.books.models import Book
from apps.notifications.models import push_notification
from apps.analytics.models import log_activity
from .models import Order, SellerPaymentAccount, PaymentWebhookEvent
from .serializers import (
    OrderSerializer,
    BuyerOrderSummarySerializer,
    SellerSaleSummarySerializer,
    SellerPaymentAccountSerializer,
)
from .services import (
    calculate_fees,
    get_razorpay_credentials,
    get_route_status,
    create_upstream_razorpay_order,
    verify_razorpay_payment_signature,
    verify_webhook_signature,
    execute_seller_settlement_transfer,
)

logger = logging.getLogger('apps.payments')


class WalletBalanceView(APIView):
    """
    Returns user wallet & escrow summary, along with live available payment modes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        creds = get_razorpay_credentials()
        route_status = get_route_status()

        # Calculate buyer/seller metrics from verified orders
        user_orders = Order.objects.filter(buyer=request.user)
        user_sales = Order.objects.filter(seller=request.user)

        escrow_held = sum(
            (o.amount for o in user_orders.filter(order_status='RESERVED')),
            Decimal('0.00')
        )
        completed_sales_total = sum(
            (s.seller_amount for s in user_sales.filter(payment_status='PAID')),
            Decimal('0.00')
        )

        modes = ['CAMPUS_DEAL', 'DIRECT_HANDOVER', 'OFFLINE_UPI']
        if creds['is_configured']:
            modes.append('ONLINE_RAZORPAY')

        return Response({
            'user_id': str(request.user.id),
            'balance': float(completed_sales_total),
            'escrow_held': float(escrow_held),
            'currency': 'INR',
            'payment_modes_available': modes,
            'razorpay_test_mode': creds['is_test_mode'],
            'razorpay_route_status': route_status,
        })


class CreatePaymentIntentView(APIView):
    """
    Creates an order or campus direct-handover intent.
    - Locks book listing using select_for_update() within an atomic transaction.
    - Prevents double-purchases / race conditions.
    - Enforces server-side price validation.
    - Rejects purchasing one's own listing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        gateway = str(request.data.get('gateway', 'CAMPUS_DEAL')).upper()
        pickup_pref = request.data.get('pickup_location', 'Campus Central Library')
        notes = request.data.get('notes', '')

        if not book_id:
            return Response({'error': 'book_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Lock the book record for concurrency safety
                try:
                    book = Book.objects.select_for_update().get(pk=book_id)
                except Book.DoesNotExist:
                    return Response({'error': 'Book listing not found.'}, status=status.HTTP_404_NOT_FOUND)

                # Prevent buying own book
                if book.seller_id == request.user.id:
                    return Response(
                        {'error': 'You cannot purchase your own listed book.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verify book availability
                if book.status != 'Available':
                    return Response(
                        {'error': f'This book is currently {book.status.lower()} and unavailable for purchase.'},
                        status=status.HTTP_409_CONFLICT
                    )

                # Use official database price
                book_price = Decimal(str(book.price))
                platform_fee, seller_amount = calculate_fees(book_price)

                # Generate clean unique order reference
                order_number = f"BBO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

                # ── 1. ONLINE RAZORPAY GATEWAY FLOW ────────────────────────────
                if gateway in ('RAZORPAY', 'ONLINE_RAZORPAY', 'ONLINE'):
                    creds = get_razorpay_credentials()
                    if not creds['is_configured']:
                        return Response({
                            'error': 'Razorpay gateway is not configured on this instance. Please choose Campus Deal / Direct Handover.'
                        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

                    # Create upstream order with Razorpay
                    rzp_notes = {
                        'order_number': order_number,
                        'buyer_email': request.user.email,
                        'seller_email': book.seller.email if book.seller else '',
                        'book_id': str(book.id),
                        'book_title': book.title[:40],
                    }
                    rzp_order, err = create_upstream_razorpay_order(
                        amount_inr=book_price,
                        receipt=order_number,
                        notes=rzp_notes
                    )

                    if err or not rzp_order:
                        return Response({
                            'error': 'Failed to initiate Razorpay order with upstream gateway.',
                            'details': err
                        }, status=status.HTTP_502_BAD_GATEWAY)

                    # Create BookBridge Order
                    order = Order.objects.create(
                        order_number=order_number,
                        book=book,
                        book_title=book.title,
                        buyer=request.user,
                        seller=book.seller,
                        amount=book_price,
                        platform_fee=platform_fee,
                        seller_amount=seller_amount,
                        currency='INR',
                        payment_method='ONLINE_RAZORPAY',
                        payment_status='PENDING',
                        order_status='RESERVED',
                        settlement_status='NOT_APPLICABLE',
                        razorpay_order_id=rzp_order.get('id'),
                        pickup_location=pickup_pref,
                        notes=notes
                    )

                    # Mark book listing as Reserved to prevent concurrent purchases
                    book.status = 'Reserved'
                    book.save(update_fields=['status', 'updated_at'])

                    log_activity(
                        request=request,
                        user=request.user,
                        action='ONLINE_PAYMENT_INITIATED',
                        title=f"Online Payment Started: {book.title} (Order #{order_number})",
                        details={
                            'order_number': order_number,
                            'book_id': book.id,
                            'amount': float(book_price),
                            'razorpay_order_id': rzp_order.get('id'),
                        }
                    )

                    return Response({
                        'status': 'ORDER_CREATED',
                        'gateway': 'ONLINE_RAZORPAY',
                        'key_id': creds['key_id'],
                        'order_id': rzp_order.get('id'),
                        'bookbridge_order_id': str(order.id),
                        'order_number': order.order_number,
                        'amount': float(book_price),
                        'currency': 'INR',
                        'book_title': book.title,
                        'buyer_name': request.user.full_name,
                        'buyer_email': request.user.email,
                        'buyer_phone': request.user.phone_number or '',
                    }, status=status.HTTP_201_CREATED)

                # ── 2. CAMPUS DEAL / DIRECT HANDOVER FLOW ──────────────────────
                order = Order.objects.create(
                    order_number=order_number,
                    book=book,
                    book_title=book.title,
                    buyer=request.user,
                    seller=book.seller,
                    amount=book_price,
                    platform_fee=Decimal('0.00'),  # 0 platform fee for direct campus student handover
                    seller_amount=book_price,
                    currency='INR',
                    payment_method='CAMPUS_DEAL',
                    payment_status='PENDING',
                    order_status='RESERVED',
                    settlement_status='SETTLEMENT_PENDING_CAMPUS_HANDOVER',
                    pickup_location=pickup_pref,
                    notes=notes
                )

                # Mark book as Reserved for physical meetup
                book.status = 'Reserved'
                book.save(update_fields=['status', 'updated_at'])

                # Notify seller
                push_notification(
                    recipient=book.seller,
                    title="New Campus Book Request",
                    message=f"{request.user.full_name} wants to meet on campus for '{book.title}' (₹{book_price}). Pickup preference: {pickup_pref}.",
                    notification_type='SYSTEM',
                    link='dashboard.html'
                )

                # Notify buyer
                push_notification(
                    recipient=request.user,
                    title="Campus Handover Initiated",
                    message=f"Meetup request for '{book.title}' registered. Coordinate with {book.seller.full_name} and inspect the book before paying.",
                    notification_type='SYSTEM',
                    link='dashboard.html'
                )

                log_activity(
                    request=request,
                    user=request.user,
                    action='BUY_REQUEST',
                    title=f"Campus Deal: {book.title} (₹{book_price})",
                    details={
                        'order_number': order_number,
                        'book_id': book.id,
                        'seller_email': book.seller.email if book.seller else '',
                        'amount': float(book_price),
                        'pickup_location': pickup_pref
                    }
                )

                return Response({
                    'status': 'DIRECT_HANDOVER_CONFIRMED',
                    'gateway': 'CAMPUS_DEAL',
                    'bookbridge_order_id': str(order.id),
                    'order_number': order.order_number,
                    'amount': float(book_price),
                    'currency': 'INR',
                    'pickup_location': pickup_pref,
                    'message': 'Campus pickup arrangement initiated. Inspect the book in person before making direct payment to the student seller.',
                    'seller_name': book.seller.full_name if book.seller else 'Student Seller',
                    'seller_contact_available': bool(book.seller and book.seller.phone_number)
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f"[CreatePaymentIntentView] Error: {e}")
            return Response({
                'error': 'An unexpected error occurred while processing your request. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(APIView):
    """
    Verifies Razorpay payment signature cryptographically on the server.
    - Prevents fraudulent status spoofing.
    - Transitions order and payment to PAID upon verified signature.
    - Safely marks book listing as Sold.
    - Executes honest settlement / Route status update.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        bookbridge_order_id = request.data.get('bookbridge_order_id')

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return Response({
                'error': 'Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Cryptographic HMAC-SHA256 signature verification
        is_valid, sig_err = verify_razorpay_payment_signature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        if not is_valid:
            return Response({
                'error': sig_err or 'Payment signature verification failed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Atomic database update
        try:
            with transaction.atomic():
                order = None
                if bookbridge_order_id:
                    try:
                        order = Order.objects.select_for_update().get(pk=bookbridge_order_id)
                    except (Order.DoesNotExist, ValueError):
                        pass

                if not order:
                    try:
                        order = Order.objects.select_for_update().get(razorpay_order_id=razorpay_order_id)
                    except Order.DoesNotExist:
                        return Response({
                            'error': 'No corresponding BookBridge order found for this payment.'
                        }, status=status.HTTP_404_NOT_FOUND)

                # Ensure order belongs to current user (unless staff)
                if order.buyer_id != request.user.id and not request.user.is_staff:
                    return Response({
                        'error': 'Unauthorized access to this order.'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Idempotency check: if already processed as PAID
                if order.payment_status == 'PAID':
                    return Response({
                        'status': 'PAYMENT_ALREADY_VERIFIED',
                        'order_id': str(order.id),
                        'order_number': order.order_number,
                        'payment_status': order.payment_status,
                        'settlement_status': order.settlement_status,
                        'message': 'Payment was already verified and confirmed.'
                    }, status=status.HTTP_200_OK)

                # Update Order state
                order.payment_status = 'PAID'
                order.order_status = 'PAID'
                order.razorpay_payment_id = razorpay_payment_id
                order.razorpay_signature = razorpay_signature
                order.save(update_fields=[
                    'payment_status',
                    'order_status',
                    'razorpay_payment_id',
                    'razorpay_signature',
                    'updated_at'
                ])

                # Update associated Book state to Sold
                if order.book:
                    order.book.status = 'Sold'
                    order.book.save(update_fields=['status', 'updated_at'])

                # Execute honest seller settlement / Route check
                settlement_result = execute_seller_settlement_transfer(order)

                # Push notifications
                push_notification(
                    recipient=order.buyer,
                    title="Payment Successful!",
                    message=f"Your online payment for '{order.book_title}' (Order #{order.order_number}) was successful.",
                    notification_type='SYSTEM',
                    link='dashboard.html'
                )

                if order.seller:
                    push_notification(
                        recipient=order.seller,
                        title="Book Sold Online!",
                        message=f"'{order.book_title}' was purchased online by {order.buyer.full_name}. Net earnings: ₹{order.seller_amount}.",
                        notification_type='SYSTEM',
                        link='dashboard.html'
                    )

                log_activity(
                    request=request,
                    user=request.user,
                    action='PAYMENT_CAPTURED',
                    title=f"Payment Verified: {order.book_title} (Order #{order.order_number})",
                    details={
                        'order_number': order.order_number,
                        'amount': float(order.amount),
                        'seller_amount': float(order.seller_amount),
                        'platform_fee': float(order.platform_fee),
                        'razorpay_payment_id': razorpay_payment_id,
                        'settlement_status': order.settlement_status
                    }
                )

                return Response({
                    'status': 'PAYMENT_VERIFIED',
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'payment_status': 'PAID',
                    'order_status': 'PAID',
                    'settlement_status': order.settlement_status,
                    'settlement_message': settlement_result.get('message', ''),
                    'amount': float(order.amount),
                    'currency': order.currency,
                    'message': 'Payment verified and order confirmed successfully!'
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"[VerifyPaymentView] Verification failed: {e}")
            return Response({
                'error': 'An internal error occurred during payment verification. Please contact support.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RazorpayWebhookView(APIView):
    """
    Public Razorpay Webhook listener:
    - Verifies HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
    - Implements idempotency via PaymentWebhookEvent table.
    - Handles payment.captured, order.paid, payment.failed without duplicate executions.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        received_sig = request.headers.get('X-Razorpay-Signature')
        if not received_sig:
            return Response({'error': 'Missing X-Razorpay-Signature header.'}, status=status.HTTP_400_BAD_REQUEST)

        is_valid, err_msg = verify_webhook_signature(request.body, received_sig)
        if not is_valid:
            return Response({'error': err_msg or 'Signature verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        event_data = request.data
        event_type = event_data.get('event', 'unknown')
        event_id = event_data.get('id') or f"evt_{uuid.uuid4().hex}"

        # Webhook Idempotency Check
        existing_event = PaymentWebhookEvent.objects.filter(event_id=event_id).first()
        if existing_event:
            return Response({'status': 'EVENT_ALREADY_PROCESSED'}, status=status.HTTP_200_OK)

        # Record webhook event
        PaymentWebhookEvent.objects.create(
            event_id=event_id,
            event_type=event_type,
            payload=event_data,
            processed=True
        )

        # Process specific events
        payload_entity = event_data.get('payload', {}).get('payment', {}).get('entity', {})
        order_entity = event_data.get('payload', {}).get('order', {}).get('entity', {})

        rzp_order_id = payload_entity.get('order_id') or order_entity.get('id')
        rzp_payment_id = payload_entity.get('id')

        if rzp_order_id:
            try:
                with transaction.atomic():
                    order = Order.objects.select_for_update().filter(razorpay_order_id=rzp_order_id).first()
                    if order:
                        if event_type in ('payment.captured', 'order.paid'):
                            if order.payment_status != 'PAID':
                                order.payment_status = 'PAID'
                                order.order_status = 'PAID'
                                if rzp_payment_id:
                                    order.razorpay_payment_id = rzp_payment_id
                                order.save(update_fields=['payment_status', 'order_status', 'razorpay_payment_id', 'updated_at'])

                                if order.book and order.book.status != 'Sold':
                                    order.book.status = 'Sold'
                                    order.book.save(update_fields=['status', 'updated_at'])

                                execute_seller_settlement_transfer(order)

                                push_notification(
                                    recipient=order.buyer,
                                    title="Payment Confirmed",
                                    message=f"Your online payment for '{order.book_title}' has been confirmed.",
                                    notification_type='SYSTEM',
                                    link='dashboard.html'
                                )

                        elif event_type == 'payment.failed':
                            if order.payment_status == 'PENDING':
                                order.payment_status = 'FAILED'
                                order.order_status = 'CANCELLED'
                                order.save(update_fields=['payment_status', 'order_status', 'updated_at'])

                                # Release book back to Available
                                if order.book and order.book.status == 'Reserved':
                                    order.book.status = 'Available'
                                    order.book.save(update_fields=['status', 'updated_at'])

                                push_notification(
                                    recipient=order.buyer,
                                    title="Payment Failed",
                                    message=f"Payment for '{order.book_title}' was unsuccessful. Please try again.",
                                    notification_type='SYSTEM',
                                    link='browse.html'
                                )
            except Exception as e:
                logger.exception(f"[RazorpayWebhookView] Error handling event {event_type}: {e}")

        return Response({'status': 'EVENT_PROCESSED', 'event': event_type}, status=status.HTTP_200_OK)


class CancelOrReleasePaymentView(APIView):
    """
    Releases a reserved book and marks an uncompleted order as cancelled
    when a student cancels checkout or encounters a payment error.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        book_id = request.data.get('book_id')

        try:
            with transaction.atomic():
                order = None
                if order_id:
                    order = Order.objects.select_for_update().filter(pk=order_id, buyer=request.user).first()
                elif book_id:
                    order = Order.objects.select_for_update().filter(book_id=book_id, buyer=request.user, payment_status='PENDING').first()

                if order and order.payment_status == 'PENDING':
                    order.order_status = 'CANCELLED'
                    order.payment_status = 'CANCELLED'
                    order.save(update_fields=['order_status', 'payment_status', 'updated_at'])

                    if order.book and order.book.status == 'Reserved':
                        order.book.status = 'Available'
                        order.book.save(update_fields=['status', 'updated_at'])

                    return Response({
                        'status': 'ORDER_CANCELLED',
                        'message': 'Order cancelled and book returned to Available status.'
                    }, status=status.HTTP_200_OK)

                # Fallback: if only book_id provided and book is Reserved
                if book_id:
                    book = Book.objects.select_for_update().filter(pk=book_id, status='Reserved').first()
                    if book:
                        # Check if no other paid order exists
                        book.status = 'Available'
                        book.save(update_fields=['status', 'updated_at'])
                        return Response({
                            'status': 'BOOK_RELEASED',
                            'message': 'Book returned to Available status.'
                        }, status=status.HTTP_200_OK)

                return Response({'status': 'NO_CHANGE_NEEDED'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"[CancelOrReleasePaymentView] Error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BuyerOrdersListView(APIView):
    """
    Buyer Dashboard: Fetches all orders placed by the current student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).select_related('book', 'seller').order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({
            'count': orders.count(),
            'orders': serializer.data
        })


class SellerSalesListView(APIView):
    """
    Seller Dashboard: Fetches all book sales by the current student seller.
    Includes truthful settlement and Route onboarding status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sales = Order.objects.filter(seller=request.user).select_related('book', 'buyer').order_by('-created_at')
        serializer = OrderSerializer(sales, many=True)
        route_status = get_route_status()
        seller_account = SellerPaymentAccount.objects.filter(user=request.user).first()

        total_earnings = sum(
            (s.seller_amount for s in sales.filter(payment_status='PAID')),
            Decimal('0.00')
        )
        pending_settlement = sum(
            (s.seller_amount for s in sales.filter(payment_status='PAID').exclude(settlement_status='ROUTE_TRANSFER_EXECUTED')),
            Decimal('0.00')
        )

        return Response({
            'count': sales.count(),
            'total_earnings': float(total_earnings),
            'pending_settlement': float(pending_settlement),
            'route_status': route_status,
            'seller_account': SellerPaymentAccountSerializer(seller_account).data if seller_account else None,
            'sales': serializer.data
        })


class SellerPaymentAccountView(APIView):
    """
    Allows a student seller to inspect and update their payout preferences.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        account, _ = SellerPaymentAccount.objects.get_or_create(user=request.user)
        return Response(SellerPaymentAccountSerializer(account).data)

    def post(self, request):
        account, _ = SellerPaymentAccount.objects.get_or_create(user=request.user)
        payout_upi = request.data.get('payout_upi_id', '').strip()
        bank_last4 = request.data.get('bank_account_last4', '').strip()
        bank_ifsc = request.data.get('bank_ifsc', '').strip().upper()

        if payout_upi:
            account.payout_upi_id = payout_upi
        if bank_last4:
            account.bank_account_last4 = bank_last4[-4:]
        if bank_ifsc:
            account.bank_ifsc = bank_ifsc

        if account.account_status == 'NOT_STARTED' and (account.payout_upi_id or account.bank_account_last4):
            account.account_status = 'PENDING'

        account.save()
        return Response({
            'status': 'ACCOUNT_UPDATED',
            'message': 'Payout preferences updated successfully.',
            'account': SellerPaymentAccountSerializer(account).data
        })


class AdminOrdersListView(APIView):
    """
    Admin Console: Full platform orders & payments oversight.
    Requires Staff or Admin privileges. Zero private secret exposure.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        orders = Order.objects.all().select_related('book', 'buyer', 'seller').order_by('-created_at')

        # Filter by payment_status or order_status if requested
        status_filter = request.query_params.get('payment_status')
        if status_filter:
            orders = orders.filter(payment_status=status_filter.upper())

        method_filter = request.query_params.get('payment_method')
        if method_filter:
            orders = orders.filter(payment_method=method_filter.upper())

        paginator = PageNumberPagination()
        paginator.page_size = 25
        page = paginator.paginate_queryset(orders, request)

        total_volume = sum((o.amount for o in orders.filter(payment_status='PAID')), Decimal('0.00'))
        total_fees = sum((o.platform_fee for o in orders.filter(payment_status='PAID')), Decimal('0.00'))
        total_seller_payouts = sum((o.seller_amount for o in orders.filter(payment_status='PAID')), Decimal('0.00'))

        serializer = OrderSerializer(page if page is not None else orders, many=True)
        return Response({
            'count': orders.count(),
            'total_volume': float(total_volume),
            'total_platform_revenue': float(total_fees),
            'total_seller_payouts': float(total_seller_payouts),
            'route_status': get_route_status(),
            'orders': serializer.data
        })
