"""
Django settings for config project.
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


# ============================================================
# BASE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# SECURITY
# ============================================================

_INSECURE_SECRET_KEY = "django-insecure-local-development-key-change-this"

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _INSECURE_SECRET_KEY)

DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

if not DEBUG and SECRET_KEY == _INSECURE_SECRET_KEY:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set to a real secret when DEBUG=False. "
        "Refusing to start with the insecure default in production."
    )

if not DEBUG:
    # Render (y la mayoría de PaaS) terminan TLS en un proxy y reenvían
    # tráfico plano a la app; sin esto Django cree que la conexión es HTTP.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "[::1]",
    "hslnzw92-8000.use.devtunnels.ms",
]

# Render proporciona automáticamente esta variable
if os.environ.get("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(
        os.environ["RENDER_EXTERNAL_HOSTNAME"]
    )


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Daphne / Channels
    "daphne",

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "cloudinary_storage",
    "django.contrib.staticfiles",
    "cloudinary",

    # Third party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "channels",

    # Local apps
    "accounts",
    "chat",
]


# Custom user model
AUTH_USER_MODEL = "accounts.User"


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # Static files
    "whitenoise.middleware.WhiteNoiseMiddleware",

    # CORS
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URLS
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI / ASGI
# ============================================================

WSGI_APPLICATION = "config.wsgi.application"

ASGI_APPLICATION = "config.asgi.application"


# ============================================================
# DJANGO CHANNELS
# ============================================================

# Local/single-process: in-memory layer (default, no extra infra needed).
# Production with multiple workers: set REDIS_URL so events reach users
# connected to a different worker process.
REDIS_URL = os.environ.get("REDIS_URL")

if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }


# ============================================================
# DATABASE
# ============================================================

# Local:
#     SQLite -> db.sqlite3
#
# Production:
#     PostgreSQL -> DATABASE_URL
#
# Render/Supabase/etc. pueden proporcionar DATABASE_URL.

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
        "OPTIONS": {
            "min_length": 6,
        },
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.environ.get("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.environ.get("CLOUDINARY_API_KEY"),
    "API_SECRET": os.environ.get("CLOUDINARY_API_SECRET"),
}

STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "config.staticfiles_storage.LenientManifestStaticFilesStorage",
    },
}


# ============================================================
# UPLOAD LIMITS
# ============================================================

MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024  # 25MB

ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml",
    # Audio (voice messages)
    "audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-m4a",
    # Common documents
    "application/pdf", "text/plain", "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB

ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
}


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# EMAIL
# ============================================================

# Development:
# Password reset emails are printed in the console.

EMAIL_BACKEND = (
    "django.core.mail.backends.console.EmailBackend"
)

DEFAULT_FROM_EMAIL = "Loop <no-reply@loop.chat>"


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/min",
        "user": "300/min",
        "auth": "10/min",
    },

    "DATETIME_FORMAT": "iso-8601",
}


# ============================================================
# SIMPLE JWT
# ============================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),

    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "UPDATE_LAST_LOGIN": True,

    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ============================================================
# CORS
# ============================================================

# Development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://woven-zen-deny.ngrok-free.dev",
]

# Production: en Render, define EXTRA_ALLOWED_ORIGINS con la(s) URL(s) de
# Netlify separadas por comas (ej. "https://tu-proyecto.netlify.app") sin
# tener que tocar este archivo.
_extra_origins = [
    origin.strip()
    for origin in os.environ.get("EXTRA_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CORS_ALLOWED_ORIGINS += _extra_origins

CORS_ALLOW_CREDENTIALS = True


# ============================================================
# CSRF
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    "https://woven-zen-deny.ngrok-free.dev",
    "https://hslnzw92-8000.use.devtunnels.ms",
] + _extra_origins


# ============================================================
# FRONTEND ORIGINS
# ============================================================

FRONTEND_ORIGINS = CORS_ALLOWED_ORIGINS