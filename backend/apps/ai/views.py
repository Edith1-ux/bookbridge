import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .cost_control.token_tracker import AICostControlEngine
from .chatbot.memory import ConversationMemoryManager


class AIQueryParserView(APIView):
    """Parses natural language queries (e.g. 'Semester 4 DBMS notes under ₹200') into structured filters."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Rule-based / AI NL parser
        structured_filters = {
            'query_text': query,
            'parsed_semester': None,
            'parsed_subject': None,
            'max_price': None,
            'resource_type': 'ALL',
        }

        # Example NL extraction logic
        if 'notes' in query.lower():
            structured_filters['resource_type'] = 'NOTE'
        elif 'manual' in query.lower() or 'lab' in query.lower():
            structured_filters['resource_type'] = 'LAB_MANUAL'

        return Response({
            'status': 'success',
            'original_query': query,
            'filters': structured_filters
        })


class AIAssistantView(APIView):
    """Academic Study Assistant Chatbot with sliding-window memory and token cost control."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        prompt = request.data.get('prompt', '').strip()
        session_id = request.data.get('session_id', str(user.id))

        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not AICostControlEngine.can_consume_tokens(str(user.id)):
            return Response({'error': 'Daily AI token limit reached. Please try again tomorrow.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Retrieve conversation history
        history = ConversationMemoryManager.get_history(session_id)
        
        # Check cache
        prompt_hash = hashlib.md5(f"{session_id}:{prompt}".encode()).hexdigest()
        cached_reply = AICostControlEngine.get_cached_response(prompt_hash)
        
        if cached_reply:
            reply = cached_reply
        else:
            # AI Response Generation Logic
            reply = f"Hello {user.full_name}, I am your BookBridge Academic Assistant! You asked about: '{prompt}'. As an academic resource, I recommend checking out our verified notes and GTU syllabus guidelines."
            AICostControlEngine.set_cached_response(prompt_hash, reply)
            AICostControlEngine.record_token_usage(str(user.id), len(prompt) + len(reply))

        # Store in conversation memory
        ConversationMemoryManager.append_message(session_id, 'user', prompt)
        ConversationMemoryManager.append_message(session_id, 'assistant', reply)

        return Response({
            'session_id': session_id,
            'reply': reply,
            'history': ConversationMemoryManager.get_history(session_id)
        })


class AIPrivacyPurgeView(APIView):
    """User privacy control: Clears AI chatbot memory instantly."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id', str(request.user.id))
        ConversationMemoryManager.clear_memory(session_id)
        return Response({'message': 'Conversation memory purged successfully.'})
