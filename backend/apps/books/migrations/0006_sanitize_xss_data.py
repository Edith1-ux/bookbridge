from django.db import migrations
from django.utils.html import strip_tags

def clean_xss_records(apps, schema_editor):
    try:
        Book = apps.get_model('books', 'Book')
        for book in Book.objects.all():
            needs_save = False
            title = book.title or ''
            author = book.author or ''
            desc = book.description or ''
            exchange_for = getattr(book, 'exchange_for', '') or ''
            loc = getattr(book, 'location', '') or ''

            if any(c in (title + author + desc + exchange_for + loc) for c in ['<', '>', 'onerror', 'script', 'alert']):
                clean_title = strip_tags(title).strip()
                clean_author = strip_tags(author).strip()
                clean_desc = strip_tags(desc).strip()
                clean_ex = strip_tags(exchange_for).strip()
                clean_loc = strip_tags(loc).strip()

                book.title = clean_title if clean_title else f"Textbook {book.id}"
                book.author = clean_author if clean_author else "Academic Author"
                book.description = clean_desc
                if hasattr(book, 'exchange_for'):
                    book.exchange_for = clean_ex
                if hasattr(book, 'location'):
                    book.location = clean_loc or "Campus Central Library"
                needs_save = True

            if needs_save:
                book.save()
    except Exception as e:
        print(f"Warning: could not clean book records in migration: {e}")

    try:
        User = apps.get_model('users', 'User')
        for user in User.objects.all():
            name = user.full_name or ''
            if any(c in name for c in ['<', '>', 'script', 'alert']):
                cleaned = strip_tags(name).strip()
                user.full_name = cleaned or "Student"
                user.save()
    except Exception as e:
        print(f"Warning: could not clean user records in migration: {e}")

def reverse_clean(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('books', '0005_alter_wishlist_options_and_more'),
    ]

    operations = [
        migrations.RunPython(clean_xss_records, reverse_clean),
    ]
