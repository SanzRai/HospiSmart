import React, { useState, useEffect } from "react";
import {
  FaUserInjured,
  FaBan,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaLock,
  FaFlag,
} from "react-icons/fa";
import * as XLSX from "xlsx";
// import "../../styles/PatientManagement.css";

const API = "http://localhost:8080/api/admin/patients";

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null); // For View Modal

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unauthorized or failed");
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      alert("Failed to load patients. Login as admin!");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Active / Inactive
  const handleToggle = async (id, current) => {
    if (!window.confirm(`Really ${current ? "DEACTIVATE" : "ACTIVATE"} this patient?`)) return;

    try {
      const res = await fetch(`${API}/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error();
      alert(`Patient ${current ? "DEACTIVATED" : "ACTIVATED"}`);
      loadPatients();
    } catch {
      alert("Failed to update status");
    }
  };

  // Blacklist / Unblacklist
  const handleBlacklist = async (id, isBlacklisted, currentReason) => {
    if (isBlacklisted) {
      if (!window.confirm("Unblacklist this patient?")) return;
      try {
        await fetch(`${API}/${id}/blacklist`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ reason: null }),
        });
        alert("Patient unblacklisted");
        loadPatients();
      } catch {
        alert("Failed");
      }
      return;
    }

    const reason = window.prompt("Blacklist reason:");
    if (!reason?.trim()) return alert("Reason required!");

    try {
      await fetch(`${API}/${id}/blacklist`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      alert("Patient blacklisted");
      loadPatients();
    } catch {
      alert("Failed to blacklist");
    }
  };

  // Reset Password + Simulate SMS
  const handleResetPassword = async (id) => {
    if (!window.confirm("Reset password to 'temp123'?\nSMS will be sent to patient.")) return;

    try {
      const res = await fetch(`${API}/${id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (res.ok) {
        alert("Password reset to: temp123\nSMS sent to patient!");
      } else {
        alert("Failed to reset password");
      }
    } catch {
      alert("Network error");
    }
  };

  // Export Excel
  const exportExcel = () => {
    const data = patients.map(p => ({
      Name: p.name,
      Phone: p.phoneNumber,
      Email: p.email || "-",
      SSF: p.ssfNumber || "No",
      Insurance: p.insuranceProvider || "No",
      Status: p.isActive ? "Active" : "Inactive",
      Blacklisted: p.isBlacklisted ? "YES" : "No",
      "Blacklist Reason": p.blacklistReason || "-",
      "Total Visits": p.totalVisits,
      Registered: new Date(p.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, "HospiSmart_Patients.xlsx");
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const match = p.name?.toLowerCase().includes(q) ||
                  p.phoneNumber?.includes(search) ||
                  p.email?.toLowerCase().includes(q) ||
                  p.ssfNumber?.includes(search);

    if (filter === "active") return p.isActive && match;
    if (filter === "inactive") return !p.isActive && match;
    if (filter === "blacklisted") return p.isBlacklisted && match;
    if (filter === "ssf") return p.ssfNumber && match;
    if (filter === "insurance") return p.insuranceProvider && match;
    return match;
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="patient-management">
      <h1><FaUserInjured /> Patient Management</h1>

      <div className="stats-grid">
        <div className="stat-card total"><strong>{patients.length}</strong> Total</div>
        <div className="stat-card active"><strong>{patients.filter(p => p.isActive).length}</strong> Active</div>
        <div className="stat-card blacklisted"><strong>{patients.filter(p => p.isBlacklisted).length}</strong> Blacklisted</div>
        <div className="stat-card ssf"><strong>{patients.filter(p => p.ssfNumber).length}</strong> SSF</div>
        <div className="stat-card insurance"><strong>{patients.filter(p => p.insuranceProvider).length}</strong> Insurance</div>
      </div>

      <div className="controls">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
          <option value="ssf">SSF</option>
          <option value="insurance">Insurance</option>
        </select>
        <button onClick={exportExcel} className="export-btn"><FaDownload /> Export</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>SSF</th>
              <th>Insurance</th>
              <th>Visits</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={p.isBlacklisted ? "blacklisted-row" : ""}>
                <td><strong>{p.name}</strong></td>
                <td>{p.phoneNumber}</td>
                <td>{p.ssfNumber ? "Yes" : "No"}</td>
                <td>{p.insuranceProvider || "—"}</td>
                <td className="center">{p.totalVisits}</td>
                <td>
                  <span className={`status ${p.isActive ? "active" : "inactive"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                  {p.isBlacklisted && <FaFlag className="flag" title={p.blacklistReason} />}
                </td>
                <td className="actions">
                  <button onClick={() => setSelectedPatient(p)} className="view" title="View Details">
                    <FaEye />
                  </button>
                  <button onClick={() => handleToggle(p.id, p.isActive)} className="toggle">
                    {p.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button
                    onClick={() => handleBlacklist(p.id, p.isBlacklisted, p.blacklistReason)}
                    className={p.isBlacklisted ? "unban" : "ban"}
                    title={p.isBlacklisted ? "Unblacklist" : "Blacklist"}
                  >
                    {p.isBlacklisted ? <FaBan style={{ color: "#10b981" }} /> : <FaFlag />}
                  </button>
                  <button onClick={() => handleResetPassword(p.id)} className="reset">
                    <FaLock />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Patient Details</h2>
            <div className="modal-grid">
              <div><strong>Name:</strong> {selectedPatient.name}</div>
              <div><strong>Phone:</strong> {selectedPatient.phoneNumber}</div>
              <div><strong>Email:</strong> {selectedPatient.email || "—"}</div>
              <div><strong>Gender:</strong> {selectedPatient.gender || "—"}</div>
              <div><strong>SSF:</strong> {selectedPatient.ssfNumber || "No"}</div>
              <div><strong>Insurance:</strong> {selectedPatient.insuranceProvider || "No"}</div>
              <div><strong>Visits:</strong> {selectedPatient.totalVisits}</div>
              <div><strong>Status:</strong> {selectedPatient.isActive ? "Active" : "Inactive"}</div>
              <div><strong>Blacklisted:</strong> {selectedPatient.isBlacklisted ? "YES" : "No"}</div>
              {selectedPatient.isBlacklisted && (
                <div><strong>Reason:</strong> {selectedPatient.blacklistReason}</div>
              )}
              <div><strong>Registered:</strong> {new Date(selectedPatient.createdAt).toLocaleDateString()}</div>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;