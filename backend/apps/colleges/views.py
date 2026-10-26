from rest_framework import viewsets, permissions
from .models import College, Department, Course
from .serializers import CollegeSerializer, DepartmentSerializer, CourseSerializer


class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.prefetch_related('domains', 'branding').filter(is_active=True)
    serializer_class = CollegeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['city', 'state', 'code']
    search_fields = ['name', 'code', 'city']


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('college').all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['college', 'code']
    search_fields = ['name', 'code']


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('department').all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['department', 'semester', 'code']
    search_fields = ['name', 'code']
