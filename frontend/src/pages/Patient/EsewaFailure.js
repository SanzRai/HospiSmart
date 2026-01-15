import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import "../../styles/Payment.css"; 

const EsewaFailure = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main className="payment-container"> 
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="back-home-btn"
          onClick={() => navigate("/payment")}
        >
          <FaArrowLeft /> Try Again
        </motion.button>

        <div className="payment-card"> 
          <div className="failure-hero" style={{ textAlign: "center", padding: "40px 20px" }}>
            <FaExclamationTriangle 
              style={{ 
                fontSize: "6rem", 
                color: "#E74C3C", 
                marginBottom: "20px" 
              }} 
            />
            <h1 style={{ color: "#E74C3C", marginBottom: "16px" }}>
              Payment Failed
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "32px" }}>
              Your eSewa payment could not be processed. Please try again or choose another payment method.
            </p>

            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/payment")}
                style={{
                  padding: "14px 32px",
                  background: "#FF7043",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#ff5722";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#FF7043";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "14px 32px",
                  background: "#1976D2",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default EsewaFailure;