import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientModule.css';

const API_BASE_URL = "http://localhost:8080/api";

const PatientBilling = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [pendingBills, setPendingBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔐 AUTH DATA
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  // ✅ IMPORTANT FIX: convert to Number
  const patientId = Number(localStorage.getItem("patientId"));

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (role !== 'patient') {
      setError("Only patients can access billing information.");
      setLoading(false);
      return;
    }

    if (!patientId || isNaN(patientId)) {
      setError("Invalid patient information. Please login again.");
      setLoading(false);
      return;
    }

    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching bills for patientId:", patientId);

      // 🔹 PENDING
      const pendingRes = await fetch(
        `${API_BASE_URL}/billing/pending?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!pendingRes.ok) {
        const errText = await pendingRes.text();
        throw new Error(errText || "Failed to fetch pending bills");
      }

      const pendingData = await pendingRes.json();
      setPendingBills(pendingData);

      // 🔹 PAID
      const paidRes = await fetch(
        `${API_BASE_URL}/billing/paid?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!paidRes.ok) {
        const errText = await paidRes.text();
        throw new Error(errText || "Failed to fetch paid bills");
      }

      const paidData = await paidRes.json();
      setPaidBills(paidData);

    } catch (err) {
      console.error("Billing error:", err);
      setError(err.message || "Unable to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const totalPending = pendingBills.reduce(
    (sum, bill) => sum + (bill.amount || 0),
    0
  );

  // ⛔ STATES
  if (loading) return <div className="loading">Loading your bills...</div>;

  if (error) {
    return (
      <div className="error-message">
        <FaExclamationCircle /> {error}
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar patientName="Patient" notificationCount={pendingBills.length} />

      <main className="billing-page patient-container">
        <div className="page-header">
          <h1>Billing & Payments</h1>
          <p>Manage your hospital bills</p>
        </div>

        <motion.div
          className="billing-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Total Pending Amount</h2>
          <div className="amount">Rs {totalPending.toLocaleString()}</div>
          <p>{pendingBills.length} pending bill(s)</p>
        </motion.div>

        <div className="tabs-list">
          <button
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingBills.length})
          </button>

          <button
            className={activeTab === 'paid' ? 'active' : ''}
            onClick={() => setActiveTab('paid')}
          >
            Paid ({paidBills.length})
          </button>
        </div>

        {activeTab === 'pending' && (
          pendingBills.length === 0
            ? <p className="no-data">No pending bills.</p>
            : pendingBills.map(bill => (
              <div key={bill.id} className="bill-item">
                <div className="bill-item-header">
                  <h4>{bill.serviceType}</h4>
                  <strong>Rs {bill.amount.toLocaleString()}</strong>
                </div>
                <button className="btn btn-action">
                  <FaWallet /> Pay Now
                </button>
              </div>
            ))
        )}

        {activeTab === 'paid' && (
          paidBills.length === 0
            ? <p className="no-data">No paid bills.</p>
            : paidBills.map(bill => (
              <div key={bill.id} className="bill-item">
                <h4>{bill.serviceName}</h4>
                <p>Paid via {bill.paymentMethod}</p>
              </div>
            ))
        )}
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientBilling;
