import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBell, FaSignOutAlt, FaUser, FaBars, FaTimes, FaHospital, FaGlobe } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext"; // Adjust path if needed
import "../styles/PatientModule.css";

const PatientNavbar = ({ patientInfo = null, notifications = [] }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientInfo");
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="patient-navbar">
      {/* Left: Logo */}
      <div className="navbar-left">
        <Link to="/patient-dashboard" className="logo-link">
          <img src="/logo.png" alt="HospiSmart Logo" className="logo" />
          <span className="hospital-name">{t("HospiSmart")}</span>
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={t("toggleMenu")}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Right: Navigation + Notifications + Language + User */}
      <div className={`navbar-right ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Main Navigation Links */}
        <Link
          to="/patient-dashboard"
          className={`nav-link ${isActive("/patient/dashboard") ? "active" : ""}`}
        >
          {t("dashboard")}
        </Link>
        <Link
          to="/patient/appointments"
          className={`nav-link ${isActive("/patient/appointments") ? "active" : ""}`}
        >
          {t("appointments")}
        </Link>
        <Link
          to="/patient/records"
          className={`nav-link ${isActive("/patient/records") ? "active" : ""}`}
        >
          {t("records")}
        </Link>
        <Link
          to="/patient/queue"
          className={`nav-link ${isActive("/patient/queue") ? "active" : ""}`}
        >
          {t("liveQueue")}
        </Link>

        {/* Language Toggle */}
        <button
          className="lang-toggle-btn"
          onClick={toggleLanguage}
          title={language === "en" ? "नेपालीमा स्विच गर्नुहोस्" : "Switch to English"}
          aria-label={t("changeLanguage")}
        >
          <FaGlobe style={{ marginRight: "6px" }} />
          {language === "en" ? "नेपाली" : "English"}
        </button>

        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={t("notifications")}
          >
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>{t("notifications")}</h4>
                {unreadCount > 0 && (
                  <span className="mark-read">{t("markAllRead")}</span>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="empty">{t("noNotifications")}</p>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.read ? "unread" : ""}`}
                    >
                      <p>{notif.message}</p>
                      <small>{notif.time}</small>
                    </div>
                  ))
                )}
              </div>

              <Link
                to="/patient/dashboard?tab=notifications"
                className="view-all"
                onClick={() => setShowNotifications(false)}
              >
                {t("viewAll")}
              </Link>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="user-menu">
          <div className="user-info">
            <FaUser className="user-icon" />
            <span className="user-name">
              {patientInfo?.name || t("patient")}
            </span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: "6px" }} />
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PatientNavbar;