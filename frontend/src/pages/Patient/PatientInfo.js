import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUser, FaArrowLeft, FaLock, FaIdCard, FaMapMarkerAlt, FaCalendar, FaVenusMars, FaPhone, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import "../../styles/PatientRegister.css";

const PatientInfo = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    district: "",
    municipality: "",
    wardNo: "",
    ssfNumber: "",
    insuranceProvider: "",
    emergencyContact: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const phoneNumber = sessionStorage.getItem("registrationPhone");
  const verificationToken = sessionStorage.getItem("verificationToken");

  useEffect(() => {
    if (!phoneNumber || !verificationToken) {
      navigate("/patient-register");
    }
  }, [phoneNumber, verificationToken, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    const payload = {
      phoneNumber,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      guardianName: formData.guardianName || "",
      ssfNumber: formData.ssfNumber || "",
      insuranceProvider: formData.insuranceProvider || "",
      emergencyContact: formData.emergencyContact,
      address: {
        district: formData.district,
        municipality: formData.municipality,
        ward: formData.wardNo,
      },
    };

    try {
      const response = await fetch("http://localhost:8080/api/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(verificationToken && { Authorization: `Bearer ${verificationToken}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.removeItem("registrationPhone");
        sessionStorage.removeItem("verificationToken");
        setIsSuccess(true); 
      } else {
        setError(data.message || "Registration failed. Please try again.");
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
        {isSuccess ? (
          <div className="success-card">
            <FaCheckCircle className="success-icon" />
            <h2>Registration Successful!</h2>
            <p>Welcome to HospiSmart! Your account has been created successfully.</p>
            <p>You can now login with your new credentials.</p>
            <button className="auth-btn" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="register-header">
              <FaUser className="register-icon" />
              <h1>Complete Your Profile</h1>
              <p>Fill in your details to finish registration</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName"><FaUser /> Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group password-group">
                  <label htmlFor="password"><FaLock /> Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="form-group password-group">
                  <label htmlFor="confirmPassword"><FaLock /> Confirm Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth"><FaCalendar /> Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender"><FaVenusMars /> Gender *</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <h4 className="section-title">
                <FaMapMarkerAlt /> Address Details
              </h4>

              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  name="district"
                  placeholder="e.g. Kathmandu"
                  value={formData.district}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Municipality</label>
                  <input
                    type="text"
                    name="municipality"
                    placeholder="e.g. Lalitpur Metro"
                    value={formData.municipality}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ward No</label>
                  <input
                    type="number"
                    name="wardNo"
                    placeholder="e.g. 04"
                    value={formData.wardNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ssfNumber"><FaIdCard /> SSF Number (optional)</label>
                  <input
                    type="text"
                    id="ssfNumber"
                    name="ssfNumber"
                    placeholder="01-5970016"
                    value={formData.ssfNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="insuranceProvider">Insurance Provider (optional)</label>
                  <input
                    type="text"
                    id="insuranceProvider"
                    name="insuranceProvider"
                    placeholder="Citizen Life, IME"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact"><FaPhone /> Emergency Contact Number *</label>
                <input
                  type="tel"
                  id="emergencyContact"
                  name="emergencyContact"
                  placeholder="9800000000"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  maxLength="10"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Completing Registration..." : "Complete Registration"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default PatientInfo;