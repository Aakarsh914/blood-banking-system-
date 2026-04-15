import { useState, useEffect, useContext } from "react";
import apiClient from "../services/apiClient";
import { AuthContext } from "../contexts/AuthContext";

export default function DonorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Scheduling state
  const [activeHospital, setActiveHospital] = useState(null);
  const [donationType, setDonationType] = useState(""); // AT_HOSPITAL or AT_HOME
  const [scheduledDate, setScheduledDate] = useState("");

  const quotes = [
    "A single pint can save three lives. A single gesture can create a million smiles.",
    "The blood you donate gives someone another chance at life.",
    "You don't have to be a doctor to save a life: Just donate blood.",
    "Be a hero, someone's life is running in your veins."
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [hospRes, apptRes] = await Promise.all([
        apiClient.get("/hospitals"),
        apiClient.get("/appointments")
      ]);
      setHospitals(hospRes.data);
      setAppointments(apptRes.data);
    } catch (err) {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const initiateBooking = (hospitalId, type) => {
    setActiveHospital(hospitalId);
    setDonationType(type);
    setScheduledDate("");
    setMessage("");
    setError("");
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError("Please select a date.");
      return;
    }
    try {
      await apiClient.post("/appointments", {
        hospitalId: activeHospital,
        donationType,
        scheduledDate
      });
      setMessage("Donation request submitted successfully!");
      setActiveHospital(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request.");
    }
  };

  if (loading) {
    return <div className="app-container" style={{ textAlign: 'center', marginTop: '50px' }}>Loading Donor Portal...</div>;
  }

  return (
    <div className="app-container">
      <div className="header" style={{ marginBottom: "2rem" }}>
        <h1 className="header-title" style={{ color: "var(--danger)" }}>Donor Control Center</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div style={{ color: 'var(--text-secondary)' }}>
            Welcome back, <strong>{user?.name}</strong> <span className="badge badge-blood">{user?.bloodGroup}</span>
          </div>
          <button className="btn btn-primary" onClick={logout} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Logout</button>
        </div>
      </div>

      <div style={{
        background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('/donor_hero_banner.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '4rem 2rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2.5rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
        transition: 'all 0.5s ease'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          animation: 'fadeIn 1s ease-in-out'
        }}>
          "{quotes[quoteIndex]}"
        </h2>
        <p style={{ opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Every drop counts. Connect with local hospitals below to schedule your next life-saving donation.
        </p>
      </div>

      {error && !activeHospital && <div className="alert alert-error">{error}</div>}
      {message && !activeHospital && <div className="alert alert-success">{message}</div>}

      <div className="grid-2">
        <div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Hospitals in Jammu</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Select a nearby hospital to donate blood in person, or request their mobile van unit for home blood collection.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {hospitals.map(h => (
                <div key={h.id} style={{ border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "var(--text-primary)" }}>{h.name}</h3>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{h.city}</div>
                    </div>
                    <span className="badge badge-blood">Verified</span>
                  </div>

                  {activeHospital === h.id ? (
                    <form onSubmit={submitBooking} style={{ background: "var(--bg-primary)", padding: "1rem", borderRadius: "6px", marginTop: "1rem" }}>
                      <h4 style={{ marginBottom: "0.75rem", marginTop: 0 }}>
                        {donationType === 'AT_HOME' ? '🚗 Request Home Collection' : '🏥 Book Hospital Visit'}
                      </h4>
                      {donationType === 'AT_HOSPITAL' && (
                        <div style={{ marginBottom: '1rem', padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>📍 Location Details:</strong><br/>
                          <span style={{ color: 'var(--text-secondary)' }}>{h.name}, {h.city}</span><br/>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.city)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-block', marginTop: '0.4rem', fontWeight: '500' }}>
                            🗺️ View on Google Maps
                          </a>
                        </div>
                      )}
                      {error && <div className="alert alert-error" style={{ padding: "0.5rem" }}>{error}</div>}
                      <div className="form-group mb-4">
                        <label>Preferred Date</label>
                        <input type="date" className="input" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Booking</button>
                        <button type="button" className="btn" style={{ background: "var(--border-color)" }} onClick={() => setActiveHospital(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="btn"
                        style={{ flex: 1, backgroundColor: "var(--accent-color)", color: "white" }}
                        onClick={() => initiateBooking(h.id, 'AT_HOSPITAL')}
                      >
                        Donate at Hospital
                      </button>
                      <button
                        className="btn"
                        style={{ flex: 1, backgroundColor: "var(--success)", color: "white" }}
                        onClick={() => initiateBooking(h.id, 'AT_HOME')}
                      >
                        Request Home Collection
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {hospitals.length === 0 && <p>No hospitals are currently registered.</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Your Appointment History</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Track the status of your past and upcoming donations.</p>

            {appointments.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
                You have no existing or past appointments.
              </div>
            ) : (
              <ul className="list-container">
                {appointments.map(appt => (
                  <li key={appt.id} className="list-item">
                    <div className="list-item-content">
                      <div className="list-item-title">{appt.hospital_name || 'Hospital Not Found'}</div>
                      <div className="list-item-subtitle" style={{ fontWeight: 500 }}>
                        {appt.donation_type === 'AT_HOME' ? '🚗 Home Collection' : '🏥 In-Hospital Visit'}
                      </div>
                      <div className="list-item-subtitle" style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                        Scheduled for: {new Date(appt.scheduled_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className={`badge badge-status-${appt.status}`}>{appt.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
