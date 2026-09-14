# BookBridgee Enterprise: Backup, Disaster Recovery, Monitoring & Incident Runbook

This document serves as the operational handbook for the production deployment of BookBridgee on **Render (Daphne ASGI + Python 3.11)** with **MySQL** as the primary datastore and **Redis** for channels/caching.

---

## 1. Production Architecture Overview

```text
                                  +-----------------------+
                                  |     Clients / Web     |
                                  +-----------------------+
                                              |
                                              | HTTPS / WSS
                                              v
                              +-------------------------------+
                              |    Render Reverse Proxy       |
                              |  (SSL Termination & LB)       |
                              +-------------------------------+
                                              |
                                              | Forwarded Proto
                                              v
                              +-------------------------------+
                              |   Daphne ASGI Web Server      |
                              |     (Python 3.11 Engine)      |
                              +-------------------------------+
                                      /               \
                                     /                 \
                                    v                   v
                     +--------------------+     +-------------------+
                     | Django REST API    |     |  Django Channels  |
                     |  (HTTP Handlers)   |     |   (WebSockets)    |
                     +--------------------+     +-------------------+
                               |                         |
                               v                         v
                     +--------------------+     +-------------------+
                     |  MySQL 8.0 Primary |     |   Redis Cloud     |
                     | (Single Data Truth)|     | (Cache & PubSub)  |
                     +--------------------+     +-------------------+
```

---

## 2. MySQL Backup Strategy

### A. Automated Provider-Managed Backups (Render Managed MySQL)
* **Snapshot Frequency:** Automated daily snapshots at 00:00 UTC.
* **Point-in-Time Recovery (PITR):** Available through Write-Ahead Log (WAL) streaming for up to 7 days on production tiers.
* **Retention Policy:** 7-day rolling window for daily snapshots; 30-day monthly retainers for audit compliance.

### B. Off-Site Logical Backups (`mysqldump` Procedure)
To perform an independent encrypted off-site backup:

```bash
# 1. Export database with single-transaction consistency
mysqldump --single-transaction --quick --routines --triggers \
  -h "${MYSQL_HOST}" -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" \
  "${MYSQL_DATABASE}" | gzip -c > "bookbridge_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# 2. Verify file non-zero size
ls -lh bookbridge_backup_*.sql.gz
```

---

## 3. Database Restore & Verification Runbook

> [!CAUTION]
> NEVER execute a restore directly over the active production database without prior isolation verification.

### Step-by-Step Restoration Verification:
1. **Provision Temporary/Staging DB:** Create an isolated database schema `bookbridge_restore_verify`.
2. **Execute Database Ingestion:**
   ```bash
   gunzip -c bookbridge_backup_YYYYMMDD_HHMMSS.sql.gz | mysql \
     -h "${MYSQL_HOST}" -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" bookbridge_restore_verify
   ```
3. **Verify Table & Record Count Integrity:**
   ```sql
   SELECT table_name, table_rows 
   FROM information_schema.tables 
   WHERE table_schema = 'bookbridge_restore_verify';
   ```
4. **Execute Django Schema Health Check:**
   ```bash
   DATABASE_URL="mysql://user:pass@host:3306/bookbridge_restore_verify" python backend/manage.py migrate --check
   ```
5. **Clean Up Verification Schema:**
   ```sql
   DROP DATABASE bookbridge_restore_verify;
   ```

---

## 4. Deployment Rollback & Disaster Recovery Runbook

### Scenario 1: Bad Deployment / Startup Crash
1. **Identify Failure:** Render logs output `Health check failed on /api/health/`.
2. **Immediate Rollback:** In the Render dashboard:
   - Navigate to **Deploys**.
   - Click on the previous **Successful Deploy** hash.
   - Select **Rollback to this deploy**.
3. **Traffic Reroute:** Render proxy immediately routes incoming HTTPS/WSS traffic to the prior stable container.

### Scenario 2: Failed Migration Rollback
1. If a migration fails halfway:
   ```bash
   # Identify unapplied migration step
   python backend/manage.py showmigrations
   
   # Roll back to the preceding migration
   python backend/manage.py migrate <app_name> <previous_migration_name>
   ```

### Scenario 3: Database Temporary Outage
* The application responds with HTTP 503 (`status: degraded`) on health probes without dumping Python tracebacks or secrets.
* Once MySQL reconnects, connection pool (`CONN_MAX_AGE=600`) reconnects automatically without requiring a full container restart.

---

## 5. Production Monitoring & Alerting Matrix

| Component | Metric / Event | Severity | Alert Condition | Action Required |
|---|---|---|---|---|
| **API Engine** | HTTP 500 Spike | CRITICAL | >5% of total requests over 2 mins | Check Render logs for unhandled exceptions |
| **Health Check** | `/api/health/` | HIGH | Fails 3 consecutive 15s probes | Trigger auto-restart or inspect DB link |
| **Database** | Connection Timeout | HIGH | `connect_timeout` exceeded (10s) | Verify MySQL load & connection limits |
| **Redis** | WebSocket Dropped | MEDIUM | Ping/Pong heartbeat missed | Channels fallback to reconnect with backoff |
| **Storage** | Upload Disk Usage | MEDIUM | >85% quota | Run media cleanup & static check |

---

## 6. Production Smoke Test Verification Checklist

Before releasing any production deployment, execute the following smoke verification sequence:

- [ ] **GET `/api/health/`** $\longrightarrow$ Returns `HTTP 200` with `{"status": "healthy", "database_connected": true}`.
- [ ] **GET `/api/health/liveness/`** $\longrightarrow$ Returns `HTTP 200` with `{"status": "alive"}`.
- [ ] **GET `/api/health/readiness/`** $\longrightarrow$ Returns `HTTP 200` with `{"status": "ready"}`.
- [ ] **POST `/api/login/`** $\longrightarrow$ Authenticates admin (`admin@bookbridge.edu`) and returns JWT access + refresh tokens.
- [ ] **GET `/api/profile/`** $\longrightarrow$ Returns authenticated user details with `HTTP 200`.
- [ ] **GET `/api/books/`** $\longrightarrow$ Returns paginated book catalog.
- [ ] **GET `/api/admin/stats/`** $\longrightarrow$ Returns single-pass aggregated metrics.
- [ ] **WebSocket `/ws/chat/`** $\longrightarrow$ Connects successfully with valid JWT query/header and completes handshake.
