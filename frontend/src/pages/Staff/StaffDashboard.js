import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUserNurse,
  FaDesktop,
  FaCashRegister,
  FaFlask,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaHospital,
} from "react-icons/fa";

import StaffProfile from "./StaffProfile";
import ReceptionModule from "./ReceptionModule";
import NurseModule from "./NurseModule";
import BillingModule from "./BillingModule";
import LabModule from "./LabModule";


const StaffDashboard = () => {
  const navigate = useNavigate();
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
    switch (role?.toLowerCase()) {
      case "nurse": return <FaUserNurse />;
      case "receptionist": return <FaDesktop />;
      case "billing staff":
      case "accountant": return <FaCashRegister />;
      case "lab technician":
      case "lab staff": return <FaFlask />;
      default: return <FaUser />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "nurse": return "#10b981";
      case "receptionist": return "#3b82f6";
      case "accountant": return "#f59e0b";
      case "lab":
      case "lab staff": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  if (!staffInfo) {
    return (
      <div className="loading-screen" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p>Loading Staff Portal...</p>
      </div>
    );
  }

  const layoutStyle = { display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" };
  const sidebarStyle = {
    width: sidebarOpen ? "260px" : "70px",
    backgroundColor: "#1e293b",
    color: "white",
    transition: "width 0.3s ease",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  };
  const mainContentStyle = { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" };
  const headerStyle = {
    height: "64px",
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  };

  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <div style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #334155" }}>
          <FaHospital size={24} style={{ marginRight: sidebarOpen ? "10px" : "0" }} />
          {sidebarOpen && <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>HospiSmart</span>}
        </div>

        <div
          onClick={() => navigate("/staff/profile")}
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            borderBottom: "1px solid #334155",
            cursor: "pointer",
            backgroundColor: window.location.pathname.includes("/profile") ? "rgba(255,255,255,0.1)" : "transparent",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: getRoleColor(staffInfo.role),
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1.2rem",
              color: "white",
            }}
          >
            {getRoleIcon(staffInfo.role)}
          </div>
          {sidebarOpen && (
            <div style={{ overflow: "hidden" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", whiteSpace: "nowrap" }}>{staffInfo.name}</h4>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>{staffInfo.role}</span>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "20px 10px" }}>
          <div
            onClick={() => navigate("/staff/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 15px",
              borderRadius: "8px",
              backgroundColor: window.location.pathname === "/staff/dashboard" ? "rgba(255,255,255,0.1)" : "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            {getRoleIcon(staffInfo.role)}
            {sidebarOpen && <span>Workstation</span>}
          </div>
        </nav>

        <div style={{ padding: "20px" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: "10px",
              background: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <FaSignOutAlt />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ border: "none", background: "transparent", fontSize: "1.2rem", cursor: "pointer" }}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1e293b" }}>
              {window.location.pathname.includes("/profile") ? "My Profile" : `${staffInfo.role} Dashboard`}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "#64748b", fontSize: "0.9rem" }}>
            <span>{new Date().toLocaleDateString()}</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;