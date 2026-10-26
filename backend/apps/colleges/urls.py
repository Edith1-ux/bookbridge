from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollegeViewSet, DepartmentViewSet, CourseViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('courses', CourseViewSet, basename='course')
router.register('', CollegeViewSet, basename='college')

urlpatterns = [
    path('', include(router.urls)),
]
