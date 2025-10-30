# Database Performance Optimization Guide

## ✅ Already Applied Optimizations

1. **Database Indexes Added:**
   - Service model: `category`, `isActive`, `(category, isActive)` composite index
   - Query optimization using `select` statements (fetch only needed fields)

2. **Connection Pooling:**
   - Optimized Prisma connection pool settings for VPS
   - Connection limit: 20
   - Pool timeout: 20s

3. **Frontend Timeout:**
   - Increased from 10s to 30s

## 🚀 Additional VPS Optimizations

### 1. PostgreSQL Configuration (on VPS)

Add to PostgreSQL config (`/etc/postgresql/14/main/postgresql.conf` or your version):

```conf
# Connection Settings
max_connections = 100
shared_buffers = 2GB              # 25% of RAM (adjust for 8GB RAM)
effective_cache_size = 6GB        # 75% of RAM
work_mem = 16MB                   # For sorting/hashing
maintenance_work_mem = 512MB       # For VACUUM, CREATE INDEX

# Query Planner
random_page_cost = 1.1            # For SSD
effective_io_concurrency = 200    # For SSD

# WAL Settings
wal_buffers = 16MB
default_statistics_target = 100

# Performance
checkpoint_completion_target = 0.9
```

**Apply changes:**
```bash
sudo systemctl restart postgresql
```

### 2. Add Database Indexes (Critical Queries)

Run these migrations for commonly queried fields:

```sql
-- Visit indexes for fast queue queries
CREATE INDEX IF NOT EXISTS idx_visit_status_created ON "Visit"(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_visit_patient_status ON "Visit"("patientId", status);
CREATE INDEX IF NOT EXISTS idx_visit_doctor_status ON "Visit"("suggestedDoctorId", status);

-- Lab/Radiology order indexes
CREATE INDEX IF NOT EXISTS idx_lab_order_status ON "LabOrder"(status, "visitId");
CREATE INDEX IF NOT EXISTS idx_radiology_order_status ON "RadiologyOrder"(status, "visitId");

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_billing_status_created ON "Billing"(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_billing_patient_status ON "Billing"("patientId", status);

-- Medication order indexes
CREATE INDEX IF NOT EXISTS idx_med_order_status ON "MedicationOrder"(status, "visitId");
```

**Or create migration:**
```bash
cd backend
npx prisma migrate dev --name add_performance_indexes
```

### 3. Prisma Query Optimization

Already optimized:
- ✅ Service queries use `select` (only needed fields)
- ✅ Visit queries use `select` for patient data

**Monitor slow queries:**
```bash
# On VPS, enable PostgreSQL query logging
# In postgresql.conf:
log_min_duration_statement = 1000  # Log queries > 1 second
```

### 4. Connection Pooling (Already Applied)

Prisma is configured with:
- Connection limit: 20
- Pool timeout: 20s
- Connect timeout: 10s

### 5. Query Result Limits

For endpoints that might return large datasets, add limits:

```javascript
// Example: Limit services query
const services = await prisma.service.findMany({
  where: whereClause,
  orderBy: { name: 'asc' },
  take: 1000, // Maximum limit
  select: { /* fields */ }
});
```

### 6. Database Maintenance

Run periodically (weekly):

```bash
# Analyze tables for better query planning
psql -d medical_clinic -c "ANALYZE;"

# Vacuum to reclaim space and update statistics
psql -d medical_clinic -c "VACUUM ANALYZE;"
```

### 7. Nginx Caching (Optional)

Cache API responses that don't change often:

```nginx
location /api/admin/services {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://127.0.0.1:5000;
}
```

## 📊 Performance Monitoring

**Check slow queries:**
```sql
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Check index usage:**
```sql
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

## ⚡ Quick Wins

1. **Indexes** - Biggest impact (already started with Service model)
2. **Connection pooling** - Already optimized
3. **Select statements** - Only fetch needed fields (applied)
4. **Query limits** - Add `take` to large queries
5. **PostgreSQL tuning** - Adjust `postgresql.conf` settings


