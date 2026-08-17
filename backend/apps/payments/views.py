from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

class WalletBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'user_id': str(request.user.id),
            'balance': 0.00,
            'escrow_held': 0.00,
            'currency': 'INR'
        })

class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount', 0)
        gateway = request.data.get('gateway', 'RAZORPAY') # UPI / RAZORPAY / STRIPE
        return Response({
            'transaction_id': 'tx_demo_12345',
            'amount': amount,
            'gateway': gateway,
            'status': 'CREATED'
        }, status=status.HTTP_201_CREATED)
