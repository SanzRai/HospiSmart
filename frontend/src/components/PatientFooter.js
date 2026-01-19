import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaAmbulance, FaHelicopter } from 'react-icons/fa';
import "../styles/PatientFooter.css";

const PatientFooter = () => {
  return (
    <footer className="patient-footer">
      <div className="patient-footer-content">
        <div className="patient-footer-grid">
          {/* Quick Links */}
          <div className="patient-footer-section">
            <h4>Quick Links</h4>
            <Link to="/patient/dashboard">Dashboard</Link>
            <Link to="/patient/appointments">Appointments</Link>
            <Link to="/patient/records">Medical Records</Link>
            <Link to="/patient/billing">Billing & Payments</Link>
          </div>

          {/* Support */}
          <div className="patient-footer-section">
            <h4>Support</h4>
            <Link to="/patient/help">Help Center</Link>
            <Link to="/patient/faq">FAQs</Link>
            <Link to="/patient/feedback">Give Feedback</Link>
            <p><FaEnvelope style={{ marginRight: 8 }} />support@hospismart.com</p>
          </div>

          {/* Contact */}
          <div className="patient-footer-section">
            <h4>Contact Hospital</h4>
            <p><FaPhone style={{ marginRight: 8 }} />+977-1-4XXXXXX</p>
            <p><FaMapMarkerAlt style={{ marginRight: 8 }} />Kathmandu, Nepal</p>
            <p>Mon - Sat: 8:00 AM - 8:00 PM</p>
          </div>

          {/* Emergency */}
          <div className="patient-footer-section">
            <div className="patient-footer-emergency">
              <h4><FaAmbulance style={{ marginRight: 8 }} />Emergency</h4>
              <a href="tel:1134">Ambulance: 102</a>
              <p style={{ marginTop: 8, fontSize: 12 }}>
                <FaHelicopter style={{ marginRight: 4 }} />
                Heli Rescue: +977-9858777111
              </p>
            </div>
          </div>
        </div>

        <div className="patient-footer-bottom">
          <p>© {new Date().getFullYear()} HospiSmart - Smart Hospital Management System</p>
          <p style={{ marginTop: 4 }}>
            <Link to="/privacy" style={{ color: 'inherit', marginRight: 16 }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'inherit' }}>Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PatientFooter;
