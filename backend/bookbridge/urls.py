"""
BookBridge URL Configuration (bookbridge package entrypoint)
Delegates directly to config.urls for consistent production routing.
"""
from config.urls import urlpatterns, serve_html_page, health_check

__all__ = ['urlpatterns', 'serve_html_page', 'health_check']
