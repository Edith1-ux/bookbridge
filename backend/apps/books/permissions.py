from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of a book listing or admins to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        user_role = getattr(request.user, 'role', '').upper()
        if user_role in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'):
            return True

        return getattr(obj, 'seller', None) == request.user
