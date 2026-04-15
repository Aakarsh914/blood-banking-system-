import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Dashboard from "./pages/Dashboard";
import DebugPage from "./pages/DebugPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthContext } from "./contexts/AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="app-container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const debugMode = params.get("debug") === "1";
  
  if (debugMode) {
    return <DebugPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/*" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;
