from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from apps.users.models import User
from apps.colleges.models import College, Department, Course
from apps.marketplace.models import AcademicResource, Listing
from apps.core.channels_middleware import JWTAuthMiddleware, get_user_from_jwt


class SecurityAuditComprehensiveTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create normal student users
        self.user_a = User.objects.create_user(
            email='student_a@gtu.ac.in',
            password='Password123!',
            full_name='Student A',
            role='STUDENT'
        )
        self.user_b = User.objects.create_user(
            email='student_b@gtu.ac.in',
            password='Password123!',
            full_name='Student B',
            role='STUDENT'
        )

        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@gtu.ac.in',
            password='AdminPassword123!',
            full_name='GTU Admin',
            role='SUPER_ADMIN'
        )

        # Create college & department
        self.college = College.objects.create(name='GTU Main Campus', code='GTU01')
        self.dept = Department.objects.create(college=self.college, name='Computer Engineering', code='CE')

    def test_01_database_and_auth_lifecycle(self):
        """
        Database consistency & auth flow:
        Register -> Verify DB -> Login -> Verify JWT -> Profile check -> Logout
        """
        reg_payload = {
            'email': 'new_student@gtu.ac.in',
            'password': 'StrongPassword123!',
            'full_name': 'New Student'
        }
        res = self.client.post('/api/register/', reg_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)

        # Check DB user exists
        new_user = User.objects.filter(email='new_student@gtu.ac.in').first()
        self.assertIsNotNone(new_user)
        self.assertEqual(new_user.full_name, 'New Student')
        self.assertEqual(new_user.role, 'STUDENT')

        # Login
        login_res = self.client.post('/api/login/', {
            'email': 'new_student@gtu.ac.in',
            'password': 'StrongPassword123!'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']
        refresh_token = login_res.data['refresh']

        # Profile call with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_res = self.client.get('/api/profile/')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['email'], 'new_student@gtu.ac.in')

        # Logout with refresh token
        logout_res = self.client.post('/api/logout/', {'refresh': refresh_token}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Verify refresh token is blacklisted
        refresh_res = self.client.post('/api/token/refresh/', {'refresh': refresh_token}, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_privilege_escalation_protection(self):
        """
        Normal user must NOT be able to change their role to SUPER_ADMIN,
        or set is_staff / is_superuser via profile updates.
        """
        token = RefreshToken.for_user(self.user_a).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        payload = {
            'role': 'SUPER_ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'full_name': 'Hacker Student'
        }
        res = self.client.patch('/api/profile/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.role, 'STUDENT')
        self.assertFalse(self.user_a.is_staff)
        self.assertFalse(self.user_a.is_superuser)
        self.assertEqual(self.user_a.full_name, 'Hacker Student')

    def test_03_admin_endpoints_authorization(self):
        """
        Non-admins receive 403 on admin endpoints; admins receive 200 OK.
        """
        # Normal user
        student_token = RefreshToken.for_user(self.user_a).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')

        res_stats = self.client.get('/api/admin/stats/')
        self.assertEqual(res_stats.status_code, status.HTTP_403_FORBIDDEN)

        res_overview = self.client.get('/api/v1/admin-portal/overview/')
        self.assertEqual(res_overview.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user
        admin_token = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

        res_admin_stats = self.client.get('/api/admin/stats/')
        self.assertEqual(res_admin_stats.status_code, status.HTTP_200_OK)

        res_admin_overview = self.client.get('/api/v1/admin-portal/overview/')
        self.assertEqual(res_admin_overview.status_code, status.HTTP_200_OK)

    def test_04_college_management_permissions(self):
        """
        College/Department management:
        - GET is public
        - POST/PUT/DELETE requires Admin
        """
        # Public GET
        self.client.credentials()
        res_get = self.client.get('/api/v1/colleges/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)

        # Normal user POST -> 403
        student_token = RefreshToken.for_user(self.user_a).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')
        res_post = self.client.post('/api/v1/colleges/', {
            'name': 'New College',
            'code': 'NC01',
            'city': 'Ahmedabad',
            'state': 'Gujarat'
        }, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user POST -> 201
        admin_token = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        res_admin_post = self.client.post('/api/v1/colleges/', {
            'name': 'Admin College',
            'code': 'AC01',
            'city': 'Gandhinagar',
            'state': 'Gujarat'
        }, format='json')
        self.assertEqual(res_admin_post.status_code, status.HTTP_201_CREATED)

    def test_05_marketplace_ownership_and_idor_protection(self):
        """
        Marketplace resources and listings:
        - User A can create and update own resource/listing
        - User B cannot update/delete User A's resource/listing (403)
        - Admin can delete User A's resource/listing
        """
        # User A creates a resource
        token_a = RefreshToken.for_user(self.user_a).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')

        res_create = self.client.post('/api/v1/marketplace/resources/', {
            'college': self.college.id,
            'title': 'Operating Systems Notes',
            'description': 'Comprehensive CE Sem 4 notes',
            'resource_type': 'NOTE',
            'condition': 'GOOD'
        }, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        resource_id = res_create.data['id']

        # User B attempts to edit User A's resource -> 403 Forbidden
        token_b = RefreshToken.for_user(self.user_b).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')
        res_b_patch = self.client.patch(f'/api/v1/marketplace/resources/{resource_id}/', {
            'title': 'Defaced Notes'
        }, format='json')
        self.assertEqual(res_b_patch.status_code, status.HTTP_403_FORBIDDEN)

        # User A edits own resource -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
        res_a_patch = self.client.patch(f'/api/v1/marketplace/resources/{resource_id}/', {
            'title': 'Operating Systems Notes (Updated)'
        }, format='json')
        self.assertEqual(res_a_patch.status_code, status.HTTP_200_OK)

        # Admin deletes resource -> 204 No Content
        token_admin = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_admin}')
        res_admin_del = self.client.delete(f'/api/v1/marketplace/resources/{resource_id}/')
        self.assertEqual(res_admin_del.status_code, status.HTTP_204_NO_CONTENT)

    async def test_06_websocket_jwt_auth_resolution(self):
        """
        WebSocket JWT middleware resolves user for valid JWT and returns AnonymousUser for invalid/missing.
        """
        token = str(AccessToken.for_user(self.user_a))
        resolved_user = await get_user_from_jwt(token)
        self.assertEqual(resolved_user.id, self.user_a.id)
        self.assertTrue(resolved_user.is_authenticated)

        # Invalid token
        invalid_user = await get_user_from_jwt("invalid.token.payload")
        self.assertFalse(invalid_user.is_authenticated)

        # Empty token
        empty_user = await get_user_from_jwt("")
        self.assertFalse(empty_user.is_authenticated)

    def test_07_logout_token_revocation_lifecycle(self):
        """
        Verify that logging out with a valid refresh token blacklists it,
        preventing any subsequent token refresh operations.
        """
        refresh = RefreshToken.for_user(self.user_a)
        refresh_str = str(refresh)

        # 1. Normal refresh works before logout
        res_refresh_1 = self.client.post('/api/token/refresh/', {'refresh': refresh_str}, format='json')
        self.assertEqual(res_refresh_1.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_refresh_1.data)

        # 2. Call logout with refresh token
        res_logout = self.client.post('/api/logout/', {'refresh': refresh_str}, format='json')
        self.assertEqual(res_logout.status_code, status.HTTP_200_OK)

        # 3. Refreshing with blacklisted token must fail with 401 Unauthorized
        res_refresh_2 = self.client.post('/api/token/refresh/', {'refresh': refresh_str}, format='json')
        self.assertEqual(res_refresh_2.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_08_xss_payload_safety(self):
        """
        Ensure user profile updates with XSS script tags are stored safely as text
        and do not corrupt database records.
        """
        token = RefreshToken.for_user(self.user_b).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        xss_name = '<script>alert("xss")</script> Student B'
        res = self.client.patch('/api/profile/', {'full_name': xss_name}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_b.refresh_from_db()
        self.assertEqual(self.user_b.full_name, xss_name)
