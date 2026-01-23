import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaCalendarPlus, FaPhone, FaClock, FaTimes, FaCheck, FaExclamationCircle, FaRedo 
} from "react-icons/fa";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import "../../styles/PatientAppointment.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientAppointment = () => {
  const navigate = useNavigate();

  const storedPatientInfo = JSON.parse(localStorage.getItem("patientInfo") || "{}");
  const patientName = storedPatientInfo.fullName ||
                     storedPatientInfo.name ||
                     storedPatientInfo.full_name ||
                     "Patient";

  const [filter, setFilter] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelId, setSelectedCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [doctorIdMap, setDoctorIdMap] = useState({});

  const [notifications, setNotifications] = useState([]);

  const patientPhone = localStorage.getItem("patientPhone");
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    if (!token || !patientPhone) {
      setError("Please login to view your appointments");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/bookings/online-recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load appointments from server");
      }

      const data = await res.json();
      const allAppointments = [...(data.opd || []), ...(data.appointments || [])];

      const patientAppts = allAppointments.filter(
        (apt) => apt.phone === patientPhone || apt.patientPhone === patientPhone
      );

      const today = new Date().toISOString().split("T")[0];

      const classified = patientAppts.map((apt) => {
        const aptDate = apt.appointmentDate || apt.bookedAt || today;
        const isPast = aptDate < today;

        let status = (apt.status || "pending").toString().trim().toLowerCase();

        const validStatuses = [
          "pending", "issued", "vitals_done", "assigned", "calling",
          "completed", "cancelled", "canceled", "rescheduled", "absent"
        ];

        if (!validStatuses.includes(status)) {
          status = isPast ? "completed" : "upcoming"; 
        }

        return { ...apt, status, id: apt.id || apt.appointmentId || apt.tokenNumber };
      });

      setAppointments(classified);

      const doctorsRes = await fetch(`${API_BASE_URL}/doctors`);
      if (doctorsRes.ok) {
        const doctors = await doctorsRes.json();
        const map = {};
        doctors.forEach((d) => {
          if (d.name) map[d.name.trim().toLowerCase()] = d.id;
        });
        setDoctorIdMap(map);
      }

      setNotifications([
        { id: 'info-1', type: 'info', title: 'Appointment Tips', message: 'Arrive 15 minutes early', icon: FaClock }
      ]);

    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Unable to load appointments. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientPhone, token]);

  const filteredAppointments = appointments.filter((apt) => apt.status === filter);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":      return <FaClock className="status-icon upcoming" />;
      case "completed":     return <FaCheck className="status-icon completed" />;
      case "cancelled":
      case "canceled":      return <FaTimes className="status-icon cancelled" />;
      case "rescheduled":   return <FaRedo className="status-icon rescheduled" />;
      default:              return <FaExclamationCircle className="status-icon unknown" />;
    }
  };

  const openCancelModal = (id) => {
    setSelectedCancelId(id);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${selectedCancelId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cancelReason.trim() || "Cancelled by patient" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Cancellation failed");
      }

      alert("Your appointment has been successfully cancelled.");
    } catch (err) {
      let userMessage = "Something went wrong. Please try again or contact support.";

      const msg = err.message.toLowerCase();
      if (msg.includes("already cancelled") || msg.includes("already canceled")) {
        userMessage = "This appointment has already been cancelled.";
      } else if (msg.includes("only pending") || msg.includes("cannot cancel")) {
        userMessage = "This appointment cannot be cancelled in its current status.";
      }

      alert(userMessage);
    } finally {
      setShowCancelModal(false);
      setSelectedCancelId(null);
      setCancelReason("");
      await fetchData();
    }
  };

  const openRescheduleModal = async (apt) => {
    setSelectedRescheduleApt(apt);
    setNewDate(apt.appointmentDate || "");
    setNewTime(apt.appointmentTime || "");
    setAvailableSlots([]);

    const doctorNameLower = (apt.doctorName || "").trim().toLowerCase();
    const doctorId = doctorIdMap[doctorNameLower];

    if (doctorId && apt.appointmentDate) {
      try {
        const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/timeslots?date=${apt.appointmentDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const slots = await res.json();
          const filtered = Array.isArray(slots) ? slots.filter((s) => s.length === 5) : [];
          setAvailableSlots(filtered);
          if (apt.appointmentTime && filtered.includes(apt.appointmentTime)) {
            setNewTime(apt.appointmentTime);
          } else if (filtered.length > 0) {
            setNewTime(filtered[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load time slots:", err);
      }
    }

    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!newDate || !newTime) {
      alert("Please select both a new date and time.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${selectedRescheduleApt.id}/reschedule`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: newDate,
          appointmentTime: newTime,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Rescheduling failed");
      }

      alert("Your appointment has been successfully rescheduled.");
    } catch (err) {
      let userMessage = "Something went wrong. Please try again or contact support.";

      const msg = err.message.toLowerCase();
      if (msg.includes("past date")) {
        userMessage = "You cannot reschedule to a past date.";
      } else if (msg.includes("only pending") || msg.includes("cannot reschedule")) {
        userMessage = "This appointment cannot be rescheduled in its current status.";
      }

      alert(userMessage);
    } finally {
      setShowRescheduleModal(false);
      setSelectedRescheduleApt(null);
      setNewDate("");
      setNewTime("");
      setAvailableSlots([]);
      await fetchData();
    }
  };

  if (loading) return <div className="loading">Loading your appointments...</div>;

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
        patientInfo={{ name: patientName }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.length}
      />

      <main className="appointments-page patient-container">
        <div className="page-header">
          <h1>My Appointments</h1>
          <button className="btn btn-primary" onClick={() => navigate("/patient/appointment")}>
            <FaCalendarPlus /> Book New
          </button>
        </div>

        <div className="filter-bar">
          {["upcoming", "completed", "cancelled", "rescheduled"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="no-data">
            <p>No {filter} appointments found.</p>
            {filter === "upcoming" && (
              <button className="btn btn-outline" onClick={() => navigate("/patient/appointment")}>
                Book your first appointment
              </button>
            )}
          </div>
        ) : (
          <motion.div className="appointments-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="appointment-card">
                <div className="appointment-card-header">
                  <div>
                    <h4>{apt.doctorName || "General OPD"}</h4>
                    <p>{apt.department || "General"}</p>
                  </div>
                  <div className={`appointment-status ${apt.status}`}>
                    {getStatusIcon(apt.status)}{" "}
                    {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                  </div>
                </div>

                <div className="appointment-card-body">
                  <div className="info-item">
                    <label>Date</label>
                    <span>{apt.appointmentDate || apt.bookedAt || "—"}</span>
                  </div>
                  <div className="info-item">
                    <label>Time</label>
                    <span>{apt.appointmentTime || "Queue"}</span>
                  </div>
                  <div className="info-item">
                    <label>Token</label>
                    <span>{apt.tokenNumber || "—"}</span>
                  </div>
                </div>

                {apt.status?.toLowerCase() === "upcoming" && (
                  <div className="appointment-card-actions">
                    <button
                      className="btn btn-outline small danger"
                      onClick={() => openCancelModal(apt.id)}
                    >
                      <FaTimes /> Cancel
                    </button>
                    <button
                      className="btn btn-primary small"
                      onClick={() => openRescheduleModal(apt)}
                    >
                      <FaRedo /> Reschedule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {showCancelModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Cancel Appointment</h3>
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="modal-form-group">
                <label>Reason (optional)</label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Feeling better, Schedule change..."
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>
                  No, Keep
                </button>
                <button className="btn btn-danger" onClick={confirmCancel}>
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showRescheduleModal && selectedRescheduleApt && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "500px" }}>
              <h3>Reschedule Appointment</h3>

              <div className="reschedule-info">
                <p>
                  <strong>Current:</strong> {selectedRescheduleApt.appointmentDate} at{" "}
                  {selectedRescheduleApt.appointmentTime || "Queue"}
                </p>
                <p>
                  <strong>Doctor:</strong> {selectedRescheduleApt.doctorName || "General OPD"}
                </p>
              </div>

              <div className="modal-form-group">
                <label>New Date *</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setNewDate(date);
                    const doctorNameLower = (selectedRescheduleApt.doctorName || "").trim().toLowerCase();
                    const doctorId = doctorIdMap[doctorNameLower];
                    if (doctorId && date) {
                      fetch(`${API_BASE_URL}/doctors/${doctorId}/timeslots?date=${date}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                        .then((res) => (res.ok ? res.json() : Promise.reject()))
                        .then((slots) => {
                          const filtered = Array.isArray(slots) ? slots.filter((s) => s.length === 5) : [];
                          setAvailableSlots(filtered);
                          if (!filtered.includes(newTime) && filtered.length > 0) {
                            setNewTime(filtered[0]);
                          }
                        })
                        .catch(() => setAvailableSlots([]));
                    }
                  }}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="modal-form-group">
                <label>New Time *</label>
                <select value={newTime} onChange={(e) => setNewTime(e.target.value)}>
                  <option value="">Select new time</option>
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot, i) => (
                      <option key={i} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    <option value="">No slots available</option>
                  )}
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowRescheduleModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmReschedule}
                  disabled={!newDate || !newTime || availableSlots.length === 0}
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
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

export default PatientAppointment;