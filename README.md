# Threat Intelligence Dashboard

A comprehensive system for managing, correlating, and analyzing threat intelligence data from multiple sources. Built with Express.js, MongoDB, and React.

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB/Mongoose connection
├── models/
│   ├── Indicator.js          # Indicator schema
│   ├── ThreatActor.js        # Threat actor schema
│   ├── Campaign.js           # Campaign schema
│   ├── Source.js              # Data source schema
│   └── AuditLog.js           # Audit log schema
├── controllers/
│   ├── indicatorController.js
│   ├── actorController.js
│   ├── analyticsController.js
│   ├── campaignController.js
│   ├── correlationController.js
│   ├── ingestController.js
│   └── sourceController.js
├── routes/
│   ├── indicators.js
│   ├── actors.js
│   ├── analytics.js
│   ├── campaigns.js
│   ├── correlations.js
│   ├── ingest.js
│   ├── sources.js
│   └── tools.js
├── services/
│   └── ingestionService.js   # AlienVault, AbuseIPDB, VirusTotal ingestion
├── scripts/
│   └── seed.js               # Database seed script
├── package.json
└── server.js

frontend/
├── src/
│   ├── pages/                # React page components
│   ├── services/api.js       # API client
│   ├── context/              # React context (theme)
│   ├── App.jsx               # Router + layout
│   └── main.jsx              # Entry point
├── package.json
└── vite.config.js
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm

## Setup (Linux / macOS)

### 1. Start MongoDB
```bash
# If using systemd
sudo systemctl start mongod

# Or if using mongosh
mongosh
```

### 2. Install & Run Backend
```bash
cd backend
cp .env.example .env    # Edit with your settings
npm install
node scripts/seed.js    # Load sample data
npm start               # Starts on http://localhost:5000
```

### 3. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev             # Starts Vite dev server
```

## Setup (Windows)

### 1. Install MongoDB
1. Download the MongoDB Community Server MSI installer from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer — select **Complete** setup and check **Install MongoDB as a Service**
3. Optionally install MongoDB Compass (GUI) when prompted
4. MongoDB will start automatically as a Windows service. To verify:
```powershell
# Check service status
Get-Service MongoDB

# Or start manually if needed
net start MongoDB
```

### 2. Install & Run Backend
```powershell
cd backend
copy .env.example .env      # Edit with your settings (use notepad .env)
npm install
node scripts/seed.js        # Load sample data
npm start                   # Starts on http://localhost:5000
```

### 3. Install & Run Frontend
```powershell
cd frontend
npm install
npm run dev                 # Starts Vite dev server
```

> **Note:** If you installed MongoDB with a custom path or authentication, update `MONGODB_URI` in `backend/.env` accordingly (e.g., `mongodb://user:pass@localhost:27017/threat_intelligence`).

## API Endpoints

### Indicators
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/indicators` | List all (pagination: `?page=1&limit=50&type=IPv4&search=...`) |
| GET | `/api/indicators/:id` | Get by ID (populated with sources/actors/campaigns) |
| POST | `/api/indicators` | Create new |
| PUT | `/api/indicators/:id` | Update |
| DELETE | `/api/indicators/:id` | Delete |
| POST | `/api/indicators/bulk` | Bulk ingest |

### Threat Actors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/actors` | List all |
| GET | `/api/actors/:id` | Get by ID |
| POST | `/api/actors` | Create |
| PUT | `/api/actors/:id` | Update |
| DELETE | `/api/actors/:id` | Delete |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List all |
| GET | `/api/campaigns/active` | Active campaigns |
| GET | `/api/campaigns/severity/:severity` | Filter by severity |
| POST | `/api/campaigns` | Create |
| PUT | `/api/campaigns/:id` | Update |
| DELETE | `/api/campaigns/:id` | Delete |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard overview stats |
| GET | `/api/analytics/indicators/timeline` | Indicator trends |
| GET | `/api/analytics/actors/activity` | Actor activity |
| GET | `/api/analytics/campaigns/severity` | Severity distribution |
| GET | `/api/analytics/sources/reliability` | Source reliability |
| GET | `/api/analytics/top-actors` | Top actors by indicator count |
| GET | `/api/analytics/audit-logs` | Audit logs |

### Ingestion
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest/run` | Run all ingestion sources |
| POST | `/api/ingest/run/:source` | Run specific source (`alienvault`, `abuseipdb`, `virustotal`) |
| GET | `/api/ingest/status` | Ingestion status |

### Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tools/check` | Check if an indicator exists in the database |

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/threat_intelligence
PORT=5000
NODE_ENV=development

ALIENVAULT_API_KEY=your_key_here
ABUSEIPDB_API_KEY=your_key_here
VIRUSTOTAL_API_KEY=your_key_here

MAX_INDICATORS_PER_FEED=1000
```

## License

MIT License
