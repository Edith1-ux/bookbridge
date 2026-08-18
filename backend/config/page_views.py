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

    active_students = User.objects.filter(role='STUDENT').count()
    books_listed = Book.objects.count()
    successful_exchanges = Book.objects.filter(status='Sold', mode='exchange').count()
    books_donated = Book.objects.filter(mode='donate').count()

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
