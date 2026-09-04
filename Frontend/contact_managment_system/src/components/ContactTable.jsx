import { Search, Plus, Edit, Trash2, Eye, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getLabelClass } from '../utils/labels';

/**
 * Calculates page numbers array with ellipsis for pagination navigation.
 * @param {number} current - 0-indexed current page
 * @param {number} total - total number of pages
 * @returns {Array<number|string>}
 */
const getPagePills = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pills = [];
  pills.push(0);

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  if (start > 1) {
    pills.push('ellipsis-start');
  }

  for (let i = start; i <= end; i++) {
    pills.push(i);
  }

  if (end < total - 2) {
    pills.push('ellipsis-end');
  }

  pills.push(total - 1);
  return pills;
};

/**
 * Data table component rendering contact listings, search filter, action buttons, and pagination controls.
 *
 * @param {{
 *   contacts?: Array<import('../services/api').ContactDto>,
 *   totalElements?: number,
 *   totalPages?: number,
 *   currentPage?: number,
 *   pageSize?: number,
 *   searchTerm?: string,
 *   onSearchChange?: (val: string) => void,
 *   onPageChange?: (page: number) => void,
 *   onPageSizeChange?: (size: number) => void,
 *   onOpenCreate?: () => void,
 *   onOpenUpdate?: (c: import('../services/api').ContactDto) => void,
 *   onOpenDelete?: (c: import('../services/api').ContactDto) => void,
 *   onOpenDetail?: (c: import('../services/api').ContactDto) => void,
 *   onOpenImportExport?: () => void,
 *   loading?: boolean
 * }} props
 * @returns {JSX.Element}
 */
export const ContactTable = ({
  contacts = [],
  totalElements = 0,
  totalPages = 0,
  currentPage = 0,
  pageSize = 10,
  searchTerm = '',
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onOpenCreate,
  onOpenUpdate,
  onOpenDelete,
  onOpenDetail,
  onOpenImportExport,
  loading = false
}) => {
  const safeContacts = Array.isArray(contacts) ? contacts.filter(Boolean) : [];
  const effectivePage = totalPages > 0 ? Math.min(Math.max(0, currentPage), totalPages - 1) : 0;
  const startItem = totalElements > 0 ? effectivePage * pageSize + 1 : 0;
  const endItem = Math.min((effectivePage + 1) * pageSize, totalElements);
  const pagePills = getPagePills(effectivePage, totalPages || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header / Actions Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
          {/* Search Input Field */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              aria-label="Search contacts"
              className="input-control"
              placeholder="Search contacts by name, title, email or phone..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpenImportExport} title="Import or Export Contacts">
            <FileText size={16} /> Import / Export
          </button>

          <button className="btn btn-primary btn-sm" onClick={onOpenCreate}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading contacts...
          </div>
        ) : safeContacts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
              {searchTerm ? `No contacts matching "${searchTerm}"` : 'No contacts added yet.'}
            </p>
            {!searchTerm && (
              <button className="btn btn-primary btn-sm" onClick={onOpenCreate}>
                <Plus size={16} /> Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <th>Title</th>
                  <th>Primary Email</th>
                  <th>Primary Phone</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeContacts.map((c, index) => {
                  const primaryEmail = Array.isArray(c?.emails) && c.emails.length > 0 ? c.emails[0] : null;
                  const primaryPhone = Array.isArray(c?.phones) && c.phones.length > 0 ? c.phones[0] : null;
                  const contactKey = c?.id != null ? `contact-${c.id}` : `contact-idx-${index}`;

                  return (
                    <tr key={contactKey}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--accent-gradient)',
                            border: '1.5px solid rgba(255, 255, 255, 0.45)',
                            boxShadow: '0 2px 10px rgba(185, 28, 28, 0.5), 0 0 8px rgba(255, 255, 255, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                          }}>
                            {c?.firstName ? c.firstName.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              {c?.firstName} {c?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {c?.title ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{c.title}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      <td>
                        {primaryEmail?.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{primaryEmail.email}</span>
                            <span className={`badge ${getLabelClass(primaryEmail?.label || 'WORK')}`}>{primaryEmail?.label || 'WORK'}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      <td>
                        {primaryPhone?.phoneNumber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{primaryPhone.phoneNumber}</span>
                            <span className={`badge ${getLabelClass(primaryPhone?.label || 'WORK')}`}>{primaryPhone?.label || 'WORK'}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => onOpenDetail?.(c)}
                            aria-label={`View details for ${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim()}
                            title="View Contact Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => onOpenUpdate?.(c)}
                            aria-label={`Edit ${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim()}
                            title="Edit Contact"
                          >
                            <Edit size={16} color="var(--accent-primary)" />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => onOpenDelete?.(c)}
                            aria-label={`Delete ${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim()}
                            title="Delete Contact"
                            style={{ borderColor: 'rgba(239,68,68,0.3)' }}
                          >
                            <Trash2 size={16} color="var(--danger-color)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Navigation Controls */}
        {totalElements > 0 && (
          <div className="pagination-bar">
            {/* Left section: Record Count and Per Page dropdown */}
            <div className="pagination-info-group">
              <span className="pagination-range-badge">
                Showing <strong className="pagination-num">{startItem}–{endItem}</strong> of{' '}
                <strong className="pagination-num">{totalElements}</strong> contacts
              </span>

              <div className="pagination-per-page-wrapper">
                <label htmlFor="contacts-per-page-select" className="pagination-per-page-label">
                  Per page:
                </label>
                <select
                  id="contacts-per-page-select"
                  aria-label="Contacts per page"
                  className="pagination-select"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Right section: Navigation buttons & Page number pills */}
            {totalPages > 1 && (
              <nav aria-label="Contacts pagination" className="pagination-nav-group">
                <button
                  type="button"
                  className="pagination-btn pagination-icon-btn"
                  onClick={() => onPageChange?.(0)}
                  disabled={currentPage === 0}
                  title="First Page"
                  aria-label="Go to first page"
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  type="button"
                  className="pagination-btn pagination-step-btn"
                  onClick={() => onPageChange?.(effectivePage - 1)}
                  disabled={effectivePage === 0}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} />
                  <span className="pagination-btn-text">Prev</span>
                </button>

                <div className="pagination-pills-list">
                  {pagePills.map((pill, idx) => {
                    if (typeof pill === 'string') {
                      return (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                          …
                        </span>
                      );
                    }
                    const isCurrent = pill === effectivePage;
                    return (
                      <button
                        key={pill}
                        type="button"
                        className={`pagination-btn pagination-page-pill ${isCurrent ? 'active' : ''}`}
                        onClick={() => onPageChange?.(pill)}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`Page ${pill + 1}`}
                      >
                        {pill + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="pagination-btn pagination-step-btn"
                  onClick={() => onPageChange?.(effectivePage + 1)}
                  disabled={effectivePage >= totalPages - 1}
                  aria-label="Go to next page"
                >
                  <span className="pagination-btn-text">Next</span>
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  className="pagination-btn pagination-icon-btn"
                  onClick={() => onPageChange?.(totalPages - 1)}
                  disabled={effectivePage >= totalPages - 1}
                  title="Last Page"
                  aria-label="Go to last page"
                >
                  <ChevronsRight size={16} />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
