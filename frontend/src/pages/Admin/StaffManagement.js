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
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API = "http://localhost:8080/api/admin/staff";

const ROLES_WITH_LOGIN = [
  "Nurse", 
  "Receptionist",
  "Billing Staff",
  "Lab Technician",
  "Pharmacist"
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
  "Billing Staff"
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
  "General"
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
  "Regular"
];

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      alert("Failed to load staff. Please login as admin!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, current) => {
    if (!window.confirm(`Really ${current ? "DEACTIVATE" : "ACTIVATE"} this staff?`)) return;
    try {
      await fetch(`${API}/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ isActive: !current }),
      });
      loadStaff();
      alert(`Staff ${current ? "deactivated" : "activated"} successfully`);
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff permanently?")) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (res.ok) {
        loadStaff();
        alert("Staff deleted");
      }
    } catch {
      alert("Delete failed");
    }
  };

  const exportExcel = () => {
    const data = staff.map(s => ({
      "Emp ID": s.employeeId,
      Name: s.name,
      Role: s.role,
      Designation: s.designation || "-",
      Department: s.department || "-",
      Phone: s.phone,
      Email: s.email || "-",
      "Join Date": s.joiningDate ? new Date(s.joiningDate).toLocaleDateString("en-GB") : "-",
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
        alert(`Staff ${isEditMode ? "updated" : "created"} successfully!`);
        setIsModalOpen(false);
        loadStaff();
      } else {
        const err = await res.text();
        alert(err || "Operation failed");
      }
    } catch {
      alert("Network error");
    }
  };

  const needsLogin = ROLES_WITH_LOGIN.includes(formData.role);

  if (loading) return <div className="loading">Loading staff...</div>;

  return (
    <div className="patient-management">
      <div className="header-bar">
        <h1><FaUsers /> Staff Management</h1>
        <button onClick={openCreateModal} className="add-btn">
          <FaPlus /> Add New Staff
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total"><strong>{staff.length}</strong> Total Staff</div>
        <div className="stat-card active"><strong>{staff.filter(s => s.isActive).length}</strong> Active</div>
        <div className="stat-card inactive"><strong>{staff.filter(s => !s.isActive).length}</strong> Inactive</div>
      </div>

      <div className="controls">
        <input
          placeholder="Search by name, ID, role, designation, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
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
                  <button onClick={() => setSelectedStaff(s)} className="view" title="View"><FaEye /></button>
                  <button onClick={() => openEditModal(s)} className="edit" title="Edit"><FaEdit /></button>
                  <button onClick={() => handleToggle(s.id, s.isActive)} className="toggle">
                    {s.isActive ? <FaBan /> : <FaCheckCircle />}
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="delete-btn"><FaTrash /></button>
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
            <h2>{isEditMode ? "Edit Staff" : "Add New Staff"}</h2>
            <form onSubmit={handleSubmit} className="staff-form">
              <div className="form-grid">
                <input required placeholder="Employee ID" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />

                <select required value={formData.role} onChange={e => setFormData({
                  ...formData,
                  role: e.target.value,
                  email: "",
                  password: "",
                  designation: "",
                  department: ""
                })}>
                  <option value="">Select Role</option>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                {formData.role && (
                  <>
                    <select required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}>
                      <option value="">Select Designation</option>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <input type="date" required value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />

                    <input placeholder="Citizenship No (optional)" value={formData.citizenshipNo} onChange={e => setFormData({...formData, citizenshipNo: e.target.value})} />
                  </>
                )}

                {/* Login only for Nurse & Receptionist */}
                {needsLogin && (
                  <>
                    <input type="email" required placeholder="Login Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input
                      type="password"
                      placeholder={isEditMode ? "New Password (leave blank to keep)" : "Set Login Password"}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required={!isEditMode}
                    />
                  </>
                )}

                <label style={{ gridColumn: "1 / -1" }}>
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  {' '} Active Account
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {isEditMode ? "Update Staff" : "Create Staff"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Staff Details</h2>
            <div className="modal-grid">
              <div><strong>Emp ID:</strong> {selectedStaff.employeeId}</div>
              <div><strong>Name:</strong> {selectedStaff.name}</div>
              <div><strong>Role:</strong> {selectedStaff.role}</div>
              <div><strong>Designation:</strong> {selectedStaff.designation || "—"}</div>
              <div><strong>Department:</strong> {selectedStaff.department || "—"}</div>
              <div><strong>Email (Login):</strong> {selectedStaff.email || "No login access"}</div>
              <div><strong>Phone:</strong> {selectedStaff.phone}</div>
              <div><strong>Join Date:</strong> {selectedStaff.joiningDate ? new Date(selectedStaff.joiningDate).toLocaleDateString("en-GB") : "—"}</div>
              <div><strong>Status:</strong> <span className={selectedStaff.isActive ? "active" : "inactive"}>{selectedStaff.isActive ? "Active" : "Inactive"}</span></div>
            </div>
            <button onClick={() => setSelectedStaff(null)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;