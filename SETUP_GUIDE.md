# Threat Intelligence Management System - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- npm or yarn

### 1. Database Setup

```bash
# Access MySQL
sudo mysql

# Create database
CREATE DATABASE threat_intelligence;
exit;

# Load schema
cd backend
sudo mysql threat_intelligence < scripts/schema.sql

# Load sample data
sudo mysql threat_intelligence < scripts/seed_data.sql
```

### 2. Configure Database Credentials

Edit `backend/config/database.js` or `backend/.env`:

```javascript
// backend/config/database.js
module.exports = {
  host: 'localhost',
  user: 'root',           // Your MySQL username
  password: 'your_password',  // Your MySQL password
  database: 'threat_intelligence',
  port: 3306
};
```

OR use environment variables in `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=threat_intelligence
DB_PORT=3306
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

## 📊 Features

### Dashboard
- **Real-time Statistics**: View total indicators, threat actors, campaigns, and sources
- **Recent Indicators**: High-confidence indicators with confidence scores
- **Type Distribution**: Visual breakdown of indicator types
- **Severity Analysis**: Campaign severity distribution

### Indicators Management
- ✅ View all indicators (IPs, domains, URLs, hashes, emails)
- ✅ Search and filter by type
- ✅ Add/Edit/Delete indicators
- ✅ Confidence score visualization
- ✅ First seen / Last seen tracking

### Threat Actors
- ✅ Profile threat actors and APT groups
- ✅ Track MITRE ATT&CK tactics
- ✅ Monitor first seen and last activity dates
- ✅ Detailed descriptions and TTPs

### Campaigns
- ✅ Monitor coordinated attacks
- ✅ Severity levels (Low, Medium, High, Critical)
- ✅ Track active vs completed campaigns
- ✅ Start/End date tracking

### Data Sources
- ✅ Manage threat intelligence feeds
- ✅ Configure authentication types
- ✅ Track update rates
- ✅ Enable/disable sources

### Analytics
- 📈 **Indicator Timeline**: 30-day trend of new indicators
- 📊 **Top Threat Actors**: Activity ranking by indicator count
- 🥧 **Campaign Severity**: Distribution pie chart
- 📋 **Activity Details**: Comprehensive actor analysis

### Data Ingestion
- 📤 **Bulk JSON Upload**: Import multiple indicators at once
- 🔄 **Source Attribution**: Link indicators to specific feeds
- ✅ **Validation**: Real-time JSON validation
- 📝 **Sample Data**: Pre-filled examples for testing

## 🎨 Tech Stack

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Recharts**: Data visualization
- **Lucide React**: Icon library

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MySQL2**: Database driver
- **dotenv**: Environment configuration
- **CORS**: Cross-origin resource sharing

## 📁 Project Structure

```
dbmsproject/
├── backend/
│   ├── config/
│   │   └── database.js           # DB configuration
│   ├── controllers/
│   │   ├── indicatorController.js
│   │   ├── actorController.js
│   │   ├── campaignController.js
│   │   ├── sourceController.js
│   │   ├── analyticsController.js
│   │   ├── correlationController.js
│   │   └── ingestController.js
│   ├── routes/
│   │   └── *.js                  # API routes
│   ├── scripts/
│   │   ├── schema.sql            # Database schema
│   │   ├── seed_data.sql         # Sample data
│   │   └── analytics_queries.sql # Useful queries
│   ├── services/
│   │   └── ingestionService.js
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Entry point
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Indicators.jsx
    │   │   ├── ThreatActors.jsx
    │   │   ├── Campaigns.jsx
    │   │   ├── Sources.jsx
    │   │   ├── Analytics.jsx
    │   │   └── Ingestion.jsx
    │   ├── services/
    │   │   └── api.js            # API client
    │   ├── App.jsx               # Main component
    │   ├── App.css               # Styles
    │   ├── index.css             # Global styles
    │   └── main.jsx              # Entry point
    ├── package.json
    └── vite.config.js
```

## 🔌 API Endpoints

### Indicators
```
GET    /api/indicators              - Get all indicators
GET    /api/indicators/:id          - Get by ID
GET    /api/indicators/type/:type   - Get by type
POST   /api/indicators              - Create new
PUT    /api/indicators/:id          - Update
DELETE /api/indicators/:id          - Delete
```

### Threat Actors
```
GET    /api/actors                  - Get all actors
GET    /api/actors/:id              - Get by ID
POST   /api/actors                  - Create new
PUT    /api/actors/:id              - Update
DELETE /api/actors/:id              - Delete
```

### Campaigns
```
GET    /api/campaigns               - Get all campaigns
GET    /api/campaigns/:id           - Get by ID
GET    /api/campaigns/active        - Get active only
POST   /api/campaigns               - Create new
PUT    /api/campaigns/:id           - Update
DELETE /api/campaigns/:id           - Delete
```

### Sources
```
GET    /api/sources                 - Get all sources
POST   /api/sources                 - Create new
PUT    /api/sources/:id             - Update
DELETE /api/sources/:id             - Delete
```

### Analytics
```
GET    /api/analytics/dashboard              - Dashboard stats
GET    /api/analytics/indicators/timeline    - Timeline data
GET    /api/analytics/actors/activity        - Actor activity
GET    /api/analytics/campaigns/severity     - Severity distribution
GET    /api/analytics/sources/reliability    - Source metrics
```

### Correlations
```
GET    /api/correlations/indicator/:id       - Indicator correlations
GET    /api/correlations/campaign/:id/actors - Campaign actors
GET    /api/correlations/actor/:id/campaigns - Actor campaigns
POST   /api/correlations/link                - Link entities
```

### Ingestion
```
POST   /api/ingest/indicators       - Bulk ingest
POST   /api/ingest/external         - External feed
GET    /api/ingest/status           - Ingestion status
```

## 🧪 Testing the Application

### 1. Access the Frontend
Open http://localhost:5173 in your browser

### 2. Test API with curl
```bash
# Get all indicators
curl http://localhost:5000/api/indicators

# Get dashboard stats
curl http://localhost:5000/api/analytics/dashboard

# Create an indicator
curl -X POST http://localhost:5000/api/indicators \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IPv4",
    "value": "10.0.0.1",
    "first_seen": "2025-10-03",
    "last_seen": "2025-10-03",
    "confidence_score": 0.85,
    "description": "Test indicator"
  }'
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
sudo mysql -u root -p

# Verify database exists
SHOW DATABASES;
USE threat_intelligence;
SHOW TABLES;
```

### Port Already in Use
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change port in backend/server.js
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📝 Sample Data Included

The `seed_data.sql` includes:
- **6 Data Sources**: AlienVault, VirusTotal, AbuseIPDB, MISP, Abuse.ch, EmergingThreats
- **5 Threat Actors**: TA542, APT28, Lazarus, APT29, FIN7
- **6 Campaigns**: Including Operation Nightshade, SolarWinds, WannaCry
- **20 Indicators**: IPs, domains, hashes, URLs, emails
- **Correlations**: Pre-linked relationships between entities

## 🔐 Security Notes

- Change default database passwords
- Add authentication/authorization in production
- Use HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Use environment variables for sensitive data

## 🚀 Next Steps

1. **Authentication**: Add JWT-based authentication
2. **Real-time Feeds**: Integrate AlienVault OTX API
3. **Export**: STIX 2.1 format export
4. **Alerting**: Email/Slack notifications
5. **Graph Visualization**: D3.js relationship graphs
6. **Advanced Search**: Elasticsearch integration
7. **Docker**: Containerize the application

## 📄 License

MIT License

## 👥 Support

For issues or questions, check the backend logs and ensure:
- MySQL is running
- Database credentials are correct
- All dependencies are installed
- Ports 5000 and 5173 are available
