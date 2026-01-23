import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CryptoJS from "crypto-js";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import { FaCheckCircle, FaWallet, FaMoneyBillAlt, FaExclamationTriangle } from "react-icons/fa";
import "../../styles/Payment.css";

const API_BASE_URL = "http://localhost:8080/api";
const ESEWA_CONFIG = {
  merchantCode: "EPAYTEST",
  secretKey: "8gBm/:&EnhH.1/q",
  successUrl: "http://localhost:3000/patient/payment/success",
  failureUrl: "http://localhost:3000/patient/payment/failure",
  paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
};

const PatientPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const details = location.state?.paymentDetails;

  const storedPatientInfo = JSON.parse(localStorage.getItem("patientInfo") || "{}");
  const patientDisplayName =
    storedPatientInfo.fullName ||
    storedPatientInfo.name ||
    storedPatientInfo.full_name ||
    "Patient";

  const [paymentType, setPaymentType] = useState("SELF");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [coveredAmount, setCoveredAmount] = useState(0);
  const [payableAmount, setPayableAmount] = useState(0);
  const [ssfNumber, setSsfNumber] = useState("");
  const [ssfResult, setSsfResult] = useState(null);
  const [checkingSsf, setCheckingSsf] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [verifiedStaff, setVerifiedStaff] = useState(null);
  const [staffDiscountPercent, setStaffDiscountPercent] = useState(0);
  const [verifyingStaff, setVerifyingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [eligibleInsurance, setEligibleInsurance] = useState(null);
  const [checkingInsurance, setCheckingInsurance] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [receiptId, setReceiptId] = useState("");

  const token = localStorage.getItem("token");

  const fee = details ? Number(details.consultingFee || details.amount) || 0 : 0;

  const bookingType = details?.bookingType || "BILL";
  const isOpdOrAppointment = ["OPD", "APPOINTMENT"].includes(bookingType.toUpperCase());
  const isLabPayment = details?.type === "LAB_TEST";


  const discountsAllowed = isLabPayment;

  useEffect(() => {
    if (!details) {
      navigate("/patient/dashboard");
      return;
    }

    setPayableAmount(fee);
    setCoveredAmount(0);
    setPaymentType("SELF");
  }, [details, fee, navigate]);

  useEffect(() => {
    if (!discountsAllowed) {
      setPaymentType("SELF");
    }
  }, [discountsAllowed]);

  useEffect(() => {
    if (paymentType !== "SSF") {
      setSsfResult(null);
      setSsfNumber("");
    }
    if (paymentType !== "STAFF") {
      setVerifiedStaff(null);
      setStaffDiscountPercent(0);
      setStaffId("");
      setStaffError("");
    }
    if (paymentType !== "INSURANCE") {
      setEligibleInsurance(null);
      setInsuranceProvider("");
      setPolicyNumber("");
    }
  }, [paymentType]);

  useEffect(() => {
    setPayableAmount(Math.max(0, fee - coveredAmount));
  }, [coveredAmount, fee]);

  const verifySSF = async () => {
    if (!ssfNumber.trim()) return setError("Please enter SSF number");
    setCheckingSsf(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/ssf/check?ssfId=${ssfNumber}&serviceCode=LAB&fee=${fee}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Invalid SSF number or service");
      const data = await res.json();

      setSsfResult({ ...data, coveragePercentage: Math.round((data.ssfCovers / fee) * 100) });
      if (data.eligible) {
        setCoveredAmount(data.ssfCovers);
      } else {
        setError("Not eligible for SSF coverage");
      }
    } catch (err) {
      setError(err.message || "SSF verification failed");
    } finally {
      setCheckingSsf(false);
    }
  };

  const verifyStaff = async () => {
    if (!staffId.trim()) return setStaffError("Enter staff ID");
    setVerifyingStaff(true);
    setStaffError("");

    try {
      const res = await fetch(`${API_BASE_URL}/staff/verify-discount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId: staffId, patientName: details.patientName }),
      });

      if (!res.ok) throw new Error("Invalid staff ID");
      const data = await res.json();

      if (data.success) {
        setVerifiedStaff(data.staff);
        setStaffDiscountPercent(data.discountPercentage);
        const discountAmount = (data.discountPercentage / 100) * fee;
        setCoveredAmount(discountAmount);
      } else {
        setStaffError(data.message || "Staff not eligible");
      }
    } catch (err) {
      setStaffError(err.message || "Staff verification failed");
    } finally {
      setVerifyingStaff(false);
    }
  };

  const verifyInsurance = async () => {
    if (!insuranceProvider || !policyNumber) return setError("Enter provider and policy number");
    setCheckingInsurance(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/insurance/eligible?patientId=${details.patientId}&serviceType=LAB`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Insurance check failed");
      const data = await res.json();

      if (data.eligible) {
        const covered = (data.coveragePercentage / 100) * fee;
        setEligibleInsurance(data);
        setCoveredAmount(covered);
        setInsuranceProvider(data.providerName);
        setPolicyNumber(data.policyNumber);
      } else {
        setError("Not eligible under this insurance");
      }
    } catch (err) {
      setError(err.message || "Insurance verification failed");
    } finally {
      setCheckingInsurance(false);
    }
  };

  const sendToBackend = async () => {
    if (!paymentMethod) return setError("Please select payment method");
    setIsProcessing(true);
    setError("");

    const payload = {
      patientId: details.patientId,
      doctorId: details.doctorId || null,
      patientName: details.patientName,
      phoneNumber: details.patientPhone,
      patientEmail: details.patientEmail,
      symptoms: details.symptoms || null,
      doctorName: details.doctorName || null,
      department: details.department || "General",
      appointmentDate: details.appointmentDate || null,
      appointmentTime: details.appointmentTime || null,
      consultingFee: fee,
      coveredAmount,
      payableAmount,
      bookingType: details.bookingType || (details.type === "LAB_TEST" ? "LAB" : "BILL"),
      bookingToken: details.tokenNumber || details.billId || null,
      paymentMethod,
      paymentType,
      ssfNumber: paymentType === "SSF" ? ssfNumber : null,
      staffId: paymentType === "STAFF" ? staffId : null,
      staffDiscountPercent,
      insuranceProvider: paymentType === "INSURANCE" ? insuranceProvider : null,
      insurancePolicyNumber: paymentType === "INSURANCE" ? policyNumber : null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/payments/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Payment initiation failed");
      }

      const data = await res.json();
      const receipt = data.receiptId;

      if (details.type === "LAB_TEST") {
        await fetch(`${API_BASE_URL}/billing/pay-lab`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ labId: details.billId.replace("LAB-", "") }),
        });
      }

      if (paymentMethod === "esewa") {
        submitEsewa(receipt, payableAmount);
      } else {
        setReceiptId(receipt);
        setShowConfirmation(true);
        setTimeout(() => navigate("/patient/dashboard"), 6000);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitEsewa = (transactionUuid, amount) => {
    const totalAmount = Number(amount).toFixed(2);
    const stringToSign = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
    const hash = CryptoJS.HmacSHA256(stringToSign, ESEWA_CONFIG.secretKey);
    const signature = CryptoJS.enc.Base64.stringify(hash);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = ESEWA_CONFIG.paymentUrl;

    const params = {
      amount: totalAmount,
      tax_amount: "0",
      product_service_charge: "0",
      product_delivery_charge: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.merchantCode,
      success_url: ESEWA_CONFIG.successUrl,
      failure_url: ESEWA_CONFIG.failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    Object.keys(params).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = params[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <PatientNavbar
        patientInfo={{ name: patientDisplayName }}
        notificationCount={0}
      />
      <main className="payment-container">
        <motion.section className="payment-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1>Payment Confirmation</h1>
          <p>Review your service and complete payment</p>
        </motion.section>

        <section className="payment-card">
          <div className="card-header">
            <h2>Service Summary</h2>
            <span className="booking-badge">
              {details.type === "LAB_TEST" ? "Lab Test" : details.bookingType || "Service"}
            </span>
          </div>

          <div className="details-grid">
            <div><strong>Name:</strong> {details.patientName}</div>
            {details.doctorName && <div><strong>Doctor:</strong> {details.doctorName}</div>}
            <div><strong>Department:</strong> {details.department || "General"}</div>
            {details.serviceName && <div><strong>Service:</strong> {details.serviceName}</div>}
            {details.appointmentDate && <div><strong>Date:</strong> {formatDate(details.appointmentDate)}</div>}
            {details.appointmentTime && <div><strong>Time:</strong> {details.appointmentTime}</div>}
            <div><strong>Contact:</strong> {details.patientPhone || "N/A"}</div>
            <div><strong>Fee:</strong> NPR {fee.toLocaleString()}</div>
            {details.tokenNumber && <div><strong>Token/Ref:</strong> #{details.tokenNumber}</div>}
          </div>

          <hr />

          <h3>Payment Type</h3>
          {discountsAllowed ? (
            <div className="options">
              {["SELF", "SSF", "INSURANCE", "STAFF"].map((type) => (
                <button
                  key={type}
                  className={`opt ${paymentType === type ? "selected" : ""}`}
                  onClick={() => {
                    setPaymentType(type);
                    setError("");
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          ) : (
            <div className="locked-notice">
              {/* <FaExclamationTriangle />
              <p>For OPD/Appointment bookings, payment must be made as <strong>SELF</strong> only.</p>
              <p>(Discounts/SSF/Insurance/Staff are allowed only for lab tests)</p> */}
            </div>
          )}

          {discountsAllowed && paymentType === "SSF" && (
            <div className="discount-section">
              <label>SSF Number</label>
              <input
                type="text"
                value={ssfNumber}
                onChange={(e) => setSsfNumber(e.target.value)}
                placeholder="Enter your SSF number"
              />
              <button onClick={verifySSF} disabled={checkingSsf}>
                {checkingSsf ? "Verifying..." : "Verify SSF"}
              </button>
              {ssfResult && ssfResult.eligible && (
                <p className="success">Eligible — Coverage: {ssfResult.coveragePercentage}%</p>
              )}
            </div>
          )}

          {discountsAllowed && paymentType === "STAFF" && (
            <div className="discount-section">
              <label>Staff ID</label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="Enter staff employee ID"
              />
              <button onClick={verifyStaff} disabled={verifyingStaff}>
                {verifyingStaff ? "Verifying..." : "Verify Staff"}
              </button>
              {staffError && <p className="error">{staffError}</p>}
              {verifiedStaff && (
                <p className="success">
                  {verifiedStaff.name} ({verifiedStaff.role}) — {staffDiscountPercent}% discount applied
                </p>
              )}
            </div>
          )}

          {discountsAllowed && paymentType === "INSURANCE" && (
            <div className="discount-section">
              <label>Insurance Provider</label>
              <input
                type="text"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="e.g., NLIC, Surya Life"
              />
              <label>Policy Number</label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Enter policy number"
              />
              <button onClick={verifyInsurance} disabled={checkingInsurance}>
                {checkingInsurance ? "Checking..." : "Verify Insurance"}
              </button>
              {eligibleInsurance && (
                <p className="success">Eligible — Coverage: {eligibleInsurance.coveragePercentage}%</p>
              )}
            </div>
          )}

          <div className="billing">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Fee:</span>
              <span>NPR {fee.toLocaleString()}</span>
            </div>

            {coveredAmount > 0 && (
              <div style={{ color: "green", display: "flex", justifyContent: "space-between" }}>
                <span>Covered/Discount:</span>
                <span>- NPR {coveredAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="final-pay">
              <span>You Pay:</span>
              <strong>NPR {payableAmount.toLocaleString()}</strong>
            </div>
          </div>

          <h3 style={{ marginTop: "20px" }}>Payment Method</h3>
          <div className="methods">
            <button
              className={`mopt ${paymentMethod === "esewa" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("esewa")}
            >
              <FaWallet color="#66cc33" /> eSewa
            </button>
            <button
              className={`mopt ${paymentMethod === "counter" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("counter")}
            >
              <FaMoneyBillAlt color="#0056b3" /> Pay at Counter
            </button>
          </div>

          {isOpdOrAppointment && (
            <div className="warning-box">
              <FaExclamationTriangle />
              OPD/Appointment requires immediate payment (no discounts allowed).
            </div>
          )}

          {error && (
            <div className="error" style={{ color: "red", textAlign: "center", marginTop: "10px" }}>
              {error}
            </div>
          )}

          <button
            className="confirm-payment"
            disabled={isProcessing || !paymentMethod}
            onClick={sendToBackend}
          >
            {isProcessing ? "Processing..." : "Confirm & Pay"}
          </button>
        </section>

        {showConfirmation && (
          <motion.div
            className="confirmation-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.7, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              <FaCheckCircle className="success-icon" />
              <h2>Payment Confirmed!</h2>
              <p className="receipt-text">Receipt ID: <strong>{receiptId}</strong></p>
              <p className="instruction-text">
                {paymentMethod === "counter"
                  ? "Please proceed to the counter to complete your payment."
                  : "Payment processed successfully."}
              </p>
              <div className="modal-actions">
                <button
                  className="modal-btn primary"
                  onClick={() => navigate("/patient/dashboard")}
                >
                  Go to Dashboard
                </button>
              </div>
              <p className="auto-redirect">Redirecting in 6 seconds...</p>
            </motion.div>
          </motion.div>
        )}
      </main>
      <PatientFooter />
    </>
  );
};

export default PatientPayment;