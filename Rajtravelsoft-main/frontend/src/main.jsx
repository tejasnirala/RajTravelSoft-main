

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'  // 👈 Router import
import './index.css'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from "./context/AuthContext.jsx";

// Debug SSR after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.__INITIAL_BOOKING__) {
    console.log("✅ SSR Booking Data Loaded:", window.__INITIAL_BOOKING__);
    console.log("📦 Booking Type:", window.__BOOKING_TYPE__);
  } else {
    console.warn("⚠️ No SSR booking data found in window");
  }
});
createRoot(document.getElementById('root')).render(
  <HelmetProvider>

    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />

    <BrowserRouter>
      <AuthProvider>
        <div id="app-scale-wrapper">
          <App />
        </div>
      </AuthProvider>
    </BrowserRouter>


  </HelmetProvider>,
)
