import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaPlus, FaUser, FaPhone, FaTimes, 
  FaCalendarPlus, FaSpinner, FaTrash, 
  FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientFamily.css';

const API_BASE_URL = "http://localhost:8080/api";

const PatientFamily = () => {
  const navigate = useNavigate();

  const storedPatientInfo = JSON.parse(localStorage.getItem('patientInfo') || '{}');
  const patientName = storedPatientInfo.fullName || 
                     storedPatientInfo.name || 
                     storedPatientInfo.full_name || 
                     "Patient";

  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const token = localStorage.getItem('token');
  const patientId = localStorage.getItem('patientId');

  const relations = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other'];

  useEffect(() => {
    const fetchFamily = async () => {
      if (!patientId || !token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/family/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to load family members");
        }

        const data = await res.json();
        setFamilyMembers(data || []);
      } catch (err) {
        setError(err.message || "Could not load family members");
      } finally {
        setLoading(false);
      }
    };

    setNotifications([
      {
        id: 'fam-1',
        type: 'info',
        title: 'Family Booking',
        message: 'Add family members to easily book appointments for them',
        icon: FaUsers
      },
      {
        id: 'fam-2',
        type: 'tip',
        title: 'Quick Tip',
        message: 'Phone number helps in faster verification during visits',
        icon: FaPhone
      }
    ]);

    fetchFamily();
  }, [patientId, token]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddMember = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: newMember.name.trim(),
        relation: newMember.relation,
        phone: newMember.phone.trim(),
        primaryPatientId: Number(patientId)
      };

      const res = await fetch(`${API_BASE_URL}/family/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add family member");
      }

      const addedMember = await res.json();
      setFamilyMembers(prev => [...prev, addedMember]);

      setShowAddModal(false);
      setNewMember({ name: '', relation: '', phone: '' });
      showToast('success', `${newMember.name} added as ${newMember.relation}!`);
    } catch (err) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const initiateDelete = (memberId) => {
    setMemberToDelete(memberId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    setDeletingId(memberToDelete);
    setShowConfirmDelete(false);

    try {
      const res = await fetch(`${API_BASE_URL}/family/${memberToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete family member");
      }

      setFamilyMembers(prev => prev.filter(m => m.id !== memberToDelete));
      showToast('success', "Family member removed successfully");
    } catch (err) {
      showToast('error', err.message || "Could not remove family member");
    } finally {
      setDeletingId(null);
      setMemberToDelete(null);
    }
  };

  const handleBookForMember = (member) => {
    navigate('/patient/appointments', { 
      state: { 
        forFamily: true,
        familyMember: member 
      } 
    });
  };

  if (loading) {
    return (
      <div className="patient-module loading">
        <FaSpinner className="spinner" /> Loading family members...
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar 
        patientInfo={{ name: patientName }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.length}
      />

      <main className="family-page patient-container">
        <AnimatePresence>
          {toast && (
            <motion.div 
              className={`toast ${toast.type}`}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              key={`toast-${Date.now()}`}
            >
              {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="page-header">
          <h1>Family Accounts</h1>
          <p>Manage linked family members for easy booking</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-popup"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FaExclamationCircle />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="close-error">
                <FaTimes />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {familyMembers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', margin: '40px 0', fontSize: '1.1rem' }}>
              No family members added yet. Add one to book appointments for them!
            </div>
          ) : (
            familyMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                className="family-member-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="family-member-avatar">
                  <FaUser />
                </div>
                <div className="family-member-info" style={{ flex: 1 }}>
                  <h4>{member.name}</h4>
                  <p>{member.relation} • {member.phone}</p>
                  <p style={{ fontSize: 12, color: '#1976D2' }}>
                    {member.uhid || 'No UHID yet'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '8px 16px' }}
                    onClick={() => handleBookForMember(member)}
                  >
                    <FaCalendarPlus /> Book
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '8px 12px' }}
                    onClick={() => initiateDelete(member.id)}
                    disabled={deletingId === member.id}
                  >
                    {deletingId === member.id ? (
                      <FaSpinner className="spinner-small" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        <button className="add-family-button" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add Family Member
        </button>
      </main>

      <motion.button 
        className="emergency-button"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.href = 'tel:1134'}
        aria-label="Emergency Call 1134"
      >
        <FaPhone />
      </motion.button>

      <AnimatePresence>
        {showAddModal && (
          <motion.div className="payment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="payment-modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20 }}><FaUsers /> Add Family Member</h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    className="error-popup inline"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <FaExclamationCircle />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="close-error">
                      <FaTimes />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  placeholder="Enter full name" 
                  value={newMember.name} 
                  onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Relation *</label>
                <select 
                  value={newMember.relation} 
                  onChange={e => setNewMember(prev => ({ ...prev, relation: e.target.value }))}
                  required
                >
                  <option value="">Select relation...</option>
                  {relations.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  placeholder="98XXXXXXXX" 
                  value={newMember.phone} 
                  onChange={e => setNewMember(prev => ({ ...prev, phone: e.target.value }))} 
                  required
                />
              </div>

              <button 
                className="btn btn-primary btn-block btn-lg" 
                onClick={handleAddMember}
                disabled={saving || !newMember.name.trim() || !newMember.relation || !newMember.phone.trim()}
              >
                {saving ? <FaSpinner className="spinner-small" /> : 'Add Member'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3>Remove Family Member?</h3>
              <p style={{ color: '#4b5563', margin: '12px 0 24px' }}>
                This action cannot be undone. Are you sure you want to remove this family member?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setMemberToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                >
                  {deletingId !== null ? <FaSpinner className="spinner-small" /> : 'Yes, Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PatientFooter />
    </div>
  );
};

export default PatientFamily;