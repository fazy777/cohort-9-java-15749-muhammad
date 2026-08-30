import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { ContactTable } from './components/ContactTable';
import { ContactFormModal } from './components/ContactFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ContactDetailModal } from './components/ContactDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ImportExportModal } from './components/ImportExportModal';
import { Toast } from './components/Toast';
import { api } from './services/api';

/**
 * Primary dashboard view displaying contact lists, search filters, and coordinating CRUD modal flows.
 *
 * @returns {JSX.Element}
 */
const MainDashboard = () => {
  const { user, loading: authLoading } = useAuth();

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const latestRequestIdRef = useRef(0);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailContact, setDetailContact] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());

  // Debounce search query input by 400ms and reset page to 0
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Clean up pending toast timers on unmount
  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  /**
   * Displays an auto-dismissing toast notification.
   * @param {string} message - text to display
   * @param {'success'|'error'} [type='success'] - toast status type
   */
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    const timerId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimersRef.current.delete(id);
    }, 4000);
    toastTimersRef.current.set(id, timerId);
  }, []);

  /**
   * Removes a toast notification by ID.
   * @param {number|string} id - toast id to remove
   */
  const removeToast = useCallback((id) => {
    const timerId = toastTimersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Fetches paginated contacts from backend API with stale response protection.
   */
  const fetchContacts = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    if (!user) {
      setContacts([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getContacts({
        search: debouncedSearchTerm,
        page,
        size: pageSize,
        sortBy: 'firstName',
        sortDir: 'asc'
      });
      if (requestId === latestRequestIdRef.current && data) {
        setContacts(Array.isArray(data.content) ? data.content : []);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
        setTotalElements(typeof data.totalElements === 'number' ? data.totalElements : 0);
      }
    } catch (err) {
      if (requestId === latestRequestIdRef.current) {
        showToast(err?.message || 'Failed to fetch contacts', 'error');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user, debouncedSearchTerm, page, pageSize, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount/param change
    void fetchContacts();
  }, [fetchContacts]);

  /**
   * Handles contact search string query changes.
   * @param {string} term
   */
  const handleSearchChange = (term) => {
    setSearchTerm(term || '');
  };

  /**
   * Handles pagination page number updates.
   * @param {number} newPage
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 0) {
      setPage(newPage);
    }
  };

  /**
   * Handles pagination page size updates.
   * @param {number} newSize
   */
  const handlePageSizeChange = (newSize) => {
    if (newSize > 0) {
      setPageSize(newSize);
      setPage(0);
    }
  };

  /**
   * Submits create or update payload to API.
   * @param {import('./services/api').ContactDto} contactPayload
   */
  const handleSaveContact = async (contactPayload) => {
    try {
      if (editingContact?.id != null) {
        await api.updateContact(editingContact.id, contactPayload);
        showToast('Contact updated successfully!', 'success');
      } else {
        await api.createContact(contactPayload);
        showToast('Contact created successfully!', 'success');
      }
      await fetchContacts();
    } catch (err) {
      showToast(err?.message || 'Failed to save contact', 'error');
      throw err;
    }
  };

  /**
   * Submits contact deletion request to API and updates page view.
   * @param {number|string} contactId
   */
  const handleDeleteContact = async (contactId) => {
    try {
      if (contactId != null) {
        await api.deleteContact(contactId);
        showToast('Contact deleted successfully!', 'success');
        if (contacts.length === 1 && page > 0) {
          setPage((prev) => prev - 1);
        } else {
          void fetchContacts();
        }
      }
    } catch (err) {
      showToast(err?.message || 'Failed to delete contact', 'error');
      throw err;
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h2>Loading ContactSphere...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} />

      <main className="main-content">
        {!user ? (
          <AuthForm showToast={showToast} />
        ) : (
          <ContactTable
            contacts={contacts}
            totalElements={totalElements}
            totalPages={totalPages}
            currentPage={page}
            pageSize={pageSize}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onOpenCreate={() => {
              setEditingContact(null);
              setIsFormOpen(true);
            }}
            onOpenUpdate={(c) => {
              setEditingContact(c);
              setIsFormOpen(true);
            }}
            onOpenDelete={(c) => {
              setDeletingContact(c);
              setIsDeleteOpen(true);
            }}
            onOpenDetail={(c) => {
              setDetailContact(c);
              setIsDetailOpen(true);
            }}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            loading={loading}
          />
        )}
      </main>

      {/* Modal 1: Create & Edit Modal */}
      <ContactFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
      />

      {/* Modal 2: Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteContact}
        contact={deletingContact}
      />

      {/* Modal 3: Contact Profile Detail View Modal */}
      <ContactDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        contact={detailContact}
        onEdit={(c) => {
          setIsDetailOpen(false);
          setEditingContact(c);
          setIsFormOpen(true);
        }}
        onDelete={(c) => {
          setIsDetailOpen(false);
          setDeletingContact(c);
          setIsDeleteOpen(true);
        }}
      />

      {/* Modal 4: User Profile & Change Password Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        showToast={showToast}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        showToast={showToast}
        onImportSuccess={fetchContacts}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

/**
 * Root Application component wrapped with AuthProvider.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
