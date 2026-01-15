// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FaUserMd, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";

// const API_BASE_URL = "http://localhost:8080/api";

// const DoctorLogin = () => {
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
//       const res = await fetch(`${API_BASE_URL}/doctors/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         localStorage.setItem("doctorToken", data.token);
//         localStorage.setItem("doctorInfo", JSON.stringify(data.doctor));
//         navigate("/doctor/dashboard");
//       } else {
//         setError(data.message || "Login failed");
//       }
//     } catch (err) {
//       setError("Network error. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <button
//         onClick={() => navigate("/")}
//         className="back-home-btn"
//         style={{
//           position: "absolute",
//           top: "20px",
//           left: "20px",
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           background: "white",
//           color: "#10b981",
//           padding: "10px 15px",
//           borderRadius: "8px",
//           boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
//           border: "none",
//           cursor: "pointer",
//           fontWeight: "500",
//           zIndex: 10
//         }}
//       >
//         <FaArrowLeft />
//         Back to Home
//       </button>

//       <div className="auth-page">
//         <motion.div
//           className="auth-left"
//           initial={{ opacity: 0, x: -30 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="auth-form-container">
//             <div className="auth-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
//               <FaUserMd size={32} />
//             </div>

//             <h2>Doctor Portal</h2>

//             <div
//               style={{
//                 display: "inline-block",
//                 background: "#dcfce7",
//                 color: "#166534",
//                 padding: "5px 12px",
//                 borderRadius: "20px",
//                 fontSize: "0.8rem",
//                 fontWeight: "600",
//                 marginBottom: "10px"
//               }}
//             >
//               Medical Staff Only
//             </div>

//             <p>Login to access your consultation dashboard</p>

//             <form onSubmit={handleLogin}>
//               <div className="input-group">
//                 <label>
//                   <FaEnvelope /> Email Address
//                 </label>
//                 <input
//                   type="email"
//                   placeholder="doctor@hospismart.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="input-group" style={{ position: "relative" }}>
//                 <label>
//                   <FaLock /> Password
//                 </label>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                 />
//                 <span
//                   onClick={() => setShowPassword(!showPassword)}
//                   style={{
//                     position: "absolute",
//                     right: "15px",
//                     top: "38px",
//                     cursor: "pointer",
//                     color: "#888"
//                   }}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               {error && <p className="error-text">{error}</p>}

//               <button 
//                 type="submit" 
//                 disabled={loading}
//                 style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
//               >
//                 {loading ? "Logging in..." : "Login"}
//               </button>
//             </form>
//           </div>
//         </motion.div>

//         <motion.div
//           className="auth-right"
//           initial={{ opacity: 0, x: 30 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//           style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
//         >
//           <div className="auth-brand">
//             <FaUserMd size={60} />
//             <h1>HospiSmart</h1>
//             <p>Doctor Management System</p>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default DoctorLogin;
