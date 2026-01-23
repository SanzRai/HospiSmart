// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FaUserNurse, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
// // import "../styles/Auth.css"; 

// const API_BASE_URL = "http://localhost:8080/api";

// const StaffLogin = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE_URL}/staff/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("staffInfo", JSON.stringify(data.staff));
//         navigate("/staff/dashboard");
//       } else {
//         setError(data.error || "Login failed");
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
//         className="back-home-btn"
//         style={{
//             position: "absolute",
//             top: "20px",
//             left: "20px",
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//             background: "white",
//             color: "#0ea5e9",
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
//               <FaUserNurse size={48} color="#0ea5e9" />
//             </div>
            
//             <h2>Staff Portal</h2>
            
//             {/* Moved "Authorized personnel only" here as a badge */}
//             <div style={{
//                 display: "inline-block",
//                 background: "#e0f2fe",
//                 color: "#0284c7",
//                 padding: "4px 12px",
//                 borderRadius: "20px",
//                 fontSize: "0.8rem",
//                 fontWeight: "600",
//                 marginBottom: "10px"
//             }}>
//                 Authorized Personnel Only
//             </div>

//             <p style={{marginTop: "5px"}}>Login to access your workstation</p>

//             <form onSubmit={handleLogin} style={{marginTop: "20px"}}>
//               <div className="input-group">
//                 <label>
//                     <FaEnvelope /> Email Address
//                 </label>
//                 <input
//                     type="email"
//                     placeholder="staff@hospismart.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//               </div>

//               <div className="input-group" style={{position: "relative"}}>
//                 <label>
//                     <FaLock /> Password
//                 </label>
//                 <input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
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

//         <div className="auth-right staff-auth-bg">
//           <div className="auth-overlay">
//             <h1>HospiSmart</h1>
//             <p>Staff Management System</p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default StaffLogin;