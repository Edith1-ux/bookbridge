from rest_framework import serializers
from .models import AcademicResource, Listing, EscrowTransaction


class AcademicResourceSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    uploader_name = serializers.CharField(source='uploader.full_name', read_only=True)

    class Meta:
        model = AcademicResource
        fields = '__all__'
        read_only_fields = ('id', 'uploader', 'created_at')


class ListingSerializer(serializers.ModelSerializer):
    resource_details = AcademicResourceSerializer(source='resource', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    class Meta:
        model = Listing
        fields = '__all__'
        read_only_fields = ('id', 'seller', 'created_at', 'updated_at')
