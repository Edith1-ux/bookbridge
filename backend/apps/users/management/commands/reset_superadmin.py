from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Resets or creates the superadmin user with known working credentials.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@bookbridge.com',
            help='Superadmin email address (default: admin@bookbridge.com)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Admin@123',
            help='Superadmin password (default: Admin@123)'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Super Administrator',
            help='Superadmin full name'
        )

    def handle(self, *args, **options):
        email = options['email'].strip()
        password = options['password']
        name = options['name'].strip()

        # 1. Primary superadmin
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': name,
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        user.full_name = name
        user.role = 'SUPER_ADMIN'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"Successfully {action} primary superadmin:\n"
            f"  - Email:    {user.email}\n"
            f"  - Username: admin / superadmin (supported by FlexibleAuthBackend)\n"
            f"  - Password: {password}\n"
            f"  - Role:     {user.role}\n"
            f"  - Active:   {user.is_active}"
        ))

        # 2. Also synchronize other known admin accounts to avoid confusion
        other_admins = ['admin@bookbridge.edu', 'admin@rcti.ac.in']
        for other_email in other_admins:
            u = User.objects.filter(email=other_email).first()
            if u:
                u.set_password(password)
                u.role = 'SUPER_ADMIN'
                u.is_staff = True
                u.is_superuser = True
                u.is_active = True
                u.save()
                self.stdout.write(self.style.SUCCESS(f"Synchronized credentials for: {u.email}"))
