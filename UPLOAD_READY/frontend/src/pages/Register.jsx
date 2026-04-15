import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DONOR",
    hospitalId: "",
    bloodGroup: "",
    otp: ""
  });
  const [error, setError] = useState("");
  const { register, requestOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await requestOtp(form.email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request OTP.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register({
        ...form,
        hospitalId: form.role === 'HOSPITAL' ? Number(form.hospitalId) : undefined,
        bloodGroup: form.role === 'DONOR' ? form.bloodGroup : undefined
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="app-container" style={{maxWidth: '500px'}}>
      <div className="card">
        <h1 style={{textAlign: 'center', marginBottom: '24px'}}>CREATE ACCOUNT AS DONOR</h1>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group mb-4">
              <label>Full Name</label>
              <input className="input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            
            <div className="form-group mb-4">
              <label>Email Address</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>

            <div className="form-group mb-4">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>


            {form.role === 'DONOR' && (
              <div className="form-group mb-4">
                <label>Blood Group</label>
                <select className="select" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} required>
                  <option value="">Select...</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn btn-primary" type="submit" style={{width: '100%', marginBottom: '16px'}}>
              Continue (Send OTP)
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="alert alert-success mb-4 text-center">
              An OTP has been sent to <strong>{form.email}</strong>. Check your inbox!
            </div>
            <div className="form-group mb-4">
              <label>Enter 6-digit OTP</label>
              <input 
                className="input" 
                type="text" 
                maxLength="6"
                value={form.otp} 
                onChange={e => setForm({...form, otp: e.target.value})} 
                required 
                style={{textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px'}}
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                className="btn" 
                style={{flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)'}} 
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button className="btn btn-primary" type="submit" style={{flex: 2}}>
                Complete Registration
              </button>
            </div>
          </form>
        )}

        <div style={{textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '16px'}}>
          Already have an account? <Link to="/login" style={{color: 'var(--accent-color)', textDecoration: 'none'}}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
