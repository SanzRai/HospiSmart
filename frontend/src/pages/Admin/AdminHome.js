import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUserMd, FaHospital, FaUsers, FaCalendarCheck, FaSpinner } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "../../styles/AdminHome.css";

const API_BASE_URL = "http://localhost:8080/api";

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      setStats(data.summary);
      setChartData(data.appointmentTrend);
    } catch (err) {
      setError("Failed to load dashboard. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Departments",
      value: stats?.totalDepartments || 0,
      icon: <FaHospital />,
      color: "#1976d2",
      path: "/admin-dashboard/departments",
    },
    {
      title: "Doctors",
      value: stats?.totalDoctors || 0,
      icon: <FaUserMd />,
      color: "#059669",
      path: "/admin-dashboard/doctors",
    },
    {
      title: "Patients",
      value: stats?.totalPatients || 0,
      icon: <FaUsers />,
      color: "#7c3aed",
      path: "/admin-dashboard/patients",
    },
    {
      title: "Appointments (This Month)",
      value: stats?.monthlyAppointments || 0,
      icon: <FaCalendarCheck />,
      color: "#ea580c",
      path: "/admin-dashboard/appointments",
    },
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <span>Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-home">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
            style={{ "--card-color": card.color }}
            onClick={() => navigate(card.path)}
          >
            <div className="card-icon">{card.icon}</div>
            <h3>{card.value}</h3>
            <p>{card.title}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="chart-card"
      >
        <h2 className="chart-title">Appointment Trend (Last 6 Months)</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.98)",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
                labelStyle={{ color: "#1e293b", fontWeight: "600" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1e40af"
                strokeWidth={3.5}
                dot={{ fill: "#1e40af", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 9, strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-data">No appointment data available yet.</p>
        )}
      </motion.div>
    </div>
  );
};

export default AdminHome;