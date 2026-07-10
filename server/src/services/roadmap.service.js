const Roadmap = require('../models/Roadmap/Roadmap');
const RoadmapNode = require('../models/Roadmap/RoadmapNode');
const RoadmapResource = require('../models/Roadmap/RoadmapResource');
const RoadmapProgress = require('../models/Roadmap/RoadmapProgress');

exports.getAllRoadmaps = async () => {
  return Roadmap.find({}).lean();
};

exports.getRoadmapNodes = async (roadmapId) => {
  const nodes = await RoadmapNode.find({ roadmapId }).sort({ order: 1 }).lean();
  const nodeIds = nodes.map(n => n._id);
  const resources = await RoadmapResource.find({ nodeId: { $in: nodeIds } }).lean();

  return nodes.map(node => {
    node.resources = resources.filter(r => r.nodeId.toString() === node._id.toString());
    return node;
  });
};

exports.getRoadmapDetails = async (roadmapId) => {
  const nodes = await exports.getRoadmapNodes(roadmapId);
  return {
    nodes
  };
};

exports.getStudentProgress = async (studentId, roadmapId) => {
  const progressList = await RoadmapProgress.find({ studentId, roadmapId }).lean();
  const progressMap = {};
  progressList.forEach(p => {
    progressMap[p.nodeId.toString()] = p.status;
  });
  return progressMap;
};

exports.updateProgress = async (studentId, roadmapId, nodeId, status) => {
  return RoadmapProgress.findOneAndUpdate(
    { studentId, roadmapId, nodeId },
    { status },
    { upsert: true, new: true }
  );
};
