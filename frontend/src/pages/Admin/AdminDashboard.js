import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaHospital, FaUserMd, FaShieldAlt, FaUsers, FaCog, FaSignOutAlt, FaUserInjured, FaChartPie } from "react-icons/fa";
import { motion } from "framer-motion";
import "../../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole")?.toLowerCase();
    if (!token || role !== "admin") {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { path: "", icon: <FaChartPie />, label: "Dashboard" },
    { path: "departments", icon: <FaHospital />, label: "Departments" },
    { path: "doctors", icon: <FaUserMd />, label: "Doctors" },
    { path: "insurance", icon: <FaShieldAlt />, label: "Insurance" },
    { path: "staff", icon: <FaUsers />, label: "Staff" },
    { path: "patients", icon: <FaUserInjured />, label: "Patients" },
    { path: "settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <div className="admin-layout">
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}
      >
        <div className="sidebar-header" onClick={toggleSidebar}>
          <div className="logo-container">
            <div className="logo-wrapper">
              <img src="/logo.png" alt="HospiSmart logo" className="logo" />
            </div>
            {sidebarOpen && <span className="hospital-name">HospiSmart</span>}
          </div>

          <button
            className="toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ""}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </motion.aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;