const mongoose = require('mongoose');
const config = require('./env');
const { seedTemplates } = require('../services/templateSeeder');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      autoIndex: true
    });
    // Simple console log – in real apps prefer a logger
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
    
    // Seed default resume templates
    await seedTemplates();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

