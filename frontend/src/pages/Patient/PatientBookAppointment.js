import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PatientNavbar from "../../components/PatientNavbar";
import PatientFooter from "../../components/PatientFooter";
import { FaUserMd, FaMapMarkerAlt } from "react-icons/fa";
import "../../styles/Appointment.css";

const API_BASE_URL = "http://localhost:8080/api";

const PatientBookAppointment = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointment"); // Default to specialist for patient
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
    const phone = localStorage.getItem("patientPhone");
    const token = localStorage.getItem("token");

    if (!phone || !token) {
      navigate("/login");
      return;
    }

    const loadPatient = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/search?phone=${phone}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const patient = await res.json();
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
        }
      } catch (err) {
        console.error("Failed to load patient", err);
      }
    };

    loadPatient();

    fetch(`${API_BASE_URL}/departments`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load departments");
        return res.json();
      })
      .then((data) => {
        setDepartments(data);
        console.log("Departments loaded:", data); // Debug: check if departments are fetched
      })
      .catch((err) => {
        console.error("Failed to load departments:", err);
      });
  }, [navigate]);

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setAppointmentDetails({ departmentId: deptId, doctorId: "", date: "", time: "" });
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
    if (appointmentDetails.date) fetchTimeSlots(doctorId, appointmentDetails.date);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setAppointmentDetails((prev) => ({ ...prev, date, time: "" }));
    if (appointmentDetails.doctorId) fetchTimeSlots(appointmentDetails.doctorId, date);
  };

  const fetchTimeSlots = async (doctorId, date) => {
    if (!doctorId || !date) return setTimeSlots([]);
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/timeslots?date=${date}`);
      if (res.ok) {
        const slots = await res.json();
        setTimeSlots(Array.isArray(slots) ? slots.filter((s) => s.length === 5) : []);
      }
    } catch {
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
      if (!appointmentDetails.departmentId) newErrors.dept = "Select department";
      if (!appointmentDetails.doctorId) newErrors.doc = "Select doctor";
      if (!appointmentDetails.date) newErrors.date = "Select date";
      if (!appointmentDetails.time) newErrors.time = "Select time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const age = new Date().getFullYear() - new Date(patientData.dob).getFullYear();

    const payload = {
      patientId: patientData.id,
      patientName: patientData.name.trim(),
      patientPhone: patientData.phone,
      patientEmail: patientData.email || null,
      patientGender: patientData.gender,
      patientAge: age,
      patientDob: patientData.dob,
      address: {
        district: patientData.district,
        municipality: patientData.municipality,
        ward: patientData.wardNo,
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
    };


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
      <PatientNavbar patientName={patientData.name || "Patient"} notificationCount={0} />

      <main className="appointment-page patient-container">
        <h1 className="page-title">Book OPD or Appointment</h1>

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
                <label>Mobile Number</label>
                <input type="tel" value={patientData.phone} readOnly />
              </div>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={patientData.name} readOnly />
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" value={patientData.dob} readOnly />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <input type="text" value={patientData.gender} readOnly />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" value={patientData.email} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title"><FaMapMarkerAlt /> Address</h2>
            <div className="form-grid">
              <div className="input-group">
                <label>District</label>
                <input type="text" value={patientData.district} readOnly />
              </div>
              <div className="input-group">
                <label>Municipality</label>
                <input type="text" value={patientData.municipality} readOnly />
              </div>
              <div className="input-group">
                <label>Ward No</label>
                <input type="number" value={patientData.wardNo} readOnly />
              </div>
            </div>
          </div>

          {activeTab === "appointment" && (
            <div className="form-section">
              <h2 className="section-title"><FaUserMd /> Doctor Selection</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>Department *</label>
                  <select
                    value={appointmentDetails.departmentId}
                    onChange={handleDepartmentChange}
                  >
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
                      <option key={i} value={slot}>
                        {slot}
                      </option>
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
      </main>

      <PatientFooter />
    </>
  );
};

export default PatientBookAppointment;