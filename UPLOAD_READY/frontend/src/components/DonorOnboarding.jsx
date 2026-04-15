import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import apiClient from "../services/apiClient";

export default function DonorOnboarding({ onComplete }) {
  const { user } = useContext(AuthContext);
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "A+");
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharOtpRequested, setAadharOtpRequested] = useState(false);
  const [aadharOtp, setAadharOtp] = useState("");
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharLoading, setAadharLoading] = useState(false);

  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestAadharOtp = async () => {
    if (aadharNumber.length < 12) {
      setError("Please provide a valid 12-digit Aadhar number.");
      return;
    }
    setAadharLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/request-aadhar-otp", { aadharNumber });
      setAadharOtpRequested(true);
      setError(""); // clear generic errors
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request Aadhaar OTP.");
    } finally {
      setAadharLoading(false);
    }
  };

  const verifyAadharOtp = async () => {
    if (aadharOtp.length < 6) return;
    setAadharLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/verify-aadhar-otp", { aadharNumber, otp: aadharOtp });
      setAadharVerified(true);
      localStorage.setItem("token", res.data.token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    } catch (err) {
      setError(err.response?.data?.error || "Invalid Aadhaar OTP.");
    } finally {
      setAadharLoading(false);
    }
  };

  // Fallback to fetch location if supported
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (err) => {
        setError("Unable to retrieve your location. Please check your browser permissions.");
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aadharVerified) {
      setError("Please verify your Aadhaar identity before completing registration.");
      return;
    }
    if (!location) {
      setError("Please provide location access using the button below.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.patch("/auth/profile", {
        bloodGroup,
        latitude: location.lat,
        longitude: location.lng
      });
      // The backend returns a new token with updated payload!
      localStorage.setItem("token", res.data.token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      
      // Update global context manually or refresh
      onComplete(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", animation: "slideInRight 0.5s ease-out" }}>
      <h2 style={{ textAlign: "center", marginBottom: "8px", color: "var(--danger)" }}>Finalize Your Donor Profile</h2>
      <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Before accessing your dashboard, please complete your profile. This helps verify your identity and matches you to local hospitals during emergencies.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
          <label>Blood Group</label>
          <select className="select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} required>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className="form-group mb-4">
          <label>Aadhar Card Number</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="input"
              value={aadharNumber}
              onChange={e => setAadharNumber(e.target.value.replace(/\D/g, '').substring(0,12))}
              placeholder="12-digit Aadhar Number"
              disabled={aadharOtpRequested || aadharVerified}
              required
              maxLength="12"
              style={{ flex: 1 }}
            />
            {!aadharOtpRequested && !aadharVerified && (
              <button type="button" className="btn" onClick={requestAadharOtp} disabled={aadharLoading || aadharNumber.length !== 12} style={{ border: '1px solid var(--border-color)' }}>
                {aadharLoading ? "Sending..." : "Send OTP"}
              </button>
            )}
          </div>
          
          {aadharOtpRequested && !aadharVerified && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', animation: 'fadeIn 0.3s' }}>
              <input 
                type="text" 
                className="input"
                value={aadharOtp}
                onChange={e => setAadharOtp(e.target.value.replace(/\D/g, '').substring(0,6))}
                placeholder="6-digit OTP (Hint: 123456)"
                maxLength="6"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-primary" onClick={verifyAadharOtp} disabled={aadharLoading || aadharOtp.length !== 6}>
                {aadharLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {aadharVerified && (
            <div style={{ marginTop: '8px', color: 'var(--success)', fontWeight: 'bold' }}>
              ✓ Aadhaar e-KYC Verified
            </div>
          )}
          <small style={{color: "var(--text-secondary)", marginTop: "4px", display: "block"}}>We use this for strictly secured identity verification.</small>
        </div>

        <div className="form-group mb-4">
          <label>Live Location</label>
          {!location ? (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={getLocation}
              disabled={locationLoading}
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              {locationLoading ? "Acquiring..." : "Get My Live Location (GPS)"}
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-status-APPROVED">Location Acquired</span>
                <span style={{ fontSize: '0.875rem', color: "var(--text-secondary)" }}>
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </span>
              </div>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', height: '250px' }}>
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                 ></iframe>
              </div>
              <button 
                type="button"
                className="btn"
                style={{ marginTop: '8px', padding: '0.5rem 1rem', border: '1px solid var(--border-color)' }}
                onClick={getLocation}
              >
                 Refresh Location
              </button>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: "100%", padding: "1rem", marginTop: "1rem", fontSize: "1.1rem" }}
          disabled={loading || !location || !aadharVerified}
        >
          {loading ? "Saving..." : "Complete Registration"}
        </button>
      </form>
    </div>
  );
}
