import io
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image

from accounts.models import User
from chat.models import Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction

DEMO_PASSWORD = 'password123'


def placeholder_png(color):
    buffer = io.BytesIO()
    Image.new('RGB', (640, 360), color).save(buffer, format='PNG')
    return ContentFile(buffer.getvalue())


class Command(BaseCommand):
    help = 'Seeds the database with demo users, conversations and messages.'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Delete existing conversations and demo users first.')

    @transaction.atomic
    def handle(self, *args, **options):
        self.now = timezone.now()

        if options['flush']:
            Conversation.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        users = self._create_users()
        self._create_conversations(users)

        self.stdout.write(self.style.SUCCESS(f'Demo data ready. Every user password is "{DEMO_PASSWORD}".'))

    # -- time helpers -------------------------------------------------
    def minutes_ago(self, n):
        return self.now - timedelta(minutes=n)

    def hours_ago(self, n):
        return self.now - timedelta(hours=n)

    def day_at(self, days_back, hour, minute):
        candidate = self.now.replace(hour=hour, minute=minute, second=0, microsecond=0) - timedelta(days=days_back)
        if candidate > self.now:
            candidate -= timedelta(days=1)
        return candidate

    # -- users ----------------------------------------------------------
    def _create_users(self):
        specs = [
            ('alejandro', 'Alejandro Sánchez', 'asanchezloaiza274@gmail.com',
             'Building things, one commit at a time.', 'online', True),
            ('laura.torres', 'Laura Torres', 'laura@loop.chat',
             'Product designer. Coffee enthusiast.', 'online', False),
            ('danielrestrepo', 'Daniel Restrepo', 'daniel@loop.chat',
             'Backend engineer. Currently deep in migrations.', 'offline', False),
            ('camilav', 'Camila Vargas', 'camila@loop.chat',
             'Marketing lead. Always in a meeting.', 'away', False),
            ('mateogomez', 'Mateo Gómez', 'mateo@loop.chat', 'iOS developer.', 'online', False),
            ('sofia.ramirez', 'Sofía Ramírez', 'sofia@loop.chat',
             'QA engineer. Finds the bugs before you do.', 'offline', False),
        ]
        users = {}
        for username, full_name, email, bio, status, is_admin in specs:
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=email, full_name=full_name, bio=bio, status=status,
                    is_staff=is_admin, is_superuser=is_admin,
                ),
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.last_seen_at = self.now - timedelta(hours=6)
                user.save()
            users[username] = user
        return users

    # -- conversations ----------------------------------------------------
    def _make_conversation(self, conv_type, name, usernames, users, avatar_color=''):
        conversation = Conversation.objects.create(
            type=conv_type, name=name, avatar_color=avatar_color, created_by=users[usernames[0]]
        )
        for username in usernames:
            ConversationParticipant.objects.create(conversation=conversation, user=users[username])
        return conversation

    def _msg(self, conversation, sender, text, when, reply_to=None, pinned=False, edited=False):
        message = Message.objects.create(
            conversation=conversation, sender=sender, text=text, reply_to=reply_to,
            is_pinned=pinned, edited_at=self.now if edited else None,
        )
        Message.objects.filter(pk=message.pk).update(created_at=when)
        message.refresh_from_db()
        return message

    def _react(self, message, user, emoji):
        MessageReaction.objects.get_or_create(message=message, user=user, emoji=emoji)

    def _set_membership(self, conversation, user, *, pinned=False, muted=False, read_until=None):
        ConversationParticipant.objects.filter(conversation=conversation, user=user).update(
            is_pinned=pinned, is_muted=muted, last_read_at=read_until,
        )

    def _create_conversations(self, users):
        alejandro = users['alejandro']
        laura = users['laura.torres']
        daniel = users['danielrestrepo']
        camila = users['camilav']
        mateo = users['mateogomez']
        sofia = users['sofia.ramirez']

        # --- Direct conversation with Laura: long, pinned message, edited, deleted, image ---
        c_laura = self._make_conversation(Conversation.Type.DIRECT, '', ['alejandro', 'laura.torres'], users)
        self._msg(c_laura, laura, 'Hey! Did you get a chance to look at the onboarding mockups?', self.day_at(1, 14, 5))
        self._msg(c_laura, alejandro, 'Yes, just finished going through them. Really clean work.', self.day_at(1, 14, 12))
        self._msg(c_laura, alejandro, 'One thing though — the empty state on step 3 feels a bit bare.', self.day_at(1, 14, 13))
        m4 = self._msg(c_laura, laura, 'Good call, I was on the fence about that one too.', self.day_at(1, 14, 20))
        self._react(m4, alejandro, '👍')
        img_msg = self._msg(c_laura, laura, 'Here is the updated color palette', self.day_at(0, 9, 2))
        attachment = MessageAttachment.objects.create(
            message=img_msg, attachment_type=MessageAttachment.Type.IMAGE,
            original_name='palette-v2.png', size=850_000, width=640, height=360,
        )
        attachment.file.save('palette-v2.png', placeholder_png((76, 125, 255)), save=True)
        pinned_msg = self._msg(c_laura, laura, 'Are we still on for the design review at 3pm?', self.day_at(0, 11, 0), pinned=True)
        self._msg(
            c_laura, alejandro, "Yes, I'll send the calendar invite in a bit", self.day_at(0, 11, 3),
            reply_to=pinned_msg,
        )
        self._msg(c_laura, laura, 'actually can we push it to 3:30', self.hours_ago(3), edited=True)
        deleted = self._msg(c_laura, laura, 'wrong chat, ignore', self.hours_ago(2.5))
        Message.objects.filter(pk=deleted.pk).update(is_deleted=True, text=None)
        self._msg(c_laura, laura, 'Talk soon!', self.minutes_ago(18))
        self._set_membership(c_laura, alejandro, pinned=True, read_until=self.minutes_ago(17))

        # --- Group: Design Team ---
        c_team = self._make_conversation(
            Conversation.Type.GROUP, 'Design Team',
            ['alejandro', 'laura.torres', 'danielrestrepo', 'camilav'], users, avatar_color='#D97757',
        )
        self._msg(c_team, camila, 'Reminder: brand guidelines review moved to Thursday', self.day_at(2, 10, 0))
        self._msg(c_team, daniel, 'Noted, thanks Camila', self.day_at(2, 10, 5))
        lib_msg = self._msg(c_team, laura, 'Sharing the latest component library export', self.day_at(1, 15, 30))
        lib_attachment = MessageAttachment.objects.create(
            message=lib_msg, attachment_type=MessageAttachment.Type.FILE,
            original_name='component-library.zip', size=12_400_000,
        )
        lib_attachment.file.save('component-library.zip', ContentFile(b'demo placeholder archive'), save=True)
        thanks = self._msg(c_team, alejandro, 'Pulling this into the project now', self.day_at(1, 15, 45))
        self._react(thanks, laura, '🙌')
        self._react(thanks, daniel, '🙌')
        self._msg(c_team, camila, 'Can someone review the landing page copy before EOD?', self.hours_ago(6))
        self._msg(c_team, daniel, 'On it', self.hours_ago(5.8))
        self._msg(c_team, laura, 'The spacing on mobile still feels a little tight, thoughts?', self.hours_ago(1.2))
        self._msg(c_team, camila, "Agreed, let's bump it up in the next pass", self.minutes_ago(40))
        self._set_membership(c_team, alejandro, pinned=True, read_until=self.hours_ago(1.5))

        # --- Direct with Daniel: short, unread ---
        c_daniel = self._make_conversation(Conversation.Type.DIRECT, '', ['alejandro', 'danielrestrepo'], users)
        self._msg(c_daniel, daniel, 'Migration finished running on staging, all green', self.hours_ago(21))
        self._msg(c_daniel, alejandro, 'Nice work, that one had a lot of edge cases', self.hours_ago(20.5))
        self._msg(c_daniel, daniel, 'Can you check the API response shape when you have a minute?', self.minutes_ago(50))
        self._msg(c_daniel, daniel, 'No rush, just before we deploy tomorrow', self.minutes_ago(48))
        self._set_membership(c_daniel, alejandro, read_until=self.hours_ago(21.5))

        # --- Direct with Mateo: audio message ---
        c_mateo = self._make_conversation(Conversation.Type.DIRECT, '', ['alejandro', 'mateogomez'], users)
        audio_msg = self._msg(c_mateo, mateo, 'Quick voice note about the build issue', self.hours_ago(4))
        audio_attachment = MessageAttachment.objects.create(
            message=audio_msg, attachment_type=MessageAttachment.Type.AUDIO,
            original_name='voice-message.webm', size=180_000, duration=42,
        )
        audio_attachment.file.save('voice-message.webm', ContentFile(b''), save=True)
        self._msg(c_mateo, alejandro, 'Got it, listening now', self.hours_ago(3.9))
        self._msg(c_mateo, alejandro, "Makes sense, I think it's the provisioning profile again", self.hours_ago(3.8))
        self._msg(c_mateo, mateo, 'That would explain it 😩', self.hours_ago(3.7))
        self._msg(c_mateo, alejandro, "I'll regenerate it and send it over", self.minutes_ago(2))
        self._set_membership(c_mateo, alejandro, read_until=self.now)

        # --- Group: Fin de semana ---
        c_weekend = self._make_conversation(
            Conversation.Type.GROUP, 'Fin de semana 🏖️',
            ['alejandro', 'sofia.ramirez', 'mateogomez', 'danielrestrepo'], users, avatar_color='#4C7DFF',
        )
        self._msg(c_weekend, sofia, "Who's in for the beach trip next Saturday?", self.day_at(3, 12, 0))
        w2 = self._msg(c_weekend, mateo, "I'm in!", self.day_at(3, 12, 4))
        self._react(w2, sofia, '🎉')
        self._react(w2, daniel, '🎉')
        self._msg(c_weekend, daniel, "Count me in too, as long as it doesn't rain this time", self.day_at(3, 12, 10))
        self._msg(c_weekend, alejandro, "Same here, I'll bring the cooler", self.day_at(2, 9, 0))
        self._msg(c_weekend, sofia, "Perfect, I'll set up the group playlist", self.day_at(2, 9, 5))
        self._set_membership(c_weekend, alejandro, read_until=self.now)

        # --- Direct with Camila: muted ---
        c_camila = self._make_conversation(Conversation.Type.DIRECT, '', ['alejandro', 'camilav'], users)
        self._msg(c_camila, camila, 'The campaign numbers came in, up 18% week over week', self.day_at(4, 17, 0))
        self._msg(c_camila, alejandro, "That's a great result, nice job", self.day_at(4, 17, 12))
        self._msg(c_camila, camila, "Thanks! I'll put together a short summary for the team", self.day_at(4, 17, 15))
        self._set_membership(c_camila, alejandro, muted=True, read_until=self.now)

        # --- Direct with Sofia ---
        c_sofia = self._make_conversation(Conversation.Type.DIRECT, '', ['alejandro', 'sofia.ramirez'], users)
        self._msg(c_sofia, sofia, 'Found two edge cases in the checkout flow, writing them up now', self.day_at(2, 13, 0))
        self._msg(c_sofia, alejandro, 'Appreciate it, send them my way whenever ready', self.day_at(2, 13, 20))
        self._set_membership(c_sofia, alejandro, read_until=self.now)
