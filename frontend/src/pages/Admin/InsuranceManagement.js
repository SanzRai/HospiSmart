import React, { useState, useEffect } from "react";
import {
  FaShieldAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaSearch,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../../styles/AdminManagement.css";

const API_BASE_URL = "http://localhost:8080/api";

const SERVICE_TYPES = [
  { key: "OPD", label: "OPD Consultation" },
  { key: "APPOINTMENT", label: "Appointment Fee" },
  { key: "IPD", label: "IPD / Room Charges" },
  { key: "LAB", label: "Lab Tests" },
  { key: "RADIOLOGY", label: "X-Ray, MRI, CT" },
  { key: "PROCEDURE", label: "Minor/Major Procedures" },
  { key: "PHARMACY", label: "Medicines" },
];

const InsuranceManagement = () => {
  const [insurances, setInsurances] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);

  const [currentInsurance, setCurrentInsurance] = useState({
    id: null,
    name: "",
    isActive: true,
    coverage: {},
  });

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`${API_BASE_URL}/admin/insurance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) throw new Error("Failed to load insurance providers");

      const data = await res.json();
      setInsurances(data);
      setMessage(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const url = editMode
      ? `${API_BASE_URL}/admin/insurance/${currentInsurance.id}`
      : `${API_BASE_URL}/admin/insurance`;

    try {
      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentInsurance),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage({
        type: "success",
        text: `Insurance provider ${editMode ? "updated" : "added"} successfully!`,
      });
      fetchInsurances();
      setShowModal(false);
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    }
  };

  const handleEdit = (ins) => {
    setCurrentInsurance({
      id: ins.id,
      name: ins.name,
      isActive: ins.isActive,
      coverage: { ...ins.coverage } || {},
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this insurance provider permanently?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/admin/insurance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: "Insurance provider deleted successfully" });
      fetchInsurances();
    } catch {
      setMessage({ type: "error", text: "Could not delete provider" });
    }
  };

  const toggleStatus = async (id, current) => {
    const action = current ? "DEACTIVATE" : "ACTIVATE";
    if (!window.confirm(`Really ${action} this provider?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/admin/insurance/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: `Provider ${action}d successfully` });
      fetchInsurances();
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  const updateCoverage = (service, value) => {
    const num = value === "" ? 0 : Number(value);
    if (value === "" || (num >= 0 && num <= 100)) {
      setCurrentInsurance(prev => ({
        ...prev,
        coverage: { ...prev.coverage, [service]: num },
      }));
    }
  };

  const exportExcel = () => {
    const data = insurances.map(ins => ({
      "Provider Name": ins.name,
      "Status": ins.isActive ? "Active" : "Inactive",
      ...Object.fromEntries(
        SERVICE_TYPES.map(s => [s.label, `${ins.coverage?.[s.key] || 0}%`])
      ),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insurance Providers");
    XLSX.writeFile(wb, "HospiSmart_Insurance_Providers.xlsx");
  };

  const filtered = insurances.filter(ins =>
    ins.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-state">Loading insurance providers...</div>;

  return (
    <div className="insurance-management">
      <div className="header-bar">
        <h1><FaShieldAlt /> Insurance Provider Management</h1>
        <button
          onClick={() => {
            setEditMode(false);
            setCurrentInsurance({ id: null, name: "", isActive: true, coverage: {} });
            setShowModal(true);
          }}
          className="add-btn"
        >
          <FaPlus /> Add Provider
        </button>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <strong>{insurances.length}</strong>
          <span>Total Providers</span>
        </div>
        <div className="stat-card active">
          <strong>{insurances.filter(i => i.isActive).length}</strong>
          <span>Active</span>
        </div>
        <div className="stat-card inactive">
          <strong>{insurances.filter(i => !i.isActive).length}</strong>
          <span>Inactive</span>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search provider name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={exportExcel} className="export-btn">
          <FaDownload /> Export Excel
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Provider Name</th>
              <th>Coverage Summary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ins => (
              <tr key={ins.id}>
                <td><strong>{ins.name}</strong></td>
                <td>
                  {Object.entries(ins.coverage || {})
                    .filter(([_, pct]) => pct > 0)
                    .map(([svc, pct]) => (
                      <div key={svc} className="coverage-tag">
                        {SERVICE_TYPES.find(s => s.key === svc)?.label || svc}: <strong>{pct}%</strong>
                      </div>
                    ))}
                  {Object.keys(ins.coverage || {}).length === 0 && "— No coverage defined"}
                </td>
                <td>
                  <span className={`status ${ins.isActive ? "active" : "inactive"}`}>
                    {ins.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => setSelectedInsurance(ins)} className="action-btn view" title="View">
                    <FaEye />
                  </button>
                  <button onClick={() => handleEdit(ins)} className="action-btn edit" title="Edit">
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => toggleStatus(ins.id, ins.isActive)}
                    className={`action-btn toggle ${ins.isActive ? "deactivate" : "activate"}`}
                    title={ins.isActive ? "Deactivate" : "Activate"}
                  >
                    {ins.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button onClick={() => handleDelete(ins.id)} className="action-btn delete" title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h2>{editMode ? "Edit Insurance Provider" : "Add New Insurance Provider"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Provider Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Star Health, HDFC Ergo, ICICI Lombard"
                  value={currentInsurance.name}
                  onChange={e => setCurrentInsurance({ ...currentInsurance, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Coverage Percentage by Service</label>
                <div className="coverage-grid">
                  {SERVICE_TYPES.map(srv => (
                    <div key={srv.key} className="coverage-item">
                      <label>{srv.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={currentInsurance.coverage?.[srv.key] || ""}
                        onChange={e => updateCoverage(srv.key, e.target.value)}
                      />
                      <span>% covered</span>
                    </div>
                  ))}
                </div>
                <small>Set 0% if not covered • Max 100%</small>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={currentInsurance.isActive}
                  onChange={e => setCurrentInsurance({ ...currentInsurance, isActive: e.target.checked })}
                />
                <span>Active (Visible to patients & staff)</span>
              </label>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editMode ? "Update Provider" : "Add Provider"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

 
      {selectedInsurance && (
        <div className="modal-overlay" onClick={() => setSelectedInsurance(null)}>
          <div className="modal simple-view" onClick={e => e.stopPropagation()}>
            <h2>{selectedInsurance.name}</h2>
            <div className="modal-content">
              <p>
                <strong>Status:</strong>{" "}
                <span className={selectedInsurance.isActive ? "status-active" : "status-inactive"}>
                  {selectedInsurance.isActive ? "Active" : "Inactive"}
                </span>
              </p>
              <p><strong>Coverage Details:</strong></p>
              {SERVICE_TYPES.map(srv => {
                const pct = selectedInsurance.coverage?.[srv.key] || 0;
                return pct > 0 ? (
                  <div key={srv.key} className="coverage-item">
                    {srv.label}: <strong>{pct}%</strong>
                  </div>
                ) : null;
              })}
              {Object.values(selectedInsurance.coverage || {}).every(v => v === 0) && (
                <p className="no-coverage">No services covered</p>
              )}
            </div>
            <button className="close-btn" onClick={() => setSelectedInsurance(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagement;