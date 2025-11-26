# Analytics Severity Column Fix

## Issue
Analytics page was throwing error: **"Unknown column 'severity' in 'field list'"**

## Root Cause
The `campaigns` table uses a normalized schema with:
- `severity_id` (INT) - Foreign key to `severities` table
- NOT a direct `severity` column

But analytics queries were trying to access `campaigns.severity` directly instead of joining with the `severities` table.

## Files Fixed

### 1. `/backend/controllers/analyticsController.js`
Fixed all queries to use proper JOINs:

- ✅ `getDashboard()` - Critical campaigns count
- ✅ `getDashboard()` - Indicator types distribution  
- ✅ `getDashboard()` - Campaign severity distribution
- ✅ `getTypeDistribution()` - Indicator types with JOIN
- ✅ `getCampaignTimeline()` - Added severity JOIN
- ✅ `getSeverityDistribution()` - Fixed severity query
- ✅ `getActorTrends()` - Fixed last_activity alias

### 2. `/backend/routes/dashboard_advanced.js`
Fixed all queries:

- ✅ Indicator types - JOIN with `indicator_types`
- ✅ Recent indicators - JOIN with `indicator_types`
- ✅ Campaign severity distribution - JOIN with `severities`
- ✅ Audit logs - JOIN with `indicator_types`

## Changes Summary

### Before (BROKEN):
```sql
SELECT severity, COUNT(*) as count 
FROM campaigns 
GROUP BY severity
```

### After (FIXED):
```sql
SELECT s.level as severity, COUNT(*) as count 
FROM campaigns c
JOIN severities s ON c.severity_id = s.severity_id
GROUP BY s.level
```

### Indicator Types Fix

**Before:**
```sql
SELECT type, COUNT(*) as count FROM indicators
```

**After:**
```sql
SELECT it.name as type, COUNT(*) as count 
FROM indicators i
JOIN indicator_types it ON i.type_id = it.type_id
```

## All Fixed Queries

1. **Critical Campaigns Count**
   - Join: `campaigns c JOIN severities s`
   - Where: `s.level = 'critical'`

2. **Indicator Type Distribution**
   - Join: `indicators i JOIN indicator_types it`
   - Group by: `it.name`

3. **Campaign Severity Distribution**
   - Join: `campaigns c JOIN severities s`
   - Group by: `s.level`
   - Order: Critical → High → Medium → Low

4. **Campaign Timeline**
   - Join: `campaigns c LEFT JOIN severities s`
   - Returns: `s.level as severity`

5. **Recent Indicators**
   - Join: `indicators i JOIN indicator_types it`
   - Returns: `it.name as type`

6. **Audit Logs**
   - Join: `indicators i JOIN indicator_types it`
   - Concat: `it.name` for description

## Status
✅ All queries fixed
✅ Backend server restarted
✅ Analytics page should now load without errors

## Test
1. Open Analytics page in browser
2. Should see:
   - Dashboard stats loading
   - Indicator timeline chart
   - Campaign severity distribution
   - Actor activity chart
   - Source reliability data

No more "Unknown column 'severity'" errors!
