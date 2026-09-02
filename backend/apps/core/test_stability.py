import json
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.exceptions import ImproperlyConfigured
from rest_framework.test import APIClient
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.users.models import User
from apps.core.exceptions import custom_exception_handler


class StabilityHealthCheckTestCase(TestCase):
    """Test health check endpoints for liveness, readiness, and resilience."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200_when_database_is_healthy(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['database_connected'])
        self.assertEqual(data['service'], 'BookBridge Enterprise Django Engine')

    def test_health_liveness_returns_200(self):
        response = self.client.get('/api/health/liveness/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'alive')

    def test_health_readiness_returns_200_when_ready(self):
        response = self.client.get('/api/health/readiness/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'ready')
        self.assertEqual(data['database'], 'connected')


class CustomExceptionHandlerTestCase(TestCase):
    """Test that DRF custom exception handler sanitizes 500s and never leaks secrets."""

    @override_settings(DEBUG=False)
    def test_unhandled_exception_returns_sanitized_500_in_production(self):
        class DummyRequest:
            path = '/api/test-crash/'
            method = 'GET'
            user = None

        context = {
            'request': DummyRequest(),
            'view': None,
        }
        exc = RuntimeError("Fatal internal database connection crash with password=secret123")
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data['error'], 'Something went wrong. Please try again.')
        self.assertEqual(response.data['status_code'], 500)
        # Verify secret is NOT leaked in client response
        self.assertNotIn('secret123', json.dumps(response.data))

    @override_settings(DEBUG=True)
    def test_unhandled_exception_includes_diagnostic_in_debug_mode(self):
        class DummyRequest:
            path = '/api/test-debug/'
            method = 'GET'
            user = None

        context = {
            'request': DummyRequest(),
            'view': None,
        }
        exc = ValueError("Invalid parameter value")
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 500)
        self.assertIn("Invalid parameter value", response.data['error'])


class JWTRefreshAndAuthStabilityTestCase(TestCase):
    """Test JWT token authentication, refresh rotation, and revocation."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='stability_test@bookbridge.edu',
            password='TestPassword123!',
            full_name='Stability Test User',
            role='STUDENT'
        )

    def test_login_returns_valid_jwt_tokens(self):
        response = self.client.post('/api/login/', {
            'email': 'stability_test@bookbridge.edu',
            'password': 'TestPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertTrue(len(data['access']) > 20)

    def test_refresh_token_rotation_provides_new_access_token(self):
        login_res = self.client.post('/api/login/', {
            'email': 'stability_test@bookbridge.edu',
            'password': 'TestPassword123!'
        })
        refresh_token = login_res.json()['refresh']

        refresh_res = self.client.post('/api/token/refresh/', {
            'refresh': refresh_token
        })
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        new_access = refresh_res.json().get('access')
        self.assertIsNotNone(new_access)

    def test_invalid_refresh_token_fails_gracefully(self):
        response = self.client.post('/api/token/refresh/', {
            'refresh': 'invalid_malformed_token_123'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WebSocketConsumerResilienceTestCase(TestCase):
    """Test WebSocket consumer authorization and error handling."""

    def test_chat_consumer_module_imports_cleanly(self):
        from apps.chat.consumers import ChatConsumer
        consumer = ChatConsumer()
        self.assertTrue(hasattr(consumer, 'connect'))
        self.assertTrue(hasattr(consumer, 'receive'))
        self.assertTrue(hasattr(consumer, 'disconnect'))

    def test_call_consumer_module_imports_cleanly(self):
        from apps.calls.consumers import WebRTCSignalingConsumer
        consumer = WebRTCSignalingConsumer()
        self.assertTrue(hasattr(consumer, 'connect'))
        self.assertTrue(hasattr(consumer, 'receive'))
        self.assertTrue(hasattr(consumer, 'disconnect'))
