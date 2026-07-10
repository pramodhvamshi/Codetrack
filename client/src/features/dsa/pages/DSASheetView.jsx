import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDSASheetCategories, getDSAProgress, getCoordinatorDSAProgress, updateDSAProgress } from '../api/dsaApi';
import DSACategory from '../components/DSACategory';
import { ArrowLeft, Search, Filter, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppShell } from '../../../components/AppShell';

const DSASheetView = () => {
  const { id, studentId, sheetId } = useParams();
  const isCoordinator = !!studentId;
  const targetSheetId = isCoordinator ? sheetId : id;
  const readOnly = isCoordinator;

  const [sheetInfo, setSheetInfo] = useState({ title: '', description: '' });
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
      // Categories fetch
      const fetchedCategories = await getDSASheetCategories(targetSheetId);
      // Progress fetch based on mode
      const fetchedProgress = isCoordinator 
        ? await getCoordinatorDSAProgress(studentId, targetSheetId)
        : await getDSAProgress(targetSheetId);

      setCategories(fetchedCategories);
      setProgress(fetchedProgress);

      if (fetchedCategories.length > 0 && fetchedCategories[0].sheetId) {
        setSheetInfo({
          title: fetchedCategories[0].sheetId.title || 'DSA Sheet',
          description: fetchedCategories[0].sheetId.description || ''
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

  // Compute stats across the raw list (excluding filters)
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

  // Apply filters
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
      <div style={{ padding: '3rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Skeleton Loaders */}
        <div style={{ height: '40px', width: '200px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '2rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '140px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '2rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '80px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '80px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ct-card" style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <AlertTriangle size={48} color="var(--accent-red)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h3 style={{ marginBottom: '0.75rem', color: '#f3f4f6' }}>Load Error</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchData} className="ct-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Retry Loading
        </button>
      </div>
    );
  }

  return (
    <AppShell active="dsa-tracker">
      <div className="dsa-container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* HEADER NAVIGATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isCoordinator ? (
              <Link to={`/coordinator/students/${studentId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-lift">
                <ArrowLeft size={16} /> Student Profile
              </Link>
            ) : (
              <Link to="/dsa" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} className="hover-lift">
                <ArrowLeft size={16} /> All Sheets
              </Link>
            )}
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f3f4f6' }}>
              {sheetInfo.title} {isCoordinator && <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', marginLeft: '0.5rem' }}>Coordinator View</span>}
            </h1>
          </div>
        </div>

        {/* STATISTICS PANEL (Only for Student View) */}
        {!readOnly && (
          <div className="ct-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--grad-score)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL PROGRESS</span>
                <h2 style={{ margin: '0.1rem 0 0 0', fontSize: '1.75rem', fontWeight: 800 }}>{progressPercent}% <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({completedCount} / {totalCount} Solved)</span></h2>
              </div>
              <div style={{ width: '220px', height: '10px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Easy Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: 'var(--success)', fontWeight: 700 }}>{easyCompleted} / {easyProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(34,197,94,0.1)' }}>
                  {easyProblems.length ? Math.round((easyCompleted / easyProblems.length) * 100) : 0}%
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Medium Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: 'var(--warning)', fontWeight: 700 }}>{mediumCompleted} / {mediumProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245,158,11,0.1)' }}>
                  {mediumProblems.length ? Math.round((mediumCompleted / mediumProblems.length) * 100) : 0}%
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hard Problems</span>
                  <h4 style={{ margin: '0.2rem 0 0 0', color: 'var(--accent-red)', fontWeight: 700 }}>{hardCompleted} / {hardProblems.length}</h4>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-red)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239,68,68,0.1)' }}>
                  {hardProblems.length ? Math.round((hardCompleted / hardProblems.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="ct-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Search bar */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem' }} />
              <input 
                type="text" 
                placeholder="Search problems by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ct-input"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
            </div>

            {/* Difficulty filter */}
            <div style={{ width: '130px' }}>
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="ct-input"
                style={{ width: '100%' }}
              >
                <option value="">All Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Status filter */}
            <div style={{ width: '130px' }}>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ct-input"
                style={{ width: '100%' }}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Revisit">Revisit</option>
              </select>
            </div>

            {/* Category filter */}
            <div style={{ width: '170px' }}>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ct-input"
                style={{ width: '100%' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.title.replace(/^Step \d+:\s*/i, '')}</option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            {(searchQuery || difficultyFilter || statusFilter || categoryFilter) && (
              <button onClick={handleResetFilters} className="ct-button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                <RotateCcw size={14} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* CATEGORIES / STEPS TREE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredCategories.length === 0 ? (
            <div className="ct-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No problems found matching the active filter criteria.
            </div>
          ) : (
            filteredCategories.map((category) => (
              <DSACategory 
                key={category._id} 
                category={category} 
                progress={progress} 
                onStatusChange={handleStatusChange}
                readOnly={readOnly}
              />
            ))
          )}
        </div>

      </div>
    </AppShell>
  );
};

export default DSASheetView;
