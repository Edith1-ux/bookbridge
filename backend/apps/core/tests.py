import json
from django.test import TestCase, RequestFactory
from django.http import Http404
from config.urls import custom_handler404, custom_handler500
from apps.chat.routing import websocket_urlpatterns as chat_ws_patterns
from apps.calls.routing import websocket_urlpatterns as call_ws_patterns
from apps.notifications.routing import websocket_urlpatterns as notif_ws_patterns


class CoreErrorHandlersAndRoutingTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_custom_handler404_returns_json_for_api_requests(self):
        request = self.factory.get('/api/nonexistent-endpoint/')
        response = custom_handler404(request, exception=Http404())
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content.decode('utf-8'))
        self.assertIn('error', data)
        self.assertEqual(data['status_code'], 404)

    def test_custom_handler404_returns_html_for_web_requests(self):
        request = self.factory.get('/nonexistent-page/')
        response = custom_handler404(request, exception=Http404())
        self.assertEqual(response.status_code, 404)
        self.assertIn('text/html', response['Content-Type'])

    def test_custom_handler500_returns_json_for_api_requests(self):
        request = self.factory.get('/api/crash-point/')
        response = custom_handler500(request)
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.content.decode('utf-8'))
        self.assertIn('error', data)
        self.assertEqual(data['status_code'], 500)

    def test_chat_websocket_pattern_matches_hyphenated_uuid(self):
        pattern = chat_ws_patterns[0].pattern
        match = pattern.match('ws/chat/14c08989-6500-4277-ac00-24094da77e22/')
        self.assertIsNotNone(match)
        # Django RegexPattern.match returns (path, args, kwargs)
        _, _, kwargs = match
        self.assertEqual(kwargs.get('room_name'), '14c08989-6500-4277-ac00-24094da77e22')

    def test_call_websocket_pattern_matches_hyphenated_uuid(self):
        pattern = call_ws_patterns[0].pattern
        match = pattern.match('ws/call/37c7d47f-5d1a-41cf-8663-98516623b6c4/')
        self.assertIsNotNone(match)
        _, _, kwargs = match
        self.assertEqual(kwargs.get('call_id'), '37c7d47f-5d1a-41cf-8663-98516623b6c4')

    def test_notification_websocket_pattern_matches(self):
        pattern = notif_ws_patterns[0].pattern
        match = pattern.match('ws/notifications/')
        self.assertIsNotNone(match)
