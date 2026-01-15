import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPills, FaFlask, FaHistory, FaDownload, FaUserMd, FaExclamationCircle } from "react-icons/fa";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import "../../styles/PatientModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientRecords = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Prescriptions
        const presRes = await fetch(`${API_BASE_URL}/prescriptions/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (presRes.ok) setPrescriptions(await presRes.json() || []);

        // Lab Reports (VERIFIED only)
        const labRes = await fetch(`${API_BASE_URL}/lab/patient/${patientId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (labRes.ok) setLabReports(await labRes.json() || []);

        // Visit History (completed visits)
        const histRes = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}/completed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (histRes.ok) setVisitHistory(await histRes.json() || []);

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
      <PatientNavbar patientName="Patient" notificationCount={0} />

      <main className="records-page patient-container">
        <div className="page-header">
          <h1>Medical Records</h1>
          <p>View your prescriptions, lab reports, and visit history</p>
        </div>

        <div className="records-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`records-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon style={{ marginRight: 8 }} /> {tab.label}
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
                          <p>{med.instruction || med.instructions}</p>
                          <div className="medicine-dosage">
                            <span className="dosage-tag">Dosage: {med.dosage}</span>
                            <span className="dosage-tag">Duration: {med.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No medicines prescribed.</p>
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
                      <p>
                        {report.entryTime ? new Date(report.entryTime).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <span className={`lab-report-status ${report.status?.toLowerCase()}`}>
                      {report.status || "Unknown"}
                    </span>
                  </div>

                  {report.status === "VERIFIED" && report.results && Object.keys(report.results).length > 0 && (
                    <>
                      <div className="lab-report-results">
                        {Object.entries(report.results).map(([test, value], idx) => (
                          <div key={idx} className="lab-result-item">
                            <span className="result-name">{test}</span>
                            <span className="result-value">{value}</span>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
                        <FaDownload /> Download PDF
                      </button>
                    </>
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
                <div key={visit.id} className="section-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <FaUserMd color="#1976D2" /> {visit.doctorName || "General OPD"}
                      </h4>
                      <p style={{ fontSize: 14, color: "#666" }}>
                        {visit.department || "General"} • {visit.type || "Visit"}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, color: "#999" }}>
                      {visit.date ? new Date(visit.date).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 8 }}>
                    <p style={{ fontWeight: 500, marginBottom: 8 }}>
                      Diagnosis: {visit.diagnosis || "Not recorded"}
                    </p>
                    <p style={{ fontSize: 14, color: "#666" }}>
                      {visit.notes || "No additional notes"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientRecords;