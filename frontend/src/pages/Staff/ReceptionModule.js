import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaUserPlus,
  FaTicketAlt,
  FaHistory,
  FaPhone,
  FaUser,
  FaPrint,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDesktop,
  FaUserMd,
  FaToggleOn,
  FaToggleOff,
  FaGlobe,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/ReceptionModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const ReceptionModule = () => {
  const [staffInfo, setStaffInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [preRegisteredTicket, setPreRegisteredTicket] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);

  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: { district: "", municipality: "", ward: "" },
    emergencyContact: "",
  });

  const [opdForm, setOpdForm] = useState({
    patientId: "",
    patientName: "",
    symptoms: "",
    departmentId: "",
    isFollowUp: false,
    ticketId: null,
  });

  const [departments, setDepartments] = useState([]);
  const [rosterDoctors, setRosterDoctors] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [onlineBookings, setOnlineBookings] = useState({ opd: [], appointments: [] });

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [followUpInfo, setFollowUpInfo] = useState(null);

  const [toast, setToast] = useState(null);
  const [registerErrors, setRegisterErrors] = useState({});
  const [ticketErrors, setTicketErrors] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("staffInfo");
    if (stored) setStaffInfo(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchRecentTickets();
    fetchRoster();
    fetchOnlineBookings();

    const interval = setInterval(() => {
      fetchRecentTickets();
      fetchOnlineBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/departments`);
      setDepartments(data);
    } catch {}
  };

  const fetchRoster = async () => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/doctors`);
      setRosterDoctors(data);
    } catch {}
  };

  const fetchRecentTickets = async () => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/opd/recent`);
      setRecentTickets(data);
    } catch {}
  };

  const fetchOnlineBookings = async () => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/bookings/online-recent`);
      setOnlineBookings({
        opd: data.opd || [],
        appointments: data.appointments || [],
      });
    } catch {}
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) {
      setSearchError("Please enter phone number");
      return;
    }
    setLoading(true);
    setSearchError("");
    setSearchResult(null);
    setPreRegisteredTicket(null);
    setFollowUpInfo(null);

    try {
      const patient = await apiFetch(`${API_BASE_URL}/patients/search?phone=${searchPhone}`);
      setSearchResult(patient);

      try {
        const ticket = await apiFetch(`${API_BASE_URL}/opd/pre-registered?phone=${searchPhone}`);
        if (ticket) setPreRegisteredTicket(ticket);
      } catch {}

      try {
        const followData = await apiFetch(`${API_BASE_URL}/opd/check-followup/${patient.id}`);
        if (followData.eligible) setFollowUpInfo(followData);
      } catch {}
    } catch {
      setSearchError("Patient not found. Register new patient?");
    } finally {
      setLoading(false);
    }
  };

  const validateRegistration = () => {
    const errs = {};
    if (!newPatient.fullName.trim()) errs.fullName = "Full name is required";
    if (!newPatient.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    if (!newPatient.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!newPatient.gender) errs.gender = "Gender is required";
    setRegisterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!validateRegistration()) return;

    setLoading(true);

    try {
      const patient = await apiFetch(`${API_BASE_URL}/patients/register`, {
        method: "POST",
        body: JSON.stringify(newPatient),
      });
      setSearchResult(patient);
      setActiveTab("ticket");
      setOpdForm({
        patientId: patient.id,
        patientName: patient.fullName,
        symptoms: "",
        departmentId: "",
        isFollowUp: false,
        ticketId: null,
      });
      showToast("success", "Patient registered successfully! Now issue OPD ticket.");
      setRegisterErrors({});
    } catch (err) {
      showToast("error", err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const validateTicket = () => {
    const errs = {};
    if (!opdForm.departmentId) errs.departmentId = "Department is required";
    if (!opdForm.symptoms.trim()) errs.symptoms = "Symptoms are required";
    setTicketErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerateTicket = async (e) => {
    e.preventDefault();
    if (!validateTicket()) return;

    setLoading(true);

    const payload = {
      patientId: opdForm.patientId,
      patientName: opdForm.patientName,
      symptoms: opdForm.symptoms.trim(),
      departmentId: Number(opdForm.departmentId),
      isFollowUp: opdForm.isFollowUp,
      issuedBy: staffInfo?.name || "Reception",
      preRegisteredTicketId: opdForm.ticketId || null,
    };

    try {
      const ticket = await apiFetch(`${API_BASE_URL}/opd/generate-ticket`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGeneratedTicket(ticket);
      setShowTicketModal(true);
      fetchRecentTickets();
      fetchOnlineBookings();
      showToast("success", `OPD Ticket ${ticket.tokenNumber} issued successfully!`);
      resetForm();
    } catch (err) {
      showToast("error", err.message || "Failed to issue ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOnlinePaid = async (bookingId) => {
    try {
      await apiFetch(`${API_BASE_URL}/bookings/online/${bookingId}/pay-counter`, {
        method: "PUT",
        body: JSON.stringify({ paidBy: staffInfo?.name }),
      });
      showToast("success", "Payment confirmed at counter.");
      fetchOnlineBookings();
    } catch (err) {
      showToast("error", err.message || "Failed to update payment");
    }
  };

  const handleIssueOnlineOpdTicket = (booking) => {
    setSearchResult({
      id: booking.patientId || null,
      fullName: booking.patientName,
    });
    setPreRegisteredTicket(booking);
    setOpdForm({
      patientId: booking.patientId,
      patientName: booking.patientName,
      symptoms: booking.symptoms || "",
      departmentId: booking.departmentId || "",
      isFollowUp: false,
      ticketId: booking.id,
    });
    setActiveTab("ticket");
    showToast("success", "Online pre-registered patient loaded. Now issue ticket.");
  };

  const resetForm = () => {
    setOpdForm({
      patientId: "",
      patientName: "",
      symptoms: "",
      departmentId: "",
      isFollowUp: false,
      ticketId: null,
    });
    setSearchResult(null);
    setPreRegisteredTicket(null);
    setFollowUpInfo(null);
    setTicketErrors({});
  };

  const selectPatientForTicket = () => {
    setOpdForm({
      patientId: searchResult.id,
      patientName: searchResult.fullName,
      symptoms: preRegisteredTicket?.symptoms || "",
      departmentId: preRegisteredTicket?.departmentId || "",
      isFollowUp: followUpInfo?.eligible || false,
      ticketId: preRegisteredTicket?.id || null,
    });
    setActiveTab("ticket");
  };

  const toggleDoctorDuty = async (doctor) => {
    const updated = !doctor.isAvailable;
    try {
      await apiFetch(`${API_BASE_URL}/doctors/${doctor.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isAvailable: updated }),
      });
      fetchRoster();
    } catch {}
  };

  const handlePrintTicket = () => window.print();

  if (!staffInfo) return <div>Loading staff information...</div>;

  return (
    <div className="reception-module">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="module-header">
        <h2><FaDesktop /> Front Office - Reception</h2>
      </div>

      <div className="module-tabs">
        <button className={activeTab === "search" ? "active" : ""} onClick={() => setActiveTab("search")}>
          <FaSearch /> Search Patient
        </button>
        <button className={activeTab === "register" ? "active" : ""} onClick={() => setActiveTab("register")}>
          <FaUserPlus /> New Registration
        </button>
        <button className={activeTab === "ticket" ? "active" : ""} onClick={() => setActiveTab("ticket")}>
          <FaTicketAlt /> Issue OPD Ticket
        </button>
        <button className={activeTab === "roster" ? "active" : ""} onClick={() => setActiveTab("roster")}>
          <FaUserMd /> Doctor Roster
        </button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
          <FaHistory /> Recent Tickets
        </button>
        <button className={activeTab === "online" ? "active" : ""} onClick={() => setActiveTab("online")}>
          <FaGlobe /> Online Bookings
        </button>
      </div>

      {activeTab === "search" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="search-section">
            <h3>Search Patient by Phone</h3>
            <div className="search-box">
              <FaPhone />
              <input
                type="tel"
                placeholder="98xxxxxxxx"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPatient()}
              />
              <button onClick={handleSearchPatient} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {searchError && (
              <div className="search-error">
                <FaExclamationTriangle /> {searchError}
                <button onClick={() => setActiveTab("register")}>Register New</button>
              </div>
            )}

            {searchResult && (
              <div className="patient-card">
                <div className="patient-header">
                  <FaUser size={40} />
                  <div>
                    <h3>{searchResult.fullName}</h3>
                    <p>UHID: {searchResult.id}</p>
                  </div>
                </div>

                {preRegisteredTicket && (
                  <div className="pre-registered-alert">
                    <FaGlobe /> <strong>Online Pre-Registered OPD</strong>
                    <p>Symptoms: {preRegisteredTicket.symptoms || "Not provided"}</p>
                    {preRegisteredTicket.paymentStatus === "PENDING" && (
                      <p className="pending-payment">Payment Pending</p>
                    )}
                  </div>
                )}

                {followUpInfo?.eligible && (
                  <div className="followup-alert">
                    <FaCheckCircle /> <strong>Follow-up Eligible (Free Consultation)</strong>
                  </div>
                )}

                <button className="issue-ticket-btn" onClick={selectPatientForTicket}>
                  <FaTicketAlt /> {preRegisteredTicket ? "Complete & Issue Ticket" : "Issue OPD Ticket"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "register" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form className="registration-form" onSubmit={handleRegisterPatient}>
            <h3><FaUserPlus /> New Patient Registration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={newPatient.fullName}
                  onChange={(e) => {
                    setNewPatient({ ...newPatient, fullName: e.target.value });
                    setRegisterErrors((p) => ({ ...p, fullName: "" }));
                  }}
                />
                {registerErrors.fullName && <div className="field-error">{registerErrors.fullName}</div>}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={newPatient.phoneNumber}
                  onChange={(e) => {
                    setNewPatient({ ...newPatient, phoneNumber: e.target.value });
                    setRegisterErrors((p) => ({ ...p, phoneNumber: "" }));
                  }}
                />
                {registerErrors.phoneNumber && <div className="field-error">{registerErrors.phoneNumber}</div>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => {
                    setNewPatient({ ...newPatient, dateOfBirth: e.target.value });
                    setRegisterErrors((p) => ({ ...p, dateOfBirth: "" }));
                  }}
                />
                {registerErrors.dateOfBirth && <div className="field-error">{registerErrors.dateOfBirth}</div>}
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  value={newPatient.gender}
                  onChange={(e) => {
                    setNewPatient({ ...newPatient, gender: e.target.value });
                    setRegisterErrors((p) => ({ ...p, gender: "" }));
                  }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {registerErrors.gender && <div className="field-error">{registerErrors.gender}</div>}
              </div>

              <div className="form-group">
                <label>District</label>
                <input
                  type="text"
                  value={newPatient.address.district}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      address: { ...newPatient.address, district: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Municipality</label>
                <input
                  type="text"
                  value={newPatient.address.municipality}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      address: { ...newPatient.address, municipality: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Ward</label>
                <input
                  type="text"
                  value={newPatient.address.ward}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      address: { ...newPatient.address, ward: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? "Registering..." : "Register Patient"}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === "ticket" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form className="ticket-form" onSubmit={handleGenerateTicket}>
            <h3><FaTicketAlt /> Issue OPD Ticket</h3>

            {searchResult && (
              <div className="selected-patient">
                <strong>Patient:</strong> {searchResult.fullName} (UHID: {searchResult.id})
                {preRegisteredTicket && <span className="badge online">Online</span>}
                {followUpInfo?.eligible && <span className="badge followup">Follow-up</span>}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Patient Name</label>
                <input type="text" value={opdForm.patientName} readOnly className="readonly-input" />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  value={opdForm.departmentId}
                  onChange={(e) => {
                    setOpdForm({ ...opdForm, departmentId: e.target.value });
                    setTicketErrors((p) => ({ ...p, departmentId: "" }));
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {ticketErrors.departmentId && <div className="field-error">{ticketErrors.departmentId}</div>}
              </div>

              <div className="form-group full-width">
                <label>Symptoms / Chief Complaint *</label>
                <textarea
                  value={opdForm.symptoms}
                  onChange={(e) => {
                    setOpdForm({ ...opdForm, symptoms: e.target.value });
                    setTicketErrors((p) => ({ ...p, symptoms: "" }));
                  }}
                  placeholder="Describe symptoms..."
                  rows={4}
                />
                {ticketErrors.symptoms && <div className="field-error">{ticketErrors.symptoms}</div>}
              </div>

              {followUpInfo?.eligible && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={opdForm.isFollowUp}
                      onChange={(e) => setOpdForm({ ...opdForm, isFollowUp: e.target.checked })}
                    />
                    Mark as Follow-up Visit (Free Consultation)
                  </label>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? "Issuing..." : "Issue OPD Ticket"}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === "roster" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaUserMd /> Doctor Duty Roster</h3>
          <div className="roster-grid">
            {rosterDoctors.length === 0 ? (
              <p>No doctors found.</p>
            ) : (
              rosterDoctors.map((doc) => (
                <div key={doc.id} className={`roster-card ${doc.isAvailable ? "on-duty" : "off-duty"}`}>
                  <div className="roster-info">
                    <h4>{doc.name}</h4>
                    <small>{doc.departmentName}</small>
                  </div>
                  <button onClick={() => toggleDoctorDuty(doc)} className="toggle-btn">
                    {doc.isAvailable ? <FaToggleOn size={30} color="#10b981" /> : <FaToggleOff size={30} color="#ef4444" />}
                    <span>{doc.isAvailable ? "On Duty" : "Off Duty"}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaHistory /> Recently Issued Tickets</h3>
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Department</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr><td colSpan="5">No tickets issued yet today</td></tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.tokenNumber}</strong></td>
                    <td>{t.patientName}</td>
                    <td>{t.department}</td>
                    <td>{t.doctorName || "Pending"}</td>
                    <td><span className="status-badge">{t.status || "ISSUED"}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === "online" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaGlobe /> Patient Online Bookings</h3>

          <div className="booking-section">
            <h4>Today's Online OPD Tickets</h4>
            {onlineBookings.opd.length === 0 ? (
              <p>No online OPD bookings today.</p>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Booked At</th>
                    <th>Patient</th>
                    <th>Symptoms</th>
                    <th>Department</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineBookings.opd.map((b) => (
                    <tr key={b.id}>
                      <td><FaClock /> {new Date(b.bookedAt).toLocaleTimeString()}</td>
                      <td>{b.patientName}<br /><small>Ph: {b.phone}</small></td>
                      <td>{b.symptoms || "-"}</td>
                      <td>{b.department}</td>
                      <td>
                        <span className={`status-badge ${b.paymentStatus.toLowerCase()}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {b.paymentStatus === "PENDING" && (
                          <button onClick={() => handleMarkOnlinePaid(b.id)} className="pay-btn small">
                            <FaMoneyBillWave /> Mark Paid
                          </button>
                        )}
                        <button onClick={() => handleIssueOnlineOpdTicket(b)} className="issue-btn small">
                          <FaTicketAlt /> Issue Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="booking-section">
            <h4>Upcoming Appointments</h4>
            {onlineBookings.appointments.length === 0 ? (
              <p>No upcoming appointments.</p>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Fee</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineBookings.appointments.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {new Date(b.appointmentDate).toLocaleDateString()} <br />
                        <strong>{b.appointmentTime}</strong>
                      </td>
                      <td>{b.patientName}<br /><small>Ph: {b.phone}</small></td>
                      <td>{b.doctorName}</td>
                      <td>{b.department}</td>
                      <td>NPR {b.consultingFee}</td>
                      <td>
                        <span className={`status-badge ${b.paymentStatus.toLowerCase()}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {b.paymentStatus === "PENDING" && (
                          <button onClick={() => handleMarkOnlinePaid(b.id)} className="pay-btn small">
                            <FaMoneyBillWave /> Mark Paid
                          </button>
                        )}
                        {b.paymentStatus === "PAID" && <span style={{ color: "green" }}>Confirmed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showTicketModal && generatedTicket && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="ticket-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <button className="close-btn" onClick={() => setShowTicketModal(false)}>
                <FaTimes />
              </button>
              <div className="ticket-print" id="printable-ticket">
                <div className="ticket-header">
                  <h2>HospiSmart Hospital</h2>
                  <p>OPD Consultation Ticket</p>
                </div>
                <div className="ticket-number">{generatedTicket.tokenNumber}</div>
                <div className="ticket-details">
                  <div><label>Patient Name:</label><span>{generatedTicket.patientName}</span></div>
                  <div><label>Department:</label><span>{generatedTicket.department}</span></div>
                  <div><label>Doctor:</label><span>To be assigned by Nurse</span></div>
                  <div><label>Date:</label><span>{new Date().toLocaleDateString()}</span></div>
                  <div><label>Consultation Fee:</label>
                    <span>{generatedTicket.consultingFee === 0 ? "Free (Follow-up)" : `Rs ${generatedTicket.consultingFee}`}</span>
                  </div>
                  <div><label>Estimated Wait:</label><span>~15 minutes per patient (after doctor assignment)</span></div>
                </div>
                <div className="ticket-footer">
                  <p><strong>Please proceed to waiting area. Nurse will assign doctor and call your token.</strong></p>
                  <small>Issued by: {staffInfo?.name || "Reception"} | {new Date().toLocaleString()}</small>
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={handlePrintTicket}><FaPrint /> Print Ticket</button>
                <button onClick={() => setShowTicketModal(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceptionModule;