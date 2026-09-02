from rest_framework import permissions


class IsUploaderOrAdminOrReadOnly(permissions.BasePermission):
    """
    Explicitly handles:
    - Anonymous GET -> Allowed
    - Authenticated GET -> Allowed
    - Owner PUT/PATCH/DELETE -> Allowed
    - Admin PUT/PATCH/DELETE -> Allowed
    - Non-owner PUT/PATCH/DELETE -> Denied (403)
    - Unauthenticated POST/PUT/PATCH/DELETE -> Denied (401)
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

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

        return getattr(obj, 'uploader', None) == request.user


class IsSellerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Explicitly handles:
    - Anonymous GET -> Allowed
    - Authenticated GET -> Allowed
    - Owner PUT/PATCH/DELETE -> Allowed
    - Admin PUT/PATCH/DELETE -> Allowed
    - Non-owner PUT/PATCH/DELETE -> Denied (403)
    - Unauthenticated POST/PUT/PATCH/DELETE -> Denied (401)
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

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
