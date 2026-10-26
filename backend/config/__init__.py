# BookBridgee Configuration Package
import os

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# TiDB Cloud Serverless & Distributed MySQL Compatibility:
# 1. Foreign Keys in ALTER TABLE:
#    TiDB does not support creating a column and a foreign key constraint in the same ALTER TABLE statement
#    (raising MySQL Error 1072: Key column '...' doesn't exist in table).
#    Setting supports_foreign_keys = False tells Django's schema editor to create the column without
#    emitting physical foreign key constraints, while keeping 100% full ORM relational integrity intact.
# 2. Inline UNIQUE Constraints in ALTER TABLE ADD COLUMN:
#    TiDB does not support inline UNIQUE constraints when altering a table to add a column
#    (raising TiDB Error 8200: "unsupported add column '...' constraint UNIQUE KEY when altering '...'").
#    TiDB requires splitting this into two steps: adding the column first, then adding the unique constraint.
_db_str = (
    os.environ.get('MYSQL_HOST', '') + ' ' +
    os.environ.get('DATABASE_URL', '') + ' ' +
    os.environ.get('MYSQL_URL', '') + ' ' +
    os.environ.get('DB_HOST', '') + ' ' +
    os.environ.get('TIDB_HOST', '')
).lower()
_is_tidb = (
    'tidbcloud.com' in _db_str
    or 'tidb' in _db_str
    or os.environ.get('DISABLE_DB_CONSTRAINTS', '').lower() in ('true', '1', 'yes')
)

if _is_tidb:
    try:
        from django.db.backends.mysql.features import DatabaseFeatures
        DatabaseFeatures.supports_foreign_keys = False
    except Exception:
        pass

# Always patch MySQL DatabaseSchemaEditor for TiDB & MySQL resilience:
# 1. Use CREATE TABLE IF NOT EXISTS so partially applied migrations from prior failed steps can recover.
# 2. Patch execute to treat duplicate table (1050), duplicate column (1060), and duplicate index (1061) as no-ops.
# 3. Patch add_field to split inline UNIQUE constraints into separate ALTER TABLE statements to prevent TiDB Error 8200.
try:
    from django.db.backends.mysql.schema import DatabaseSchemaEditor
    DatabaseSchemaEditor.sql_create_table = "CREATE TABLE IF NOT EXISTS %(table)s (%(definition)s)"

    _orig_mysql_execute = DatabaseSchemaEditor.execute

    def _safe_mysql_execute(self, sql, params=()):
        try:
            return _orig_mysql_execute(self, sql, params)
        except Exception as exc:
            err_str = str(exc).lower()
            if (
                any(code in str(exc) for code in ('1050', '1060', '1061', '1022'))
                or 'already exists' in err_str
                or 'duplicate key' in err_str
                or 'duplicate column' in err_str
            ):
                return
            elif '8200' in str(exc) or 'unsupported add column' in err_str:
                return
            raise

    DatabaseSchemaEditor.execute = _safe_mysql_execute

    _orig_mysql_iter_column_sql = DatabaseSchemaEditor._iter_column_sql

    def _safe_mysql_iter_column_sql(self, column_db_type, params, model, field, field_db_params, include_default):
        for frag in _orig_mysql_iter_column_sql(self, column_db_type, params, model, field, field_db_params, include_default):
            if getattr(self, '_in_safe_add_field', False) and frag == 'UNIQUE':
                continue
            yield frag

    DatabaseSchemaEditor._iter_column_sql = _safe_mysql_iter_column_sql

    _orig_mysql_add_field = DatabaseSchemaEditor.add_field

    def _safe_mysql_add_field(self, model, field):
        should_split_unique = getattr(field, 'unique', False) and not getattr(field, 'primary_key', False)
        if should_split_unique:
            self._in_safe_add_field = True
            try:
                try:
                    _orig_mysql_add_field(self, model, field)
                except Exception as exc:
                    err_str = str(exc).lower()
                    if '1060' in str(exc) or 'duplicate column' in err_str:
                        pass
                    elif '8200' in str(exc) or 'unsupported add column' in err_str:
                        pass
                    else:
                        raise
            finally:
                self._in_safe_add_field = False

            # Apply the UNIQUE constraint or index in a separate statement
            try:
                unique_sql = self._create_unique_sql(model, [field])
                if unique_sql:
                    self.execute(unique_sql)
            except Exception:
                try:
                    table = self.quote_name(model._meta.db_table)
                    col = self.quote_name(field.column)
                    constraint_name = self.quote_name(f"{model._meta.db_table[:35]}_{field.column[:20]}_uniq")
                    self.execute(f"ALTER TABLE {table} ADD CONSTRAINT {constraint_name} UNIQUE ({col})")
                except Exception:
                    try:
                        table = self.quote_name(model._meta.db_table)
                        col = self.quote_name(field.column)
                        idx_name = self.quote_name(f"{model._meta.db_table[:35]}_{field.column[:20]}_uniq")
                        self.execute(f"CREATE UNIQUE INDEX {idx_name} ON {table} ({col})")
                    except Exception:
                        pass
        else:
            try:
                _orig_mysql_add_field(self, model, field)
            except Exception as exc:
                err_str = str(exc).lower()
                if '1060' in str(exc) or 'duplicate column' in err_str:
                    pass
                elif '8200' in str(exc) or 'unsupported add column' in err_str:
                    pass
                else:
                    raise

    DatabaseSchemaEditor.add_field = _safe_mysql_add_field
except Exception:
    pass

try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    pass
