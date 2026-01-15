import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlus, FaUser, FaPhone, FaTimes, FaCalendarPlus } from 'react-icons/fa';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientModule.css';

const PatientFamily = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: '', phone: '' });

  const familyMembers = [
    { id: 1, name: 'Sita Thapa', relation: 'Spouse', phone: '9851234567', uhid: 'UHID-2024-00124' },
    { id: 2, name: 'Aarav Thapa', relation: 'Son', phone: '9861234567', uhid: 'UHID-2024-00125' },
    { id: 3, name: 'Priya Thapa', relation: 'Daughter', phone: '9871234567', uhid: 'UHID-2024-00126' }
  ];

  const relations = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other'];

  const handleAddMember = () => {
    alert(`Added ${newMember.name} as ${newMember.relation}`);
    setShowAddModal(false);
    setNewMember({ name: '', relation: '', phone: '' });
  };

  return (
    <div className="patient-module">
      <PatientNavbar patientName="Ram Bahadur" notificationCount={0} />

      <main className="family-page patient-container">
        <div className="page-header">
          <h1>Family Accounts</h1>
          <p>Manage linked family members for easy booking</p>
        </div>

        {/* Family Members List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {familyMembers.map((member, idx) => (
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
                <p style={{ fontSize: 12, color: '#1976D2' }}>{member.uhid}</p>
              </div>
              <button className="btn btn-primary" style={{ padding: '8px 16px' }}>
                <FaCalendarPlus /> Book
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Add New Button */}
        <button className="add-family-button" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add Family Member
        </button>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="payment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="payment-modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20 }}><FaUsers /> Add Family Member</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="Enter full name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Relation</label>
                <select value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value})}>
                  <option value="">Select relation...</option>
                  {relations.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input placeholder="98XXXXXXXX" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={handleAddMember} disabled={!newMember.name || !newMember.relation || !newMember.phone}>
                Add Member
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PatientFooter />
    </div>
  );
};

export default PatientFamily;
