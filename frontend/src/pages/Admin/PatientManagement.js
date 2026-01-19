import React, { useState, useEffect } from "react";
import {
  FaUserInjured,
  FaBan,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaLock,
  FaFlag, FaSearch,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../../styles/AdminManagement.css";

const API = "http://localhost:8080/api/admin/patients";

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success'/'error', text: '...' }
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unauthorized or failed");

      const data = await res.json();
      setPatients(data);
      setMessage(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load patients" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, current) => {
    const action = current ? "DEACTIVATE" : "ACTIVATE";
    if (!window.confirm(`Really ${action} this patient?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: `Patient ${action}d successfully` });
      loadPatients();
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  const handleBlacklist = async (id, isBlacklisted) => {
    if (isBlacklisted) {
      if (!window.confirm("Unblacklist this patient?")) return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/${id}/blacklist`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: null }),
        });

        if (!res.ok) throw new Error();

        setMessage({ type: "success", text: "Patient unblacklisted" });
        loadPatients();
      } catch {
        setMessage({ type: "error", text: "Failed to unblacklist" });
      }
      return;
    }

    const reason = window.prompt("Blacklist reason:");
    if (!reason?.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}/blacklist`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: "Patient blacklisted" });
      loadPatients();
    } catch {
      setMessage({ type: "error", text: "Failed to blacklist" });
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Reset password to 'temp123'?\nSMS will be sent to patient.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      setMessage({
        type: "success",
        text: "Password reset to: temp123\nSMS sent to patient!",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to reset password" });
    }
  };

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
    const match =
      p.name?.toLowerCase().includes(q) ||
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

  if (loading) return <div className="loading-state">Loading patients...</div>;

  return (
    <div className="department-management">
      <div className="header-bar">
        <h1><FaUserInjured /> Patient Management</h1>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <strong>{patients.length}</strong>
          <span>Total</span>
        </div>
        <div className="stat-card active">
          <strong>{patients.filter(p => p.isActive).length}</strong>
          <span>Active</span>
        </div>
        <div className="stat-card blacklisted">
          <strong>{patients.filter(p => p.isBlacklisted).length}</strong>
          <span>Blacklisted</span>
        </div>
        <div className="stat-card ssf">
          <strong>{patients.filter(p => p.ssfNumber).length}</strong>
          <span>SSF</span>
        </div>
        <div className="stat-card insurance">
          <strong>{patients.filter(p => p.insuranceProvider).length}</strong>
          <span>Insurance</span>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
          <option value="ssf">SSF</option>
          <option value="insurance">Insurance</option>
        </select>
        <button onClick={exportExcel} className="export-btn">
          <FaDownload /> Export
        </button>
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
                  <button
                    onClick={() => setSelectedPatient(p)}
                    className="action-btn view"
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleToggle(p.id, p.isActive)}
                    className="action-btn toggle"
                    title={p.isActive ? "Deactivate" : "Activate"}
                  >
                    {p.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button
                    onClick={() => handleBlacklist(p.id, p.isBlacklisted)}
                    className={`action-btn ${p.isBlacklisted ? "unban" : "ban"}`}
                    title={p.isBlacklisted ? "Unblacklist" : "Blacklist"}
                  >
                    {p.isBlacklisted ? <FaBan /> : <FaFlag />}
                  </button>
                  <button
                    onClick={() => handleResetPassword(p.id)}
                    className="action-btn reset"
                    title="Reset Password"
                  >
                    <FaLock />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal simple-view" onClick={e => e.stopPropagation()}>
            <h2>Patient Details</h2>
            <div className="modal-content">
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Phone:</strong> {selectedPatient.phoneNumber}</p>
              <p><strong>Email:</strong> {selectedPatient.email || "—"}</p>
              <p><strong>Gender:</strong> {selectedPatient.gender || "—"}</p>
              <p><strong>SSF:</strong> {selectedPatient.ssfNumber || "No"}</p>
              <p><strong>Insurance:</strong> {selectedPatient.insuranceProvider || "No"}</p>
              <p><strong>Visits:</strong> {selectedPatient.totalVisits}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={selectedPatient.isActive ? "status-active" : "status-inactive"}>
                  {selectedPatient.isActive ? "Active" : "Inactive"}
                </span>
              </p>
              <p>
                <strong>Blacklisted:</strong> {selectedPatient.isBlacklisted ? "YES" : "No"}
              </p>
              {selectedPatient.isBlacklisted && (
                <p><strong>Reason:</strong> {selectedPatient.blacklistReason}</p>
              )}
              <p><strong>Registered:</strong> {new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
            </div>
            <button className="close-btn" onClick={() => setSelectedPatient(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;