
"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Solid icons
import { faPrint, faGlobe, faFileContract, faUndoAlt, faPlane, faCircleInfo, faLocationArrow, faWallet, faCoffee, faUtensils, faMoon, faTriangleExclamation, faHotel } from "@fortawesome/free-solid-svg-icons";

// Brand icons
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import {
  faFacebookF,
  faTwitter,
  faInstagram,
  faLinkedinIn,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { CarFront, CheckCircle2, Coffee, MapPin, Plane, Pointer, Utensils, UtensilsCrossed } from "lucide-react";
import Pdf from "../pending/Pdf";
import { faCheckCircle, faCircle, faTimesCircle } from "@fortawesome/free-regular-svg-icons";
import { FaArrowDown } from "react-icons/fa";
import { toast } from "react-toastify";

const StarRating = ({ rating = 4 }) => {
  const total = 5;
  const r = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-1">
      <span className="text-yellow-500">
        {[...Array(total)].map((_, i) => (
          <span key={i}>{i + 1 <= r ? "★" : "☆"}</span>
        ))}
      </span>
      <span className="text-xs text-gray-700 ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
};

const iconsMap = {
  facebook: faFacebookF,
  // twitter: faTwitter,
  instagram: faInstagram,
  // linkedin: faLinkedinIn,
  youtube: faYoutube,
  website: faGlobe,
};

const Viewdata4 = ({ id, autoDownload, onDownloadComplete }) => {
  const componentRef = useRef(null);
  const params = useParams();
  const bookingId = params.id || id;
  const navigate = useNavigate();
  const BASE_URL = "https://apitour.rajasthantouring.in";
  const [resive, setresive] = useState(false)
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [booking, setBooking] = useState(null);
  const [itineraryUrl, setItineraryUrl] = useState('')


  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [softwareData, setSoftwareData] = useState(null);
  const [form, setForm] = useState({
    packageTitle: "",
    name: "",
    email: "",
    message: "",
  });
  const [emailLoading, setEmailLoading] = useState()
  const [policies, setPolicies] = useState({
    inclusions: [],
    exclusions: [],
    termsAndConditions: [],
    cancellationAndRefundPolicy: [],
    travelRequirements: [],
  });
  const [loadings, setLoadings] = useState(false);
  const [structureData, setStructureData] = useState(null);
  const [activeTab, setActiveTab] = useState("inclusions");
  const [openDayIndex, setOpenDayIndex] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [titleState, setTitleState] = useState("Loading Booking...");
  const [descriptionState, setDescriptionState] = useState("Loading booking details...");
  const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
  const [ogImageState, setOgImageState] = useState("/logo1.png");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isPuppeteer = searchParams.get("print") === "1";
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState("");

  const [isChecked, setIsChecked] = useState(false);

  const [expandedItems, setExpandedItems] = useState({});


  const toggleAccordion = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  const handlePrint = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    setDownloadProgress(0);
    setPdfStatus("Starting download...");

    try {
      const pageUrl = new URL(itineraryUrl);
      pageUrl.searchParams.set("print", "1");

      const fullUrl = `${BASE_URL}/api/generate-pdf?url=${encodeURIComponent(
        pageUrl.toString()
      )}`;

      setPdfStatus("Rendering PDF (15-20 seconds)...");
      const startTime = Date.now();

      // ⚡ Use fetch with progress tracking
      const response = await fetch(fullUrl, {
        method: 'GET',
        timeout: 120000
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // ⚡ Get total size
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);

      if (!total) {
        throw new Error("Server did not provide file size");
      }

      // ⚡ Stream with progress
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;

      setPdfStatus("Downloading...");

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Update progress
        const progress = Math.round((loaded / total) * 100);
        setDownloadProgress(progress);
        setPdfStatus(`Downloading... ${progress}%`);
      }

      // ⚡ Merge chunks
      const blob = new Blob(chunks, { type: 'application/pdf' });
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      if (blob.size === 0) {
        throw new Error("Downloaded PDF is empty");
      }

      // ⚡ Trigger download
      setPdfStatus(`Processing (${timeTaken}s)...`);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Booking_${booking?.clientDetails?.name || "Traveler"}_${Date.now()}.pdf`;

      // Add to DOM temporarily for click
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      setPdfStatus("✅ Downloaded successfully!");
      setTimeout(() => {
        setPdfStatus("");
        setDownloadProgress(0);
      }, 2000);

    } catch (err) {
      console.error("PDF Download Error:", err);
      setPdfStatus(`❌ Error: ${err.message}`);
      setTimeout(() => {
        setPdfStatus("");
        setDownloadProgress(0);
      }, 3000);
    } finally {
      setPdfLoading(false);
    }
  };


  useEffect(() => {
    console.log("🔥 Effect triggered", { autoDownload, bookingId, itineraryUrl, bookingDataChanged: !!bookingData });
    if (autoDownload && bookingId && bookingData && componentRef.current && itineraryUrl) {
      console.trace("🌀 handlePrint called");
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, bookingId, bookingData, itineraryUrl]);

  const handleApprove = async () => {
    if (approveLoading || booking?.approvel) return;

    setApproveLoading(true);

    try {
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/bookings/approve/${bookingId}`,
      );

      if (response.data) {
        setBooking(prev => ({
          ...prev,
          approvel: true
        }));
        toast.success(" Booking approved successfully!");
      }
    } catch (error) {
      console.log(error);

      console.error("Approve Error:", error);
      toast.error(error.response?.data?.message || "❌ Failed to approve booking");
    } finally {
      setApproveLoading(false);
    }
  };


  useEffect(() => {
    if (loading) {
      setTitleState("Loading Booking...");
      setDescriptionState("Loading booking details...");
      setOgDescriptionState("Loading...");
      setOgImageState("/logo1.png");
    } else if (bookingData && structureData) {
      const clientName = bookingData?.clientDetails?.name || "Traveler";
      const itineraryTitle = bookingData?.itineraryData?.titles?.[0] || "Booking Preview";
      const newTitle = `${clientName} - ${itineraryTitle} | Booking Preview`;
      const newDesc = `Booking details for ${clientName} - ${itineraryTitle}`;
      const newOgDesc = `Check the booking details for ${clientName} with itinerary: ${itineraryTitle}`;
      const newOgImg = structureData?.logo
        ? structureData.logo.startsWith("/uploads")
          ? `${BASE_URL}${structureData.logo}`
          : structureData.logo
        : "/logo1.png";

      setTitleState(newTitle);
      setDescriptionState(newDesc);
      setOgDescriptionState(newOgDesc);
      setOgImageState(newOgImg);
    }
  }, [loading, bookingData, structureData]);

  useEffect(() => {
    document.title = titleState;
  }, [titleState]);

  useEffect(() => {
    const fetchStructureData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/structure`);
        const data = await response.json();
        setStructureData(data);
        setUser(data);
      } catch (error) {
        console.error("Error fetching structure data:", error);
      }
    };
    fetchStructureData();
  }, []);

  const transformBooking = (data) => {
    const daysLength = data.itineraryData?.days?.length || 0;
    let startDate;
    if (data.clientDetails?.travelDate) {
      // 👇 Split and reformat "22-10-2025" → new Date(2025, 9, 22)
      const [day, month, year] = data.clientDetails.travelDate.split("-");
      startDate = new Date(year, month - 1, day);
    } else {
      startDate = new Date();
    }


    return {
      customerName: data.clientDetails?.name || "Guest",
      nights: daysLength > 0 ? daysLength - 1 : 0,
      days: daysLength,
      price: data.itineraryData?.pricing?.mk || data.bookingAmount || 0,
      vehicle: data.itineraryData?.vehicle
        ? { make: data.itineraryData.vehicle.make, model: data.itineraryData.vehicle.model }
        : null,
      itinerary:
        data.itineraryData?.days?.map((day, index) => {
          let dateStr = "";
          if (startDate) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + index);

            // ✅ Format date as DD-MM-YY
            const dd = String(dayDate.getDate()).padStart(2, "0");
            const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
            const yy = String(dayDate.getFullYear()).slice(-2);

            dateStr = `${dd}-${mm}-${yy}`;
          }
          return {
            id: day.id,
            day: `Day ${index + 1}`,
            date: dateStr,
            title: day.titles?.[0] || "Untitled",
            img:
              (day.images && day.images.length > 0
                ? day.images.map((img) => `${BASE_URL}${img}`)
                : data.itineraryData?.images && data.itineraryData.images.length > 0
                  ? data.itineraryData.images.map((img) => `${BASE_URL}${img}`)
                  : [""]),
            desc: day.descriptions?.[0] || "No description available",
            locations: day.locations || [],
          };
        }) || [],
      approvel: data.approvel
    };
  };
  const mealIcons = {
    breakfast: faCoffee,
    lunch: faUtensils,
    dinner: faMoon,
    stayOnly: faMoon,
  };
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingId = params.id || id;
        const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}`);

        const booking = await axios.get(`${BASE_URL}/api/ssr-data/${bookingId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const transformed = transformBooking(data);
        setBookingData(data);
        setBooking(transformed);
        setresive(true);
        console.log(data);
        setPolicies({
          inclusions: data.inclusions || [],
          exclusions: data.exclusions || [],
          termsAndConditions: data.termsAndConditions || [],
          cancellationAndRefundPolicy: data.cancellationAndRefundPolicy || [],
          travelRequirements: data.travelRequirements || [],
        });
        // Construct the itinerary URL using booking.theme.link
        if (data?.theme?.link) {
          const base = window.location.origin;
          setItineraryUrl(`${base}/${data.theme.link}/${bookingId}`);
        } else {
          // Fallback to current location if no theme.link
          setItineraryUrl(window.location.href);
        }
        setUser(data.contact);
      } catch (err) {
        console.error("Error fetching booking:", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id || id) fetchBooking();
  }, [id, params.id]);

  useEffect(() => {
    if (bookingData?.clientDetails) {
      setForm((prev) => ({
        ...prev,
        name: bookingData.clientDetails.name || "",
        email: bookingData.clientDetails.email || "",
        packageTitle: bookingData?.itineraryData?.titles?.[0] || "",
      }));
    }
  }, [bookingData]);

  useEffect(() => {
    const fetchSoftwareData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/toursoftware`);
        const data = await response.json();
        if (data && data.length > 0) {
          setSoftwareData(data[0]);
        }
      } catch (error) {
        console.error("Error fetching software data:", error);
      }
    };
    fetchSoftwareData();
  }, []);



  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/achivement`);
        const data = await res.json();
        setTour(data);
      } catch (error) {
        console.error("Error fetching tour:", error);
      }
    };
    fetchTour();
  }, []);

  const calculateDuration = (itinerary) => {
    if (!itinerary?.days?.length) return "0 Days";
    return `${itinerary.days.length} Days`;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadings(true);
    try {
      await axios.post(`${BASE_URL}/api/softmails`, form);
      alert("Inquiry submitted successfully!");
      setForm({
        packageTitle: form.packageTitle,
        name: form.name,
        email: form.email,
        message: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error submitting inquiry");
    } finally {
      setLoadings(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!bookingData?.clientDetails) return;

    const link = bookingData.theme?.link;
    const bookingLink = `https://tour.rajasthantouring.in/${link}/${bookingData._id}`;
    const offers = bookingData.itineraryData?.offers || {};
    const festivalOffer = bookingData.itineraryData?.festivalOffer || {};
    const hasFestival = festivalOffer.selected && festivalOffer.value > 0;
    const pricing = bookingData.itineraryData?.pricing || {};
    const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
    const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
    const baseAfterCategory = actualAmount - offerAmount;
    const festivalDiscount = hasFestival ? Math.round((baseAfterCategory * festivalOffer.value) / 100) : 0;
    const addonsList = Array.isArray(bookingData?.addons) && bookingData.addons.length > 0
      ? bookingData.addons.map(a => `• ${a.title}: ₹${a.value}`).join("\n")
      : "";



    const maxOfferEntry = Object.entries(offers).reduce(
      (max, [key, value]) => (value > max[1] ? [key, value] : max),
      ["none", 0]
    );

    console.log("whtapsmesapp", maxOfferEntry);

    // Construct message with proper spacing
    const message = `
Hello ${bookingData.clientDetails.name}!

This is from ${softwareData.companyName}!

Here’s your: ${bookingData.itineraryData?.titles?.[0] || "N/A"}
Duration: ${calculateDuration(bookingData.itineraryData)}
Package Cost: ₹${bookingData.totalAmount || 0}/-
${maxOfferEntry[1] > 0 ? `Special Offer: ${maxOfferEntry[0]} - ₹${maxOfferEntry[1]}/- OFF` : ''}
${hasFestival ? `Festival Offer: ${festivalOffer.name || "Special"} - ${festivalOffer.value}% OFF (₹${festivalDiscount}/-)` : ''}
${addonsList ? `\nExtra - Add-ons:\n${addonsList}\n` : ""}
Booking Amount: ₹${bookingData.bookingAmount || 0}/-

Please review your itinerary and let us know if you’d like any changes before we finalize the booking.

View Itinerary: ${bookingLink}

We’re excited to make your trip truly memorable!
— Team ${softwareData.companyName}
`;


    const phone = bookingData.clientDetails.phone?.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };


  const handleSendEmail = async () => {
    if (!bookingData?.clientDetails) return;

    setEmailLoading(true);

    const origin = window.location.origin;
    const bookingLink = `https://tour.rajasthantouring.in/${bookingData.theme.link}/${bookingData._id}`;

    const subject = `Your - ${bookingData.itineraryData?.titles?.[0] || "Travel Package"} from ${softwareData?.companyName} – Review & Confirm Your Plan`;
    const mobileNumber = bookingData.contact?.mobiles?.[0] || "";
    const mobileLink = mobileNumber ? `<a href="tel:${mobileNumber}">${mobileNumber}</a>` : "N/A";

    const festivalOffer = bookingData.itineraryData?.festivalOffer || {};
    const hasFestival = festivalOffer.selected && festivalOffer.value > 0;
    const pricing = bookingData.itineraryData?.pricing || {};
    const offers = bookingData.itineraryData?.offers || {};
    const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
    const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
    const baseAfterCategory = actualAmount - offerAmount;
    const festivalDiscount = hasFestival ? Math.round((baseAfterCategory * festivalOffer.value) / 100) : 0;
    const addonsHtml = Array.isArray(bookingData?.addons) && bookingData.addons.length > 0
      ? bookingData.addons
        .map(a => `<li><b>${a.title}:</b> ₹${a.value}</li>`)
        .join("")
      : "";


    const festivalOfferHtml = hasFestival ? `<li><b>Festival Offer:</b> ${festivalOffer.name || "Special Festival"} - ${festivalOffer.value}% OFF (₹${festivalDiscount}/-)</li>` : '';

    const body = `Dear ${bookingData.clientDetails.name || "Customer"},

Here’s Your Personalized Tour Plan
You can view your booking here: ${bookingLink}

Best regards,
Travel Team`;

    const html = `
  <p>Dear ${bookingData.clientDetails.name || "Customer"},</p>
  <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
  <p>Here’s Your Personalized Tour Plan</p>

  <p><b>Booking Details:</b></p>
  <ul>
    <li><b>Package:</b> ${bookingData.itineraryData?.titles?.[0] || "N/A"}</li>
    <li><b>Duration:</b> ${calculateDuration(bookingData.itineraryData)}</li>
    <li><b>Total Amount:</b> ₹${bookingData.totalAmount || 0}/-</li>
    ${festivalOfferHtml}
    <li><b>Booking Amount:</b> ₹${bookingData.bookingAmount || 0}/-</li>
    <li><b>Booking Date:</b> ${new Date(bookingData.createdAt).toLocaleDateString()}</li>

    ${addonsHtml ? `<li><b>Extra - Add-ons:</b><ul>${addonsHtml}</ul></li>` : ""}
  </ul>

  <p>You can view your booking details here:
    <a href="${bookingLink}" target="_blank">View Full Itinerary</a>
  </p>

  <p>Kindly review the attached itinerary and let us know if you’d like to make any changes or customizations.</p>
  <p>Once confirmed, we’ll proceed with your booking and payment details.</p>

  <p>We look forward to making your journey memorable!</p>

  <p><b>Best regards,</b></p>
  <p><b>${bookingData.contact.name}</b><br/>${softwareData?.companyName}</p>

  <p style="margin:0;">
    ${mobileLink} |
    <a href="${bookingData.contact?.socialLinks?.website}" target="_blank" style="color:#007bff; text-decoration:none;">
      ${bookingData.contact?.socialLinks?.website}
    </a>
  </p>
`;


    try {
      const res = await axios.post(`${BASE_URL}/api/emails/send-email`, {
        to: bookingData.clientDetails.email,
        bcc: booking.clientDetails.email2 || undefined,
        subject,
        body,
        html,
      });

      if (res.data.success) {
        alert("Email sent successfully!");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email.");
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!booking) return <div className="p-6 text-center">No booking found</div>;

  const pricing = bookingData?.itineraryData?.pricing || {};
  const offers = bookingData?.itineraryData?.offers || {};
  const festivalOffer = bookingData?.itineraryData?.festivalOffer || null;
  const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
  const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
  const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
  const totalPrice = bookingData?.totalAmount || 0;
  const discountedPrice = bookingData?.itineraryData?.highlightPrice || totalPrice;




  // Calculate festival discount (percentage of actualAmount)
  const festivalDiscount = (festivalOffer?.selected ? ((actualAmount - offerAmount) * festivalOffer.value) / 100 : 0);

  // Total savings including offerAmount + festival discount
  const totalSavings = offerAmount + festivalDiscount;

  const days = bookingData?.itineraryData?.days || [];

  // Step 1: Track images by location to avoid duplicates
  const locationImagesMap = {};

  // Collect all images per NON-departure location
  days.forEach(day => {
    const locations = day.locations || [];
    const images = day.images || [];

    locations.forEach(loc => {
      if (loc.toLowerCase() === "departure") return; // ⛔ SKIP departure

      if (!locationImagesMap[loc]) {
        locationImagesMap[loc] = new Set();
      }
      images.forEach(img => {
        locationImagesMap[loc].add(img);
      });
    });
  });

  // Step 2: Pick one unique image per unique location (max 3)
  const selectedImages = [];
  const usedImages = new Set();

  Object.keys(locationImagesMap).forEach(loc => {
    if (selectedImages.length >= 3) return;

    const availableImages = Array.from(locationImagesMap[loc]).filter(
      img => !usedImages.has(img)
    );

    if (availableImages.length > 0) {
      const randomIdx = Math.floor(Math.random() * availableImages.length);
      const selectedImg = availableImages[randomIdx];
      selectedImages.push(`${BASE_URL}${selectedImg}`);
      usedImages.add(selectedImg);
    }
  });

  // Step 3: If less than 3, fill from day-wise random (skip departure days)
  if (selectedImages.length < 3) {
    const dayWiseImages = days
      .map(day => {
        const isDepartureDay = (day.locations || []).some(
          loc => loc.toLowerCase() === "departure"
        );
        if (isDepartureDay) return null; // ⛔ Skip departure day images

        const imgs = (day.images || []).filter(img => !usedImages.has(img));

        if (imgs.length > 0) {
          const randomIdx = Math.floor(Math.random() * imgs.length);
          const selected = imgs[randomIdx];
          usedImages.add(selected);
          return `${BASE_URL}${selected}`;
        }
        return null;
      })
      .filter(Boolean);

    // Add missing ones
    while (selectedImages.length < 3 && dayWiseImages.length > 0) {
      const img = dayWiseImages.shift();
      if (!selectedImages.includes(img)) {
        selectedImages.push(img);
      }
    }
  }

  // Step 4: Shuffle final 3
  const shuffled = [...selectedImages].sort(() => Math.random() - 0.5);

  // Step 5: Assign with fallbacks
  const mainCircleImage = shuffled[0] || "/r1.jpg";
  const smallCircleImage = shuffled[1] || "/r2.png";
  const thirdCircleImage = shuffled[2] || "/r3.png";


  console.log(days);

  const allLocations = (bookingData?.itineraryData?.days || [])
    .flatMap((d) => d.locations || []);

  const locationCounts = allLocations.reduce((acc, loc) => {
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  let uniqueLocations = Object.entries(locationCounts).map(([loc, count]) => ({
    loc,
    count,
  }));

  // ✅ Remove last location
  uniqueLocations = uniqueLocations.slice(0, -1);

  const tabKeyMap = {
    'Inclusions': 'inclusions',
    'Exclusions': 'exclusions',
    'Terms & Conditions': 'termsandconditions',
    'Cancellation & Refund Policy': 'cancellationandrefundpolicy',
    'Payment Policy': 'travelrequirements'
  };

  const tabIcons = {
    'Inclusions': faCheckCircle,
    'Exclusions': faTimesCircle,
    'Terms & Conditions': faFileContract,
    'Cancellation & Refund Policy': faUndoAlt,
    'Payment Policy': faWallet
  };

  const totalPax =
    Number(bookingData?.clientDetails?.adults || 0) +
    Number(bookingData?.clientDetails?.kids5to12 || 0) +
    Number(bookingData?.clientDetails?.kidsBelow5 || 0);

  return (
    <div ref={componentRef} style={{ fontFamily: "'Poltawski_Nowy'" }} className="relative overflow-hidden  w-full">
      <Helmet>
        <title>{titleState}</title>
        <meta name="description" content={descriptionState} />
        <meta property="og:title" content={titleState} />
        <meta property="og:description" content={ogDescriptionState} />
        <meta property="og:image" content={ogImageState} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={titleState} />
        <meta name="twitter:description" content={ogDescriptionState} />
        <meta name="twitter:image" content={ogImageState} />
      </Helmet>

      <div
        className="absolute top-0 left-0 w-[30%] h-full z-0 bg-repeat-y bg-left"
        style={{ backgroundImage: "url('/bl.jpg')", backgroundSize: "contain" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-[30%] h-full z-0 bg-repeat-y bg-right"
        style={{ backgroundImage: "url('/br.jpg')", backgroundSize: "contain" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8 text-gray-900">
        <div className="flex justify-between items-center py-4 w-full px-6 mb-4">
          <img
            src={
              structureData?.logo
                ? structureData.logo.startsWith("/uploads")
                  ? `${BASE_URL}${structureData.logo}`
                  : structureData.logo
                : "/logo1.png"
            }
            alt="Company Logo"
            className="h-16 w-auto object-contain"
          />
          {user?.mobiles?.[0] && (
            <a
              href={`https://wa.me/${user.mobiles[0].replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-900 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
              {user.mobiles[0].replace(/[^0-9]/g, '')}
            </a>
          )}
        </div>

        <section className="pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row items-start justify-between flex-wrap gap-6 md:gap-0">
            <div className="w-full md:order-1 order-2 md:w-1/2">
              <h1 className="mt-6 text-3xl sm:text-4xl font-[PoltawskiNowy]  font-bold">
                Hi {booking.customerName},
              </h1>
              <p className="text-sm md:text-lg text-gray-700 mt-3">
                Here is the package exclusively designed / tailor made for you
              </p>
              <div className="mt-6 inline-block bg-red-900 text-white text-sm md:text-lg px-4 py-1.5 rounded">
                {booking.nights} Nights / {booking.days} Days
              </div>
              <h3 className="text-lg md:text-2xl font-[PoltawskiNowy] capitalize  font-bold mt-7 leading-snug">
                {booking.customerName.toUpperCase()} || RAJASTHAN TOUR PACKAGE FOR {booking.days} Days With  {Object.keys(bookingData.itineraryData.pricing)[0]} 
              </h3>


              <div className="flex flex-wrap gap-2 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-lg font-medium text-gray-700">
                {uniqueLocations.map(({ loc, count }, i) => (
                  <p key={`loc-${i}`} className="flex items-center gap-1">
                    <span className="text-red-900">•</span> {loc}
                    {count > 1 ? ` ` : ''}
                  </p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap   gap-4 max-w-xl">

                <Link
                  to={softwareData?.g2ReviewLink || "/reviews"} className="text-sm border flex items-center justify-start w-full sm:w-auto px-3 text-gray-800 bg-white rounded-md">
                  <img src="/gg.webp" className="w-14 h-14 object-contain mr-3" alt="Google Logo" />
                  <div className="flex flex-col justify-center">
                    <p className="font-semibold leading-tight">Customer Reviews</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={softwareData?.rating} />
                      <span className="text-red-900 text-xs">({softwareData?.reviews} Google Reviews)</span>
                    </div>
                  </div>
                </Link>
                <Link
                  to={softwareData?.tripadviserlink || "/reviews"}
                  className="text-sm border flex items-center justify-start w-full sm:w-auto px-3 text-gray-800 bg-white rounded-md cursor-pointer hover:shadow-md transition"
                >
                  <img
                    src="/image.png"
                    className="w-12 sm:w-14 h-12 rounded-full p-1 sm:h-14 object-contain mr-3"
                    alt="TripAdvisor Logo"
                  />

                  <div className="flex flex-col justify-center">
                    <p className="font-semibold capitalize leading-tight">TripAdvisor Review</p>

                    <div className="flex items-center gap-2">
                      {/* ⭐ TripAdvisor Rating */}
                      <StarRating rating={softwareData?.tripadvisorRating || 0} />

                      {/* ⭐ Review Count */}
                      <span className="text-red-900 text-xs">
                        ({softwareData?.tripadvisorReviews || 0} Reviews)
                      </span>
                    </div>
                  </div>
                </Link>


              </div>
            </div>
            <div className="relative order-1 md:w-auto max-w-7xl lg:order-2 p-2 sm:p-4 mx-auto lg:w-auto lg:mx-auto flex justify-center">
              <img
                src={mainCircleImage}
                alt="Hero Circle"
                className="w-[250px] sm:w-[280px] md:w-[320px] lg:w-[400px] h-[250px] sm:h-[280px] md:h-[320px] lg:h-[420px] rounded-full object-cover shadow-lg mx-auto lg:mx-0"
              />
              <div className="absolute sm:-top-4 lg:-top-6 sm:-left-8 lg:-left-12 top-0 left-0 block">
                <img
                  src={smallCircleImage}
                  alt="Small Circle"
                  className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md object-cover"
                />
              </div>
              <div className="absolute sm:-bottom-4 lg:-bottom-6 sm:-right-8 lg:-right-12 right-0 bottom-0 block">
                <img
                  src={thirdCircleImage}
                  alt="Small Circle"
                  className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="w-full flex flex-col lg:flex-row mt-9 gap-6">

          <div>

            {(() => {

              const firstSuccessPayment =
                bookingData?.payments?.find((p) => p.status === "success") || null;

              return (
                firstSuccessPayment && (
                  <div
                    style={{ fontFamily: "Montserrat", fontWeight: 600 }}
                    className="my-3  border-red-900 rounded-2xl border w-full flex py-2 flex-col justify-end px-4 md:px-10"
                  >
                    <p className="text-red-900 font-bold text-sm sm:text-lg md:text-xl text-center mt-4">
                      Thank you for depositing the amount ({firstSuccessPayment.amount} INR) —

                      Your Rajasthan trip is confirmed! <br />
                      Confirmation Number: {bookingData.bookingId} <br />
                      We’re delighted to have you on board. Your itinerary and booking details have been sent—get ready for a royal experience in Rajasthan!
                    </p>


                    <p className="text-red-900 font-bold text-sm sm:text-lg md:text-xl text-center">
                      Please check and approve the Itinerary.
                    </p>

                    {/* APPROVE BUTTON */}
                    <div className="flex flex-wrap mx-auto gap-3 my-2 items-center">



                      {/* GENERATE PDF BUTTON */}
                      <button
                        className="px-4 py-2 h-[44px] flex items-center cursor-pointer bg-[#6a66662c] text-red-900 rounded-lg hover:bg-gray-300 transition-all duration-200 space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handlePrint}
                        disabled={pdfLoading}
                      >
                        {pdfLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-900 border-t-transparent rounded-full animate-spin"></div>
                            <span>{pdfStatus || "Generating PDF..."}</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPrint} className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Generate PDF</span>
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                )
              );
            })()}
          </div>
          <aside className="w-full  min-w-[320px] max-w-[800px] p-4 my-4  rounded-lg shadow-sm border border-red-900">
            <h2 className="text-red-900 text-xl sm:text-2xl font-bold mb-2">Price Summary</h2>
            <p className="text-gray-600 text-sm sm:text-lg mb-4">
              {[
                bookingData?.clientDetails?.adults > 0 ? `${Number(bookingData.clientDetails.adults).toLocaleString('en-IN')} Adults` : null,
                bookingData?.clientDetails?.kids5to12 > 0 ? `${Number(bookingData.clientDetails.kids5to12).toLocaleString('en-IN')} kids (5–12)` : null,
                bookingData?.clientDetails?.kidsBelow5 > 0 ? `${Number(bookingData.clientDetails.kidsBelow5).toLocaleString('en-IN')} kids (Below 5)` : null,
                bookingData?.clientDetails?.extraBeds > 0 ? `${Number(bookingData.clientDetails.extraBeds).toLocaleString('en-IN')} extra mattress` : null,
                bookingData?.clientDetails?.rooms > 0 ? `${Number(bookingData.clientDetails.rooms).toLocaleString('en-IN')} room` : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="space-y-3 text-sm sm:text-lg">
              {offerAmount > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 text-lg line-through">Original:</span>
                  <span className="text-2xl font-bold text-gray-500 line-through">₹{actualAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {festivalOffer && festivalOffer.selected && (
                <div className="bg-red-50 p-2 rounded-md">
                  <p className="text-red-900 font-semibold text-sm">
                    Festival Offer ({festivalOffer.name}): {festivalOffer.value}% Off
                  </p>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 text-lg">Total:</span>
                <span className="text-2xl font-bold text-red-900 transition-colors hover:text-red-800">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-1">
                <p className="flex justify-between text-gray-700">
                  Received Amount:
                  <span className="font-semibold text-red-800">
                    ₹{bookingData?.payments?.find((p) => p.status === "success")?.amount?.toLocaleString("en-IN") || 0}
                  </span>
                </p>
              </div>


              {totalSavings > 0 && (
                <div className="bg-red-50 p-2 rounded-md">
                  <p className="text-green-600 font-semibold  flex justify-between items-center">
                    <span>Total Savings: ₹{totalSavings.toLocaleString('en-IN')}</span>
                    <div className="w-16 bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((totalSavings / (actualAmount || totalPrice)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </p>
                </div>
              )}

              {Array.isArray(bookingData?.addons) && bookingData.addons.length > 0 && (
                <div className="space-y-2 mt-3">
                  <h3 className="text-gray-700 text-lg font-semibold">Add-ons - Extra</h3>

                  {bookingData.addons.map((addon, index) => (
                    <div key={index} className="flex justify-between border p-2 rounded-md bg-gray-50">
                      <span className="text-gray-600 text-sm">{addon.title}</span>

                      <span className="text-gray-800 font-semibold text-sm">
                        ₹{Number(addon.value || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}


            </div>
          </aside>
        </div>


        <section className="mt-12">

          <div className=' sm:text-2xl md:text-3xl font-extrabold text-lg text-red-900'>
            Travel Itinerary
          </div>

          <p className="text-gray-700 mt-1 flex flex-wrap gap-2 font-inter">

            <p className='text-red-900 text-xl'>Covering Destinations</p>
           {(() => {
  const allDays = bookingData.itineraryData?.days || [];

  // 🔹 Location → Night Count
  const locationNightCount = {};

  allDays.forEach((day) => {
    const dayLocs = day.locations || [];
    dayLocs.forEach((loc) => {
      const cleanLoc = loc.trim().toLowerCase();

      if (cleanLoc === "departure") {
        // Departure → no nights
        locationNightCount["Departure"] = 0;
      } else {
        locationNightCount[loc] = (locationNightCount[loc] || 0) + 1;
      }
    });
  });

  // 🔹 Unique locations
  const uniqueLocations = Object.keys(locationNightCount);

  return uniqueLocations.length > 0 ? (
    uniqueLocations.map((loc, i) => (
      <span key={i} className="flex items-center gap-1">
        <FontAwesomeIcon
          icon={faLocationArrow}
          className="text-red-900 mr-1 w-2 h-2"
        />

        {/* Location Name */}
        <span>{loc}</span>

        {/* Nights (Skip if 0 or departure) */}
        {locationNightCount[loc] > 0 && (
          <span className="text-red-900 ml-1 text-sm">
            – {locationNightCount[loc]}N
          </span>
        )}
      </span>
    ))
  ) : (
    <span>
      <FontAwesomeIcon
        icon={faCircle}
        className="text-gray-700 mr-1 w-2 h-2"
      />
      Location not available
    </span>
  );
})()}

          </p>
          {bookingData?.itineraryData?.tourcode && (
            <p className="text-gray-700 my-3 underline text-sm md:text-base">
              <span className="font-semibold text-gray-900">Tour Code:</span>{" "}
              <span className="text-red-900 font-medium">{bookingData.itineraryData.tourcode}</span>
            </p>
          )}
          <div className="mt-6 space-y-10">
            {(booking.itinerary || []).map((item, index) => (
              <div key={`it-day-${index}`} className="flex flex-col sm:flex-row text-lg gap-4 sm:gap-6">
                <div className="flex gap-6 ">
                  <div className=" sm:w-28 sm:text-right text-left">
                    <p className="text-red-900 font-semibold">{item.day}</p>
                    {item.date && <p className="text-gray-600 text-sm">{item.date}</p>}


                  </div>
                  {(item.locations || []).length > 0 && (
                    <p className="text-gray-700 sm:hidden block capitalize  mt-1">
                      {item.locations.map((l, i) => (i ? `, ${l}` : l))}
                      {item.locations.length > 4 ? "…" : ""}
                    </p>
                  )}
                </div>
                <div className="relative md:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                  {index !== booking.itinerary.length - 1 && (
                    <div className="absolute top-4 bottom-0 w-0.5 bg-red-900"></div>
                  )}
                  <div className="w-4 h-4 rounded-full border-2 border-red-900 bg-white z-10"></div>


                </div>


                <div className="flex-1">
                  <button
                    onClick={() => setOpenDayIndex(openDayIndex === index ? null : index)}
                    className="w-full text-left font-semibold text-gray-900 flex items-center justify-between"
                  >
                    <span className="font-[PoltawskiNowy] ">{item.title}</span>
                  </button>
                  {(item.locations || []).length > 0 && (
                    <p className="text-gray-700  mt-1">
                      {item.locations.map((l, i) => (i ? `, ${l}` : l))}
                      {item.locations.length > 4 ? "…" : ""}
                    </p>
                  )}
                  <div className="mt-4">
                    <div className="flex justify-start w-full">
                      {item.img && item.img.length > 0 ? (
                        <Swiper
                          modules={[Pagination, Autoplay]}
                          pagination={{ clickable: true }}
                          autoplay={{ delay: 3000, disableOnInteraction: false }}
                          loop
                          spaceBetween={20}
                          className="rounded-lg overflow-hidden w-full max-w-3xl h-64 sm:h-72 md:h-80 lg:h-96"
                        >
                          {item.img &&
                            item.img
                              .sort(() => Math.random() - 0.5) // 🔀 Randomize array order
                              .slice(0, 3) // 🎯 Take only 3 images
                              .map((image, index) => (
                                <SwiperSlide key={index} className="flex justify-center items-center">
                                  <img
                                    src={image}
                                    alt={`${item.title} - ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </SwiperSlide>
                              ))}

                        </Swiper>
                      ) : (
                        <img
                          src=""
                          alt="Placeholder"
                          className="rounded-lg object-cover w-full max-w-xs h-60 sm:h-72 md:h-80"
                        />
                      )}
                    </div>
                    <div className="mt-3 text-gray-800">
                      {booking?.vehicle && (
                        <p className="font-semibold bg-red-900 mb-2 inline-flex px-2 py-1 rounded-lg gap-2 text-white text-xs sm:text-lg">
                          <CarFront className="" />  {booking.vehicle.model}
                        </p>
                      )}
                      <div
                        className="ql-editor text-lg  text-muted-foreground  prose prose-sm sm:prose-lg max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: item.desc }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {bookingData?.noteText && (
          <div className="relative my-4 p-4 border-l-4 border-l-yellow-700 rounded-2xl border border-yellow-300 bg-yellow-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex gap-2">
              {/* ICON */}
              <svg
                className="w-5 h-5 text-black mt-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v6H9V5zm0 8h2v2H9v-2z" />
              </svg>

              {/* HEADING + TEXT (Perfect Wrapped Alignment) */}
              <p className="text-md md:text-lg text-black font-bold leading-relaxed whitespace-pre-wrap">
                <strong className="text-xl md:text-lg font-bold text-black">
                  Note :-{" "}
                </strong>
                {bookingData.noteText}
              </p>

            </div>
          </div>
        )}


        {(() => {
          // STEP 1: Get selected category
          const selectedCategory = Object.keys(bookingData?.itineraryData?.pricing || {})
            .find((key) => bookingData.itineraryData.pricing[key] > 0);

          // STEP 2: Hotel selection days (false = hotel booked, true = no hotel, undefined = ignore)
          const hotelSelectionDays = bookingData?.hotelSelectionDays?.[selectedCategory] || {};

          // STEP 3: Travel date setup
          const travelDate = bookingData?.clientDetails?.travelDate;
          const [d, m, y] = travelDate.split("-");
          const startDate = new Date(`${y}-${m}-${d}`);

          const getDateForDay = (dayNum) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + dayNum - 1);
            return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          };

          const getHotelId = (hotel) => hotel?.id || hotel?._id || hotel?.hotelId || null;

          // STEP 4: Get all itinerary days
          const allDays = bookingData?.itineraryData?.days || [];
          const maxDay = Math.max(...allDays.map(d => d.id), 1);

          const timelineItems = [];

          for (let dayNum = 1; dayNum <= maxDay; dayNum++) {
            const selectionStatus = hotelSelectionDays[dayNum]; // could be true, false, or undefined

            // Agar explicitly true hai → No Hotel
            if (selectionStatus === true) {
              timelineItems.push({
                type: 'no-hotel',
                dayNum,
                checkInDate: getDateForDay(dayNum),
                checkOutDate: getDateForDay(dayNum + 1)
              });
              continue;
            }

            // Agar explicitly false hai → Hotel Booked
            if (selectionStatus === false) {
              const dayHotels = bookingData?.itineraryData?.hotels?.[dayNum];
              if (dayHotels) {
                const cities = Object.keys(dayHotels).filter(c => c !== "selected" && c !== "category");

                const fingerprint = cities
                  .map(city => {
                    const meals = dayHotels[city];
                    return Object.entries(meals)
                      .map(([mealType, hotel]) => {
                        const id = getHotelId(hotel);
                        return id ? `${mealType}:${id}` : '';
                      })
                      .filter(Boolean)
                      .sort()
                      .join(',');
                  })
                  .filter(Boolean)
                  .sort()
                  .join("|");

                const lastItem = timelineItems[timelineItems.length - 1];

                if (lastItem?.type === 'hotel' && lastItem.fingerprint === fingerprint && dayNum === lastItem.endDay + 1) {
                  // Extend group
                  lastItem.endDay = dayNum;
                  lastItem.days.push(dayNum);
                  lastItem.checkOutDate = getDateForDay(dayNum + 1);
                } else {
                  // New group
                  const allMeals = {};
                  cities.forEach(city => {
                    allMeals[city] = { ...dayHotels[city] };
                  });

                  timelineItems.push({
                    type: 'hotel',
                    startDay: dayNum,
                    endDay: dayNum,
                    days: [dayNum],
                    fingerprint,
                    allMeals,
                    checkInDate: getDateForDay(dayNum),
                    checkOutDate: getDateForDay(dayNum + 1)
                  });
                }
              }
              continue;
            }

            // Agar day ka entry hi nahi hai hotelSelectionDays mein → ignore (kuch mat dikhao)
            // Ya phir agar hotel data hai toh dikhao (fallback)
            const dayHotels = bookingData?.itineraryData?.hotels?.[dayNum];
            if (dayHotels) {
              // Same hotel grouping logic as above...
              const cities = Object.keys(dayHotels).filter(c => c !== "selected" && c !== "category");
              if (cities.length > 0) {
                const fingerprint = cities
                  .map(city => {
                    const meals = dayHotels[city];
                    return Object.entries(meals)
                      .map(([mealType, hotel]) => {
                        const id = getHotelId(hotel);
                        return id ? `${mealType}:${id}` : '';
                      })
                      .filter(Boolean)
                      .sort()
                      .join(',');
                  })
                  .filter(Boolean)
                  .sort()
                  .join("|");

                const lastItem = timelineItems[timelineItems.length - 1];

                if (lastItem?.type === 'hotel' && lastItem.fingerprint === fingerprint && dayNum === lastItem.endDay + 1) {
                  lastItem.endDay = dayNum;
                  lastItem.days.push(dayNum);
                  lastItem.checkOutDate = getDateForDay(dayNum + 1);
                } else {
                  const allMeals = {};
                  cities.forEach(city => allMeals[city] = { ...dayHotels[city] });

                  timelineItems.push({
                    type: 'hotel',
                    startDay: dayNum,
                    endDay: dayNum,
                    days: [dayNum],
                    fingerprint,
                    allMeals,
                    checkInDate: getDateForDay(dayNum),
                    checkOutDate: getDateForDay(dayNum + 1)
                  });
                }
              }
            }
          }

          // City Summary (only booked nights)
          const cityNights = {};
          timelineItems.forEach(item => {
            if (item.type === 'hotel') {
              Object.keys(item.allMeals).forEach(city => {
                if (city !== "selected" && city !== "category") {
                  cityNights[city] = (cityNights[city] || 0) + item.days.length;
                }
              });
            }
          });

          const parseDate = (str) => {
            const [dd, mm, yyyy] = str.split("-");
            return new Date(`${yyyy}-${mm}-${dd}`);
          };

          const pad = (num) => String(num).padStart(2, "0");


          const getDateForDays = (dayNumber) => {
            const baseDate = parseDate(booking.clientDetails.travelDate);
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + (dayNumber - 1));

            return newDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          };

          const formatRangeDate = (startDay, endDayPlusOne) => {
            const start = new Date(startDate);
            start.setDate(start.getDate() + (startDay - 1));

            const end = new Date(startDate);
            end.setDate(end.getDate() + (endDayPlusOne - 1));

            const options = { day: "2-digit", month: "short", year: "numeric" };

            const startDayStr = start.getDate().toString().padStart(2, "0");
            const endDayStr = end.getDate().toString().padStart(2, "0");

            const month = start.toLocaleString("en-GB", { month: "short" });
            const year = start.getFullYear();

            return `${startDayStr}-${endDayStr} ${month} ${year}`;
          };


          if (timelineItems.length === 0) return null;

          return (
            <section className="mt-14 mb-3.5">
              <h1 style={{ fontFamily: "'PoltawskiNowy'" }} className="text-xl md:text-2xl font-bold">
                Hotels Details :{" "}
                <span className="text-red-900">
                  {bookingData.selectedItinerary.duration}
                </span>
              </h1>

              {Object.keys(cityNights).length > 0 && (
                <p className="text-gray-700 mt-2 text-lg font-medium">
                  {Object.entries(cityNights)
                    .map(([city, nights]) => `${city.charAt(0).toUpperCase() + city.slice(1)} - ${nights}N`)
                    .join(" | ")}
                </p>
              )}

              <div className="mt-8 space-y-12">
                {timelineItems.map((item, idx) => {
                  // NO HOTEL BOOKED (Only when explicitly true)
                  if (item.type === 'no-hotel') {
                    return (
                      <div key={`no-hotel-${item.dayNum}`} className="flex flex-col  gap-4 sm:gap-6">
                        <div className="w-full ">
                          <p className="text-white bg-red-800 inline-flex px-4 rounded-full font-semibold text-lg">Night 0{item.dayNum}</p><br />
                          <p className="bg-red-50 mt-2 px-4 py-0 inline-flex items-center rounded-full text-red-700 border border-red-200">01 Night</p>
                        </div>



                        <div className="flex-1">
                          <div className="bg-gray-50 border-l-4  border rounded-xl p-5">
                            <div className="flex items-start gap-4">
                              {/* <FontAwesomeIcon icon={faTriangleExclamation} className="w-7 h-7 text-red-800 flex-shrink-0 mt-1" /> */}
                              <div>

                                {/* <div className="flex items-center gap-2">
                                                                          <p className="bg-red-900 font-bold text-white px-3 py-1 inline-flex items-center rounded-full">
                                                                              Day {String(item.dayNum).padStart(2, "0")} 
                                                                          </p>
                                                                      </div> */}
                                <div className="mt-2 flex items-center gap-2">
                                  <FontAwesomeIcon icon={faHotel} size="3x" className="w-5 h-5 text-gray-700 mt-0.5" />
                                  <p className="text-gray-900 text-base leading-relaxed">
                                    No hotels booked for this day. Guest will arrange their own accommodation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // HOTEL BOOKED
                  const isMultiNight = item.days.length > 1;
                  const displayLabel = isMultiNight ? `Night ${pad(item.startDay)} - ${pad(item.endDay)}` : `Night - ${pad(item.startDay)}`;

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6">


                      {/* <div className="relative md:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                                                      {idx !== timelineItems.length - 1 && (
                                                          <div className="absolute top-8 bottom-0 w-0.5 bg-red-900"></div>
                                                      )}
                                                      <div className="w-5 h-5 rounded-full border-3 border-red-900 bg-white z-10 shadow-md"></div>
                                                  </div> */}

                      <div className="flex-1 space-y-2 ">


                        <div className=' mb-3 '>
                          <p className="bg-red-900 font-bold text-white flexco px-3 py-1 inline-flex items-center rounded-full">
                            {displayLabel}

                          </p>

                          <br />

                          <p className="bg-red-50 mt-2 px-4 py-0 inline-flex items-center rounded-full text-red-700 border border-red-200">
                            <span className="  text-sm">
                              {formatRangeDate(item.startDay, item.endDay + 1)} -
                            </span>   {pad(item.days.length)} Night{item.days.length > 1 ? "s" : ""}
                          </p>


                        </div>
                        {Object.entries(item.allMeals).map(([city, mealsObj]) => {
                          if (city === "selected" || city === "category") return null;
                          const mealEntries = Object.entries(mealsObj);
                          const primaryHotel = mealEntries[0][1];

                          return (
                            <div key={city} className="flex flex-col lg:flex-row gap-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                              <div className="w-full lg:w-80">
                                <img
                                  src={`${BASE_URL}${primaryHotel.image}`}
                                  alt={primaryHotel.name}
                                  className="w-full h-56 lg:h-64 object-cover rounded-xl shadow-md"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              </div>
                              <div className="flex-1 ">
                                <div className="flex items-center gap-3 mb-3">
                                  <StarRating rating={primaryHotel.rating || 0} />
                                  <span className="text-red-900 font-bold">{city.toUpperCase()}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {[...new Set(mealEntries.map(([_, h]) => h.name))].join(" / ")}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Based on {primaryHotel.reviews || "0"} Reviews
                                </p>
                                <div className="my-4 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-lg font-semibold text-red-900">
                                    Check-in: <span className="font-bold text-black">{item.checkInDate}</span>
                                  </p>
                                  <p className="text-lg font-semibold text-red-900">
                                    Check-out: <span className="font-bold text-black">{item.checkOutDate}</span>
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {mealEntries.map(([mealType]) => (
                                    <div key={mealType} className="flex items-center gap-2 bg-red-50 text-red-800 px-4 py-0.5 rounded-full text-sm font-medium border border-red-200">
                                      <FontAwesomeIcon icon={mealIcons[mealType]} className="w-4 h-4" />
                                      <span className="capitalize">{mealType} </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}


        {/* Tour Policies - Using Viewdata4 Tabs */}
        <section className="mb-6 mt-4">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 font-inter">Tour Policies</h2>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full">
              <div className="flex gap-6 border-b font-semibold overflow-x-auto whitespace-nowrap pb-2">
                {["Inclusions", "Exclusions", "Terms & Conditions", "Cancellation & Refund Policy", "Payment Policy"].map((tab) => {
                  const key = tabKeyMap[tab];
                  return (
                    <button
                      key={tab}
                      className={`pb-2 text-sm sm:text-base flex items-center gap-2 ${activeTab === key ? "text-black border-b-2 border-red-900" : "text-gray-500 hover:text-gray-700"} transition-colors`}
                      onClick={() => setActiveTab(key)}
                    >
                      <FontAwesomeIcon icon={tabIcons[tab]} className={`w-4 h-4 ${activeTab === key ? 'text-red-900' : 'text-gray-500'}`} />
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-black space-y-4">

                {/* ✅ INCLUSIONS = FULL ACCORDION */}
                {activeTab === "inclusions" && (
                  <div className="space-y-4">
                    {policies.inclusions.map((item, i) => {
                      const hasImage = (item.images && item.images.length > 0) || item.image;
                      return (
                        <div key={`inc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                          <button
                            onClick={() => toggleAccordion(`inc-${i}`)}
                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center font-poppins bg-gradient-to-r from-gray-50 to-white hover:from-red-50 hover:to-white transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5 text-red-900" />
                              <span className="text-gray-800">{item.title}</span>
                            </div>
                            <span className={`transform transition-transform text-red-900 text-xl ${expandedItems[`inc-${i}`] ? 'rotate-180' : ''}`}>
                              <FaArrowDown />
                            </span>
                          </button>

                          {expandedItems[`inc-${i}`] && (
                            <div className="p-4 sm:p-5">
                              {hasImage && (
                                <div className="float-left mr-4 mb-2">
                                  {item.images?.length > 0 && (
                                    <img
                                      src={`${BASE_URL}/${item.images[0]}`}
                                      alt={item.title}
                                      className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                    />
                                  )}

                                  {item.image && !item.images?.length && (
                                    <img
                                      src={`${BASE_URL}/${item.image}`}
                                      alt={item.title}
                                      className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                    />
                                  )}
                                </div>
                              )}

                              <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed font-roboto text-gray-700">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ❌ OTHER TABS = ONLY TITLE (NO DROPDOWN) */}
                {activeTab !== "inclusions" && (
                  <div className="space-y-4">
                    {(
                      activeTab === "exclusions"
                        ? policies.exclusions
                        : activeTab === "termsandconditions"
                          ? policies.termsAndConditions
                          : activeTab === "cancellationandrefundpolicy"
                            ? policies.cancellationAndRefundPolicy
                            : activeTab === "paymentpolicy"
                              ? policies.paymentPolicy
                              : []
                    ).map((item, i) => (
                      <div
                        key={i}
                        className="border-2 border-gray-200 rounded-xl shadow-md p-4 flex items-center gap-3 font-poppins"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5 text-red-900" />
                        <span className="font-semibold text-base sm:text-lg md:text-xl text-gray-800">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>


        {/* <div className="print:hidden">
                    <Pdf />
                </div> */}

        <section className="mt-14 text-lg">
          <p className="font-[PoltawskiNowy]  font-bold text-lg">{tour?.name}</p>
          <div className="md:flex md:justify-between gap-8 mt-4">
            <div className="md:w-1/2 space-y-4 text-justify">
              {tour?.description?.slice(0, Math.ceil(tour.description.length / 2)).map((desc, index) => (
                <p key={index}>{desc}</p>
              ))}
            </div>
            <div className="md:w-1/2 space-y-4 text-justify mt-6 md:mt-0">
              {tour?.description?.slice(Math.ceil(tour.description.length / 2)).map((desc, index) => (
                <p key={index}>{desc}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 text-lg">
          <h3 className="font-[PoltawskiNowy]  font-bold mb-4 underline">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tour?.achievements?.map((ach, index) => (
              <img
                key={index}
                src={`${BASE_URL}${ach.imageUrl}`}
                alt="achievement"
                className="w-full h-48 md:h-56 object-cover rounded-lg"
              />
            ))}
          </div>
        </section>
        <div className="w-full relative flex bg-[#9F0712] bg-center rounded-xl justify-center my-6">
          <div
            className="
            w-full bg-cover relative  overflow-hidden
             flex flex-col items-center 
            py-10 px-4
        "
          >


            <img
              loading="eager"
              src="/m4.png"
              alt="Decorative corner pattern"
              className="
    absolute z-0 
    sm:w-[200px] w-[180px]
    bottom-[-52%]
    right-0 translate-x-1/2    /* apni width ka 50% bahar */
    corner-image
  "
            />

            <img
              loading="eager"
              src="/m4.png"
              alt="Decorative corner pattern"
              className="
    absolute z-0 
    sm:w-[200px] w-[180px]
    top-[-52%]
    left-0 -translate-x-1/2     /* apni width ka 50% bahar */
    corner-image
  "
            />

            <button
              onClick={() => window.open("/pdf_compressed.pdf", "_blank")}
              className="
                group flex items-center gap-2
                px-6 py-3 capitalize cursor-pointer my-4
                text-red-900 hover:text-red-800
                bg-white font-semibold  border
                rounded-full shadow-md 
                transition-all duration-300
                text-sm sm:text-base md:text-xl
                hover:shadow-lg hover:scale-105
            "
            >


              <span>Click to View About Our Travel Agency</span>


            </button>
          </div>
        </div>

        <div className="flex capitalize font-semibold text-2xl my-4 items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="approveCheck"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            className="w-4 h-4"
          />
          <label htmlFor="approveCheck" className=" text-gray-800 ">
            all the informaiotn provided is accurate. i approve this Itinerary
          </label>
        </div>

        {!booking?.approvel && (
          <button
            onClick={handleApprove}
            disabled={approveLoading || !isChecked}   // <-- Only enabled when checked
            className="inline-flex items-center text-2xl justify-center gap-2 px-4 py-2 bg-red-900 
                           text-white rounded-lg hover:bg-red-700 transition-colors font-medium   mb-6
                           sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approveLoading ? (
              <>
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-8 h-8" />
                <span>Approved</span>
              </>
            )}
          </button>
        )}


        <section className="mt-12">
          <div className="flex flex-col text-lg lg:flex-row gap-6">
            <div className="flex-1 border p-2 bg-white rounded-2xl">
              <h2 className="text-xl md:text-2xl font-[PoltawskiNowy]  font-bold mb-4">Write to us</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" value={form.packageTitle} readOnly />
                <div>
                  <label className="text-xs sm:text-lg text-gray-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    readOnly
                    className="border-b w-full p-2 text-sm bg-gray-100 cursor-not-allowed outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-lg text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="border-b w-full p-2 text-sm bg-gray-100 cursor-not-allowed outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-lg text-gray-700">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="border w-full p-2 resize-none text-sm bg-transparent outline-none"
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadings}
                  className={`px-6 py-2 rounded mt-2 text-sm transition-colors ${loadings ? "bg-gray-400 cursor-not-allowed text-white" : "bg-red-900 hover:bg-red-800 text-white"
                    }`}
                >
                  {loadings ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
            {bookingData.contact && (
              <div className="w-full border rounded-2xl border-[#0000006c] p-4 text-lg lg:w-80 xl:w-96">
                <h3 className="text-gray-700 text-sm mb-1">Contact</h3>
                <h2 className="text-xl md:text-2xl font-[PoltawskiNowy]  font-bold mb-2">{bookingData.contact.name}</h2>
                <p className="text-gray-800 flex flex-col mb-2 text-lg">
                  <span className="font-semibold">Call To Expert</span>
                  {(bookingData.contact.mobiles || []).map((mobile, index) => {
                    const cleanMobile = mobile
                    return (
                      <a key={`mobile-${index}`} href={`tel:${cleanMobile}`} className="text-gray-700 hover:underline">
                        {cleanMobile}
                      </a>
                    );
                  })}
                </p>
                <p className="text-gray-800 flex flex-col mb-2 text-lg">
                  <span className="font-semibold">Email</span>
                  {(bookingData.contact.emails || []).map((email, index) => {
                    const cleanEmail = email.replace(/^mailto:/, "");
                    return (
                      <a
                        key={`email-${index}`}
                        href={`mailto:${cleanEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:underline break-all"
                      >
                        {cleanEmail}
                      </a>
                    );
                  })}
                </p>
                <p className="text-gray-800 flex flex-col mb-2 text-lg">
                  <span className="font-semibold">Address</span>
                  <span>
                    {bookingData.contact.addresses?.[0]
                      ? `${bookingData.contact.addresses[0].street}, ${bookingData.contact.addresses[0].area}, ${bookingData.contact.addresses[0].city}, ${bookingData.contact.addresses[0].state} ${bookingData.contact.addresses[0].pincode}`
                      : ""}
                  </span>
                </p>
                <p className="text-gray-800 flex flex-col mb-2 text-lg font-inter">
                  <span className="font-semibold">SOS Number</span>
                  <span>
                    {structureData?.sosNumber ? (
                      <a
                        href={`tel:${structureData.sosNumber}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {structureData.sosNumber}
                      </a>
                    ) : (
                      "Not Available"
                    )}
                  </span>
                </p>
                <p className="text-gray-800 flex flex-col mb-2 text-sm sm:text-lg font-inter">

                  <Link to={softwareData?.g2ReviewLink || "/reviews"}>
                    {structureData?.sosNumber ? (
                      <a
                        href={softwareData?.g2ReviewLink}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Get Direction
                      </a>
                    ) : (
                      "Not Available"
                    )}
                  </Link>
                </p>

                <div className="mt-4">
                  <div className="flex items-center">
                    <span className="text-gray-800 mr-2 text-lg">Follow us on</span>
                    {bookingData.contact.socialLinks &&
                      Object.entries(bookingData.contact.socialLinks).map(([platform, link]) => {
                        if (!link) return null;
                        return (
                          <a
                            key={platform}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 hover:text-red-900 text-lg"
                          >
                            <FontAwesomeIcon icon={iconsMap[platform]} />
                          </a>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="text-center text-gray-700 text-xs sm:text-lg py-8">
          © {softwareData?.year || new Date().getFullYear()} {softwareData?.companyName || "Rajasthan Tourism"}. All rights reserved.
        </footer>
      </div>



      <style media="print">{`
  @media print {

    html, body {
      height: 10000px !important; /* single long page */
      overflow: visible !important;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: white !important;
      color: black !important;
    }
  
    * {
      page-break-before: avoid !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }

    .print\\:hidden {
      display: none !important;
    }

    /* MOST IMPORTANT PART */
    @page {
      
      margin: 0 !important;
    }
  }
`}</style>
    </div>
  );
};

export default Viewdata4;
