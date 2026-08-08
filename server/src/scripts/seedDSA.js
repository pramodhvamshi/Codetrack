require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const DSASheet = require('../models/DSA/DSASheet');
const DSACategory = require('../models/DSA/DSACategory');
const DSAProblem = require('../models/DSA/DSAProblem');
const config = require('../config/env');

const seedDSASheets = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clean all existing sheets to avoid duplicates
    await DSAProblem.deleteMany({});
    await DSACategory.deleteMany({});
    await DSASheet.deleteMany({});
    console.log('Cleared existing DSA sheets, categories, and problems.');

    const seedDir = path.join(__dirname, '..', 'seed', 'dsa');
    if (!fs.existsSync(seedDir)) {
      console.error('Seed directory not found:', seedDir);
      process.exit(1);
    }

    const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      console.log(`Processing DSA seed file: ${file}`);
      const filePath = path.join(seedDir, file);
      const sheetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Create new sheet
      const sheet = await DSASheet.create({
        title: sheetData.title,
        description: sheetData.description || '',
        version: sheetData.version || 1,
        source: sheetData.source || 'striver',
        sourceVersion: sheetData.sourceVersion || '2026-08',
        sourceUrl: sheetData.sourceUrl || ''
      });

      // Create Categories & Problems
      for (const catData of sheetData.categories) {
        const category = await DSACategory.create({
          sheetId: sheet._id,
          title: catData.title,
          order: catData.order || 0
        });

        const problemsToInsert = catData.problems.map((prob) => ({
          categoryId: category._id,
          title: prob.title,
          difficulty: prob.difficulty || 'Medium',
          leetcodeUrl: prob.leetcodeUrl || '',
          order: prob.order || 0,
          resources: prob.resources || []
        }));

        await DSAProblem.insertMany(problemsToInsert);
      }
      console.log(`Successfully seeded DSA Sheet: ${sheetData.title} with ${sheetData.categories.length} categories.`);
    }

    console.log('Successfully completed all DSA seed operations.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDSASheets();
