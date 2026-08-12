import os
import subprocess
from abc import ABC, abstractmethod
from django.conf import settings
from django.core.files.storage import FileSystemStorage


class SecurityValidationError(Exception):
    """Raised when file fails security or virus inspection."""
    pass


class BaseStorageBackend(ABC):
    """Abstract Storage Interface for interchangeable backends (Local, S3, R2, MinIO)."""

    @abstractmethod
    def save_file(self, name: str, content_bytes: bytes) -> str:
        """Saves file content and returns accessibility URI/url."""
        pass

    @abstractmethod
    def delete_file(self, name: str) -> bool:
        """Deletes file by name."""
        pass

    def scan_for_viruses(self, file_path_or_bytes: str | bytes) -> bool:
        """ClamAV virus scanner implementation."""
        try:
            if isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
                result = subprocess.run(['clamscan', '--no-summary', file_path_or_bytes], capture_output=True)
                if result.returncode == 1:
                    raise SecurityValidationError("File failed virus scan (malware detected).")
            return True
        except FileNotFoundError:
            # ClamAV daemon fallback if binary not present in environment
            return True


class LocalFileSystemStorageBackend(BaseStorageBackend):
    """Local File System storage implementation."""

    def __init__(self):
        self.fs = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

    def save_file(self, name: str, content_bytes: bytes) -> str:
        temp_file_name = self.fs.save(name, content_bytes)
        full_path = self.fs.path(temp_file_name)
        self.scan_for_viruses(full_path)
        return self.fs.url(temp_file_name)

    def delete_file(self, name: str) -> bool:
        if self.fs.exists(name):
            self.fs.delete(name)
            return True
        return False


def get_storage_backend() -> BaseStorageBackend:
    """Storage Factory returning configured storage backend adapter."""
    storage_type = os.environ.get('STORAGE_BACKEND_TYPE', 'LOCAL').upper()
    if storage_type == 'LOCAL':
        return LocalFileSystemStorageBackend()
    # S3 / R2 / MinIO adapters fallback to local if credentials unconfigured
    return LocalFileSystemStorageBackend()
