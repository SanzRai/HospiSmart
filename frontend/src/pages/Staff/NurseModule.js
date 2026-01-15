import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

const API_BASE_URL = "http://localhost:8080/api";

const NurseModule = ({ staffInfo }) => {
  const [activeTab, setActiveTab] = useState("assign");
  const [opdQueue, setOpdQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    spo2: "",
    respiratoryRate: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    doctorId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [beds, setBeds] = useState([]);
  const [admissionRequests, setAdmissionRequests] = useState([]);
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const fetchOpdQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/opd/queue/all`);
      if (res.ok) {
        const data = await res.json();

        // Calculate estimated wait time: 8 minutes per patient ahead in the same doctor's queue
        const updatedQueue = data.map((patient) => {
          if (patient.doctorId) {
            const patientsAhead = data.filter(
              (p) =>
                p.doctorId === patient.doctorId &&
                p.status !== "COMPLETED" &&
                new Date(p.issueTime) < new Date(patient.issueTime)
            ).length;
            return { ...patient, estimatedWait: patientsAhead * 8 };
          }
          return { ...patient, estimatedWait: null }; // Not assigned yet
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
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
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
        setDoctors(docs.filter(doc => doc.isAvailable)); // Only show available doctors
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setDoctors([]);
    }
  };

  const fetchBedStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/beds`);
      if (res.ok) setBeds(await res.json());
    } catch (err) {
      console.error("Error fetching beds:", err);
    }
  };

  const fetchAdmissionRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/pending`);
      if (res.ok) setAdmissionRequests(await res.json());
    } catch (err) {
      console.error("Error fetching admission requests:", err);
    }
  };

  const fetchAdmittedPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor-portal/ipd/patients`);
      if (res.ok) setAdmittedPatients(await res.json());
    } catch (err) {
      console.error("Error fetching admitted patients:", err);
    }
  };

  const handleRecordVitals = async () => {
    if (!selectedPatient) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/opd/${selectedPatient.id}/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({
          ...vitals,
          recordedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        alert("Vitals recorded successfully!");
        setVitals({
          bloodPressure: "",
          pulse: "",
          temperature: "",
          weight: "",
          spo2: "",
          respiratoryRate: "",
        });
        setSelectedPatient(null);
        refreshData();
      }
    } catch (err) {
      console.error("Error recording vitals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedPatient || !assignmentForm.doctorId) {
      alert("Please select a doctor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/opd/${selectedPatient.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({
          doctorId: Number(assignmentForm.doctorId),
          assignedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        alert("Patient assigned to doctor successfully!");
        setSelectedPatient(null);
        setAssignmentForm({ doctorId: "" });
        refreshData();
      } else {
        alert("Failed to assign doctor.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (patient) => {
    try {
      await fetch(`${API_BASE_URL}/opd/${patient.id}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      const waitMsg = patient.estimatedWait !== null 
        ? `Estimated wait was ~${patient.estimatedWait} minutes` 
        : "Doctor assignment pending";
      alert(`Calling ${patient.patientName} - Token: ${patient.tokenNumber}\n${waitMsg}`);
    } catch (err) {
      console.error("Error calling patient:", err);
    }
  };

  const handleMarkAbsent = async (patient) => {
    if (!window.confirm(`Mark ${patient.patientName} as absent?`)) return;
    try {
      await fetch(`${API_BASE_URL}/opd/${patient.id}/absent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      refreshData();
    } catch (err) {
      console.error("Error marking absent:", err);
    }
  };

  const handleAdmitPatient = async (request, bedId) => {
    if (!bedId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/admit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          bedId: bedId,
          admittedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`${request.patientName} admitted!\nUHID: ${data.uhid}\nBed: ${data.bed}`);
        refreshData();
      } else {
        const error = await res.json();
        alert("Admission failed: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error.");
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
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBedStatus();
    } catch (err) {
      console.error("Error updating bed:", err);
    }
  };

  const getWardStats = () => {
    const stats = {};
    beds.forEach((bed) => {
      if (!stats[bed.ward]) {
        stats[bed.ward] = { total: 0, available: 0, occupied: 0, maintenance: 0 };
      }
      stats[bed.ward].total++;
      if (bed.status === "AVAILABLE") stats[bed.ward].available++;
      if (bed.status === "OCCUPIED") stats[bed.ward].occupied++;
      if (bed.status === "MAINTENANCE") stats[bed.ward].maintenance++;
    });
    return stats;
  };

  return (
    <div className="nurse-module">
      <div className="module-header">
        <h2><FaUserNurse /> Nursing Station</h2>
        <div className="quick-stats">
          <div className="stat">
            <FaStethoscope />
            <span>{opdQueue.filter(p => !p.doctorName).length} Need Assignment</span>
          </div>
          <div className="stat">
            <FaHeartbeat />
            <span>{opdQueue.filter(p => !p.vitalsRecorded).length} Need Vitals</span>
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

      {/* Assign Doctor Tab */}
      {activeTab === "assign" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Assign Doctor to Patients</h3>
          <div className="queue-list">
            {opdQueue.filter(p => !p.doctorName).map((patient, index) => (
              <div key={patient.id} className="queue-card">
                <div className="queue-number">#{index + 1}</div>
                <div className="queue-info">
                  <h4>{patient.patientName}</h4>
                  <p><strong>Token:</strong> {patient.tokenNumber}</p>
                  <p><strong>Department:</strong> {departments.find(d => d.id === patient.departmentId)?.name || "N/A"}</p>
                  <p><strong>Symptoms:</strong> {patient.symptoms || "Not provided"}</p>
                </div>
                <div className="queue-actions">
                  <button
                    className="assign-btn"
                    onClick={() => {
                      setSelectedPatient(patient);
                      setAssignmentForm({ doctorId: "" });
                      fetchDoctors(patient.departmentId);
                    }}
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
              </div>
            ))}

            {opdQueue.filter(p => !p.doctorName).length === 0 && (
              <div className="empty-state">
                <FaCheckCircle size={48} />
                <p>All patients have been assigned a doctor!</p>
              </div>
            )}
          </div>

          {/* Assignment Form */}
          {selectedPatient && !selectedPatient.doctorName && (
            <div className="assignment-form">
              <h4>Assign Doctor for {selectedPatient.patientName}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={departments.find(d => d.id === selectedPatient.departmentId)?.name || ""}
                    readOnly
                    style={{ backgroundColor: "#f0f0f0" }}
                  />
                </div>
                <div className="form-group">
                  <label>Doctor *</label>
                  <select
                    value={assignmentForm.doctorId}
                    onChange={(e) => setAssignmentForm({ doctorId: e.target.value })}
                  >
                    <option value="">Select Available Doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="cancel-btn" onClick={() => setSelectedPatient(null)}>
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
            </div>
          )}
        </motion.div>
      )}

      {/* Record Vitals Tab */}
      {activeTab === "vitals" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaHeartbeat /> Record Patient Vitals</h3>
          <div className="queue-list">
            {opdQueue.filter(p => !p.vitalsRecorded).map((patient, index) => (
              <div key={patient.id} className="queue-card">
                <div className="queue-number">#{index + 1}</div>
                <div className="queue-info">
                  <h4>{patient.patientName}</h4>
                  <p><strong>Token:</strong> {patient.tokenNumber}</p>
                  <p><strong>Doctor:</strong> {patient.doctorName || "Not assigned yet"}</p>
                  {patient.estimatedWait !== null && (
                    <p><strong>Est. Wait:</strong> ~{patient.estimatedWait} minutes</p>
                  )}
                </div>
                <div className="queue-actions">
                  <button
                    className="vitals-btn"
                    onClick={() => {
                      setSelectedPatient(patient);
                      setVitals({
                        bloodPressure: patient.bloodPressure || "",
                        pulse: patient.pulse || "",
                        temperature: patient.temperature || "",
                        weight: patient.weight || "",
                        spo2: patient.spo2 || "",
                        respiratoryRate: patient.respiratoryRate || "",
                      });
                    }}
                  >
                    <FaHeartbeat /> Record Vitals
                  </button>
                </div>
              </div>
            ))}

            {opdQueue.filter(p => !p.vitalsRecorded).length === 0 && (
              <div className="empty-state">
                <FaCheckCircle size={48} />
                <p>All vitals recorded!</p>
              </div>
            )}
          </div>

          {selectedPatient && !selectedPatient.vitalsRecorded && (
            <div className="vitals-form">
              <div className="patient-selected">
                <FaUserInjured />
                <h4>{selectedPatient.patientName} - {selectedPatient.tokenNumber}</h4>
              </div>
              <div className="vitals-grid">
                <div className="vital-input">
                  <label><FaTint /> BP</label>
                  <input type="text" placeholder="120/80" value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} />
                </div>
                <div className="vital-input">
                  <label><FaHeartbeat /> Pulse</label>
                  <input type="number" placeholder="72" value={vitals.pulse} onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })} />
                </div>
                <div className="vital-input">
                  <label><FaThermometerHalf /> Temp (°F)</label>
                  <input type="number" step="0.1" placeholder="98.6" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} />
                </div>
                <div className="vital-input">
                  <label><FaWeight /> Weight (kg)</label>
                  <input type="number" placeholder="65" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
                </div>
                <div className="vital-input">
                  <label>SpO2 (%)</label>
                  <input type="number" placeholder="98" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} />
                </div>
                <div className="vital-input">
                  <label>Resp. Rate</label>
                  <input type="number" placeholder="16" value={vitals.respiratoryRate} onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })} />
                </div>
              </div>
              <div className="vitals-actions">
                <button className="cancel-btn" onClick={() => setSelectedPatient(null)}>Cancel</button>
                <button className="save-btn" onClick={handleRecordVitals} disabled={loading}>
                  {loading ? "Saving..." : "Save Vitals"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Bed Census Tab */}
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
                  <button className="maintenance-btn" onClick={() => toggleBedMaintenance(bed)} title="Toggle Maintenance/Cleaning">
                    <FaBroom />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending Admissions Tab */}
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

      {/* Admitted Patients Tab */}
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