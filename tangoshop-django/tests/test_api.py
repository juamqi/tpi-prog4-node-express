import json
from unittest.mock import MagicMock, patch

from django.test import Client, TestCase


class TangoShopAPITest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

    def test_api_root(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'online')

    @patch('api.views.auth_service.login')
    def test_login_success(self, mock_login: MagicMock):
        mock_login.return_value = {'token': 'abc', 'refreshToken': 'def'}
        response = self.client.post('/api/auth/login/', data=json.dumps({'email': 'a@b.com', 'password': 'x'}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
