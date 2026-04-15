import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

export default function DebugPage() {
  const [health, setHealth] = useState("Checking...");

  useEffect(() => {
    async function checkHealth() {
      try {
        const result = await apiClient.get("/health");
        setHealth(`OK: ${JSON.stringify(result.data)}`);
      } catch (error) {
        setHealth(`FAILED: ${error.message}`);
      }
    }

    checkHealth();
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="header-title">Debug Diagnostics</h1>
        <a href="/" className="btn btn-primary">Back to App</a>
      </div>
      
      <div className="card">
        <h2>Frontend Status</h2>
        <div className="alert alert-success">React rendering is working normally.</div>
      </div>

      <div className="card">
        <h2>Backend Connectivity</h2>
        <div className={`alert ${health.startsWith('OK') ? 'alert-success' : 'alert-error'}`}>
          Backend health check: {health}
        </div>
      </div>
    </div>
  );
}
