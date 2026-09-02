from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Anonymous GET/HEAD/OPTIONS (safe methods) -> Allowed
    - Authenticated GET/HEAD/OPTIONS -> Allowed
    - BookBridge Admin POST/PUT/PATCH/DELETE -> Allowed
    - Non-admin authenticated POST/PUT/PATCH/DELETE -> Denied (403)
    - Unauthenticated POST/PUT/PATCH/DELETE -> Denied (401)
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        user_role = getattr(user, 'role', '').upper()
        return user_role in ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN')
