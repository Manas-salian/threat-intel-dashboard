const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threat_intelligence';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch(err => console.error('✗ MongoDB connection failed:', err.message));

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = mongoose;
