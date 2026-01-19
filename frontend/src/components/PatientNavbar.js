import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaBell, FaSignOutAlt, FaUser, FaBars, FaTimes, FaUsers, FaGlobe,
  FaCheckCircle, FaExclamationCircle, FaInfoCircle 
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import "../styles/PatientNavbar.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientNavbar = ({ patientInfo = null, notifications = [], onNotificationsUpdate }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const patientId = localStorage.getItem('patientId');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientInfo");
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'appointment':
      case 'opd_ticket':
      case 'payment':
      case 'lab_report':
        return <FaCheckCircle className="notif-icon success" />;
      case 'warning':
      case 'cancellation':
        return <FaExclamationCircle className="notif-icon warning" />;
      default:
        return <FaInfoCircle className="notif-icon info" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return t("justNow") || "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t("justNow") || "Just now";
    if (diffMins < 60) return `${diffMins}m ${t("ago") || "ago"}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ${t("ago") || "ago"}`;
    return date.toLocaleDateString();
  };

  const handleMarkAllRead = async () => {
    if (!patientId || !token || unreadCount === 0) return;

    setMarkingRead(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/patient/${patientId}/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      const updatedNotifications = notifications.map(notif => ({
        ...notif,
        read: true
      }));

      if (onNotificationsUpdate) {
        onNotificationsUpdate(updatedNotifications);
      }

      setShowNotifications(false);

    } catch (error) {
      console.error("Error marking all as read:", error);
      alert(t("errorMarkingRead") || "Could not mark notifications as read");
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <nav className="patient-navbar">
      <div className="navbar-left">
        <Link to="/patient-dashboard" className="logo-link">
          <img src="/logo.png" alt="HospiSmart Logo" className="logo" />
          <span className="hospital-name">{t("HospiSmart")}</span>
        </Link>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={t("toggleMenu")}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`navbar-right ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <Link to="/patient-dashboard" className={`nav-link ${isActive("/patient/dashboard") ? "active" : ""}`}>
          {t("dashboard")}
        </Link>
        <Link to="/patient/appointments" className={`nav-link ${isActive("/patient/appointments") ? "active" : ""}`}>
          {t("appointments")}
        </Link>
        <Link to="/patient/records" className={`nav-link ${isActive("/patient/records") ? "active" : ""}`}>
          {t("records")}
        </Link>
        <Link to="/patient/queue" className={`nav-link ${isActive("/patient/queue") ? "active" : ""}`}>
          {t("liveQueue")}
        </Link>

        <button
          className="lang-toggle-btn"
          onClick={toggleLanguage}
          title={language === "en" ? "नेपालीमा स्विच गर्नुहोस्" : "Switch to English"}
          aria-label={t("changeLanguage")}
        >
          <FaGlobe style={{ marginRight: "6px" }} />
          {language === "en" ? "नेपाली" : "English"}
        </button>

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
                  <button 
                    className="mark-read-btn" 
                    onClick={handleMarkAllRead}
                    disabled={markingRead}
                  >
                    {markingRead ? t("marking") || "Marking..." : t("Mark All Read")}
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <FaBell className="empty-icon" />
                    <p>{t("No Notifications")}</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (  
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.read ? "unread" : ""}`}
                    >
                      <div className="notif-icon-wrapper">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">
                          {notif.title || t("notification")}
                        </div>
                        <p className="notif-message">{notif.message}</p>
                        <small className="notif-time">
                          {formatTime(notif.createdAt || notif.time)}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <Link
                  to="/patient/dashboard?tab=notifications"
                  className="view-all-link"
                  onClick={() => setShowNotifications(false)}
                >
                  {t("View All Notifications")} ({notifications.length})
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="user-menu">
          <div 
            className="user-info" 
            onClick={() => navigate('/patient/profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              <FaUser />
            </div>
            <span className="user-name">
              {patientInfo?.name?.trim() 
                ? patientInfo.name.trim() 
                : "Loading..."}
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