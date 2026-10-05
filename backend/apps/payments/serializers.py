from rest_framework import serializers
from .models import Order, SellerPaymentAccount


class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    seller_email = serializers.CharField(source='seller.email', read_only=True)
    book_cover = serializers.SerializerMethodField()
    book_branch = serializers.SerializerMethodField()
    book_semester = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'book',
            'book_title',
            'book_cover',
            'book_branch',
            'book_semester',
            'buyer',
            'buyer_name',
            'buyer_email',
            'seller',
            'seller_name',
            'seller_email',
            'amount',
            'platform_fee',
            'seller_amount',
            'currency',
            'payment_method',
            'payment_status',
            'order_status',
            'settlement_status',
            'razorpay_order_id',
            'razorpay_payment_id',
            'razorpay_transfer_id',
            'pickup_location',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_book_cover(self, obj):
        if obj.book:
            return obj.book.cover_url or (obj.book.cover_image.url if obj.book.cover_image else None)
        return None

    def get_book_branch(self, obj):
        return obj.book.branch if obj.book else None

    def get_book_semester(self, obj):
        return obj.book.semester if obj.book else None


class BuyerOrderSummarySerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    book_cover = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'book_title',
            'book_cover',
            'seller_name',
            'amount',
            'platform_fee',
            'currency',
            'payment_method',
            'payment_status',
            'order_status',
            'pickup_location',
            'created_at',
        ]

    def get_book_cover(self, obj):
        if obj.book:
            return obj.book.cover_url or (obj.book.cover_image.url if obj.book.cover_image else None)
        return None


class SellerSaleSummarySerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    book_cover = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'book_title',
            'book_cover',
            'buyer_name',
            'amount',
            'platform_fee',
            'seller_amount',
            'currency',
            'payment_method',
            'payment_status',
            'order_status',
            'settlement_status',
            'pickup_location',
            'created_at',
        ]

    def get_book_cover(self, obj):
        if obj.book:
            return obj.book.cover_url or (obj.book.cover_image.url if obj.book.cover_image else None)
        return None


class SellerPaymentAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerPaymentAccount
        fields = [
            'id',
            'account_status',
            'payout_upi_id',
            'bank_account_last4',
            'bank_ifsc',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'account_status', 'created_at', 'updated_at']
