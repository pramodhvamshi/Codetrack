import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LearningTree from '../components/LearningTree';
import ResourceSidebar from '../components/ResourceSidebar';
import { getRoadmapNodes, getRoadmapProgress, getCoordinatorRoadmapProgress, updateNodeProgress } from '../api/roadmapApi';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { AppShell } from '../../../components/AppShell';

const RoadmapDetail = () => {
  const { id, studentId, roadmapId } = useParams();
  const isCoordinator = !!studentId;
  const targetRoadmapId = isCoordinator ? roadmapId : id;
  const readOnly = isCoordinator;

  const [roadmapInfo, setRoadmapInfo] = useState({ title: '', description: '' });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { nodes: fetchedNodes, edges: fetchedEdges } = await getRoadmapNodes(targetRoadmapId);
      const fetchedProgress = isCoordinator
        ? await getCoordinatorRoadmapProgress(studentId, targetRoadmapId)
        : await getRoadmapProgress(targetRoadmapId);
      
      setNodes(fetchedNodes || []);
      setEdges(fetchedEdges || []);
      setProgress(fetchedProgress || {});

      if (fetchedNodes && fetchedNodes.length > 0 && fetchedNodes[0].roadmapId) {
        setRoadmapInfo({
          title: fetchedNodes[0].roadmapId.title || 'Learning Roadmap',
          description: fetchedNodes[0].roadmapId.description || ''
        });
      }
    } catch (err) {
      console.error("Failed to load roadmap details", err);
      setError("Failed to load learning roadmap. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetRoadmapId, studentId]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleStatusChange = async (nodeId, newStatus) => {
    if (readOnly) return;
    setProgress((prev) => ({ ...prev, [nodeId]: newStatus }));
    try {
      await updateNodeProgress(targetRoadmapId, nodeId, newStatus);
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  // Stats calculation
  const totalNodes = nodes.length;
  const completedNodes = nodes.filter(n => progress[n._id] === 'Done').length;
  const completionPercent = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '3rem 2rem', gap: '2rem', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <div style={{ height: '30px', width: '220px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ct-card" style={{ maxWidth: '600px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertTriangle size={48} color="var(--accent-red)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h3 style={{ marginBottom: '0.75rem', color: '#f3f4f6' }}>Load Error</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchData} className="ct-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Retry loading
        </button>
      </div>
    );
  }

  return (
    <AppShell active="roadmaps">
      <div className="roadmap-container animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
        <div className="roadmap-canvas-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* NAV HEADER */}
          <div style={{ padding: '1rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isCoordinator ? (
                <Link to={`/coordinator/students/${studentId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-lift">
                  <ArrowLeft size={16} /> Student Profile
                </Link>
              ) : (
                <Link to="/roadmaps" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-lift">
                  <ArrowLeft size={16} /> All Roadmaps
                </Link>
              )}
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f3f4f6' }}>
                  {roadmapInfo.title}
                  {isCoordinator && <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', marginLeft: '0.5rem' }}>Coordinator View</span>}
                </h2>
              </div>
            </div>

            {!readOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Completion: <strong>{completionPercent}%</strong> ({completedNodes} / {totalNodes} nodes)
                </span>
                <div style={{ width: '120px', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPercent}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* ROADMAP LEARNING TREE */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative', padding: '3rem 2rem' }}>
            <LearningTree 
              nodes={nodes} 
              progress={progress} 
              onNodeClick={handleNodeClick} 
              selectedNodeId={selectedNode?._id}
            />
          </div>
        </div>
        
        {/* RESOURCES PANEL */}
        <ResourceSidebar 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          currentStatus={selectedNode ? progress[selectedNode._id] : null}
          onStatusChange={handleStatusChange}
          readOnly={readOnly}
        />
      </div>
    </AppShell>
  );
};

export default RoadmapDetail;
