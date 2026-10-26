import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from apps.books.models import Book
from apps.books.serializers import BookSerializer

logger = logging.getLogger('apps.search_engine')


class HybridSearchView(APIView):
    """
    Hybrid Search over the live Book catalog combining text search, filters, and auto-synonyms.
    Previously queried the empty AcademicResource model; now correctly queries the populated Book model.
    """
    permission_classes = [permissions.AllowAny]

    SYNONYMS = {
        'dbms': 'Database Management Systems',
        'dsa': 'Data Structures',
        'os': 'Operating Systems',
        'cn': 'Computer Networks',
        'toc': 'Theory of Computation',
        'se': 'Software Engineering',
        'ce': 'Computer Engineering',
        'gtu': 'GTU',
    }

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        resource_type = request.query_params.get('type', None)
        branch = request.query_params.get('branch', None)
        semester = request.query_params.get('semester', None)
        mode = request.query_params.get('mode', None)

        books = Book.objects.select_related('seller', 'seller__college', 'seller__department').filter(
            status='Available'
        )

        if branch:
            books = books.filter(branch__iexact=branch)

        if semester:
            try:
                books = books.filter(semester=int(semester))
            except ValueError:
                pass

        if mode:
            books = books.filter(mode__iexact=mode)

        if resource_type and resource_type.upper() not in ('ALL', ''):
            books = books.filter(resource_type__icontains=resource_type)

        if query:
            # Synonym expansion for common academic abbreviations
            expanded_query = self.SYNONYMS.get(query.lower(), query)
            books = books.filter(
                Q(title__icontains=expanded_query) |
                Q(author__icontains=expanded_query) |
                Q(gtu_code__icontains=query) |
                Q(subject__icontains=expanded_query) |
                Q(description__icontains=expanded_query)
            )

        books = books.order_by('-created_at')[:20]
        serializer = BookSerializer(books, many=True, context={'request': request})
        return Response({
            'query': query,
            'count': len(serializer.data),
            'results': serializer.data
        })


class SearchAutoCompleteView(APIView):
    """Provides instant auto-complete suggestions and trending academic tags from the live Book catalog."""
    permission_classes = [permissions.AllowAny]

    TRENDING_TAGS = [
        '#GTU Lab Manuals',
        '#Data Structures & Algorithms',
        '#Python Source Code',
        '#DBMS Notes',
        '#100% Free Swaps',
        '#Operating Systems',
        '#Computer Networks',
    ]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({'suggestions': [], 'trending': self.TRENDING_TAGS})

        suggestions = list(
            Book.objects.filter(
                Q(title__icontains=query) | Q(author__icontains=query) | Q(gtu_code__icontains=query),
                status='Available'
            ).values_list('title', flat=True).distinct()[:8]
        )

        return Response({
            'query': query,
            'suggestions': suggestions,
            'trending': self.TRENDING_TAGS
        })
