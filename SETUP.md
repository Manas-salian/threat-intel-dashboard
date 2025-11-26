# Threat Intelligence Dashboard - Quick Setup

## Database Setup

The database has been automatically configured with:
- ✅ Normalized schema (3NF)
- ✅ Views: `v_global_threat_map`, `v_actor_profile`
- ✅ Sample data (8 indicators, 4 actors, 4 campaigns)

## Running the Application

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

## Features to Explore

1. **Dashboard** - Overview with charts and stats
2. **Data Explorer** - Visualize database views
3. **Threat Check** - Search for malicious indicators
4. **Light/Dark Mode** - Toggle in sidebar
5. **Admin Panel** - Backup/restore and audit logs

## Troubleshooting

If you see database errors, run:
```bash
cd backend
mysql -u root -p threat_intelligence < scripts/schema.sql
mysql -u root -p threat_intelligence < scripts/seed_data.sql
```
