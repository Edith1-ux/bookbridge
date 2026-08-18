from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.books.models import Book

class Command(BaseCommand):
    help = 'Seeds initial users and GTU textbooks into the BookBridge database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding initial BookBridge data...'))

        # Create Admin User
        admin_user, created = User.objects.get_or_create(
            email='admin@bookbridge.edu',
            defaults={
                'full_name': 'System Administrator',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('Admin@123456')
            admin_user.save()
            self.stdout.write(f"Created admin user: {admin_user.email}")

        # Create Demo Student User
        student_user, created = User.objects.get_or_create(
            email='student@rcti.ac.in',
            defaults={
                'full_name': 'Rahul Patel',
                'phone_number': '+919876543210',
                'role': 'STUDENT',
            }
        )
        if created:
            student_user.set_password('Student@123')
            student_user.save()
            self.stdout.write(f"Created student user: {student_user.email}")

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

        self.stdout.write(self.style.SUCCESS('Successfully seeded BookBridge database!'))
