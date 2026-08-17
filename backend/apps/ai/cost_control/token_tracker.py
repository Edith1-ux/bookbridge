import os, time
from typing import Dict, Any
from django.core.cache import cache


class AICostControlEngine:
    """Tracks token consumption per user & college tenant, enforcing budget limits & response caching."""

    DAILY_TOKEN_LIMIT_PER_USER = 10000

    @classmethod
    def can_consume_tokens(cls, user_id: str, estimated_tokens: int = 500) -> bool:
        """Checks if user has sufficient token budget for today."""
        cache_key = f"ai_token_count:{user_id}:{time.strftime('%Y-%m-%d')}"
        used_tokens = cache.get(cache_key, 0)
        return (used_tokens + estimated_tokens) <= cls.DAILY_TOKEN_LIMIT_PER_USER

    @classmethod
    def record_token_usage(cls, user_id: str, tokens_used: int):
        """Records token usage in Redis cache."""
        cache_key = f"ai_token_count:{user_id}:{time.strftime('%Y-%m-%d')}"
        used_tokens = cache.get(cache_key, 0)
        cache.set(cache_key, used_tokens + tokens_used, 86400)

    @classmethod
    def get_cached_response(cls, prompt_hash: str) -> str | None:
        """Returns cached AI response if available."""
        return cache.get(f"ai_cache:{prompt_hash}")

    @classmethod
    def set_cached_response(cls, prompt_hash: str, response: str, ttl_seconds: int = 86400):
        """Caches AI completion response."""
        cache.set(f"ai_cache:{prompt_hash}", response, ttl_seconds)
