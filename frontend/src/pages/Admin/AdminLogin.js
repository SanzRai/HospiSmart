// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FaLock, FaUser, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
// import "../../styles/Auth.css"; 

// const API_BASE_URL = "http://localhost:8080/api";

// const AdminLogin = () => {
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showPassword, setShowPassword] = useState(false); 
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!formData.username || !formData.password) {
//       setError("Please fill in all fields");
//       return;
//     }
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_BASE_URL}/admin/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           username: formData.username,
//           password: formData.password,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         localStorage.setItem("adminToken", data.token);
//         localStorage.setItem("adminId", data.adminId);
//         localStorage.setItem("userType", "admin");
//         navigate("/admin-dashboard");
//       } else {
//         setError(data.message || "Invalid credentials. Please try again.");
//       }
//     } catch (err) {
//       setError("Network error. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="auth-container relative">
//       <motion.button
//         initial={{ opacity: 0, x: -20 }}
//         animate={{ opacity: 1, x: 0 }}
//         transition={{ duration: 0.5 }}
//         onClick={() => navigate("/")}
//         style={{
//             position: "absolute",
//             top: "20px",
//             left: "20px",
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//             background: "white",
//             color: "#2563eb", // Admin Blue
//             padding: "10px 15px",
//             borderRadius: "8px",
//             boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
//             border: "none",
//             cursor: "pointer",
//             fontWeight: "500",
//             zIndex: 10
//         }}
//       >
//         <FaArrowLeft />
//         <span>Back to Home</span>
//       </motion.button>

//       <div className="auth-page">
//         <div className="auth-left">
//           <motion.div
//             className="auth-form-container"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <div className="auth-logo">
//               <FaUser size={48} color="#2563eb" />
//             </div>
            
//             <h2>Admin Login</h2>
            
//             <div style={{
//                 display: "inline-block",
//                 background: "#dbeafe",
//                 color: "#1e40af",
//                 padding: "4px 12px",
//                 borderRadius: "20px",
//                 fontSize: "0.8rem",
//                 fontWeight: "600",
//                 marginBottom: "10px"
//             }}>
//                 Secure Access
//             </div>

//             <p style={{marginTop: "5px"}}>Access hospital management system</p>
            
//             <form onSubmit={handleSubmit} style={{marginTop: "20px"}}>
//               <div className="input-group">
//                 <label>
//                   <FaUser /> Username
//                 </label>
//                 <input
//                   type="text"
//                   name="username"
//                   placeholder="Enter your username"
//                   value={formData.username}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="input-group" style={{position: "relative"}}>
//                 <label>
//                   <FaLock /> Password
//                 </label>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="Enter your password"
//                   value={formData.password}
//                   onChange={handleChange}
//                 />
//                 <span 
//                     onClick={() => setShowPassword(!showPassword)}
//                     style={{
//                         position: "absolute",
//                         right: "15px",
//                         top: "38px",
//                         cursor: "pointer",
//                         color: "#888"
//                     }}
//                 >
//                     {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               {error && <p className="error-text">{error}</p>}

//               <button type="submit" disabled={loading}>
//                 {loading ? "Logging in..." : "Login"}
//               </button>
//             </form>
//           </motion.div>
//         </div>

//         <div className="auth-right">
//           <div className="auth-overlay">
//             <h1>HospiSmart Admin</h1>
//             <p>Manage your hospital operations efficiently</p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default AdminLogin;