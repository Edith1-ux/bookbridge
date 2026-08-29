from django.contrib import admin
from .models import College, CollegeDomain, CollegeBranding, Department, Course


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'state', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'city')
    list_filter = ('is_active', 'state')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'college', 'created_at')
    search_fields = ('name', 'code', 'college__name')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'department', 'semester')
    search_fields = ('name', 'code', 'department__name')
    list_filter = ('semester',)
