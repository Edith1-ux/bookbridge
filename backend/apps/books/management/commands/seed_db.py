from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.books.models import Book

class Command(BaseCommand):
    help = 'Seeds initial users and GTU textbooks into the BookBridgee database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding initial BookBridgee data...'))

        # 1. Admin Users (ensure password, role and active state)
        admin_emails = [
            ('admin@bookbridge.edu', 'System Administrator'),
            ('admin@rcti.ac.in', 'Campus Administrator')
        ]
        admin_user = None
        for a_email, a_name in admin_emails:
            u, created = User.objects.get_or_create(
                email=a_email,
                defaults={
                    'full_name': a_name,
                    'role': 'SUPER_ADMIN',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                }
            )
            u.set_password('Admin@123456')
            u.role = 'SUPER_ADMIN'
            u.is_staff = True
            u.is_superuser = True
            u.is_active = True
            u.save()
            if admin_user is None:
                admin_user = u
            self.stdout.write(f"Configured admin user: {u.email} (Password: Admin@123456)")

        # 2. Demo Student Users (ensure password and role)
        student_emails = [
            ('student@rcti.ac.in', 'Rahul Patel', '+919876543210'),
            ('student@bookbridge.edu', 'Test Student', '+919876543211')
        ]
        student_user = None
        for s_email, s_name, s_phone in student_emails:
            s, created = User.objects.get_or_create(
                email=s_email,
                defaults={
                    'full_name': s_name,
                    'phone_number': s_phone,
                    'role': 'STUDENT',
                    'is_active': True,
                }
            )
            s.set_password('Student@123')
            s.role = 'STUDENT'
            s.is_active = True
            s.save()
            if student_user is None:
                student_user = s
            self.stdout.write(f"Configured student user: {s.email} (Password: Student@123)")

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
