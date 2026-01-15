import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSync, FaCheckCircle, FaExclamationCircle, FaClock, FaUser, FaBell, FaFilter } from "react-icons/fa";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import useWebSocket from "../../hooks/useWebSocket";
import "../../styles/PatientModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientQueue = () => {
  const [department, setDepartment] = useState("all");
  const [queueData, setQueueData] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientPhone = localStorage.getItem("patientPhone");
  const token = localStorage.getItem("token");

  const { isConnected, lastMessage } = useWebSocket("ws://localhost:8080/ws/queue", {
    onMessage: (data) => {
      if (data.type === "queue_update") {
        fetchQueue(); // Refresh on real-time update
      }
    },
  });

  const fetchQueue = async () => {
    if (!patientPhone) {
      setError("Please login to view queue status");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/opd/queue/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load queue");

      const data = await res.json();

      // Filter today's queue (assuming endpoint returns today's + future)
      const today = new Date().toISOString().split("T")[0];
      const todayQueue = data.filter(
        (item) => item.appointmentDate === today && item.paymentStatus === "PAID"
      );

      // Find your token
      const yourItem = todayQueue.find((item) => item.patientPhone === patientPhone);

      if (!yourItem) {
        setError("You have no active queue entry today");
        setQueueData(null);
        setQueueList([]);
        setLoading(false);
        return;
      }

      // Build queue list (only today's queue)
      const formattedQueue = todayQueue.map((item) => ({
        token: item.tokenNumber,
        status:
          item.patientPhone === patientPhone
            ? "you"
            : item.status === "VITALS_DONE" || item.status === "CALLING"
            ? "current"
            : item.status === "COMPLETED" || item.status === "ATTENDED"
            ? "completed"
            : "waiting",
      }));

      // Calculate position and estimated wait
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
    } catch (err) {
      setError("Failed to load queue. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Poll every 30s as backup
    return () => clearInterval(interval);
  }, [patientPhone, token]);

  const departments = [
    { id: "all", name: "All Departments" },
    { id: "general", name: "General Medicine" },
    { id: "cardio", name: "Cardiology" },
    { id: "ortho", name: "Orthopedics" },
    { id: "pediatric", name: "Pediatrics" },
  ];

  const filteredQueue = department === "all" ? queueList : queueList.filter((item) => item.department === department);

  const progressPercentage = queueData ? Math.max(0, 100 - (queueData.position / 15) * 100) : 0;
  const isAlmostTurn = queueData && queueData.position <= 2;

  if (loading) return <div className="loading">Loading queue status...</div>;

  if (error || !queueData) {
    return (
      <div className="error-message">
        <FaExclamationCircle /> {error || "No active queue entry found today."}
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar patientName="Patient" notificationCount={0} />

      <main className="queue-page patient-container">
        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
          <span className={`connection-dot ${isConnected ? "connected" : "disconnected"}`}></span>
          {isConnected ? "Live Connected" : "Offline - updates may be delayed"}
        </div>

        {/* Alert when almost turn */}
        {isAlmostTurn && (
          <motion.div className="queue-alert" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <FaBell size={24} />
            <div>
              <strong>Your turn is coming soon!</strong>
              <p>Please proceed to the consultation room.</p>
            </div>
          </motion.div>
        )}

        {/* Queue Status Card */}
        <motion.div className="queue-status-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Your Token Number</h2>
          <div className="queue-token">{queueData.yourToken}</div>

          <div className="queue-info-grid">
            <div className="queue-info-item">
              <label>Current Token</label>
              <span>{queueData.currentToken}</span>
            </div>
            <div className="queue-info-item">
              <label>Your Position</label>
              <span>#{queueData.position}</span>
            </div>
            <div className="queue-info-item">
              <label>Est. Wait</label>
              <span>~{queueData.estimatedWait} min</span>
            </div>
          </div>

          <div className="queue-progress">
            <div className="queue-progress-bar">
              <motion.div
                className="queue-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Department Filter */}
        <div className="section-card">
          <div className="section-card-header">
            <h2><FaFilter /> Filter by Department</h2>
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Queue List */}
        <div className="queue-list">
          <div className="section-card-header">
            <h2><FaClock /> Queue Status</h2>
            <button onClick={fetchQueue} style={{ background: "none", border: "none", color: "#1976D2" }}>
              <FaSync /> Refresh
            </button>
          </div>

          {filteredQueue.length === 0 ? (
            <p className="no-data">No one in queue for this department.</p>
          ) : (
            filteredQueue.map((item, index) => (
              <motion.div
                key={item.token}
                className={`queue-list-item ${item.status}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {item.status === "completed" && <FaCheckCircle color="#27AE60" />}
                  {item.status === "current" && <FaUser color="#1976D2" />}
                  {item.status === "waiting" && <FaClock color="#999" />}
                  {item.status === "you" && <FaUser color="#1976D2" />}
                  <span style={{ fontWeight: item.status === "you" ? "bold" : "normal" }}>
                    {item.token}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background:
                      item.status === "current" ? "#27AE60" : item.status === "you" ? "#1976D2" : item.status === "completed" ? "#E5E7EB" : "#F9FAFB",
                    color: ["current", "you"].includes(item.status) ? "white" : "#666",
                  }}
                >
                  {item.status === "you" ? "You" : item.status === "current" ? "Now Serving" : item.status === "completed" ? "Done" : "Waiting"}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientQueue;