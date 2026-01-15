import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/App.css";
import "../styles/AboutUs.css";

const AboutUs = () => {
  return (
    <>
    <Navbar />
    <main className="aboutus-container">
      <section className="about-hero">
        <div className="about-text">
          <h1>About HospiSmart</h1>
          <p>
            HospiSmart is Nepal's leading digital hospital management system. 
            Our mission is to provide seamless healthcare experiences for patients, doctors, and staff through advanced technology and innovative solutions.
          </p>
        </div>
        <div className="about-image">
          <img src="/about.jpg" alt="About HospiSmart" />
        </div>
      </section>

      <section className="about-mission">
        <h2>Our Mission</h2>
        <p>
          To provide accessible, reliable, and world-class healthcare services using advanced digital solutions, ensuring every patient receives the care they deserve.
        </p>
      </section>

      <section className="about-vision">
        <h2>Our Vision</h2>
        <p>
          To become the most trusted hospital management platform in Nepal, enabling efficient workflows, improved patient outcomes, and enhanced healthcare delivery.
        </p>
      </section>

      <section className="about-values">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Integrity</h3>
              <p>We uphold the highest ethical standards in healthcare and technology.</p>
            </div>
            <div className="value-card">
              <h3>Innovation</h3>
              <p>We continuously implement cutting-edge solutions for better patient care.</p>
            </div>
            <div className="value-card">
              <h3>Compassion</h3>
              <p>Patient well-being is at the heart of everything we do.</p>
            </div>
            <div className="value-card">
              <h3>Excellence</h3>
              <p>We strive for excellence in every service, process, and interaction.</p>
            </div>
          </div>
        </section>

    </main>
    <Footer />
    </>
  )
}

export default AboutUs;