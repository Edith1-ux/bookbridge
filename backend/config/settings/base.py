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
# ENVIRONMENT VARIABLES LOADER (.env)
# ---------------------------------------------------------------------------
def _load_env_file(env_path):
    if env_path.exists() and env_path.is_file():
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key and key not in os.environ:
                        os.environ[key] = val
        except Exception:
            pass

# Default to True in local development; default to False in production (Render/Cloud)
_is_prod = bool(os.environ.get('RENDER') or os.environ.get('RENDER_EXTERNAL_HOSTNAME') or os.environ.get('PRODUCTION'))

_has_local_env = (PROJECT_ROOT / '.env').exists() or (BASE_DIR / '.env').exists()
_load_env_file(PROJECT_ROOT / '.env')
_load_env_file(BASE_DIR / '.env')
if not _has_local_env and not _is_prod:
    _load_env_file(PROJECT_ROOT / '.env.example')


# ---------------------------------------------------------------------------
# SECURITY
# ---------------------------------------------------------------------------
import secrets

if not _is_prod and not _has_local_env:
    DEBUG = True
else:
    DEBUG = os.environ.get('DEBUG', 'False' if _is_prod else 'True').lower() in ('true', '1', 'yes')

SECRET_KEY = os.environ.get('SECRET_KEY', '') or os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG or 'test' in sys.argv or os.environ.get('DJANGO_TEST', '').lower() == 'true':
        SECRET_KEY = 'django-insecure-dev-only-secret-key-do-not-use-in-production'
    else:
        # Generate a secure fallback secret key so deployment never crashes on unconfigured SECRET_KEY
        SECRET_KEY = secrets.token_urlsafe(50)

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get('ALLOWED_HOSTS', '*').split(',') if h.strip()
]
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')
if '.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')

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

    # BookBridgee apps
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
# Production strictly requires MySQL. Ephemeral SQLite fallback is blocked when DEBUG=False.
# ---------------------------------------------------------------------------
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

_database_url = os.environ.get('DATABASE_URL', '') or os.environ.get('MYSQL_URL', '')
_mysql_host = os.environ.get('MYSQL_HOST', os.environ.get('MYSQLHOST', '')).strip()
_mysql_port = str(os.environ.get('MYSQL_PORT', os.environ.get('MYSQLPORT', '3306'))).strip()
_mysql_db = os.environ.get('MYSQL_DATABASE', os.environ.get('MYSQLDATABASE', 'bookbridge_db')).strip()
_mysql_user = os.environ.get('MYSQL_USER', os.environ.get('MYSQLUSER', 'root')).strip()
_mysql_password = os.environ.get('MYSQL_PASSWORD', os.environ.get('MYSQLPASSWORD', '')).strip()

# Early parsing of DATABASE_URL if mysql scheme is provided
_mysql_url_has_ssl = False
if _database_url and ('mysql://' in _database_url or 'mysqls://' in _database_url or 'mariadb://' in _database_url):
    import urllib.parse
    _parsed_db = urllib.parse.urlparse(_database_url)
    if _parsed_db.hostname:
        _mysql_host = _parsed_db.hostname
    if _parsed_db.port:
        _mysql_port = str(_parsed_db.port)
    if _parsed_db.path.lstrip('/'):
        _mysql_db = _parsed_db.path.lstrip('/')
    if _parsed_db.username:
        _mysql_user = urllib.parse.unquote(_parsed_db.username)
    if _parsed_db.password:
        _mysql_password = urllib.parse.unquote(_parsed_db.password)
    if 'mysqls://' in _database_url or 'ssl' in _parsed_db.query.lower():
        _mysql_url_has_ssl = True

_is_testing = 'test' in sys.argv or os.environ.get('DJANGO_TEST', '').lower() == 'true'
_is_collectstatic = 'collectstatic' in sys.argv
_force_mysql = os.environ.get('FORCE_MYSQL', '').lower() in ('true', '1', 'yes')
_use_sqlite = os.environ.get('USE_SQLITE', '').lower() in ('true', '1', 'yes')

DISALLOWED_HOST_PLACEHOLDERS = {
    'your-mysql-host',
    'your-mysql-host.cloud',
    'your_mysql_host',
    'your-host',
    'your-mysql-server',
    'mysql-host',
    'placeholder',
    'example.com',
    'change-me',
    'changeme',
    'todo',
}

DISALLOWED_PASS_PLACEHOLDERS = {
    'your-mysql-password',
    'your_mysql_password',
    'your_mysql_password_here',
    'your_secure_mysql_password',
    'your-password',
    'password',
    'changeme',
    'change-me',
}

# In production (Render/Cloud), validate that real credentials are provided IF configured
if _is_prod and not DEBUG and not _is_testing and not _is_collectstatic and not _use_sqlite:
    from django.core.exceptions import ImproperlyConfigured

    if _database_url and ('postgres://' in _database_url or 'postgresql://' in _database_url):
        for placeholder in DISALLOWED_HOST_PLACEHOLDERS:
            if placeholder in _database_url.lower():
                raise ImproperlyConfigured(
                    f"Production Database Error: DATABASE_URL contains placeholder '{placeholder}'.\n"
                    "Please provide your real cloud database connection URL in Render Environment Variables."
                )
    elif _mysql_host:
        if (_mysql_host.lower() in DISALLOWED_HOST_PLACEHOLDERS or _mysql_host.lower().startswith('your-') or '<' in _mysql_host or _mysql_host.lower() in ('localhost', '127.0.0.1')) and not _force_mysql:
            import warnings
            warnings.warn(
                f"Production Database Notice: MYSQL_HOST is set to '{_mysql_host}'. "
                "In Render production, localhost or placeholder host is not accessible. Falling back to SQLite. "
                "To use persistent MySQL, provide an external managed MySQL host in Render Environment Variables."
            )
            _use_sqlite = True

        if not _use_sqlite:
            if not _mysql_password or _mysql_password.lower() in DISALLOWED_PASS_PLACEHOLDERS:
                raise ImproperlyConfigured(
                    "Production Database Error: MYSQL_PASSWORD is missing or set to a placeholder.\n"
                    "Please set your real MySQL database password in Render Environment Variables."
                )

            if not _mysql_user or _mysql_user.lower().startswith('your-'):
                raise ImproperlyConfigured(
                    "Production Database Error: MYSQL_USER is missing or set to a placeholder.\n"
                    "Please set your real MySQL username in Render Environment Variables."
                )

            if 'tidbcloud.com' in _mysql_host.lower() and '.' not in _mysql_user:
                raise ImproperlyConfigured(
                    f"TiDB Cloud Configuration Error: MYSQL_USER is set to '{_mysql_user}'.\n"
                    "TiDB Serverless requires the full username including the cluster prefix (e.g. '2t3ToPWdqgY8uQT.root').\n"
                    "Please update MYSQL_USER in Render Dashboard to the complete prefixed username from TiDB."
                )

            if not _mysql_db or _mysql_db.lower().startswith('your-'):
                raise ImproperlyConfigured(
                    "Production Database Error: MYSQL_DATABASE is missing or set to a placeholder.\n"
                    "Please set your real MySQL database name in Render Environment Variables."
                )
    else:
        import warnings
        warnings.warn(
            "Production Database Notice: Neither MYSQL_HOST nor DATABASE_URL is configured in Render Environment Variables. "
            "Falling back to temporary SQLite. To ensure persistent data storage on Render, please configure your cloud MySQL credentials "
            "(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) in the Render Dashboard."
        )

# Cloud SSL detection & configuration (TiDB Cloud, Aiven, Azure, DigitalOcean require SSL)
_mysql_ssl_ca = os.environ.get('MYSQL_SSL_CA', '').strip()
_mysql_ssl_mode = os.environ.get('MYSQL_SSL_MODE', '').strip()
_mysql_ssl_required = (
    os.environ.get('MYSQL_SSL', '').lower() in ('true', '1', 'yes', 'required') or
    _mysql_url_has_ssl or
    any(domain in _mysql_host.lower() for domain in ('tidbcloud.com', 'aivencloud.com', 'azure.com', 'digitalocean.com'))
)

_init_commands = ["SET sql_mode='STRICT_TRANS_TABLES'"]
if 'tidbcloud.com' in _mysql_host.lower() or os.environ.get('DISABLE_DB_CONSTRAINTS', '').lower() in ('true', '1', 'yes'):
    _init_commands.append("SET foreign_key_checks=0")

_mysql_options = {
    'charset': 'utf8mb4',
    'connect_timeout': 15,
    'init_command': ', '.join(_init_commands),
}

if _mysql_ssl_ca:
    if _mysql_ssl_ca.startswith('-----BEGIN'):
        import ssl as _py_ssl
        _ctx = _py_ssl.create_default_context()
        _ctx.load_verify_locations(cadata=_mysql_ssl_ca)
        _mysql_options['ssl'] = _ctx
    else:
        _mysql_options['ssl'] = {'ca': _mysql_ssl_ca}
elif _mysql_ssl_required:
    import ssl as _py_ssl
    try:
        _mysql_options['ssl'] = _py_ssl.create_default_context()
    except Exception:
        _ca_bundle = '/etc/ssl/certs/ca-certificates.crt'
        if os.path.exists(_ca_bundle):
            _mysql_options['ssl'] = {'ca': _ca_bundle}
        else:
            _mysql_options['ssl'] = True

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
            'USER': urllib.parse.unquote(parsed.username or ''),
            'PASSWORD': urllib.parse.unquote(parsed.password or ''),
            'HOST': parsed.hostname or '',
            'PORT': str(parsed.port or '5432'),
            'CONN_MAX_AGE': 60,
        }
    }
elif _mysql_host and _mysql_password not in DISALLOWED_PASS_PLACEHOLDERS and not _use_sqlite:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': _mysql_db or 'bookbridge_db',
            'USER': _mysql_user or 'root',
            'PASSWORD': _mysql_password or '',
            'HOST': _mysql_host,
            'PORT': _mysql_port,
            'OPTIONS': _mysql_options,
            'CONN_MAX_AGE': 60,
        }
    }
else:
    # Default to SQLite for local development or when no external database is configured
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

AUTHENTICATION_BACKENDS = [
    'apps.users.backends.FlexibleAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

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
        'anon': '10000/hour' if _is_testing else '300/hour',
        'user': '10000/hour' if _is_testing else '3000/hour',
        'auth': '10000/minute' if _is_testing else '10/minute',     # Login & registration
        'ai_chat': '10000/minute' if _is_testing else '20/minute',  # AI Assistant - prevent budget exhaustion
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
# CHANNELS & REAL-TIME WEBSOCKETS (Redis / In-Memory fallback)
# ---------------------------------------------------------------------------
_redis_url = os.environ.get('REDIS_URL', '').strip() or os.environ.get('REDIS_TLS_URL', '').strip()

if _redis_url and not _is_testing:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [_redis_url],
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
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True' if _is_prod else 'False').lower() in ('true', '1')
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
        'https://book-bridge-2-5dbv.onrender.com',
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
