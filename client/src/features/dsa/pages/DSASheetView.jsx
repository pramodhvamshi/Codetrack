import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDSASheetCategories, getDSAProgress, getCoordinatorDSAProgress, updateDSAProgress } from '../api/dsaApi';
import DSACategory from '../components/DSACategory';
import { ArrowLeft, Search, Filter, RotateCcw, AlertTriangle, RefreshCw, ExternalLink, Code } from 'lucide-react';
import { AppShell } from '../../../components/AppShell';

const DSASheetView = () => {
  const { id, studentId, sheetId } = useParams();
  const isCoordinator = !!studentId;
  const targetSheetId = isCoordinator ? sheetId : id;
  const readOnly = isCoordinator;

  const [sheetInfo, setSheetInfo] = useState({ title: '', description: '', source: '', sourceUrl: '' });
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getDSASheetCategories(targetSheetId);
      const fetchedProgress = isCoordinator 
        ? await getCoordinatorDSAProgress(studentId, targetSheetId)
        : await getDSAProgress(targetSheetId);

      setCategories(fetchedCategories || []);
      setProgress(fetchedProgress || {});

      if (fetchedCategories && fetchedCategories.length > 0 && fetchedCategories[0].sheetId) {
        const sheetDoc = fetchedCategories[0].sheetId;
        setSheetInfo({
          title: sheetDoc.title || 'DSA Sheet',
          description: sheetDoc.description || '',
          source: sheetDoc.source || '',
          sourceUrl: sheetDoc.sourceUrl || 'https://algomaster.io/learn/dsa/course-introduction'
        });
      }
    } catch (err) {
      console.error("Failed to load DSA Sheet details", err);
      setError("Unable to load DSA sheet data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetSheetId, studentId]);

  const handleStatusChange = async (problemId, newStatus) => {
    if (readOnly) return;
    setProgress((prev) => ({ ...prev, [problemId]: newStatus }));
    try {
      await updateDSAProgress(problemId, newStatus);
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('');
    setStatusFilter('');
    setCategoryFilter('');
  };

  const allProblems = categories.flatMap(cat => 
    (cat.problems || []).map(prob => ({ ...prob, categoryId: cat._id, categoryTitle: cat.title }))
  );
  
  const totalCount = allProblems.length;
  const completedCount = allProblems.filter(p => progress[p._id] === 'Completed').length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const easyProblems = allProblems.filter(p => p.difficulty === 'Easy');
  const easyCompleted = easyProblems.filter(p => progress[p._id] === 'Completed').length;

  const mediumProblems = allProblems.filter(p => p.difficulty === 'Medium');
  const mediumCompleted = mediumProblems.filter(p => progress[p._id] === 'Completed').length;

  const hardProblems = allProblems.filter(p => p.difficulty === 'Hard');
  const hardCompleted = hardProblems.filter(p => progress[p._id] === 'Completed').length;

  const filteredCategories = categories.map(cat => {
    const filteredProblems = (cat.problems || []).filter(prob => {
      const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = !difficultyFilter || prob.difficulty === difficultyFilter;
      const probStatus = progress[prob._id] || 'Pending';
      const matchesStatus = !statusFilter || probStatus === statusFilter;
      const matchesCategory = !categoryFilter || cat._id.toString() === categoryFilter;

      return matchesSearch && matchesDifficulty && matchesStatus && matchesCategory;
    });

    return { ...cat, problems: filteredProblems };
  }).filter(cat => cat.problems.length > 0);

  if (loading) {
    return (
      <AppShell active="dsa">
        <div style={{ padding: '3rem 1.5rem', maxWidth: '1000px', margin: '0 auto', color: '#94a3b8', textAlign: 'center' }}>
          Loading DSA sheet data...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell active="dsa">
        <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to Load Sheet</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchData} style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Retry Loading
          </button>
        </div>
      </AppShell>
    );
  }

  const isAlgoMaster = sheetInfo.source === 'algomaster' || sheetInfo.title.toLowerCase().includes('algomaster');

  return (
    <AppShell active="dsa">
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* TOP ATTRIBUTION BANNER (FOR ALGOMASTER SHEET) */}
        {isAlgoMaster && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Code size={18} style={{ color: '#60a5fa' }} />
              <span style={{ fontWeight: 600 }}>Referenced from AlgoMaster DSA Sheet (771 Problems)</span>
            </div>
            <a 
              href="https://algomaster.io/learn/dsa/course-introduction" 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#60a5fa',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <span>Visit AlgoMaster</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* HEADER NAVIGATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isCoordinator ? (
              <Link to={`/coordinator/students/${studentId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                <ArrowLeft size={16} /> Student Profile
              </Link>
            ) : (
              <Link to="/dsa" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                <ArrowLeft size={16} /> All Sheets
              </Link>
            )}
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>
              {sheetInfo.title} {isCoordinator && <span style={{ fontSize: '0.75rem', color: '#93c5fd', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1e3a8a', marginLeft: '0.5rem' }}>Coordinator View</span>}
            </h1>
          </div>
        </div>

        {/* STATISTICS PANEL */}
        <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#121824', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>OVERALL PROGRESS</span>
                <h2 style={{ margin: '0.1rem 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                  {progressPercent}% <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>({completedCount} / {totalCount} Solved)</span>
                </h2>
              </div>
              <div style={{ width: '220px', height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden', border: '1px solid #334155' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Easy Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: '#34d399', fontWeight: 700 }}>{easyCompleted} / {easyProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(52,211,153,0.1)' }}>
                  {easyProblems.length ? Math.round((easyCompleted / easyProblems.length) * 100) : 0}%
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Medium Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: '#fbbf24', fontWeight: 700 }}>{mediumCompleted} / {mediumProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(251,191,36,0.1)' }}>
                  {mediumProblems.length ? Math.round((mediumCompleted / mediumProblems.length) * 100) : 0}%
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Hard Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: '#f87171', fontWeight: 700 }}>{hardCompleted} / {hardProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(248,113,113,0.1)' }}>
                  {hardProblems.length ? Math.round((hardCompleted / hardProblems.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

        {/* CATEGORIES ACCORDION LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredCategories.map((cat) => (
            <DSACategory
              key={cat._id}
              category={cat}
              progress={progress}
              onStatusChange={handleStatusChange}
              readOnly={readOnly}
            />
          ))}
        </div>

      </div>
    </AppShell>
  );
};

export default DSASheetView;
