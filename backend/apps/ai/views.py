import os
import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.books.models import Book
from apps.books.serializers import BookSerializer
from .cost_control.token_tracker import AICostControlEngine
from .chatbot.memory import ConversationMemoryManager


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


class AIQueryParserView(APIView):
    """Parses natural language queries into structured filters for catalog searching."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        structured_filters = {
            'query_text': query,
            'parsed_semester': None,
            'parsed_subject': None,
            'max_price': None,
            'resource_type': 'ALL',
        }

        q_lower = query.lower()
        if 'notes' in q_lower:
            structured_filters['resource_type'] = 'NOTE'
        elif 'manual' in q_lower or 'lab' in q_lower:
            structured_filters['resource_type'] = 'LAB_MANUAL'
        elif 'textbook' in q_lower or 'book' in q_lower:
            structured_filters['resource_type'] = 'TEXTBOOK'

        # Basic number/semester extractor
        for word in q_lower.split():
            if word.isdigit() and 1 <= int(word) <= 8:
                structured_filters['parsed_semester'] = int(word)

        return Response({
            'status': 'success',
            'original_query': query,
            'filters': structured_filters
        })


class AIAssistantView(APIView):
    """
    Academic Study Assistant.
    Calls Google Gemini or OpenAI when API keys are configured, or provides structured
    academic guidance with rate limits, privacy-safe per-user session isolation, and token budgeting.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        prompt = request.data.get('prompt', '').strip()
        # Ensure session_id is always strictly scoped to the authenticated user ID
        user_scope = str(user.id)
        raw_session_id = request.data.get('session_id', 'default')
        session_id = f"{user_scope}_{raw_session_id}"

        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not AICostControlEngine.can_consume_tokens(user_scope):
            return Response(
                {'error': 'Daily AI request quota reached for your account. Please try again tomorrow.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        prompt_hash = hashlib.md5(f"{session_id}:{prompt}".encode()).hexdigest()
        cached_reply = AICostControlEngine.get_cached_response(prompt_hash)

        if cached_reply:
            reply = cached_reply
        else:
            gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
            openai_key = os.environ.get('OPENAI_API_KEY')

            if gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    system_context = (
                        f"You are the BookBridge Academic Study Assistant for Indian university/GTU students. "
                        f"The student is {user.full_name or 'Student'}. Be concise, helpful, and academically focused. "
                        f"User asked: {prompt}"
                    )
                    res = model.generate_content(system_context)
                    reply = res.text
                except Exception as e:
                    reply = (
                        f"Hello {user.full_name or 'Student'}, I am your BookBridge Academic Assistant. "
                        f"Regarding '{prompt}': Please review the GTU syllabus and check our verified course listings for relevant reference materials."
                    )
            elif openai_key:
                try:
                    import openai
                    client = openai.OpenAI(api_key=openai_key)
                    res = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are the BookBridge Academic Study Assistant for engineering students."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=300
                    )
                    reply = res.choices[0].message.content
                except Exception:
                    reply = (
                        f"Hello {user.full_name or 'Student'}, I am your BookBridge Academic Assistant. "
                        f"Regarding '{prompt}': Check our catalog for recommended GTU textbooks, lab manuals, and notes."
                    )
            else:
                # Transparent default response when external LLM API key is not configured
                reply = (
                    f"Hello {user.full_name or 'Student'}! (BookBridge Academic Guide) "
                    f"Regarding '{prompt}': For this topic, we recommend checking books in your department branch, "
                    f"consulting your subject syllabus, and reaching out to senior students for notes."
                )

            AICostControlEngine.set_cached_response(prompt_hash, reply)
            AICostControlEngine.record_token_usage(user_scope, len(prompt) + len(reply))

        # Store in user-scoped conversation memory
        ConversationMemoryManager.append_message(session_id, 'user', prompt)
        ConversationMemoryManager.append_message(session_id, 'assistant', reply)

        return Response({
            'session_id': raw_session_id,
            'reply': reply,
            'history': ConversationMemoryManager.get_history(session_id)
        }, status=status.HTTP_200_OK)


class AIPrivacyPurgeView(APIView):
    """User privacy control: Clears user's AI chatbot memory instantly."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_scope = str(request.user.id)
        raw_session_id = request.data.get('session_id', 'default')
        session_id = f"{user_scope}_{raw_session_id}"
        ConversationMemoryManager.clear_memory(session_id)
        return Response({'message': 'Conversation memory purged successfully.'}, status=status.HTTP_200_OK)
