import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

// Translation dictionary
const translations = {
  en: {
                    

    toggleMenu: "Toggle menu",                    
    toggleMenu: "मेनु टगल गर्नुहोस्",            

    changeLanguage: "Change language",            
    changeLanguage: "भाषा परिवर्तन गर्नुहोस्",  
  

    patient: "Patient",                           
    patient: "बिरामी",
    // Navbar
    dashboard: "Dashboard",
    bookAppointment: "Book Appointment",
    logout: "Logout",
    notifications: "Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications",
    viewAll: "View All",
    
    // Dashboard
    welcomeBack: "Welcome back",
    quickActions: "Quick Actions",
    bookNow: "Book Now",
    viewReports: "View Reports",
    payBills: "Pay Bills",
    myFamily: "My Family",
    upcomingAppointments: "Upcoming Appointments",
    healthTips: "Health Tips",
    
    // Sidebar
    profile: "Profile",
    appointments: "Appointments",
    records: "Medical Records",
    billing: "Billing & Payments",
    family: "Family Members",
    liveQueue: "Live Queue",
    settings: "Settings",
    
    // Profile
    personalInfo: "Personal Information",
    name: "Full Name",
    phone: "Phone Number",
    email: "Email Address",
    dob: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    bloodGroup: "Blood Group",
    address: "Address",
    emergencyContact: "Emergency Contact",
    allergies: "Known Allergies",
    chronicConditions: "Chronic Conditions",
    save: "Save Changes",
    edit: "Edit",
    cancel: "Cancel",
    
    // Appointments
    myAppointments: "My Appointments",
    upcoming: "Upcoming",
    past: "Past",
    cancelled: "Cancelled",
    doctor: "Doctor",
    department: "Department",
    date: "Date",
    time: "Time",
    token: "Token",
    status: "Status",
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelAppointment: "Cancel Appointment",
    reschedule: "Reschedule",
    bookFollowUp: "Book Follow-up",
    noAppointments: "No appointments found",
    
    // Records
    medicalRecords: "Medical Records",
    prescriptions: "Prescriptions",
    labReports: "Lab Reports",
    checkupHistory: "Checkup History",
    downloadPdf: "Download PDF",
    shareRecord: "Share Record",
    diagnosis: "Diagnosis",
    medicines: "Medicines",
    dosage: "Dosage",
    duration: "Duration",
    noRecords: "No records found",
    
    // Billing
    billingPayments: "Billing & Payments",
    pendingBills: "Pending Bills",
    paidBills: "Paid Bills",
    payNow: "Pay Now",
    viewInvoice: "View Invoice",
    totalAmount: "Total Amount",
    paidAmount: "Paid Amount",
    dueAmount: "Due Amount",
    paymentMethod: "Payment Method",
    insuranceStatus: "Insurance Status",
    ssfStatus: "SSF Status",
    eligible: "Eligible",
    notEligible: "Not Eligible",
    covered: "Covered",
    noPendingBills: "No pending bills",
    
    // Family
    familyMembers: "Family Members",
    addMember: "Add Family Member",
    relation: "Relation",
    father: "Father",
    mother: "Mother",
    spouse: "Spouse",
    child: "Child",
    sibling: "Sibling",
    age: "Age",
    viewProfile: "View Profile",
    removeMember: "Remove",
    noFamilyMembers: "No family members added",
    
    // Queue
    liveQueueStatus: "Live Queue Status",
    yourPosition: "Your Position",
    estimatedWait: "Estimated Wait Time",
    minutes: "minutes",
    currentlyServing: "Currently Serving",
    patientsAhead: "Patients Ahead",
    doctorReady: "Doctor is ready for you!",
    pleaseWait: "Please wait for your turn",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    submit: "Submit",
    search: "Search",
    filter: "Filter",
    all: "All",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    npr: "NPR",
    years: "years",
  },
  ne: {
    // Navbar
    dashboard: "ड्यासबोर्ड",
    bookAppointment: "अपोइन्टमेन्ट बुक गर्नुहोस्",
    logout: "लग आउट",
    notifications: "सूचनाहरू",
    markAllRead: "सबै पढेको चिन्ह लगाउनुहोस्",
    noNotifications: "कुनै सूचना छैन",
    viewAll: "सबै हेर्नुहोस्",
    
    // Dashboard
    welcomeBack: "स्वागत छ",
    quickActions: "द्रुत कार्यहरू",
    bookNow: "अहिले बुक गर्नुहोस्",
    viewReports: "रिपोर्टहरू हेर्नुहोस्",
    payBills: "बिल तिर्नुहोस्",
    myFamily: "मेरो परिवार",
    upcomingAppointments: "आगामी अपोइन्टमेन्टहरू",
    healthTips: "स्वास्थ्य सुझावहरू",
    
    // Sidebar
    profile: "प्रोफाइल",
    appointments: "अपोइन्टमेन्टहरू",
    records: "मेडिकल रेकर्डहरू",
    billing: "बिलिङ र भुक्तानी",
    family: "परिवारका सदस्यहरू",
    liveQueue: "लाइभ लाइन",
    settings: "सेटिङहरू",
    
    // Profile
    personalInfo: "व्यक्तिगत जानकारी",
    name: "पूरा नाम",
    phone: "फोन नम्बर",
    email: "इमेल ठेगाना",
    dob: "जन्म मिति",
    gender: "लिङ्ग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    bloodGroup: "रक्त समूह",
    address: "ठेगाना",
    emergencyContact: "आपतकालीन सम्पर्क",
    allergies: "ज्ञात एलर्जीहरू",
    chronicConditions: "दीर्घकालीन रोगहरू",
    save: "परिवर्तनहरू सेभ गर्नुहोस्",
    edit: "सम्पादन",
    cancel: "रद्द गर्नुहोस्",
    
    // Appointments
    myAppointments: "मेरा अपोइन्टमेन्टहरू",
    upcoming: "आगामी",
    past: "विगत",
    cancelled: "रद्द गरिएको",
    doctor: "डाक्टर",
    department: "विभाग",
    date: "मिति",
    time: "समय",
    token: "टोकन",
    status: "स्थिति",
    confirmed: "पुष्टि भयो",
    pending: "पेन्डिङ",
    completed: "सम्पन्न",
    cancelAppointment: "अपोइन्टमेन्ट रद्द गर्नुहोस्",
    reschedule: "पुनर्निर्धारण",
    bookFollowUp: "फलो-अप बुक गर्नुहोस्",
    noAppointments: "कुनै अपोइन्टमेन्ट भेटिएन",
    
    // Records
    medicalRecords: "मेडिकल रेकर्डहरू",
    prescriptions: "प्रेस्क्रिप्सनहरू",
    labReports: "ल्याब रिपोर्टहरू",
    checkupHistory: "जाँच इतिहास",
    downloadPdf: "PDF डाउनलोड",
    shareRecord: "रेकर्ड साझा गर्नुहोस्",
    diagnosis: "निदान",
    medicines: "औषधिहरू",
    dosage: "मात्रा",
    duration: "अवधि",
    noRecords: "कुनै रेकर्ड भेटिएन",
    
    // Billing
    billingPayments: "बिलिङ र भुक्तानी",
    pendingBills: "बाँकी बिलहरू",
    paidBills: "तिरिएका बिलहरू",
    payNow: "अहिले तिर्नुहोस्",
    viewInvoice: "इनभ्वाइस हेर्नुहोस्",
    totalAmount: "कुल रकम",
    paidAmount: "तिरिएको रकम",
    dueAmount: "बाँकी रकम",
    paymentMethod: "भुक्तानी विधि",
    insuranceStatus: "बीमा स्थिति",
    ssfStatus: "SSF स्थिति",
    eligible: "योग्य",
    notEligible: "योग्य छैन",
    covered: "कभर गरिएको",
    noPendingBills: "कुनै बाँकी बिल छैन",
    
    // Family
    familyMembers: "परिवारका सदस्यहरू",
    addMember: "परिवारको सदस्य थप्नुहोस्",
    relation: "सम्बन्ध",
    father: "बुबा",
    mother: "आमा",
    spouse: "जीवनसाथी",
    child: "छोरा/छोरी",
    sibling: "दाजुभाइ/दिदीबहिनी",
    age: "उमेर",
    viewProfile: "प्रोफाइल हेर्नुहोस्",
    removeMember: "हटाउनुहोस्",
    noFamilyMembers: "कुनै परिवारको सदस्य थपिएको छैन",
    
    // Queue
    liveQueueStatus: "लाइभ लाइन स्थिति",
    yourPosition: "तपाईंको स्थान",
    estimatedWait: "अनुमानित प्रतीक्षा समय",
    minutes: "मिनेट",
    currentlyServing: "हाल सेवा गरिँदै",
    patientsAhead: "अगाडिका बिरामीहरू",
    doctorReady: "डाक्टर तपाईंको लागि तयार छन्!",
    pleaseWait: "कृपया आफ्नो पालोको लागि पर्खनुहोस्",
    
    // Common
    loading: "लोड हुँदैछ...",
    error: "त्रुटि",
    success: "सफलता",
    confirm: "पुष्टि गर्नुहोस्",
    back: "पछाडि",
    next: "अर्को",
    submit: "पेश गर्नुहोस्",
    search: "खोज्नुहोस्",
    filter: "फिल्टर",
    all: "सबै",
    today: "आज",
    yesterday: "हिजो",
    thisWeek: "यो हप्ता",
    thisMonth: "यो महिना",
    npr: "रु.",
    years: "वर्ष",

    // en
namaste: "Namaste",
welcomeBack: "Welcome back",
yourHealthOurPriority: "Your Health, Our Priority",
patientMenu: "Patient Menu",
upcomingAppointments: "Upcoming Appointments",
healthTip: "Health Tip",
drinkWaterTip: "Drink enough water to stay energized and healthy.",
emergency: "Emergency",

// ne
namaste: "नमस्ते",
welcomeBack: "स्वागत छ",
yourHealthOurPriority: "तपाईंको स्वास्थ्य, हाम्रो प्राथमिकता",
patientMenu: "बिरामी मेनु",
upcomingAppointments: "आगामी अपोइन्टमेन्टहरू",
healthTip: "स्वास्थ्य सुझाव",
drinkWaterTip: "स्वस्थ र ऊर्जावान रहन पर्याप्त पानी पिउनुहोस्।",
emergency: "आपतकालीन",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("hospismart_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("hospismart_lang", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "ne" : "en");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};



export default LanguageContext;
