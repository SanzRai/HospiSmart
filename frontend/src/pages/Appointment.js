import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaSearch, FaUserCheck, FaMapMarkerAlt, FaUserMd, FaExclamationCircle, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import "../styles/Appointment.css";

const API_BASE_URL = "http://localhost:8080/api";

const Appointment = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("opd");
  const [searchPhone, setSearchPhone] = useState("");
  const [patientFound, setPatientFound] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [patientData, setPatientData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    district: "",
    municipality: "",
    wardNo: "",
  });
  const [symptoms, setSymptoms] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState({
    departmentId: "",
    doctorId: "",
    date: "",
    time: "",
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [doctorFee, setDoctorFee] = useState(0);
  const opdFee = 500;

  useEffect(() => {
    fetch(`${API_BASE_URL}/departments`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load departments");
        return res.json();
      })
      .then((data) => {
        setDepartments(data);
        console.log("Departments loaded:", data); // Debug: Check if departments are fetched
      })
      .catch((err) => {
        console.error(err);
        setSearchMessage("Failed to load departments. Please refresh.");
        setSearchStatus("error");
      });
  }, []);

  const searchPatient = async () => {
    if (searchPhone.length < 10) {
      setSearchMessage("Please enter a valid 10-digit phone number");
      setSearchStatus("error");
      return;
    }

    setSearchMessage("Searching...");
    setSearchStatus("");

    try {
      const res = await fetch(`${API_BASE_URL}/patients/search?phone=${searchPhone}`);
      if (res.ok) {
        const patient = await res.json();
        setPatientFound(patient);
        setPatientData({
          id: patient.id,
          name: patient.fullName || "",
          email: patient.email || "",
          phone: patient.phoneNumber || "",
          dob: patient.dateOfBirth || "",
          gender: patient.gender || "",
          district: patient.address?.district || "",
          municipality: patient.address?.municipality || "",
          wardNo: patient.address?.ward || "",
        });
        setReadOnly(true);
        setSearchMessage(`Welcome back, ${patient.fullName || "Patient"}!`);
        setSearchStatus("success");
      } else {
        setPatientData((prev) => ({ ...prev, phone: searchPhone }));
        setReadOnly(false);
        setPatientFound(null);
        setSearchMessage("New patient? Please fill your details below.");
        setSearchStatus("info");
      }
    } catch (err) {
      setPatientData((prev) => ({ ...prev, phone: searchPhone }));
      setReadOnly(false);
      setSearchMessage("Cannot connect to server. Continuing as new patient.");
      setSearchStatus("error");
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setAppointmentDetails({
      departmentId: deptId,
      doctorId: "",
      date: "",
      time: "",
    });
    setDoctors([]);
    setTimeSlots([]);
    setDoctorFee(0);

    if (deptId) {
      fetch(`${API_BASE_URL}/departments/${deptId}/doctors`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load doctors");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setDoctors(data);
            console.log("Doctors loaded for dept:", deptId, data); // Debug
          } else {
            setDoctors([]);
          }
        })
        .catch(() => setDoctors([]));
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = doctors.find((d) => d.id === Number(doctorId));
    setAppointmentDetails((prev) => ({ ...prev, doctorId }));
    setDoctorFee(doctor?.consultationFee || 0);
    if (appointmentDetails.date) {
      fetchTimeSlots(doctorId, appointmentDetails.date);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setAppointmentDetails((prev) => ({ ...prev, date, time: "" }));
    if (appointmentDetails.doctorId) {
      fetchTimeSlots(appointmentDetails.doctorId, date);
    }
  };

  const fetchTimeSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setTimeSlots([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/timeslots?date=${date}`);
      if (res.ok) {
        const slots = await res.json();
        setTimeSlots(Array.isArray(slots) ? slots.filter((s) => s.length === 5) : []);
      }
    } catch (err) {
      setTimeSlots([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!patientData.name.trim()) newErrors.name = "Full Name is Required";
    if (!patientData.phone) newErrors.phone = "Phone Number is Required";
    if (!patientData.dob) newErrors.dob = "Date of Birth is Required";
    if (!patientData.gender) newErrors.gender = "Gender is Required";
    if (!patientData.district.trim()) newErrors.district = "District is Required";
    if (!symptoms.trim()) newErrors.symptoms = "Symptoms is Required";

    if (activeTab === "appointment") {
      if (!appointmentDetails.departmentId) newErrors.dept = "Please select department";
      if (!appointmentDetails.doctorId) newErrors.doc = "Please select doctor";
      if (!appointmentDetails.date) newErrors.date = "Please select suitable date";
      if (!appointmentDetails.time) newErrors.time = "Please select suitable time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const age = new Date().getFullYear() - new Date(patientData.dob).getFullYear();

    const payload = {
      patientId: patientFound?.id || null,
      patientName: patientData.name.trim(),
      patientPhone: patientData.phone,
      patientEmail: patientData.email || null,
      patientGender: patientData.gender,
      patientAge: age,
      patientDob: patientData.dob,
      address: {
        district: patientData.district,
        municipality: patientData.municipality,
        wardNo: patientData.wardNo,
      },
      symptoms: symptoms.trim(),
      bookingType: activeTab === "opd" ? "OPD" : "APPOINTMENT",
      consultingFee: activeTab === "opd" ? opdFee : doctorFee,
      department:
        activeTab === "appointment" && departments.length > 0
          ? departments.find((d) => d.id === Number(appointmentDetails.departmentId))?.name || "Department Not Found"
          : "General OPD",
      doctorName:
        activeTab === "appointment" && doctors.length > 0
          ? doctors.find((d) => d.id === Number(appointmentDetails.doctorId))?.name || "Doctor Not Found"
          : null,
      doctorId: activeTab === "appointment" ? appointmentDetails.doctorId : null,
      appointmentDate: activeTab === "appointment" ? appointmentDetails.date : new Date().toISOString().split("T")[0],
      appointmentTime: activeTab === "appointment" ? appointmentDetails.time : null,
      tokenNumber: activeTab === "opd" ? `OPD-${Date.now().toString().slice(-6)}` : `APT-${Date.now().toString().slice(-6)}`,
      paymentStatus: "PENDING",
      status: "PENDING",
    };

    // DEBUG LOG - This will show you exactly what is being sent
    console.log("DEBUG - Payload being sent to Payment page:", {
      selectedDeptId: appointmentDetails.departmentId,
      selectedDocId: appointmentDetails.doctorId,
      foundDepartment: departments.find((d) => d.id === Number(appointmentDetails.departmentId))?.name,
      foundDoctor: doctors.find((d) => d.id === Number(appointmentDetails.doctorId))?.name,
      payloadDepartment: payload.department,
      payloadDoctorName: payload.doctorName,
      fullPayload: payload,
    });

    navigate("/payment", { state: { paymentDetails: payload } });
  };

  const tomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  return (
    <>
      <Navbar />

      <main className="appointment-page">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="back-home-btn"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft /> Back to Home
        </motion.button>

        <div className="appointment-card">
          <h1 className="page-title">Book OPD or Appointment</h1>

          <div className="search-section">
            <h3 className="section-title">Returning Patient? Search by Mobile</h3>
            <div className="search-input-group">
              <input
                type="tel"
                placeholder="98XXXXXXXX"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="search-input"
              />
              <button onClick={searchPatient} className="search-btn">
                <FaSearch /> Search
              </button>
            </div>

            {searchMessage && (
              <div className={`search-status ${searchStatus}`}>
                {searchStatus === "success" && <FaCheckCircle />}
                {searchStatus === "error" && <FaExclamationCircle />}
                {searchMessage}
              </div>
            )}
          </div>

          <div className="tab-buttons">
            <button
              className={`tab ${activeTab === "opd" ? "active" : ""}`}
              onClick={() => setActiveTab("opd")}
            >
              OPD Ticket
            </button>
            <button
              className={`tab ${activeTab === "appointment" ? "active" : ""}`}
              onClick={() => setActiveTab("appointment")}
            >
              Book Appointment
            </button>
          </div>

          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-section">
              <h2 className="section-title">Patient Information</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    disabled={readOnly}
                  />
                  {errors.phone && <span className="error">{errors.phone}</span>}
                </div>

                <div className="input-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    disabled={readOnly}
                  />
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>

                <div className="input-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={patientData.dob}
                    onChange={(e) => setPatientData({ ...patientData, dob: e.target.value })}
                    disabled={readOnly}
                  />
                  {errors.dob && <span className="error">{errors.dob}</span>}
                </div>

                <div className="input-group">
                  <label>Gender *</label>
                  <select
                    value={patientData.gender}
                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {errors.gender && <span className="error">{errors.gender}</span>}
                </div>

                <div className="input-group">
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    value={patientData.email}
                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title"><FaMapMarkerAlt /> Address</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>District *</label>
                  <input
                    type="text"
                    value={patientData.district}
                    onChange={(e) => setPatientData({ ...patientData, district: e.target.value })}
                    disabled={readOnly}
                  />
                  {errors.district && <span className="error">{errors.district}</span>}
                </div>

                <div className="input-group">
                  <label>Municipality</label>
                  <input
                    type="text"
                    value={patientData.municipality}
                    onChange={(e) => setPatientData({ ...patientData, municipality: e.target.value })}
                    disabled={readOnly}
                  />
                </div>

                <div className="input-group">
                  <label>Ward No</label>
                  <input
                    type="number"
                    value={patientData.wardNo}
                    onChange={(e) => setPatientData({ ...patientData, wardNo: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>

            {activeTab === "appointment" && (
              <div className="form-section">
                <h2 className="section-title"><FaUserMd /> Doctor Selection</h2>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Department *</label>
                    <select value={appointmentDetails.departmentId} onChange={handleDepartmentChange}>
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errors.dept && <span className="error">{errors.dept}</span>}
                  </div>

                  <div className="input-group">
                    <label>Doctor *</label>
                    <select
                      value={appointmentDetails.doctorId}
                      onChange={handleDoctorChange}
                      disabled={!appointmentDetails.departmentId}
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} (Rs {doc.consultationFee})
                        </option>
                      ))}
                    </select>
                    {errors.doc && <span className="error">{errors.doc}</span>}
                  </div>

                  <div className="input-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={appointmentDetails.date}
                      onChange={handleDateChange}
                      min={tomorrowDate()}
                    />
                    {errors.date && <span className="error">{errors.date}</span>}
                  </div>

                  <div className="input-group">
                    <label>Time *</label>
                    <select
                      value={appointmentDetails.time}
                      onChange={(e) => setAppointmentDetails((prev) => ({ ...prev, time: e.target.value }))}
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((slot, i) => (
                        <option key={i} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.time && <span className="error">{errors.time}</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="form-section">
              <h2 className="section-title">Symptoms / Reason for Visit *</h2>
              <div className="input-group full-width">
                <textarea
                  rows="4"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your health issue..."
                />
                {errors.symptoms && <span className="error">{errors.symptoms}</span>}
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Proceed to Payment
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Appointment;