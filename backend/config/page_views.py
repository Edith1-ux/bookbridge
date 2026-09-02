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
    Returns real-time platform statistics computed purely from Django ORM database records with caching.
    No fake or hardcoded baseline numbers.
    """
    from django.core.cache import cache
    cache_key = 'bookbridge_public_platform_statistics'
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    try:
        from django.db.models import Count, Q
        from apps.books.models import Book
        from apps.users.models import User
        from apps.exchange.models import ExchangeProposal
        from apps.donations.models import DonationClaim

        active_students = User.objects.filter(is_active=True, role__iexact='STUDENT').count()
        book_stats = Book.objects.aggregate(
            books_listed=Count('id', filter=Q(status='Available')),
            books_donated=Count('id', filter=Q(mode='donate'))
        )
        books_listed = book_stats['books_listed'] or 0
        books_donated = book_stats['books_donated'] or 0

        successful_exchanges = ExchangeProposal.objects.filter(status='completed').count()
        completed_donations = DonationClaim.objects.filter(status__in=['approved', 'completed']).count()
    except Exception:
        active_students = 0
        books_listed = 0
        successful_exchanges = 0
        books_donated = 0
        completed_donations = 0

    payload = {
        'active_students': active_students,
        'books_listed': books_listed,
        'successful_exchanges': successful_exchanges,
        'books_donated': books_donated,
        'completed_donations': completed_donations,
        'students': active_students,
        'books': books_listed,
        'exchanges': successful_exchanges,
        'donated': books_donated,
    }
    cache.set(cache_key, payload, timeout=30)
    return JsonResponse(payload)

