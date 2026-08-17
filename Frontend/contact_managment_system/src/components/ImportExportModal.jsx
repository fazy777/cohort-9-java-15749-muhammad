import { useState } from 'react';
import { api } from '../services/api';
import { Download, Upload, FileText, X, CheckCircle } from 'lucide-react';

export const ImportExportModal = ({ isOpen, onClose, showToast, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  if (!isOpen) return null;

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const contacts = await api.exportContacts();
      const jsonStr = JSON.stringify(contacts || [], null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.('Contacts exported to JSON file successfully!', 'success');
    } catch (err) {
      showToast?.(err?.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const contacts = await api.exportContacts();
      if (!Array.isArray(contacts) || contacts.length === 0) {
        showToast?.('No contacts to export', 'error');
        return;
      }

      // Format CSV
      const headers = ['First Name', 'Last Name', 'Title', 'Emails', 'Phones', 'Notes'];
      const rows = contacts.map(c => [
        `"${c?.firstName || ''}"`,
        `"${c?.lastName || ''}"`,
        `"${c?.title || ''}"`,
        `"${(c?.emails || []).map(e => `${e.email} (${e.label})`).join('; ')}"`,
        `"${(c?.phones || []).map(p => `${p.phoneNumber} (${p.label})`).join('; ')}"`,
        `"${(c?.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.('Contacts exported to CSV file successfully!', 'success');
    } catch (err) {
      showToast?.(err?.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt?.target?.result;
        if (typeof text !== 'string') return;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setPreviewData(parsed);
          } else {
            throw new Error('JSON file must contain an array of contacts');
          }
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV Parser
          const lines = text.split('\n').filter(l => l.trim() !== '');
          if (lines.length <= 1) throw new Error('CSV file is empty or missing data rows');
          
          const parsed = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 2) {
              parsed.push({
                firstName: cols[0] || 'Unknown',
                lastName: cols[1] || 'Contact',
                title: cols[2] || '',
                emails: cols[3] ? [{ email: cols[3].split(';')[0].split(' ')[0], label: 'WORK' }] : [],
                phones: cols[4] ? [{ phoneNumber: cols[4].split(';')[0].split(' ')[0], label: 'WORK' }] : [],
                notes: cols[5] || ''
              });
            }
          }
          setPreviewData(parsed);
        } else {
          throw new Error('Please select a .json or .csv file');
        }
      } catch (err) {
        showToast?.(err?.message || 'Invalid file format', 'error');
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!Array.isArray(previewData) || previewData.length === 0) return;
    setImporting(true);
    try {
      const res = await api.importContacts(previewData);
      showToast?.(`Successfully imported ${res?.data ?? previewData.length} contacts!`, 'success');
      setPreviewData(null);
      onImportSuccess?.();
      onClose?.();
    } catch (err) {
      showToast?.(err?.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e?.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--accent-primary)" /> Export / Import Contacts
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Export Section */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={18} color="var(--success-color)" /> Export Your Contacts
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Download all your contacts to backup or use in external applications.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={exporting}>
              <Download size={14} /> Export as CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} disabled={exporting}>
              <Download size={14} /> Export as JSON
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={18} color="var(--accent-primary)" /> Import Contacts from File
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Upload a .json or .csv file containing contact information.
          </p>

          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="import-file-input"
          />

          <label
            htmlFor="import-file-input"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)',
              transition: 'var(--transition-fast)'
            }}
          >
            <Upload size={28} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Click to Choose File</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.2rem' }}>Supports .CSV and .JSON formats</span>
          </label>

          {previewData && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: '600' }}>
                <CheckCircle size={18} /> Found {previewData.length} valid contacts ready to import
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleConfirmImport}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
