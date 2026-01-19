import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CryptoJS from "crypto-js";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FaCheckCircle, FaWallet, FaMoneyBillAlt, FaExclamationTriangle } from "react-icons/fa";
import "../../styles/Payment.css";

const API_BASE_URL = "http://localhost:8080/api";
const ESEWA_CONFIG = {
  merchantCode: "EPAYTEST",
  secretKey: "8gBm/:&EnhH.1/q",
  successUrl: "http://localhost:3000/payment/success",
  failureUrl: "http://localhost:3000/payment/failure",
  paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const details = location.state?.paymentDetails;
  const fee = details ? Number(details.consultingFee) || 0 : 0;
  const isOpd = details?.bookingType === "OPD";

  const discountsAllowed = details?.bookingType && 
    !["OPD", "APPOINTMENT"].includes(details.bookingType.toUpperCase());

  const [paymentType, setPaymentType] = useState("SELF");
  const [paymentMethod, setPaymentMethod] = useState("");
  

  const [coveredAmount, setCoveredAmount] = useState(0);
  const [payableAmount, setPayableAmount] = useState(fee);


  const [ssfNumber, setSsfNumber] = useState("");
  const [ssfResult, setSsfResult] = useState(null);
  const [checkingSsf, setCheckingSsf] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [verifiedStaff, setVerifiedStaff] = useState(null);
  const [staffDiscountPercent, setStaffDiscountPercent] = useState(0);
  const [verifyingStaff, setVerifyingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");

  const [providers, setProviders] = useState([]);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [eligibleInsurance, setEligibleInsurance] = useState(null);
  const [checkingInsurance, setCheckingInsurance] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [receiptId, setReceiptId] = useState("");

  useEffect(() => {
    if (!discountsAllowed) {
      setCoveredAmount(0);
      setPayableAmount(fee);
      setPaymentType("SELF");
    }
  }, [fee, discountsAllowed]);

 
  useEffect(() => {
    if (!discountsAllowed) {
      setSsfResult(null);
      setEligibleInsurance(null);
      setVerifiedStaff(null);
      setStaffDiscountPercent(0);
    }
  }, [discountsAllowed]);


  const clearStaffVerification = () => {
    setVerifiedStaff(null);
    setStaffDiscountPercent(0);
    setStaffId("");
    setStaffError("");
  };

  const sendToBackend = async () => {
    setError("");
    if (!paymentMethod) return setError("Please select payment method");

    setIsProcessing(true);

    const payload = {
      patientId: details.patientId || null,
      doctorId: details.doctorId || null,
      patientGender: details.patientGender || null,
      patientAge: details.patientAge || null,
      patientDob: details.patientDob || null,
      address: details.address || null,

      bookingType: details.bookingType,
      bookingToken: details.tokenNumber || details.ticketNumber,
      patientName: details.patientName,
      phoneNumber: details.patientPhone || details.contactNumber,
      patientEmail: details.patientEmail,
      symptoms: details.symptoms,
      doctorName: details.doctorName,
      department: details.department,
      appointmentDate: details.appointmentDate,
      appointmentTime: details.appointmentTime,
      consultingFee: fee,
      coveredAmount,
      payableAmount,
      paymentType,
      paymentMethod,
      ssfNumber: discountsAllowed && paymentType === "SSF" ? ssfNumber : null,
      insuranceProvider: null,
      insurancePolicyNumber: null,
      staffId: null,
      staffDiscountPercent: 0,
      verifiedStaffName: null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/payments/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Server error");
      }

      const data = await res.json();
      const receipt = data.receiptId;

      if (paymentMethod === "esewa") {
        submitEsewa(receipt, payableAmount);
      } else {
        setReceiptId(receipt);
        setShowConfirmation(true);
        setTimeout(() => navigate("/"), 6000);
      }
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitEsewa = (transactionUuid, amount) => {
    if (!amount) return console.error("Amount missing");
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
      signature: signature,
    };

    Object.keys(params).forEach(key => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = params[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  if (!details) return null;

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
      <Navbar />
      <main className="payment-container">
        <motion.section className="payment-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1>Payment Confirmation</h1>
          <p>Review your booking and complete payment</p>
        </motion.section>

        <section className="payment-card">
          <div className="card-header">
            <h2>Booking Summary</h2>
            <span className="booking-badge">{details.bookingType}</span>
          </div>

          <div className="details-grid">
            <div><strong>Name:</strong> {details.patientName}</div>
            {details.patientAge && <div><strong>Age:</strong> {details.patientAge}</div>}
            {details.doctorName && <div><strong>Doctor:</strong> {details.doctorName}</div>}
            {details.department && <div><strong>Department:</strong> {details.department}</div>}
            {details.appointmentDate && <div><strong>Date:</strong> {formatDate(details.appointmentDate)}</div>}
            {details.appointmentTime && <div><strong>Time:</strong> {details.appointmentTime}</div>}
            <div><strong>Contact:</strong> {details.contactNumber || details.patientPhone}</div>
            <div><strong>Fee:</strong> NPR {details.consultingFee}</div>
            <div><strong>Token:</strong> #{details.tokenNumber || details.ticketNumber}</div>
          </div>

          <hr />

          <h3>Payment Type</h3>
          <div className="options">
            {/* Only show relevant options */}
            {discountsAllowed ? (
              ["SELF", "SSF", "INSURANCE", "STAFF"].map((type) => (
                <button
                  key={type}
                  className={`opt ${paymentType === type ? "selected" : ""}`}
                  onClick={() => {
                    setPaymentType(type);
                    setError("");
                    if (type !== "STAFF") clearStaffVerification();
                  }}
                >
                  {type}
                </button>
              ))
            ) : (
              <button className="opt selected" disabled>
                SELF
              </button>
            )}
          </div>

          {/* All discount sections are hidden when discounts not allowed */}
          {discountsAllowed && paymentType === "SSF" && (
            <> {/* Existing SSF input and feedback */} </>
          )}

          {discountsAllowed && paymentType === "INSURANCE" && (
            <> {/* Existing Insurance feedback */} </>
          )}

          {discountsAllowed && paymentType === "STAFF" && (
            <> {/* Existing Staff verification */} </>
          )}

          <br />

          <div className="billing" style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Fee:</span>
              <span>NPR {fee}</span>
            </div>
            {coveredAmount > 0 && (
              <div style={{ color: "green", display: "flex", justifyContent: "space-between" }}>
                <span>Covered/Discount:</span>
                <span>- NPR {coveredAmount.toFixed(0)}</span>
              </div>
            )}
            <div style={{
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
              marginTop: "10px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.2rem"
            }}>
              <span>You Pay:</span>
              <span>NPR {payableAmount.toFixed(0)}</span>
            </div>
          </div>

          <h3 style={{ marginTop: "20px" }}>Payment Method</h3>
          <div className="methods" style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <button
              className={`mopt ${paymentMethod === "esewa" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("esewa")}
              style={{
                flex: 1, padding: "10px",
                border: paymentMethod === "esewa" ? "2px solid #28a745" : "1px solid #ccc",
                background: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
              }}
            >
              <FaWallet color="#66cc33" /> eSewa
            </button>

            {!isOpd && (
              <button
                className={`mopt ${paymentMethod === "counter" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("counter")}
                style={{
                  flex: 1, padding: "10px",
                  border: paymentMethod === "counter" ? "2px solid #0056b3" : "1px solid #ccc",
                  background: "white", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                }}
              >
                <FaMoneyBillAlt color="#0056b3" /> Pay at Counter
              </button>
            )}
          </div>

          {isOpd && (
            <div className="warning-box" style={{
              marginTop: "10px", color: "#856404", background: "#fff3cd",
              padding: "10px", borderRadius: "5px", display: "flex", gap: "10px", alignItems: "center"
            }}>
              <FaExclamationTriangle /> OPD Tickets require immediate payment.
            </div>
          )}

          {error && <div className="error" style={{ color: "red", textAlign: "center", marginTop: "10px" }}>{error}</div>}

          <button
            className="confirm-payment"
            disabled={isProcessing}
            onClick={sendToBackend}
            style={{
              width: "100%", padding: "15px", background: "#0056b3", color: "white",
              border: "none", borderRadius: "5px", marginTop: "20px",
              fontSize: "1.1rem", cursor: isProcessing ? "not-allowed" : "pointer"
            }}
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
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.7, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <FaCheckCircle className="success-icon" />
              <h2>Booking Confirmed!</h2>
              <p className="receipt-text">Receipt ID: <strong>{receiptId}</strong></p>
              <p className="instruction-text">Please proceed to the counter to complete your payment.</p>
              
              <div className="modal-actions">
                <button 
                  className="modal-btn primary"
                  onClick={() => navigate("/")}
                >
                  Go to Homepage
                </button>
                <button 
                  className="modal-btn secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  View Booking Details
                </button>
              </div>
              
              <p className="auto-redirect">Redirecting to homepage in 6 seconds...</p>
            </motion.div>
          </motion.div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Payment;