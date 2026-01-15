import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaSave,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import "../../styles/DoctorDashboard.css"; 

const API_BASE_URL = "http://localhost:8080/api";

const DoctorProfile = ({ doctorInfo }) => {
  const [profile, setProfile] = useState(null);
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorInfo.id}`);
      if (res.ok) {
        setProfile(await res.json());
      } else {
        // If endpoint doesn't exist, use stored info
        setProfile(doctorInfo);
      }
    } catch (e) {
      setProfile(doctorInfo);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/doctors/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doctorInfo.id,
          oldPassword: passData.oldPassword,
          newPassword: passData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password Changed Successfully");
        setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setMessage("");
      } else {
        setMessage(data.error || "Failed to change password");
      }
    } catch (e) {
      setMessage("Error changing password");
    }
  };

  if (!profile) return <div className="loading-state"><p>Loading profile...</p></div>;

  return (
    <div className="profile-page">
      <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>My Profile</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Personal Info Card */}
        <div className="profile-card" style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#10b981" }}>
            <FaUser /> Personal Details
          </h3>

          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>Full Name</label>
              <input
                type="text"
                value={profile.name || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>Email</label>
              <input
                type="email"
                value={profile.email || doctorInfo.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>
                <FaGraduationCap style={{ marginRight: "5px" }} /> Qualifications
              </label>
              <input
                type="text"
                value={profile.qualifications || "N/A"}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>
                <FaCalendarAlt style={{ marginRight: "5px" }} /> Available Days
              </label>
              <input
                type="text"
                value={profile.availableDays || "N/A"}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>
                <FaClock style={{ marginRight: "5px" }} /> Working Hours
              </label>
              <input
                type="text"
                value={profile.startTime && profile.endTime ? `${profile.startTime} - ${profile.endTime}` : "N/A"}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>Consultation Fee</label>
              <input
                type="text"
                value={profile.consultationFee ? `Rs. ${profile.consultationFee}` : "N/A"}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  color: "#334155"
                }}
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="profile-card" style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#10b981" }}>
            <FaLock /> Change Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "15px", position: "relative" }}>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>Current Password</label>
              <input
                type={showOld ? "text" : "password"}
                value={passData.oldPassword}
                onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              />
              <span
                onClick={() => setShowOld(!showOld)}
                style={{ position: "absolute", right: "12px", top: "35px", cursor: "pointer", color: "#94a3b8" }}
              >
                {showOld ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div style={{ marginBottom: "15px", position: "relative" }}>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>New Password</label>
              <input
                type={showNew ? "text" : "password"}
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              />
              <span
                onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: "12px", top: "35px", cursor: "pointer", color: "#94a3b8" }}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div style={{ marginBottom: "15px", position: "relative" }}>
              <label style={{ fontSize: "0.85rem", color: "#64748b", display: "block", marginBottom: "5px" }}>Confirm Password</label>
              <input
                type={showConfirm ? "text" : "password"}
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: "absolute", right: "12px", top: "35px", cursor: "pointer", color: "#94a3b8" }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {message && <p style={{ color: "#ef4444", marginBottom: "10px", fontSize: "0.9rem" }}>{message}</p>}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FaLock /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
