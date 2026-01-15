import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUserMd, FaHospital, FaUsers, FaCalendarCheck, FaSpinner } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE_URL = "http://localhost:8080/api";

const AdminHome = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <span className="ml-3 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center p-5">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 shadow rounded-xl border-l-4 border-blue-500"
        >
          <FaHospital className="text-blue-600 text-3xl mb-2" />
          <h3 className="text-2xl font-bold">{stats?.totalDepartments || 0}</h3>
          <p className="text-gray-500">Departments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 shadow rounded-xl border-l-4 border-green-500"
        >
          <FaUserMd className="text-green-600 text-3xl mb-2" />
          <h3 className="text-2xl font-bold">{stats?.totalDoctors || 0}</h3>
          <p className="text-gray-500">Doctors</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 shadow rounded-xl border-l-4 border-purple-500"
        >
          <FaUsers className="text-purple-600 text-3xl mb-2" />
          <h3 className="text-2xl font-bold">{stats?.totalPatients || 0}</h3>
          <p className="text-gray-500">Patients</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-5 shadow rounded-xl border-l-4 border-orange-500"
        >
          <FaCalendarCheck className="text-orange-600 text-3xl mb-2" />
          <h3 className="text-2xl font-bold">{stats?.monthlyAppointments || 0}</h3>
          <p className="text-gray-500">Appointments (This Month)</p>
        </motion.div>
      </div>

     
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white shadow rounded-xl p-5"
      >
        <h2 className="text-xl font-semibold mb-4">Appointment Trend (Last 6 Months)</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1a5fb4"
                strokeWidth={3}
                dot={{ fill: "#1a5fb4" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500">No appointment data available.</p>
        )}
      </motion.div>
    </div>
  );
};

export default AdminHome;