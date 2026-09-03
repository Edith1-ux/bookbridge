import os
import sys
from pathlib import Path
from datetime import timedelta

# ---------------------------------------------------------------------------
# PATH SETUP
# ---------------------------------------------------------------------------
# BASE_DIR = backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Ensure 'backend/' is on sys.path so 'apps.*' and 'config.*' imports work.
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# PROJECT_ROOT = repo root (parent of backend/)
PROJECT_ROOT = BASE_DIR.parent

# ---------------------------------------------------------------------------
# SECURITY
# ---------------------------------------------------------------------------
# Default to True in local development; default to False in production (Render/Cloud)
_is_prod = bool(os.environ.get('RENDER') or os.environ.get('RENDER_EXTERNAL_HOSTNAME') or os.environ.get('PRODUCTION'))
DEBUG = os.environ.get('DEBUG', 'False' if _is_prod else 'True').lower() in ('true', '1', 'yes')

SECRET_KEY = os.environ.get('SECRET_KEY', '') or os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG or 'test' in sys.argv or os.environ.get('DJANGO_TEST', '').lower() == 'true':
        SECRET_KEY = 'django-insecure-dev-only-secret-key-do-not-use-in-production'
    else:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured("The SECRET_KEY environment variable must be set in production (DEBUG=False).")

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get('ALLOWED_HOSTS', '*').split(',') if h.strip()
]
if '.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')
if 'book-bridge-2.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('book-bridge-2.onrender.com')
if 'book-bridge-2-5dbv.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('book-bridge-2-5dbv.onrender.com')

# Auto-add Render hostname
_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# ---------------------------------------------------------------------------
# APPLICATION DEFINITION
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'channels',

    # BookBridge apps
    'apps.core.apps.CoreConfig',
    'apps.users.apps.UsersConfig',
    'apps.colleges.apps.CollegesConfig',
    'apps.books.apps.BooksConfig',
    'apps.exchange.apps.ExchangeConfig',
    'apps.donations.apps.DonationsConfig',
    'apps.marketplace.apps.MarketplaceConfig',
    'apps.search_engine.apps.SearchEngineConfig',
    'apps.ai.apps.AiConfig',
    'apps.chat.apps.ChatConfig',
    'apps.calls.apps.CallsConfig',
    'apps.notifications.apps.NotificationsConfig',
    'apps.payments.apps.PaymentsConfig',
    'apps.public_api.apps.PublicApiConfig',
    'apps.analytics.apps.AnalyticsConfig',
    'apps.admin_portal.apps.AdminPortalConfig',
]

try:
    import daphne
    INSTALLED_APPS.insert(0, 'daphne')
except ImportError:
    pass

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates', PROJECT_ROOT],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ---------------------------------------------------------------------------
# DATABASE — Automatic Multi-Engine Support (MySQL / PostgreSQL / SQLite)
# Production strictly requires MySQL/PostgreSQL. Silent SQLite fallback is blocked when DEBUG=False.
# ---------------------------------------------------------------------------
_database_url = os.environ.get('DATABASE_URL', '') or os.environ.get('MYSQL_URL', '')
_mysql_host = os.environ.get('MYSQL_HOST', os.environ.get('MYSQLHOST', '')).strip()
_mysql_port = str(os.environ.get('MYSQL_PORT', os.environ.get('MYSQLPORT', '3306'))).strip()
_mysql_db = os.environ.get('MYSQL_DATABASE', os.environ.get('MYSQLDATABASE', 'bookbridge_db')).strip()
_mysql_user = os.environ.get('MYSQL_USER', os.environ.get('MYSQLUSER', 'root')).strip()
_mysql_password = os.environ.get('MYSQL_PASSWORD', os.environ.get('MYSQLPASSWORD', ''))

_is_testing = 'test' in sys.argv or os.environ.get('DJANGO_TEST', '').lower() == 'true'
_is_collectstatic = 'collectstatic' in sys.argv
_force_mysql = os.environ.get('FORCE_MYSQL', '').lower() in ('true', '1', 'yes')
_use_sqlite = os.environ.get('USE_SQLITE', '').lower() in ('true', '1', 'yes')

if (_is_testing or _is_collectstatic) and not os.environ.get('FORCE_MYSQL_TEST'):
    # In-memory test runner for CI / offline test suite execution and static collection
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
elif _database_url and ('postgres://' in _database_url or 'postgresql://' in _database_url):
    import urllib.parse
    parsed = urllib.parse.urlparse(_database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': parsed.path.lstrip('/') or 'bookbridge_db',
            'USER': parsed.username or '',
            'PASSWORD': parsed.password or '',
            'HOST': parsed.hostname or '',
            'PORT': str(parsed.port or '5432'),
            'CONN_MAX_AGE': 60,
        }
    }
elif _database_url and ('mysql://' in _database_url or 'mariadb://' in _database_url):
    import urllib.parse
    parsed = urllib.parse.urlparse(_database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': parsed.path.lstrip('/') or 'bookbridge_db',
            'USER': parsed.username or 'root',
            'PASSWORD': parsed.password or '',
            'HOST': parsed.hostname or '127.0.0.1',
            'PORT': str(parsed.port or '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'connect_timeout': 10,
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            'CONN_MAX_AGE': 60,
        }
    }
elif _mysql_host and (_force_mysql or _mysql_host not in ('127.0.0.1', 'localhost', '')):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': _mysql_db or 'bookbridge_db',
            'USER': _mysql_user or 'root',
            'PASSWORD': _mysql_password or '',
            'HOST': _mysql_host,
            'PORT': _mysql_port,
            'OPTIONS': {
                'charset': 'utf8mb4',
                'connect_timeout': 10,
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            'CONN_MAX_AGE': 60,
        }
    }
elif not DEBUG and not _is_testing and not _use_sqlite:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured(
        "Production deployment (DEBUG=False) strictly requires MySQL database configuration. "
        "Please provide MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, or DATABASE_URL."
    )
else:
    # Default to SQLite for local development only
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ---------------------------------------------------------------------------
# CHANNELS & REDIS LAYER CONFIGURATION
# ---------------------------------------------------------------------------
_redis_url = os.environ.get('REDIS_URL', '') or os.environ.get('REDIS_TLS_URL', '')
_redis_host = os.environ.get('REDIS_HOST', '').strip()
_redis_port = str(os.environ.get('REDIS_PORT', '6379')).strip()

if _redis_url:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [_redis_url],
            },
        },
    }
elif _redis_host:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [(_redis_host, int(_redis_port))],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# ---------------------------------------------------------------------------
# CACHE CONFIGURATION (Redis with LocMemCache fallback)
# ---------------------------------------------------------------------------
if _redis_url:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': _redis_url,
            'KEY_PREFIX': 'bookbridge',
            'TIMEOUT': 300,
        }
    }
elif _redis_host:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f'redis://{_redis_host}:{_redis_port}/1',
            'KEY_PREFIX': 'bookbridge',
            'TIMEOUT': 300,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'bookbridge-locmem-cache',
            'KEY_PREFIX': 'bookbridge',
            'TIMEOUT': 300,
        }
    }


# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# INTERNATIONALIZATION
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# STATIC & MEDIA FILES
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []
if (PROJECT_ROOT / 'js').exists():
    STATICFILES_DIRS.append(('js', PROJECT_ROOT / 'js'))
if (PROJECT_ROOT / 'css').exists():
    STATICFILES_DIRS.append(('css', PROJECT_ROOT / 'css'))
if (PROJECT_ROOT / 'browse_images').exists():
    STATICFILES_DIRS.append(('browse_images', PROJECT_ROOT / 'browse_images'))

# Root files for direct WhiteNoise serving (e.g. style.css, favicon, logo)
WHITENOISE_ROOT = PROJECT_ROOT
WHITENOISE_AUTOREFRESH = DEBUG
WHITENOISE_USE_FINDERS = True

# ---------------------------------------------------------------------------
# MEDIA & OBJECT STORAGE (S3-compatible cloud storage with local fallback)
# ---------------------------------------------------------------------------
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', '').strip()
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '').strip()
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '').strip()
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1').strip()
AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', '').strip() or None
AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN', '').strip() or None
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH = False

if AWS_STORAGE_BUCKET_NAME and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
            'OPTIONS': {
                'bucket_name': AWS_STORAGE_BUCKET_NAME,
                'region_name': AWS_S3_REGION_NAME,
                'endpoint_url': AWS_S3_ENDPOINT_URL,
                'custom_domain': AWS_S3_CUSTOM_DOMAIN,
                'file_overwrite': False,
                'default_acl': None,
                'querystring_auth': False,
            },
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
        },
    }
    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
    elif AWS_S3_ENDPOINT_URL:
        MEDIA_URL = f'{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/media/'
    else:
        MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/media/'
else:
    # Standard local filesystem storage for local development & testing
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
        },
    }
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# REST FRAMEWORK & JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '300/hour',
        'user': '3000/hour',
        'auth': '10/minute',     # Login & registration
    },
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = DEBUG

_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
elif not DEBUG:
    # In production with no explicit config, allow Render origins
    CORS_ALLOWED_ORIGINS = [
        'https://book-bridge-2.onrender.com',
        'https://book-bridge-2-5dbv.onrender.com',
    ]
    if _render_host and f'https://{_render_host}' not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(f'https://{_render_host}')
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# SECURITY HARDENING (production only)
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

    # CSRF trusted origins
    CSRF_TRUSTED_ORIGINS = [
        'https://*.onrender.com',
        'https://book-bridge-2.onrender.com',
        'https://book-bridge-2-5dbv.onrender.com'
    ]
    _csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
    if _csrf_origins:
        CSRF_TRUSTED_ORIGINS.extend([o.strip() for o in _csrf_origins.split(',') if o.strip()])
    if _render_host and f'https://{_render_host}' not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(f'https://{_render_host}')
else:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'structured': {
            'format': '{asctime} [{levelname}] {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'structured',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if not DEBUG else 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING' if not DEBUG else 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# DEMO MODE — controls whether localStorage fallback is allowed in frontend
# ---------------------------------------------------------------------------
DEMO_MODE = os.environ.get('DEMO_MODE', 'false').lower() in ('true', '1', 'yes')
