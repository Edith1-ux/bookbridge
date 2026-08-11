from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.books.models import Book
from apps.books.serializers import BookSerializer

class AIRecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        branch = request.query_params.get('branch')
        semester = request.query_params.get('semester')

        qs = Book.objects.filter(status='Available')
        if branch:
            qs = qs.filter(branch__iexact=branch)
        if semester:
            try:
                qs = qs.filter(semester=int(semester))
            except ValueError:
                pass

        serializer = BookSerializer(qs[:10], many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
