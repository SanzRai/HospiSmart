import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaSave,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8080/api";

const StaffProfile = ({ staffInfo }) => {
  const [profile, setProfile] = useState(null);
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  // Password visibility states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${staffInfo.id}`);
      if (res.ok) setProfile(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${staffInfo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profile.phone,
          address: profile.address,
        }),
      });
      if (res.ok) alert("Profile Updated!");
    } catch (e) {
      alert("Update Failed");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/staff/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staffInfo.id,
          oldPassword: passData.oldPassword,
          newPassword: passData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password Changed Successfully");
        setPassData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setMessage("");
      } else {
        setMessage(data.error);
      }
    } catch (e) {
      setMessage("Error changing password");
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="staff-profile-page" style={{ padding: "20px" }}>
      <h2>My Profile</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Personal Info */}
        <div
          className="card"
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>
            <FaUser /> Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: "10px" }}>
              <label>Name</label>
              <input
                type="text"
                value={profile.name}
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#f0f0f0",
                }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#f0f0f0",
                }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>Department</label>
              <input
                type="text"
                value={profile.department}
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#f0f0f0",
                }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                <FaPhone /> Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                <FaMapMarkerAlt /> Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              <FaSave /> Update Info
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div
          className="card"
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>
            <FaLock /> Change Password
          </h3>

          <form onSubmit={handleChangePassword}>
            {/* Current Password */}
            <div style={{ marginBottom: "10px", position: "relative" }}>
              <label>Current Password</label>
              <input
                type={showOld ? "text" : "password"}
                value={passData.oldPassword}
                onChange={(e) =>
                  setPassData({ ...passData, oldPassword: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  paddingRight: "35px",
                }}
              />
              <span
                onClick={() => setShowOld(!showOld)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "35px",
                  cursor: "pointer",
                }}
              >
                {showOld ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "10px", position: "relative" }}>
              <label>New Password</label>
              <input
                type={showNew ? "text" : "password"}
                value={passData.newPassword}
                onChange={(e) =>
                  setPassData({ ...passData, newPassword: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  paddingRight: "35px",
                }}
              />
              <span
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "35px",
                  cursor: "pointer",
                }}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "10px", position: "relative" }}>
              <label>Confirm Password</label>
              <input
                type={showConfirm ? "text" : "password"}
                value={passData.confirmPassword}
                onChange={(e) =>
                  setPassData({
                    ...passData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  paddingRight: "35px",
                }}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "35px",
                  cursor: "pointer",
                }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {message && <p style={{ color: "red" }}>{message}</p>}

            <button
              type="submit"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
