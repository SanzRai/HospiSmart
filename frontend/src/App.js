import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";

import Homepage from "./pages/Homepage";
import AboutUs from "./pages/AboutUs";
import Department from "./pages/Department";
import Appointment from "./pages/Appointment";
import Login from "./pages/Login";

import InsuranceCheck from "./pages/Patient/InsuranceCheck";
import Payment from "./pages/Patient/Payment";
import EsewaFailure from "./pages/Patient/EsewaFailure";
import PaymentSuccess from "./pages/Patient/PaymentSuccess";
import PatientRegister from "./pages/Patient/PatientRegister";
import PatientOTP from "./pages/Patient/PatientOTP";
import PatientInfo from "./pages/Patient/PatientInfo";
import PatientForgotPassword from "./pages/Patient/PatientForgotPassword";
import PatientDashboard from "./pages/Patient/PatientDashboard";
import PatientHome from "./pages/Patient/PatientHome";
import PatientProfile from "./pages/Patient/PatientProfile";
import PatientAppointments from "./pages/Patient/PatientAppointments";
import PatientRecords from "./pages/Patient/PatientRecords";
import PatientBilling from "./pages/Patient/PatientBilling";
import PatientFamily from "./pages/Patient/PatientFamily";
import PatientQueue from "./pages/Patient/PatientQueue";
import PatientBookAppointment from "./pages/Patient/PatientBookAppointment";
import PatientPayment from "./pages/Patient/PatientPayment";


import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminHome from "./pages/Admin/AdminHome";
import DepartmentManagement from "./pages/Admin/DepartmentManagement";
import DoctorManagement from "./pages/Admin/DoctorManagement";
import InsuranceManagement from "./pages/Admin/InsuranceManagement";
import PatientManagement from "./pages/Admin/PatientManagement";
import StaffManagement from "./pages/Admin/StaffManagement";
import AdminSettings from "./pages/Admin/AdminSettings";

import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorModule from "./pages/Doctor/DoctorModule";


import StaffDashboard from "./pages/Staff/StaffDashboard";
import ReceptionModule from "./pages/Staff/ReceptionModule";
import NurseModule from "./pages/Staff/NurseModule";
import LabModule from "./pages/Staff/LabModule";
import BillingModule from "./pages/Staff/BillingModule";
import StaffProfile from "./pages/Staff/StaffProfile";





function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/departments" element={<Department />} />
        <Route path="/appointments" element={<Appointment />} />
        <Route path="/login" element={<Login />} />

        <Route path="/insurance-checks" element={<InsuranceCheck />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/failure" element={<EsewaFailure />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        <Route path="/patient-register" element={<PatientRegister />} />
        <Route path="/patient-otp" element={<PatientOTP />} />
        <Route path="/patient-info" element={<PatientInfo />} />
        <Route path="/forgot-password" element={<PatientForgotPassword />} />
        <Route path="/patient-dashboard" element={<PatientDashboard/>} />
        <Route path="/patient-home" element={<PatientHome/>} />
        <Route path="/patient/profile" element={<PatientProfile/>} />
        <Route path="/patient/appointments" element={<PatientAppointments/>} />
        <Route path="/patient/appointment" element={<PatientBookAppointment />} />
        <Route path="/patient/payment" element={<PatientPayment />} />
        <Route path="/patient/records" element={<PatientRecords/>} />
        <Route path="/patient/billing" element={<PatientBilling/>} />
        <Route path="/patient/family" element={<PatientFamily />} />
        <Route path="/patient/queue" element={<PatientQueue />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} >
          <Route index element={<AdminHome />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="doctors" element={<DoctorManagement />} />
          <Route path="insurance" element={<InsuranceManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="patients" element={<PatientManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          </Route>
        
        <Route path="/doctor/dashboard" element={<DoctorDashboard />}>
          <Route index element={<DoctorModule />} />               
          <Route path="profile" element={<DoctorProfile />} />     
        </Route>

        <Route path="/staff/dashboard"element={<StaffDashboard />} />
        <Route path="/nurse-staff" element={<NurseModule />} />
        <Route path="/reception-staff" element={<ReceptionModule />} />
        <Route path="/lab-staff" element={<LabModule />} />
        <Route path="/billing-staff" element={<BillingModule />} />
        <Route path="/staff/profile" element={<StaffProfile />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;