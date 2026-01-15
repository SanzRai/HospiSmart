import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const API_BASE_URL = "http://localhost:8080/api";

const ReceptionModule = ({ staffInfo }) => {
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
  const [onlineBookings, setOnlineBookings] = useState({ opd: [], appointments: [] }); // NEW

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [followUpInfo, setFollowUpInfo] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchRecentTickets();
    fetchRoster();
    fetchOnlineBookings(); // NEW

    const interval = setInterval(() => {
      fetchRecentTickets();
      fetchOnlineBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`);
      if (res.ok) setDepartments(await res.json());
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`);
      if (res.ok) setRosterDoctors(await res.json());
    } catch (err) {
      console.error("Error fetching roster:", err);
    }
  };

  const fetchRecentTickets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/opd/recent`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      if (res.ok) setRecentTickets(await res.json());
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  // NEW: Fetch patient online bookings
  const fetchOnlineBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/online-recent`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOnlineBookings({
          opd: data.opd || [],
          appointments: data.appointments || [],
        });
      }
    } catch (err) {
      console.error("Error fetching online bookings:", err);
    }
  };

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) return;
    setLoading(true);
    setSearchError("");
    setSearchResult(null);
    setPreRegisteredTicket(null);
    setFollowUpInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/patients/search?phone=${searchPhone}`);
      if (res.ok) {
        const patient = await res.json();
        setSearchResult(patient);

        const ticketRes = await fetch(`${API_BASE_URL}/opd/pre-registered?phone=${searchPhone}`);
        if (ticketRes.ok) {
          const ticket = await ticketRes.json();
          if (ticket) setPreRegisteredTicket(ticket);
        }

        const followRes = await fetch(`${API_BASE_URL}/opd/check-followup/${patient.id}`);
        if (followRes.ok) {
          const data = await followRes.json();
          if (data.eligible) setFollowUpInfo(data);
        }
      } else {
        setSearchError("Patient not found. Please register new patient.");
      }
    } catch (err) {
      setSearchError("Error searching patient. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });

      if (res.ok) {
        const patient = await res.json();
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
        setSuccessMessage("Patient registered successfully! Now issue OPD ticket.");
      } else {
        setErrorMessage("Registration failed.");
      }
    } catch (err) {
      setErrorMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!opdForm.departmentId) {
      setErrorMessage("Please select a department.");
      setLoading(false);
      return;
    }

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
      const res = await fetch(`${API_BASE_URL}/opd/generate-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const ticket = await res.json();
        setGeneratedTicket(ticket);
        setShowTicketModal(true);
        fetchRecentTickets();
        fetchOnlineBookings(); // Refresh online list too
        setSuccessMessage(`OPD Ticket ${ticket.tokenNumber} issued successfully!`);
        resetForm();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to issue ticket.");
      }
    } catch (err) {
      setErrorMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Mark online booking as paid at counter
  const handleMarkOnlinePaid = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/online/${bookingId}/pay-counter`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({ paidBy: staffInfo?.name }),
      });
      if (res.ok) {
        setSuccessMessage("Payment confirmed at counter.");
        fetchOnlineBookings();
      } else {
        setErrorMessage("Failed to update payment.");
      }
    } catch (err) {
      setErrorMessage("Network error.");
    }
  };

  // NEW: Load online OPD pre-registration into ticket form
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
    setSuccessMessage("Online pre-registered patient loaded. Now issue ticket.");
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
      await fetch(`${API_BASE_URL}/doctors/${doctor.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: updated }),
      });
      fetchRoster();
    } catch (err) {
      setErrorMessage("Failed to update doctor status");
    }
  };

  const handlePrintTicket = () => window.print();

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="reception-module">
      <div className="module-header">
        <h2><FaDesktop /> Front Office - Reception</h2>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div className="alert success" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <FaCheckCircle /> {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div className="alert error" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <FaExclamationTriangle /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Search Tab */}
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
                <button onClick={() => setActiveTab("register")}>Register New Patient</button>
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
                      <p style={{ color: "red", fontWeight: "bold" }}>Payment Pending</p>
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

      {/* Register New Patient Tab */}
      {activeTab === "register" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form className="registration-form" onSubmit={handleRegisterPatient}>
            <h3><FaUserPlus /> New Patient Registration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={newPatient.fullName} onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" value={newPatient.phoneNumber} onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>District</label>
                <input type="text" value={newPatient.address.district} onChange={(e) => setNewPatient({ ...newPatient, address: { ...newPatient.address, district: e.target.value } })} />
              </div>
              <div className="form-group">
                <label>Municipality</label>
                <input type="text" value={newPatient.address.municipality} onChange={(e) => setNewPatient({ ...newPatient, address: { ...newPatient.address, municipality: e.target.value } })} />
              </div>
              <div className="form-group">
                <label>Ward</label>
                <input type="text" value={newPatient.address.ward} onChange={(e) => setNewPatient({ ...newPatient, address: { ...newPatient.address, ward: e.target.value } })} />
              </div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Patient"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Issue OPD Ticket Tab */}
      {activeTab === "ticket" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form className="ticket-form" onSubmit={handleGenerateTicket}>
            <h3><FaTicketAlt /> Issue OPD Ticket</h3>
            {searchResult && (
              <div className="selected-patient">
                <strong>Patient:</strong> {searchResult.fullName} (UHID: {searchResult.id})
                {preRegisteredTicket && <span className="badge online">Online Pre-Registered</span>}
                {followUpInfo?.eligible && <span className="badge followup">Follow-up (Free)</span>}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Patient Name</label>
                <input type="text" value={opdForm.patientName} readOnly style={{ backgroundColor: "#f0f0f0" }} />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  value={opdForm.departmentId}
                  onChange={(e) => setOpdForm({ ...opdForm, departmentId: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Symptoms / Chief Complaint *</label>
                <textarea
                  value={opdForm.symptoms}
                  onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })}
                  placeholder="Describe symptoms..."
                  required
                  rows={4}
                />
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

            <button type="submit" disabled={loading}>
              {loading ? "Issuing Ticket..." : "Issue OPD Ticket"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Doctor Roster Tab */}
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

      {/* Recent Tickets Tab (Issued by Receptionist) */}
      {activeTab === "history" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaHistory /> Recently Issued Tickets (By Reception)</h3>
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

      {/* NEW TAB: Online Bookings (By Patients) */}
      {activeTab === "online" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaGlobe /> Patient Online Bookings</h3>

          {/* OPD Pre-Registrations */}
          <div className="booking-section" style={{ marginBottom: "30px" }}>
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
                          <button onClick={() => handleMarkOnlinePaid(b.id)} className="pay-btn small" style={{ marginRight: "8px" }}>
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

          {/* Upcoming Appointments */}
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

      {/* Print Ticket Modal */}
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