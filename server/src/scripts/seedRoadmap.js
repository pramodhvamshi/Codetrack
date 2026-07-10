require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap/Roadmap');
const RoadmapNode = require('../models/Roadmap/RoadmapNode');
const RoadmapResource = require('../models/Roadmap/RoadmapResource');
const RoadmapEdge = require('../models/Roadmap/RoadmapEdge');
const config = require('../config/env');

const seedRoadmaps = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const seedDir = path.join(__dirname, '..', 'seed', 'roadmaps');
    if (!fs.existsSync(seedDir)) {
      console.error('Seed directory not found:', seedDir);
      process.exit(1);
    }

    // Clean up obsolete mock files to prevent overwriting scraped roadmaps
    const obsoleteFiles = [
      path.join(seedDir, 'frontend_developer.json'),
      path.join(seedDir, 'backend_developer.json'),
      path.join(seedDir, 'ai_engineer.json')
    ];
    obsoleteFiles.forEach(f => {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`Deleted obsolete mock file: ${path.basename(f)}`);
      }
    });

    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      console.log(`Processing Roadmap seed file: ${file}`);
      const filePath = path.join(seedDir, file);
      const roadmapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Remove existing roadmap of this title and version (implements versioning)
      const existingRoadmap = await Roadmap.findOne({ 
        title: roadmapData.title, 
        version: roadmapData.version || 1 
      });

      if (existingRoadmap) {
        // Clear nodes, edges, and resources linked to this roadmap version
        const nodes = await RoadmapNode.find({ roadmapId: existingRoadmap._id });
        const nodeIds = nodes.map(n => n._id);
        await RoadmapResource.deleteMany({ nodeId: { $in: nodeIds } });
        await RoadmapEdge.deleteMany({ roadmapId: existingRoadmap._id });
        await RoadmapNode.deleteMany({ roadmapId: existingRoadmap._id });
        await Roadmap.deleteOne({ _id: existingRoadmap._id });
        console.log(`Cleared existing version of roadmap: ${roadmapData.title} v${roadmapData.version || 1}`);
      }

      // Create new Roadmap
      const roadmap = await Roadmap.create({
        title: roadmapData.title,
        description: roadmapData.description || '',
        icon: roadmapData.icon || 'Map',
        version: roadmapData.version || 1,
        source: roadmapData.source || 'roadmap.sh',
        sourceVersion: roadmapData.sourceVersion || '2026-07'
      });

      // Shift coordinate system so all coordinates are strictly positive
      const allX = roadmapData.nodes.map(n => n.x || 0);
      const allY = roadmapData.nodes.map(n => n.y || 0);
      
      const minX = allX.length > 0 ? Math.min(...allX) : 0;
      const minY = allY.length > 0 ? Math.min(...allY) : 0;
      
      // Shift so the minimum node aligns at padding offset (e.g. (80, 80))
      const padding = 80;
      const xOffset = minX < 0 ? -minX + padding : padding;
      const yOffset = minY < 0 ? -minY + padding : padding;

      console.log(`Normalizing layout bounds for ${roadmapData.title}: Offset x: ${xOffset}, y: ${yOffset}`);

      // Map node string id to Mongoose Node objects
      const idMap = new Map();
      let queue = [...roadmapData.nodes];
      let passes = 0;
      
      // Resolve tree levels (roots first, then children)
      while (queue.length > 0 && passes < 10) {
        const nextQueue = [];
        for (const nodeData of queue) {
          // If node is root or parent is already resolved
          if (nodeData.parentId === null || idMap.has(nodeData.parentId)) {
            const parentObjId = nodeData.parentId ? idMap.get(nodeData.parentId)._id : null;
            const createdNode = await RoadmapNode.create({
              roadmapId: roadmap._id,
              parentId: parentObjId,
              title: nodeData.title,
              description: nodeData.description || '',
              nodeType: nodeData.nodeType || 'topic',
              isOptional: nodeData.isOptional || false,
              x: (nodeData.x || 0) + xOffset,
              y: (nodeData.y || 0) + yOffset,
              width: nodeData.width || 220,
              height: nodeData.height || 60,
              statusType: nodeData.isOptional ? 'optional' : 'core',
              order: nodeData.order || 0
            });
            idMap.set(nodeData.id, createdNode);

            // Create resources if any
            if (nodeData.resources && nodeData.resources.length > 0) {
              const resources = nodeData.resources.map(res => ({
                nodeId: createdNode._id,
                title: res.title,
                url: res.url,
                type: res.type || 'other',
                isPremium: res.isPremium || false
              }));
              await RoadmapResource.insertMany(resources);
            }
          } else {
            nextQueue.push(nodeData);
          }
        }
        queue = nextQueue;
        passes++;
      }
      
      if (queue.length > 0) {
        for (const nodeData of queue) {
          const createdNode = await RoadmapNode.create({
            roadmapId: roadmap._id,
            parentId: null,
            title: nodeData.title,
            description: nodeData.description || '',
            nodeType: nodeData.nodeType || 'topic',
            isOptional: nodeData.isOptional || false,
            x: (nodeData.x || 0) + xOffset,
            y: (nodeData.y || 0) + yOffset,
            width: nodeData.width || 220,
            height: nodeData.height || 60,
            statusType: nodeData.isOptional ? 'optional' : 'core',
            order: nodeData.order || 0
          });
          idMap.set(nodeData.id, createdNode);
        }
      }

      // Create Roadmap Edges
      if (roadmapData.edges && roadmapData.edges.length > 0) {
        const edgesToInsert = [];
        for (const edgeData of roadmapData.edges) {
          if (idMap.has(edgeData.sourceNodeId) && idMap.has(edgeData.targetNodeId)) {
            edgesToInsert.push({
              roadmapId: roadmap._id,
              sourceNodeId: idMap.get(edgeData.sourceNodeId)._id.toString(),
              targetNodeId: idMap.get(edgeData.targetNodeId)._id.toString(),
              style: edgeData.style || 'solid'
            });
          }
        }
        if (edgesToInsert.length > 0) {
          await RoadmapEdge.insertMany(edgesToInsert);
        }
      }

      console.log(`Successfully seeded Roadmap: ${roadmapData.title} (v${roadmapData.version || 1}) with ${idMap.size} nodes and ${roadmapData.edges?.length || 0} connections.`);
    }

    console.log('Successfully completed all Roadmap seed operations.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedRoadmaps();
