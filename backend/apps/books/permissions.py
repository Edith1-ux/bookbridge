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

        if getattr(request.user, 'role', None) == 'admin' or request.user.is_staff or request.user.is_superuser:
            return True

        return getattr(obj, 'seller', None) == request.user
