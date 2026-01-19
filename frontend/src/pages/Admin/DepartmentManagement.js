import React, { useState, useEffect } from "react";
import {
  FaHospital,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaSearch,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../../styles/AdminManagement.css";

const API = "http://localhost:8080/api/admin/departments";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success'/'error', text: '...' }
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(`${API}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please login again.");
        throw new Error("Failed to load departments");
      }

      const data = await res.json();
      setDepartments(data);
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
    const url = editMode ? `${API}/${formData.id}` : API;

    try {
      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Operation failed");

      setMessage({
        type: "success",
        text: `Department ${editMode ? "updated" : "added"} successfully!`,
      });
      setShowModal(false);
      loadDepartments();
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department permanently?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: "Department deleted successfully" });
      loadDepartments();
    } catch {
      setMessage({ type: "error", text: "Could not delete department" });
    }
  };

  const handleEdit = (dept) => {
    setEditMode(true);
    setFormData({
      id: dept.id,
      name: dept.name,
      description: dept.description || "",
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({ id: null, name: "", description: "" });
    setShowModal(true);
  };

  const exportExcel = () => {
    const data = departments.map(d => ({
      "Department Name": d.name,
      "Description": d.description || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments");
    XLSX.writeFile(wb, "HospiSmart_Departments.xlsx");
  };

  const filtered = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-state">Loading departments...</div>;

  return (
    <div className="department-management">
      <div className="header-bar">
        <h1><FaHospital /> Department Management</h1>
        <button onClick={openCreateModal} className="add-btn">
          <FaPlus /> Add Department
        </button>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <strong>{departments.length}</strong>
          <span>Total Departments</span>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search department name..."
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
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(dept => (
              <tr key={dept.id}>
                <td><strong>{dept.name}</strong></td>
                <td>{dept.description || "—"}</td>
                <td className="actions">
                  <button
                    onClick={() => setSelectedDept(dept)}
                    className="action-btn view"
                    title="View"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEdit(dept)}
                    className="action-btn edit"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
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
            <h2>{editMode ? "Edit Department" : "Add New Department"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cardiology, Neurology, Orthopedics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={5}
                  placeholder="Brief description (optional)"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editMode ? "Update" : "Add"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple View Modal */}
      {selectedDept && (
        <div className="modal-overlay" onClick={() => setSelectedDept(null)}>
          <div className="modal simple-view" onClick={e => e.stopPropagation()}>
            <h2>{selectedDept.name}</h2>
            <div className="modal-content">
              <p><strong>Description:</strong></p>
              <p>{selectedDept.description || "No description available."}</p>
            </div>
            <button className="close-btn" onClick={() => setSelectedDept(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;