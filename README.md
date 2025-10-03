# Threat Intelligence Management System

A comprehensive system for managing, correlating, and analyzing threat intelligence data from multiple sources.

## 🗂️ Project Structure

```
backend/
├── config/
│   └── database.js          # MySQL database configuration
├── controllers/
│   ├── actorController.js   # Threat actor operations
│   ├── analyticsController.js  # Analytics and reporting
│   ├── campaignController.js   # Campaign management
│   ├── correlationController.js # Cross-entity correlation
│   ├── indicatorController.js  # Indicator management
│   ├── ingestController.js     # Data ingestion
│   └── sourceController.js     # Source management
├── routes/
│   └── [entity].js          # API route definitions
├── scripts/
│   ├── schema.sql           # Database schema
│   ├── seed_data.sql        # Sample data
│   ├── analytics_queries.sql # Useful queries
│   └── ingest.js            # Ingestion script
├── services/
│   └── ingestionService.js  # Data ingestion logic
├── package.json
└── server.js                # Express server entry point
```

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🚀 Setup Instructions

### 1. Database Configuration

1. **Create the database:**
```bash
sudo mysql
```

```sql
CREATE DATABASE threat_intelligence;
exit;
```

2. **Run the schema:**
```bash
sudo mysql threat_intelligence < backend/scripts/schema.sql
```

3. **Load sample data:**
```bash
sudo mysql threat_intelligence < backend/scripts/seed_data.sql
```

4. **Update database credentials:**
Edit `backend/config/database.js` and set your MySQL credentials:
```javascript
host: 'localhost',
user: 'root',           // Your MySQL username
password: 'your_password',  // Your MySQL password
database: 'threat_intelligence'
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start the Backend Server

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Indicators
- `GET /api/indicators` - Get all indicators
- `GET /api/indicators/:id` - Get indicator by ID
- `POST /api/indicators` - Create new indicator
- `PUT /api/indicators/:id` - Update indicator
- `DELETE /api/indicators/:id` - Delete indicator
- `GET /api/indicators/type/:type` - Get indicators by type

### Threat Actors
- `GET /api/actors` - Get all threat actors
- `GET /api/actors/:id` - Get actor by ID
- `POST /api/actors` - Create new actor
- `PUT /api/actors/:id` - Update actor
- `DELETE /api/actors/:id` - Delete actor

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/active` - Get active campaigns

### Sources
- `GET /api/sources` - Get all sources
- `GET /api/sources/:id` - Get source by ID
- `POST /api/sources` - Create new source
- `PUT /api/sources/:id` - Update source
- `DELETE /api/sources/:id` - Delete source

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/indicators/timeline` - Get indicator timeline
- `GET /api/analytics/actors/activity` - Get actor activity
- `GET /api/analytics/campaigns/severity` - Get campaign severity distribution
- `GET /api/analytics/sources/reliability` - Get source reliability metrics

### Correlations
- `GET /api/correlations/indicator/:id` - Get all correlations for an indicator
- `GET /api/correlations/campaign/:id/actors` - Get actors in a campaign
- `GET /api/correlations/actor/:id/campaigns` - Get campaigns by actor
- `POST /api/correlations/link` - Link entities (indicator-actor, indicator-campaign, etc.)

### Data Ingestion
- `POST /api/ingest/indicators` - Ingest indicators in bulk
- `POST /api/ingest/external` - Ingest from external feed
- `GET /api/ingest/status` - Get ingestion status

## 🔍 Sample API Requests

### Create an Indicator
```bash
curl -X POST http://localhost:5000/api/indicators \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IPv4",
    "value": "10.0.0.1",
    "first_seen": "2025-10-03T10:00:00",
    "last_seen": "2025-10-03T12:00:00",
    "confidence_score": 0.85,
    "description": "Suspicious C2 server"
  }'
```

### Get Dashboard Analytics
```bash
curl http://localhost:5000/api/analytics/dashboard
```

### Link Indicator to Actor
```bash
curl -X POST http://localhost:5000/api/correlations/link \
  -H "Content-Type: application/json" \
  -d '{
    "indicatorId": 1,
    "actorId": 2
  }'
```

## 🔄 Data Ingestion

### Manual Ingestion
Run the ingestion script to fetch data from external sources:
```bash
node backend/scripts/ingest.js
```

### Bulk Ingestion via API
```bash
curl -X POST http://localhost:5000/api/ingest/indicators \
  -H "Content-Type: application/json" \
  -d '{
    "indicators": [
      {
        "type": "domain",
        "value": "malicious.com",
        "confidence_score": 0.90,
        "description": "Phishing domain"
      }
    ],
    "sourceId": 1
  }'
```

## 📊 Database Queries

Useful analytics queries are provided in `backend/scripts/analytics_queries.sql`. Examples:

- Find all campaigns for an indicator
- Get indicators by threat actor
- View indicator timeline
- Identify cross-campaign indicators
- Analyze MITRE ATT&CK tactic distribution

## 🔧 Configuration

### Environment Variables (Optional)
Create a `.env` file in the backend directory:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=threat_intelligence
```

Update `config/database.js` to use environment variables if needed.

## 📈 Next Steps

1. **Frontend Development**: Create a React frontend to visualize the data
2. **Real-time Feeds**: Integrate with AlienVault OTX, VirusTotal, etc.
3. **Authentication**: Add JWT-based authentication
4. **Export Features**: STIX 2.1 export capability
5. **Alerting**: Set up threshold-based alerts
6. **Visualization**: Graph-based relationship visualization

## 🛠️ Troubleshooting

### Database Connection Issues
- Ensure MySQL is running: `sudo systemctl status mysql`
- Check credentials in `config/database.js`
- Verify database exists: `sudo mysql -e "SHOW DATABASES;"`

### Port Already in Use
- Change the port in `server.js` (default: 5000)
- Or kill the process using the port: `sudo lsof -ti:5000 | xargs kill -9`

## 📝 License

MIT License
