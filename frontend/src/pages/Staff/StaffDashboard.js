import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserNurse,
  FaDesktop,
  FaCashRegister,
  FaFlask,
  FaUser,
  FaHospital,
} from "react-icons/fa";
import StaffProfile from "./StaffProfile";
import ReceptionModule from "./ReceptionModule";
import NurseModule from "./NurseModule";
import BillingModule from "./BillingModule";
import LabModule from "./LabModule";
import "../../styles/StaffDashboard.css";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffInfo, setStaffInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole")?.toLowerCase();
    const stored = localStorage.getItem("staffInfo");

    if (!token || role !== "staff" || !stored) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("staffInfo");
      navigate("/login");
      return;
    }

    setStaffInfo(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffInfo");
    navigate("/login");
  };

  const getRoleIcon = (role) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("nurse")) return <FaUserNurse />;
    if (r.includes("reception")) return <FaDesktop />;
    if (r.includes("billing") || r.includes("accountant")) return <FaCashRegister />;
    if (r.includes("lab")) return <FaFlask />;
    return <FaUser />;
  };

  const renderWorkstation = () => {
    if (!staffInfo?.role) return <div>Loading role...</div>;
    const role = staffInfo.role.toLowerCase();

    if (role.includes("reception") || role === "receptionist") {
      return <ReceptionModule />;
    }
    if (role.includes("nurse") || role === "nurse") {
      return <NurseModule />;
    }
    if (role.includes("billing") || role === "accountant" || role.includes("billing staff")) {
      return <BillingModule />;
    }
    if (role.includes("lab") || role === "lab technician" || role === "lab staff") {
      return <LabModule />;
    }

    return (
      <div className="welcome-placeholder">
        <FaHospital size={64} />
        <h2>Welcome, {staffInfo.name}</h2>
        <p>Your role: <strong>{staffInfo.role}</strong></p>
        <p>Contact admin if your workstation is not loading correctly.</p>
      </div>
    );
  };

  if (!staffInfo) {
    return <div className="loading-screen">Loading Staff Portal...</div>;
  }

  const isHome = location.pathname === "/staff/dashboard";
  const isProfile = location.pathname === "/staff/profile";

  return (
    <div className="admin-layout">
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}
      >
        <div className="sidebar-header" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div className="logo-container">
            <div className="logo-wrapper">
              <img src="/logo.png" alt="HospiSmart" className="logo" />
            </div>
            {sidebarOpen && <span className="hospital-name">HospiSmart</span>}
          </div>
          <button
            className="toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/staff/dashboard"
            end
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon">{getRoleIcon(staffInfo.role)}</span>
            {sidebarOpen && <span className="nav-text">Workstation</span>}
          </NavLink>

          <NavLink
            to="/staff/profile"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon">
              <div className="avatar" style={{ backgroundColor: "#6b7280" }}>
                {getRoleIcon(staffInfo.role)}
              </div>
            </span>
            {sidebarOpen && <span className="nav-text">My Profile</span>}
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </motion.aside>

      <main className="main-content">
        {isHome && renderWorkstation()}
        {isProfile && <StaffProfile />}
        {!isHome && !isProfile && <Outlet />}
      </main>
    </div>
  );
};

export default StaffDashboard;