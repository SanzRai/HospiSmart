import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPills, FaFlask, FaHistory, FaDownload, FaUserMd, FaExclamationCircle, FaPhone } from "react-icons/fa";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import "../../styles/PatientRecords.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientRecords = () => {
  const storedPatientInfo = JSON.parse(localStorage.getItem("patientInfo") || "{}");
  const patientDisplayName = 
    storedPatientInfo.fullName || 
    storedPatientInfo.name || 
    storedPatientInfo.full_name || 
    "Patient";

  const [activeTab, setActiveTab] = useState("prescriptions");
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const patientId = localStorage.getItem("patientId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !patientId) {
      setError("Please login to view your medical records");
      setLoading(false);
      return;
    }

    const fetchRecords = async () => {
      try {
        setLoading(true);

        const presRes = await fetch(`${API_BASE_URL}/prescriptions/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (presRes.ok) setPrescriptions(await presRes.json() || []);

        const labRes = await fetch(`${API_BASE_URL}/lab/patient/${patientId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (labRes.ok) setLabReports(await labRes.json() || []);

        const histRes = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}/completed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (histRes.ok) setVisitHistory(await histRes.json() || []);

        setNotifications([
          { id: 'info-1', type: 'info', title: 'Records Update', message: 'Check your latest lab reports', icon: FaFlask }
        ]);

      } catch (err) {
        setError("Failed to load records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [patientId, token]);

  const tabs = [
    { id: "prescriptions", label: "Prescriptions", icon: FaPills },
    { id: "lab", label: "Lab Reports", icon: FaFlask },
    { id: "history", label: "Visit History", icon: FaHistory },
  ];

  if (loading) return <div className="loading">Loading your medical records...</div>;

  if (error) {
    return (
      <div className="error-message">
        <FaExclamationCircle /> {error}
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar 
        patientInfo={{ name: patientDisplayName }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.length}
      />

      <main className="records-page patient-container">
        <div className="page-header">
          <h1>Medical Records</h1>
          <p className="page-subtitle">
            View your prescriptions, lab reports, and complete visit history in one place
          </p>
        </div>

        <div className="records-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`records-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "prescriptions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {prescriptions.length === 0 ? (
              <p className="no-data">No prescriptions found.</p>
            ) : (
              prescriptions.map((rx) => (
                <div key={rx.id} className="prescription-card">
                  <div className="prescription-header">
                    <div>
                      <h4>{rx.doctorName || "Unknown Doctor"}</h4>
                      <p>{rx.department || "General"}</p>
                    </div>
                    <div className="prescription-date">
                      {rx.visitDate ? new Date(rx.visitDate).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  {rx.medicines?.length > 0 ? (
                    rx.medicines.map((med, idx) => (
                      <div key={idx} className="medicine-item">
                        <div className="medicine-icon"><FaPills /></div>
                        <div className="medicine-details">
                          <h5>{med.name}</h5>
                          <p className="instruction">{med.instruction || med.instructions || "No instructions"}</p>
                          <div className="medicine-dosage">
                            <span className="dosage-tag">Dosage: {med.dosage || "—"}</span>
                            <span className="dosage-tag">Duration: {med.duration || "—"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-items">No medicines prescribed.</p>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "lab" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {labReports.length === 0 ? (
              <p className="no-data">No lab reports available.</p>
            ) : (
              labReports.map((report) => (
                <div key={report.id} className="lab-report-card">
                  <div className="lab-report-header">
                    <div>
                      <h4>{report.testName || "Lab Test"}</h4>
                      <p className="report-date">
                        {report.entryTime ? new Date(report.entryTime).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <span className={`lab-report-status ${report.status?.toLowerCase()}`}>
                      {report.status || "Unknown"}
                    </span>
                  </div>

                  {report.status === "VERIFIED" && report.results && Object.keys(report.results).length > 0 && (
                    <div className="lab-report-results">
                      {Object.entries(report.results).map(([test, value], idx) => (
                        <div key={idx} className="lab-result-item">
                          <span className="result-name">{test}</span>
                          <span className="result-value">{value}</span>
                        </div>
                      ))}
                      <button className="btn btn-outline download-btn">
                        <FaDownload /> Download PDF Report
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {visitHistory.length === 0 ? (
              <p className="no-data">No visit history found.</p>
            ) : (
              visitHistory.map((visit) => (
                <div key={visit.id} className="visit-history-card">
                  <div className="visit-header">
                    <div className="visit-doctor">
                      <FaUserMd className="doctor-icon" />
                      <div>
                        <h4>{visit.doctorName || "General OPD"}</h4>
                        <p className="department">{visit.department || "General"} • {visit.type || "Consultation"}</p>
                      </div>
                    </div>
                    <div className="visit-date">
                      {visit.date ? new Date(visit.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "—"}
                    </div>
                  </div>

                  <div className="visit-details">
                    <div className="detail-item">
                      <span className="detail-label">Diagnosis:</span>
                      <span className="detail-value">{visit.diagnosis || "Not recorded"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value notes">{visit.notes || "No additional notes provided"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
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

      <PatientFooter />
    </div>
  );
};

export default PatientRecords;