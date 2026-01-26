// EmailManagement.jsx - FINAL & PERFECT VERSION

import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faDownload, faEye, faRedo, faEdit } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useNavigate } from "react-router-dom";

// Different theme components
import SenduserViewdata from "../pending/SenduserViewdata";
import SenduserViewdata3 from "../pending/SenduserViewdata3";
import Senduserviewdata4 from "../pending/Senduserviewdata4";
import { AuthContext } from "../context/AuthContext";
const API_BASE = import.meta.env.VITE_SERVER_BASE_URL || "https://apitour.rajasthantouring.in";
const CLIENT_BASE = "https://tour.rajasthantouring.in";

const EmailManagement = () => {
  const { user } = useContext(AuthContext);

  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [summary, setSummary] = useState({
    totalSent: 0, totalSends: 0, pending: 0, seen: 0, unseen: 0
  });
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState({});
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [triggerDownload, setTriggerDownload] = useState(false);
  const [tourSoftware, setTourSoftware] = useState({ companyName: "Rajasthan Touring", year: new Date().getFullYear() });

  const navigate = useNavigate();

  // Load emails + summary + tour software
  const loadData = async () => {
    try {
      setLoading(true);

      const [emailsRes, summaryRes, softwareRes] = await Promise.all([
        axios.get(`${API_BASE}/api/emails`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/emails/summary`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/toursoftware`).catch(() => ({ data: [] }))
      ]);

      setEmails(emailsRes.data.emails || []);
      setFilteredEmails(emailsRes.data.emails || []);
      setSummary(summaryRes.data || {});
      setTourSoftware(softwareRes.data[0] || { companyName: "Rajasthan Touring", year: new Date().getFullYear() });

      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();

  }, []);

  const generateWhatsAppMessage = async (email) => {
    try {
      const bookingRes = await axios.get(`${API_BASE}/api/pending/${email.bookingId}`);
      const booking = bookingRes.data;

      // theme link lowercase
      const theme = booking.theme?.link?.toLowerCase() || "viewdata";

      const viewLink = `${CLIENT_BASE}/Senduser${theme}/${booking.bookingId || booking._id}`;

      // Extract category names without price
      let categories = "";

      if (booking.totalAmount && typeof booking.totalAmount === "object") {
        for (const [cat, amt] of Object.entries(booking.totalAmount)) {
          if (amt > 0) {
            const cleanCat = cat.trim().replace(/\b\w/g, (l) => l.toUpperCase());
            categories += `${cleanCat} Hotels Package\n`;
          }
        }
      }

      return `
Dear ${booking.clientDetails.name},

  "Khammaghani" 

Greetings from ${tourSoftware.companyName}!

Thank you for your interest in our Rajasthan tour package. Please find below the proposed trip details and the link to view your complete quotation online.

${email.sendCount > 1 ? "This is a re-sent quotation message.\n\n" : ""}

Here is your customized itinerary package option:

${categories}

Kindly review the package options and let us know which one suits you best. We would be happy to customize the itinerary as per your requirements.

View Full Quotation:
${viewLink}

Warm regards,
${booking.contact.name}

${tourSoftware.companyName}

© ${tourSoftware.year} ${tourSoftware.companyName}. All rights reserved.
    `.trim();
    } catch (err) {
      return `
Dear ${email.clientDetails.name},


Your quotation is ready. 
View here:
${CLIENT_BASE}/viewData/${email.stringId || email.bookingId}
    `.trim();
    }
  };


  // WhatsApp send
  const handleSendWhatsApp = async (email) => {
    const message = await generateWhatsAppMessage(email);
    const phone = email.clientDetails.phone?.replace(/\D/g, "");
    if (!phone) return toast.error("Phone number missing");

    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, "_blank");
  };

  // Resend email
  const handleResend = async (bookingId) => {
    try {
      setResendLoading(prev => ({ ...prev, [bookingId]: true }));
      await axios.post(`${API_BASE}/api/emails/resend/${bookingId}`);
      toast.success("Quotation re-sent successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to resend");
    } finally {
      setResendLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Download PDF
  const handleDownload = (email) => {
    setSelectedBookingId(email.bookingId || email.bookingId);
    setTriggerDownload(true);
    toast.success("pdf download in 15-20 sec..")
  };

  // View in browser (Eye button)
  const handleView = async (email) => {
    try {
      const res = await axios.get(`${API_BASE}/api/pending/${email.bookingId}`);
      const booking = res.data;
      const link = booking.theme?.link || "viewData";
      navigate(`/Senduser${link}/${email.bookingId || email.bookingId}`);
    } catch (err) {
      toast.error("Booking not found");
    }
  };

  if (loading) return <div className="text-center py-20">Loading emails...</div>;

  return (
    <div style={{ fontFamily: "sans-serif" }} className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Email Management</h2>
          <button onClick={loadData} className="bg-blue-400 px-2 rounded-2xl py-1 text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5m11 6v5h-5m-7-7h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Emails", value: summary.totalSent },
            { label: "Total Sends", value: summary.totalSends },
            { label: "Pending", value: summary.pending },
            { label: "Seen", value: summary.seen },
            { label: "Unseen", value: summary.unseen },
          ].map(item => (
            <div key={item.label} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-2xl font-bold text-blue-700">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sends</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmails.map(email => (
                <tr key={email._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">
                    #{email.stringId || email.bookingId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(email.sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{email.clientDetails.name}</p>
                      <p className="text-sm text-gray-500">{email.clientDetails.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${email.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                      {email.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${email.isSeen ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                      {email.isSeen ? "Seen" : "Unseen"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{email.sendCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Resend */}
                      <button
                        onClick={() => handleResend(email.bookingId)}
                        disabled={resendLoading[email.bookingId]}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700"
                        title="Resend Email"
                      >
                        {resendLoading[email.bookingId] ? "⏳" : <FontAwesomeIcon icon={faRedo} />}
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => handleSendWhatsApp(email)}
                        className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700"
                        title="Send on WhatsApp"
                      >
                        <FontAwesomeIcon icon={faWhatsapp} />
                      </button>

                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownload(email)}
                        className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700"
                        title="Download PDF"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button
                        onClick={() => navigate(`/Pending/?id=${email.bookingId}`)}
                        className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-yellow-700"
                        title="Download PDF"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>

                      {/* View */}
                      <button
                        onClick={() => handleView(email)}
                        className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                        title="View Quotation"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ToastContainer position="top-right" />

        {/* Hidden PDF Component */}
        <div className="hidden">
          {selectedBookingId && (
            <>
              <SenduserViewdata id={selectedBookingId} autoDownload={triggerDownload} onDownloadComplete={() => setTriggerDownload(false)} />
              <SenduserViewdata3 id={selectedBookingId} autoDownload={triggerDownload} onDownloadComplete={() => setTriggerDownload(false)} />
              <Senduserviewdata4 id={selectedBookingId} autoDownload={triggerDownload} onDownloadComplete={() => setTriggerDownload(false)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;