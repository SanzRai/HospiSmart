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
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/admin/insurance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setInsurances(data);
      }
    } catch (err) {
      alert("Failed to load insurance providers. Please login as admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("adminToken");
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

      if (res.ok) {
        alert(`Insurance provider ${editMode ? "updated" : "added"} successfully!`);
        fetchInsurances();
        setShowModal(false);
      } else {
        const err = await res.text();
        alert(err || "Failed to save");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
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
    if (!window.confirm("Delete this insurance provider permanently?")) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/insurance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchInsurances();
        alert("Deleted successfully");
      }
    } catch {
      alert("Delete failed");
    }
  };

  const toggleStatus = async (id, current) => {
    if (!window.confirm(`Really ${current ? "DEACTIVATE" : "ACTIVATE"} this provider?`)) return;
    const token = localStorage.getItem("adminToken");
    try {
      await fetch(`${API_BASE_URL}/admin/insurance/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchInsurances();
    } catch {
      alert("Failed to update status");
    }
  };

  const updateCoverage = (service, value) => {
    const num = value === "" ? 0 : Number(value);
    if (value === "" || (num >= 0 && num <= 100)) {
      setCurrentInsurance(prev => ({
        ...prev,
        coverage: { ...prev.coverage, [service]: num }
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

  if (loading) return <div className="loading">Loading insurance providers...</div>;

  return (
    <div className="insurance-management">
      {/* Header */}
      <div className="header-bar">
        <h1><FaShieldAlt /> Insurance Provider Management</h1>
        <button onClick={() => { setEditMode(false); setCurrentInsurance({ id: null, name: "", isActive: true, coverage: {} }); setShowModal(true); }} className="add-btn">
          <FaPlus /> Add Provider
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card total"><strong>{insurances.length}</strong> Total Providers</div>
        <div className="stat-card active"><strong>{insurances.filter(i => i.isActive).length}</strong> Active</div>
        <div className="stat-card inactive"><strong>{insurances.filter(i => !i.isActive).length}</strong> Inactive</div>
      </div>

      {/* Controls */}
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

      {/* Table */}
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
                  <button onClick={() => setSelectedInsurance(ins)} className="view" title="View"><FaEye /></button>
                  <button onClick={() => handleEdit(ins)} className="edit" title="Edit"><FaEdit /></button>
                  <button onClick={() => toggleStatus(ins.id, ins.isActive)} className="toggle">
                    {ins.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button onClick={() => handleDelete(ins.id)} className="delete-btn"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
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
                <span> Active (Visible to patients & staff)</span>
              </label>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? "Saving..." : editMode ? "Update Provider" : "Add Provider"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedInsurance && (
        <div className="modal-overlay" onClick={() => setSelectedInsurance(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedInsurance.name}</h2>
            <div className="modal-grid">
              <div><strong>Status:</strong> <span className={selectedInsurance.isActive ? "active" : "inactive"}>{selectedInsurance.isActive ? "Active" : "Inactive"}</span></div>
              <div><strong>Coverage Details:</strong></div>
              {SERVICE_TYPES.map(srv => {
                const pct = selectedInsurance.coverage?.[srv.key] || 0;
                return pct > 0 ? (
                  <div key={srv.key}>• {srv.label}: <strong>{pct}%</strong> covered</div>
                ) : null;
              })}
              {Object.values(selectedInsurance.coverage || {}).every(v => v === 0) && (
                <div>• No services covered</div>
              )}
            </div>
            <button onClick={() => setSelectedInsurance(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagement;