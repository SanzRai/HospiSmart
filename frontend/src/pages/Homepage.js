import React from "react";
import {motion} from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/App.css";

import { FaCalendarCheck, FaMoneyBillWave, FaUserMd, FaHospitalAlt, FaHeartbeat, FaShieldAlt, FaAmbulance, FaMapMarkerAlt, FaPhoneAlt, FaHeart,
  FaProcedures, 
  FaBone, 
  FaAppleAlt, 
  FaTooth, 
  FaHospital, 
  FaStethoscope, 
  FaBrain, 
  FaLungs  } from "react-icons/fa";

const Homepage = () => {
  
  return (
    <>
    <Navbar />
    <main className="home-container">
      <section className="hero-section">
        <motion.div 
            className="hero-text"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
          <h1>Welcome to HospiSmart</h1>
          <p>Your trusted digital hospital management system in Nepal.</p>
          < a href="/appointments" className="btn-primary">Book Appointment</a>
      
        <div className="hero-features">
          <div><FaHospitalAlt /> Modern Facilities</div>
          <div><FaHeartbeat />24/7 Emergency</div>
          <div><FaShieldAlt /> Secure & Reliable</div>
        </div>
         </motion.div>

         <motion.div 
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
          <img src="/hospital.png" alt="Hospital" />
        </motion.div>
      </section>

       <section className="specialities-section">
      <h2>Specialities & Procedures</h2>
      <div className="specialities-grid">
        <div className="speciality-card">
          <FaUserMd className="speciality-icon" />
          <h4>Anesthesia and Pain Management</h4>
        </div>
        <div className="speciality-card">
          <FaUserMd className="speciality-icon" />
          <h4>Medical Oncology</h4>
        </div>
        <div className="speciality-card">
          <FaHeart className="speciality-icon" />
          <h4>Cardiology</h4>
        </div>
        <div className="speciality-card">
          <FaProcedures className="speciality-icon" />
          <h4>Cardio Vascular and Thoracic Surgery</h4>
        </div>
        <div className="speciality-card">
          <FaBone className="speciality-icon" />
          <h4>Chiropractic</h4>
        </div>
        <div className="speciality-card">
          <FaAppleAlt className="speciality-icon" />
          <h4>Dietetics and Nutrition</h4>
        </div>
        <div className="speciality-card">
          <FaProcedures className="speciality-icon" />
          <h4>Colorectal Surgery</h4>
        </div>
        <div className="speciality-card">
          <FaStethoscope className="speciality-icon" />
          <h4>Critical Care Medicine</h4>
        </div>
        <div className="speciality-card">
          <FaHeart className="speciality-icon" />
          <h4>Comprehensive Breast Care Center</h4>
        </div>
        <div className="speciality-card">
          <FaTooth className="speciality-icon" />
          <h4>Dentistry</h4>
        </div>
        <div className="speciality-card">
          <FaAmbulance className="speciality-icon" />
          <h4>Emergency Medicine & Pre-Hospital Care</h4>
        </div>
        <div className="speciality-card">
          <FaBrain className="speciality-icon" />
          <h4>Neurology</h4>
        </div>
        <div className="speciality-card">
          <FaLungs className="speciality-icon" />
          <h4>Respiratory & Pulmonology</h4>
        </div>
      </div>
      </section>

      <section className="services-section">
        <h2>Our Services</h2>
        <motion.div
          className="services-cards"
          animate={{ x: ["0px", "-50px", "0px"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
        
          <div className="card">
            <FaCalendarCheck className="service-icon" />
            <h3>Online Appointment</h3>
            <p>Book appointments online and receive real-time token.</p>
          </div>
          <div className="card">
            <FaMoneyBillWave className="service-icon" />
            <h3>Digital Payments</h3>
            <p>Pay through esewa, bank transfer or other digital wallets.</p>
          </div>
          <div className="card">
            <FaUserMd className="service-icon" />
            <h3>Patient History</h3>
            <p>Access your medical history, reports, and treatment details.</p>
          </div>
        </motion.div>
      </section>

       <section className="utility-bar">
          <div className="utility-item">
            <FaHospitalAlt className="utility-icon" />
            <h5 className="utility-title">Contact Hospital</h5>
            <p className="utility-detail">+977 - 01 - 421 7766</p>
          </div>
          <div className="utility-item">
            <FaAmbulance className="utility-icon red-icon" />
            <h5 className="utility-title">Emergency Call</h5>
            <p className="utility-detail">1134 (only in Nepal)</p>
          </div>
          <div className="utility-item">
            <FaMapMarkerAlt className="utility-icon" />
            <h5 className="utility-title">Map & Direction</h5>
            <p className="utility-detail">Nakhu, Lalitpur, Nepal</p>
          </div>
          <div className="utility-item">
            <FaPhoneAlt className="utility-icon" />
            <h5 className="utility-title">Heli Rescue</h5>
            <p className="utility-detail">+977-9858 777111</p>
          </div>
        </section>

    </main>
    <Footer />
    </>
  )
}

export default Homepage;