import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFlask,
  FaVial,
  FaClipboardCheck,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaUserMd,
  FaBarcode,
} from "react-icons/fa";
import "../../styles/LabModule.css";

const API_BASE_URL = "http://localhost:8080/api";

const LabModule = ({ staffInfo }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingSamples, setPendingSamples] = useState([]);
  const [entryQueue, setEntryQueue] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [testResults, setTestResults] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingSamples();
    fetchEntryQueue();
    fetchVerificationQueue();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4800);
  };

  const fetchPendingSamples = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lab/samples/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setPendingSamples(await res.json());
    } catch (err) {
      console.error("Error fetching pending samples:", err);
    }
  };

  const fetchEntryQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lab/results/pending-entry`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setEntryQueue(await res.json());
    } catch (err) {
      console.error("Error fetching entry queue:", err);
    }
  };

  const fetchVerificationQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lab/results/pending-verification`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map(sample => ({
          ...sample,
          results: Array.isArray(sample.results)
            ? sample.results
            : sample.results
            ? [sample.results]
            : []
        }));
        setVerificationQueue(normalized);
      }
    } catch (err) {
      console.error("Error fetching verification queue:", err);
      showToast("error", "Failed to fetch verification queue");
    }
  };

  const handleCollectSample = async (sample) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lab/samples/${sample.id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          collectedBy: staffInfo?.name,
          collectionTime: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        showToast("success", "Sample collected successfully");
        fetchPendingSamples();
        fetchEntryQueue();
      } else {
        showToast("error", "Failed to collect sample");
      }
    } catch (err) {
      showToast("error", "Network error while collecting sample");
    } finally {
      setLoading(false);
    }
  };

  const handleResultEntry = (sampleId, paramName, value) => {
    setTestResults((prev) => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        [paramName]: value,
      },
    }));
  };

  const handleSubmitResults = async (sample) => {
    setLoading(true);
    const results = testResults[sample.id] || {};

    if (Object.keys(results).length === 0) {
      showToast("error", "Please enter at least one test result");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/lab/results/${sample.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          results: Object.entries(results).map(([name, value]) => ({
            name,
            value,
            unit: sample.parameters?.find(p => p.name === name)?.unit || "",
            normalRange: sample.parameters?.find(p => p.name === name)?.normalRange || ""
          })),
          enteredBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        showToast("success", "Results submitted for verification");
        setTestResults((prev) => {
          const updated = { ...prev };
          delete updated[sample.id];
          return updated;
        });
        fetchEntryQueue();
        fetchVerificationQueue();
      } else {
        showToast("error", "Failed to submit results");
      }
    } catch (err) {
      showToast("error", "Network error while submitting results");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResults = async (sample, approved) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lab/results/${sample.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          approved,
          verifiedBy: staffInfo?.name,
        }),
      });

      if (res.ok) {
        showToast(
          "success",
          approved ? "Results verified and released" : "Results sent back for correction"
        );
        fetchVerificationQueue();
        if (!approved) fetchEntryQueue();
      } else {
        showToast("error", "Failed to process verification");
      }
    } catch (err) {
      showToast("error", "Network error during verification");
    } finally {
      setLoading(false);
    }
  };

  const isValueAbnormal = (value, normalRange) => {
    if (!value || !normalRange) return false;
    try {
      const [min, max] = normalRange.split("-").map(parseFloat);
      const numValue = parseFloat(value);
      return !isNaN(numValue) && (numValue < min || numValue > max);
    } catch {
      return false;
    }
  };

  const filteredSamples = pendingSamples.filter(
    (s) =>
      s.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lab-module">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="module-header">
        <h2>
          <FaFlask /> Laboratory
        </h2>
        <div className="quick-stats">
          <div className="stat">
            <FaVial />
            <span>{pendingSamples.length} Pending Collection</span>
          </div>
          <div className="stat">
            <FaFileAlt />
            <span>{entryQueue.length} Awaiting Entry</span>
          </div>
          <div className="stat">
            <FaClipboardCheck />
            <span>{verificationQueue.length} For Verification</span>
          </div>
        </div>
      </div>

      <div className="module-tabs">
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          <FaVial /> Sample Collection
        </button>
        <button
          className={activeTab === "entry" ? "active" : ""}
          onClick={() => setActiveTab("entry")}
        >
          <FaFileAlt /> Result Entry
        </button>
        <button
          className={activeTab === "verify" ? "active" : ""}
          onClick={() => setActiveTab("verify")}
        >
          <FaClipboardCheck /> Verification
        </button>
      </div>

      {activeTab === "pending" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by patient or receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <h3>Pending Sample Collection</h3>
          <p className="info-text">Only PAID lab requests appear here.</p>

          <div className="samples-list">
            {filteredSamples.map((sample) => (
              <div key={sample.id} className="sample-card">
                <div className="sample-barcode">
                  <FaBarcode />
                  <span>{sample.receiptNumber}</span>
                </div>
                <div className="sample-info">
                  <h4>{sample.patientName}</h4>
                  <p><strong>Test:</strong> {sample.testName}</p>
                  <p><strong>Type:</strong> {sample.sampleType}</p>
                  <p><strong>Doctor:</strong> {sample.doctorName}</p>
                </div>
                <div className="sample-status">
                  <span className="status-badge paid">
                    <FaCheckCircle /> PAID
                  </span>
                </div>
                <button
                  className="collect-btn"
                  onClick={() => handleCollectSample(sample)}
                  disabled={loading}
                >
                  <FaVial /> Collect Sample
                </button>
              </div>
            ))}

            {filteredSamples.length === 0 && (
              <div className="empty-state">
                <FaVial size={48} />
                <p>No pending samples found</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "entry" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Enter Test Results</h3>

          <div className="entry-list">
            {entryQueue.map((sample) => (
              <div key={sample.id} className="entry-card">
                <div className="entry-header">
                  <div>
                    <h4>{sample.testName}</h4>
                    <p>{sample.receiptNumber} | {sample.patientName}</p>
                    <small>Collected: {new Date(sample.collectionTime).toLocaleString()}</small>
                  </div>
                </div>

                <div className="parameters-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Normal Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.parameters?.map((param, idx) => (
                        <tr key={idx}>
                          <td>{param.name}</td>
                          <td>
                            <input
                              type="text"
                              placeholder="Enter value"
                              value={testResults[sample.id]?.[param.name] || ""}
                              onChange={(e) =>
                                handleResultEntry(sample.id, param.name, e.target.value)
                              }
                              className={
                                isValueAbnormal(
                                  testResults[sample.id]?.[param.name],
                                  param.normalRange
                                )
                                  ? "abnormal"
                                  : ""
                              }
                            />
                          </td>
                          <td>{param.unit}</td>
                          <td>{param.normalRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="entry-actions">
                  <button
                    className="submit-btn"
                    onClick={() => handleSubmitResults(sample)}
                    disabled={loading}
                  >
                    Submit for Verification
                  </button>
                </div>
              </div>
            ))}

            {entryQueue.length === 0 && (
              <div className="empty-state">
                <FaFileAlt size={48} />
                <p>No samples awaiting result entry</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "verify" && (
        <motion.div className="tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3><FaUserMd /> Pathologist Verification</h3>

          <div className="verification-list">
            {verificationQueue.map((sample) => (
              <div key={sample.id} className="verification-card">
                <div className="verification-header">
                  <div>
                    <h4>{sample.testName}</h4>
                    <p>{sample.receiptNumber} | {sample.patientName}</p>
                    <small>Entered by: {sample.enteredBy || "N/A"}</small>
                  </div>
                </div>

                <div className="results-preview">
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Ref Range</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.results?.length > 0 ? (
                        sample.results.map((res, idx) => (
                          <tr
                            key={idx}
                            className={isValueAbnormal(res.value, res.normalRange) ? "abnormal-row" : ""}
                          >
                            <td>{res.name}</td>
                            <td><strong>{res.value || "—"}</strong></td>
                            <td>{res.unit || "—"}</td>
                            <td>{res.normalRange || "—"}</td>
                            <td>
                              {isValueAbnormal(res.value, res.normalRange) && (
                                <span className="abnormal-badge">Abnormal</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "#666" }}>
                            No results entered yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="verification-actions">
                  <button
                    className="reject-btn"
                    onClick={() => handleVerifyResults(sample, false)}
                    disabled={loading || sample.results?.length === 0}
                  >
                    <FaTimesCircle /> Reject
                  </button>
                  <button
                    className="approve-btn"
                    onClick={() => handleVerifyResults(sample, true)}
                    disabled={loading || sample.results?.length === 0}
                  >
                    <FaCheckCircle /> Verify & Release
                  </button>
                </div>
              </div>
            ))}

            {verificationQueue.length === 0 && (
              <div className="empty-state">
                <FaClipboardCheck size={48} />
                <p>No results pending verification</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LabModule;