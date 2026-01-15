// import React, {useState} from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FaLock, FaUser, faUser } from "react-icons/fa";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";

// const PatientLogin = () => {
//   const [formData, setFormData] = useState ({
//     identifier:"",
//     password:"",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if(!formData.identifier || !formData.password) {
//       setError("Please fill in all fields");
//       return;
//     }
//     setLoading(true);

//     try{
//       const response = await fetch("http://localhost:8080/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: formData.identifier,
//           password: formData.password,
//         })
//       })

//       const data = await response.json();

//       if (response.ok) {
//         localStorage.setItem("authToken", data.token);
//         localStorage.setItem("userId", data.userId);
//         localStorage.setItem("userType", "patient");

//         localStorage.setItem("patientInfo", JSON.stringify(data.patient));
        
//         navigate("/patient-dashboard");
//       } else {
//         setError(data.message || "Invalid Credentials. Please try again.");
//       }
//     } catch (err) {
//       setError("Network error. Please check your connection.");
//       console.error("Login error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

// return (
//   <main className="auth-container">
//     <div className="auth-page">
//       <div className="auth-left">
//         <motion.div
//           className="auth-form-container"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <h2>Patient Login</h2>
//           <p>Welcome back! Please login to your account.</p>
//           <form onSubmit={handleSubmit}>
//             <label>
//               <FaUser /> Phone or Email
//             </label>
//             <input
//               type="text"
//               name="identifier"
//               placeholder="98XXXXXXXX or email@example.com"
//               value={formData.identifier}
//               onChange={handleChange}
//             />

//             <label>
//               <FaLock /> Password
//             </label>
//             <input
//               type="password"
//               name="password"
//               placeholder="Enter your password"
//               value={formData.password}
//               onChange={handleChange}
//             />

//             {error && <p className="error-text">{error}</p>}

//             <button type="submit" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </button>

//             <div className="auth-links">
//               <a href="/forgot-password">Forgot Password?</a>
//               <p>
//                 Don’t have an account?{" "}
//                 <a href="/patient-register">Register here</a>
//               </p>
//             </div>
//           </form>
//         </motion.div>
//       </div>

//       <div className="auth-right">
//         <img src="/auth.jpg" alt="Hospital Login" />
//       </div>
//     </div>
//     </main>
//   );
  
// };
// export default PatientLogin;