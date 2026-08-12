from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseAIProvider(ABC):
    """Abstract Interface for pluggable AI Providers (OpenAI, Gemini, Ollama, Anthropic)."""

    @abstractmethod
    def generate_completion(self, prompt: str, system_instruction: str = "") -> str:
        """Generates text completion."""
        pass

    @abstractmethod
    def generate_embeddings(self, text: str) -> List[float]:
        """Generates dense vector embeddings for semantic search."""
        pass


class BaseOCRService(ABC):
    """Abstract OCR extraction service."""

    @abstractmethod
    def extract_text(self, file_path_or_bytes: str | bytes) -> str:
        """Extracts readable text from images/PDFs."""
        pass
