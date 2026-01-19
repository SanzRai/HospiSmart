import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeartbeat, 
  FaShieldAlt, FaEdit, FaSave, FaSpinner, FaCheckCircle, 
  FaExclamationCircle, FaTimes 
} from 'react-icons/fa';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientProfile.css';

const API_BASE_URL = "http://localhost:8080/api";

const PatientProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    uhid: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    district: '',
    municipality: '',
    ward: '',
    emergencyContact: '',
    allergies: '',
    conditions: '',
    insurance: '',
    ssfBalance: 0
  });

  // Form state for editing (separate so original profile stays safe)
  const [editForm, setEditForm] = useState({ ...profile });

  const token = localStorage.getItem('token');
  const patientId = localStorage.getItem('patientId');

  // Toast helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!patientId || !token) {
      setError("Please login to view profile");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();

        const loadedProfile = {
          name: data.fullName || data.full_name || '',
          uhid: data.uhid || '',
          phone: data.phoneNumber || '',
          email: data.email || '',
          dob: data.dateOfBirth || '',
          gender: data.gender || '',
          district: data.address?.district || '',
          municipality: data.address?.municipality || '',
          ward: data.address?.ward || '',
          emergencyContact: data.emergencyContact || '',
          allergies: data.allergies || '',
          conditions: data.conditions || '',
          insurance: data.insuranceProvider || 'None',
          ssfBalance: data.ssfBalance || 0
        };

        setProfile(loadedProfile);
        setEditForm(loadedProfile);

        // Helpful notification
        setNotifications([
          {
            id: 'profile-1',
            type: 'info',
            title: 'Profile Info',
            message: 'Keep your information up-to-date for better care',
            icon: FaUser
          }
        ]);
      } catch (err) {
        setError(err.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [patientId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        fullName: editForm.name,
        email: editForm.email,
        phoneNumber: editForm.phone,
        dateOfBirth: editForm.dob,
        gender: editForm.gender,
        address: {
          district: editForm.district,
          municipality: editForm.municipality,
          ward: editForm.ward
        },
        emergencyContact: editForm.emergencyContact,
        allergies: editForm.allergies,
        conditions: editForm.conditions
      };

      const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile");
      }

      // Update main profile
      setProfile({ ...editForm });
      setShowEditModal(false);
      showToast('success', "Profile updated successfully!");
    } catch (err) {
      showToast('error', err.message || "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-module loading">
        <FaSpinner className="spinner" /> Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-module error-message">
        <FaExclamationCircle /> {error}
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar 
        patientInfo={{ name: profile.name || "Patient" }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.length}
      />

      <main className="profile-page patient-container">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`toast ${toast.type}`}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <motion.div className="profile-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="profile-avatar">
            {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'P'}
          </div>
          <h1>{profile.name || 'Patient'}</h1>
          <p className="uhid">{profile.uhid || 'UHID not available'}</p>

          <button 
            className="btn btn-outline edit-btn"
            onClick={() => setShowEditModal(true)}
          >
            <FaEdit /> Edit Profile
          </button>
        </motion.div>


        {/* Personal Info */}
        <div className="profile-section">
          <h3><FaUser /> Personal Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <div className="value">{profile.name || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Phone</label>
              <div className="value">{profile.phone || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Email</label>
              <div className="value">{profile.email || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Gender</label>
              <div className="value">{profile.gender || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Date of Birth</label>
              <div className="value">{profile.dob || 'Not set'}</div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="profile-section">
          <h3><FaMapMarkerAlt /> Address</h3>
          <div className="profile-grid three-col">
            <div className="profile-field">
              <label>District</label>
              <div className="value">{profile.district || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Municipality</label>
              <div className="value">{profile.municipality || 'Not set'}</div>
            </div>
            <div className="profile-field">
              <label>Ward</label>
              <div className="value">{profile.ward || 'Not set'}</div>
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="profile-section">
          <h3><FaHeartbeat /> Health Information</h3>
          <div className="profile-field">
            <label>Allergies</label>
            <div className="value">{profile.allergies || 'None reported'}</div>
          </div>
          <div className="profile-field">
            <label>Chronic Conditions</label>
            <div className="value">{profile.conditions || 'None reported'}</div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="profile-section">
          <h3><FaPhone /> Emergency Contact</h3>
          <div className="profile-field">
            <label>Contact Number</label>
            <div className="value">{profile.emergencyContact || 'Not set'}</div>
          </div>
        </div>

        {/* Insurance / SSF */}
        <div className="profile-section insurance-section">
          <h3><FaShieldAlt /> Insurance / Social Security Fund</h3>
          <div className="insurance-card">
            <div className="insurance-info">
              <p className="insurance-provider">{profile.insurance}</p>
              <p className="insurance-desc">Social Security Fund / Insurance Provider</p>
            </div>
            <div className="insurance-balance">
              <p className="balance-amount">Rs {profile.ssfBalance.toLocaleString()}</p>
              <p className="balance-label">Available Balance</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Emergency Button */}
      <motion.button
        className="emergency-button"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.href = 'tel:1134'}
        aria-label="Emergency Call 1134"
      >
        <FaPhone />
      </motion.button>

      <PatientFooter />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content profile-modal"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="modal-header">
                <h2><FaEdit /> Edit Profile</h2>
                <button 
                  className="close-btn" 
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      name="name" 
                      value={editForm.name} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      name="phone" 
                      value={editForm.phone} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      name="email" 
                      type="email" 
                      value={editForm.email} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={editForm.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input 
                      name="dob" 
                      type="date" 
                      value={editForm.dob} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>District</label>
                    <input 
                      name="district" 
                      value={editForm.district} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Municipality</label>
                    <input 
                      name="municipality" 
                      value={editForm.municipality} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Ward</label>
                    <input 
                      name="ward" 
                      value={editForm.ward} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Emergency Contact Number</label>
                    <input 
                      name="emergencyContact" 
                      value={editForm.emergencyContact} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Allergies</label>
                    <textarea 
                      name="allergies" 
                      value={editForm.allergies} 
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Penicillin, Nuts, etc."
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Chronic Conditions</label>
                    <textarea 
                      name="conditions" 
                      value={editForm.conditions} 
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Hypertension, Diabetes, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <> <FaSpinner className="spinner-small" /> Saving... </>
                  ) : (
                    <> <FaSave /> Save Changes </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientProfile;