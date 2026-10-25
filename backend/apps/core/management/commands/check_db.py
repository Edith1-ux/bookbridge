"""
Management command to safely verify database connectivity and report configuration details
without exposing sensitive credentials or passwords.

Usage:
    python manage.py check_db
"""
import sys
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Safely checks database connectivity and displays masked configuration details.'

    def handle(self, *args, **options):
        db_settings = settings.DATABASES.get('default', {})
        engine = db_settings.get('ENGINE', '')
        name = db_settings.get('NAME', '')
        user = db_settings.get('USER', '')
        host = db_settings.get('HOST', '')
        port = db_settings.get('PORT', '')
        opts = db_settings.get('OPTIONS', {})
        ssl_enabled = bool(opts.get('ssl'))

        self.stdout.write("=" * 64)
        self.stdout.write("       BookBridgee Database Connectivity Diagnostic Check")
        self.stdout.write("=" * 64)
        self.stdout.write(f"Engine:    {engine}")
        self.stdout.write(f"Database:  {name}")
        self.stdout.write(f"Host:      {host or '(local default)'}")
        self.stdout.write(f"Port:      {port or '(default)'}")
        self.stdout.write(f"User:      {user or '(default)'}")
        self.stdout.write(f"SSL:       {'Enabled' if ssl_enabled else 'Disabled'}")
        self.stdout.write("-" * 64)

        import time
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    row = cursor.fetchone()
                    if row and row[0] == 1:
                        version_str = 'Unknown'
                        try:
                            cursor.execute("SELECT VERSION()")
                            ver = cursor.fetchone()
                            if ver:
                                version_str = str(ver[0])
                        except Exception:
                            pass

                        self.stdout.write(self.style.SUCCESS(" [PASS] Database connection verified successfully!"))
                        self.stdout.write(self.style.SUCCESS(f" [INFO] Database Vendor: {connection.vendor}"))
                        self.stdout.write(self.style.SUCCESS(f" [INFO] Engine Version:  {version_str}"))
                        self.stdout.write("=" * 64)
                        return
            except Exception as err:
                if attempt < max_retries:
                    self.stdout.write(self.style.WARNING(f" [ATTEMPT {attempt}/{max_retries}] Connecting to database... retrying in 2s ({err})"))
                    time.sleep(2)
                    continue
                err_msg = str(err)
                self.stdout.write(self.style.ERROR(" [FAIL] Database connection failed!"))
                self.stdout.write(self.style.ERROR(f" Error Type: {type(err).__name__}"))
            self.stdout.write(self.style.ERROR(f" Details:    {err_msg}"))
            self.stdout.write("-" * 64)
            self.stdout.write(self.style.WARNING("Troubleshooting Guide:"))
            if 'Access denied' in err_msg:
                self.stdout.write(" - Check that MYSQL_USER and MYSQL_PASSWORD are correct.")
                self.stdout.write(" - For TiDB Cloud, ensure MYSQL_USER contains your cluster prefix (e.g. prefix.root).")
            elif any(k in err_msg.lower() for k in ("can't connect", 'timed out', 'unknown mysql server', 'name or service not known')):
                self.stdout.write(" - Check that MYSQL_HOST is accessible over the internet.")
                self.stdout.write(" - Verify MYSQL_PORT (3306 for standard MySQL, 4000 for TiDB Cloud).")
            elif 'insecure transport' in err_msg.lower():
                self.stdout.write(" - The cloud database requires SSL. Set MYSQL_SSL=true.")
            elif 'Unknown database' in err_msg:
                self.stdout.write(" - The specified MYSQL_DATABASE does not exist. Create it on your database console.")
            self.stdout.write("=" * 64)
            sys.exit(1)
