import React, { useState } from 'react';
import { alumniApi } from '../../api/alumniApi';

export function ImportAlumniModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
      setSuccessMsg('');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel (.xlsx) or CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await alumniApi.importAlumni(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Alumni spreadsheet imported successfully!');
        setFile(null);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Failed to import spreadsheet');
      }
    } catch (err) {
      console.error('Error importing alumni:', err);
      setError(err.message || 'Failed to process spreadsheet file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
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
        borderRadius: '18px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid var(--border, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              📥 Bulk Import Alumni Excel / CSV
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Admin & Coordinator batch spreadsheet importer
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleImport} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          {/* Supported Headers Guide */}
          <div style={{
            background: 'var(--bg-secondary, #0f172a)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '10px',
            padding: '0.85rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary, #cbd5e1)'
          }}>
            <strong style={{ color: '#3b82f6', display: 'block', marginBottom: '0.35rem' }}>📋 Supported Excel Columns:</strong>
            <code>Name</code>, <code>Email</code>, <code>College</code>, <code>Branch</code>, <code>Batch</code>, <code>Company</code>, <code>Role</code>, <code>LinkedIn</code>
          </div>

          {/* File input */}
          <div style={{
            border: '2px dashed #3b82f6',
            borderRadius: '12px',
            padding: '2rem 1rem',
            textAlign: 'center',
            background: 'rgba(59, 130, 246, 0.05)',
            marginBottom: '1.25rem',
            cursor: 'pointer'
          }}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="alumni-file-input"
            />
            <label htmlFor="alumni-file-input" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                {file ? file.name : 'Click or Drag & Drop Excel/CSV spreadsheet'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Supports .xlsx, .xls, and .csv files up to 10MB
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-secondary, #0f172a)',
                color: 'var(--text-muted, #94a3b8)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: uploading || !file ? 'not-allowed' : 'pointer',
                opacity: uploading || !file ? 0.6 : 1
              }}
            >
              {uploading ? 'Importing...' : 'Upload & Integrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
