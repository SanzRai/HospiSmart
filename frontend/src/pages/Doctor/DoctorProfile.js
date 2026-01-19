import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8080/api";

const DoctorProfile = () => {
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [profileData, setProfileData] = useState({
    qualifications: "",
    availableDays: "",
    startTime: "",
    endTime: "",
    consultationFee: "",
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
    const stored = localStorage.getItem("doctorInfo");
    if (stored) {
      const parsed = JSON.parse(stored);
      setDoctorInfo(parsed);
      setProfileData({
        qualifications: parsed.qualifications || "",
        availableDays: parsed.availableDays || "",
        startTime: parsed.startTime || "",
        endTime: parsed.endTime || "",
        consultationFee: parsed.consultationFee || "",
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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      await apiFetch(`${API_BASE_URL}/doctors/change-password`, {
        method: "POST",
        body: JSON.stringify({
          id: doctorInfo.id,
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    const payload = {
      id: doctorInfo.id,
      qualifications: profileData.qualifications,
      availableDays: profileData.availableDays,
      startTime: profileData.startTime,
      endTime: profileData.endTime,
      consultationFee: Number(profileData.consultationFee) || doctorInfo.consultationFee,
    };

    try {
      await apiFetch(`${API_BASE_URL}/doctors/${doctorInfo.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedInfo = { ...doctorInfo, ...payload };
      localStorage.setItem("doctorInfo", JSON.stringify(updatedInfo));
      setDoctorInfo(updatedInfo);

      alert("Profile Updated Successfully");
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!doctorInfo) {
    return <div className="loading-state"><p>Loading profile...</p></div>;
  }

  return (
    <div className="profile-page">
      <h2 className="profile-title">My Profile</h2>

      <div className="profile-grid">
        <div className="profile-card">
          <h3 className="card-header">
            <FaUser /> Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={doctorInfo.name || ""}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={doctorInfo.email || ""}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label>
                <FaGraduationCap /> Qualifications
              </label>
              <input
                type="text"
                value={profileData.qualifications}
                onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
                placeholder="e.g. MBBS, MD Cardiology"
              />
            </div>

            <div className="form-group">
              <label>
                <FaCalendarAlt /> Available Days
              </label>
              <input
                type="text"
                value={profileData.availableDays}
                onChange={(e) => setProfileData({ ...profileData, availableDays: e.target.value })}
                placeholder="e.g. Mon,Tue,Wed,Thu,Fri"
              />
            </div>

            <div className="form-group">
              <label>
                <FaClock /> Working Hours
              </label>
              <div className="time-range">
                <input
                  type="time"
                  value={profileData.startTime}
                  onChange={(e) => setProfileData({ ...profileData, startTime: e.target.value })}
                />
                <span>to</span>
                <input
                  type="time"
                  value={profileData.endTime}
                  onChange={(e) => setProfileData({ ...profileData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Consultation Fee (Rs.)</label>
              <input
                type="number"
                value={profileData.consultationFee}
                onChange={(e) => setProfileData({ ...profileData, consultationFee: e.target.value })}
              />
            </div>

            {profileMessage && (
              <p className={profileMessage.includes("Success") ? "success-message" : "error-message"}>
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className={`save-btn ${savingProfile ? "saving" : ""}`}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h3 className="card-header">
            <FaLock /> Change Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group password-group">
              <label>Current Password</label>
              <div className="password-wrapper">
                <input
                  type={showOld ? "text" : "password"}
                  value={passData.oldPassword}
                  onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                  required
                />
                <span onClick={() => setShowOld(!showOld)}>
                  {showOld ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group password-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showNew ? "text" : "password"}
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  required
                />
                <span onClick={() => setShowNew(!showNew)}>
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group password-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  required
                />
                <span onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {message && <p className="error-message">{message}</p>}

            <button type="submit" className="change-password-btn">
              <FaLock /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;