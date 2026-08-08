import React, { useState, useEffect } from 'react';
import { servicesApi } from '../../../api/servicesApi';
import { 
  Laptop, Search, Save, ExternalLink, Send, CheckCircle2, AlertTriangle, RefreshCw, Filter, Check, X 
} from 'lucide-react';

export function LaptopManagementTab({ role, token }) {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [coordViewMode, setCoordViewMode] = useState('inventory'); // 'inventory' | 'requests'

  // Student form state
  const [laptopNumber, setLaptopNumber] = useState('');
  const [issueCategory, setIssueCategory] = useState('Hardware Issue');
  const [driveDocUrl, setDriveDocUrl] = useState('https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'coordinator') {
        const data = await servicesApi.getLaptopInventory(token);
        setInventory(data);
      }
      const reqData = await servicesApi.getLaptopRequests(token);
      setRequests(reqData);
    } catch (err) {
      console.error('Failed to load laptop data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token, role]);

  const handleUpdateItem = async (item, newStatus, newRemarks) => {
    setSavingId(item._id);
    try {
      await servicesApi.updateLaptopInventoryItem(
        item._id,
        {
          status: newStatus !== undefined ? newStatus : item.status,
          remarks: newRemarks !== undefined ? newRemarks : item.remarks,
        },
        token
      );
      setInventory((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? { ...i, status: newStatus !== undefined ? newStatus : i.status, remarks: newRemarks !== undefined ? newRemarks : i.remarks }
            : i
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update laptop record.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter issue description.');
      return;
    }

    setSubmitting(true);
    try {
      await servicesApi.reportLaptopIssue(
        {
          laptopNumber,
          issueCategory,
          driveDocUrl,
          description,
        },
        token
      );
      alert('Laptop issue reported successfully!');
      setDescription('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to report laptop issue.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (item.laptopNumber && item.laptopNumber.toLowerCase().includes(s)) ||
      (item.studentName && item.studentName.toLowerCase().includes(s)) ||
      (item.mssId && item.mssId.toLowerCase().includes(s)) ||
      (item.serviceTag && item.serviceTag.toLowerCase().includes(s))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .ct-glass-panel {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .ct-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .ct-form-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ct-form-input, .ct-form-select, .ct-form-textarea {
          background: #090d16 !important;
          border: 1px solid #1e293b !important;
          color: #f8fafc !important;
          padding: 0.65rem 0.9rem !important;
          border-radius: 12px !important;
          font-size: 0.85rem !important;
          outline: none !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          width: 100%;
        }
        .ct-form-input:focus, .ct-form-select:focus, .ct-form-textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3) !important;
        }
        .ct-btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 800;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
        }
        .ct-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.5);
        }
        .ct-excel-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: left;
        }
        .ct-excel-table th {
          background: #0b1329;
          color: #94a3b8;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .ct-excel-table td {
          padding: 0.75rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
        .ct-excel-table tr:hover td {
          background: rgba(30, 41, 59, 0.5);
        }
      `}</style>

      {/* Format Header */}
      <div className="ct-glass-panel" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: 12 }}>
            <Laptop size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>MCT Laptop Audit & Service Desk</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Track hardware status, office inventory, R&D repairs, and student issue requests</p>
          </div>
        </div>

        <a
          href="https://drive.google.com/file/d/1dx8g37FhMlMQEn3Mz1C5QH_zfXKkyzIR/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="ct-btn-primary"
          style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.55rem 1rem' }}
        >
          <span>View Laptop Issue Format Template</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* STUDENT VIEW */}
      {role === 'student' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Issue Form */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} color="#818cf8" /> Report Laptop Issue / Request Replacement
            </h3>

            <form onSubmit={handleSubmitIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ct-form-group">
                <label className="ct-form-label">MCT Laptop Number</label>
                <input
                  type="text"
                  placeholder="e.g. MCT LAPTOP 228"
                  value={laptopNumber}
                  onChange={(e) => setLaptopNumber(e.target.value)}
                  className="ct-form-input"
                />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="ct-form-select"
                >
                  <option value="Hardware Issue">Hardware Issue / Physical Damage</option>
                  <option value="Battery/Charger Replacement">Battery / Charger Replacement</option>
                  <option value="Screen/Keyboard Repair">Screen / Keyboard Repair</option>
                  <option value="Send to R&D">Send to R&D / System Lag</option>
                  <option value="Return Laptop">Return Laptop to Office</option>
                  <option value="Other">Other Request</option>
                </select>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Google Drive Document Link</label>
                <input
                  type="url"
                  value={driveDocUrl}
                  onChange={(e) => setDriveDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="ct-form-input"
                />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Detailed Description & Symptoms</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe screen flickering, battery issues, charging port defects..."
                  className="ct-form-textarea"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="ct-btn-primary"
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Issue Report'}
              </button>
            </form>
          </div>

          {/* Student Issue Requests History */}
          <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Laptop size={18} color="#818cf8" /> My Reported Issues
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading issue reports...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
                No laptop issue reports submitted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 520, overflowY: 'auto' }}>
                {requests.map((r) => (
                  <div key={r._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>{r.issueCategory} ({r.laptopNumber || 'Laptop'})</span>
                      <span style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {r.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>{r.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.driveDocUrl && (
                        <a href={r.driveDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          Doc Link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COORDINATOR VIEW: Inventory Table & Student Requests Queue */
        <div className="ct-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Sub-tab Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.8rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>MCT Laptop Service & Audit Center</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Manage laptop master audit inventory and track student hardware issue requests</p>
            </div>

            <div style={{ display: 'flex', background: '#090d16', padding: '4px', borderRadius: '12px', border: '1px solid #1e293b', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setCoordViewMode('inventory')}
                style={{
                  background: coordViewMode === 'inventory' ? '#2563eb' : 'transparent',
                  color: coordViewMode === 'inventory' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Laptop size={14} /> Master Inventory Table ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setCoordViewMode('requests')}
                style={{
                  background: coordViewMode === 'requests' ? '#2563eb' : 'transparent',
                  color: coordViewMode === 'requests' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={14} /> Student Hardware Issue Requests ({requests.length})
              </button>
            </div>
          </div>

          {/* VIEW 1: MASTER INVENTORY TABLE */}
          {coordViewMode === 'inventory' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: 280 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search laptop no, MSS ID, name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ct-form-input"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading laptop inventory table...</div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '14px', maxHeight: 580 }}>
                  <table className="ct-excel-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center', width: 50 }}>S.No</th>
                        <th>Laptop Number</th>
                        <th>Service Tag</th>
                        <th>Holding Student</th>
                        <th>MSS ID</th>
                        <th style={{ width: 260 }}>Laptop Status Dropdown</th>
                        <th>Remarks / Action Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => (
                        <tr key={item._id}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>{item.sNo}</td>
                          <td style={{ fontWeight: 800, color: '#ffffff' }}>{item.laptopNumber}</td>
                          <td style={{ fontFamily: 'monospace', color: '#818cf8' }}>{item.serviceTag || 'N/A'}</td>
                          <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.studentName || 'Office'}</td>
                          <td style={{ color: '#94a3b8' }}>{item.mssId || 'N/A'}</td>

                          <td>
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateItem(item, e.target.value, item.remarks)}
                              style={{
                                background: item.status === 'Verified' ? 'rgba(34, 197, 94, 0.15)' : item.status === 'At Office - Need to send to R&D' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: item.status === 'Verified' ? '#4ade80' : item.status === 'At Office - Need to send to R&D' ? '#f87171' : '#60a5fa',
                                border: item.status === 'Verified' ? '1px solid rgba(34, 197, 94, 0.4)' : item.status === 'At Office - Need to send to R&D' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                outline: 'none',
                                width: '100%'
                              }}
                            >
                              <option value="Verified" style={{ background: '#090d16', color: '#f8fafc' }}>Verified (With Student)</option>
                              <option value="At Office - Need to send to R&D" style={{ background: '#090d16', color: '#f8fafc' }}>At Office - Need to send to R&D</option>
                              <option value="At Office - No Issues" style={{ background: '#090d16', color: '#f8fafc' }}>At Office - No Issues</option>
                            </select>
                          </td>

                          <td>
                            <input
                              type="text"
                              defaultValue={item.remarks}
                              onBlur={(e) => handleUpdateItem(item, item.status, e.target.value)}
                              placeholder="Add remarks..."
                              className="ct-form-input"
                              style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: STUDENT HARDWARE ISSUE REQUESTS QUEUE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading student hardware issue requests...</div>
              ) : requests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '12px' }}>
                  No student laptop issue requests submitted yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {requests.map((r) => (
                    <div key={r._id} style={{ padding: '1rem', background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>{r.studentId?.name || 'Student'}</h4>
                            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{r.studentId?.college || 'College N/A'} • MSS ID: {r.studentId?.mssId || 'N/A'}</p>
                          </div>
                          <select
                            value={r.status}
                            onChange={async (e) => {
                              const newSt = e.target.value;
                              try {
                                await servicesApi.updateLaptopRequestStatus(r._id, { status: newSt }, token);
                                setRequests((prev) => prev.map((item) => item._id === r._id ? { ...item, status: newSt } : item));
                              } catch (err) {
                                alert('Failed to update request status');
                              }
                            }}
                            style={{
                              background: r.status === 'Resolved' ? 'rgba(34, 197, 94, 0.15)' : r.status === 'In Progress' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: r.status === 'Resolved' ? '#4ade80' : r.status === 'In Progress' ? '#fbbf24' : '#60a5fa',
                              border: r.status === 'Resolved' ? '1px solid rgba(34, 197, 94, 0.4)' : r.status === 'In Progress' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="Pending" style={{ background: '#090d16', color: '#f8fafc' }}>Pending</option>
                            <option value="In Progress" style={{ background: '#090d16', color: '#f8fafc' }}>In Progress</option>
                            <option value="Resolved" style={{ background: '#090d16', color: '#f8fafc' }}>Resolved</option>
                            <option value="Rejected" style={{ background: '#090d16', color: '#f8fafc' }}>Rejected</option>
                          </select>
                        </div>

                        <div style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8' }}>
                            {r.issueCategory} • {r.laptopNumber || 'Laptop No. N/A'}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>{r.description}</p>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Reported Date: {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {r.driveDocUrl && (
                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                          <a
                            href={r.driveDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#818cf8', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                          >
                            Doc Link <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
