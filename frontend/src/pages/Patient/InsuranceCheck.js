import React, { useState } from "react";

const API_BASE_URL = "http://localhost:8080/api";

const InsuranceCheck = ({ patientId, serviceType, fee }) => {
  const [insurance, setInsurance] = useState(null);

  const checkInsurance = async () => {
    const res = await fetch(`${API_BASE_URL}/insurance/eligible?patientId=${patientId}&serviceType=${serviceType}`);
    const data = await res.json();
    setInsurance(data);
  };

  const calculatePayable = () => {
    if (!insurance || !insurance.eligible) return fee;
    return fee * (100 - insurance.coveragePercentage) / 100;
  };

  return (
    <div>
      <button onClick={checkInsurance}>Check Insurance</button>

      {insurance && (
        <div>
          {insurance.eligible ? (
            <p>
              Eligible for {insurance.providerName} ({insurance.coveragePercentage}% coverage). Payable: {calculatePayable()}
            </p>
          ) : (
            <p>No insurance coverage for this service.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InsuranceCheck;
