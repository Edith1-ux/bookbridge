from rest_framework import serializers
from .models import Book, Wishlist
from apps.users.serializers import PublicUserSerializer


class BookSerializer(serializers.ModelSerializer):
    seller_name = serializers.SerializerMethodField()
    seller_details = PublicUserSerializer(source='seller', read_only=True)
    seller_id = serializers.ReadOnlyField(source='seller.id')

    class Meta:
        model = Book
        fields = [
            'id', 'seller', 'seller_id', 'seller_name', 'seller_details',
            'title', 'author', 'isbn', 'gtu_code', 'branch', 'semester',
            'edition', 'resource_type', 'genre', 'subject', 'condition',
            'language', 'mode', 'price', 'original_price', 'rating',
            'exchange_for', 'description', 'location', 'cover_url',
            'cover_image', 'pdf_url', 'pdf_file', 'status', 'views_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'seller', 'seller_id', 'seller_name', 'seller_details', 'views_count', 'created_at', 'updated_at']

    def get_seller_name(self, obj):
        if obj.seller:
            return obj.seller.full_name or obj.seller.email
        return 'Anonymous Seller'


class BookCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'isbn', 'gtu_code', 'branch', 'semester',
            'edition', 'resource_type', 'genre', 'subject', 'condition',
            'language', 'mode', 'price', 'original_price', 'rating',
            'exchange_for', 'description', 'location', 'cover_url',
            'cover_image', 'pdf_url', 'pdf_file', 'status'
        ]
        read_only_fields = ['id', 'status']

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_cover_image(self, value):
        if value:
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError("Cover image file size cannot exceed 5MB.")
            ext = value.name.split('.')[-1].lower() if '.' in value.name else ''
            if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                raise serializers.ValidationError("Cover image must be a valid JPG, PNG, or WebP image.")
        return value

    def validate_pdf_file(self, value):
        if value:
            max_size = 15 * 1024 * 1024  # 15MB
            if value.size > max_size:
                raise serializers.ValidationError("PDF file size cannot exceed 15MB.")
            ext = value.name.split('.')[-1].lower() if '.' in value.name else ''
            if ext not in ['pdf']:
                raise serializers.ValidationError("Document must be a valid PDF file.")
        return value


class WishlistSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'user', 'book', 'book_details', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
