from django.test import TestCase
from apps.users.models import User
from apps.colleges.models import College, Department, Course
from apps.books.models import Book, Wishlist
from apps.exchange.models import ExchangeProposal
from apps.donations.models import DonationClaim
from apps.chat.models import ChatMessage
from apps.notifications.models import Notification


class ModelCRUDIntegrityTestCase(TestCase):
    """
    Validates complete Create, Read, Update, and Delete operations for all core domain models.
    All data is created in a test transaction and cleanly rolled back.
    """

    def setUp(self):
        # 1. User CRUD
        self.user1 = User.objects.create_user(
            email='student_crud_1@rcti.ac.in',
            password='TestPassword123!',
            full_name='CRUD Student 1',
            role='STUDENT'
        )
        self.user2 = User.objects.create_user(
            email='student_crud_2@rcti.ac.in',
            password='TestPassword123!',
            full_name='CRUD Student 2',
            role='STUDENT'
        )

        # 2. College & Department CRUD
        self.college = College.objects.create(
            name='Government Engineering College, Modasa',
            code='GEC-MODASA',
            city='Modasa',
            state='Gujarat'
        )
        self.department = Department.objects.create(
            college=self.college,
            name='Information Technology',
            code='IT'
        )
        self.course = Course.objects.create(
            department=self.department,
            name='Web Development Essentials',
            code='3350702',
            semester=5
        )

        # 3. Book CRUD
        self.book1 = Book.objects.create(
            seller=self.user1,
            title='Cloud Computing Architecture',
            author='John Doe',
            branch='IT',
            semester=5,
            price=300.00,
            mode='sell',
            status='Available'
        )
        self.book2 = Book.objects.create(
            seller=self.user2,
            title='Python Design Patterns',
            author='Jane Smith',
            branch='IT',
            semester=5,
            price=0.00,
            mode='donate',
            status='Available'
        )

    def test_01_user_crud(self):
        user = User.objects.get(email='student_crud_1@rcti.ac.in')
        self.assertEqual(user.full_name, 'CRUD Student 1')
        user.full_name = 'CRUD Student 1 Updated'
        user.save()
        user.refresh_from_db()
        self.assertEqual(user.full_name, 'CRUD Student 1 Updated')

    def test_02_college_hierarchy_crud(self):
        dept = Department.objects.get(code='IT', college=self.college)
        self.assertEqual(dept.college.name, 'Government Engineering College, Modasa')
        course = Course.objects.get(code='3350702')
        self.assertEqual(course.department.code, 'IT')

    def test_03_book_crud(self):
        book = Book.objects.get(title='Cloud Computing Architecture')
        self.assertEqual(book.seller, self.user1)
        self.assertEqual(float(book.price), 300.00)
        book.price = 280.00
        book.save()
        book.refresh_from_db()
        self.assertEqual(float(book.price), 280.00)

    def test_04_wishlist_crud(self):
        wish = Wishlist.objects.create(user=self.user2, book=self.book1)
        self.assertEqual(Wishlist.objects.filter(user=self.user2).count(), 1)
        wish.delete()
        self.assertEqual(Wishlist.objects.filter(user=self.user2).count(), 0)

    def test_05_exchange_proposal_crud(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user2,
            target_book=self.book1,
            offered_book_title='Database Management Systems',
            note='Clean condition book available for swap',
            status='pending'
        )
        self.assertEqual(proposal.status, 'pending')
        proposal.status = 'accepted'
        proposal.save()
        proposal.refresh_from_db()
        self.assertEqual(proposal.status, 'accepted')

    def test_06_donation_claim_crud(self):
        claim = DonationClaim.objects.create(
            claimer=self.user1,
            book=self.book2,
            message='Need for upcoming semester studies',
            status='pending'
        )
        self.assertEqual(claim.status, 'pending')
        claim.status = 'approved'
        claim.save()
        claim.refresh_from_db()
        self.assertEqual(claim.status, 'approved')

    def test_07_chat_message_crud(self):
        msg = ChatMessage.objects.create(
            sender=self.user1,
            receiver_email=self.user2.email,
            book_title=self.book1.title,
            text='Hello! Is this book still available on campus?'
        )
        self.assertIsNotNone(msg.id)
        self.assertEqual(msg.sender, self.user1)
        self.assertIn('Cloud Computing', msg.book_title)

    def test_08_notification_crud(self):
        notif = Notification.objects.create(
            recipient=self.user2,
            title='New Exchange Proposal Received',
            message='A student wants to swap for your textbook.',
            notification_type='SWAP_PROPOSAL'
        )
        self.assertFalse(notif.is_read)
        notif.is_read = True
        notif.save()
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
