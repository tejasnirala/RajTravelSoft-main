import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faEnvelope,
  faPlus,
  faUndo,
  faTimes,
  faBroom,
  faSpinner,
  faTimesCircle,
  faGift,
  faDownload,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { faEye } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import Viewdata5 from '../itenery/Viewdata2';
import SendUser from './Senduserviewdata5';
import Senduserviewdata4 from './Senduserviewdata4';
import Senduserviewdata3 from './SenduserViewdata3';
import Senduserviewdata2 from './SenduserViewdata2';
import Senduserviewdata from './SenduserViewdata';
import Senduserviewdata5 from './Senduserviewdata5';
import axios from 'axios'; // Add axios for API calls
import { Upload, Check, Clock, AlertCircle, XCircle, CheckCircle, FileText, Edit as EditIcon, MessageCircle, Download as DownloadIcon, CreditCard, User, Calendar, X } from 'lucide-react'; // Add Lucide icons for better UI
import { FaRupeeSign } from 'react-icons/fa'; // For rupee icon
import { Table, Pagination as AntPagination } from 'antd'; // Add Ant Design Table and Pagination import


const cleanHotels = (hotels) => {
  if (!hotels) return hotels;
  const cleaned = {};
  for (const day in hotels) {
    cleaned[day] = {};
    const dayData = hotels[day];
    const locationsData =
      dayData && dayData.id && typeof dayData.id === 'object' && Object.keys(dayData).length === 1
        ? dayData.id
        : dayData;
    for (const location in locationsData) {
      const locData = locationsData[location];
      cleaned[day][location] = {};
      const idData = locData.id;
      if (idData && typeof idData === 'object') {
        for (const meal in idData) {
          const mealData = Array.isArray(idData[meal])
            ? idData[meal][0] || {}
            : idData[meal] || {};
          cleaned[day][location][meal] = mealData;
        }
      }
      for (const key in locData) {
        if (['breakfast', 'lunch', 'dinner'].includes(key) && !cleaned[day][location][key]) {
          cleaned[day][location][key] = Array.isArray(locData[key])
            ? locData[key][0] || {}
            : locData[key] || {};
        }
      }
      for (const meal of ['breakfast', 'lunch', 'dinner']) {
        const m = cleaned[day][location][meal];
        if (
          !m ||
          !Object.keys(m).length ||
          m.name === 'Invalid Hotel ID' ||
          m.category === 'N/A' ||
          m.location === 'N/A'
        ) {
          delete cleaned[day][location][meal];
        }
      }
    }
  }
  return cleaned;
};
const formatToISO = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};
const ViewPending = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);
  const [emailLoading, setEmailLoading] = useState({}); // Object to track per booking email loading
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'trash'
  const [selectedStatus, setSelectedStatus] = useState('all'); // Filter by status: 'all', 'pending', 'Booked', etc.
  const [selectedCreator, setSelectedCreator] = useState('all'); // New: Filter by creator
  const [fromDate, setFromDate] = useState('');
  const [bookingIdSearch, setBookingIdSearch] = useState('');
  const [toDate, setToDate] = useState(''); // Fixed: was missing useState
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [festivalBookingId, setFestivalBookingId] = useState(null);
  const [festivalTitle, setFestivalTitle] = useState('');
  const [festivalPercentage, setFestivalPercentage] = useState(0);
  const itemsPerPage = 10;
  const [selectedBooking, setSelectedBooking] = useState(null); // Changed: Now store full booking for theme access
  const [triggerDownload, setTriggerDownload] = useState(false);
  // New states for Payment Management (mirroring Payment.jsx)
  const [selectedPending, setSelectedPending] = useState(null); // Selected pending for payment modal
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  console.log(selectedBooking, triggerDownload);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate()
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchAllBookings();
  }, [viewMode, user]);
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.map((cat) => cat.name.toLowerCase()));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(['standard', 'budget', 'deluxe', 'premium', 'luxury']);
    }
  };
  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      // Pass user ID and role for non-admins, or just mode if user is null
      const query = user
        ? user.role !== 'admin'
          ? `mode=${viewMode}&createdBy=${user._id}&role=${user.role}`
          : `mode=${viewMode}&role=${user.role}`
        : `mode=${viewMode}`; // Fallback when user is null
      console.log(user, query);
      const response = await fetch(`https://apitour.rajasthantouring.in/api/pending?${query}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      let data = await response.json();
      if (viewMode === 'trash') {
        data = data.filter((booking) => booking.isDeleted === true);
      } else {
        data = data.filter((booking) => booking.isDeleted !== true);
      }
      // Sort by createdAt descending (latest first)
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllBookings(data);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  console.log(allBookings);
  // Filter bookings based on status, creator, and date range
  const getFilteredBookings = () => {
    let filtered = [...allBookings];
    // Apply status filter (only for pending mode)
    if (viewMode !== 'trash' && selectedStatus !== 'all') {
      filtered = filtered.filter((booking) => booking.status === selectedStatus);
    }
    // New: Apply creator filter (only for pending mode)
    if (viewMode !== 'trash' && selectedCreator !== 'all') {
      filtered = filtered.filter((booking) => booking.createby?.name === selectedCreator);
    }

    // New: Apply Booking ID filter
    if (bookingIdSearch.trim()) {
      const searchTerm = bookingIdSearch.toLowerCase();
      filtered = filtered.filter((booking) => {
        const bookingId = (booking.bookingId || booking._id || '').toLowerCase();
        return bookingId.includes(searchTerm);
      });
    }

    // Apply date filter
    if (fromDate || toDate) {
      filtered = filtered.filter((booking) => {
        const travelDate = booking.clientDetails?.travelDate;
        const travelISO = formatToISO(travelDate);
        if (!travelISO) return false;
        const fromISO = fromDate;
        const toISO = toDate;
        if (fromISO && toISO) {
          return travelISO >= fromISO && travelISO <= toISO;
        } else if (fromISO) {
          return travelISO >= fromISO;
        } else if (toISO) {
          return travelISO <= toISO;
        }
        return true;
      });
    }
    return filtered;
  };
  const filteredBookings = getFilteredBookings();
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredBookings.length]); // Reset to first page when filters change
  // Pagination logic for AntD
  const tablePagination = {
    current: currentPage,
    total: filteredBookings.length,
    pageSize: itemsPerPage,
    onChange: (page) => setCurrentPage(page),
    showSizeChanger: false,
    showQuickJumper: false,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  };
  // Get unique statuses from all bookings (for pending mode only)
  const uniqueStatuses = viewMode === 'trash'
    ? []
    : [...new Set(allBookings.map(b => b.status))];
  // New: Get unique creators from all bookings (for pending mode only)
  const uniqueCreators = viewMode === 'trash'
    ? []
    : [...new Set(allBookings.map(b => b.createby?.name).filter(Boolean))];
  const getStatusClassName = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border px-2 py-1 rounded font-semibold";
      case "created":
        return "bg-green-100 text-green-700 border px-2 py-1 rounded font-semibold";
      case "cancelled":
        return "bg-red-100 text-red-700 border border-red-400 px-2 py-1 rounded font-semibold";
      case "completed":
        return "bg-blue-100 text-blue-700 border border-blue-400 px-2 py-1 rounded font-semibold";
      case "confirmed":
        return "bg-purple-100 text-purple-700 border border-purple-400 px-2 py-1 rounded font-semibold";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-300 px-2 py-1 rounded font-medium";
    }
  };
  const [loadings, setLoadings] = useState(true);
  const fetchUser = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoadings(false);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const proceedWithCreation = async (booking) => {
    console.log(booking);
    let selectedCat;
    const festivalOffer = booking.itineraryData?.festivalOffer;
    if (booking.selectedCategory) {
      selectedCat = booking.selectedCategory;
    } else {
      const pricing = booking.itineraryData?.pricing;
      if (pricing) {
        for (const [cat, obj] of Object.entries(pricing)) {
          if (typeof obj === 'object' && (obj.selected === true || (obj.value && obj.value > 0))) {
            selectedCat = cat;
            break;
          }
        }
      }
      if (!selectedCat) {
        for (const [cat, obj] of Object.entries(pricing || {})) {
          if (
            (typeof obj === 'number' && obj > 0) ||
            (typeof obj === 'object' && obj.value > 0)
          ) {
            selectedCat = cat;
            break;
          }
        }
      }
      if (!selectedCat) {
        toast.error('No category selected for this itinerary');
        return;
      }
    }
    const travelers = parseInt(booking.clientDetails?.travelers) || 1;
    const priceType = booking.itineraryData?.priceType || 'perPerson';
    let bookingAmountPerPerson;
    if (typeof booking.itineraryData.bookingAmount === 'number') {
      bookingAmountPerPerson = booking.itineraryData.bookingAmount;
    } else {
      bookingAmountPerPerson =
        booking.itineraryData.bookingAmount?.[selectedCat]?.value ||
        (typeof booking.itineraryData.bookingAmount?.[selectedCat] === 'number'
          ? booking.itineraryData.bookingAmount[selectedCat]
          : 0);
    }
    const priceObj = booking.itineraryData.pricing?.[selectedCat] || { value: 0 };
    const offer =
      booking.itineraryData.offers?.[selectedCat]?.value ||
      (typeof booking.itineraryData.offers?.[selectedCat] === 'number'
        ? booking.itineraryData.offers[selectedCat]
        : 0);
    const highlightPrice =
      booking.itineraryData.highlightPrice?.[selectedCat] ||
      (typeof booking.itineraryData.highlightPrice?.[selectedCat] === 'number'
        ? booking.itineraryData.highlightPrice[selectedCat]
        : typeof booking.itineraryData.highlightPrice === 'number'
          ? booking.itineraryData.highlightPrice
          : 0);
    const basePrice =
      typeof priceObj === 'object'
        ? priceObj.value || priceObj
        : typeof priceObj === 'number'
          ? priceObj
          : 0;
    const totalForCat = basePrice - offer;
    const totalBookingAmount = bookingAmountPerPerson;
    let selectedHotelsObj = booking.hotelSelections || {};
    const hasDirectDays = Object.keys(selectedHotelsObj).some((key) => /^\d+$/.test(key));
    let selectedHotels;
    if (hasDirectDays) {
      selectedHotels = cleanHotels(selectedHotelsObj);
    } else {
      selectedHotels = cleanHotels(selectedHotelsObj[selectedCat] || {});
    }
    // Filter vehicles to only include those with selected: true
    const selectedVehicle = (booking.itineraryData?.vehicle || []).find(v => v.selected == true);
    console.log(festivalOffer);
    const formattedFestivalOffer = (festivalOffer && festivalOffer.value > 0)
      ? festivalOffer
      : null;
    const selectedItineraryData = {
      ...booking.itineraryData,
      pricing: {
        [selectedCat]: basePrice,
      },
      offers: {
        [selectedCat]: offer,
      },
      bookingAmount: totalBookingAmount,
      highlightPrice: highlightPrice,
      hotels: selectedHotels,
      vehicle: selectedVehicle,
      priceType: priceType,
      festivalOffer: formattedFestivalOffer
    };
    categories.forEach((cat) => {
      if (cat !== selectedCat) {
        delete selectedItineraryData.pricing?.[cat];
        delete selectedItineraryData.offers?.[cat];
        delete selectedItineraryData.hotels?.[cat];
      }
    });
    const selectedPackagePricing = {
      ...booking.selectedItinerary,
      packagePricing: {
        [selectedCat]:
          booking.selectedItinerary.packagePricing?.[selectedCat] || basePrice,
      },
    };
    Object.keys(selectedPackagePricing.packagePricing).forEach((key) => {
      if (key !== selectedCat) delete selectedPackagePricing.packagePricing[key];
    });
    const transformedBooking = {
      ...booking,
      selectedCategory: selectedCat,
      hotelSelections: selectedHotels,
      userSelectedHotels: selectedHotels,
      rawHotelSelections: selectedHotels,
      itineraryData: selectedItineraryData,
      selectedItinerary: selectedPackagePricing,
      totalAmount: totalForCat,
      bookingAmount: totalBookingAmount,
      grandTotal: totalForCat,
      createby: (user && user.role !== "user") ? user : booking.createBy,
      festivalOffer: formattedFestivalOffer
    };
    console.log(transformedBooking);
    setCreatingId(booking._id);
    if (booking.status !== "confirmed" && booking.status !== "created") {
      toast.info("Booking status invalid. Cannot proceed.");
      return;
    }
  };
  // Modified handleCreateBooking in ViewPending.jsx
  const handleCreateBooking = async (booking) => {

    if (booking.status === "created") {
      toast.error("Booking already created!");
      return; // function yahi ruk jayega
    }

    // If not created, proceed directly
    await proceedWithCreation(booking);
    // After preparation, navigate to BookingPage with pre-filled data
    // Convert travelDate from DD-MM-YYYY to YYYY-MM-DD for date input
    const travelDate = booking.clientDetails?.travelDate;
    let formattedTravelDate = '';
    if (travelDate) {
      const parts = travelDate.split('-');
      if (parts.length === 3) {
        // DD-MM-YYYY -> YYYY-MM-DD
        formattedTravelDate = `${parts[2]}-${parts[1]}-${parts[0].padStart(2, '0')}`;
      }
    }
    // Serialize necessary data for URL params (keep it concise, or use state if possible)
    // For simplicity, pass key fields via search params; full data can be fetched by ID if backend supports
    const params = new URLSearchParams({
      // Client details
      name: booking.clientDetails?.name || '',
      email: booking.clientDetails?.email || '',
      phone: booking.clientDetails?.phone || '',
      title: booking.clientDetails?.title || 'Mr', // Assuming title is part of name or separate
      adults: booking.clientDetails?.adults || '',
      kids5to12: booking.clientDetails?.kids5to12 || '',
      kidsBelow5: booking.clientDetails?.kidsBelow5 || '',
      rooms: booking.clientDetails?.rooms || '',
      extraBeds: booking.clientDetails?.extraBeds || '',
      travelDate: formattedTravelDate, // Converted to YYYY-MM-DD
      travelers: booking.clientDetails?.travelers || 1,
      // Itinerary pre-selection (pass ID to select)
      itineraryId: booking.selectedItinerary?._id || '',
      step: 'itinerary-builder', // Directly open builder tab
      // Additional for pre-fill (e.g., selected category, hotels, etc.)
      selectedCategory: booking.selectedCategory || 'deluxe' || '',
      bookingId: booking._id || '', // If editing existing, fetch full data

    });
    // Navigate to BookingPage route (adjust route as per your setup, e.g., /booking or /page)
    navigate(`/page?${params.toString()}`); // Assuming BookingPage is at /booking
  };
  const handleConfirmYes = () => {
    setShowConfirmModal(false);
    if (bookingToConfirm) {
      proceedWithCreation(bookingToConfirm);
    }
  };
  const handleConfirmNo = () => {
    setShowConfirmModal(false);
    setBookingToConfirm(null);
  };

  // Frontend mein yeh function add karo (table ke row mein button ke saath)
  const handleSendWhatsApp = async (booking) => {
    const clientName = booking.clientDetails?.name?.trim() || "Sir/Madam";
    const phone = booking.clientDetails?.phone?.replace(/\D/g, "") || "";

    if (!phone) {
      toast.error("Phone number not available");
      return;
    }

    const clientBase = window.location.hostname.includes("localhost")
      ? "https://tour.rajasthantouring.in"
      : "https://tour.rajasthantouring.in";

    const viewLink = `${clientBase}/Senduser${booking.theme?.link || "/viewData"}/${booking._id}`;

    // PACKAGE LIST
    let packageList = "";
    let totalPackages = 0;

    if (booking.totalAmount && typeof booking.totalAmount === "object") {
      for (const [cat, amount] of Object.entries(booking.totalAmount)) {
        if (typeof amount === "number" && amount > 0) {
          const cleanCat = cat.trim().replace(/\b\w/g, (l) => l.toUpperCase());
          packageList += `${cleanCat} Package\n`;
          totalPackages++;
        }
      }
    }

    if (totalPackages === 0) {
      packageList = "Deluxe Hotels Package\nSuper Deluxe Hotels Package\n";
    }

    const packageMessage =
      totalPackages > 1
        ? `we are pleased to share ${totalPackages} package options:-\n\n${packageList}`
        : `we are pleased to share your customized package option:-\n\n${packageList}`;

    // ⭐ REVISED MESSAGE (ONLY when versionNumber > 1)
    const revisedMessage =
      booking.versionNumber > 1
        ? `Dear Sir,

"Khammaghani"

Greetings from Rajasthan Touring!!!

Your revised Rajasthan itinerary has been updated as per your request. Please review the changes and let us know if you need any further modifications. We’re happy to assist you.

${packageMessage}
Kindly review the package options through the provided link and let us know which one suits you best. We would be happy to customize the itinerary as per your requirements.

View Your Full Itinerary:
${viewLink}

If you need any further changes please feel free to let us know. We are happy to assist you.

Looking forward to your confirmation.
With Warm Regards
${booking.contact?.name || "Team Rajasthan Touring"}
Rajasthan Touring
${booking.contact?.mobiles?.[0] || ""}`
        : null;

    // ⭐ ORIGINAL MESSAGE (ONLY when versionNumber <= 1)
    const originalMessage = `Dear ${clientName},

"Khammaghani"

Greetings from Rajasthan Touring!

Thank you for your interest in our Rajasthan tour package. Please find below the proposed trip details and the link to view your complete quotation online.

${packageMessage}
Kindly review the package options through the provided link and let us know which one suits you best. We would be happy to customize the itinerary as per your requirements.

View Your Full Itinerary:
${viewLink}

We look forward to welcoming you to Rajasthan!

With Warm Regards
${booking.contact?.name || "Team Rajasthan Touring"}
Rajasthan Touring
${booking.contact?.mobiles?.[0] || ""}`;

    // ⭐ FINAL MESSAGE — based on version number
    const finalMessage = revisedMessage || originalMessage;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
    window.open(whatsappUrl, "_blank");

    toast.success("Quotation WhatsApp Opened!");
  };

  const handleSendEmail = async (booking) => {
    const bookingId = booking._id;
    setEmailLoading(prev => ({ ...prev, [bookingId]: true }));
    const clientName = booking.clientDetails?.name?.trim() || "Sir/Madam";
    const clientBase = window.location.hostname.includes("localhost")
      ? "https://tour.rajasthantouring.in"
      : "https://tour.rajasthantouring.in";

    const viewLink = `${clientBase}/Senduser${booking.theme?.link || "/viewData"}/${booking._id}`;
    // PACKAGE LIST
    let packageList = "";
    let totalPackages = 0;

    if (booking.totalAmount && typeof booking.totalAmount === "object") {
      for (const [cat, amount] of Object.entries(booking.totalAmount)) {
        if (typeof amount === "number" && amount > 0) {
          const cleanCat = cat.trim().replace(/\b\w/g, l => l.toUpperCase());
          packageList += `${cleanCat} Hotels Package<br>`;
          totalPackages++;
        }
      }
    }

    if (totalPackages === 0) {
      packageList = "Deluxe Hotels Package<br>Super Deluxe Hotels Package<br>";
    }

    const packageMessage =
      totalPackages > 1
        ? `We are pleased to share ${totalPackages} package options:-<br><br>${packageList}`
        : `We are pleased to share your customized package option:-<br><br>${packageList}`;

    // ⭐ REVISED EMAIL TEMPLATE — ONLY IF versionNumber > 1
    const revisedEmailHTML =
      booking.versionNumber > 1
        ? `
    <div style="font-family: Verdana ; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
      
      <h2 style="color: #d4af37; text-align: center;">Rajasthan Touring</h2>

      <p>Dear <strong>Sir</strong>,</p>

      <p style="font-style: italic;">"Khammaghani"</p>

      <p>Greetings from <strong>Rajasthan Touring!!!</strong></p>

      <p>Your revised Rajasthan itinerary has been updated as per your request. Please review the changes and let us know if you need any further modifications. We're happy to assist you.</p>

    
      <hr style="border:1px dashed #ddd; margin:30px 0;">

      <p style="background:#f8f9fa; padding:15px; border-radius:8px;">${packageList}</p>

      <div style="text-align:center; margin:35px 0;">
        <a href="${viewLink}" style="background:#27ae60; color:white; padding:15px 35px; text-decoration:none; border-radius:8px; font-size:16px; font-weight:bold;">
          View Your Full Quotation
        </a>
      </div>
  <p>If you need any further changes please feel free to let us know. We are happy to assist you.</p>

      <p>Looking forward to your confirmation.</p>

    
      <p> ${booking.contact?.name || "Team Rajasthan Touring"}</p>
      <p> ${booking.contact?.mobiles?.[0] || ""}</p>
    </div>
    `
        : null;

    // ⭐ ORIGINAL EMAIL TEMPLATE — ONLY IF versionNumber <= 1
    const originalEmailHTML = `
    <div style="font-family: Verdana ; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff;">

      <h2 style="color: #d4af37; text-align: center;">Rajasthan Touring</h2>

      <p>Dear <strong>${clientName}</strong>,</p>

      <p style="font-style: italic;">"Khammaghani"</p>

      <p>Greetings from <strong>Rajasthan Touring</strong>!</p>

      <p>Thank you for your interest in our Rajasthan tour package. Please find below the proposed trip details and your complete quotation link.</p>

     

      <p style="background:#f8f9fa; padding:15px; border-radius:8px;">${packageList}</p>

      <div style="text-align:center; margin:35px 0;">
        <a href="${viewLink}" style="background:#27ae60; color:white; padding:15px 35px; text-decoration:none; border-radius:8px; font-size:16px;">
          View Your Full Quotation
        </a>
      </div>

      <p>We look forward to welcoming you to the Royal Rajasthan!</p>

      <p><strong>With Warm Regards,<br>${booking.contact?.name || "Team Rajasthan Touring"}</strong><br>
  ${booking.contact?.mobiles?.[0] || ""}</p>

    </div>
  `;

    // FINAL HTML TO SEND
    const finalHTML = revisedEmailHTML || originalEmailHTML;
    console.log(revisedEmailHTML);


    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/emails/send-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          clientDetails: {
            name: clientName,
            email: booking.clientDetails?.email,
          },
          htmlMessage: finalHTML, // ⭐ Now sending correct message
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }

      toast.success("Quotation sent via Email");
    } catch (err) {
      toast.error("Email Error: " + err.message);
    } finally {
      setEmailLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // New: Handle Add Festival Offer
  const handleAddFestivalOffer = (booking) => {
    setFestivalBookingId(booking._id);
    setFestivalTitle('');
    setFestivalPercentage(0);
    setShowFestivalModal(true);
  };
  const handleSaveFestivalOffer = async () => {
    if (!festivalTitle.trim()) {
      toast.error('Please enter a title for the festival offer');
      return;
    }
    if (festivalPercentage <= 0 || festivalPercentage > 100) {
      toast.error('Please enter a valid percentage (1-100)');
      return;
    }
    setShowFestivalModal(false);
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/pending/${festivalBookingId}/festival-offer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festivalTitle, festivalPercentage }),
      });
      if (!response.ok) throw new Error('Failed to update festival offer');
      toast.success('Festival offer added successfully!');
      fetchAllBookings(); // Refresh
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };
  const handleDelete = async (booking) => {
    if (!confirm('Are you sure you want to delete this itinerary? It will move to trash.')) {
      return;
    }
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/pending/${booking._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Itinerary moved to trash successfully!');
      fetchAllBookings();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };
  const handleRestore = async (booking) => {
    if (!confirm('Are you sure you want to restore this itinerary?')) {
      return;
    }
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/pending/${booking._id}/restore`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to restore');
      toast.success('Itinerary restored successfully!');
      fetchAllBookings();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };
  const handlePermanentDelete = async (booking) => {
    if (!confirm('Are you sure you want to permanently delete this itinerary?')) {
      return;
    }
    try {
      const response = await fetch(
        `https://apitour.rajasthantouring.in/api/pending/${booking._id}/permanent`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to permanently delete');
      toast.success('Itinerary permanently deleted successfully!');
      fetchAllBookings();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };
  const handleCleanTrash = async () => {
    if (!confirm('Are you sure you want to clean old trash items (older than 30 days)?')) {
      return;
    }
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/pending/clean-trash', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clean trash');
      toast.success('Old trash cleaned successfully!');
      fetchAllBookings();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };
  const toggleViewMode = () => {
    setViewMode(viewMode === 'pending' ? 'trash' : 'pending');
    setLoading(true);
    // Reset filters when switching modes
    setSelectedStatus('all');
    setSelectedCreator('all');
    setBookingIdSearch(''); // New: Reset booking ID search
    setFromDate('');
    setToDate('');
  };
  // New: Payment Management Functions (adapted from Payment.jsx for Pending)
  const calculateBalanceAmount = (pendingItem) => {
    const totalAmount =
      typeof pendingItem.totalAmount === "number"
        ? pendingItem.totalAmount
        : Object.values(pendingItem.totalAmount || {}).reduce(
          (sum, val) => sum + Number(val),
          0
        );

    const paidAmount =
      pendingItem.payments
        ?.filter((p) => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return { totalAmount, paidAmount, balance: totalAmount - paidAmount };
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const formData = new FormData();
    formData.append("screenshot", file);
    try {
      const response = await axios.post("https://apitour.rajasthantouring.in/api/pending/upload-screenshot", formData, { // Adjust endpoint if needed
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setPaymentData({ ...paymentData, screenshot: response.data.screenshotUrl });
    } catch (err) {
      console.error("Error uploading screenshot:", err);
      toast.error("Failed to upload screenshot. Please try again.");
    }
  };
  const handleAddPayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!paymentData.method || paymentData.method.trim() === "") {
      toast.error("Please enter a payment method");
      return;
    }
    try {
      setPaymentLoading(true);
      const response = await axios.post(
        `https://apitour.rajasthantouring.in/api/pendingPayments/${selectedPending._id}`, // Use pendingPayments router
        paymentData,
        { withCredentials: true }
      );
      // Update the selectedPending and allBookings
      setSelectedPending(response.data);
      setAllBookings(allBookings.map((b) => (b._id === response.data._id ? response.data : b)));
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
      toast.success("Payment added successfully");
    } catch (err) {
      console.error("Error adding payment:", err);
      toast.error("Failed to add payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };
  const handleUpdatePayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!paymentData.method || paymentData.method.trim() === "") {
      toast.error("Please enter a payment method");
      return;
    }
    try {
      setPaymentLoading(true);
      const paymentId = selectedPending.payments[paymentData.index]._id;
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/pendingPayments/${selectedPending._id}/${paymentId}`, // Use pendingPayments router
        paymentData,
        { withCredentials: true }
      );
      setSelectedPending(response.data);
      setAllBookings(allBookings.map((b) => (b._id === response.data._id ? response.data : b)));
      setPaymentData({
        amount: "",
        currency: "INR",
        method: "",
        mobileNumber: "",
        transactionId: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
      });
      toast.success("Payment updated successfully");
    } catch (err) {
      console.error("Error updating payment:", err);
      toast.error("Failed to update payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };
  const handleEditPayment = (payment, index) => {
    setPaymentData({ ...payment, index });
  };
  const handleOpenPaymentModal = (pendingItem) => {
    if (pendingItem.status === "created") {
      toast.error("Booking already created!");
      return; // ❌ Stop, don't open modal
    }

    setSelectedPending(pendingItem);
    setShowPaymentModal(true);
  };
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPending(null);
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
  };
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  const isTrashMode = viewMode === 'trash';
  const title = isTrashMode ? 'Trash Booking' : 'Regular Booking';
  // StatusBadge Component (from Payment.jsx)
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: Clock, dot: "bg-blue-400" },
      created: { color: "bg-green-50 text-green-700 border border-green-200", icon: Check, dot: "bg-green-400" },
      cancelled: { color: "bg-red-50 text-red-700 border border-red-200", icon: XCircle, dot: "bg-red-400" },
      completed: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: CheckCircle, dot: "bg-blue-400" },
      confirmed: { color: "bg-purple-50 text-purple-700 border border-purple-200", icon: Check, dot: "bg-purple-400" },
      success: { color: "bg-green-50 text-green-700 border border-green-200", icon: FaRupeeSign, dot: "bg-green-500" },
      failed: { color: "bg-red-50 text-red-700 border border-red-200", icon: XCircle, dot: "bg-red-500" },
    };
    const normalizedStatus = status?.toLowerCase?.() || "pending";
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        <Icon size={12} />
        <span className="capitalize">{status}</span>
      </div>
    );
  };
  // PaymentStatusBadge Component (from Payment.jsx, adapted)
  const PaymentStatusBadge = ({ pendingItem }) => {
    const { totalAmount, paidAmount, balance } = calculateBalanceAmount(pendingItem);

    let status, color, icon, dot;

    if (paidAmount === 0) {
      // koi payment success nahi
      status = "Unpaid";
      color = "bg-red-50 text-red-700 border border-red-200";
      icon = XCircle;
      dot = "bg-red-400";
    }
    else if (balance === 0) {
      // fully paid
      status = "Fully Paid";
      color = "bg-blue-50 text-blue-700 border border-blue-200";
      icon = Check;
      dot = "bg-blue-400";
    }
    else {
      // partially paid
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

  // Ant Design Table Columns Definition
  const getTableColumns = () => {
    const baseColumns = [
      {
        title: 'ID',
        dataIndex: 'bookingId',
        key: 'id',
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            {record.bookingId || record._id || 'N/A'}
          </div>
        ),
        width: 120,
      },
      {
        title: 'Created By',
        dataIndex: ['createby', 'name'],
        key: 'by',
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            {record.createby?.name || 'N/A'}
          </div>
        ),
        width: 120,
      },
      {
        title: 'Created Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {record.createdAt
              ? new Date(record.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              : 'N/A'}
          </div>
        ),
        width: 140,
      }
      ,
      {
        title: 'Client Name',
        dataIndex: ['clientDetails', 'name'],
        key: 'clientName',
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            {record.clientDetails?.name || 'N/A'}
          </div>
        ),
        width: 150,
      },
      {
        title: 'Travel Date',
        dataIndex: ['clientDetails', 'travelDate'],
        key: 'travelDate',
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {record.clientDetails?.travelDate || 'N/A'}
          </div>
        ),
        width: 120,
      },
      {
        title: 'Status',
        key: 'status',
        render: (text, record) => <StatusBadge status={record.status} />,
        width: 120,
      },

      {
        title: 'Grand Total',
        key: 'total',
        render: (text, record) => {
          const totalAmount = record.totalAmount || {};
          let totalDisplay;
          if (!record.selectedCategory) {
            totalDisplay = Object.entries(totalAmount).map(([category, value]) => (
              <div key={category}>{category}: ₹{Number(value).toLocaleString()}</div>
            ));
          } else {
            const selectedValue = totalAmount[record.selectedCategory] || 0;
            totalDisplay = (
              <div>
                {record.selectedCategory}: ₹{Number(selectedValue).toLocaleString()}
              </div>
            );
          }
          return (
            <div>
              {totalDisplay}
              <div className="mt-2">
                <PaymentStatusBadge pendingItem={record} />
              </div>
            </div>
          );
        },
        width: 150,
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (text, record) => {
          const createLoading = creatingId === record._id;
          const emailLoad = emailLoading[record._id];
          const createIcon = createLoading ? faSpinner : faPlus;
          const createClass = createLoading ? 'animate-spin' : '';
          const hasFestivalOffer = (record.itineraryData?.festivalOffer?.value || 0) > 0;

          return (
            <div className="flex gap-2 flex-wrap ">
              {!isTrashMode ? (
                <>
                  {/* WhatsApp */}
                  <button
                    onClick={() => handleSendWhatsApp(record)}
                    className="!bg-green-600 hover:!bg-green-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Send WhatsApp"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} className="!text-white" />
                  </button>

                  {/* Email */}
                  <button
                    onClick={() => handleSendEmail(record)}
                    disabled={emailLoad}
                    className="!bg-blue-600 hover:!bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Send Email"
                  >
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className={`${emailLoad ? "animate-spin" : ""} !text-white`}
                    />
                  </button>

                  {/* Create Booking */}
                  <button
                    onClick={() => handleCreateBooking(record)}
                    disabled={createLoading}
                    className="!bg-indigo-600 hover:!bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Create Booking"
                  >
                    <FontAwesomeIcon icon={createIcon} className={`${createClass} !text-white`} />
                  </button>

                  {/* Move to Trash */}
                  <button
                    onClick={() => handleDelete(record)}
                    className="!bg-red-600 hover:!bg-red-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Move to Trash"
                  >
                    <FontAwesomeIcon icon={faTrash} className="!text-white" />
                  </button>

                  {/* View */}
                  <button
                    onClick={() => navigate(`/Senduser${record.theme.link}/${record._id}`)}
                    className="!bg-green-200 hover:!bg-green-500 hover:!text-white !text-gray-800 !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>

                  <button
                    onClick={() => {
                      if (record.status === "created") {
                        toast.error("Booking already created!");
                        return; // ❌ Do not navigate
                      }
                      navigate(`/Pending?id=${record._id}`); // ✅ Only navigate if not created
                    }}
                    className="!bg-yellow-600 hover:!bg-yellow-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="!text-white" />
                  </button>


                  {/* Download */}
                  <button
                    onClick={() => {
                      setSelectedBooking(record);
                      toast.info("Please wait... Download will start in 15–20 seconds.");
                      setTriggerDownload(true);
                    }}
                    className="!bg-green-200 hover:!bg-green-500 hover:!text-white !text-gray-800 !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Download"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>

                  {/* Festival Offer */}
                  {/* {!hasFestivalOffer && record.status === 'pending' && (
                    <button
                      onClick={() => handleAddFestivalOffer(record)}
                      className="!bg-purple-600 hover:!bg-purple-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                      title="Add Festival Offer"
                    >
                      <FontAwesomeIcon icon={faGift} className="!text-white" />
                    </button>
                  )} */}

                  {/* Payments */}
                  <button
                    onClick={() => handleOpenPaymentModal(record)}
                    className="!bg-indigo-600  hover:!bg-indigo-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium !flex !items-center"
                    title="Manage Payments"
                  >
                    <CreditCard className="h-4 w-4 mr-1 !text-white" />
                    Payments
                  </button>
                </>
              ) : (
                <>
                  {/* Restore */}
                  <button
                    onClick={() => handleRestore(record)}
                    className="!bg-green-600 hover:!bg-green-700 !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Restore"
                  >
                    <FontAwesomeIcon icon={faUndo} className="!text-white" />
                  </button>

                  {/* Permanent Delete */}
                  <button
                    onClick={() => handlePermanentDelete(record)}
                    className="!bg-red-600 hover:!bg-red-700  !text-white !px-3 !py-2 !rounded-md text-sm font-medium"
                    title="Permanent Delete"
                  >
                    <FontAwesomeIcon icon={faTimes} className="!text-white" />
                  </button>
                </>
              )}
            </div>
          );
        },
        width: 300,
      }

    ];

    if (isTrashMode) {
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: 'Deleted At',
        dataIndex: 'deletedAt',
        key: 'deletedAt',
        render: (text) => new Date(text).toLocaleDateString() || 'N/A',
        width: 120,
      });
    }

    return baseColumns;
  };

  const tableColumns = getTableColumns();

  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  return (
    <>
      <div className="w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl text-blue-600 underline font-bold">{title}</h2>
          <div className="inline-flex flex-col gap-2 sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={toggleViewMode}
              style={{ color: 'white' }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 !rounded-md text-sm font-medium transition-colors w-auto"
            >
              {isTrashMode ? 'View Regular' : 'View Trash'}
            </button>
            {isTrashMode && (
              <button
                onClick={handleCleanTrash}
                style={{ color: 'white' }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 !rounded-md text-sm font-medium transition-colors w-auto"
              >
                <FontAwesomeIcon icon={faBroom} className="mr-1" /> Clean Old Trash
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm mb-4"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filters - Responsive */}
        {!isTrashMode && showFilters && (
          <div className="mb-4 space-y-4">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700 sm:w-40">Filter by Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[250px]"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Booking ID Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700 sm:w-40">Search by Booking ID:</label>
              <div className="flex items-center w-full sm:w-[350px] gap-2">
                <input
                  type="text"
                  value={bookingIdSearch}
                  onChange={(e) => setBookingIdSearch(e.target.value)}
                  placeholder="Enter Booking ID..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                {bookingIdSearch && (
                  <button
                    onClick={() => setBookingIdSearch('')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Creator Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700 sm:w-40">Filter by Creator:</label>
              <select
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[250px]"
              >
                <option value="all">All Creators</option>
                {uniqueCreators.map((creator) => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700 sm:w-40">Filter by Travel Date:</label>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-[350px]">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />

                {(fromDate || toDate) && (
                  <button
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm w-full sm:w-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AntD Table for all views */}
        <Table
          dataSource={currentBookings.map((booking, index) => ({ ...booking, key: booking._id || index }))}
          columns={tableColumns}
          pagination={tablePagination}
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'No itineraries found.' }}
          className="custom-antd-table"
        />
      </div>
      {/* New: Payment Management Modal (adapted from Payment.jsx) */}
      {showPaymentModal && selectedPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Payments for Pending</h2>
                <p className="text-sm text-gray-500">
                  Pending ID #{selectedPending.bookingId || selectedPending._id.slice(-5)} - {selectedPending.clientDetails.name}
                </p>
              </div>
              <button onClick={closePaymentModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    />
                  </div>
                  <div>
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                    <input
                      type="text"
                      name="gateway"
                      value={paymentData.gateway}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Razorpay, Stripe, PayPal"
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
                      disabled={paymentLoading}
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
              </div> */}
              {/* Payment History Table (Enhanced with Lucide icons) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md"> {/* Enhanced table design */}
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screenshot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPending.payments?.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.method || "N/A"}</td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td> */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={payment.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.receiptUrl ? (
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                <FileText size={14} className="inline mr-1" />
                                View Receipt
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                      )) || <tr><td colSpan="9" className="px-6 py-4 text-center text-gray-500">No payments yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
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
              src={previewImage}
              alt="Payment screenshot preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && bookingToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 mr-2 text-xl" />
              <h3 className="text-lg font-semibold">Confirmation</h3>
            </div>
            <p className="mb-6 text-gray-700">Booking already created. Do you want to create another one?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleConfirmYes}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white !rounded-md"
              >
                Yes
              </button>
              <button
                onClick={handleConfirmNo}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 !rounded-md"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Festival Offer Modal */}
      {/* {showFestivalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faGift} className="text-purple-500 mr-2 text-xl" />
              <h3 className="text-lg font-semibold">Add Festival Offer</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
                <input
                  type="text"
                  value={festivalTitle}
                  onChange={(e) => setFestivalTitle(e.target.value)}
                  className="border border-gray-300 !rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Diwali Special"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={festivalPercentage}
                  onChange={(e) => setFestivalPercentage(Number(e.target.value))}
                  className="border border-gray-300 !rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFestivalModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 !rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFestivalOffer}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white !rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )} */}
      <div className="hidden">
        {selectedBooking?.theme?.link?.includes("viewData5") ? (
          <Senduserviewdata5
            id={selectedBooking._id}
            autoDownload={triggerDownload}
            onDownloadComplete={() => setTriggerDownload(false)}
          />
        ) : selectedBooking?.theme?.link?.includes("viewData4") ? (
          <Senduserviewdata4
            id={selectedBooking._id}
            autoDownload={triggerDownload}
            onDownloadComplete={() => setTriggerDownload(false)}
          />
        ) : selectedBooking?.theme?.link?.includes("viewData3") ? (
          <Senduserviewdata3
            id={selectedBooking._id}
            autoDownload={triggerDownload}
            onDownloadComplete={() => setTriggerDownload(false)}
          />
        ) : selectedBooking?.theme?.link?.includes("viewData2") ? (
          <Senduserviewdata2
            id={selectedBooking._id}
            autoDownload={triggerDownload}
            onDownloadComplete={() => setTriggerDownload(false)}
          />
        ) : (
          <Senduserviewdata
            id={selectedBooking?._id}
            autoDownload={triggerDownload}
            onDownloadComplete={() => setTriggerDownload(false)}
          />
        )}
      </div>
    </>
  );
};
export default ViewPending;