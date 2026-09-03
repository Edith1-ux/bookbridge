# BookBridge Configuration Package
import os

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# TiDB Cloud Serverless Compatibility:
# TiDB does not support creating a column and a foreign key constraint in the same ALTER TABLE statement
# (raising MySQL Error 1072: Key column '...' doesn't exist in table).
# Setting supports_foreign_keys = False tells Django's schema editor to create the column without
# emitting physical foreign key constraints, while keeping 100% full ORM relational integrity intact.
_mysql_host = os.environ.get('MYSQL_HOST', '')
if 'tidbcloud.com' in _mysql_host.lower() or os.environ.get('DISABLE_DB_CONSTRAINTS', '').lower() in ('true', '1', 'yes'):
    try:
        from django.db.backends.mysql.features import DatabaseFeatures
        DatabaseFeatures.supports_foreign_keys = False
    except Exception:
        pass

try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    pass
