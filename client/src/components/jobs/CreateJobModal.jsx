import React, { useState } from 'react';
import { jobApi } from '../../api/jobApi';

export function CreateJobModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !location.trim() || !description.trim()) {
      setError('Title, company, location, and description are required');
      return;
    }

    setLoading(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const res = await jobApi.createJob({
        title,
        company,
        location,
        employmentType,
        salary,
        description,
        requirements,
        tags
      });

      if (res.success) {
        onSuccess();
        onClose();
        setTitle('');
        setCompany('');
        setLocation('');
        setSalary('');
        setDescription('');
        setRequirements('');
        setTagsInput('');
      } else {
        setError(res.message || 'Failed to post job listing');
      }
    } catch (err) {
      console.error('Error posting job:', err);
      setError('Failed to post job listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #f8fafc)' }}>
            💼 Post Job / Referral Opportunity
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SDE-1 / Backend Intern"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Amazon / Microsoft"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / Hyderabad"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Internship">Internship</option>
                <option value="Referral">Alumni Referral</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
                Salary / Stipend
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₹15 LPA / ₹40k pm"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-secondary, #0f172a)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Role Description & Expectations *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the position, team, and work details..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '0.3rem' }}>
              Skills & Tech Stack Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. React, Node.js, Python, AWS"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                border: '1px solid var(--border, #334155)',
                color: 'var(--text-muted, #94a3b8)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.4rem',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Posting...' : 'Publish Job Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
