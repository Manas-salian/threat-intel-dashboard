const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Connect to MongoDB
require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/indicators', require('./routes/indicators'));
app.use('/api/actors', require('./routes/actors'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/correlations', require('./routes/correlations'));
app.use('/api/ingest', require('./routes/ingest'));
app.use('/api/tools', require('./routes/tools'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
