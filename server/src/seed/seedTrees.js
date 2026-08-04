const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const Roadmap = require('../models/Roadmap/Roadmap');
const RoadmapNode = require('../models/Roadmap/RoadmapNode');
const RoadmapResource = require('../models/Roadmap/RoadmapResource');
const RoadmapProgress = require('../models/Roadmap/RoadmapProgress'); // Ensure this model exists

async function insertNodeWithChildren(roadmapId, parentId, nodeData) {
  // Insert current node
  const newNode = await RoadmapNode.create({
    roadmapId,
    parentId,
    title: nodeData.title,
    description: nodeData.description || '',
    difficulty: nodeData.difficulty || 'Beginner',
    estimatedTime: nodeData.estimatedTime || '1-2 hours',
    interviewImportance: nodeData.interviewImportance || 'Medium',
    projectImportance: nodeData.projectImportance || 'Medium',
    branch: nodeData.branch || 'center',
    order: nodeData.order || 0
  });

  // Insert resources if any
  if (nodeData.resources && Array.isArray(nodeData.resources)) {
    for (const res of nodeData.resources) {
      await RoadmapResource.create({
        nodeId: newNode._id,
        title: res.title,
        url: res.url,
        type: res.type || 'other'
      });
    }
  }

  // Insert children recursively
  if (nodeData.children && Array.isArray(nodeData.children)) {
    for (const child of nodeData.children) {
      await insertNodeWithChildren(roadmapId, newNode._id, child);
    }
  }
}

async function seedTrees() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');

    const treesDir = path.join(__dirname, 'trees');
    const files = fs.readdirSync(treesDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(treesDir, file);
      const treeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      console.log(`Processing tree: ${treeData.title}`);

      // Delete existing roadmap and its nodes/resources
      const existingRoadmap = await Roadmap.findOne({ title: treeData.title });
      if (existingRoadmap) {
        console.log(`Removing existing roadmap: ${existingRoadmap.title}`);
        await RoadmapNode.deleteMany({ roadmapId: existingRoadmap._id });
        const nodes = await RoadmapNode.find({ roadmapId: existingRoadmap._id }, '_id').lean();
        const nodeIds = nodes.map(n => n._id);
        await RoadmapResource.deleteMany({ nodeId: { $in: nodeIds } });
        await RoadmapProgress.deleteMany({ roadmapId: existingRoadmap._id });
        await Roadmap.deleteOne({ _id: existingRoadmap._id });
      }

      // Create new Roadmap
      const newRoadmap = await Roadmap.create({
        title: treeData.title,
        description: treeData.description,
        icon: treeData.icon || 'Map',
        category: treeData.category || 'Core Programming',
        difficulty: treeData.difficulty || 'Beginner',
        estimatedDuration: treeData.estimatedDuration || '8 Weeks',
        totalTopics: treeData.totalTopics || 0,
        version: treeData.version || 1,
        source: 'CodeTrack Learning Trees'
      });

      console.log(`Created Roadmap: ${newRoadmap.title}`);

      // Insert top-level nodes
      if (treeData.nodes && Array.isArray(treeData.nodes)) {
        for (const topLevelNode of treeData.nodes) {
          await insertNodeWithChildren(newRoadmap._id, null, topLevelNode);
        }
      }
      console.log(`Finished seeding: ${treeData.title}`);
    }

    console.log('All trees seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding trees:', err);
    process.exit(1);
  }
}

seedTrees();
