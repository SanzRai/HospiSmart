import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaBan,
  FaCheckCircle,
  FaDownload,
  FaEye,
  FaTrash,
  FaIdCard,
  FaPlus,
  FaEdit,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "../../styles/AdminManagement.css";

const API = "http://localhost:8080/api/admin/staff";

const ROLES_WITH_LOGIN = [
  "Nurse",
  "Receptionist",
  "Billing Staff",
  "Lab Technician",
  "Pharmacist",
];

const STAFF_ROLES = [
  "Doctor",
  "Nurse",
  "Lab Technician",
  "Radiologist",
  "Pharmacist",
  "Receptionist",
  "Accountant",
  "Admin Staff",
  "OT Technician",
  "Physiotherapist",
  "Ward Boy / Aaya",
  "Housekeeping",
  "Security",
  "Driver",
  "Ambulance Staff",
  "Billing Staff",
];

const DEPARTMENTS = [
  "OPD",
  "Emergency",
  "IPD",
  "ICU",
  "NICU",
  "Labor Room",
  "Operation Theater",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "Billing",
  "Reception",
  "Admin",
  "General",
];

const DESIGNATIONS = [
  "Junior",
  "Senior",
  "Head",
  "In-Charge",
  "Supervisor",
  "Assistant",
  "Technician",
  "Consultant",
  "Specialist",
  "Trainee",
  "Regular",
];

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success'/'error', text: '...' }
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    designation: "",
    joiningDate: "",
    citizenshipNo: "",
    isActive: true,
    password: "",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
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
        throw new Error("Failed to load staff");
      }

      const data = await res.json();
      setStaff(data);
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
    const url = isEditMode ? `${API}/${formData.id}` : API;

    const payload = { ...formData };
    if (isEditMode && !payload.password.trim()) delete payload.password;

    try {
      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      setMessage({
        type: "success",
        text: `Staff ${isEditMode ? "updated" : "created"} successfully!`,
      });
      setIsModalOpen(false);
      loadStaff();
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    }
  };

  const handleToggle = async (id, current) => {
    const action = current ? "DEACTIVATE" : "ACTIVATE";
    if (!window.confirm(`Really ${action} this staff member?`)) return;

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

      setMessage({ type: "success", text: `Staff ${action}d successfully` });
      loadStaff();
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff permanently?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      setMessage({ type: "success", text: "Staff deleted successfully" });
      loadStaff();
    } catch {
      setMessage({ type: "error", text: "Could not delete staff" });
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      designation: "",
      joiningDate: "",
      citizenshipNo: "",
      isActive: true,
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setIsEditMode(true);
    setFormData({
      id: s.id,
      employeeId: s.employeeId,
      name: s.name,
      email: s.email || "",
      phone: s.phone,
      role: s.role,
      department: s.department || "",
      designation: s.designation || "",
      joiningDate: s.joiningDate ? s.joiningDate.split("T")[0] : "",
      citizenshipNo: s.citizenshipNo || "",
      isActive: s.isActive,
      password: "",
    });
    setIsModalOpen(true);
  };

  const exportExcel = () => {
    const data = staff.map(s => ({
      "Emp ID": s.employeeId,
      Name: s.name,
      Role: s.role,
      Designation: s.designation || "—",
      Department: s.department || "—",
      Phone: s.phone,
      Email: s.email || "—",
      "Join Date": s.joiningDate ? new Date(s.joiningDate).toLocaleDateString("en-GB") : "—",
      Status: s.isActive ? "Active" : "Inactive",
      "Can Login": ROLES_WITH_LOGIN.includes(s.role) && s.email ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(wb, "HospiSmart_Staff_List.xlsx");
  };

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    const match =
      s.name?.toLowerCase().includes(q) ||
      s.employeeId?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.email?.toLowerCase().includes(q);

    if (filter === "active") return s.isActive && match;
    if (filter === "inactive") return !s.isActive && match;
    return match;
  });

  if (loading) return <div className="loading-state">Loading staff...</div>;

  return (
    <div className="staff-management">
      <div className="header-bar">
        <h1><FaUsers /> Staff Management</h1>
        <button onClick={openCreateModal} className="add-btn">
          <FaPlus /> Add New Staff
        </button>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <strong>{staff.length}</strong>
          <span>Total Staff</span>
        </div>
        <div className="stat-card active">
          <strong>{staff.filter(s => s.isActive).length}</strong>
          <span>Active</span>
        </div>
        <div className="stat-card inactive">
          <strong>{staff.filter(s => !s.isActive).length}</strong>
          <span>Inactive</span>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <FaSearch />
          <input
            placeholder="Search by name, ID, role, designation, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Staff</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <button onClick={exportExcel} className="export-btn">
          <FaDownload /> Export Excel
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td><FaIdCard /> {s.employeeId}</td>
                <td><strong>{s.name}</strong></td>
                <td>{s.role}</td>
                <td>{s.designation || "—"}</td>
                <td>{s.department || "—"}</td>
                <td>{s.email || "—"}</td>
                <td>
                  <span className={`status ${s.isActive ? "active" : "inactive"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    onClick={() => setSelectedStaff(s)}
                    className="action-btn view"
                    title="View"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openEditModal(s)}
                    className="action-btn edit"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleToggle(s.id, s.isActive)}
                    className={`action-btn toggle ${s.isActive ? "deactivate" : "activate"}`}
                    title={s.isActive ? "Deactivate" : "Activate"}
                  >
                    {s.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
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
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h2>{isEditMode ? "Edit Staff" : "Add New Staff"}</h2>
            <form onSubmit={handleSubmit} className="staff-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    required
                    placeholder="e.g. STAFF-001"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    required
                    placeholder="Full name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 98XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={e => setFormData({
                      ...formData,
                      role: e.target.value,
                      email: "",
                      password: "",
                      designation: "",
                      department: ""
                    })}
                  >
                    <option value="">Select Role</option>
                    {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {formData.role && (
                  <>
                    <div className="form-group">
                      <label>Designation *</label>
                      <select
                        required
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      >
                        <option value="">Select Designation</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Department *</label>
                      <select
                        required
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Joining Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.joiningDate}
                        onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Citizenship No (optional)</label>
                      <input
                        placeholder="Citizenship number"
                        value={formData.citizenshipNo}
                        onChange={e => setFormData({ ...formData, citizenshipNo: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {ROLES_WITH_LOGIN.includes(formData.role) && (
                  <>
                    <div className="form-group">
                      <label>Login Email *</label>
                      <input
                        required={!isEditMode}
                        type="email"
                        placeholder="staff@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Password {isEditMode ? "(Leave blank to keep current)" : "*"}</label>
                      <input
                        type="password"
                        placeholder={isEditMode ? "New password (optional)" : "Set password"}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required={!isEditMode}
                      />
                    </div>
                  </>
                )}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active Account</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {isEditMode ? "Update Staff" : "Add Staff"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple View Modal */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="modal simple-view" onClick={e => e.stopPropagation()}>
            <h2>{selectedStaff.name}</h2>
            <div className="modal-content">
              <p><strong>Emp ID:</strong> {selectedStaff.employeeId}</p>
              <p><strong>Role:</strong> {selectedStaff.role}</p>
              <p><strong>Designation:</strong> {selectedStaff.designation || "—"}</p>
              <p><strong>Department:</strong> {selectedStaff.department || "—"}</p>
              <p><strong>Phone:</strong> {selectedStaff.phone}</p>
              <p><strong>Email (Login):</strong> {selectedStaff.email || "No login access"}</p>
              <p><strong>Join Date:</strong> {selectedStaff.joiningDate ? new Date(selectedStaff.joiningDate).toLocaleDateString("en-GB") : "—"}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={selectedStaff.isActive ? "status-active" : "status-inactive"}>
                  {selectedStaff.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <button className="close-btn" onClick={() => setSelectedStaff(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;