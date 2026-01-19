import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import "../styles/Auth.css";

const API_BASE_URL = "http://localhost:8080/api";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setIdentifierError('');
    setPasswordError('');

    if (!identifier.trim()) {
      setIdentifierError('Please enter your phone or email');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);

    const possibleEndpoints = [
      { type: 'patient', url: '/auth/login', field: 'identifier' },
      { type: 'doctor', url: '/doctors/login', field: 'email' },
      { type: 'staff', url: '/staff/login', field: 'email' },
      { type: 'admin', url: '/admin/login', field: 'username' },
    ];

    let success = false;

    try {
      for (const endpoint of possibleEndpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [endpoint.field]: identifier.trim(),
              password,
            }),
          });

          const text = await response.text();
          const data = text ? JSON.parse(text) : {};

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          success = true;

          const receivedRole = (data.role || '').toLowerCase();

          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', receivedRole);
          localStorage.setItem(
            'userId',
            data.userId ||
              data.patient?.id ||
              data.doctorId ||
              data.staffId ||
              data.adminId ||
              ''
          );

          if (receivedRole === 'patient') {
            let patientData = data.patient || {};

            const resolvedPatientId =
              data.patient?.id ??
              data.userId ??
              data.id ??
              data.patientId;

            if (!patientData.fullName && resolvedPatientId) {
              try {
                const profileRes = await fetch(
                  `${API_BASE_URL}/patients/${resolvedPatientId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${data.token}`,
                    },
                  }
                );
                if (profileRes.ok) {
                  patientData = await profileRes.json();
                }
              } catch {}
            }

            localStorage.setItem('patientInfo', JSON.stringify(patientData));
            if (resolvedPatientId) {
              localStorage.setItem('patientId', String(resolvedPatientId));
            }
            localStorage.setItem(
              'patientPhone',
              patientData.phoneNumber || identifier.trim()
            );
          }

          if (data.patient) localStorage.setItem('patientInfo', JSON.stringify(data.patient));
          if (data.doctor) localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
          if (data.admin) localStorage.setItem('adminInfo', JSON.stringify(data.admin));
          if (data.staff) localStorage.setItem('staffInfo', JSON.stringify(data.staff));

          const roleRedirects = {
            patient: '/patient-dashboard',
            doctor: '/doctor/dashboard',
            admin: '/admin-dashboard',
            staff: '/staff/dashboard',
          };

          navigate(roleRedirects[receivedRole] || '/', { replace: true });
          break;
        } catch {}
      }

      if (!success) {
        setServerError('Invalid credentials. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="back-home-btn"
        onClick={() => navigate('/')}
      >
        <FaArrowLeft /> Back to Home
      </motion.button>

      <div className="auth-page">
        <div className="auth-left">
          <motion.div
            className="auth-form-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="auth-header">
              <div className="auth-logo">
                <FaUser size={44} />
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to access your HospiSmart account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="input-group">
                <label><FaUser /> Phone or Email</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setIdentifierError('');
                    setServerError('');
                  }}
                  placeholder="98XXXXXXXX / email@example.com"
                  disabled={loading}
                  className={identifierError ? 'input-error' : ''}
                />
                {identifierError && <span className="field-error">{identifierError}</span>}
              </div>

              <div className="input-group password-group">
                <label><FaLock /> Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setServerError('');
                  }}
                  disabled={loading}
                  className={passwordError ? 'input-error' : ''}
                />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                {passwordError && <span className="field-error">{passwordError}</span>}
              </div>

              <div className="forgot-password-wrapper">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              {serverError && <p className="error-message">{serverError}</p>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="register-prompt">
                Don't have an account? <Link to="/patient-register">Register as Patient</Link>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="auth-right">
          <div className="auth-overlay">
            <h1>HospiSmart</h1>
            <p>Smart Hospital Management System</p>
            <div className="features">
              <span>Book Appointments</span>
              <span>Access Records</span>
              <span>Secure & Fast</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
