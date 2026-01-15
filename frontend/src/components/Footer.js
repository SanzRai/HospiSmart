import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-section footer-contact">
        <h4>Contact Us</h4>
        <p>HospiSmart Digital Hospital System</p>
        <p>Phone: +977 9807656820</p>
        <p>Email: info@hospismart.com</p>
        <p>Kathmandu, Nepal</p>
      </div>

       <div className="footer-section footer-about">
        <h4>About</h4>
        <a href="/">Home</a>
        <a href="/about">About Us</a>
        <a href="/departments">Departments</a>
      </div>

      <div className="footer-section footer-services">
        <h4>Services</h4>
        <a href="/services">Services</a>
        <a href="/appointments">Book Appointment</a>
      </div>

      <div className="footer-section footer-socials">
        <h4>Follow Us</h4>
        <div className="social-icons">
          <a href="https://www.facebook.com/"><FaFacebookF /></a>
          <a href="https://x.com/"><FaTwitter /></a>
          <a href="https://www.instagram.com/"><FaInstagram /></a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 HospiSmart. All rights reserved.</p>
      </div>

    </footer>
  )
}
export default Footer;