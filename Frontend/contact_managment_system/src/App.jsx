import { useState, useEffect, useCallback } from 'react';
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

const MainDashboard = () => {
  const { user, loading: authLoading } = useAuth();

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getContacts({
        search: searchTerm,
        page,
        size: pageSize,
        sortBy: 'firstName',
        sortDir: 'asc'
      });
      if (data) {
        setContacts(Array.isArray(data.content) ? data.content : []);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
        setTotalElements(typeof data.totalElements === 'number' ? data.totalElements : 0);
      }
    } catch (err) {
      showToast(err?.message || 'Failed to fetch contacts', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, page, pageSize, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount/param change
    void fetchContacts();
  }, [fetchContacts]);

  const handleSearchChange = (term) => {
    setSearchTerm(term || '');
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (newSize > 0) {
      setPageSize(newSize);
      setPage(0);
    }
  };

  // Create & Update Contact Handler
  const handleSaveContact = async (contactPayload) => {
    try {
      if (editingContact?.id != null) {
        await api.updateContact(editingContact.id, contactPayload);
        showToast('Contact updated successfully!', 'success');
      } else {
        await api.createContact(contactPayload);
        showToast('Contact created successfully!', 'success');
      }
      fetchContacts();
    } catch (err) {
      showToast(err?.message || 'Failed to save contact', 'error');
      throw err;
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (contactId) => {
    try {
      if (contactId != null) {
        await api.deleteContact(contactId);
        showToast('Contact deleted successfully!', 'success');
        fetchContacts();
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

      {/* Modal 1 & Modal 2: Create / Update Contact Modal */}
      <ContactFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
      />

      {/* Modal 3: Delete Contact Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteContact}
        contact={deletingContact}
      />

      {/* View Detail Profile Modal */}
      <ContactDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        contact={detailContact}
        onEdit={(c) => {
          setEditingContact(c);
          setIsFormOpen(true);
        }}
        onDelete={(c) => {
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

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
