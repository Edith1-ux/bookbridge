from rest_framework import permissions

class IsBookBridgeAdmin(permissions.BasePermission):
    """
    Allows access only to superusers, staff members, or users with
    BookBridge admin roles (SUPER_ADMIN, COLLEGE_ADMIN, DEPT_ADMIN).
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        user_role = getattr(user, 'role', '').upper()
        return user_role in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
