from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.books.models import Book

class Command(BaseCommand):
    help = 'Seeds initial users and GTU textbooks into the BookBridgee database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding initial BookBridgee data...'))

        # Create/Update Standard Demo Accounts & User Account
        demo_accounts = [
            {'email': 'admin@rcti.ac.in', 'name': 'RCTI Admin', 'role': 'SUPER_ADMIN', 'is_staff': True, 'is_superuser': True, 'pass': 'password123'},
            {'email': 'keval.ce@rcti.ac.in', 'name': 'Keval (Student Lead)', 'role': 'STUDENT', 'is_staff': False, 'is_superuser': False, 'pass': 'password123'},
            {'email': 'student@rcti.ac.in', 'name': 'Demo Student', 'role': 'STUDENT', 'is_staff': False, 'is_superuser': False, 'pass': 'password123'},
            {'email': 'prajapatived814@gmail.com', 'name': 'Ved Prajapati', 'role': 'STUDENT', 'is_staff': False, 'is_superuser': False, 'pass': 'password123'},
            {'email': 'admin@bookbridge.edu', 'name': 'System Administrator', 'role': 'SUPER_ADMIN', 'is_staff': True, 'is_superuser': True, 'pass': 'Admin@123456'},
        ]
        student_user = None
        for acc in demo_accounts:
            u, created = User.objects.get_or_create(
                email=acc['email'],
                defaults={
                    'full_name': acc['name'],
                    'role': acc['role'],
                    'is_staff': acc['is_staff'],
                    'is_superuser': acc['is_superuser']
                }
            )
            u.set_password(acc['pass'])
            u.is_active = True
            u.full_name = acc['name']
            u.save()
            if acc['email'] == 'student@rcti.ac.in':
                student_user = u
            self.stdout.write(f"Configured account: {u.email} (password: {acc['pass']})")


        # Seed GTU Books
        initial_books = [
            {
                'title': 'Database Management Systems (GTU)',
                'author': 'Atul Prakashan',
                'gtu_code': '3150710',
                'branch': 'CE',
                'semester': 5,
                'condition': 'Like New',
                'mode': 'sell',
                'price': 180.00,
                'original_price': 350.00,
                'subject': 'Database Management',
                'description': 'Comprehensive GTU CE 5th semester DBMS book with past exam solutions.',
                'seller': student_user
            },
            {
                'title': 'Computer Networks & Internet Protocol',
                'author': 'Andrew S. Tanenbaum',
                'gtu_code': '3150711',
                'branch': 'CE',
                'semester': 5,
                'condition': 'Good',
                'mode': 'exchange',
                'price': 0.00,
                'original_price': 650.00,
                'exchange_for': 'Operating System Concepts',
                'subject': 'Computer Networks',
                'description': 'Reference textbook for GTU 5th semester computer networking.',
                'seller': student_user
            },
            {
                'title': 'Object Oriented Programming with C++',
                'author': 'E. Balagurusamy',
                'gtu_code': '3130702',
                'branch': 'CE',
                'semester': 3,
                'condition': 'Good',
                'mode': 'donate',
                'price': 0.00,
                'original_price': 299.00,
                'subject': 'OOP C++',
                'description': 'Free donation textbook for junior diploma/degree engineering students.',
                'seller': student_user
            }
        ]

        for b_data in initial_books:
            b_obj, b_created = Book.objects.get_or_create(
                title=b_data['title'],
                seller=b_data['seller'],
                defaults=b_data
            )
            if b_created:
                self.stdout.write(f"Created book: {b_obj.title}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded BookBridgee database!'))
