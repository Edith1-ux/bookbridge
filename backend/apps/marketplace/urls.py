from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicResourceViewSet, ListingViewSet

router = DefaultRouter()
router.register('resources', AcademicResourceViewSet, basename='academic-resource')
router.register('listings', ListingViewSet, basename='marketplace-listing')

urlpatterns = [
    path('', include(router.urls)),
]
