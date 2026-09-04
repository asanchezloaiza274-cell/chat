from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Block, User


class RegisterTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_register_creates_user_and_returns_tokens(self):
        response = self.client.post(reverse('register'), {
            'username': 'newuser',
            'email': 'new@example.com',
            'full_name': 'New User',
            'password': 'strongpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(username='existing', email='dup@example.com', password='pass123456')
        response = self.client.post(reverse('register'), {
            'username': 'someoneelse',
            'email': 'dup@example.com',
            'full_name': 'Someone',
            'password': 'strongpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username='taken', email='first@example.com', password='pass123456')
        response = self.client.post(reverse('register'), {
            'username': 'taken',
            'email': 'second@example.com',
            'full_name': 'Someone',
            'password': 'strongpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='loginuser', email='login@example.com', password='correctpass')

    def test_login_with_correct_credentials(self):
        response = self.client.post(reverse('login'), {'email': 'login@example.com', 'password': 'correctpass'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_with_wrong_password_is_rejected(self):
        response = self.client.post(reverse('login'), {'email': 'login@example.com', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_unknown_email_is_rejected(self):
        response = self.client.post(reverse('login'), {'email': 'nobody@example.com', 'password': 'whatever'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenLifecycleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='sessionuser', email='session@example.com', password='pass123456')

    def test_refresh_returns_new_access_token(self):
        login = self.client.post(reverse('login'), {'email': 'session@example.com', 'password': 'pass123456'})
        response = self.client.post(reverse('token_refresh'), {'refresh': login.data['refresh']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(reverse('login'), {'email': 'session@example.com', 'password': 'pass123456'})
        refresh = login.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        logout_response = self.client.post(reverse('logout'), {'refresh': refresh})
        self.assertEqual(logout_response.status_code, status.HTTP_204_NO_CONTENT)

        reuse_response = self.client.post(reverse('token_refresh'), {'refresh': refresh})
        self.assertEqual(reuse_response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='pwuser', email='pw@example.com', password='oldpass123')
        self.client.force_authenticate(user=self.user)

    def test_change_password_with_correct_current_password(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'oldpass123',
            'new_password': 'newpass456',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass456'))

    def test_change_password_with_wrong_current_password_is_rejected(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'notmypassword',
            'new_password': 'newpass456',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class BlockTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='blocker', email='blocker@example.com', password='pass123456')
        self.other = User.objects.create_user(username='blocked', email='blocked@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user)

    def test_block_then_unblock_toggles(self):
        block_response = self.client.post(reverse('user_block', args=[self.other.id]))
        self.assertEqual(block_response.status_code, status.HTTP_200_OK)
        self.assertTrue(block_response.data['blocked'])
        self.assertTrue(Block.objects.filter(blocker=self.user, blocked=self.other).exists())

        unblock_response = self.client.post(reverse('user_block', args=[self.other.id]))
        self.assertFalse(unblock_response.data['blocked'])
        self.assertFalse(Block.objects.filter(blocker=self.user, blocked=self.other).exists())

    def test_cannot_block_self(self):
        response = self.client.post(reverse('user_block', args=[self.user.id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
