import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarCheck, FaFileMedical, FaFlask, FaClock, FaArrowRight,
  FaHeartbeat, FaPills, FaStethoscope, FaPhoneAlt, FaAmbulance
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8080/api";

const PatientHome = ({ patientInfo, setActiveView }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingReports: 0,
    activePrescriptions: 0,
    pendingBills: 0,
  });
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming appointments
      const aptRes = await fetch(`${API_BASE_URL}/patient-portal/appointments/${patientInfo.id}`);
      if (aptRes.ok) {
        const apts = await aptRes.json();
        const upcoming = apts.filter(a => new Date(a.appointmentDate) >= new Date());
        setStats(prev => ({ ...prev, upcomingAppointments: upcoming.length }));
        if (upcoming.length > 0) {
          setUpcomingAppointment(upcoming[0]);
        }
      }

      // Fetch prescriptions
      const rxRes = await fetch(`${API_BASE_URL}/patient-portal/prescriptions/${patientInfo.id}`);
      if (rxRes.ok) {
        const prescriptions = await rxRes.json();
        setRecentPrescriptions(prescriptions.slice(0, 3));
        setStats(prev => ({ ...prev, activePrescriptions: prescriptions.length }));
      }

      // Fetch pending reports
      const labRes = await fetch(`${API_BASE_URL}/lab/patient/${patientInfo.id}/reports`);
      if (labRes.ok) {
        const labs = await labRes.json();
        const pending = labs.filter(l => l.status !== "VERIFIED");
        setStats(prev => ({ ...prev, pendingReports: pending.length }));
      }

      // Check queue status (live tracking)
      const queueRes = await fetch(`${API_BASE_URL}/patient-portal/queue-status/${patientInfo.id}`);
      if (queueRes.ok) {
        setQueueStatus(await queueRes.json());
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: <FaCalendarCheck />, label: "Book Appointment", action: () => navigate("/appointment"), color: "#3b82f6" },
    { icon: <FaFileMedical />, label: "View Records", action: () => setActiveView("records"), color: "#10b981" },
    { icon: <FaFlask />, label: "Lab Reports", action: () => setActiveView("records"), color: "#8b5cf6" },
    { icon: <FaAmbulance />, label: "Emergency", action: () => window.open("tel:102"), color: "#ef4444" },
  ];

  const healthSummary = {
    lastVisit: patientInfo.lastVisitDate || "No visits yet",
    bloodGroup: patientInfo.bloodGroup || "Not recorded",
    allergies: patientInfo.allergies || "None recorded",
    conditions: patientInfo.chronicConditions || "None recorded",
  };

  return (
    <div className="patient-home">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back, {patientInfo.fullName?.split(" ")[0] || "Patient"}! 👋</h1>
          <p>Here's your health overview for today</p>
        </div>
        <div className="date-display">
          {new Date().toLocaleDateString("en-NP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map((action, i) => (
          <button key={i} className="quick-action-card" onClick={action.action} style={{ "--accent": action.color }}>
            <div className="action-icon">{action.icon}</div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Live Queue Status */}
      {queueStatus && queueStatus.inQueue && (
        <div className="queue-status-card">
          <div className="queue-icon"><FaClock /></div>
          <div className="queue-info">
            <h3>You're in the queue!</h3>
            <p>Position: <strong>#{queueStatus.position}</strong> | Estimated wait: <strong>{queueStatus.estimatedWait} mins</strong></p>
          </div>
          <div className="queue-token">{queueStatus.tokenNumber}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue" onClick={() => setActiveView("appointments")}>
          <div className="stat-icon"><FaCalendarCheck /></div>
          <div className="stat-info">
            <h3>{stats.upcomingAppointments}</h3>
            <p>Upcoming Appointments</p>
          </div>
        </div>
        <div className="stat-card green" onClick={() => setActiveView("records")}>
          <div className="stat-icon"><FaPills /></div>
          <div className="stat-info">
            <h3>{stats.activePrescriptions}</h3>
            <p>Prescriptions</p>
          </div>
        </div>
        <div className="stat-card purple" onClick={() => setActiveView("records")}>
          <div className="stat-icon"><FaFlask /></div>
          <div className="stat-info">
            <h3>{stats.pendingReports}</h3>
            <p>Pending Reports</p>
          </div>
        </div>
        <div className="stat-card amber" onClick={() => setActiveView("billing")}>
          <div className="stat-icon"><FaHeartbeat /></div>
          <div className="stat-info">
            <h3>{stats.pendingBills}</h3>
            <p>Pending Bills</p>
          </div>
        </div>
      </div>

      <div className="home-grid">
        {/* Upcoming Appointment */}
        <div className="home-card upcoming-apt">
          <div className="card-header">
            <h3><FaCalendarCheck /> Next Appointment</h3>
            <button onClick={() => setActiveView("appointments")}>View All <FaArrowRight /></button>
          </div>
          <div className="card-content">
            {upcomingAppointment ? (
              <div className="appointment-preview">
                <div className="apt-date">
                  <span className="day">{new Date(upcomingAppointment.appointmentDate).getDate()}</span>
                  <span className="month">{new Date(upcomingAppointment.appointmentDate).toLocaleString("default", { month: "short" })}</span>
                </div>
                <div className="apt-details">
                  <h4>{upcomingAppointment.doctorName}</h4>
                  <p>{upcomingAppointment.department}</p>
                  <span className="time"><FaClock /> {upcomingAppointment.appointmentTime}</span>
                </div>
                <div className="apt-token">{upcomingAppointment.tokenNumber}</div>
              </div>
            ) : (
              <div className="empty-state">
                <FaCalendarCheck />
                <p>No upcoming appointments</p>
                <button onClick={() => navigate("/appointment")}>Book Now</button>
              </div>
            )}
          </div>
        </div>

        {/* Health Summary */}
        <div className="home-card health-summary">
          <div className="card-header">
            <h3><FaHeartbeat /> Health Summary</h3>
            <button onClick={() => setActiveView("profile")}>Update <FaArrowRight /></button>
          </div>
          <div className="card-content">
            <div className="summary-grid">
              <div className="summary-item">
                <label>Last Visit</label>
                <span>{healthSummary.lastVisit}</span>
              </div>
              <div className="summary-item">
                <label>Blood Group</label>
                <span>{healthSummary.bloodGroup}</span>
              </div>
              <div className="summary-item">
                <label>Allergies</label>
                <span>{healthSummary.allergies}</span>
              </div>
              <div className="summary-item">
                <label>Conditions</label>
                <span>{healthSummary.conditions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="home-card prescriptions-card">
          <div className="card-header">
            <h3><FaPills /> Recent Prescriptions</h3>
            <button onClick={() => setActiveView("records")}>View All <FaArrowRight /></button>
          </div>
          <div className="card-content">
            {recentPrescriptions.length > 0 ? (
              <div className="prescription-list">
                {recentPrescriptions.map((rx, i) => (
                  <div key={i} className="rx-item">
                    <div className="rx-info">
                      <strong>{rx.diagnosis}</strong>
                      <small>{rx.doctorName} • {new Date(rx.visitDate).toLocaleDateString()}</small>
                    </div>
                    <span className="rx-count">{rx.medicines?.length || 0} meds</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <p>No recent prescriptions</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="home-card emergency-card">
          <div className="card-header">
            <h3><FaPhoneAlt /> Emergency</h3>
          </div>
          <div className="card-content">
            <div className="emergency-numbers">
              <a href="tel:102" className="emergency-btn ambulance">
                <FaAmbulance /> Ambulance: 102
              </a>
              <a href="tel:01-4444444" className="emergency-btn hospital">
                <FaStethoscope /> Hospital: 01-4444444
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHome;
