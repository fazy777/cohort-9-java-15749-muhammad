import { Search, Plus, Edit, Trash2, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Data table component rendering contact listings, search filter, action buttons, and pagination controls.
 *
 * @param {{
 *   contacts?: Array<Object>,
 *   totalElements?: number,
 *   totalPages?: number,
 *   currentPage?: number,
 *   pageSize?: number,
 *   searchTerm?: string,
 *   onSearchChange?: (val: string) => void,
 *   onPageChange?: (page: number) => void,
 *   onPageSizeChange?: (size: number) => void,
 *   onOpenCreate?: () => void,
 *   onOpenUpdate?: (c: Object) => void,
 *   onOpenDelete?: (c: Object) => void,
 *   onOpenDetail?: (c: Object) => void,
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

  /**
   * Returns styling class for email/phone badge labels.
   * @param {string} label
   * @returns {string}
   */
  const getLabelClass = (label) => {
    switch (label?.toUpperCase()) {
      case 'WORK': return 'badge-work';
      case 'PERSONAL': return 'badge-personal';
      case 'HOME': return 'badge-home';
      case 'MOBILE': return 'badge-mobile';
      default: return 'badge-other';
    }
  };

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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
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
                            <span className={`badge ${getLabelClass(primaryEmail.label)}`}>{primaryEmail.label || 'WORK'}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      <td>
                        {primaryPhone?.phoneNumber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{primaryPhone.phoneNumber}</span>
                            <span className={`badge ${getLabelClass(primaryPhone.label)}`}>{primaryPhone.label || 'WORK'}</span>
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
                            title="View Contact Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => onOpenUpdate?.(c)}
                            title="Edit Contact"
                          >
                            <Edit size={16} color="var(--accent-primary)" />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => onOpenDelete?.(c)}
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
          <div className="pagination-container" style={{ margin: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Showing Page <strong style={{ color: 'var(--text-main)' }}>{currentPage + 1}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalPages || 1}</strong> ({totalElements} total contacts)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="input-control"
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>

              {totalPages > 1 && (
                <>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
