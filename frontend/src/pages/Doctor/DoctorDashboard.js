import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUserMd, FaStethoscope, FaSignOutAlt, FaBars, FaTimes, FaHospital
} from "react-icons/fa";
import DoctorModule from "./DoctorModule";
import DoctorProfile from "./DoctorProfile";
import "../../styles/DoctorDashboard.css";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole")?.toLowerCase();
    const storedInfo = localStorage.getItem("doctorInfo");

    if (!token || role !== "doctor" || !storedInfo) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("doctorInfo");
      navigate("/login");
      return;
    }

    setDoctorInfo(JSON.parse(storedInfo));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("doctorInfo");
    navigate("/login");
  };

  if (!doctorInfo) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className={`staff-dashboard ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <aside className={`staff-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="HospiSmart Logo" className="logo-small" />
          <span>HospiSmart</span>
        </div>

        <div className="staff-profile" onClick={() => navigate("/doctor/profile")}>
          <div className="profile-avatar"><FaUserMd /></div>
          {sidebarOpen && (
            <div className="profile-info">
              <h4>{doctorInfo.name}</h4>
              <span className="role-badge">Doctor</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${window.location.pathname === "/doctor/dashboard" ? "active" : ""}`}
            onClick={() => navigate("/doctor/dashboard")}
          >
            <FaStethoscope />
            {sidebarOpen && <span>Consultation</span>}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="staff-main">
        <header className="staff-topbar">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="topbar-title">
            <h1>{window.location.pathname.includes("/profile") ? "My Profile" : "Doctor Dashboard"}</h1>
          </div>
          <div className="topbar-info">
            <div className="current-time">
              {new Date().toLocaleDateString("en-NP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              <span className="time">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </header>

        <motion.div className="module-container" key={window.location.pathname}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default DoctorDashboard;