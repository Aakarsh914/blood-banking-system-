import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="app-container" style={{maxWidth: '1200px'}}>
      <div className="login-split">
        <div className="login-image-section">
          <img src="/blood_donation_hero.png" alt="Blood Donation Concept" className="login-img" />
          <div className="login-brand-text">
            <h2 style={{color: 'white', marginBottom: '0.5rem'}}>Blood Bank Cloud</h2>
            <p style={{color: '#fca5a5', maxWidth: '300px', margin: '0 auto'}}>Connecting heroes to patients globally in real-time.</p>
          </div>
        </div>

        <div className="login-form-section">
          <h1 style={{textAlign: 'center', marginBottom: '8px'}}>Welcome Back</h1>
          <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px'}}>Sign in to your account to continue</p>
          
          {error && <div className="alert alert-error" style={{animation: 'fadeIn 0.3s'}}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{maxWidth: '400px', width: '100%', margin: '0 auto'}}>
            <div className="form-group mb-4">
              <label>Email Address</label>
              <input 
                className="input input-animated" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group mb-4">
              <label>Password</label>
              <input 
                className="input input-animated" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-animated" type="submit" style={{width: '100%', marginBottom: '24px', padding: '1rem'}}>
              Log In securely
            </button>
            <div style={{textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
              Don't have an account? <Link to="/register" style={{color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600}}>Register now</Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
