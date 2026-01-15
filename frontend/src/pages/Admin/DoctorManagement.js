import React, { useState, useEffect } from "react";
import {
  FaUserMd,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaBan,
  FaCheckCircle,
  FaSearch,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API = "http://localhost:8080/api/admin/doctors";
const DEPT_API = "http://localhost:8080/api/admin/departments";

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    departmentId: "",
    qualifications: "",
    consultationFee: "",
    availableDays: "",
    startTime: "",
    endTime: "",
    slotDurationMinutes: 15,
    email: "",
    password: "",
    isActive: true,
  });

  useEffect(() => {
    loadDoctors();
    loadDepartments();
  }, []);

  const loadDoctors = async () => {
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
      setDoctors(data);
    } catch (err) {
      alert("Failed to load doctors. Please login as admin!");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${DEPT_API}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const url = isEditMode ? `${API}/${formData.id}` : API;
    const method = isEditMode ? "PUT" : "POST";

    const payload = { ...formData };
    if (isEditMode && !payload.password.trim()) {
      delete payload.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Doctor ${isEditMode ? "updated" : "added"} successfully!`);
        setIsModalOpen(false);
        loadDoctors();
      } else {
        const err = await res.text();
        alert(err || "Operation failed");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleToggle = async (id, current) => {
    if (!window.confirm(`Really ${current ? "DEACTIVATE" : "ACTIVATE"} this doctor?`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });
      loadDoctors();
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor permanently?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadDoctors();
        alert("Doctor deleted");
      }
    } catch {
      alert("Delete failed");
    }
  };

  const openEditModal = (doc) => {
    setIsEditMode(true);
    setFormData({
      id: doc.id,
      name: doc.name,
      departmentId: doc.departmentId || "",
      qualifications: doc.qualifications || "",
      consultationFee: doc.consultationFee || "",
      availableDays: doc.availableDays || "",
      startTime: doc.startTime || "",
      endTime: doc.endTime || "",
      slotDurationMinutes: doc.slotDurationMinutes || 15,
      email: doc.email || "",
      password: "",
      isActive: doc.isActive,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      name: "",
      departmentId: "",
      qualifications: "",
      consultationFee: "",
      availableDays: "",
      startTime: "",
      endTime: "",
      slotDurationMinutes: 15,
      email: "",
      password: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const exportExcel = () => {
    const data = doctors.map(d => ({
      Name: d.name,
      Department: d.departmentName || "—",
      Qualifications: d.qualifications,
      "Consultation Fee (₹)": d.consultationFee,
      "Available Days": d.availableDays || "—",
      "Clinic Timing": d.startTime && d.endTime ? `${d.startTime} - ${d.endTime}` : "—",
      "Slot Duration": `${d.slotDurationMinutes} min`,
      "Login Email": d.email || "—",
      Status: d.isActive ? "Active" : "Inactive",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctors");
    XLSX.writeFile(wb, "HospiSmart_Doctors_List.xlsx");
  };

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.departmentName?.toLowerCase().includes(q) ||
      d.qualifications?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      String(d.consultationFee).includes(search)
    );
  });

  if (loading) return <div className="loading">Loading doctors...</div>;

  return (
    <div className="doctor-management">
      <div className="header-bar">
        <h1><FaUserMd /> Doctor Management</h1>
        <button onClick={openCreateModal} className="add-btn">
          <FaPlus /> Add New Doctor
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total"><strong>{doctors.length}</strong> Total Doctors</div>
        <div className="stat-card active"><strong>{doctors.filter(d => d.isActive).length}</strong> Active</div>
        <div className="stat-card inactive"><strong>{doctors.filter(d => !d.isActive).length}</strong> Inactive</div>
      </div>

      <div className="controls">
        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search by name, department, qualification, email..."
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
              <th>Department</th>
              <th>Qualification</th>
              <th>Fee</th>
              <th>Availability</th>
              <th>Timing</th>
              <th>Login Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong></td>
                <td>{d.departmentName || "—"}</td>
                <td>{d.qualifications}</td>
                <td>₹{d.consultationFee}</td>
                <td>{d.availableDays || "—"}</td>
                <td><FaClock /> {d.startTime} - {d.endTime}</td>
                <td>{d.email || "No login"}</td>
                <td>
                  <span className={`status ${d.isActive ? "active" : "inactive"}`}>
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => setSelectedDoctor(d)} className="view" title="View"><FaEye /></button>
                  <button onClick={() => openEditModal(d)} className="edit" title="Edit"><FaEdit /></button>
                  <button onClick={() => handleToggle(d.id, d.isActive)} className="toggle">
                    {d.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="delete-btn"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h2>{isEditMode ? "Edit Doctor" : "Add New Doctor"}</h2>
            <form onSubmit={handleSubmit} className="doctor-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select required value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Qualifications *</label>
                  <input required placeholder="e.g. MBBS, MD (Medicine)" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Consultation Fee (₹) *</label>
                  <input required type="number" min="100" placeholder="e.g. 800" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: e.target.value})} />
                </div>

                <div className="form-group full-width">
                  <label><FaCalendarAlt /> Available Days *</label>
                  <input
                    required
                    placeholder="e.g. Mon,Tue,Wed,Thu,Fri,Sat"
                    value={formData.availableDays}
                    onChange={e => setFormData({...formData, availableDays: e.target.value})}
                  />
                </div>

                <div className="time-row">
                  <div className="form-group">
                    <label><FaClock /> Clinic Start Time *</label>
                    <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label><FaClock /> Clinic End Time *</label>
                    <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Slot Duration (minutes)</label>
                  <input type="number" min="10" max="120" step="5" value={formData.slotDurationMinutes} onChange={e => setFormData({...formData, slotDurationMinutes: e.target.value})} />
                  <small>Default: 15 minutes per patient</small>
                </div>

                <div className="form-group full-width">
                  <label>Login Email *</label>
                  <input required={!isEditMode} type="email" placeholder="doctor@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="form-group full-width">
                  <label>Password {isEditMode && "(Leave blank to keep current)"}</label>
                  <input
                    type="password"
                    placeholder={isEditMode ? "Enter new password only if changing" : "Password"}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={!isEditMode}
                  />
                </div>

                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <span> Active Account (Can login and see patients)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {isEditMode ? "Update Doctor" : "Add Doctor"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Doctor Details</h2>
            <div className="modal-grid">
              <div><strong>Name:</strong> {selectedDoctor.name}</div>
              <div><strong>Department:</strong> {selectedDoctor.departmentName || "—"}</div>
              <div><strong>Qualifications:</strong> {selectedDoctor.qualifications}</div>
              <div><strong>Fee:</strong> ₹{selectedDoctor.consultationFee}</div>
              <div><strong>Available Days:</strong> {selectedDoctor.availableDays || "—"}</div>
              <div><strong>Clinic Timing:</strong> {selectedDoctor.startTime} - {selectedDoctor.endTime}</div>
              <div><strong>Slot Duration:</strong> {selectedDoctor.slotDurationMinutes} minutes</div>
              <div><strong>Login Email:</strong> {selectedDoctor.email || "No login access"}</div>
              <div><strong>Status:</strong> <span className={selectedDoctor.isActive ? "active" : "inactive"}>{selectedDoctor.isActive ? "Active" : "Inactive"}</span></div>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;