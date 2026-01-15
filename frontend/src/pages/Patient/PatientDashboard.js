import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaCalendarPlus, FaUsers, FaFileAlt, FaMoneyBillWave, 
  FaPhone, FaStethoscope, FaClock, FaBell, 
  FaCheckCircle, FaExclamationCircle 
} from "react-icons/fa";
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientModule.css';

const API_BASE_URL = "http://localhost:8080/api";

const PatientDashboard = () => {
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState({
    name: '',
    uhid: '',
    phone: '',
    lastVisit: ''
  });
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth data from localStorage (consistent with your Login page)
  const token = localStorage.getItem('token');
  const patientId = localStorage.getItem('patientId');
  const patientPhone = localStorage.getItem('patientPhone');

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !patientId || !patientPhone) {
        setError("Please login to view dashboard");
        setLoading(false);
        return;
      }

      try {
        // 1. Get patient profile
        const patientRes = await fetch(`${API_BASE_URL}/patients/search?phone=${patientPhone}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!patientRes.ok) throw new Error("Failed to load patient profile");

        const patientData = await patientRes.json();
        setPatient({
          name: patientData.fullName || '',
          uhid: patientData.uhid || '',
          phone: patientData.phoneNumber || '',
          lastVisit: patientData.lastModifiedAt 
            ? new Date(patientData.lastModifiedAt).toISOString().split('T')[0] 
            : ''
        });

        // 2. Get upcoming bookings
        const bookingsRes = await fetch(`${API_BASE_URL}/bookings/online-recent`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!bookingsRes.ok) throw new Error("Failed to load bookings");

        const bookingsData = await bookingsRes.json();
        const allAppointments = [...(bookingsData.opd || []), ...(bookingsData.appointments || [])];

        const patientAppointments = allAppointments.filter(
          apt => apt.phone === patientPhone || apt.patientPhone === patientPhone
        );

        const today = new Date().toISOString().split('T')[0];
        const upcoming = patientAppointments
          .filter(apt => {
            const aptDate = apt.appointmentDate || apt.bookedAt || today;
            return aptDate >= today && apt.status !== 'COMPLETED' && apt.status !== 'ABSENT';
          })
          .sort((a, b) => {
            const dateA = new Date(a.appointmentDate || a.bookedAt || today);
            const dateB = new Date(b.appointmentDate || b.bookedAt || today);
            return dateA - dateB;
          });

        setUpcomingAppointments(upcoming);

        // 3. Get pending bills
        const pendingRes = await fetch(`${API_BASE_URL}/billing/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!pendingRes.ok) throw new Error("Failed to load pending bills");

        const pendingData = await pendingRes.json();
        const patientPending = pendingData.filter(
          bill => bill.patientName === patientData.fullName || bill.phone === patientPhone
        );
        const totalDue = patientPending.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        setPendingAmount(totalDue);

        // 4. Get prescription history for last visit
        const historyRes = await fetch(`${API_BASE_URL}/doctor-portal/history/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (historyRes.ok) {
          const history = await historyRes.json();
          if (history.length > 0) {
            const lastVisitDate = new Date(history[0].visitDate).toISOString().split('T')[0];
            setPatient(prev => ({ ...prev, lastVisit: lastVisitDate }));
          }
        }

        // 5. Get recent lab reports for notifications
        const reportsRes = await fetch(`${API_BASE_URL}/lab/patient/${patientId}/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let recentReports = [];
        if (reportsRes.ok) {
          const reports = await reportsRes.json();
          recentReports = reports.filter(r => 
            r.status === 'VERIFIED' && 
            new Date(r.verificationTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
        }

        // Generate notifications
        const generatedNotifications = [];

        if (upcoming.length > 0) {
          generatedNotifications.push({
            id: 'queue',
            type: 'info',
            title: 'Queue Update',
            message: `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`,
            icon: FaClock
          });
        }

        recentReports.forEach((report, index) => {
          generatedNotifications.push({
            id: `report-${index}`,
            type: 'success',
            title: 'Report Ready',
            message: `${report.testName} results available`,
            icon: FaCheckCircle
          });
        });

        if (totalDue > 0) {
          generatedNotifications.push({
            id: 'payment',
            type: 'warning',
            title: 'Payment Due',
            message: `Invoice pending - Rs ${totalDue.toLocaleString()}`,
            icon: FaExclamationCircle
          });
        }

        setNotifications(generatedNotifications);
        setNotificationCount(generatedNotifications.length);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const quickActions = [
    { icon: FaCalendarPlus, label: 'Book OPD', desc: 'Get token', path: '/appointment', color: 'blue' },
    { icon: FaUsers, label: 'Live Queue', desc: 'Track position', path: '/patient/queue', color: 'green' },
    { icon: FaFileAlt, label: 'My Reports', desc: 'View records', path: '/patient/records', color: 'orange' },
    { icon: FaMoneyBillWave, label: 'Pay Bills', desc: pendingAmount > 0 ? `Rs ${pendingAmount.toLocaleString()} due` : 'No dues', path: '/patient/billing', color: 'purple' }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return { day: '--', month: '' };
    const date = new Date(dateStr);
    return { 
      day: date.getDate(), 
      month: date.toLocaleString('default', { month: 'short' }) 
    };
  };

  if (loading) {
    return <div className="patient-module loading">Loading your dashboard...</div>;
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
      <PatientNavbar patientName={patient.name} notificationCount={notificationCount} />

      <main className="patient-dashboard patient-container">
        {/* Welcome Banner */}
        <motion.div 
          className="welcome-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Namaste, {patient.name.split(' ')[0] || 'Patient'}! 🙏</h1>
          <p>Welcome to HospiSmart Patient Portal</p>
          <div className="welcome-banner-info">
            <div className="welcome-banner-item">
              <FaStethoscope /> UHID: {patient.uhid || 'N/A'}
            </div>
            <div className="welcome-banner-item">
              <FaPhone /> {patient.phone || 'N/A'}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              className="quick-action-card"
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`quick-action-icon ${action.color}`}>
                <action.icon />
              </div>
              <h3>{action.label}</h3>
              <p>{action.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <motion.div 
          className="section-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="section-card-header">
            <h2><FaCalendarPlus /> Upcoming Appointments</h2>
            <span className="view-all" onClick={() => navigate('/appointment')}>Book New</span>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p className="no-data">No upcoming appointments</p>
          ) : (
            upcomingAppointments.map(apt => {
              const { day, month } = formatDate(apt.appointmentDate || apt.bookedAt);
              return (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-date">
                    <span className="day">{day}</span>
                    <span className="month">{month}</span>
                  </div>
                  <div className="appointment-details">
                    <h4>{apt.doctorName || 'General OPD'}</h4>
                    <p>{apt.department || 'General'}</p>
                    <p>{apt.appointmentTime || 'Queue'}</p>
                    <span className="appointment-token">{apt.tokenNumber}</span>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div 
          className="section-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="section-card-header">
            <h2><FaBell /> Recent Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <p className="no-data">No new notifications</p>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className="notification-item">
                <div className={`notification-icon ${notif.type}`}>
                  <notif.icon />
                </div>
                <div className="notification-content">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Emergency Button */}
        <motion.button 
          className="emergency-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = 'tel:1134'}
        >
          <FaPhone /> Emergency: Call 1134
        </motion.button>
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientDashboard;