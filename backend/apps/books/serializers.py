import io
import os
from PIL import Image, ImageOps
from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework import serializers
from .models import Book, Wishlist
from apps.users.serializers import PublicUserSerializer


class BookSerializer(serializers.ModelSerializer):
    seller_name = serializers.SerializerMethodField()
    seller_details = PublicUserSerializer(source='seller', read_only=True)
    seller_id = serializers.ReadOnlyField(source='seller.id')
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'seller', 'seller_id', 'seller_name', 'seller_details',
            'title', 'author', 'isbn', 'gtu_code', 'branch', 'semester',
            'edition', 'resource_type', 'genre', 'subject', 'condition',
            'language', 'mode', 'price', 'original_price', 'rating',
            'exchange_for', 'description', 'location', 'cover_url',
            'cover_image', 'cover_image_url', 'pdf_url', 'pdf_file', 'status', 'views_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'seller', 'seller_id', 'seller_name', 'seller_details', 'views_count', 'created_at', 'updated_at']

    def get_seller_name(self, obj):
        if obj.seller:
            return obj.seller.full_name or obj.seller.email
        return 'Anonymous Seller'

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.cover_image.url)
                return obj.cover_image.url
            except Exception:
                return obj.cover_image.url if hasattr(obj.cover_image, 'url') else None
        return obj.cover_url or None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Guarantee cover, cover_url, and cover_image resolve to the accessible URL
        cover_val = self.get_cover_image_url(instance)
        if cover_val:
            data['cover_image'] = cover_val
            data['cover_url'] = cover_val
            data['cover'] = cover_val
        elif instance.cover_url:
            data['cover_url'] = instance.cover_url
            data['cover'] = instance.cover_url

        data['isUserListed'] = True
        seller_obj = instance.seller
        if seller_obj:
            data['seller'] = {
                'id': seller_obj.id,
                'name': seller_obj.full_name or (seller_obj.email.split('@')[0] if seller_obj.email else 'Student Seller'),
                'email': seller_obj.email,
                'whatsapp': getattr(seller_obj, 'whatsapp', None) or getattr(seller_obj, 'phone_number', None) or '+919876543210',
                'branch': instance.branch or 'CE'
            }
        return data


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
        read_only_fields = ['id']


    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_cover_image(self, value):
        if value:
            # 1. Size check (max 10MB)
            max_size = 10 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("Image size is too large. Please choose an image smaller than 10MB.")

            # 2. Extension check
            ext = os.path.splitext(value.name)[1].lower().lstrip('.')
            allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'jfif']
            if ext not in allowed_exts:
                raise serializers.ValidationError("Please select a valid book image (JPG, PNG, or WebP).")

            # 3. Real image validation & optimization with Pillow
            try:
                img = Image.open(value)
                img.verify()

                # Reopen after verify to process
                value.seek(0)
                img = Image.open(value)
                img = ImageOps.exif_transpose(img)

                # Resize if larger than 1600px
                max_dim = 1600
                if img.width > max_dim or img.height > max_dim:
                    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

                output = io.BytesIO()
                format_name = 'JPEG'
                content_type = 'image/jpeg'
                file_ext = 'jpg'

                if img.format == 'PNG' and ('A' in img.getbands() or img.mode in ('RGBA', 'LA')):
                    format_name = 'PNG'
                    content_type = 'image/png'
                    file_ext = 'png'
                    img.save(output, format=format_name, optimize=True)
                elif img.format == 'WEBP':
                    format_name = 'WEBP'
                    content_type = 'image/webp'
                    file_ext = 'webp'
                    img.save(output, format=format_name, quality=85, optimize=True)
                else:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(output, format='JPEG', quality=85, optimize=True)

                output.seek(0)
                base_name = os.path.splitext(value.name)[0]
                new_filename = f"{base_name}.{file_ext}"

                value = InMemoryUploadedFile(
                    output,
                    'cover_image',
                    new_filename,
                    content_type,
                    output.getbuffer().nbytes,
                    None
                )
            except serializers.ValidationError:
                raise
            except Exception:
                raise serializers.ValidationError("Please select a valid, uncorrupted book image.")

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

