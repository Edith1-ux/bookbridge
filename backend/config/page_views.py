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
    """
    Returns real-time platform statistics computed purely from Django ORM database records.
    No fake or hardcoded baseline numbers.
    """
    try:
        from apps.books.models import Book
        from apps.users.models import User
        from apps.exchange.models import ExchangeProposal
        from apps.donations.models import DonationClaim

        active_students = User.objects.filter(is_active=True, role__iexact='STUDENT').count()
        books_listed = Book.objects.filter(status='Available').count()
        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()
        books_donated = Book.objects.filter(mode='donate').count()
        completed_donations = DonationClaim.objects.filter(status__in=['approved', 'completed']).count()
    except Exception:
        active_students = 0
        books_listed = 0
        successful_exchanges = 0
        books_donated = 0
        completed_donations = 0

    return JsonResponse({
        'active_students': active_students,
        'books_listed': books_listed,
        'successful_exchanges': successful_exchanges,
        'books_donated': books_donated,
        'completed_donations': completed_donations,
        'students': active_students,
        'books': books_listed,
        'exchanges': successful_exchanges,
        'donated': books_donated,
    })
