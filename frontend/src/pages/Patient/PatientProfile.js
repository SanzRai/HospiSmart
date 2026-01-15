import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeartbeat, FaShieldAlt, FaEdit, FaSave } from 'react-icons/fa';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientModule.css';

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Ram Bahadur Thapa',
    uhid: 'UHID-2024-00123',
    phone: '9841234567',
    email: 'ram.thapa@email.com',
    dob: '1985-05-15',
    gender: 'Male',
    bloodGroup: 'B+',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan',
    ward: '10',
    emergencyContact: '9851234567',
    emergencyName: 'Sita Thapa',
    emergencyRelation: 'Spouse',
    allergies: 'Penicillin',
    conditions: 'Hypertension',
    insurance: 'SSF Active',
    ssfBalance: 15000
  });

  const stats = [
    { label: 'Total Visits', value: 24 },
    { label: 'This Year', value: 8 },
    { label: 'Pending Bills', value: 3 }
  ];

  const handleSave = () => {
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="patient-module">
      <PatientNavbar patientName={profile.name} notificationCount={0} />

      <main className="profile-page patient-container">
        {/* Profile Header */}
        <motion.div className="profile-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="profile-avatar">{profile.name.split(' ').map(n => n[0]).join('')}</div>
          <h1>{profile.name}</h1>
          <p className="uhid">{profile.uhid}</p>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <><FaSave /> Save Changes</> : <><FaEdit /> Edit Profile</>}
          </button>
        </motion.div>

        {/* Stats */}
        <div className="profile-stats">
          {stats.map((stat, idx) => (
            <motion.div key={idx} className="profile-stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <div className="value">{stat.value}</div>
              <div className="label">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Personal Info */}
        <div className="profile-section">
          <h3><FaUser color="#1976D2" /> Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="profile-field">
              <label>Full Name</label>
              {isEditing ? <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /> : <div className="value">{profile.name}</div>}
            </div>
            <div className="profile-field">
              <label>Phone</label>
              {isEditing ? <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /> : <div className="value">{profile.phone}</div>}
            </div>
            <div className="profile-field">
              <label>Email</label>
              {isEditing ? <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /> : <div className="value">{profile.email}</div>}
            </div>
            <div className="profile-field">
              <label>Blood Group</label>
              <div className="value" style={{ color: '#E74C3C', fontWeight: 'bold' }}>{profile.bloodGroup}</div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="profile-section">
          <h3><FaMapMarkerAlt color="#1976D2" /> Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div className="profile-field">
              <label>District</label>
              {isEditing ? <input value={profile.district} onChange={e => setProfile({...profile, district: e.target.value})} /> : <div className="value">{profile.district}</div>}
            </div>
            <div className="profile-field">
              <label>Municipality</label>
              {isEditing ? <input value={profile.municipality} onChange={e => setProfile({...profile, municipality: e.target.value})} /> : <div className="value">{profile.municipality}</div>}
            </div>
            <div className="profile-field">
              <label>Ward</label>
              {isEditing ? <input value={profile.ward} onChange={e => setProfile({...profile, ward: e.target.value})} /> : <div className="value">{profile.ward}</div>}
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="profile-section">
          <h3><FaHeartbeat color="#E74C3C" /> Health Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="profile-field">
              <label>Allergies</label>
              <div className="value" style={{ color: '#E74C3C' }}>{profile.allergies || 'None'}</div>
            </div>
            <div className="profile-field">
              <label>Chronic Conditions</label>
              <div className="value">{profile.conditions || 'None'}</div>
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div className="profile-section">
          <h3><FaShieldAlt color="#27AE60" /> Insurance / SSF</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(39,174,96,0.1)', borderRadius: 12 }}>
            <div>
              <p style={{ fontWeight: 500, color: '#27AE60' }}>{profile.insurance}</p>
              <p style={{ fontSize: 14, color: '#666' }}>Social Security Fund</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#27AE60' }}>Rs {profile.ssfBalance.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#666' }}>Available Balance</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <button className="btn btn-primary btn-block btn-lg" onClick={handleSave}>
            <FaSave /> Save All Changes
          </button>
        )}
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientProfile;
