from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Block, User


class ConversationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(username='alice', email='alice@example.com', password='pass123456')
        self.user_b = User.objects.create_user(username='bob', email='bob@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user_a)

    def test_create_direct_conversation(self):
        response = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['type'], 'direct')
        self.assertIn(str(self.user_a.id), response.data['participant_ids'])
        self.assertIn(str(self.user_b.id), response.data['participant_ids'])

    def test_creating_same_direct_conversation_twice_returns_existing(self):
        first = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        second = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data['id'], second.data['id'])

    def test_cannot_message_a_user_who_blocked_you(self):
        create = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        conversation_id = create.data['id']

        Block.objects.create(blocker=self.user_b, blocked=self.user_a)

        response = self.client.post(reverse('message_list', args=[conversation_id]), {'text': 'hi'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_participant_gets_403(self):
        create = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        conversation_id = create.data['id']
        outsider = User.objects.create_user(username='eve', email='eve@example.com', password='pass123456')
        self.client.force_authenticate(user=outsider)

        response = self.client.get(reverse('message_list', args=[conversation_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MessagePaginationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(username='alice2', email='alice2@example.com', password='pass123456')
        self.user_b = User.objects.create_user(username='bob2', email='bob2@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user_a)
        create = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        self.conversation_id = create.data['id']
        for i in range(5):
            self.client.post(reverse('message_list', args=[self.conversation_id]), {'text': f'message {i}'})

    def test_limit_returns_only_requested_count_and_flags_has_more(self):
        response = self.client.get(reverse('message_list', args=[self.conversation_id]), {'limit': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['has_more'])
        # Response order is ascending, so a 2-item page is the two newest messages.
        self.assertEqual(response.data['results'][0]['text'], 'message 3')
        self.assertEqual(response.data['results'][1]['text'], 'message 4')

    def test_before_cursor_returns_older_page(self):
        first_page = self.client.get(reverse('message_list', args=[self.conversation_id]), {'limit': 2})
        oldest_in_page = first_page.data['results'][0]

        response = self.client.get(reverse('message_list', args=[self.conversation_id]), {
            'limit': 2, 'before': oldest_in_page['created_at'],
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][-1]['text'], 'message 2')

    def test_no_more_pages_reports_has_more_false(self):
        response = self.client.get(reverse('message_list', args=[self.conversation_id]), {'limit': 50})
        self.assertEqual(len(response.data['results']), 5)
        self.assertFalse(response.data['has_more'])


class AttachmentValidationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(username='alice3', email='alice3@example.com', password='pass123456')
        self.user_b = User.objects.create_user(username='bob3', email='bob3@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user_a)
        create = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        self.conversation_id = create.data['id']

    def test_rejects_disallowed_content_type(self):
        bad_file = SimpleUploadedFile('virus.exe', b'binary-content', content_type='application/x-msdownload')
        response = self.client.post(
            reverse('message_list', args=[self.conversation_id]),
            {'files': bad_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(MAX_ATTACHMENT_SIZE=10)
    def test_rejects_file_over_size_limit(self):
        big_file = SimpleUploadedFile('photo.jpg', b'x' * 100, content_type='image/jpeg')
        response = self.client.post(
            reverse('message_list', args=[self.conversation_id]),
            {'files': big_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accepts_allowed_image(self):
        good_file = SimpleUploadedFile('photo.jpg', b'x' * 100, content_type='image/jpeg')
        response = self.client.post(
            reverse('message_list', args=[self.conversation_id]),
            {'files': good_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class MessagePermissionTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(username='alice4', email='alice4@example.com', password='pass123456')
        self.user_b = User.objects.create_user(username='bob4', email='bob4@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user_a)
        create = self.client.post(reverse('conversation_list'), {'type': 'direct', 'user_id': str(self.user_b.id)})
        self.conversation_id = create.data['id']
        message = self.client.post(reverse('message_list', args=[self.conversation_id]), {'text': 'original'})
        self.message_id = message.data['id']

    def test_author_can_edit_own_message(self):
        response = self.client.patch(reverse('message_detail', args=[self.message_id]), {'text': 'edited'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], 'edited')

    def test_other_participant_cannot_edit_message(self):
        self.client.force_authenticate(user=self.user_b)
        response = self.client.patch(reverse('message_detail', args=[self.message_id]), {'text': 'hacked'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_delete_own_message(self):
        response = self.client.delete(reverse('message_detail', args=[self.message_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['deleted'])

    def test_other_participant_cannot_delete_message(self):
        self.client.force_authenticate(user=self.user_b)
        response = self.client.delete(reverse('message_detail', args=[self.message_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
