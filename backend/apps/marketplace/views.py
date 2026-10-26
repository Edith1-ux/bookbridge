from rest_framework import viewsets, permissions
from .models import AcademicResource, Listing
from .serializers import AcademicResourceSerializer, ListingSerializer


class AcademicResourceViewSet(viewsets.ModelViewSet):
    queryset = AcademicResource.objects.select_related('college', 'department', 'course', 'uploader').all()
    serializer_class = AcademicResourceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['college', 'department', 'course', 'resource_type', 'gtu_code', 'condition']
    search_fields = ['title', 'author', 'isbn', 'gtu_code', 'description']

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.select_related('resource', 'seller').all()
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['listing_type', 'status']

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
