import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import "../../styles/Payment.css"; 

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying payment...");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    const encoded = searchParams.get("data");
    if (!encoded) {
      setMessage("Missing payment response.");
      return;
    }

    verifyEsewaPayment(encoded);
  }, []);

  const verifyEsewaPayment = async (data) => {
    try {
      const decodedJson = JSON.parse(atob(data));

      const res = await fetch("http://localhost:8080/api/esewa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decodedJson),
      });

      const result = await res.json();

      if (result.success) {
        setMessage("Payment Verified Successfully!");
        setBookingMessage(
          `Payment successful! Your ${result.bookingType === "OPD" ? "OPD Ticket" : "Appointment"} is confirmed.`
        );
        setTimeout(() => navigate("/"), 5000);
      } else {
        setMessage("Verification Failed: " + (result.message || "Unknown error"));
      }
    } catch (e) {
      setMessage("Error verifying payment.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="payment-container">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="back-home-btn"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft /> Back to Home
        </motion.button>

        <div className="payment-card success-card">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", padding: "40px 20px" }}
          >
            <FaCheckCircle
              style={{
                fontSize: "6rem",
                color: "#22c55e",
                marginBottom: "24px",
              }}
            />
            <h1 style={{ color: "#22c55e", marginBottom: "16px" }}>
              Payment Success!
            </h1>
            <p style={{ fontSize: "1.3rem", color: "#333", marginBottom: "24px" }}>
              {message}
            </p>

            {bookingMessage && (
              <div
                style={{
                  fontSize: "1.2rem",
                  color: "#155724",
                  background: "#d4edda",
                  padding: "16px",
                  borderRadius: "12px",
                  marginBottom: "32px",
                  maxWidth: "600px",
                  margin: "0 auto 32px",
                }}
              >
                {bookingMessage}
              </div>
            )}

            <p style={{ color: "#666", marginBottom: "32px" }}>
              Redirecting to homepage in a few seconds...
            </p>

            <button
              onClick={() => navigate("/")}
              className="submit-btn"
              style={{ maxWidth: "300px" }}
            >
              Go to Homepage Now
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PaymentSuccess;