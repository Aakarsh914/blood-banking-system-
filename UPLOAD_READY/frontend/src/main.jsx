import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown frontend crash" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ fontFamily: "Arial", margin: "24px", lineHeight: 1.5 }}>
          <h1>Frontend Error</h1>
          <p>The app crashed while rendering, so a blank page was prevented.</p>
          <p>
            <strong>Error:</strong> {this.state.errorMessage}
          </p>
          <p>Try opening debug view: http://localhost:5173/?debug=1</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
