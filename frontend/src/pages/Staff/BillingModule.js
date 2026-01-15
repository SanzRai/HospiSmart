import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  FaUsers
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8080/api";

const BillingModule = ({ staffInfo }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingBills, setPendingBills] = useState([]);
  const [ipdBills, setIpdBills] = useState([]);
  const [insuredPatients, setInsuredPatients] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  // Payment Form State
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [ssfNumber, setSsfNumber] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [ssfEligibility, setSsfEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  // Admin Auth
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  // Deposit
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedIpdPatient, setSelectedIpdPatient] = useState(null);

  // Insurance Desk State
  const [verifyUhid, setVerifyUhid] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [insuranceForm, setInsuranceForm] = useState({ providerId: "", policyNumber: "", policyLimit: "" });
  const [cardImage, setCardImage] = useState(null);

  useEffect(() => {
    fetchPendingBills();
    fetchIpdBills();
    fetchInsuranceProviders();
    if (activeTab === "insured") {
      fetchInsuredPatients();
    }
  }, [activeTab]);

  const fetchPendingBills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      if (res.ok) {
        setPendingBills(await res.json());
      }
    } catch (err) {
      console.error("Error fetching pending bills:", err);
    }
  };

  const fetchIpdBills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/ipd`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      if (res.ok) {
        setIpdBills(await res.json());
      }
    } catch (err) {
      console.error("Error fetching IPD bills:", err);
    }
  };

  const fetchInsuranceProviders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/insurance/providers`);
      if (res.ok) {
        setInsuranceProviders(await res.json());
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  const fetchInsuredPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/patients?insured=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("staffToken")}` },
      });
      if (res.ok) {
        setInsuredPatients(await res.json());
      }
    } catch (err) {
      console.error("Error fetching insured patients:", err);
    }
  };

  const checkSsfEligibility = async () => {
    if (!ssfNumber || !selectedBill) return;
    setLoading(true);

    const serviceCode = selectedBill.serviceType.includes("OPD") ? "OPD-GEN" : "APT-GEN";

    try {
      const res = await fetch(
        `${API_BASE_URL}/ssf/check?ssfId=${ssfNumber}&serviceCode=${serviceCode}&fee=${selectedBill.amount}`
      );
      if (res.ok) {
        const data = await res.json();
        setSsfEligibility(data);
      } else {
        alert("SSF Verification Failed");
        setSsfEligibility(null);
      }
    } catch (err) {
      console.error("SSF Check Error:", err);
      alert("Failed to verify SSF");
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
      const provider = insuranceProviders.find(p => p.id.toString() === insurancePolicy);
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
      staff: "STAFF"
    };

    const payload = {
      bookingType: selectedBill.serviceType.includes("OPD") ? "OPD" : "APPOINTMENT",
      bookingToken: selectedBill.ticketNumber,
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
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Payment processed successfully! Receipt Generated.");
        setSelectedBill(null);
        resetPaymentForm();
        fetchPendingBills();
      } else {
        const err = await res.text();
        alert(err || "Payment failed");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = async () => {
    if (!selectedIpdPatient || !depositAmount || depositAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/billing/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`,
        },
        body: JSON.stringify({
          patientId: selectedIpdPatient.id,
          amount: parseFloat(depositAmount),
          receivedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        alert("Deposit added successfully!");
        setDepositAmount("");
        fetchIpdBills();
        setSelectedIpdPatient(null);
      } else {
        alert("Failed to add deposit");
      }
    } catch (err) {
      console.error("Deposit Error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const searchPatientForInsurance = async () => {
    if (!verifyUhid.trim()) {
      alert("Please enter phone number or UHID");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/patients/search?phone=${verifyUhid}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
        setInsuranceForm({ providerId: "", policyNumber: "", policyLimit: "" });
        setCardImage(null);
      } else {
        alert("Patient not found");
        setVerifyResult(null);
      }
    } catch (e) {
      console.error(e);
      alert("Search failed");
    }
  };

  const handleVerifyInsurance = async () => {
    if (!verifyResult || !insuranceForm.providerId) {
      alert("Please fill all required fields");
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
          Authorization: `Bearer ${localStorage.getItem("staffToken")}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Insurance Verified & Linked to Patient!");
        setVerifyResult(null);
        setInsuranceForm({ providerId: "", policyNumber: "", policyLimit: "" });
        setCardImage(null);
        setVerifyUhid("");
      } else {
        alert("Verification Failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to verify insurance");
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
    const provider = insuranceProviders.find(p => p.id === providerId);
    return provider ? provider.name : "Unknown";
  };

  return (
    <div className="billing-module">
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
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
          <FaReceipt /> Pending Bills
        </button>
        <button className={activeTab === "ipd" ? "active" : ""} onClick={() => setActiveTab("ipd")}>
          <FaHospitalAlt /> IPD Billing
        </button>
        <button className={activeTab === "insurance" ? "active" : ""} onClick={() => setActiveTab("insurance")}>
          <FaIdCard /> Insurance Desk
        </button>
        <button className={activeTab === "insured" ? "active" : ""} onClick={() => setActiveTab("insured")}>
          <FaUsers /> Insured Patients
        </button>
      </div>

      {/* Pending Bills Tab */}
      {activeTab === "pending" && (
        <motion.div className="tab-content billing-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bills-list">
            <h3>Pending Payments</h3>
            {pendingBills.length === 0 ? (
              <div className="empty-state"><p>No pending bills.</p></div>
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
                  <div className="bill-icon"><FaReceipt /></div>
                  <div className="bill-info">
                    <h4>{bill.patientName}</h4>
                    <p>{bill.ticketNumber}</p>
                    <small>{bill.serviceType}</small>
                  </div>
                  <div className="bill-amount">Rs {bill.amount}</div>
                </div>
              ))
            )}
          </div>

          {selectedBill && (
            <div className="payment-panel">
              <h3>Process Payment</h3>
              <div className="bill-details">
                <div className="detail-row"><span>Patient:</span><strong>{selectedBill.patientName}</strong></div>
                <div className="detail-row"><span>Service:</span><strong>{selectedBill.serviceType}</strong></div>
                <div className="detail-row amount"><span>Amount:</span><strong>Rs {selectedBill.amount}</strong></div>
              </div>

              <div className="payment-options">
                <label>Payment Mode</label>
                <div className="radio-group">
                  <label><input type="radio" value="cash" checked={paymentMode === "cash"} onChange={(e) => setPaymentMode(e.target.value)} /> Cash</label>
                  <label><input type="radio" value="esewa" checked={paymentMode === "esewa"} onChange={(e) => setPaymentMode(e.target.value)} /> eSewa/QR</label>
                  <label><input type="radio" value="card" checked={paymentMode === "card"} onChange={(e) => setPaymentMode(e.target.value)} /> Card</label>
                </div>

                <label>Discount/Coverage</label>
                <select value={discountType} onChange={(e) => { setDiscountType(e.target.value); setSsfEligibility(null); }}>
                  <option value="none">No Discount</option>
                  <option value="ssf">SSF (Social Security)</option>
                  <option value="insurance">Health Insurance</option>
                  <option value="staff">Staff Discount</option>
                </select>

                {discountType === "ssf" && (
                  <div className="ssf-section">
                    <label>SSF Number</label>
                    <div className="ssf-input">
                      <input type="text" placeholder="Enter SSF ID" value={ssfNumber} onChange={(e) => setSsfNumber(e.target.value)} />
                      <button onClick={checkSsfEligibility} disabled={loading}>Verify</button>
                    </div>
                    {ssfEligibility && (
                      <div className={`ssf-result ${ssfEligibility.eligible ? "eligible" : "not-eligible"}`}>
                        {ssfEligibility.eligible
                          ? `Eligible! Covers: Rs ${ssfEligibility.ssfCovers} | Patient Pays: Rs ${ssfEligibility.finalPatientAmount}`
                          : ssfEligibility.message || "Not Eligible"}
                      </div>
                    )}
                  </div>
                )}

                {discountType === "insurance" && (
                  <div className="insurance-section">
                    <label>Insurance Provider</label>
                    <select value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)}>
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
                        <span>Discount 10% requires Admin approval</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="payment-summary">
                <div className="summary-row"><span>Original Amount:</span><span>Rs {selectedBill.amount}</span></div>
                {discountType !== "none" && (
                  <div className="summary-row discount">
                    <span>Discount/Coverage:</span>
                    <span>- Rs {selectedBill.amount - calculateFinalAmount()}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Patient Pays:</span>
                  <strong>Rs {calculateFinalAmount()}</strong>
                </div>
              </div>

              <div className="payment-actions">
                <button className="cancel-btn" onClick={() => setSelectedBill(null)}>Cancel</button>
                <button className="process-btn" onClick={handleProcessPayment} disabled={loading}>
                  <FaMoneyBillWave /> {loading ? "Processing..." : "Collect Payment"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* IPD Tab */}
      {activeTab === "ipd" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaHospitalAlt /> Admitted Patients - Running Bills</h3>
          <div className="ipd-grid">
            {ipdBills.length === 0 && <p className="info-text">No active IPD patients found.</p>}
            {ipdBills.map((patient) => (
              <div key={patient.id} className={`ipd-card ${patient.depositBalance < 5000 ? "low-balance" : ""}`}>
                <div className="ipd-header">
                  <div>
                    <h4>{patient.patientName}</h4>
                    <p>UHID: {patient.uhid}</p>
                  </div>
                  <span className="ward-badge">{patient.ward} - {patient.bedNumber}</span>
                </div>

                <div className="ipd-balance">
                  <div className="balance-row"><span>Running Bill:</span><strong className="bill">Rs {patient.runningBill}</strong></div>
                  <div className="balance-row">
                    <span>Deposit Balance:</span>
                    <strong className={patient.depositBalance < 5000 ? "low" : ""}>Rs {patient.depositBalance}</strong>
                  </div>
                  {patient.depositBalance < 5000 && (
                    <div className="low-balance-alert"><FaExclamationTriangle /> Low balance!</div>
                  )}
                </div>

                <div className="ipd-actions">
                  <button onClick={() => setSelectedIpdPatient(patient)} className="deposit-btn">Add Deposit</button>
                  <button className="print-btn"><FaPrint /> Print Bill</button>
                </div>
              </div>
            ))}
          </div>

          {selectedIpdPatient && (
            <div className="modal-overlay" onClick={() => setSelectedIpdPatient(null)}>
              <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Add Deposit</h3>
                <p>Patient: {selectedIpdPatient.patientName} (UHID: {selectedIpdPatient.uhid})</p>
                <p>Current Balance: Rs {selectedIpdPatient.depositBalance}</p>
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

      {/* Insurance Desk Tab */}
      {activeTab === "insurance" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaIdCard /> Insurance Verification Desk</h3>

          <div className="search-box" style={{ marginBottom: "20px" }}>
            <FaSearch className="icon" />
            <input
              placeholder="Search by Phone or UHID"
              value={verifyUhid}
              onChange={(e) => setVerifyUhid(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchPatientForInsurance()}
            />
            <button onClick={searchPatientForInsurance}>Search</button>
          </div>

          {verifyResult && (
            <div className="verification-form">
              <h4>
                Verify Insurance for: <span style={{ color: "#0056b3" }}>{verifyResult.fullName}</span>
                {" "} (UHID: {verifyResult.uhid})
              </h4>

              <div className="form-grid">
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <select
                    value={insuranceForm.providerId}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, providerId: e.target.value })}
                  >
                    <option value="">Select Provider</option>
                    {insuranceProviders.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
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
                    <input type="file" accept="image/*" onChange={(e) => setCardImage(e.target.files[0])} />
                  </div>
                  {cardImage && <small style={{ color: "green", display: "block", marginTop: "5px" }}>File: {cardImage.name}</small>}
                </div>
              </div>

              <div className="actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button onClick={handleVerifyInsurance} className="approve-btn" disabled={loading}>
                  <FaCheck /> Approve & Link
                </button>
                <button onClick={() => { setVerifyResult(null); setVerifyUhid(""); }} className="reject-btn">
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {!verifyResult && verifyUhid === "" && <p className="info-text">Search for a patient to verify their insurance details.</p>}
          {verifyUhid !== "" && !verifyResult && <p className="info-text" style={{ color: "#d32f2f" }}>No patient found. Try another phone/UHID.</p>}
        </motion.div>
      )}

      {/* Insured Patients Tab */}
      {activeTab === "insured" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaUsers /> Verified Insured Patients</h3>
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
                    <p><strong>Provider:</strong> {getProviderName(patient.insuranceProviderId)}</p>
                    <p><strong>Policy No:</strong> {patient.insurancePolicyNumber || "N/A"}</p>
                    <p><strong>Limit:</strong> Rs {patient.insurancePolicyLimit?.toLocaleString() || "Unlimited"}</p>
                    <p><strong>Verified By:</strong> {patient.insuranceVerifiedBy || "Staff"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Admin Auth Modal */}
      {showAdminAuth && (
        <div className="modal-overlay">
          <div className="admin-auth-modal">
            <h3>Admin Authorization Required</h3>
            <p>Discount greater than 10% requires admin approval</p>
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && adminPassword === "admin123" && (setShowAdminAuth(false), handleProcessPayment())}
            />
            <div className="modal-actions">
              <button onClick={() => { setShowAdminAuth(false); setAdminPassword(""); }}>Cancel</button>
              <button
                onClick={() => {
                  if (adminPassword === "admin123") {
                    setShowAdminAuth(false);
                    setAdminPassword("");
                    handleProcessPayment();
                  } else {
                    alert("Invalid admin password");
                    setAdminPassword("");
                  }
                }}
              >
                Verify & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingModule;