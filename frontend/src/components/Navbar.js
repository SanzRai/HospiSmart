import React from "react";
import { Link, useLocation } from "react-router-dom"; // ← added useLocation for active link
import "../styles/Navbar.css";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/logo.png" alt="HospiSmart logo" className="logo" />
        <span className="hospital-name">HospiSmart</span>
      </div>

      <div className="navbar-right">
        <Link 
          to="/" 
          className={location.pathname === "/" ? "active" : ""}
        >
          Home
        </Link>
        
        <Link 
          to="/about" 
          className={location.pathname === "/about" ? "active" : ""}
        >
          About Us
        </Link>
        
        <Link 
          to="/appointments" 
          className={location.pathname === "/appointments" ? "active" : ""}
        >
          Appointments
        </Link>
        
        <Link 
          to="/departments" 
          className={location.pathname === "/departments" ? "active" : ""}
        >
          Departments
        </Link>

        <Link to="/login" className="login-btn">
          Login / Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;