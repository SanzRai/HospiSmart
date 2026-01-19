import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCashRegister,
  FaMoneyBillWave,
  FaReceipt,
  FaHospitalAlt,
  FaIdCard,
  FaExclamationTriangle,
  FaPrint,
  FaSearch,
  FaCheck,
  FaTimes,
  FaUpload,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "../../styles/BillingModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const BillingModule = ({ staffInfo }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingBills, setPendingBills] = useState([]);
  const [ipdBills, setIpdBills] = useState([]);
  const [insuredPatients, setInsuredPatients] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  const [paymentMode, setPaymentMode] = useState("cash");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [ssfNumber, setSsfNumber] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [ssfEligibility, setSsfEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [selectedIpdPatient, setSelectedIpdPatient] = useState(null);

  const [verifyUhid, setVerifyUhid] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [insuranceForm, setInsuranceForm] = useState({
    providerId: "",
    policyNumber: "",
    policyLimit: "",
  });
  const [cardImage, setCardImage] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingBills();
    fetchIpdBills();
    fetchInsuranceProviders();
    if (activeTab === "insured") {
      fetchInsuredPatients();
    }
  }, [activeTab]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4800);
  };

  const fetchPendingBills = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/billing/pending-all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPendingBills(data);
    } else {
      showToast("error", "Failed to load pending bills");
    }
  } catch (err) {
    console.error("Error fetching pending bills:", err);
    showToast("error", "Network error loading pending bills");
  }
};

const fetchInsuredPatients = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/patients`, {  // ← change to /patients
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      const allPatients = await res.json();
      // Filter in frontend (less efficient, but works if you don't want to change backend)
      const insured = allPatients.filter(p => p.insuranceProviderId != null);
      setInsuredPatients(insured);
    } else {
      showToast("error", "Failed to load patients");
    }
  } catch (err) {
    console.error("Error fetching patients:", err);
    showToast("error", "Network error loading insured patients");
  }
};

  const fetchIpdBills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/ipd`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setIpdBills(await res.json());
    } catch (err) {
      console.error("Error fetching IPD bills:", err);
    }
  };

  const fetchInsuranceProviders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/insurance/providers`);
      if (res.ok) setInsuranceProviders(await res.json());
    } catch (err) {
      console.error("Error fetching insurance providers:", err);
    }
  };


  const checkSsfEligibility = async () => {
    if (!ssfNumber || !selectedBill) {
      showToast("error", "SSF Number and selected bill are required");
      return;
    }
    setLoading(true);

    const serviceCode = selectedBill.serviceType.includes("OPD") ? "OPD-GEN" : "APT-GEN";

    try {
      const res = await fetch(
        `${API_BASE_URL}/ssf/check?ssfId=${ssfNumber}&serviceCode=${serviceCode}&fee=${selectedBill.amount}`
      );
      if (res.ok) {
        const data = await res.json();
        setSsfEligibility(data);
        showToast("success", data.eligible ? "SSF eligibility verified" : "SSF not eligible");
      } else {
        showToast("error", "Failed to verify SSF eligibility");
        setSsfEligibility(null);
      }
    } catch (err) {
      showToast("error", "Network error during SSF verification");
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalAmount = () => {
    if (!selectedBill) return 0;
    let amount = selectedBill.amount;

    if (discountType === "ssf" && ssfEligibility?.eligible) {
      return Math.round(ssfEligibility.finalPatientAmount);
    }

    if (discountType === "insurance" && insurancePolicy) {
      const provider = insuranceProviders.find((p) => p.id.toString() === insurancePolicy);
      if (provider && provider.coveragePercent) {
        amount = amount * (1 - provider.coveragePercent / 100);
      }
    }

    if (discountType === "staff" && discountValue > 0) {
      amount = amount * (1 - discountValue / 100);
    }

    return Math.round(amount);
  };

  const handleProcessPayment = async () => {
    if (!selectedBill) return;

    if (discountType === "staff" && discountValue > 10) {
      setShowAdminAuth(true);
      return;
    }

    setLoading(true);

    const paymentTypeMap = {
      none: "SELF",
      ssf: "SSF",
      insurance: "INSURANCE",
      staff: "STAFF",
    };

    const payload = {
      bookingType: selectedBill.bookingType || (selectedBill.serviceType.includes("OPD") ? "OPD" : "APPOINTMENT"),
      bookingToken: selectedBill.tokenNumber || selectedBill.ticketNumber,
      patientName: selectedBill.patientName,
      consultingFee: selectedBill.amount,
      coveredAmount: selectedBill.amount - calculateFinalAmount(),
      payableAmount: calculateFinalAmount(),
      paymentType: paymentTypeMap[discountType],
      paymentMethod: paymentMode,
      ssfNumber: discountType === "ssf" ? ssfNumber : null,
      insurancePolicyNumber: discountType === "insurance" ? insurancePolicy : null,
      processedBy: staffInfo?.name,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/billing/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", "Payment processed successfully! Receipt generated.");
        setSelectedBill(null);
        resetPaymentForm();
        fetchPendingBills();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Payment processing failed");
      }
    } catch (err) {
      showToast("error", "Network error during payment processing");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVerify = () => {
    if (adminPassword === "admin123") {  // ← Change this in production!
      setShowAdminAuth(false);
      setAdminPassword("");
      handleProcessPayment();
    } else {
      showToast("error", "Invalid admin password");
      setAdminPassword("");
    }
  };

  const handleAddDeposit = async () => {
    if (!selectedIpdPatient || !depositAmount || Number(depositAmount) <= 0) {
      showToast("error", "Please enter a valid deposit amount");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/billing/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          patientId: selectedIpdPatient.id,
          amount: parseFloat(depositAmount),
          receivedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        showToast("success", "Deposit added successfully");
        setDepositAmount("");
        fetchIpdBills();
        setSelectedIpdPatient(null);
      } else {
        showToast("error", "Failed to add deposit");
      }
    } catch (err) {
      showToast("error", "Network error while adding deposit");
    } finally {
      setLoading(false);
    }
  };

  const searchPatientForInsurance = async () => {
    if (!verifyUhid.trim()) {
      showToast("error", "Please enter phone number or UHID");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/patients/search?phone=${verifyUhid}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
        setInsuranceForm({ providerId: "", policyNumber: "", policyLimit: "" });
        setCardImage(null);
        showToast("success", "Patient found successfully");
      } else {
        showToast("error", "No patient found with this phone/UHID");
        setVerifyResult(null);
      }
    } catch (err) {
      showToast("error", "Error while searching patient");
    }
  };

  const handleVerifyInsurance = async () => {
    if (!verifyResult || !insuranceForm.providerId) {
      showToast("error", "Please select an insurance provider");
      return;
    }

    setLoading(true);

    const payload = {
      patientId: verifyResult.id,
      providerId: insuranceForm.providerId,
      policyNumber: insuranceForm.policyNumber,
      policyLimit: insuranceForm.policyLimit || null,
      verifiedBy: staffInfo?.name || "Billing Staff",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/insurance/verify-patient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", "Insurance successfully verified & linked to patient");
        setVerifyResult(null);
        setInsuranceForm({ providerId: "", policyNumber: "", policyLimit: "" });
        setCardImage(null);
        setVerifyUhid("");
        fetchInsuredPatients();
      } else {
        showToast("error", "Failed to verify and link insurance");
      }
    } catch (err) {
      showToast("error", "Network error during insurance verification");
    } finally {
      setLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentMode("cash");
    setDiscountType("none");
    setDiscountValue(0);
    setSsfNumber("");
    setInsurancePolicy("");
    setSsfEligibility(null);
    setAdminPassword("");
    setShowAdminAuth(false);
  };

  const getProviderName = (providerId) => {
    const provider = insuranceProviders.find((p) => p.id === providerId);
    return provider ? provider.name : "Unknown";
  };

  return (
    <div className="billing-module">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="module-header">
        <h2>
          <FaCashRegister /> Billing Counter
        </h2>
        <div className="quick-stats">
          <div className="stat">
            <FaReceipt />
            <span>{pendingBills.length} Pending Bills</span>
          </div>
          <div className="stat">
            <FaHospitalAlt />
            <span>{ipdBills.length} IPD Patients</span>
          </div>
          <div className="stat">
            <FaUsers />
            <span>{insuredPatients.length} Insured Patients</span>
          </div>
        </div>
      </div>

      <div className="module-tabs">
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          <FaReceipt /> Pending Bills
        </button>
        <button
          className={activeTab === "ipd" ? "active" : ""}
          onClick={() => setActiveTab("ipd")}
        >
          <FaHospitalAlt /> IPD Billing
        </button>
        <button
          className={activeTab === "insurance" ? "active" : ""}
          onClick={() => setActiveTab("insurance")}
        >
          <FaIdCard /> Insurance Desk
        </button>
        <button
          className={activeTab === "insured" ? "active" : ""}
          onClick={() => setActiveTab("insured")}
        >
          <FaUsers /> Insured Patients
        </button>
      </div>

      {/* ── Pending Bills ──────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <motion.div className="tab-content billing-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bills-list">
            <h3>Pending Payments</h3>
            {pendingBills.length === 0 ? (
              <div className="empty-state">
                <p>No pending bills at the moment</p>
              </div>
            ) : (
              pendingBills.map((bill) => (
                <div
                  key={bill.id}
                  className={`bill-card ${selectedBill?.id === bill.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedBill(bill);
                    resetPaymentForm();
                  }}
                >
                  <div className="bill-icon">
                    <FaReceipt />
                  </div>
                  <div className="bill-info">
                    <h4>{bill.patientName}</h4>
                    <p>{bill.tokenNumber || bill.ticketNumber}</p>
                    <small>{bill.serviceType}</small>
                  </div>
                  <div className="bill-amount">Rs {bill.amount?.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          {selectedBill && (
            <div className="payment-panel">
              <h3>Process Payment</h3>

              <div className="bill-details">
                <div className="detail-row">
                  <span>Patient:</span>
                  <strong>{selectedBill.patientName}</strong>
                </div>
                <div className="detail-row">
                  <span>Service:</span>
                  <strong>{selectedBill.serviceType}</strong>
                </div>
                <div className="detail-row amount">
                  <span>Amount:</span>
                  <strong>Rs {selectedBill.amount?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="payment-options">
                <label>Payment Mode</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMode === "cash"}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />{" "}
                    Cash
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="esewa"
                      checked={paymentMode === "esewa"}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />{" "}
                    eSewa/QR
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMode === "card"}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />{" "}
                    Card
                  </label>
                </div>

                <label>Discount / Coverage</label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setSsfEligibility(null);
                  }}
                >
                  <option value="none">No Discount</option>
                  <option value="ssf">SSF (Social Security)</option>
                  <option value="insurance">Health Insurance</option>
                  <option value="staff">Staff Discount</option>
                </select>

                {discountType === "ssf" && (
                  <div className="ssf-section">
                    <label>SSF Number</label>
                    <div className="ssf-input">
                      <input
                        type="text"
                        placeholder="Enter SSF ID"
                        value={ssfNumber}
                        onChange={(e) => setSsfNumber(e.target.value)}
                      />
                      <button onClick={checkSsfEligibility} disabled={loading || !ssfNumber.trim()}>
                        Verify
                      </button>
                    </div>

                    {ssfEligibility && (
                      <div className={`ssf-result ${ssfEligibility.eligible ? "eligible" : "not-eligible"}`}>
                        {ssfEligibility.eligible
                          ? `Eligible → Covers: Rs ${ssfEligibility.ssfCovers?.toLocaleString()} | Patient pays: Rs ${ssfEligibility.finalPatientAmount?.toLocaleString()}`
                          : ssfEligibility.message || "Not eligible for SSF coverage"}
                      </div>
                    )}
                  </div>
                )}

                {discountType === "insurance" && (
                  <div className="insurance-section">
                    <label>Insurance Provider</label>
                    <select
                      value={insurancePolicy}
                      onChange={(e) => setInsurancePolicy(e.target.value)}
                    >
                      <option value="">Select Provider</option>
                      {insuranceProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} ({provider.coveragePercent || 0}% coverage)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {discountType === "staff" && (
                  <div className="staff-discount-section">
                    <label>Discount Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                    {discountValue > 10 && (
                      <div className="admin-warning">
                        <FaExclamationTriangle />
                        <span>Discount : 10% requires Admin approval</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="payment-summary">
                <div className="summary-row">
                  <span>Original Amount:</span>
                  <span>Rs {selectedBill.amount?.toLocaleString()}</span>
                </div>

                {discountType !== "none" && (
                  <div className="summary-row discount">
                    <span>Discount/Coverage:</span>
                    <span>- Rs {(selectedBill.amount - calculateFinalAmount())?.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row total">
                  <span>Patient Pays:</span>
                  <strong>Rs {calculateFinalAmount()?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="payment-actions">
                <button className="cancel-btn" onClick={() => setSelectedBill(null)}>
                  Cancel
                </button>
                <button className="process-btn" onClick={handleProcessPayment} disabled={loading}>
                  <FaMoneyBillWave /> {loading ? "Processing..." : "Collect Payment"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── IPD Billing ────────────────────────────────────────────────── */}
      {activeTab === "ipd" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>
            <FaHospitalAlt /> Admitted Patients - Running Bills
          </h3>

          <div className="ipd-grid">
            {ipdBills.length === 0 ? (
              <p className="info-text">No active IPD patients found.</p>
            ) : (
              ipdBills.map((patient) => (
                <div
                  key={patient.id}
                  className={`ipd-card ${patient.depositBalance < 5000 ? "low-balance" : ""}`}
                >
                  <div className="ipd-header">
                    <div>
                      <h4>{patient.patientName}</h4>
                      <p>UHID: {patient.uhid}</p>
                    </div>
                    <span className="ward-badge">
                      {patient.ward} - {patient.bedNumber}
                    </span>
                  </div>

                  <div className="ipd-balance">
                    <div className="balance-row">
                      <span>Running Bill:</span>
                      <strong className="bill">Rs {patient.runningBill?.toLocaleString()}</strong>
                    </div>
                    <div className="balance-row">
                      <span>Deposit Balance:</span>
                      <strong className={patient.depositBalance < 5000 ? "low" : ""}>
                        Rs {patient.depositBalance?.toLocaleString()}
                      </strong>
                    </div>
                    {patient.depositBalance < 5000 && (
                      <div className="low-balance-alert">
                        <FaExclamationTriangle /> Low balance — please collect deposit!
                      </div>
                    )}
                  </div>

                  <div className="ipd-actions">
                    <button onClick={() => setSelectedIpdPatient(patient)} className="deposit-btn">
                      Add Deposit
                    </button>
                    <button className="print-btn">
                      <FaPrint /> Print Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedIpdPatient && (
            <div className="modal-overlay" onClick={() => setSelectedIpdPatient(null)}>
              <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Add Security Deposit</h3>
                <p>
                  Patient: <strong>{selectedIpdPatient.patientName}</strong>
                  <br />
                  UHID: {selectedIpdPatient.uhid}
                </p>
                <p>Current Deposit Balance: Rs {selectedIpdPatient.depositBalance?.toLocaleString()}</p>

                <div className="deposit-input">
                  <label>Deposit Amount (Rs)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="modal-actions">
                  <button onClick={() => setSelectedIpdPatient(null)}>Cancel</button>
                  <button onClick={handleAddDeposit} disabled={loading}>
                    {loading ? "Adding..." : "Add Deposit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Insurance Desk ─────────────────────────────────────────────── */}
      {activeTab === "insurance" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>
            <FaIdCard /> Insurance Verification Desk
          </h3>

          <div className="search-box">
            <FaSearch className="icon" />
            <input
              placeholder="Search by Phone or UHID"
              value={verifyUhid}
              onChange={(e) => setVerifyUhid(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchPatientForInsurance()}
            />
            <button onClick={searchPatientForInsurance} disabled={loading}>
              Search
            </button>
          </div>

          {verifyResult && (
            <div className="verification-form">
              <h4>
                Verify Insurance for:{" "}
                <span style={{ color: "#0056b3" }}>{verifyResult.fullName}</span>
                <br />
                UHID: {verifyResult.uhid}
              </h4>

              <div className="form-grid">
                <div className="form-group">
                  <label>Insurance Provider *</label>
                  <select
                    value={insuranceForm.providerId}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, providerId: e.target.value })}
                  >
                    <option value="">Select Provider</option>
                    {insuranceProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Policy Number</label>
                  <input
                    placeholder="Policy Number"
                    value={insuranceForm.policyNumber}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Coverage Limit (Rs)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={insuranceForm.policyLimit}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyLimit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Card Photo (Optional)</label>
                  <div className="file-upload">
                    <FaUpload /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCardImage(e.target.files[0])}
                    />
                  </div>
                  {cardImage && (
                    <small style={{ color: "green", display: "block", marginTop: "5px" }}>
                      Selected: {cardImage.name}
                    </small>
                  )}
                </div>
              </div>

              <div className="actions">
                <button
                  onClick={handleVerifyInsurance}
                  className="approve-btn"
                  disabled={loading || !insuranceForm.providerId}
                >
                  <FaCheck /> Approve & Link
                </button>
                <button
                  onClick={() => {
                    setVerifyResult(null);
                    setVerifyUhid("");
                  }}
                  className="reject-btn"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {!verifyResult && (
            <p className="info-text">
              {verifyUhid
                ? "No patient found with this phone/UHID."
                : "Search for a patient to verify their insurance details."}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Insured Patients List ──────────────────────────────────────── */}
      {activeTab === "insured" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>
            <FaUsers /> Verified Insured Patients
          </h3>

          {insuredPatients.length === 0 ? (
            <div className="empty-state">
              <p>No verified insured patients found.</p>
            </div>
          ) : (
            <div className="insured-grid">
              {insuredPatients.map((patient) => (
                <div key={patient.id} className="insured-card">
                  <div className="insured-header">
                    <h4>{patient.fullName}</h4>
                    <span className="uhid-badge">UHID: {patient.uhid}</span>
                  </div>
                  <div className="insured-details">
                    <p>
                      <strong>Provider:</strong> {getProviderName(patient.insuranceProviderId)}
                    </p>
                    <p>
                      <strong>Policy No:</strong> {patient.insurancePolicyNumber || "N/A"}
                    </p>
                    <p>
                      <strong>Limit:</strong>{" "}
                      {patient.insurancePolicyLimit
                        ? `Rs ${patient.insurancePolicyLimit.toLocaleString()}`
                        : "Unlimited"}
                    </p>
                    <p>
                      <strong>Verified By:</strong> {patient.insuranceVerifiedBy || "Staff"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Admin Authorization Modal for high discount */}
      {showAdminAuth && (
        <div className="modal-overlay">
          <div className="admin-auth-modal">
            <h3>Admin Authorization Required</h3>
            <p>For discounts greater than 10%</p>
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdminVerify()}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAdminAuth(false);
                  setAdminPassword("");
                }}
              >
                Cancel
              </button>
              <button onClick={handleAdminVerify}>Verify & Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingModule;