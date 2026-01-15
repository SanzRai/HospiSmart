import React, { useState, useEffect } from "react";
import {
  FaHospital,
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

const API = "http://localhost:8080/api/admin/departments";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      alert("Failed to load departments. Please login as admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const url = editMode ? `${API}/${formData.id}` : API;
    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(`Department ${editMode ? "updated" : "added"} successfully!`);
        setShowModal(false);
        loadDepartments();
      } else {
        const err = await res.text();
        alert(err || "Operation failed");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department permanently?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadDepartments();
        alert("Department deleted");
      }
    } catch {
      alert("Delete failed");
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
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading">Loading departments...</div>;

  return (
    <div className="department-management">
      {/* Header */}
      <div className="header-bar">
        <h1><FaHospital /> Department Management</h1>
        <button onClick={openCreateModal} className="add-btn">
          <FaPlus /> Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card total"><strong>{departments.length}</strong> Total Departments</div>
      </div>

      {/* Controls */}
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

      {/* Table */}
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
                  <button onClick={() => setSelectedDept(dept)} className="view" title="View"><FaEye /></button>
                  <button onClick={() => handleEdit(dept)} className="edit" title="Edit"><FaEdit /></button>
                  <button onClick={() => handleDelete(dept.id)} className="delete-btn" title="Delete"><FaTrash /></button>
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
                  placeholder="Brief description of the department (optional)"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editMode ? "Update Department" : "Add Department"}
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
      {selectedDept && (
        <div className="modal-overlay" onClick={() => setSelectedDept(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedDept.name}</h2>
            <div className="modal-grid">
              <div><strong>Description:</strong></div>
              <div>{selectedDept.description || "No description provided"}</div>
            </div>
            <button onClick={() => setSelectedDept(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;