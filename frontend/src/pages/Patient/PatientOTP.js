import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUser, FaArrowLeft } from "react-icons/fa";
import "../../styles/PatientRegister.css";

const PatientOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const phoneNumber = sessionStorage.getItem("registrationPhone");

  useEffect(() => {
    if (!phoneNumber) {
      navigate("/patient-register");
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneNumber, navigate]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.verificationToken) {
          sessionStorage.setItem("verificationToken", data.verificationToken);
        }
        navigate("/patient-info");
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setCanResend(false);
    setResendTimer(60);

    try {
      const response = await fetch("http://localhost:8080/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        // Timer restarts automatically via useEffect
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    }
  };

  return (
    <main className="register-container">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="back-home-btn"
        onClick={() => navigate("/patient-register")}
      >
        <FaArrowLeft /> Back to Register
      </motion.button>

      <motion.div
        className="register-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="register-header">
          <FaUser className="register-icon" />
          <h1>Verify OTP</h1>
          <p>Enter the 6-digit code sent to {phoneNumber}</p>
        </div>

        <form onSubmit={handleVerifyOTP} className="auth-form">
          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              type="text"
              id="otp"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength="6"
              className="otp-input"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="resend-section">
            {canResend ? (
              <button type="button" onClick={handleResendOTP} className="resend-btn">
                Resend OTP
              </button>
            ) : (
              <p className="resend-timer">Resend OTP in {resendTimer}s</p>
            )}
          </div>
        </form>
      </motion.div>
    </main>
  );
};

export default PatientOTP;