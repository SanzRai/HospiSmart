import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPhone, FaArrowLeft } from "react-icons/fa";
import "../../styles/PatientRegister.css";

const PatientRegister = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
      if (error && value.length > 0) setError("");
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    const phoneRegex = /^9[8,7]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid Nepali phone number (e.g. 9876543210)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("registrationPhone", phoneNumber);
        navigate("/patient-otp");
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-container">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="back-home-btn"
        onClick={() => navigate("/login")}
      >
        <FaArrowLeft /> Back to Login
      </motion.button>

      <motion.div
        className="register-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="register-header">
          <FaPhone className="register-icon" />
          <h1>Patient Registration</h1>
          <p>Enter your phone number to get started</p>
        </div>

        <form onSubmit={handleSendOTP} className="auth-form">
          <div className="form-group">
            <label htmlFor="phone">
              <FaPhone /> Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="98XXXXXXXX"
              value={phoneNumber}
              onChange={handleInputChange}
              maxLength="10"
              minLength="10"
              inputMode="numeric"
              autoFocus
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading || phoneNumber.length !== 10}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <a href="/login">Login here</a>
            </p>
          </div>
        </form>
      </motion.div>
    </main>
  );
};

export default PatientRegister;