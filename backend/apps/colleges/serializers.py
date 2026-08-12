from rest_framework import serializers
from .models import College, CollegeDomain, CollegeBranding, Department, Course


class CollegeBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollegeBranding
        fields = '__all__'


class CollegeDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollegeDomain
        fields = '__all__'


class CollegeSerializer(serializers.ModelSerializer):
    domains = CollegeDomainSerializer(many=True, read_only=True)
    branding = CollegeBrandingSerializer(read_only=True)

    class Meta:
        model = College
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)

    class Meta:
        model = Department
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'
