import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TreeRoadmap from '../components/TreeRoadmap';
import RoadmapProgressHeader from '../components/RoadmapProgressHeader';
import ResourceSidebar from '../components/ResourceSidebar';
import { getRoadmapNodes, getRoadmapProgress, getCoordinatorRoadmapProgress, updateNodeProgress } from '../api/roadmapApi';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { AppShell } from '../../../components/AppShell';

const RoadmapDetail = () => {
  const { id, studentId, roadmapId } = useParams();
  const isCoordinator = Boolean(studentId);
  const targetRoadmapId = isCoordinator ? roadmapId : id;
  const readOnly = isCoordinator;

  const [roadmapInfo, setRoadmapInfo] = useState({ title: '', description: '' });
  const [nodes, setNodes] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { nodes: fetchedNodes } = await getRoadmapNodes(targetRoadmapId);
      const fetchedProgress = isCoordinator
        ? await getCoordinatorRoadmapProgress(studentId, targetRoadmapId)
        : await getRoadmapProgress(targetRoadmapId);

      setNodes(fetchedNodes || []);
      setProgress(fetchedProgress || {});

      if (fetchedNodes && fetchedNodes.length > 0 && fetchedNodes[0].roadmapId) {
        const rmDoc = fetchedNodes[0].roadmapId;
        setRoadmapInfo({
          title: rmDoc.title || 'Learning Roadmap',
          description: rmDoc.description || ''
        });
      }
    } catch (err) {
      console.error('Failed to load roadmap details', err);
      setError('Failed to load learning roadmap. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetRoadmapId, studentId]);

  const handleNodeClick = (node) => {
    if (readOnly) return; // Coordinator cannot open topic resource sidebar
    setSelectedNode(node);
  };

  const handleStatusChange = async (nodeId, newStatus) => {
    if (readOnly) return;
    setProgress((prev) => ({ ...prev, [nodeId]: newStatus }));
    try {
      await updateNodeProgress(targetRoadmapId, nodeId, newStatus);
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  };

  const handleContinueLearning = () => {
    if (readOnly) return;
    const topicNodes = nodes.filter((n) => n.parentId !== null);
    const nextTopic = topicNodes.find((n) => progress[n._id] !== 'Done') || topicNodes[0];
    if (nextTopic) {
      setSelectedNode(nextTopic);
    }
  };

  const topicNodes = nodes.filter((n) => n.parentId !== null);
  const totalNodes = topicNodes.length > 0 ? topicNodes.length : nodes.length;
  const completedNodes = (topicNodes.length > 0 ? topicNodes : nodes).filter((n) => progress[n._id] === 'Done').length;
  const completionPercent = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);

  if (loading) {
    return (
      <AppShell active="roadmaps">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading roadmap details...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell active="roadmaps">
        <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: '#1e293b', borderRadius: '12px' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to Load Roadmap</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button
            type="button"
            onClick={fetchData}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Retry Loading
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="roadmaps">
      <div style={{ minHeight: 'calc(100vh - 64px)', background: '#0b0f17', color: '#f8fafc' }}>
        {/* Sticky Header with Progress */}
        <RoadmapProgressHeader
          title={roadmapInfo.title}
          description={roadmapInfo.description}
          completionPercent={completionPercent}
          completedNodes={completedNodes}
          totalNodes={totalNodes}
          isCoordinator={isCoordinator}
          studentId={studentId}
          readOnly={readOnly}
          onContinueLearning={handleContinueLearning}
        />

        {/* 3-Column Tree Area */}
        <div style={{ position: 'relative' }}>
          <TreeRoadmap
            nodes={nodes}
            progress={progress}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?._id}
          />

          {/* Slide-over Right Drawer */}
          <ResourceSidebar
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            currentStatus={selectedNode ? progress[selectedNode._id] : null}
            onStatusChange={handleStatusChange}
            readOnly={readOnly}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default RoadmapDetail;
