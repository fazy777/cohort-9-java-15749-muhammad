import { useState, useRef } from 'react';
import { api } from '../services/api';
import { Download, Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

/**
 * Escapes a field for CSV export and neutralizes spreadsheet formula injection.
 * @param {string | null | undefined} val
 * @returns {string}
 */
const serializeCsvField = (val) => {
  if (val == null) return '""';
  let str = String(val);

  // Neutralize formula injection for spreadsheet software (Excel, Google Sheets, Calc) based on trimmed content
  if (/^[=+\-@\t\r]/.test(str.trim())) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Parses raw CSV text complying with RFC 4180 standard (handles quotes, commas, newlines).
 * @param {string} text
 * @returns {string[][]}
 */
const parseCsv = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.some(col => col.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.some(col => col.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (insideQuotes) {
    throw new Error('Unterminated quoted field in CSV');
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(col => col.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Strips formula neutralization prefix if applied during export.
 * @param {string} val
 * @returns {string}
 */
const sanitizeImportValue = (val) => {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (trimmed.startsWith("'") && /^[=+\-@\t\r]/.test(trimmed.slice(1))) {
    return trimmed.slice(1);
  }
  return trimmed;
};

/**
 * Parses email entries from CSV string (e.g. "john@work.com (WORK); john@home.com (PERSONAL)").
 * @param {string} str
 * @returns {Array<{email: string, label: string}>}
 */
const parseEmailsFromCsv = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(';').map(item => {
    const clean = item.trim();
    const match = clean.match(/^([^()]+)(?:\s*\(([^()]+)\))?$/);
    if (match) {
      return {
        email: sanitizeImportValue(match[1]),
        label: sanitizeImportValue(match[2] || 'WORK')
      };
    }
    return { email: sanitizeImportValue(clean), label: 'WORK' };
  }).filter(e => e.email.length > 0);
};

/**
 * Parses phone entries from CSV string (e.g. "+123456 (WORK); +654321 (MOBILE)").
 * @param {string} str
 * @returns {Array<{phoneNumber: string, label: string}>}
 */
const parsePhonesFromCsv = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(';').map(item => {
    const clean = item.trim();
    const match = clean.match(/^([^()]+)(?:\s*\(([^()]+)\))?$/);
    if (match) {
      return {
        phoneNumber: sanitizeImportValue(match[1]),
        label: sanitizeImportValue(match[2] || 'WORK')
      };
    }
    return { phoneNumber: sanitizeImportValue(clean), label: 'WORK' };
  }).filter(p => p.phoneNumber.length > 0);
};

/**
 * Modal dialog component for importing contacts from CSV/JSON and exporting contacts.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   showToast?: (msg: string, type: string) => void,
 *   onImportSuccess?: () => void
 * }} props
 * @returns {JSX.Element|null}
 */
export const ImportExportModal = ({ isOpen, onClose, showToast, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const activeReaderRef = useRef(null);

  /**
   * Clears preview state and aborts active file reading before triggering onClose.
   * Prevents dismissal while import operation is actively in flight.
   */
  const handleModalClose = () => {
    if (importing) return;
    setPreviewData(null);
    activeReaderRef.current = null;
    onClose?.();
  };

  const modalRef = useModalA11y(isOpen, handleModalClose);

  if (!isOpen) return null;

  /**
   * Helper to trigger client-side download of a Blob.
   * @param {Blob} blob
   * @param {string} filename
   */
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  /**
   * Fetches all contacts and triggers download as JSON file.
   */
  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const contacts = await api.exportContacts();
      const jsonStr = JSON.stringify(contacts || [], null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      downloadBlob(blob, `contacts_export_${new Date().toISOString().split('T')[0]}.json`);
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
        showToast?.('No contacts available to export', 'error');
        return;
      }

      // Format CSV with robust quotes escaping and neutralization
      const headers = ['First Name', 'Last Name', 'Title', 'Emails', 'Phones', 'Notes'];
      const csvRows = [headers.map(h => serializeCsvField(h)).join(',')];

      for (const c of contacts) {
        const emailStr = (c.emails || []).map(e => `${e.email || ''} (${e.label || 'WORK'})`).join('; ');
        const phoneStr = (c.phones || []).map(p => `${p.phoneNumber || ''} (${p.label || 'WORK'})`).join('; ');

        const row = [
          serializeCsvField(c.firstName || ''),
          serializeCsvField(c.lastName || ''),
          serializeCsvField(c.title || ''),
          serializeCsvField(emailStr),
          serializeCsvField(phoneStr),
          serializeCsvField(c.notes || '')
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
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

    if (e.target) {
      e.target.value = '';
    }

    const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      showToast?.('File size exceeds the 5MB maximum limit', 'error');
      return;
    }

    const reader = new FileReader();
    const currentReader = reader;
    activeReaderRef.current = currentReader;

    reader.onerror = () => {
      if (activeReaderRef.current !== currentReader) return;
      showToast?.('Failed to read file from disk', 'error');
      setPreviewData(null);
    };

    reader.onload = (evt) => {
      if (activeReaderRef.current !== currentReader) return;
      try {
        const text = evt?.target?.result;
        if (typeof text !== 'string') return;

        const fileNameLower = (file.name || '').toLowerCase();

        const MAX_CONTACTS_IMPORT = 1000;

        if (fileNameLower.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            if (parsed.length > MAX_CONTACTS_IMPORT) {
              throw new Error(`Cannot import more than ${MAX_CONTACTS_IMPORT} contacts at a time`);
            }
            const valid = parsed
              .filter(c => c && typeof c === 'object' && typeof c.firstName === 'string' && c.firstName.trim().length > 0 && typeof c.lastName === 'string' && c.lastName.trim().length > 0)
              .map(c => ({
                ...c,
                firstName: c.firstName.trim(),
                lastName: c.lastName.trim(),
                title: typeof c.title === 'string' ? c.title.trim() : '',
                notes: typeof c.notes === 'string' ? c.notes.trim() : '',
                emails: Array.isArray(c.emails) ? c.emails.filter(e => e && typeof e.email === 'string' && e.email.trim().length > 0) : [],
                phones: Array.isArray(c.phones) ? c.phones.filter(p => p && typeof p.phoneNumber === 'string' && p.phoneNumber.trim().length > 0) : []
              }));
            if (valid.length === 0) throw new Error('No valid contacts found in JSON file (requires First Name and Last Name)');
            setPreviewData(valid);
          } else {
            throw new Error('JSON file must contain an array of contacts');
          }
        } else if (fileNameLower.endsWith('.csv')) {
          const rows = parseCsv(text);
          if (rows.length <= 1) throw new Error('CSV file is empty or missing data rows');

          const headerRow = rows[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
          const colIndex = {
            firstName: headerRow.findIndex(h => h === 'firstname' || h === 'first'),
            lastName: headerRow.findIndex(h => h === 'lastname' || h === 'last'),
            title: headerRow.findIndex(h => h === 'title'),
            emails: headerRow.findIndex(h => h === 'emails' || h === 'email' || h === 'emailaddress' || h === 'emailaddresses'),
            phones: headerRow.findIndex(h => h === 'phones' || h === 'phone' || h === 'phonenumber' || h === 'phonenumbers'),
            notes: headerRow.findIndex(h => h === 'notes' || h === 'note')
          };

          if (colIndex.firstName === -1 || colIndex.lastName === -1) {
            throw new Error('CSV import requires both "First Name" and "Last Name" headers');
          }

          const parsed = [];
          const errors = [];
          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            if (!Array.isArray(cols) || cols.length === 0) continue;
            const firstName = sanitizeImportValue(cols[colIndex.firstName] || '');
            const lastName = sanitizeImportValue(cols[colIndex.lastName] || '');

            if (firstName && lastName) {
              parsed.push({
                firstName,
                lastName,
                title: colIndex.title !== -1 ? sanitizeImportValue(cols[colIndex.title] || '') : '',
                emails: colIndex.emails !== -1 ? parseEmailsFromCsv(cols[colIndex.emails] || '') : [],
                phones: colIndex.phones !== -1 ? parsePhonesFromCsv(cols[colIndex.phones] || '') : [],
                notes: colIndex.notes !== -1 ? sanitizeImportValue(cols[colIndex.notes] || '') : ''
              });
            } else {
              errors.push(`Row ${i + 1}: Missing first name or last name`);
            }
          }
          if (parsed.length === 0) throw new Error('No valid contact entries found in CSV');
          if (parsed.length > MAX_CONTACTS_IMPORT) throw new Error(`Cannot import more than ${MAX_CONTACTS_IMPORT} contacts at a time`);
          if (errors.length > 0) {
            showToast?.(`Parsed ${parsed.length} contacts (${errors.length} skipped row${errors.length > 1 ? 's' : ''} missing names)`, 'warning');
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
      activeReaderRef.current = null;
      setImporting(false);
      onImportSuccess?.();
      onClose?.();
    } catch (err) {
      showToast?.(err?.message || 'Import failed', 'error');
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-export-modal-title"
        className="modal-container"
        onClick={(e) => e?.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <h3 id="import-export-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--accent-primary)" /> Export / Import Contacts
          </h3>
          <button
            type="button"
            aria-label="Close import and export modal"
            onClick={handleModalClose}
            disabled={importing}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: importing ? 'not-allowed' : 'pointer' }}
          >
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
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={exporting || importing}>
              <Download size={14} /> Export as CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} disabled={exporting || importing}>
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
            <Upload size={18} color="var(--accent-primary)" /> Import Contacts
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Upload a .json or .csv file containing contact information.
          </p>

          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            disabled={importing}
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
              cursor: importing ? 'not-allowed' : 'pointer',
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
          <button type="button" className="btn btn-secondary" onClick={handleModalClose} disabled={importing}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

