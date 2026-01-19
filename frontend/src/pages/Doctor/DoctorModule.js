import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";
import {
  FaUserMd, FaStethoscope, FaPrescriptionBottleAlt, FaFlask, FaHistory,
  FaClock, FaSave, FaPlus, FaTrash, FaCheckCircle, FaProcedures,
  FaFileMedicalAlt, FaPrint, FaBed
} from "react-icons/fa";
import "../../styles/DoctorModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const DoctorModule = () => {
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("queue");
  const [queue, setQueue] = useState([]);
  const [ipdPatients, setIpdPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedIpdPatient, setSelectedIpdPatient] = useState(null);
  const [ipdTab, setIpdTab] = useState("notes");
  const [patientHistory, setPatientHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [progressNotes, setProgressNotes] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [advice, setAdvice] = useState("");
  const [outcome, setOutcome] = useState("discharge");
  const [followUpDays, setFollowUpDays] = useState(7);
  const [admissionWard, setAdmissionWard] = useState("General Ward");
  const [dailyNote, setDailyNote] = useState("");
  const [vitals, setVitals] = useState({ bp: "", temp: "", pulse: "", spo2: "" });
  const [dischargeData, setDischargeData] = useState({
    finalDiagnosis: "", courseInHospital: "", treatmentGiven: "", adviceOnDischarge: "", followUp: ""
  });
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [errors, setErrors] = useState({ diagnosis: "", medicines: "" });
  const [noteError, setNoteError] = useState("");
  const [dischargeErrors, setDischargeErrors] = useState({ finalDiagnosis: "" });

  const [toast, setToast] = useState(null);

  const printRef = useRef();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Prescription-${selectedPatient?.patientName || 'Patient'}`,
  });

  const commonMedicines = ["Paracetamol 500mg", "Amoxicillin 500mg", "Pantoprazole 40mg", "Cetirizine 10mg", "Metronidazole 400mg", "Ibuprofen 400mg"];
  const commonLabs = ["CBC", "Urine R/E", "Blood Sugar Random", "Lipid Profile", "X-Ray Chest PA", "USG Abdomen"];
  const templates = [
    { name: "Viral Fever", diagnosis: "Viral Fever", complaint: "Fever, body ache", medicines: [{ name: "Paracetamol 500mg", dosage: "1-0-1", duration: "3 Days", instruction: "After Food" }], advice: "Rest & Fluids" },
    { name: "Gastritis", diagnosis: "Acute Gastritis", complaint: "Stomach pain", medicines: [{ name: "Pantoprazole 40mg", dosage: "1-0-0", duration: "14 Days", instruction: "Before Food" }], advice: "Avoid spicy food" }
  ];

  useEffect(() => {
    const stored = localStorage.getItem("doctorInfo");
    if (stored) setDoctorInfo(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (doctorInfo?.id) {
      fetchQueue();
      fetchIpdPatients();
    }
  }, [doctorInfo]);

  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    return response.json();
  };

  const fetchQueue = async () => {
    try {
      setFetchError(null);
      const data = await apiFetch(`${API_BASE_URL}/doctor-portal/queue/${doctorInfo.id}`);
      setQueue(data);
    } catch (err) {
      setFetchError("Failed to load waiting patients");
    }
  };

  const fetchIpdPatients = async () => {
    try {
      setFetchError(null);
      const data = await apiFetch(`${API_BASE_URL}/doctor-portal/ipd/patients`);
      setIpdPatients(data);
    } catch (err) {
      setFetchError("Failed to load admitted patients");
    }
  };

  const fetchProgressNotes = async (ipdId) => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/doctor-portal/ipd/patient/${ipdId}/notes`);
      setProgressNotes(data);
    } catch (err) {}
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setActiveTab("consult");
    resetOpdForm();

    try {
      const patientId = patient.patientId || patient.id;
      const [histData, labData] = await Promise.all([
        apiFetch(`${API_BASE_URL}/doctor-portal/history/${patientId}`).catch(() => []),
        apiFetch(`${API_BASE_URL}/lab/doctor/patient/${patientId}`).catch(() => [])
      ]);
      setPatientHistory(histData);
      setLabReports(labData);
    } catch (err) {
      showToast("error", "Failed to fetch patient history or labs");
    }
  };

  const resetOpdForm = () => {
    setDiagnosis("");
    setChiefComplaint("");
    setMedicines([]);
    setSelectedLabs([]);
    setAdvice("");
    setOutcome("discharge");
    setFollowUpDays(7);
    setAdmissionWard("General Ward");
    setErrors({ diagnosis: "", medicines: "" });
  };

  const applyTemplate = (t) => {
    setDiagnosis(t.diagnosis);
    setChiefComplaint(t.complaint);
    setMedicines([...t.medicines]);
    setAdvice(t.advice);
    setErrors({ diagnosis: "", medicines: "" });
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "1-0-1", duration: "5 Days", instruction: "After Food" }]);
    setErrors(prev => ({ ...prev, medicines: "" }));
  };

  const updateMedicine = (i, f, v) => {
    const u = [...medicines];
    u[i][f] = v;
    setMedicines(u);
  };

  const removeMedicine = (i) => {
    setMedicines(medicines.filter((_, idx) => idx !== i));
  };

  const toggleLab = (l) => {
    setSelectedLabs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  };

  const handleSavePrescription = async () => {
    const newErrors = { diagnosis: "", medicines: "" };
    let valid = true;

    if (!diagnosis.trim()) {
      newErrors.diagnosis = "Diagnosis is required";
      valid = false;
    }
    if (medicines.length === 0) {
      newErrors.medicines = "At least one medicine is required";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    setSaving(true);

    const patientId = selectedPatient.patientId || selectedPatient.id;

    const payload = {
      patientId,
      patientName: selectedPatient.patientName,
      doctorId: doctorInfo?.id,
      doctorName: doctorInfo?.name,
      chiefComplaint,
      diagnosis,
      medicines,
      labTests: selectedLabs,
      advice,
      outcome,
      followUpDays: outcome === 'followup' ? Number(followUpDays) : null,
      admissionWard: outcome === 'admit' ? admissionWard : null
    };

    if (selectedPatient.type === "APPOINTMENT") {
      payload.appointmentId = selectedPatient.id;
    } else {
      payload.opdTicketId = selectedPatient.id;
    }

    try {
      await apiFetch(`${API_BASE_URL}/doctor-portal/prescribe`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showToast("success", outcome === 'admit' ? "Prescription Saved & Admission Requested!" : "Prescription Saved Successfully!");
      fetchQueue();
      setActiveTab("queue");
      setSelectedPatient(null);
    } catch (err) {
      showToast("error", "Failed to save prescription");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectIpdPatient = (patient) => {
    setSelectedIpdPatient(patient);
    setIpdTab("notes");
    fetchProgressNotes(patient.id);
  };

  const handleSaveProgressNote = async () => {
    if (!dailyNote.trim()) {
      setNoteError("Progress note is required");
      return;
    }
    setNoteError("");

    setSaving(true);

    const payload = {
      ipdPatientId: selectedIpdPatient.id,
      doctorName: doctorInfo?.name,
      progressNote: dailyNote,
      bp: vitals.bp,
      pulse: vitals.pulse,
      temp: vitals.temp,
      spo2: vitals.spo2
    };

    try {
      await apiFetch(`${API_BASE_URL}/doctor-portal/ipd/progress`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("success", "Progress Note Added");
      setDailyNote("");
      setVitals({ bp: "", temp: "", pulse: "", spo2: "" });
      fetchProgressNotes(selectedIpdPatient.id);
    } catch (err) {
      showToast("error", "Error saving note");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDischarge = async () => {
    if (!dischargeData.finalDiagnosis.trim()) {
      setDischargeErrors({ finalDiagnosis: "Final Diagnosis is required" });
      return;
    }
    setDischargeErrors({ finalDiagnosis: "" });

    setSaving(true);

    const payload = {
      ipdPatientId: selectedIpdPatient.id,
      patientName: selectedIpdPatient.patientName,
      uhid: selectedIpdPatient.uhid,
      consultantInCharge: doctorInfo?.name,
      ...dischargeData
    };

    try {
      await apiFetch(`${API_BASE_URL}/doctor-portal/ipd/discharge`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("success", "Discharge Summary Generated Successfully!");
      setActiveTab("ipd");
      setSelectedIpdPatient(null);
    } catch (err) {
      showToast("error", "Error generating discharge");
    } finally {
      setSaving(false);
    }
  };

  if (!doctorInfo) return <div>Loading doctor information...</div>;

  return (
    <div className="doctor-module-container">
      <div className="doc-stats-bar">
        <div className="stat-box primary">
          <div className="icon-wrapper"><FaClock /></div>
          <div className="stat-text">
            <h3>{queue.length}</h3>
            <span>OPD Waiting</span>
          </div>
        </div>
        <div className="stat-box secondary">
          <div className="icon-wrapper"><FaProcedures /></div>
          <div className="stat-text">
            <h3>{ipdPatients.length}</h3>
            <span>Admitted</span>
          </div>
        </div>
      </div>

      {fetchError && (
        <div style={{ color: "red", textAlign: "center", padding: "1rem", background: "#fee2e2", borderRadius: "8px", margin: "1rem 0" }}>
          {fetchError}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="doc-nav-tabs">
        <button className={activeTab === "queue" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("queue")}>
          <FaStethoscope /> OPD Queue
        </button>
        <button className={activeTab === "consult" ? "tab-btn active" : "tab-btn"} onClick={() => selectedPatient && setActiveTab("consult")} disabled={!selectedPatient}>
          <FaPrescriptionBottleAlt /> OPD Consult
        </button>
        <button className={activeTab === "ipd" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("ipd")}>
          <FaBed /> IPD Rounds
        </button>
      </div>

      <div className="doc-content-area">
        {activeTab === "queue" && (
          <motion.div className="queue-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {queue.length === 0 ? (
              <div className="empty-queue-message">
                <FaCheckCircle size={40} />
                <h3>All Caught Up!</h3>
                <p>No patients waiting.</p>
              </div>
            ) : (
              <div className="queue-grid">
                {queue.map(patient => (
                  <div key={patient.id} className="patient-card">
                    <div className="card-left">
                      <span className={`type-badge ${patient.type === 'APPOINTMENT' ? 'apt' : 'opd'}`}>
                        {patient.type === 'APPOINTMENT' ? 'APT' : 'OPD'}
                      </span>
                      <span className="token-number">{patient.tokenNumber}</span>
                    </div>
                    <div className="card-mid">
                      <h4>{patient.patientName}</h4>
                      <p>{patient.symptoms || "Regular Checkup"}</p>
                    </div>
                    <div className="card-right">
                      <button
                        className="consult-btn"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        Consult
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "consult" && selectedPatient && (
          <motion.div className="consultation-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <aside className="consult-sidebar no-print">
              <div className="sidebar-block">
                <div className="block-header"><FaHistory /> History</div>
                <div className="block-content">
                  {patientHistory.map(h => (
                    <div key={h.id} className="mini-card">
                      <small>{new Date(h.visitDate).toLocaleDateString()}</small>
                      <strong>{h.diagnosis}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sidebar-block">
                <div className="block-header"><FaFlask /> Reports</div>
                <div className="block-content">
                  {labReports.map(l => (
                    <div key={l.id} className={`mini-card status-${l.status.toLowerCase()}`}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{l.testName}</strong>
                        <span className={`status-dot ${l.status.toLowerCase()}`}></span>
                      </div>
                      <small>{l.status}</small>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="rx-pad">
              <div ref={printRef} className="print-content">
                <div className="print-only-header">
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <h1 style={{ margin: 0 }}>HospiSmart Hospital</h1>
                    <p style={{ margin: 0 }}>Kathmandu, Nepal | Ph: 01-444444</p>
                  </div>
                  <hr />
                  <div className="patient-meta" style={{ display: "flex", justifyContent: "space-between", margin: "15px 0" }}>
                    <div>
                      <p><strong>Patient:</strong> {selectedPatient.patientName}</p>
                      <p><strong>Age/Sex:</strong> {selectedPatient.patientAge || "N/A"}</p>
                    </div>
                    <div>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p><strong>Doctor:</strong> {doctorInfo?.name}</p>
                    </div>
                  </div>
                  <hr />
                </div>

                <div className="rx-section templates no-print">
                  <span>Quick Fill:</span>
                  <div className="template-list">
                    {templates.map(t => (
                      <button key={t.name} onClick={() => applyTemplate(t)}>{t.name}</button>
                    ))}
                  </div>
                </div>

                <div className="rx-row">
                  <div className="rx-input-group">
                    <label>Chief Complaint</label>
                    <textarea value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} rows="2" />
                  </div>
                  <div className="rx-input-group">
                    <label>Diagnosis *</label>
                    <input
                      value={diagnosis}
                      onChange={e => {
                        setDiagnosis(e.target.value);
                        setErrors(prev => ({ ...prev, diagnosis: "" }));
                      }}
                      className="highlight-input"
                    />
                    {errors.diagnosis && <div className="field-error">{errors.diagnosis}</div>}
                  </div>
                </div>

                <div className="rx-section medicines">
                  <div className="section-header">
                    <label>Rx (Medicines)</label>
                    <button onClick={addMedicine} className="icon-btn add no-print"><FaPlus /> Add</button>
                  </div>
                  <div className="med-list">
                    {medicines.map((m, i) => (
                      <div key={i} className="med-row">
                        <input list="meds" value={m.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Name" />
                        <input value={m.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} placeholder="1-0-1" className="short" />
                        <input value={m.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} placeholder="Days" className="short" />
                        <input value={m.instruction} onChange={e => updateMedicine(i, 'instruction', e.target.value)} placeholder="Note" />
                        <button onClick={() => removeMedicine(i)} className="icon-btn delete no-print"><FaTrash /></button>
                      </div>
                    ))}
                  </div>
                  {errors.medicines && <div className="field-error">{errors.medicines}</div>}
                  <datalist id="meds">{commonMedicines.map(m => <option key={m} value={m} />)}</datalist>
                </div>

                <div className="rx-section labs">
                  <label>Investigations</label>
                  <div className="chip-grid">
                    {commonLabs.map(lab => (
                      <div key={lab} className={`chip ${selectedLabs.includes(lab) ? 'selected' : ''}`} onClick={() => toggleLab(lab)}>
                        {lab}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rx-input-group">
                  <label>Advice</label>
                  <textarea value={advice} onChange={e => setAdvice(e.target.value)} rows="2" />
                </div>

                <div className="print-only-footer" style={{ display: "none", marginTop: "50px", textAlign: "right" }}>
                  <p>___________________</p>
                  <p>Doctor's Signature</p>
                </div>
              </div>

              <div className="outcome-section no-print">
                <label>Outcome / Plan</label>
                <div className="outcome-options">
                  <label className={`outcome-opt ${outcome === 'discharge' ? 'selected' : ''}`}>
                    <input type="radio" name="outcome" checked={outcome === 'discharge'} onChange={() => setOutcome('discharge')} />
                    Treated & Discharge
                  </label>
                  <label className={`outcome-opt ${outcome === 'followup' ? 'selected' : ''}`}>
                    <input type="radio" name="outcome" checked={outcome === 'followup'} onChange={() => setOutcome('followup')} />
                    Follow Up
                  </label>
                  <label className={`outcome-opt ${outcome === 'admit' ? 'selected' : ''}`}>
                    <input type="radio" name="outcome" checked={outcome === 'admit'} onChange={() => setOutcome('admit')} />
                    Admit Patient
                  </label>
                </div>

                {outcome === 'followup' && (
                  <div className="sub-outcome">
                    <span>Follow up after:</span>
                    <input type="number" value={followUpDays} onChange={e => setFollowUpDays(e.target.value)} style={{ width: '60px' }} /> Days
                  </div>
                )}

                {outcome === 'admit' && (
                  <div className="sub-outcome">
                    <span>Request Admission to:</span>
                    <select value={admissionWard} onChange={e => setAdmissionWard(e.target.value)}>
                      <option>General Ward</option>
                      <option>Private Cabin</option>
                      <option>ICU</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="rx-footer no-print">
                <button className="btn secondary" onClick={() => setActiveTab("queue")}>Cancel</button>
                <button className="btn outline" onClick={handlePrint}><FaPrint /> Print Rx</button>
                <button className="btn primary" onClick={handleSavePrescription} disabled={saving}>
                  <FaSave /> {saving ? "Saving..." : "Save & Finish"}
                </button>
              </div>
            </main>
          </motion.div>
        )}

        {activeTab === "ipd" && (
          <motion.div className="ipd-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="ipd-list">
              <h3>Admitted Patients</h3>
              {ipdPatients.length === 0 && <p className="no-data">No patients admitted.</p>}
              {ipdPatients.map(p => (
                <div 
                  key={p.id} 
                  className={`ipd-card ${selectedIpdPatient?.id === p.id ? 'active' : ''}`} 
                  onClick={() => handleSelectIpdPatient(p)}
                >
                  <div className="bed-badge">{p.ward} - {p.bedNumber}</div>
                  <h4>{p.patientName}</h4>
                </div>
              ))}
            </div>

            {selectedIpdPatient ? (
              <div className="ipd-workspace">
                <div className="workspace-header">
                  <h2>{selectedIpdPatient.patientName} <span className="uhid-tag">{selectedIpdPatient.uhid}</span></h2>
                  <div className="workspace-tabs">
                    <button className={ipdTab === "notes" ? "active" : ""} onClick={() => setIpdTab("notes")}>Progress Notes</button>
                    <button className={ipdTab === "discharge" ? "active" : ""} onClick={() => setIpdTab("discharge")}>Discharge</button>
                  </div>
                </div>

                {ipdTab === "notes" && (
                  <div className="progress-section">
                    <div className="add-note-form">
                      <h4>Add Daily Note</h4>
                      <div className="vitals-row">
                        <input placeholder="BP" value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} />
                        <input placeholder="Temp" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} />
                        <input placeholder="Pulse" value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} />
                      </div>
                      <textarea
                        placeholder="Observation..."
                        rows="2"
                        value={dailyNote}
                        onChange={e => {
                          setDailyNote(e.target.value);
                          setNoteError("");
                        }}
                      />
                      {noteError && <div className="field-error">{noteError}</div>}
                      <button className="btn primary small" onClick={handleSaveProgressNote} disabled={saving}>
                        Add Note
                      </button>
                    </div>

                    <div className="notes-timeline">
                      {progressNotes.map(n => (
                        <div key={n.id} className="timeline-item">
                          <small>{new Date(n.roundTime).toLocaleString()}</small>
                          <div><strong>BP:</strong> {n.bp} | <strong>Temp:</strong> {n.temp}</div>
                          <p>{n.progressNote}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ipdTab === "discharge" && (
                  <div className="discharge-form">
                    <h3>Create Discharge Summary</h3>
                    <div className="rx-input-group">
                      <label>Final Diagnosis *</label>
                      <input
                        value={dischargeData.finalDiagnosis}
                        onChange={e => {
                          setDischargeData({ ...dischargeData, finalDiagnosis: e.target.value });
                          setDischargeErrors(prev => ({ ...prev, finalDiagnosis: "" }));
                        }}
                      />
                      {dischargeErrors.finalDiagnosis && (
                        <div className="field-error">{dischargeErrors.finalDiagnosis}</div>
                      )}
                    </div>
                    <div className="rx-input-group">
                      <label>Course in Hospital</label>
                      <textarea rows="4" value={dischargeData.courseInHospital} onChange={e => setDischargeData({ ...dischargeData, courseInHospital: e.target.value })} />
                    </div>
                    <div className="rx-input-group">
                      <label>Treatment Given</label>
                      <textarea rows="3" value={dischargeData.treatmentGiven} onChange={e => setDischargeData({ ...dischargeData, treatmentGiven: e.target.value })} />
                    </div>
                    <div className="rx-input-group">
                      <label>Advice on Discharge</label>
                      <textarea rows="3" value={dischargeData.adviceOnDischarge} onChange={e => setDischargeData({ ...dischargeData, adviceOnDischarge: e.target.value })} />
                    </div>
                    <div className="rx-footer">
                      <button className="btn discharge-print" onClick={handleGenerateDischarge} disabled={saving}>
                        <FaFileMedicalAlt /> Generate & Print Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : <div className="empty-state">Select Patient</div>}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DoctorModule;