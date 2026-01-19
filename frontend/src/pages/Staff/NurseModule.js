import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserNurse,
  FaHeartbeat,
  FaBed,
  FaClipboardList,
  FaBell,
  FaWeight,
  FaThermometerHalf,
  FaTint,
  FaCheckCircle,
  FaTimesCircle,
  FaUserInjured,
  FaProcedures,
  FaBroom,
  FaStethoscope,
} from "react-icons/fa";
import "../../styles/NurseModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const NurseModule = ({ staffInfo }) => {
  const [activeTab, setActiveTab] = useState("assign");
  const [opdQueue, setOpdQueue] = useState([]);
  const [expandedFor, setExpandedFor] = useState(null); // patient.id that is currently expanded

  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    spo2: "",
    respiratoryRate: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    departmentId: "",
    doctorId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [beds, setBeds] = useState([]);
  const [admissionRequests, setAdmissionRequests] = useState([]);
  const [admittedPatients, setAdmittedPatients] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [assignError, setAssignError] = useState("");
  const [vitalsError, setVitalsError] = useState("");

  useEffect(() => {
    fetchOpdQueue();
    fetchDepartments();
    fetchBedStatus();
    fetchAdmissionRequests();
    fetchAdmittedPatients();
  }, []);

  const refreshData = () => {
    fetchOpdQueue();
    fetchBedStatus();
    fetchAdmissionRequests();
    fetchAdmittedPatients();
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchOpdQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/opd/queue/all`);
      if (res.ok) {
        const data = await res.json();
        const updatedQueue = data.map((patient) => {
          const patientsAhead = patient.doctorId
            ? data.filter(
                (p) =>
                  p.doctorId === patient.doctorId &&
                  p.status !== "COMPLETED" &&
                  new Date(p.issueTime) < new Date(patient.issueTime)
              ).length
            : null;
          return {
            ...patient,
            doctorName: patient.assignedDoctor || "",
            vitalsRecorded: !!patient.vitals,
            estimatedWait: patientsAhead !== null ? patientsAhead * 8 : null,
            showAssign: !patient.assignedDoctor && patient.status !== "COMPLETED",
            showVitals: !patient.vitals && patient.status !== "COMPLETED",
          };
        });
        setOpdQueue(updatedQueue);
      }
    } catch (err) {
      console.error("Error fetching OPD queue:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`);
      if (res.ok) setDepartments(await res.json());
    } catch (err) {}
  };

  const fetchDoctors = async (deptId) => {
    if (!deptId) {
      setDoctors([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${deptId}/doctors`);
      if (res.ok) {
        const docs = await res.json();
        setDoctors(docs.filter((doc) => doc.isAvailable));
      }
    } catch (err) {
      setDoctors([]);
    }
  };

  const fetchBedStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/beds`);
      if (res.ok) setBeds(await res.json());
    } catch (err) {}
  };

  const fetchAdmissionRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/pending`);
      if (res.ok) setAdmissionRequests(await res.json());
    } catch (err) {}
  };

  const fetchAdmittedPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor-portal/ipd/patients`);
      if (res.ok) setAdmittedPatients(await res.json());
    } catch (err) {}
  };

  // ── Vitals Handlers ─────────────────────────────────────────────
  const startRecordingVitals = (patient) => {
    setExpandedFor(patient.id);
    setVitals({
      bloodPressure: patient.bloodPressure || "",
      pulse: patient.pulse || "",
      temperature: patient.temperature || "",
      weight: patient.weight || "",
      spo2: patient.spo2 || "",
      respiratoryRate: patient.respiratoryRate || "",
    });
    setVitalsError("");
  };

  const handleRecordVitals = async () => {
    if (!expandedFor) return;
    const patient = opdQueue.find(p => p.id === expandedFor);
    if (!patient) return;

    if (!vitals.bloodPressure.trim() || !vitals.pulse || !vitals.temperature) {
      setVitalsError("Blood Pressure, Pulse, and Temperature are required");
      return;
    }

    setVitalsError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/opd/${patient.id}/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...vitals, recordedBy: staffInfo?.name }),
      });

      if (res.ok) {
        showToast("success", "Vitals recorded successfully!");
        setVitals({ bloodPressure: "", pulse: "", temperature: "", weight: "", spo2: "", respiratoryRate: "" });
        setExpandedFor(null);
        refreshData();
      } else {
        showToast("error", "Failed to record vitals");
      }
    } catch (err) {
      showToast("error", "Network error while saving vitals");
    } finally {
      setLoading(false);
    }
  };

  // ── Assign Doctor Handlers ──────────────────────────────────────
  const startAssignDoctor = (patient) => {
    setExpandedFor(patient.id);
    setAssignmentForm({ departmentId: patient.departmentId || "", doctorId: "" });
    setAssignError("");
    fetchDoctors(patient.departmentId);
  };

  const handleAssignDoctor = async () => {
  if (!expandedFor) return;
  const patient = opdQueue.find(p => p.id === expandedFor);
  if (!patient) return;

  if (!assignmentForm.doctorId) {
    setAssignError("Please select a doctor");
    return;
  }

  setAssignError("");
  setLoading(true);

  try {
    const payload = {
      doctorId: Number(assignmentForm.doctorId),
      departmentId: Number(assignmentForm.departmentId),
      assignedBy: staffInfo?.name,
    };

    const res = await fetch(`${API_BASE_URL}/opd/${patient.id}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast("success", "Patient assigned successfully!");
      setExpandedFor(null);
      setAssignmentForm({ departmentId: "", doctorId: "" });
      refreshData(); 
    } else {
      const err = await res.json();
      showToast("error", err.error || "Failed to assign doctor");
    }
  } catch (err) {
    showToast("error", "Network error");
  } finally {
    setLoading(false);
  }
};

  const handleCallNext = async (patient) => {
    try {
      await fetch(`${API_BASE_URL}/opd/${patient.id}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const waitMsg = patient.estimatedWait !== null
        ? `Estimated wait was ~${patient.estimatedWait} minutes`
        : "Doctor assignment pending";
      showToast("success", `Calling ${patient.patientName} - Token: ${patient.tokenNumber}\n${waitMsg}`);
    } catch (err) {
      showToast("error", "Failed to call patient");
    }
  };

  const handleMarkAbsent = async (patient) => {
    if (!window.confirm(`Mark ${patient.patientName} as absent?`)) return;
    try {
      await fetch(`${API_BASE_URL}/opd/${patient.id}/absent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      showToast("success", `${patient.patientName} marked as absent`);
      refreshData();
    } catch (err) {
      showToast("error", "Failed to mark absent");
    }
  };

  const handleAdmitPatient = async (request, bedId) => {
    if (!bedId) {
      showToast("error", "Please select a bed");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/admit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ requestId: request.id, bedId, admittedBy: staffInfo?.name }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast("success", `${request.patientName} admitted!\nUHID: ${data.uhid}\nBed: ${data.bed}`);
        refreshData();
      } else {
        const error = await res.json();
        showToast("error", error.error || "Admission failed");
      }
    } catch (err) {
      showToast("error", "Network error during admission");
    } finally {
      setLoading(false);
    }
  };

  const toggleBedMaintenance = async (bed) => {
    const newStatus = bed.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
    try {
      await fetch(`${API_BASE_URL}/beds/${bed.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast("success", `Bed ${bed.bedNumber} status updated`);
      fetchBedStatus();
    } catch (err) {
      showToast("error", "Failed to update bed status");
    }
  };

  const getWardStats = () => {
    const stats = {};
    beds.forEach((bed) => {
      if (!stats[bed.ward]) stats[bed.ward] = { total: 0, available: 0, occupied: 0, maintenance: 0 };
      stats[bed.ward].total++;
      if (bed.status === "AVAILABLE") stats[bed.ward].available++;
      if (bed.status === "OCCUPIED") stats[bed.ward].occupied++;
      if (bed.status === "MAINTENANCE") stats[bed.ward].maintenance++;
    });
    return stats;
  };

  return (
    <div className="nurse-module">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="module-header">
        <h2><FaUserNurse /> Nursing Station</h2>
        <div className="quick-stats">
          <div className="stat">
            <FaStethoscope />
            <span>{opdQueue.filter(p => p.showAssign).length} Need Assignment</span>
          </div>
          <div className="stat">
            <FaHeartbeat />
            <span>{opdQueue.filter(p => p.showVitals).length} Need Vitals</span>
          </div>
          <div className="stat">
            <FaBed />
            <span>{beds.filter(b => b.status === "AVAILABLE").length} Beds Free</span>
          </div>
          <div className="stat alert">
            <FaBell />
            <span>{admissionRequests.length} Admission Requests</span>
          </div>
          <div className="stat">
            <FaUserInjured />
            <span>{admittedPatients.length} Admitted</span>
          </div>
        </div>
      </div>

      <div className="module-tabs">
        <button className={activeTab === "assign" ? "active" : ""} onClick={() => setActiveTab("assign")}>
          <FaStethoscope /> Assign Doctor
        </button>
        <button className={activeTab === "vitals" ? "active" : ""} onClick={() => setActiveTab("vitals")}>
          <FaHeartbeat /> Record Vitals
        </button>
        <button className={activeTab === "beds" ? "active" : ""} onClick={() => setActiveTab("beds")}>
          <FaBed /> Bed Census
        </button>
        <button className={activeTab === "admissions" ? "active" : ""} onClick={() => setActiveTab("admissions")}>
          <FaProcedures /> Pending Admissions
        </button>
        <button className={activeTab === "ipd" ? "active" : ""} onClick={() => setActiveTab("ipd")}>
          <FaUserInjured /> Admitted Patients
        </button>
      </div>

      {/* ── ASSIGN DOCTOR TAB ──────────────────────────────────────────────── */}
      {activeTab === "assign" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Assign Doctor to Patients</h3>
          <div className="queue-list">
            {opdQueue.filter(p => p.showAssign).map((patient, index) => {
              const isExpanded = expandedFor === patient.id;

              return (
                <div key={patient.id} className="queue-card">
                  <div className="queue-header">
                    <div className="queue-number">#{index + 1}</div>
                    <div className="queue-info">
                      <h4>{patient.patientName}</h4>
                      <p><strong>Token:</strong> {patient.tokenNumber}</p>
                      <p><strong>Department:</strong> {departments.find(d => d.id === patient.departmentId)?.name || "N/A"}</p>
                      <p><strong>Symptoms:</strong> {patient.symptoms || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="queue-actions">
                    <button
                      className="assign-btn"
                      onClick={() => startAssignDoctor(patient)}
                      disabled={isExpanded}
                    >
                      Assign Doctor
                    </button>
                    <button className="call-btn" onClick={() => handleCallNext(patient)}>
                      <FaBell /> Call
                    </button>
                    <button className="absent-btn" onClick={() => handleMarkAbsent(patient)}>
                      <FaTimesCircle /> Absent
                    </button>
                  </div>

                  {/* Assignment Form - appears below the selected patient */}
                  <AnimatePresence>
                    {isExpanded && activeTab === "assign" && (
                      <motion.div
                        className="assignment-form in-card"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4>Assign Doctor for {patient.patientName}</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Department</label>
                            <input
                              type="text"
                              value={departments.find(d => d.id === patient.departmentId)?.name || ""}
                              readOnly
                            />
                          </div>
                          <div className="form-group">
                            <label>Doctor *</label>
                            <select
                              value={assignmentForm.doctorId}
                              onChange={(e) => {
                                setAssignmentForm(prev => ({ ...prev, doctorId: e.target.value }));
                                setAssignError("");
                              }}
                            >
                              <option value="">Select Available Doctor</option>
                              {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                  {doc.name}
                                </option>
                              ))}
                            </select>
                            {assignError && <div className="field-error">{assignError}</div>}
                          </div>
                        </div>
                        <div className="form-actions">
                          <button className="cancel-btn" onClick={() => setExpandedFor(null)}>
                            Cancel
                          </button>
                          <button
                            className="save-btn"
                            onClick={handleAssignDoctor}
                            disabled={loading || !assignmentForm.doctorId}
                          >
                            {loading ? "Assigning..." : "Assign Doctor"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {opdQueue.filter(p => p.showAssign).length === 0 && (
              <div className="empty-state">
                <FaCheckCircle size={48} />
                <p>All patients have been assigned a doctor!</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

     
      {activeTab === "vitals" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaHeartbeat /> Record Patient Vitals</h3>
          <div className="queue-list">
            {opdQueue.filter(p => p.showVitals).map((patient, index) => {
              const isExpanded = expandedFor === patient.id;

              return (
                <div key={patient.id} className="queue-card">
                  <div className="queue-header">
                    <div className="queue-number">#{index + 1}</div>
                    <div className="queue-info">
                      <h4>{patient.patientName}</h4>
                      <p><strong>Token:</strong> {patient.tokenNumber}</p>
                      <p><strong>Doctor:</strong> {patient.doctorName || "Not assigned yet"}</p>
                      {patient.estimatedWait !== null && (
                        <p><strong>Est. Wait:</strong> ~{patient.estimatedWait} minutes</p>
                      )}
                    </div>
                  </div>

                  <div className="queue-actions">
                    <button
                      className="vitals-btn"
                      onClick={() => startRecordingVitals(patient)}
                      disabled={isExpanded}
                    >
                      <FaHeartbeat /> Record Vitals
                    </button>
                  </div>

                  {/* Vitals Form - appears below the selected patient */}
                  <AnimatePresence>
                    {isExpanded && activeTab === "vitals" && (
                      <motion.div
                        className="vitals-form in-card"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="patient-selected">
                          <FaUserInjured />
                          <h4>{patient.patientName} - {patient.tokenNumber}</h4>
                        </div>

                        {vitalsError && (
                          <div className="field-error" style={{ marginBottom: "1rem" }}>
                            {vitalsError}
                          </div>
                        )}

                        <div className="vitals-grid">
                          <div className="vital-input">
                            <label><FaTint /> BP</label>
                            <input
                              type="text"
                              placeholder="120/80"
                              value={vitals.bloodPressure}
                              onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                            />
                          </div>
                          <div className="vital-input">
                            <label><FaHeartbeat /> Pulse</label>
                            <input
                              type="number"
                              placeholder="72"
                              value={vitals.pulse}
                              onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            />
                          </div>
                          <div className="vital-input">
                            <label><FaThermometerHalf /> Temp (°F)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="98.6"
                              value={vitals.temperature}
                              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            />
                          </div>
                          <div className="vital-input">
                            <label><FaWeight /> Weight (kg)</label>
                            <input
                              type="number"
                              placeholder="65"
                              value={vitals.weight}
                              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                            />
                          </div>
                          <div className="vital-input">
                            <label>SpO2 (%)</label>
                            <input
                              type="number"
                              placeholder="98"
                              value={vitals.spo2}
                              onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                            />
                          </div>
                          <div className="vital-input">
                            <label>Resp. Rate</label>
                            <input
                              type="number"
                              placeholder="16"
                              value={vitals.respiratoryRate}
                              onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="vitals-actions">
                          <button className="cancel-btn" onClick={() => setExpandedFor(null)}>
                            Cancel
                          </button>
                          <button
                            className="save-btn"
                            onClick={handleRecordVitals}
                            disabled={loading}
                          >
                            {loading ? "Saving..." : "Save Vitals"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {opdQueue.filter(p => p.showVitals).length === 0 && (
              <div className="empty-state">
                <FaCheckCircle size={48} />
                <p>All vitals recorded!</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

    
      {activeTab === "beds" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaBed /> Bed Census</h3>
          <div className="ward-stats">
            {Object.entries(getWardStats()).map(([ward, stats]) => (
              <div key={ward} className="ward-stat-card">
                <h4>{ward}</h4>
                <div className="stat-row">
                  <span className="available">{stats.available} Available</span>
                  <span className="occupied">{stats.occupied} Occupied</span>
                  <span className="maintenance">{stats.maintenance} Maintenance</span>
                  <span className="total">{stats.total} Total</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bed-grid">
            {beds.map((bed) => (
              <div key={bed.id} className={`bed-card ${bed.status?.toLowerCase()}`}>
                <div className="bed-number">{bed.bedNumber}</div>
                <div className="bed-ward">{bed.ward}</div>
                {bed.status === "OCCUPIED" && bed.currentPatientName && (
                  <div className="bed-patient">
                    <FaUserInjured />
                    <div>
                      <span>{bed.currentPatientName}</span>
                      <small>Admitted: {bed.admissionDate}</small>
                    </div>
                  </div>
                )}
                <div className={`bed-status-badge ${bed.status?.toLowerCase()}`}>{bed.status}</div>
                {bed.status !== "OCCUPIED" && (
                  <button
                    className="maintenance-btn"
                    onClick={() => toggleBedMaintenance(bed)}
                    title="Toggle Maintenance/Cleaning"
                  >
                    <FaBroom />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "admissions" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaProcedures /> Pending Admission Requests</h3>
          <div className="admission-list">
            {admissionRequests.map((request) => (
              <div key={request.id} className="admission-card">
                <div className="admission-info">
                  <h4>{request.patientName}</h4>
                  <p><strong>Referred by:</strong> {request.doctorName}</p>
                  <p><strong>Reason:</strong> {request.admissionReason || "N/A"}</p>
                  <p><strong>Requested Ward:</strong> {request.requestedWard}</p>
                  {request.priority && (
                    <span className={`priority-badge ${request.priority.toLowerCase()}`}>
                      {request.priority}
                    </span>
                  )}
                </div>
                <div className="admission-actions">
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAdmitPatient(request, e.target.value);
                    }}
                    disabled={loading}
                  >
                    <option value="">Select Available Bed</option>
                    {beds
                      .filter(
                        (b) =>
                          b.status === "AVAILABLE" &&
                          b.ward.toLowerCase().includes(request.requestedWard?.toLowerCase().split(" ")[0] || "")
                      )
                      .map((bed) => (
                        <option key={bed.id} value={bed.id}>
                          {bed.bedNumber} - {bed.ward}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
            {admissionRequests.length === 0 && (
              <div className="empty-state">
                <FaProcedures size={48} />
                <p>No pending admission requests</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "ipd" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaUserInjured /> Currently Admitted Patients</h3>
          <div className="ipd-list">
            {admittedPatients.length === 0 ? (
              <div className="empty-state">
                <FaUserInjured size={48} />
                <p>No patients currently admitted</p>
              </div>
            ) : (
              admittedPatients.map((patient) => (
                <div key={patient.id} className="ipd-card">
                  <div className="uhid-badge">{patient.uhid || "UHID Pending"}</div>
                  <h4>{patient.patientName}</h4>
                  <div className="ipd-details">
                    <p><strong>Ward:</strong> {patient.ward}</p>
                    <p><strong>Bed:</strong> {patient.bedNumber}</p>
                    <p><strong>Admitted on:</strong> {new Date(patient.admissionDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NurseModule;