import os
from django.conf import settings
from django.http import HttpResponse, Http404, JsonResponse

def _get_root_dir():
    base = settings.BASE_DIR
    if os.path.basename(str(base)) == 'backend':
        return os.path.dirname(str(base))
    return str(base)

def serve_html_page(filename):
    def view(request):
        root_dir = _get_root_dir()
        file_path = os.path.join(root_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
        raise Http404(f"Page {filename} not found at {file_path}")
    return view

def statistics_api(request):
    from apps.books.models import Book
    from apps.users.models import User

    db_students = User.objects.filter(role='STUDENT').count()
    db_books = Book.objects.count()
    db_exchanges = Book.objects.filter(status='Sold', mode='exchange').count()
    db_donated = Book.objects.filter(mode='donate').count()

    # Community baseline stats + real-time live additions
    active_students = 1250 + db_students
    books_listed = 480 + db_books
    successful_exchanges = 310 + db_exchanges
    books_donated = 140 + db_donated

    return JsonResponse({
        'active_students': active_students,
        'books_listed': books_listed,
        'successful_exchanges': successful_exchanges,
        'books_donated': books_donated,
        'students': active_students,
        'books': books_listed,
        'exchanges': successful_exchanges,
        'donated': books_donated,
    })
