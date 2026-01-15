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
    <div className="admin-layout flex bg-gray-100 min-h-screen">
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 70 }}
        className="bg-blue-900 text-white shadow-xl relative"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-blue-800">
          {sidebarOpen && <h2 className="text-xl font-semibold">HospiSmart</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white text-xl">
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded hover:bg-blue-700 ${isActive ? "bg-blue-700" : ""}`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className="logout">
          <FaSignOutAlt />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </motion.aside>

      <main className="flex-1 p-5">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;