import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaSave,
  FaPhone,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";
import "../../styles/StaffProfile.css"

const API_BASE_URL = "http://localhost:8080/api";

const StaffProfile = () => {
  const navigate = useNavigate();

  const [staffInfo, setStaffInfo] = useState(null);
  const [profileData, setProfileData] = useState({
    phone: "",
    address: "",
  });
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("staffInfo");
    if (stored) {
      const parsed = JSON.parse(stored);
      setStaffInfo(parsed);
      setProfileData({
        phone: parsed.phone || "",
        address: parsed.address || "",
      });
    }
  }, []);

  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    return response.json();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    const payload = {
      phone: profileData.phone,
      address: profileData.address,
    };

    try {
      await apiFetch(`${API_BASE_URL}/staff/${staffInfo.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedInfo = { ...staffInfo, ...payload };
      localStorage.setItem("staffInfo", JSON.stringify(updatedInfo));
      setStaffInfo(updatedInfo);

      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      await apiFetch(`${API_BASE_URL}/staff/change-password`, {
        method: "POST",
        body: JSON.stringify({
          id: staffInfo.id,
          oldPassword: passData.oldPassword,
          newPassword: passData.newPassword,
        }),
      });
      alert("Password Changed Successfully");
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("");
    } catch (err) {
      setMessage(err.message || "Error changing password");
    }
  };

  const goBackToDashboard = () => {
    navigate("/staff/dashboard");
  };

  if (!staffInfo) {
    return (
      <div className="loading-state">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="staff-profile-page">
      <button className="staff-back-to-dashboard-btn" onClick={goBackToDashboard}>
        <FaArrowLeft /> Back to Dashboard
      </button>

      <h2 className="staff-profile-title">My Profile</h2>

      <div className="staff-profile-grid">
        <div className="staff-profile-card">
          <h3 className="staff-card-header">
            <FaUser /> Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div className="staff-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={staffInfo.name || ""}
                disabled
                className="staff-disabled-input"
              />
            </div>

            <div className="staff-form-group">
              <label>Email</label>
              <input
                type="email"
                value={staffInfo.email || ""}
                disabled
                className="staff-disabled-input"
              />
            </div>

            <div className="staff-form-group">
              <label>Department</label>
              <input
                type="text"
                value={staffInfo.department || ""}
                disabled
                className="staff-disabled-input"
              />
            </div>

            <div className="staff-form-group">
              <label>
                <FaPhone /> Phone
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                placeholder="e.g. +977 98XXXXXXXX"
              />
            </div>

            <div className="staff-form-group">
              <label>
                <FaMapMarkerAlt /> Address
              </label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) =>
                  setProfileData({ ...profileData, address: e.target.value })
                }
                placeholder="e.g. Kathmandu, Nepal"
              />
            </div>

            {profileMessage && (
              <p
                className={
                  profileMessage.includes("success") ? "staff-success-message" : "staff-error-message"
                }
              >
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className={`staff-save-btn ${savingProfile ? "staff-saving" : ""}`}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="staff-profile-card">
          <h3 className="staff-card-header">
            <FaLock /> Change Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="staff-form-group staff-password-group">
              <label>Current Password</label>
              <div className="staff-password-wrapper">
                <input
                  type={showOld ? "text" : "password"}
                  value={passData.oldPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, oldPassword: e.target.value })
                  }
                  required
                />
                <span
                  className="staff-eye-icon"
                  onClick={() => setShowOld(!showOld)}
                >
                  {showOld ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="staff-form-group staff-password-group">
              <label>New Password</label>
              <div className="staff-password-wrapper">
                <input
                  type={showNew ? "text" : "password"}
                  value={passData.newPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, newPassword: e.target.value })
                  }
                  required
                />
                <span
                  className="staff-eye-icon"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="staff-form-group staff-password-group">
              <label>Confirm Password</label>
              <div className="staff-password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passData.confirmPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, confirmPassword: e.target.value })
                  }
                  required
                />
                <span
                  className="staff-eye-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {message && <p className="staff-error-message">{message}</p>}

            <button type="submit" className="staff-change-password-btn">
              <FaLock /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;