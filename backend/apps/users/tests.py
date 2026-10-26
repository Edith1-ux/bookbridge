from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class UserAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/register/'
        self.login_url = '/api/login/'
        self.profile_url = '/api/profile/'
        self.admin_users_url = '/api/admin/users/'
        self.admin_stats_url = '/api/admin/stats/'

        self.student_user = User.objects.create_user(
            email='student@rcti.ac.in',
            password='StrongPassword123!',
            full_name='Student User',
            role='STUDENT'
        )

        self.admin_user = User.objects.create_user(
            email='admin@rcti.ac.in',
            password='AdminPassword123!',
            full_name='Admin User',
            role='SUPER_ADMIN',
            is_staff=True
        )

    def test_registration_with_full_name_success(self):
        payload = {
            'email': 'newstudent@rcti.ac.in',
            'password': 'SecurePassword123!',
            'full_name': 'New Student'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'newstudent@rcti.ac.in')
        self.assertEqual(res.data['user']['full_name'], 'New Student')

    def test_registration_with_name_alias_success(self):
        payload = {
            'email': 'aliasstudent@rcti.ac.in',
            'password': 'SecurePassword123!',
            'name': 'Alias Student'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['full_name'], 'Alias Student')

    def test_registration_duplicate_email_fails(self):
        payload = {
            'email': 'student@rcti.ac.in',
            'password': 'SecurePassword123!',
            'full_name': 'Duplicate User'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_short_password_fails(self):
        payload = {
            'email': 'shortpass@rcti.ac.in',
            'password': '123',
            'full_name': 'Short Pass'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        payload = {
            'email': 'student@rcti.ac.in',
            'password': 'StrongPassword123!'
        }
        res = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['email'], 'student@rcti.ac.in')

    def test_login_invalid_credentials_fails(self):
        payload = {
            'email': 'student@rcti.ac.in',
            'password': 'WrongPassword!'
        }
        res = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_profile_access(self):
        # Unauthenticated access
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated access
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], self.student_user.email)

    def test_admin_endpoints_permission_denied_for_regular_student(self):
        self.client.force_authenticate(user=self.student_user)

        res_users = self.client.get(self.admin_users_url)
        self.assertEqual(res_users.status_code, status.HTTP_403_FORBIDDEN)

        res_stats = self.client.get(self.admin_stats_url)
        self.assertEqual(res_stats.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_endpoints_accessible_for_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)

        res_users = self.client.get(self.admin_users_url)
        self.assertEqual(res_users.status_code, status.HTTP_200_OK)

        res_stats = self.client.get(self.admin_stats_url)
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertIn('totalUsers', res_stats.data)
        self.assertIn('totalListings', res_stats.data)

    def test_privilege_escalation_attempt_prevented(self):
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'role': 'SUPER_ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'is_college_verified': True,
            'full_name': 'Hacker Student'
        }
        res = self.client.patch(self.profile_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.student_user.refresh_from_db()
        self.assertEqual(self.student_user.full_name, 'Hacker Student')
        self.assertEqual(self.student_user.role, 'STUDENT')
        self.assertFalse(self.student_user.is_staff)
        self.assertFalse(self.student_user.is_superuser)
        self.assertFalse(self.student_user.is_college_verified)

    def test_logout_blacklists_refresh_token(self):
        login_res = self.client.post(self.login_url, {
            'email': 'student@rcti.ac.in',
            'password': 'StrongPassword123!'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        refresh_token = login_res.data['refresh']

        # Call logout endpoint
        logout_res = self.client.post('/api/logout/', {'refresh': refresh_token}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Verify token cannot be refreshed anymore
        refresh_attempt = self.client.post('/api/token/refresh/', {'refresh': refresh_token}, format='json')
        self.assertEqual(refresh_attempt.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_registration_full_lifecycle_and_relogin(self):
        """Verify student registers, logs out, and is recognized again on re-login."""
        reg_payload = {
            'full_name': 'Aarav Patel',
            'email': 'aarav.patel@rcti.ac.in',
            'password': 'StudentSecret123!',
            'college_name': 'R. C. Technical Institute (RCTI), Ahmedabad',
            'branch': 'CE',
            'semester': 3,
            'enrollment': '216400307099',
            'phone_number': '9876543210'
        }
        reg_res = self.client.post(self.register_url, reg_payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', reg_res.data)
        self.assertEqual(reg_res.data['user']['full_name'], 'Aarav Patel')
        refresh_token = reg_res.data['refresh']

        # Student logs out
        logout_res = self.client.post('/api/logout/', {'refresh': refresh_token}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Student logs back in with EMAIL
        login_res = self.client.post(self.login_url, {
            'email': 'aarav.patel@rcti.ac.in',
            'password': 'StudentSecret123!'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['user']['full_name'], 'Aarav Patel')
        self.assertEqual(login_res.data['user']['role'], 'STUDENT')
        relogin_token = login_res.data['token']

        # Verify profile is recognized with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {relogin_token}')
        profile_res = self.client.get(self.profile_url)
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['full_name'], 'Aarav Patel')
        self.assertEqual(profile_res.data['enrollment_number'], '216400307099')
        self.client.credentials()  # reset

        # Student logs back in with ENROLLMENT NUMBER
        login_enr_res = self.client.post(self.login_url, {
            'email': '216400307099',
            'password': 'StudentSecret123!'
        }, format='json')
        self.assertEqual(login_enr_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_enr_res.data['user']['email'], 'aarav.patel@rcti.ac.in')

    def test_student_registration_college_code_collision_handling(self):
        """Verify multiple colleges with identical code prefixes do not crash with IntegrityError."""
        stud1 = {
            'full_name': 'Student One',
            'email': 'stud1@gecg.ac.in',
            'password': 'Password123!',
            'college_name': 'Govt Engineering College (GEC), Gandhinagar',
            'branch': 'EC'
        }
        res1 = self.client.post(self.register_url, stud1, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        stud2 = {
            'full_name': 'Student Two',
            'email': 'stud2@gecm.ac.in',
            'password': 'Password123!',
            'college_name': 'Govt Engineering College (GEC), Modasa',
            'branch': 'ME'
        }
        res2 = self.client.post(self.register_url, stud2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)


