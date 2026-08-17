from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.marketplace.models import AcademicResource
from apps.marketplace.serializers import AcademicResourceSerializer


class HybridSearchView(APIView):
    """Hybrid Search combining MySQL indexing, filters, and auto-synonyms."""
    permission_classes = [permissions.AllowAny]

    SYNONYMS = {
        'dbms': 'Database Management Systems',
        'dsa': 'Data Structures & Algorithms',
        'ce': 'Computer Engineering',
        'gtu': 'Gujarat Technological University',
    }

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        resource_type = request.query_params.get('type', None)
        college_id = request.query_params.get('college', None)

        resources = AcademicResource.objects.select_related('college', 'department', 'course').all()

        if college_id:
            resources = resources.filter(college_id=college_id)

        if resource_type and resource_type != 'ALL':
            resources = resources.filter(resource_type=resource_type)

        if query:
            # Synonym expansion
            expanded_query = self.SYNONYMS.get(query.lower(), query)
            resources = resources.filter(title__icontains=expanded_query) | resources.filter(gtu_code__icontains=query)

        serializer = AcademicResourceSerializer(resources[:20], many=True)
        return Response({
            'query': query,
            'count': len(serializer.data),
            'results': serializer.data
        })


class SearchAutoCompleteView(APIView):
    """Provides instant auto-complete suggestions and trending academic tags."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        trending_tags = [
            '#GTU Lab Manuals',
            '#Data Structures & Algorithms',
            '#Python Source Code',
            '#DBMS Notes',
            '#100% Free Swaps',
        ]

        if not query:
            return Response({'suggestions': [], 'trending': trending_tags})

        suggestions = AcademicResource.objects.filter(
            title__icontains=query
        ).values_list('title', flat=True).distinct()[:5]

        return Response({
            'query': query,
            'suggestions': list(suggestions),
            'trending': trending_tags
        })
