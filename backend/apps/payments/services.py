import os
import hmac
import hashlib
import logging
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings

logger = logging.getLogger('apps.payments')

# ── Platform Fee Settings ──────────────────────────────────────────────────
# Can be configured via environment variable e.g. BOOKBRIDGE_PLATFORM_FEE_PERCENT=5.0 (5%)
# or BOOKBRIDGE_PLATFORM_FEE_FIXED=0.0
def get_fee_config():
    percent_str = os.environ.get('BOOKBRIDGE_PLATFORM_FEE_PERCENT', '0.0').strip()
    fixed_str = os.environ.get('BOOKBRIDGE_PLATFORM_FEE_FIXED', '0.0').strip()
    try:
        fee_percent = Decimal(percent_str)
    except Exception:
        fee_percent = Decimal('0.0')
    try:
        fee_fixed = Decimal(fixed_str)
    except Exception:
        fee_fixed = Decimal('0.0')
    return fee_percent, fee_fixed


def calculate_fees(book_price):
    """
    Server-side fee calculation. Never trust frontend calculations.
    Returns (platform_fee, seller_amount).
    """
    price = Decimal(str(book_price)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    if price <= Decimal('0.00'):
        return Decimal('0.00'), Decimal('0.00')

    fee_percent, fee_fixed = get_fee_config()
    calculated_percent_fee = (price * (fee_percent / Decimal('100'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total_platform_fee = (calculated_percent_fee + fee_fixed).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # Ensure fee doesn't exceed total book price
    if total_platform_fee > price:
        total_platform_fee = price

    seller_amount = (price - total_platform_fee).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return total_platform_fee, seller_amount


# ── Razorpay Gateway & Route Configuration ────────────────────────────────
def get_razorpay_credentials():
    key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
    webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '').strip()
    is_test_mode = key_id.startswith('rzp_test_') or not key_id
    return {
        'key_id': key_id,
        'key_secret': key_secret,
        'webhook_secret': webhook_secret,
        'is_configured': bool(key_id and key_secret),
        'is_test_mode': is_test_mode
    }


def get_route_status():
    """
    Returns one of:
    - 'ROUTE_DISABLED'
    - 'ROUTE_PENDING_APPROVAL'
    - 'ROUTE_ENABLED'
    """
    creds = get_razorpay_credentials()
    if not creds['is_configured']:
        return 'ROUTE_DISABLED'

    status = os.environ.get('RAZORPAY_ROUTE_STATUS', '').strip().upper()
    if not status:
        # Fallback to boolean env var if provided
        route_enabled = os.environ.get('RAZORPAY_ROUTE_ENABLED', 'false').lower() in ('true', '1', 'yes')
        status = 'ROUTE_ENABLED' if route_enabled else 'ROUTE_DISABLED'

    if status not in ('ROUTE_DISABLED', 'ROUTE_PENDING_APPROVAL', 'ROUTE_ENABLED'):
        status = 'ROUTE_DISABLED'

    # In sandbox / test keys, Route live payouts cannot be executed
    if creds['is_test_mode'] and status == 'ROUTE_ENABLED':
        # Route transfers in sandbox mode can only hit test endpoints without real money settlement
        return 'ROUTE_PENDING_APPROVAL'

    return status


def create_upstream_razorpay_order(amount_inr, receipt, notes=None):
    """
    Creates an official upstream Razorpay Order via HTTP Basic Auth.
    Returns (order_dict, None) or (None, error_string).
    """
    creds = get_razorpay_credentials()
    if not creds['is_configured']:
        return None, "Razorpay credentials not configured."

    try:
        import requests
        # Razorpay expects integer amount in paise (1 INR = 100 paise)
        amount_paise = int(Decimal(str(amount_inr)) * 100)
        auth = (creds['key_id'], creds['key_secret'])
        payload = {
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': str(receipt)[:40],
            'notes': notes or {}
        }
        res = requests.post(
            'https://api.razorpay.com/v1/orders',
            json=payload,
            auth=auth,
            timeout=10
        )
        if res.status_code in (200, 201):
            return res.json(), None
        else:
            logger.error(f"[Razorpay] Order creation failed ({res.status_code}): {res.text}")
            return None, f"Razorpay API Error: {res.text}"
    except Exception as e:
        logger.exception(f"[Razorpay] Exception during order creation: {e}")
        return None, str(e)


def verify_razorpay_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Cryptographically verifies the payment signature returned by Razorpay Checkout.
    Formula: HMAC-SHA256(order_id + "|" + payment_id, secret) == signature
    """
    creds = get_razorpay_credentials()
    if not creds['key_secret']:
        return False, "Razorpay secret key not configured."

    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return False, "Missing order ID, payment ID, or signature."

    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
    expected_sig = hmac.new(
        creds['key_secret'].encode('utf-8'),
        msg,
        hashlib.sha256
    ).hexdigest()

    if hmac.compare_digest(expected_sig, razorpay_signature):
        return True, None
    else:
        logger.warning(f"[Razorpay] Signature mismatch for order {razorpay_order_id}. Expected {expected_sig}, got {razorpay_signature}")
        return False, "Invalid signature. Payment authenticity check failed."


def verify_webhook_signature(body_bytes, signature_header):
    """
    Verifies the webhook signature in the X-Razorpay-Signature header.
    """
    creds = get_razorpay_credentials()
    webhook_secret = creds['webhook_secret']
    if not webhook_secret:
        return False, "Razorpay webhook secret not configured."

    if not signature_header:
        return False, "Missing X-Razorpay-Signature header."

    expected_sig = hmac.new(
        webhook_secret.encode('utf-8'),
        body_bytes,
        hashlib.sha256
    ).hexdigest()

    if hmac.compare_digest(expected_sig, signature_header):
        return True, None
    else:
        logger.warning("[Razorpay] Webhook signature mismatch.")
        return False, "Invalid webhook signature."


def execute_seller_settlement_transfer(order):
    """
    Attempts seller transfer via Razorpay Route ONLY if Route is legitimately ENABLED.
    Otherwise sets the honest, accurate settlement status without faking.
    """
    route_status = get_route_status()
    creds = get_razorpay_credentials()

    # 1. If running in test mode
    if creds['is_test_mode']:
        order.settlement_status = 'TEST_CAPTURED'
        order.save(update_fields=['settlement_status', 'updated_at'])
        return {
            'settlement_status': 'TEST_CAPTURED',
            'message': 'Payment captured in Razorpay Test Mode. Seller payout simulated in sandbox.'
        }

    # 2. If Route is not approved / disabled on merchant account
    if route_status != 'ROUTE_ENABLED':
        order.settlement_status = 'ROUTE_PENDING_APPROVAL'
        order.save(update_fields=['settlement_status', 'updated_at'])
        return {
            'settlement_status': 'ROUTE_PENDING_APPROVAL',
            'message': 'Online payment received. Seller settlement pending until Razorpay Route / linked-account functionality is activated on the merchant account.'
        }

    # 3. Route is enabled: Check seller linked account
    seller_account = getattr(order.seller, 'payment_account', None)
    if not seller_account or not seller_account.razorpay_account_id or seller_account.account_status != 'VERIFIED':
        order.settlement_status = 'ROUTE_PENDING_APPROVAL'
        order.save(update_fields=['settlement_status', 'updated_at'])
        return {
            'settlement_status': 'ROUTE_PENDING_APPROVAL',
            'message': 'Online payment received. Seller has not completed verified Razorpay linked-account onboarding.'
        }

    # 4. Attempt real upstream transfer
    try:
        import requests
        seller_paise = int(order.seller_amount * 100)
        auth = (creds['key_id'], creds['key_secret'])
        payload = {
            'account': seller_account.razorpay_account_id,
            'amount': seller_paise,
            'currency': 'INR',
            'notes': {
                'order_number': order.order_number,
                'book_id': str(order.book_id) if order.book_id else ''
            }
        }
        res = requests.post(
            f'https://api.razorpay.com/v1/payments/{order.razorpay_payment_id}/transfers',
            json={'transfers': [payload]},
            auth=auth,
            timeout=12
        )
        if res.status_code in (200, 201):
            transfer_data = res.json()
            items = transfer_data.get('items', [])
            transfer_id = items[0].get('id') if items else transfer_data.get('id')
            order.settlement_status = 'ROUTE_TRANSFER_EXECUTED'
            order.razorpay_transfer_id = transfer_id
            order.save(update_fields=['settlement_status', 'razorpay_transfer_id', 'updated_at'])
            return {
                'settlement_status': 'ROUTE_TRANSFER_EXECUTED',
                'transfer_id': transfer_id,
                'message': 'Seller settlement transferred successfully via Razorpay Route.'
            }
        else:
            logger.error(f"[Razorpay Route] Transfer failed ({res.status_code}): {res.text}")
            order.settlement_status = 'SETTLEMENT_FAILED'
            order.save(update_fields=['settlement_status', 'updated_at'])
            return {
                'settlement_status': 'SETTLEMENT_FAILED',
                'error': res.text,
                'message': 'Razorpay Route transfer could not be processed.'
            }
    except Exception as e:
        logger.exception(f"[Razorpay Route] Exception during transfer: {e}")
        order.settlement_status = 'SETTLEMENT_FAILED'
        order.save(update_fields=['settlement_status', 'updated_at'])
        return {
            'settlement_status': 'SETTLEMENT_FAILED',
            'error': str(e),
            'message': 'Error communicating with Razorpay Route API.'
        }
