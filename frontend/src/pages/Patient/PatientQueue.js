import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaSync, FaCheckCircle,FaCalendarPlus, FaExclamationCircle, FaClock, FaUser, FaBell, FaFilter, FaPhone 
} from "react-icons/fa";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import useWebSocket from "../../hooks/useWebSocket";
import "../../styles/PatientQueue.css"; 

const API_BASE_URL = "http://localhost:8080/api";

const PatientQueue = () => {
  const navigate = useNavigate();

  const storedPatientInfo = JSON.parse(localStorage.getItem("patientInfo") || "{}");
  const patientDisplayName = 
    storedPatientInfo.fullName || 
    storedPatientInfo.name || 
    storedPatientInfo.full_name || 
    "Patient";

  const [department, setDepartment] = useState("all");
  const [queueData, setQueueData] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const patientPhone = localStorage.getItem("patientPhone");
  const token = localStorage.getItem("token");

  const { isConnected } = useWebSocket("ws://localhost:8080/ws/queue", {
    onMessage: (data) => {
      if (data?.type === "queue_update") {
        fetchQueue();
      }
    },
  });

  const fetchQueue = async () => {
    if (!patientPhone || !token) {
      setError("Please login to view queue");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/opd/queue/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load queue");

      const data = await res.json();

      const today = new Date().toISOString().split("T")[0];
      const todayQueue = data.filter(
        (item) => item.appointmentDate === today && 
                  (item.paymentStatus === "PAID" || item.type === "OPD")
      );

      const yourItem = todayQueue.find((item) => item.patientPhone === patientPhone);

      if (!yourItem) {
        setError("No active queue entry found for today");
        setQueueData(null);
        setQueueList([]);
        setLoading(false);
        return;
      }

      const formattedQueue = todayQueue.map((item) => ({
        token: item.tokenNumber,
        status:
          item.patientPhone === patientPhone ? "you" :
          item.status === "VITALS_DONE" || item.status === "CALLING" ? "current" :
          item.status === "COMPLETED" || item.status === "ATTENDED" ? "completed" :
          "waiting",
      }));

      const position = todayQueue.findIndex((item) => item.patientPhone === patientPhone) + 1;
      const estimatedWait = position * 15;

      setQueueData({
        yourToken: yourItem.tokenNumber,
        currentToken: todayQueue.find((item) => item.status === "VITALS_DONE" || item.status === "CALLING")?.tokenNumber || "Waiting",
        position,
        estimatedWait,
        department: yourItem.department || "General",
      });

      setQueueList(formattedQueue);

      setNotifications(prev => [
        ...prev,
        { id: Date.now(), type: 'info', title: 'Queue Updated', message: 'Live queue status refreshed', icon: FaSync }
      ]);

    } catch (err) {
      setError("Failed to load queue. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); 
    return () => clearInterval(interval);
  }, [patientPhone, token]);

  const departments = [
    { id: "all", name: "All Departments" },
    { id: "general", name: "General Medicine" },
    { id: "cardio", name: "Cardiology" },
    { id: "ortho", name: "Orthopedics" },
    { id: "pediatric", name: "Pediatrics" },
  ];

  const filteredQueue = department === "all" ? queueList : queueList.filter((item) => 
    item.department?.toLowerCase().includes(department)
  );

  const progressPercentage = queueData ? Math.max(0, 100 - (queueData.position / 15) * 100) : 0;
  const isAlmostTurn = queueData && queueData.position <= 2;

  return (
    <div className="patient-module">
      <PatientNavbar 
        patientInfo={{ name: patientDisplayName }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.length}
      />

      <main className="queue-page patient-container">
        <div className={`connection-indicator ${isConnected ? "connected" : "disconnected"}`} />

        {isAlmostTurn && queueData && (
          <motion.div 
            className="queue-alert"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FaBell size={24} />
            <div>
              <strong>Your turn is coming soon!</strong>
              <p>Please proceed to the consultation room (Token: {queueData.yourToken})</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="loading">Loading queue status...</div>
        ) : error ? (
          <div className="queue-error">
            <FaExclamationCircle size={48} />
            <h2>{error}</h2>
            <p>We will notify you when there is active queue.</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={fetchQueue}>
                <FaSync /> Try Again
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/patient-dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : !queueData ? (
          <div className="queue-no-entry">
            <FaClock size={48} />
            <h2>No Active Queue Today</h2>
            <p>You don't have any pending queue entry for today.</p>
            <div className="no-entry-actions">
              <button className="btn btn-primary" onClick={() => navigate("/patient/appointments")}>
                <FaCalendarPlus /> Book New Appointment
              </button>
              <button className="btn btn-outline" onClick={fetchQueue}>
                <FaSync /> Refresh Queue
              </button>
            </div>
          </div>
        ) : (
          <>
            <motion.div className="queue-status-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2>Your Token</h2>
              <div className="queue-token">{queueData.yourToken}</div>

              <div className="queue-info-grid">
                <div className="queue-info-item">
                  <label>Current Serving</label>
                  <span>{queueData.currentToken}</span>
                </div>
                <div className="queue-info-item">
                  <label>Your Position</label>
                  <span>#{queueData.position}</span>
                </div>
                <div className="queue-info-item">
                  <label>Est. Wait Time</label>
                  <span>~{queueData.estimatedWait} min</span>
                </div>
              </div>

              <div className="queue-progress">
                <div className="queue-progress-bar">
                  <motion.div
                    className="queue-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
              </div>
            </motion.div>

            <div className="section-card">
              <div className="section-card-header">
                <h2><FaFilter /> Department Filter</h2>
              </div>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="queue-list">
              <div className="section-card-header">
                <h2><FaClock /> Live Queue</h2>
                <button className="refresh-btn" onClick={fetchQueue}>
                  <FaSync /> Refresh
                </button>
              </div>

              {filteredQueue.length === 0 ? (
                <p className="no-data">No one in queue for this department</p>
              ) : (
                filteredQueue.map((item, index) => (
                  <motion.div
                    key={item.token}
                    className={`queue-list-item ${item.status}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="queue-item-left">
                      {item.status === "completed" && <FaCheckCircle className="status-icon success" />}
                      {item.status === "current" && <FaUser className="status-icon current" />}
                      {item.status === "waiting" && <FaClock className="status-icon waiting" />}
                      {item.status === "you" && <FaUser className="status-icon you" />}
                      <span className={`token ${item.status === "you" ? "you" : ""}`}>
                        {item.token}
                      </span>
                    </div>
                    <span className={`queue-status-badge ${item.status}`}>
                      {item.status === "you" ? "You" : 
                       item.status === "current" ? "Now Serving" : 
                       item.status === "completed" ? "Done" : "Waiting"}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </>
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

export default PatientQueue;