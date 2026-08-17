from typing import List, Dict
from django.core.cache import cache


class ConversationMemoryManager:
    """Manages sliding-window conversation memory with token limits and user privacy controls."""

    MAX_HISTORY_MESSAGES = 10

    @classmethod
    def get_history(cls, session_id: str) -> List[Dict[str, str]]:
        """Retrieves active conversation memory from Redis."""
        return cache.get(f"ai_chat_memory:{session_id}", [])

    @classmethod
    def append_message(cls, session_id: str, role: str, content: str):
        """Appends message to sliding window conversation history."""
        history = cls.get_history(session_id)
        history.append({'role': role, 'content': content})
        if len(history) > cls.MAX_HISTORY_MESSAGES:
            history = history[-cls.MAX_HISTORY_MESSAGES:]
        cache.set(f"ai_chat_memory:{session_id}", history, 3600)

    @classmethod
    def clear_memory(cls, session_id: str) -> bool:
        """User privacy purge: Clears conversation memory instantly."""
        cache.delete(f"ai_chat_memory:{session_id}")
        return True
