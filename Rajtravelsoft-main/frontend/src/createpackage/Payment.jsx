"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Filter, Calendar, User, CreditCard, Eye, Settings, X, Upload, Check, Clock, AlertCircle, XCircle, CheckCircle, FileText, Edit, MessageCircle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FaRupeeSign } from "react-icons/fa";
import Pendingopration from "../pending/Pendingopration"


const calculateBalanceAmount = (booking) => {
  const paidAmount =
    booking.payments?.filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  return booking.totalAmount - paidAmount;
};

const Payment = () => {


  const [activeTab, setActiveTab] = useState("pending"); // "payments" ya "pending"
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [offerUsedLoading, setOfferUsedLoading] = useState(false);
  const [viewpdf, setViewpdf] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    date: "",
    paymentStatus: "all",
    paymentDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "INR",
    mobileNumber: "",
    method: "",
    transactionId: "",
    gateway: "",
    status: "pending",
    receiptUrl: "",
    screenshot: "",
    index: null,
  });
  const [nextOfferData, setNextOfferData] = useState({
    type: true,
    value: 0,
  });
  const [nextPaymentPerc, setNextPaymentPerc] = useState('30');
  const [isSending, setIsSending] = useState(false);

  const clientBase = 'https://apitour.rajasthantouring.in'

  useEffect(() => {
    if (selectedBooking && selectedBooking.nextOffer) {
      setNextOfferData({
        type: selectedBooking.nextOffer.type,
        value: selectedBooking.nextOffer.value || 0,
      });
    } else {
      setNextOfferData({ type: true, value: 0 });
    }
  }, [selectedBooking]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get("https://apitour.rajasthantouring.in/api/bookings", { withCredentials: true });
        setBookings(response.data);
        setFilteredBookings(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch bookings");
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = [...bookings];

    if (filters.search) {
      filtered = filtered.filter(
        (booking) =>
          booking.clientDetails.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          booking.clientDetails.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          booking.itineraryData?.titles?.[0]?.toLowerCase().includes(filters.search.toLowerCase()) ||
          booking._id.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((booking) => booking.status === filters.status);
    }

    if (filters.date) {
      filtered = filtered.filter((booking) => {
        const travelDate = new Date(booking.clientDetails.travelDate).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        return travelDate === filterDate;
      });
    }

    if (filters.paymentStatus !== "all") {
      filtered = filtered.filter((booking) => {
        const balanceAmount = calculateBalanceAmount(booking);
        if (filters.paymentStatus === "paid") return balanceAmount === 0;
        if (filters.paymentStatus === "partial") return balanceAmount > 0 && balanceAmount < booking.totalAmount;
        if (filters.paymentStatus === "unpaid") return balanceAmount === booking.totalAmount;
        return true;
      });
    }

    if (filters.paymentDate) {
      filtered = filtered.filter((booking) => {
        if (!booking.payments || booking.payments.length === 0) return false;
        return booking.payments.some((payment) => {
          const paymentDate = new Date(payment.paymentDate).toDateString();
          const filterDate = new Date(filters.paymentDate).toDateString();
          return paymentDate === filterDate;
        });
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      date: "",
      paymentStatus: "all",
      paymentDate: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handleNextOfferChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNextOfferData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const formData = new FormData();
    formData.append("screenshot", file);
    try {
      const response = await axios.post("https://apitour.rajasthantouring.in/api/bookings/upload-screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setPaymentData({ ...paymentData, screenshot: response.data.screenshotUrl });
    } catch (err) {
      console.error("Error uploading screenshot:", err);
      alert("Failed to upload screenshot. Please try again.");
    }
  };

  const handleAddPayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    if (!paymentData.method || paymentData.method.trim() === "") {
      alert("Please enter a payment method");
      return;
    }

    try {
      setPaymentLoading(true);
      const response = await axios.post(
        `https://apitour.rajasthantouring.in/api/payments/${selectedBooking._id}`,
        paymentData,
        { withCredentials: true }
      );
      setSelectedBooking(response.data);
      setBookings(bookings.map((b) => (b._id === response.data._id ? response.data : b)));
      setPaymentData({
        amount: "",
        currency: "INR",
        method: "",
        transactionId: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
      });
      alert("Payment added successfully");
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Failed to add payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    if (!paymentData.method || paymentData.method.trim() === "") {
      alert("Please enter a payment method");
      return;
    }

    try {
      setPaymentLoading(true);
      const paymentId = selectedBooking.payments[paymentData.index]._id;
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/payments/${selectedBooking._id}/${paymentId}`,
        paymentData,
        { withCredentials: true }
      );
      setSelectedBooking(response.data);
      setBookings(bookings.map((b) => (b._id === response.data._id ? response.data : b)));
      setPaymentData({
        amount: "",
        currency: "INR",
        method: "",
        transactionId: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
      });
      alert("Payment updated successfully");
    } catch (err) {
      console.error("Error updating payment:", err);
      alert("Failed to update payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!selectedBooking) return;

    try {
      setCompleteLoading(true);
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/bookings/complete/${selectedBooking._id}`,
        { nextOffer: nextOfferData },
        { withCredentials: true }
      );
      setSelectedBooking(response.data.booking);
      setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
      alert("Booking marked as completed successfully");
    } catch (err) {
      console.error("Error marking booking as completed:", err);
      alert(err.response?.data?.message || "Failed to mark booking as completed. Please try again.");
    } finally {
      setCompleteLoading(false);
    }
  };


  const handleSendWhatsAppNotification = async (booking, payment, action) => {

    const response = await axios.get(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/whatsapp`, { withCredentials: true });
    const { pdfUrl } = response.data;
    try {
      const allPayments = booking.payments || [];
      const totalPaid = allPayments
        .filter(p => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const remaining = Math.max(0, (booking.totalAmount || 0) - totalPaid);

      const message = `
Payment Received Successfully

Dear ${booking.clientDetails.name},
"Khammaghani"
${booking.itineraryData?.tourcode ? `Tour Code: ${booking.itineraryData.tourcode}` : ""}
Package: ${booking.itineraryData?.titles?.[0] || "N/A"}
Travel Date: ${booking.clientDetails.travelDate || "N/A"}
Amount: ₹${Number(payment.amount || 0)}
Status: ${payment.status || "N/A"}
Method: ${payment.method || "N/A"}
Total Paid: ₹${totalPaid}
Remaining: ₹${remaining}
View Details: ${clientBase}/${booking.theme.link}/${booking._id},
Download PDF: ${pdfUrl}, 
Total Amount: ₹${booking.totalAmount || 0}
Thank you for your payment!
    `.trim();

      // Phone number format karein
      const rawPhone = booking.clientDetails?.phone || '';
      let phone = rawPhone.replace(/[^0-9]/g, '');

      if (phone) {
        if (phone.length === 10) {
          phone = `91${phone}`;
        } else if (phone.length === 11 && phone.startsWith('0')) {
          phone = `91${phone.slice(1)}`;
        }

        // WhatsApp link generate karein
        const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        // ✅ WhatsApp window open karein
        window.open(waLink, '_blank');

        alert('WhatsApp message opened in new tab!');
      } else {
        alert('No phone number found for this client.');
      }

    } catch (err) {
      console.error('Error sending WhatsApp notification:', err);
      alert('Failed to send WhatsApp notification.');
    }
  };

  const handleUpdateNextOffer = async () => {
    if (!selectedBooking) return;

    if (nextOfferData.value < 0) {
      alert("Offer value cannot be negative");
      return;
    }

    try {
      setOfferLoading(true);
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/bookings/update-offer/${selectedBooking._id}`,
        { nextOffer: nextOfferData },
        { withCredentials: true }
      );
      setSelectedBooking(response.data.booking);
      setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
      alert("Next offer updated successfully");
    } catch (err) {
      console.error("Error updating next offer:", err);
      alert(err.response?.data?.message || "Failed to update next offer. Please try again.");
    } finally {
      setOfferLoading(false);
    }
  };

  const handleMarkOfferAsUsed = async () => {
    if (!selectedBooking) return;

    try {
      setOfferUsedLoading(true);
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/bookings/use-offer/${selectedBooking._id}`,
        {},
        { withCredentials: true }
      );
      setSelectedBooking(response.data.booking);
      setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
      alert("Offer marked as used successfully");
    } catch (err) {
      console.error("Error marking offer as used:", err);
      alert(err.response?.data?.message || "Failed to mark offer as used. Please try again.");
    } finally {
      setOfferUsedLoading(false);
    }
  };

  const handleEditPayment = (payment, index) => {
    setPaymentData({ ...payment, index });
  };

  const handleWhatsApp = async (booking) => {
    try {
      const response = await axios.get(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/whatsapp`, { withCredentials: true });
      const { waLink } = response.data;
      window.open(waLink, '_blank');
    } catch (err) {
      console.error("Error generating WhatsApp link:", err);
      alert("Failed to generate WhatsApp link. Please check the phone number and try again.");
    }
  };

  const handleDownloadPDF = (booking) => {
    window.open(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/pdf/updated`, '_blank');
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setPaymentData({
      amount: "",
      currency: "INR",
      method: "",
      transactionId: "",
      mobileNumber: "",
      gateway: "",
      status: "pending",
      receiptUrl: "",
      screenshot: "",
      index: null,
    });
    setNextOfferData({ type: true, value: 0 });
    setNextPaymentPerc('30');
  };

  const closeViewModal = () => {
    setViewModal(null);
  };

  const isEligibleForCompletion = (booking) => {

    const parseDate = (dateStr) => {
      // dateStr expected format: "DD-MM-YYYY" ya "D-M-YYYY"
      const parts = dateStr.split(/[-/]/);
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // month 0-based
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    };

    // Usage:
    const travelDate = parseDate(booking.clientDetails.travelDate);
    const balanceAmount = calculateBalanceAmount(booking);
    const today = new Date();

    const durationDays = booking.itineraryData?.days?.length || parseInt(booking.selectedItinerary?.duration) || 0;
    const diffTime = today - travelDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log("Balance Amount:", balanceAmount);
    console.log("Booking Status:", booking.status);
    console.log("Today:", today);
    console.log("Travel Date:", travelDate);
    console.log("Duration Days:", durationDays);
    console.log("Diff Days:", diffDays);


    return balanceAmount === 0 && booking.status === "Booked" && diffDays >= durationDays;
  };

  const isEligibleForCompletionOffer = (booking) => {
    const balanceAmount = calculateBalanceAmount(booking);
    const today = new Date();
    const travelDate = new Date(booking.clientDetails.travelDate);
    const durationDays = booking.itineraryData?.days?.length || parseInt(booking.selectedItinerary?.duration) || 0;
    const diffTime = today - travelDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return balanceAmount === 0 && booking.status === "completed" && diffDays >= durationDays;
  };

  // Helper function - Payment details
  const getPaymentDetails = (booking) => {
    const totalPaid = booking?.payments?.filter(p => p.status === "success")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const totalAmount = Number(booking?.totalAmount || 0);
    const balance = totalAmount - totalPaid;
    const paidPercentage = totalAmount > 0
      ? ((totalPaid / totalAmount) * 100).toFixed(2)
      : 0;
    const hasPayment = totalPaid > 0;
    const isFullyPaid = Number(paidPercentage) === 100;
    return {
      totalPaid,
      balance,
      totalAmount,
      paidPercentage,
      hasPayment,
      isFullyPaid
    };
  };

  // ✅ NEW: Calculate expected amount based on total percentage
  const calculateExpectedAmount = (booking, percentage) => {
    const { totalAmount } = getPaymentDetails(booking);
    return ((totalAmount * percentage) / 100).toFixed(2);
  };

  // ✅ MAIN: Amount calculation - TOTAL ka percentage + previous shortage
  const calculateNextPaymentAmount = (booking, currentPercentage) => {
    const { totalAmount, totalPaid } = getPaymentDetails(booking);
    const plan = booking.paymentPercentages || [20, 30, 50];
    const current = Number(currentPercentage);
    const index = plan.indexOf(current);
    const prevPercent = plan.slice(0, index).reduce((a, b) => a + b, 0);
    const prevExpected = (totalAmount * prevPercent) / 100;
    const currentExpected = (totalAmount * current) / 100;
    const previousShortage = Math.max(0, prevExpected - totalPaid);
    // ⭐ Addons only on 50%
    let addonAdvance = 0;
    if (current === 50) {
      const addonTotal = booking.addons?.reduce((s, a) => s + (a.value || 0), 0) || 0;
      addonAdvance = addonTotal; // full addon OR 50%? you choose
    }
    return (currentExpected + previousShortage + addonAdvance).toFixed(2);
  };

  // Calculate End Date from itinerary days length
  const calculateEndDate = (startDateStr, totalDays) => {
    if (!startDateStr || !totalDays) return "TBC";
    const parts = startDateStr.split("-");
    if (parts.length !== 3) return "TBC";
    const [day, month, yearStr] = parts;
    let year = parseInt(yearStr, 10);
    if (year < 100) year += 2000;
    const startDate = new Date(year, month - 1, day);
    if (isNaN(startDate.getTime())) return "TBC";
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (totalDays - 1)); // -1 because Day 1 is included
    return endDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Date parsing helper for rendering (updated to handle YY)
  const parseDateForDisplay = (rawDate) => {
    if (!rawDate) return "N/A";
    let dateObj;
    // Try ISO first (e.g., 2025-10-08)
    if (!isNaN(Date.parse(rawDate))) {
      dateObj = new Date(rawDate);
    } else {
      // Try DD-MM-YY or DD-MM-YYYY manually
      const parts = rawDate.split("-");
      if (parts.length === 3) {
        const [dd, mm, yyyyStr] = parts;
        let yyyy = parseInt(yyyyStr, 10);
        // Handle YY (e.g., 25 -> 2025)
        if (yyyy < 100) {
          yyyy += 2000;
        }
        dateObj = new Date(yyyy, mm - 1, dd);
      }
    }
    // Validate date
    if (!dateObj || isNaN(dateObj.getTime())) return "N/A";
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const payments = getPaymentDetails(selectedBooking);

  // WhatsApp Handler - Updated with templates
  const handleSendNextPaymentWhatsApp = async () => {
    if (!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0) {
      alert("Please enter a valid percentage");
      return;
    }
    const perc = parseFloat(nextPaymentPerc);
    const paymentDetails = getPaymentDetails(selectedBooking);
    const totalDays = selectedBooking.itineraryData?.days?.length || parseInt(selectedBooking.selectedItinerary?.duration) || 0;
    const startDate = parseDateForDisplay(selectedBooking.clientDetails.travelDate);
    const endDate = calculateEndDate(selectedBooking.clientDetails.travelDate, totalDays);
    const tripDates = totalDays > 0 ? `${startDate} – ${endDate}` : startDate;
    const packageName = selectedBooking.itineraryData?.titles?.[0] || "N/A";
    const bookingId = selectedBooking.bookingId || selectedBooking._id.slice(-5);
    const name = selectedBooking.clientDetails.name;
    const paymentLink = `https://tour.rajasthantouring.in/userpayment/${selectedBooking._id}?tab=final`;
    let message = "";
    if (perc === 20) {
      // Initial confirmation/reminder for 20%
      message = `Rajasthan Trip – Booking & Payment Confirmation
Dear ${name},
"Khammaghani"
Thank you for your 20% advance payment. Your booking is confirmed!
Confirmation No.: ${bookingId}
Payment Schedule:
• 20% – Received
• 30% – At hotel confirmation & voucher issuance
• 50% – On arrival (Day 1) in cash
We’ve started processing your hotel bookings and will share the confirmation vouchers soon.
Trip Dates: ${tripDates}
Package: ${packageName}
If you need any help, feel free to contact us anytime.
Rajasthan Touring`;
    } else if (perc === 30) {
      // Second part payment request
      message = `Rajasthan Trip – 2nd Payment Request
Dear ${name},
"Khammaghani"
We hope you received the hotel confirmation vouchers shared with you.
As per the payment schedule, we kindly request you to please process the 30% second payment for your Rajasthan trip.
Confirmation No.: ${bookingId}
Payment Terms:
• 20% – Advance (Received)
• 30% – Due now (Hotel Confirmation Stage)
• 50% – On Arrival (Day 1, in cash)
Thank you for your cooperation. Please share the payment confirmation once completed.
Rajasthan Touring`;
      message += `\n\nPay Now: ${paymentLink}`;
    } else if (perc === 50) {
      // Final payment reminder (cash, no link)
      message = `Rajasthan Trip – Final Payment Reminder
Dear ${name},
"Khammaghani"
Your Rajasthan trip is just 2 days away! We hope you’re excited for the journey.
As per the payment schedule, we kindly remind you that the remaining 50% final payment is due in cash upon arrival. Our representative will meet you at your hotel to collect the payment.
Confirmation No.: ${bookingId}
Payment Status:
• 20% – Advance (Received)
• 30% – Voucher Payment (Received)
• 50% – Final Payment – Due in cash on arrival
Please have the final amount ready for a smooth check-in and travel experience. For any assistance, feel free to contact us anytime.
Rajasthan Touring`;
    } else {
      alert("Please use 20, 30, or 50 for the percentage.");
      return;
    }
    const rawPhone = selectedBooking.clientDetails?.phone || '';
    let phone = rawPhone.replace(/[^0-9]/g, '');
    if (phone) {
      if (phone.length === 10) {
        phone = `91${phone}`;
      } else if (phone.length === 11 && phone.startsWith('0')) {
        phone = `91${phone.slice(1)}`;
      }
      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waLink, '_blank');
      alert('WhatsApp message opened in new tab!');
    } else {
      alert('No phone number found for this client.');
    }
  };

  // Email Handler - Updated with templates
  const handleSendNextPaymentEmail = async () => {
    if (!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0) {
      alert("Please enter a valid percentage");
      return;
    }
    const perc = parseFloat(nextPaymentPerc);
    const paymentDetails = getPaymentDetails(selectedBooking);
    const totalDays = selectedBooking.itineraryData?.days?.length || parseInt(selectedBooking.selectedItinerary?.duration) || 0;
    const startDate = parseDateForDisplay(selectedBooking.clientDetails.travelDate);
    const endDate = calculateEndDate(selectedBooking.clientDetails.travelDate, totalDays);
    const tripDates = totalDays > 0 ? `${startDate} – ${endDate}` : startDate;
    const packageName = selectedBooking.itineraryData?.titles?.[0] || "N/A";
    const bookingId = selectedBooking.bookingId || selectedBooking._id.slice(-5);
    const name = selectedBooking.clientDetails.name;
    const paymentLink = `https://tour.rajasthantouring.in/userpayment/${selectedBooking._id}?tab=final`;
    let emailBody = "";
    let subject = "";
    if (perc === 20) {
      // Initial confirmation
      subject = `Rajasthan Trip – Booking & Payment Confirmation`;
      emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – Booking & Payment Confirmation</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>Thank you for your 20% advance payment. Your booking is confirmed!</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Schedule</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Received</li>
                <li>30% – At hotel confirmation & voucher issuance</li>
                <li>50% – On arrival (Day 1) in cash</li>
            </ul>
        </div>
        <p>We’ve started processing your hotel bookings and will share the confirmation vouchers soon.</p>
        <p>If you need any help, feel free to contact us anytime.</p>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
    } else if (perc === 30) {
      // Second part
      subject = `Rajasthan Trip – 2nd Payment Request`;
      emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – 2nd Payment Request</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>We hope you received the hotel confirmation vouchers shared with you.</p>
        <p>As per the payment schedule, we kindly request you to please process the 30% second payment for your Rajasthan trip.</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Terms</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Advance (Received)</li>
                <li>30% – Due now (Hotel Confirmation Stage)</li>
                <li>50% – On Arrival (Day 1, in cash)</li>
            </ul>
        </div>
        <p>Thank you for your cooperation. Please share the payment confirmation once completed.</p>
        <div style="text-align:center;">
            <a href="${paymentLink}" style="color:white;background:#007bff;padding:12px 20px;border-radius:5px;text-decoration:none;">Click Here to Pay</a>
        </div>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
    } else if (perc === 50) {
      // Final
      subject = `Rajasthan Trip – Final Payment Reminder`;
      emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – Final Payment Reminder</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>Your Rajasthan trip is just 2 days away! We hope you’re excited for the journey.</p>
        <p>As per the payment schedule, we kindly remind you that the remaining 50% final payment is due in cash upon arrival. Our representative will meet you at your hotel to collect the payment.</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Status</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Advance (Received)</li>
                <li>30% – Voucher Payment (Received)</li>
                <li>50% – Final Payment – Due in cash on arrival</li>
            </ul>
        </div>
        <p>Please have the final amount ready for a smooth check-in and travel experience. For any assistance, feel free to contact us anytime.</p>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
    } else {
      alert("Please use 20, 30, or 50 for the percentage.");
      return;
    }
    const emailData = {
      to: selectedBooking.clientDetails.email,
      subject: subject,
      html: emailBody,
    };
    setIsSending(true);
    try {
      await axios.post(
        `https://apitour.rajasthantouring.in/api/bookings/${selectedBooking._id}/send-next-payment-email`,
        emailData
      );
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email. Please try again.");
    }
    setIsSending(false)
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full mx-auto px-2">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">


              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === "pending"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Regular Itinerary Payment
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === "payments"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Final Itinerary Payment
                </button>

              </div>
            </div>


          </div>
        </div>
      </div>

      <div className="">
        {activeTab === "payments" ? (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
              <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="md:text-2xl text-lg font-bold text-blue-600">Final Itinerary Payment</h1>
                      {/* <p className="text-sm text-gray-500">{filteredBookings.length} bookings found</p> */}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Filter size={16} />
                    Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="min-w-full overflow-x-auto  px-4 sm:px-6 lg:px-8 py-8">
              {showFilters && (
                <div className=" min-w-full bg-white rounded-xl shadow-sm border mb-6 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
                      Clear all
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <div className=" min-w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Search bookings..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange("status", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="Booked">Booked</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <select
                          value={filters.paymentStatus}
                          onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Payments</option>
                          <option value="paid">Fully Paid</option>
                          <option value="partial">Partially Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
                        <input
                          type="date"
                          value={filters.date}
                          onChange={(e) => handleFilterChange("date", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input
                          type="date"
                          value={filters.paymentDate}
                          onChange={(e) => handleFilterChange("paymentDate", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto max-w-full">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Travel Date
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking Status
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payments
                        </th>

                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBookings.filter((booking) => {
                        return booking.payments && booking.payments.some(p => p.status === "success");
                      })
                        // Filter 2: Sirf "Booked" status wale dikhao
                        .filter((booking) => booking.status?.toLowerCase() === "booked" || booking.status?.toLowerCase() === "cancel")
                        // Sort: Latest payment ke hisaab se (newest first)
                        .sort((a, b) => {
                          const latestPaymentA = a.payments
                            ?.filter(p => p.status === "success")
                            .sort((x, y) => new Date(y.paymentDate || y.createdAt) - new Date(x.paymentDate || x.createdAt))[0];

                          const latestPaymentB = b.payments
                            ?.filter(p => p.status === "success")
                            .sort((x, y) => new Date(y.paymentDate || y.createdAt) - new Date(x.paymentDate || x.createdAt))[0];

                          if (!latestPaymentA) return 1;
                          if (!latestPaymentB) return -1;

                          return new Date(latestPaymentB.paymentDate || latestPaymentB.createdAt) -
                            new Date(latestPaymentA.paymentDate || latestPaymentA.createdAt);
                        }).map((booking) => (
                          <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">#{booking.bookingId || booking?._id?.slice(-5)}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {(booking.itineraryData?.titles?.[0] || "N/A").length > 20
                                    ? booking.itineraryData.titles[0].slice(0, 20) + "..."
                                    : booking.itineraryData?.titles?.[0] || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full flex-shrink-0">
                                  <User size={14} className="text-blue-600 sm:w-4 sm:h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{booking.clientDetails.name}</div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate">{booking.clientDetails.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-900">{booking.clientDetails.travelDate}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">
                                  Balance: ₹{calculateBalanceAmount(booking).toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <PaymentStatusBadge booking={booking} />
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              {booking.payments?.length > 0 ? (
                                <div className="space-y-1">
                                  {booking.payments.slice(0, 2).map((payment, index) => (
                                    <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
                                      ₹{payment.amount} ({payment.status})
                                    </div>
                                  ))}
                                  {booking.payments.length > 2 && (
                                    <div className="text-xs text-gray-500">+{booking.payments.length - 2} more</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-500">No payments</span>
                              )}
                            </td>

                            <td className="px-3 sm:px-6 py-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <button
                                  onClick={() => setViewModal(booking)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors w-full sm:w-auto"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => navigate(`/Paymentdetailsfull/${booking._id}`)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors w-full sm:w-auto"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors w-full sm:w-auto"
                                >
                                  <Settings size={16} />
                                </button>
                                <button
                                  onClick={() => handleWhatsApp(booking)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors w-full sm:w-auto"
                                  title="Send WhatsApp Message"
                                >
                                  <FontAwesomeIcon icon={faWhatsapp} size="lg" className="text-green-600" />
                                </button>

                                <button
                                  onClick={() => handleDownloadPDF(booking)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors w-full sm:w-auto"
                                  title="Download PDF"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {selectedBooking && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Manage Payments</h2>
                      <p className="text-sm text-gray-500">
                        Booking #{selectedBooking._id.slice(-5)} - {selectedBooking.clientDetails.name}
                      </p>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6">
                    {selectedBooking.status === "completed" ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                        <AlertCircle className="inline-block h-6 w-6 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 font-medium">
                          This booking is completed and cannot be modified except for Next Offer.
                        </span>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                          <input
                            type="number"
                            name="amount"
                            value={paymentData.amount}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter amount"
                            required
                            disabled={selectedBooking.status === "completed" || paymentData.index !== null}
                            readOnly={paymentData.index !== null}
                          />
                          {paymentData.index !== null && (
                            <p className="text-xs text-gray-500 mt-1">Amount cannot be edited for existing payments</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                          <input
                            type="text"
                            name="method"
                            value={paymentData.method}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Credit Card, UPI, Bank Transfer"
                            disabled={selectedBooking.status === "completed"}
                          />
                        </div>
                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number (UPI)</label>
                          <input
                            type="tel"
                            name="mobileNumber"
                            value={paymentData.mobileNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Only digits
                              if (value.length <= 10) {
                                setPaymentData({ ...paymentData, mobileNumber: value });
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            disabled={selectedBooking.status === "completed"}
                          />

                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                          <input
                            type="text"
                            name="transactionId"
                            value={paymentData.transactionId}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Transaction reference number"
                            disabled={selectedBooking.status === "completed"}
                          />
                        </div> */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                          <input
                            type="text"
                            name="gateway"
                            value={paymentData.gateway}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Razorpay, Stripe, PayPal"
                            disabled={selectedBooking.status === "completed"}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            name="status"
                            value={paymentData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={selectedBooking.status === "completed"}
                          >
                            <option value="pending">Pending</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                          <input
                            type="url"
                            name="receiptUrl"
                            value={paymentData.receiptUrl}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/receipt"
                            disabled={selectedBooking.status === "completed"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
                          <div className="flex items-center gap-3">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Upload size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-600">Choose file</span>
                              </div>
                              <input
                                type="file"
                                name="screenshot"
                                accept="image/jpeg,image/png"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={selectedBooking.status === "completed"}
                              />
                            </label>
                            {paymentData.screenshot && (
                              <img
                                src={paymentData.screenshot || "/placeholder.svg"}
                                alt="Screenshot Preview"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        </div>
                        <div className="pt-4">
                          <button
                            onClick={paymentData.index !== null ? handleUpdatePayment : handleAddPayment}
                            disabled={paymentLoading || selectedBooking.status === "completed"}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                          >
                            {paymentLoading
                              ? paymentData.index !== null
                                ? "Updating..."
                                : "Processing..."
                              : paymentData.index !== null
                                ? "Update Payment"
                                : "Add Payment"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isEligibleForCompletionOffer(selectedBooking) && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Offer</h3>
                        {selectedBooking.nextOffer.used === "used" ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <AlertCircle className="inline-block h-6 w-6 text-red-600 mr-2" />
                            <span className="text-red-800 font-medium">
                              This offer has been used and cannot be modified.
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Active</label>
                              <input
                                type="checkbox"
                                name="type"
                                checked={nextOfferData.type}
                                onChange={handleNextOfferChange}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                              />
                              <span className="ml-2 text-sm text-gray-600">
                                {nextOfferData.type ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Value (%)</label>
                              <input
                                type="number"
                                name="value"
                                value={nextOfferData.value}
                                onChange={handleNextOfferChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter offer value"
                                min="0"
                                disabled={selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                              />
                            </div>
                          </div>
                        )}
                        <div className="pt-4 flex gap-4">
                          <button
                            onClick={handleUpdateNextOffer}
                            disabled={offerLoading || selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                          >
                            {offerLoading ? "Processing..." : "Update Next Offer"}
                          </button>
                          {selectedBooking.nextOffer.used !== "used" && (
                            <button
                              onClick={handleMarkOfferAsUsed}
                              disabled={offerUsedLoading || selectedBooking.nextOffer.value === 0}
                              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
                            >
                              {offerUsedLoading ? "Processing..." : "Mark Offer as Used"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {isEligibleForCompletion(selectedBooking) && (
                      <div className="mb-6">
                        <button
                          onClick={handleMarkAsCompleted}
                          disabled={completeLoading}
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                        >
                          {completeLoading ? "Processing..." : "Mark Booking as Completed"}
                        </button>
                      </div>
                    )}

                    {/* NEW: Send Next Payment Reminder Section (Integrated from BookingsTable) */}
                    <div className="mb-6 border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Next Payment Reminder</h3>
                      <div className="space-y-4">
                        {/* Payment Status Card */}
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-4">
                          <div className="grid grid-cols-4 gap-4">
                            {/* Total Amount */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                              <p className="text-xl font-bold text-gray-900">
                                ₹{getPaymentDetails(selectedBooking).totalAmount.toLocaleString()}
                              </p>
                            </div>
                            {/* Already Paid */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase">Already Paid</p>
                              <p className="text-xl font-bold text-green-700">
                                ₹{getPaymentDetails(selectedBooking).totalPaid.toLocaleString()}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                ({getPaymentDetails(selectedBooking).paidPercentage}%)
                              </p>
                            </div>
                            {/* Balance Remaining */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase">Balance Remaining</p>
                              <p className="text-xl font-bold text-orange-700">
                                ₹{getPaymentDetails(selectedBooking).balance.toLocaleString()}
                              </p>
                              <p className="text-xs text-orange-600 font-medium">
                                ({(100 - parseFloat(getPaymentDetails(selectedBooking).paidPercentage)).toFixed(2)}%)
                              </p>
                            </div>
                            {/* Payment Status */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                              {/* FULLY PAID */}
                              {payments.isFullyPaid ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-semibold text-green-700">Fully Paid</span>
                                </div>
                              ) : payments.hasPayment ? (
                                // PARTIAL PAID
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                                  <span className="text-sm font-semibold text-yellow-700">Partial Paid</span>
                                </div>
                              ) : (
                                // UNPAID
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                  <span className="text-sm font-semibold text-red-700">Unpaid</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Payment History (अगर कोई payment किया है तो दिखाएंगे) */}
                        {getPaymentDetails(selectedBooking).hasPayment && selectedBooking.payments?.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 mb-2">Previous Payments:</p>
                            <div className="space-y-1">
                              {selectedBooking.payments
                                .filter(p => p.status === "success")
                                .map((payment, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-blue-700">Payment {idx + 1}:</span>
                                    <span className="font-semibold text-blue-900">
                                      ₹{Number(payment.amount).toLocaleString()} (${((payment.amount / selectedBooking.totalAmount) * 100).toFixed(1)}%)
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        {/* Custom Percentage Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Custom Percentage (20/30/50)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Enter percentage"
                              value={nextPaymentPerc}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                  setNextPaymentPerc(val);
                                }
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              max="100"
                            />
                            <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                              %
                            </span>
                          </div>
                        </div>
                        {/* Final Amount Preview - UPDATED */}
                        {nextPaymentPerc && parseFloat(nextPaymentPerc) > 0 && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                            <div className="space-y-3">
                              {/* Calculation Breakdown */}
                              <div className="space-y-2 pb-3 border-b border-green-200">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Total Booking Amount:</span>
                                  <span className="font-semibold text-gray-900">
                                    ₹{getPaymentDetails(selectedBooking).totalAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Current Payment (${nextPaymentPerc}% of Total):</span>
                                  <span className="font-semibold text-gray-900">
                                    ₹{calculateExpectedAmount(selectedBooking, nextPaymentPerc)}
                                  </span>
                                </div>
                                {/* Show shortage if exists */}
                                {(() => {
                                  const expectedOnly = parseFloat(calculateExpectedAmount(selectedBooking, nextPaymentPerc));
                                  const totalDue = parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc));
                                  const shortage = (totalDue - expectedOnly).toFixed(2);
                                  return parseFloat(shortage) > 0 ? (
                                    <div className="flex justify-between bg-red-50 -mx-2 px-2 py-1 rounded">
                                      <span className="text-sm text-red-700 font-medium">+ Previous Shortage:</span>
                                      <span className="font-semibold text-red-700">
                                        ₹{parseFloat(shortage).toLocaleString()}
                                      </span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                              {/* Final Amount */}
                              <div className="flex justify-between items-center pt-2 bg-green-100 -mx-2 px-2 py-3 rounded">
                                <span className="text-lg font-bold text-gray-900">
                                  Total Amount to Request:
                                </span>
                                <span className="text-3xl font-bold text-green-700">
                                  ₹{calculateNextPaymentAmount(selectedBooking, nextPaymentPerc)}
                                </span>
                              </div>
                              {parseFloat(nextPaymentPerc) === 50 && selectedBooking.addons?.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                  <h3 className="text-sm font-medium text-blue-900 mb-2">🎁 Add-ons</h3>
                                  {selectedBooking.addons.map((a, i) => (
                                    <div key={i} className="flex justify-between text-xs py-1 border-b border-blue-200 last:border-b-0">
                                      <span className="text-blue-700">{a.title}</span>
                                      <span className="font-semibold text-blue-900">₹{a.value.toLocaleString()}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-sm font-bold text-blue-900 mt-2 pt-2 border-t border-blue-300">
                                    <span>Total Add-ons:</span>
                                    <span>₹{
                                      selectedBooking.addons.reduce((sum, a) => sum + (a.value || 0), 0
                                      ).toLocaleString()}</span>
                                  </div>
                                </div>
                              )}
                              {/* Remaining balance */}
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                                <span className="text-sm font-bold text-orange-600">
                                  ₹{(
                                    getPaymentDetails(selectedBooking).balance -
                                    parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc))
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Send Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSendNextPaymentWhatsApp}
                            disabled={!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0}
                            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FontAwesomeIcon icon={faWhatsapp} />
                            Send WhatsApp
                          </button>
                          <button
                            onClick={handleSendNextPaymentEmail}
                            disabled={isSending || !nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0}
                            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700
               transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
                          >
                            {isSending ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                                  ></path>
                                </svg>
                                Sending…
                              </>
                            ) : (
                              "Send Email"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                              {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th> */}

                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedBooking.payments?.map((payment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{payment.method || "N/A"}</td>
                                {/* <td className="px-4 py-3 text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td> */}
                                <td className="px-4 py-3">
                                  <StatusBadge status={payment.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  {payment.receiptUrl ? (
                                    <a
                                      href={payment.receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 text-sm"
                                    >
                                      View Receipt
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-sm">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {payment.screenshot ? (
                                    <img
                                      src={payment.screenshot || "/placeholder.svg"}
                                      alt="Payment screenshot"
                                      className="w-12 h-12 object-cover rounded cursor-pointer"
                                      onClick={() => setPreviewImage(payment.screenshot)}
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-sm">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEditPayment(payment, index)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      disabled={selectedBooking.status === "completed"}
                                    >
                                      <Edit size={12} />

                                    </button>

                                    {/* ✅ YEH WHATSAPP BUTTON ADD KARO */}
                                    <button
                                      onClick={() => handleSendWhatsAppNotification(selectedBooking, payment, "updated")}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                      title="Send WhatsApp Notification"
                                    >
                                      <FontAwesomeIcon icon={faWhatsapp} size="lg" className="text-green-600" />

                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                      <p className="text-sm text-gray-500">#{viewModal._id.slice(-5)}</p>
                    </div>
                    <button onClick={closeViewModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Booking ID</span>
                              <span className="text-sm font-medium text-gray-900">#{viewModal._id.slice(-5)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Itinerary Title</span>
                              <span className="text-sm font-medium text-gray-900">
                                {viewModal.itineraryData?.titles?.[0] || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Travel Date</span>
                              <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.travelDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Status</span>
                              <StatusBadge status={viewModal.status} />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Next Offer</span>
                              <span className="text-sm font-medium text-gray-900">
                                {viewModal.nextOffer
                                  ? `${viewModal.nextOffer.type ? "Active" : "Inactive"}, Value: %${viewModal.nextOffer.value}${viewModal.nextOffer.used === "used" ? " (Used)" : ""
                                  }`
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Name</span>
                              <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Email</span>
                              <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Phone</span>
                              <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.phone || viewModal.clientDetails.mobile}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Total Amount</span>
                              <span className="text-sm font-medium text-gray-900">
                                ₹{viewModal.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Balance Amount</span>
                              <span className="text-sm font-medium text-gray-900">
                                ₹{calculateBalanceAmount(viewModal).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Payment Status</span>
                              <PaymentStatusBadge booking={viewModal} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                      {viewModal.payments?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {viewModal.payments.map((payment, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{payment.method || "N/A"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td>
                                  <td className="px-4 py-3">
                                    <StatusBadge status={payment.status} />
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {payment.receiptUrl ? (
                                      <a
                                        href={payment.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                      >
                                        View Receipt
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 text-sm">N/A</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {payment.screenshot ? (
                                      <img
                                        src={payment.screenshot || "/placeholder.svg"}
                                        alt="Payment screenshot"
                                        className="w-12 h-12 object-cover rounded cursor-pointer"
                                        onClick={() => setPreviewImage(payment.screenshot)}
                                      />
                                    ) : (
                                      <span className="text-gray-400 text-sm">N/A</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p>No payments recorded yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewImage && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="relative max-w-4xl w-full">
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt="Payment screenshot preview"
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
              </div>
            )}


          </div>
        ) :
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
           
            <div className="p-6 min-h-screen">
              <Pendingopration />
            </div>
          </div>}
      </div>

    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      color: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: Clock,
      dot: "bg-blue-400",
    },
    booked: {
      color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: Check,
      dot: "bg-emerald-400",
    },
    completed: {
      color: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: CheckCircle,
      dot: "bg-blue-400",
    },
    success: {
      color: "bg-green-50 text-green-700 border border-green-200",
      icon: FaRupeeSign,
      dot: "bg-green-500",
    },
    paymentsuccess: {
      color: "bg-green-50 text-green-700 border border-green-200",
      icon: FaRupeeSign,
      dot: "bg-green-500",
    },

    // 🔴 NEW → Cancel Status
    cancel: {
      color: "bg-red-50 text-red-700 border border-red-200",
      icon: XCircle,
      dot: "bg-red-500",
    },
    cancelled: {
      color: "bg-red-50 text-red-700 border border-red-200",
      icon: XCircle,
      dot: "bg-red-500",
    },
    canceled: {
      color: "bg-red-50 text-red-700 border border-red-200",
      icon: XCircle,
      dot: "bg-red-500",
    },

    failed: {
      color: "bg-red-50 text-red-700 border border-red-200",
      icon: CheckCircle,
      dot: "bg-red-500",
    },
  };

  const normalizedStatus = status?.toLowerCase?.() || "pending";
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      <Icon size={12} />
      <span className="capitalize">{status}</span>
    </div>
  );
};


const PaymentStatusBadge = ({ booking }) => {
  const balanceAmount = calculateBalanceAmount(booking);
  let status, color, icon, dot;

  if (balanceAmount === 0) {
    status = "Fully Paid";
    color = "bg-blue-50 text-blue-700 border border-blue-200";
    icon = Check;
    dot = "bg-blue-400";
  } else if (balanceAmount === booking.totalAmount) {
    status = "Unpaid";
    color = "bg-red-50 text-red-700 border border-red-200";
    icon = XCircle;
    dot = "bg-red-400";
  } else {
    status = "Partial";
    color = "bg-orange-50 text-orange-700 border border-orange-200";
    icon = AlertCircle;
    dot = "bg-orange-400";
  }

  const Icon = icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
      <div className={`w-2 h-2 rounded-full ${dot}`}></div>
      <Icon size={12} />
      <span>{status}</span>
    </div>
  );
};

export default Payment;