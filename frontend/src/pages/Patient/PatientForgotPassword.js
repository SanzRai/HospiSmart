import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPhone, FaLock, FaArrowLeft, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import "../../styles/ForgotPassword.css";

const PatientForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resetToken, setResetToken] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

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
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        startResendTimer();
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true); 
      } else {
        setError(data.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(60);
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
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        startResendTimer();
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-container">
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
        className="forgot-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {isSuccess ? (
          <div className="success-card">
            <FaCheckCircle className="success-icon" />
            <h2>Password Reset Successful!</h2>
            <p>Your password has been updated successfully.</p>
            <p>Please login with your new password.</p>
            <button className="auth-btn" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="forgot-header">
              <FaLock className="forgot-icon" />
              <h1>
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Reset Password"}
              </h1>
              <p>
                {step === 1 && "Enter your registered phone number to receive OTP"}
                {step === 2 && `Enter the 6-digit code sent to ${phoneNumber}`}
                {step === 3 && "Enter your new password"}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleSendOTP} className="auth-form">
                <div className="form-group">
                  <label htmlFor="phone">
                    <FaPhone /> Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="98XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength="10"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>

                <div className="auth-footer">
                  <p>
                    Remember your password?{" "}
                    <a href="/login">Login here</a>
                  </p>
                </div>
              </form>
            )}

            {step === 2 && (
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
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group password-group">
                  <label htmlFor="newPassword">
                    <FaLock /> New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="form-group password-group">
                  <label htmlFor="confirmPassword">
                    <FaLock /> Confirm Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
};

export default PatientForgotPassword;