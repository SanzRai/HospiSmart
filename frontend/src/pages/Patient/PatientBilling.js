import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaExclamationCircle, FaSpinner, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../../components/PatientNavbar';
import PatientFooter from '../../components/PatientFooter';
import '../../styles/PatientBilling.css';

const API_BASE_URL = "http://localhost:8080/api";

const PatientBilling = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingBills, setPendingBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const patientId = Number(localStorage.getItem("patientId"));

  // Get patient info from localStorage
  const patientInfo = JSON.parse(localStorage.getItem("patientInfo") || "{}");
  const patientName = patientInfo.fullName || patientInfo.name || patientInfo.full_name || "Patient";

  // Toast notification helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

    if (!patientId || isNaN(patientId) || patientId <= 0) {
      setError("Patient information is missing or invalid. Please login again.");
      setLoading(false);
      return;
    }

    fetchBills();
  }, [navigate, token, role, patientId]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pending bills (now includes lab tests)
      const pendingRes = await fetch(
        `${API_BASE_URL}/billing/pending?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!pendingRes.ok) {
        const errText = await pendingRes.text();
        throw new Error(errText || `Failed to fetch pending bills (${pendingRes.status})`);
      }

      const pendingData = await pendingRes.json();
      setPendingBills(Array.isArray(pendingData) ? pendingData : []);

      // Paid bills
      const paidRes = await fetch(
        `${API_BASE_URL}/billing/paid?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!paidRes.ok) {
        const errText = await paidRes.text();
        throw new Error(errText || `Failed to fetch paid bills (${paidRes.status})`);
      }

      const paidData = await paidRes.json();
      setPaidBills(Array.isArray(paidData) ? paidData : []);

      // Update notifications based on pending bills
      const pendingCount = pendingData.length;
      setNotifications([
        {
          id: 'billing-pending',
          type: 'warning',
          title: 'Pending Bills',
          message: pendingCount > 0 
            ? `You have ${pendingCount} pending bill${pendingCount !== 1 ? 's' : ''} (including lab tests)`
            : 'No pending bills at the moment',
          read: false,
        },
      ]);

    } catch (err) {
      console.error("Billing fetch error:", err);
      showToast("error", err.message || "Unable to load your billing information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPending = pendingBills.reduce(
    (sum, bill) => sum + (Number(bill.amount) || 0),
    0
  );

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" /> Loading your bills...
      </div>
    );
  }

  return (
    <div className="patient-module">
      <PatientNavbar
        patientInfo={{ name: patientName }}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
        notificationCount={notifications.filter(n => !n.read).length}
      />

      <main className="billing-page patient-container">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`toast ${toast.type}`}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="page-header">
          <h1>Billing & Payments</h1>
          <p>Manage your hospital bills, consultations, and lab tests</p>
        </div>

        <motion.div
          className="billing-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Total Pending Amount</h2>
          <div className="amount">Rs {totalPending.toLocaleString()}</div>
          <p>{pendingBills.length} pending item{pendingBills.length !== 1 ? 's' : ''}</p>
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
          pendingBills.length === 0 ? (
            <div className="no-data">
              <FaCheckCircle className="icon" />
              <p>No pending bills at the moment.</p>
            </div>
          ) : (
            pendingBills.map((bill) => (
              <div key={bill.id} className="bill-item">
                <div className="bill-item-header">
                  <h4>
                    {bill.type === 'LAB_TEST' ? 'Lab Test: ' : ''}
                    {bill.serviceName || bill.serviceType || "Medical Service"}
                  </h4>
                  <strong>Rs {(Number(bill.amount) || 0).toLocaleString()}</strong>
                </div>
                <div className="bill-details">
                  <p>Type: {bill.type || 'Consultation'}</p>
                  <p>Status: {bill.status || 'Pending Payment'}</p>
                  {bill.department && <p>Department: {bill.department}</p>}
                  {bill.doctorName && <p>Doctor: {bill.doctorName}</p>}
                </div>
                <button
                  className="btn btn-action"
                  onClick={() =>
                    navigate("/patient/payment", {
                      state: {
                        paymentDetails: {
                          billId: bill.id,
                          type: bill.type,
                          amount: bill.amount,
                          patientId,
                          patientName,
                          patientPhone: patientInfo.phoneNumber || "",
                          patientEmail: patientInfo.email || "",
                          department: bill.department || "General",
                          doctorName: bill.doctorName || null,
                          serviceName: bill.serviceName || bill.serviceType,
                          bookingType: bill.type === 'LAB_TEST' ? 'LAB' : 'CONSULTATION',
                          tokenNumber: bill.tokenNumber || bill.id,
                        },
                      },
                    })
                  }
                >
                  <FaWallet /> Pay Now
                </button>
              </div>
            ))
          )
        )}

        {activeTab === 'paid' && (
          paidBills.length === 0 ? (
            <div className="no-data">
              <FaCheckCircle className="icon" />
              <p>No paid bills yet.</p>
            </div>
          ) : (
            paidBills.map((bill) => (
              <div key={bill.id} className="bill-item paid">
                <div className="bill-item-header">
                  <h4>{bill.serviceName || bill.serviceType || "Service"}</h4>
                  <strong>Rs {(Number(bill.amount) || bill.finalAmount || 0).toLocaleString()}</strong>
                </div>
                <div className="bill-details">
                  <p>Paid on: {bill.paymentDate || "—"}</p>
                  <p>Method: {bill.paymentMethod || "N/A"}</p>
                </div>
              </div>
            ))
          )
        )}
      </main>

      {/* Floating Emergency Button */}
      <motion.button
        className="emergency-button"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.href = 'tel:1134'}
        aria-label="Emergency Call 1134"
      >
        <FaPhone />
      </motion.button>

      <PatientFooter />
    </div>
  );
};

export default PatientBilling;