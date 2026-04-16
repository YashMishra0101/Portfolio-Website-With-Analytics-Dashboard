import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Registering the Service Worker for Dashboard PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New dashboard update available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Dashboard is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
