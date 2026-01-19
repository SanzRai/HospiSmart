import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUserMd, FaSignOutAlt, FaStethoscope } from "react-icons/fa";
import { motion } from "framer-motion";
import "../../styles/DoctorDashboard.css";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState(null);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { path: "", icon: <FaStethoscope />, label: "Consultation" },
    { path: "profile", icon: <FaUserMd />, label: "My Profile" },
  ];

  if (!doctorInfo) {
    return <div className="loading-screen">Loading...</div>;
  }

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

export default DoctorDashboard;