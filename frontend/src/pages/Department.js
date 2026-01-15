import React, {useState} from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { FaHeart, FaBrain, FaBone, FaChild, FaFemale, FaUserMd, FaHeadSideMask, FaHeartbeat, FaLungs, FaBaby, FaStethoscope, FaXRay } from "react-icons/fa";
import "../styles/App.css";
import "../styles/Department.css";

const departments = [
  {
    name: "Cardiology",
    icon: <FaHeartbeat />,
    description:
      "Our Cardiology Department provides comprehensive care for patients with heart diseases and disorders, offering advanced diagnostic and interventional services.",
    doctors: [
      { name: "Dr. Anil Sharma", title: "Senior Cardiologist" },
      { name: "Dr. Priya Singh", title: "Interventional Cardiologist" },
    ],
    image: "https://images.unsplash.com/photo-1580281657521-4e9b3d7b0d27",
  },
  {
    name: "Neurology",
    icon: <FaBrain />,
    description:
      "The Neurology Department specializes in treating disorders of the brain and nervous system, with state-of-the-art diagnostic and neuro-rehabilitation facilities.",
    doctors: [
      { name: "Dr. Ramesh Adhikari", title: "Consultant Neurologist" },
      { name: "Dr. Sneha Thapa", title: "Neurosurgeon" },
    ],
    image: "https://images.unsplash.com/photo-1581093588401-22c1f3b49c4a",
  },
  {
    name: "Orthopedics",
    icon: <FaBone />,
    description:
      "Our Orthopedic team provides treatment for fractures, joint problems, and sports injuries, offering minimally invasive surgical techniques and rehabilitation care.",
    doctors: [
      { name: "Dr. Bimal Khadka", title: "Orthopedic Surgeon" },
      { name: "Dr. Nisha Rai", title: "Sports Medicine Specialist" },
    ],
    image: "https://images.unsplash.com/photo-1588776814546-79f4cb3c5c4e",
  },
  {
    name: "Radiology",
    icon: <FaXRay />,
    description:
      "The Radiology Department offers precise imaging and diagnostic services using MRI, CT scans, Ultrasound, and digital X-ray technologies.",
    doctors: [
      { name: "Dr. Milan Gurung", title: "Radiologist" },
      { name: "Dr. Alisha Karki", title: "CT/MRI Specialist" },
    ],
    image: "https://images.unsplash.com/photo-1580281658629-6d4d95e3f79d",
  },
  {
    name: "Pulmonology",
    icon: <FaLungs />,
    description:
      "Our Pulmonology Department specializes in treating respiratory diseases including asthma, COPD, and sleep apnea with advanced therapies.",
    doctors: [
      { name: "Dr. Suman Rai", title: "Pulmonologist" },
      { name: "Dr. Ritu Shrestha", title: "Respiratory Therapist" },
    ],
    image: "https://images.unsplash.com/photo-1588776814150-1c7c74b13b0f",
  },
  {
    name: "Gynecology & Obstetrics",
    icon: <FaBaby />,
    description:
      "We provide compassionate care for women at all stages of life, including prenatal, maternity, and reproductive health services.",
    doctors: [
      { name: "Dr. Sunita Manandhar", title: "Obstetrician" },
      { name: "Dr. Kamala Gurung", title: "Gynecologist" },
    ],
    image: "https://images.unsplash.com/photo-1609921141835-2a3f43d96e1b",
  },
  {
    name: "Internal Medicine",
    icon: <FaStethoscope />,
    description:
      "The Department of Internal Medicine focuses on adult health, preventive care, and management of chronic conditions with holistic treatment plans.",
    doctors: [
      { name: "Dr. Kiran Pandey", title: "Internal Medicine Specialist" },
      { name: "Dr. Rachana Shrestha", title: "General Physician" },
    ],
    image: "https://images.unsplash.com/photo-1580281657521-4e9b3d7b0d27",
  },
  {
    name: "Emergency & Trauma",
    icon: <FaUserMd />,
    description:
      "Our Emergency Department operates 24/7, equipped to handle trauma cases and life-threatening conditions with a rapid response team.",
    doctors: [
      { name: "Dr. Rojina Basnet", title: "Emergency Physician" },
      { name: "Dr. Deepak Maharjan", title: "Trauma Specialist" },
    ],
    image: "https://images.unsplash.com/photo-1576765607924-bf49cd7fb1f2",
  },
];

const Department = () => {
  return (
    <>
    <Navbar />
    < main className="departments-container">
    <div className="department-page">
      <motion.div
        className="department-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1>Our Medical Departments</h1>
        <p>
          Explore our specialized departments led by experienced medical
          professionals providing world-class care and treatment.
        </p>
      </motion.div>

      <div className="departments-container">
        {departments.map((dept, index) => (
          <motion.div
            className="department-card"
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.03 }}
          >
            <div
              className="department-image"
              style={{ backgroundImage: `url(${dept.image})` }}
            >
              <div className="overlay">
                <div className="icon">{dept.icon}</div>
                <h2>{dept.name}</h2>
              </div>
            </div>
            <div className="department-info">
              <p>{dept.description}</p>
              <div className="doctor-list">
                {dept.doctors.map((doc, i) => (
                  <div key={i} className="doctor-card">
                    <h4>{doc.name}</h4>
                    <span>{doc.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </main>
    <Footer />
    </>
  );
};


export default Department;