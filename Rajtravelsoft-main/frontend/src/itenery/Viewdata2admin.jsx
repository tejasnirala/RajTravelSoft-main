"use client"

import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import "swiper/css"
import "swiper/css/pagination"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPrint, faSpinner } from "@fortawesome/free-solid-svg-icons"
import { faFacebookF, faTwitter, faInstagram, faLinkedinIn, faYoutube, faWhatsapp }
    from "@fortawesome/free-brands-svg-icons";

import { Coffee, Utensils, UtensilsCrossed, Phone, Mail, Info, ChevronDown, AlertTriangle, Pointer, CheckCircle2 }
    from "lucide-react";

import { faGlobe, faEnvelope }
    from "@fortawesome/free-solid-svg-icons";
import { useParams, useSearchParams } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { CarFront, MapPin } from "lucide-react";
import Pdf from "../pending/Pdf"
import { Helmet } from "react-helmet-async"
import { toast } from "react-toastify"


const StarRating = ({ rating, reviews }) => {
    const totalStars = 5
    const r = Math.round(Number(rating) || 0)
    return (
        <div className="flex items-center flex-wrap gap-1 text-yellow-400">
            {[...Array(totalStars)].map((_, index) => (
                <span key={index}>{index + 1 <= r ? "★" : "☆"}</span>
            ))}
            <span className="text-xs text-gray-600 ml-1">{Number(rating).toFixed(1)}</span>
            {reviews && <span className="text-xs text-gray-600 ml-1">({reviews} reviews)</span>}
        </div>
    )
}

const iconsMap = {
    facebook: faFacebookF,
    twitter: faTwitter,
    instagram: faInstagram,
    linkedin: faLinkedinIn,
    youtube: faYoutube,
    website: faGlobe,
}

const renderDescription = (description) => {
    if (!description) return <p className="text-gray-700">No description available.</p>
    return <div className="ql-editor bg-transparent prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
}

const calculateDuration = (itinerary) => {
    if (!itinerary?.days?.length) return "0 Days";
    return `${itinerary.days.length} Days`;
};

const Viewdata5Redesigned = ({ id: parmsId, autoDownload, onDownloadComplete }) => {
    const componentRef = useRef(null)
    const id = useParams().id || parmsId
    const BASE_URL = "https://apitour.rajasthantouring.in"

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [bookingData, setBookingData] = useState(null)
    const [booking, setBooking] = useState(null)
    const [inclusions, setInclusions] = useState([])
    const [exclusions, setExclusions] = useState([])
    const [terms, setTerms] = useState([])
    const [cancellationPolicy, setCancellationPolicy] = useState([])
    const [travelRequirements, setTravelRequirements] = useState([])
    const [user, setUser] = useState(null)
    const [structureData, setStructureData] = useState(null)
    const [tour, setTour] = useState(null)
    const [softwareData, setSoftwareData] = useState(null)
    const [form, setForm] = useState({
        packageTitle: "",
        name: "",
        email: "",
        message: "",
        mobile: "",
    })

    const [approveLoading, setApproveLoading] = useState(false);
    const [loadings, setLoadings] = useState(false)
    const [emailLoading, setEmailLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("inclusions")
    const [expandedSections, setExpandedSections] = useState({})
    const [openDayIndex, setOpenDayIndex] = useState(null);
    const [itineraryUrl, setItineraryUrl] = useState('');
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");

    const [pdfLoading, setPdfLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const isPuppeteer = searchParams.get("print") === "1";
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [pdfStatus, setPdfStatus] = useState("");
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
        if (autoDownload && id && booking) {
            setTimeout(() => {
                handlePrint();
            }, 300); // delay ensures DOM renders
        }
    }, [autoDownload, id, booking])


    const handleApprove = async () => {
        if (approveLoading || booking?.approvel) return;

        setApproveLoading(true);

        try {
            const response = await axios.put(
                `https://apitour.rajasthantouring.in/api/bookings/approve/${id}`,
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


    const transformBooking = (data) => {
        const startDate = data.selectedItinerary?.date ? new Date(data.selectedItinerary.date) : null
        return {
            customerName: data.clientDetails?.name || "Guest",
            nights: data.selectedItinerary?.duration || 0,
            days: (Number.parseInt(data.selectedItinerary?.duration, 10) || 0) + 1,
            price: data.pricing?.mk || data.bookingAmount || 0,
            vehicle: data.itineraryData?.vehicle
                ? { make: data.itineraryData.vehicle.make, model: data.itineraryData.vehicle.model }
                : null,
            itinerary: (data.itineraryData?.days || []).map((day) => {
                let dateStr = ""
                if (startDate && day.id) {
                    const dayDate = new Date(startDate)
                    dayDate.setDate(startDate.getDate() + (day.id - 1))
                    dateStr = dayDate.toLocaleDateString()
                }
                return {
                    id: day.id,
                    day: `Day ${day.id}`,
                    date: dateStr,
                    title: day.titles?.[0] || "Untitled",
                    img:
                        day.images && day.images.length > 0
                            ? day.images.map((img) => `${BASE_URL}${img}`)
                            : data.itineraryData?.images && data.itineraryData.images.length > 0
                                ? data.itineraryData.images.map((img) => `${BASE_URL}${img}`)
                                : ["https://via.placeholder.com/300x200"],
                    desc: day.descriptions?.[0] || "No description available",
                    locations: day.locations || [],
                }
            }),

            contact: data.contact,
            approvel: data.approvel
        }
    }

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    // ... existing useEffect hooks ...
    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/bookings/${id}`)
                const booking = await axios.get(`${BASE_URL}/api/ssr-data/${id}`);
                if (!response.ok) throw new Error("Booking not found")
                const data = await response.json()
                const transformed = transformBooking(data)
                setBookingData(data)
                setBooking(transformed)
                // Construct the itinerary URL using booking.theme.link
                if (data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/${data.theme.link}/${id}`);
                } else {
                    // Fallback to current location if no theme.link
                    setItineraryUrl(window.location.href);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch booking")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchBooking()
    }, [id])

    useEffect(() => {
        if (bookingData?.clientDetails) {
            setForm((prev) => ({
                ...prev,
                name: bookingData.clientDetails.name || "",
                email: bookingData.clientDetails.email || "",
                mobile: bookingData.clientDetails.phone || "",
                packageTitle: bookingData?.itineraryData?.titles?.[0] || "",
            }))
        }
    }, [bookingData])

    useEffect(() => {
        const fetchStructureData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/structure`)
                const data = await response.json()
                setStructureData(data)
                setUser(data)
            } catch (error) {
                console.error("Error fetching structure data:", error)
            }
        }
        fetchStructureData()
    }, [])

    useEffect(() => {
        const fetchSoftwareData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/toursoftware`)
                const data = await response.json()
                if (data && data.length > 0) setSoftwareData(data[0])
            } catch (error) {
                console.error("Error fetching software data:", error)
            }
        }
        fetchSoftwareData()
    }, [])

    useEffect(() => {
        const fetchTour = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/achivement`)
                const data = await res.json()
                setTour(data)
            } catch (error) {
                console.error("Error fetching tour:", error)
            }
        }
        fetchTour()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/tour-inclusion-exclusion`)
                if (res.data?.data) {
                    setInclusions(res.data.data.inclusions || [])
                    setExclusions(res.data.data.exclusions || [])
                    setTerms(res.data.data.termsAndConditions || [])
                    setCancellationPolicy(res.data.data.cancellationAndRefundPolicy || [])
                    setTravelRequirements(res.data.data.travelRequirements || [])
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoadings(true)
        try {
            await axios.post(`${BASE_URL}/api/softmails`, form)
            alert("Inquiry submitted successfully!")
            setForm({ ...form, message: "" })
        } catch (err) {
            console.error(err)
            alert("Error submitting inquiry")
        } finally {
            setLoadings(false)
        }
    }

    const handleSendWhatsApp = () => {
        if (!bookingData?.clientDetails) return
        const link = bookingData.theme?.link
        const bookingLink = `https://tour.rajasthantouring.in/${link}/${bookingData._id}`
        const offers = bookingData.itineraryData?.offers || {};
        const festivalOffer = bookingData.itineraryData?.festivalOffer || {};
        const hasFestival = festivalOffer.selected && festivalOffer.value > 0;
        const pricing = bookingData.itineraryData?.pricing || {};
        const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
        const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
        const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
        const baseAfterCategory = actualAmount - offerAmount;
        const festivalDiscount = hasFestival ? Math.round((baseAfterCategory * festivalOffer.value) / 100) : 0;

        const maxOfferEntry = Object.entries(offers).reduce(
            (max, [key, value]) => (value > max[1] ? [key, value] : max),
            ["none", 0]
        );

        // Construct message with proper spacing
        const message = `
Hello ${bookingData.clientDetails.name}!

This is from ${softwareData.companyName}!

Here’s your: ${bookingData.itineraryData?.titles?.[0] || "N/A"}
Duration: ${calculateDuration(bookingData.itineraryData)}
Package Cost: ₹${bookingData.totalAmount || 0}/-
Offer Amount: ₹${maxOfferEntry[1] > 0 ? maxOfferEntry[1] : 0}/-
${hasFestival ? `Festival Offer: ${festivalOffer.name || "Special"} - ${festivalOffer.value}% OFF (₹${festivalDiscount}/-)` : ''}
Booking Amount: ₹${bookingData.bookingAmount || 0}/-
Please review your itinerary and let us know if you’d like any changes before we finalize the booking.

View Itinerary: ${bookingLink}

We’re excited to make your trip truly memorable!
— Team ${softwareData.companyName}
`;

        const phone = bookingData.clientDetails.phone?.replace(/[^0-9]/g, "")
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")
    }

    const handleSendEmail = async () => {
        if (!bookingData?.clientDetails) return
        setEmailLoading(true)

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

        const festivalOfferHtml = hasFestival ? `<li><b>Festival Offer:</b> ${festivalOffer.name || "Special Festival"} - ${festivalOffer.value}% OFF (₹${festivalDiscount}/-)</li>` : '';

        const body = `Dear ${bookingData.clientDetails.name || "Customer"},

Here’s Your Personalized Tour Plan
You can view your booking here: ${bookingLink}

Best regards,
Travel Team`;

        const html = `
      <p>Dear ${bookingData.clientDetails.name || "Customer"},</p>
      <p>Here’s Your Personalized Tour Plan</p>
      <p><b>Booking Details:</b></p>
      <ul>
      
        <li><b>Package:</b> ${bookingData.itineraryData?.titles?.[0] || "N/A"}</li>
        <li><b>Duration:</b> ${calculateDuration(bookingData.itineraryData)}</li>
        <li><b>Total Amount:</b> ₹${bookingData.totalAmount || 0}/-</li>
        ${festivalOfferHtml}
        <li><b>Booking Amount:</b> ₹${bookingData.bookingAmount || 0}/-</li>
        <li><b>Booking Date:</b> ${new Date(bookingData.createdAt).toLocaleDateString()}</li>
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
            setEmailLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-cyan-900 font-medium">Loading your journey...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    if (!booking) return <div className="p-6 text-center">No booking found</div>

    const allLocations = (bookingData?.itineraryData?.days || []).flatMap((d) => d.locations || [])
    const locationCounts = allLocations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1
        return acc
    }, {})
    const uniqueLocations = Object.entries(locationCounts).map(([loc, count]) => ({ loc, count }))

    const pricing = bookingData?.itineraryData.pricing || {}
    const offers = bookingData?.itineraryData.offers || {}
    const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0)
    const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0
    const totalPrice = bookingData?.totalAmount || 0
    const highlightPrice = bookingData?.itineraryData.highlightPrice

    const festivalOffer = bookingData.itineraryData?.festivalOffer
    const hasFestival = festivalOffer?.selected && festivalOffer.value > 0
    const baseAfterCategory = actualAmount - offerAmount
    const festivalDiscount = hasFestival ? Math.round((baseAfterCategory * festivalOffer.value) / 100) : 0

    const getAllImages = () => {
        const dayImages =
            bookingData.itineraryData?.days?.flatMap((day) => {
                if (day.images && day.images.length > 0) {
                    return day.images.map((img) => `${BASE_URL}${img}`);
                } else if (bookingData.itineraryData?.images?.length > 0) {
                    return bookingData.itineraryData.images.map((img) => `${BASE_URL}${img}`);
                } else if (bookingData.selectedItinerary?.images?.length > 0) {
                    return bookingData.selectedItinerary.images.map((img) => `${BASE_URL}${img}`);
                } else {
                    return ["https://via.placeholder.com/800x500"];
                }
            }) || [];

        return dayImages;
    };

    const allImages = getAllImages();

    const fallbackImage =
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    // ✅ Get one random image from allImages
    const getRandomImage = () => {
        if (allImages.length === 0) return fallbackImage;
        const randomIndex = Math.floor(Math.random() * allImages.length);
        return allImages[randomIndex];
    };
    const statusColors = {
        confirmed: "bg-teal-100 text-teal-800",
        pending: "bg-yellow-100 text-yellow-800",
        cancelled: "bg-red-100 text-red-800",
        approved: "bg-cyan-100 text-cyan-800",
        completed: "bg-cyan-100 text-cyan-800",
        rejected: "bg-pink-100 text-pink-800",
    };

    return (
        <div className="min-h-screen bg-white">


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
            <style>
                {`@media print {
  .no-break { page-break-inside: avoid; break-inside: avoid; }
  .print-area { page-break-before: always; }
}`}
            </style>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-md border-b border-cyan-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <img
                        src={
                            structureData?.logo
                                ? structureData.logo.startsWith("/uploads")
                                    ? `${BASE_URL}${structureData.logo}`
                                    : structureData.logo
                                : "/logo1.png"
                        }
                        alt="Company Logo"
                        className="h-12 w-auto object-contain"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                        {!booking?.approvel && (
                            <button
                                onClick={handleApprove}
                                disabled={approveLoading}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg 
                                                                        hover:bg-green-700 transition-colors text-sm font-medium sm:w-auto 
                                                                        disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {approveLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Approving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Approve</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            disabled={pdfLoading}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto transition-colors ${pdfLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-cyan-600 hover:bg-cyan-700 text-white"
                                }`}
                        >
                            {pdfLoading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
                                    Print
                                </>
                            )}
                        </button>


                        {bookingData?.contact?.mobiles?.[0] && (
                            <a
                                href={`https://wa.me/${bookingData.contact.mobiles[0].replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium w-full sm:w-auto"
                            >
                                <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                                Chat
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div ref={componentRef} className="relative min-h-screen w-full bg-white no-break print-area">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-4 sm:py-12">
                    <section className="mb-8 sm:mb-16 rounded-3xl overflow-hidden shadow-2xl relative h-64 sm:h-96 md:h-[500px]">
                        <img
                            src={getRandomImage() || "/placeholder.svg"}
                            alt="Tour"
                            className="w-full h-full object-cover"

                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/0 flex flex-col justify-end p-4 sm:p-8 md:p-12">
                            <h1 className="text-2xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-200 mb-2 text-balance leading-tight">
                                {bookingData?.itineraryData?.titles?.[0] || "Your Journey"}
                            </h1>
                            <p className="text-cyan-500 text-lg sm:text-xl md:text-2xl font-semibold">
                                {calculateDuration(bookingData.itineraryData)} • {booking.nights}
                            </p>
                            {bookingData?.itineraryData?.tourcode && (
                                <p className="text-white text-sm mt-2">Tour Code: {bookingData.itineraryData.tourcode}</p>
                            )}
                        </div>
                    </section>

                    {/* Overall Descriptions */}
                    {Array.isArray(bookingData?.itineraryData?.descriptions) &&
                        bookingData.itineraryData.descriptions.length > 0 && (
                            <section className="mb-8 sm:mb-16 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Tour Overview</h3>
                                <div className="space-y-4">
                                    {bookingData.itineraryData.descriptions.map((desc, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            {/* <span className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                                                {i + 1}
                                            </span> */}
                                            <div className="flex-1">
                                                {renderDescription(desc)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 sm:mb-16">
                        <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-4 sm:p-6 rounded-2xl border-2 border-cyan-300 shadow-md">
                            <p className="text-cyan-900 text-xs font-bold uppercase mb-2">Highlight Price</p>
                            <p className="text-2xl sm:text-3xl font-serif font-bold text-cyan-900">₹{highlightPrice}/-</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-100 to-teal-50 p-4 sm:p-6 rounded-2xl border-2 border-teal-300 shadow-md">
                            <p className="text-teal-900 text-xs font-bold uppercase mb-2">Duration</p>
                            <p className="text-2xl sm:text-3xl font-serif font-bold text-teal-900">
                                {bookingData.selectedItinerary.duration}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 sm:p-6 rounded-2xl border-2 border-purple-300 shadow-md">
                            <p className="text-purple-900 text-xs font-bold uppercase mb-2">Locations</p>
                            <p className="text-2xl sm:text-3xl font-serif font-bold text-purple-900">{uniqueLocations.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-4 sm:p-6 rounded-2xl border-2 border-cyan-300 shadow-md">
                            <p className="text-cyan-900 text-xs font-bold uppercase mb-2">Rating</p>
                            <StarRating rating={softwareData?.rating || 4} reviews={softwareData?.reviews || 0} />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-16">
                        {/* Main Content - Left */}
                        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                            {/* Traveler Details */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-500 to-cyan-500 px-4 sm:px-6 py-4 rounded-t-2xl">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">Traveler Information</h3>
                                </div>
                                <div className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {bookingData.clientDetails?.name && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Name</p>
                                                <p className="text-gray-800 font-semibold">{bookingData.clientDetails.name}</p>
                                            </div>
                                        )}
                                        {bookingData.clientDetails?.email && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Email</p>
                                                <p className="text-gray-800 font-semibold break-all text-sm">
                                                    {bookingData.clientDetails.email}
                                                </p>
                                            </div>
                                        )}
                                        {bookingData.clientDetails?.phone && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Phone</p>
                                                <p className="text-gray-800 font-semibold">{bookingData.clientDetails.phone}</p>
                                            </div>
                                        )}
                                        {bookingData.clientDetails?.travelDate && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Travel Date</p>
                                                <p className="text-gray-800 font-semibold">
                                                    {(() => {
                                                        const rawDate = bookingData?.clientDetails?.travelDate;
                                                        if (!rawDate) return "N/A";

                                                        let date;

                                                        // Agar format "DD-MM-YYYY" hai (15-10-2025 jaise)
                                                        if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
                                                            const [day, month, year] = rawDate.split("-");
                                                            date = new Date(`${year}-${month}-${day}`); // Convert to valid format
                                                        } else {
                                                            date = new Date(rawDate); // fallback for ISO etc.
                                                        }

                                                        if (isNaN(date)) return "Invalid Date";

                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-indexed month fix
                                                        const year = date.getFullYear();

                                                        return `${day}-${month}-${year}`; // 👈 DD-MM-YYYY format me show hoga
                                                    })()}
                                                </p>
                                            </div>
                                        )}
                                        {bookingData.clientDetails?.adults !== undefined &&
                                            Number(bookingData.clientDetails.adults) > 0 && (
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Adults</p>
                                                    <p className="text-gray-800 font-semibold">{bookingData.clientDetails.adults}</p>
                                                </div>
                                            )}
                                        {bookingData.clientDetails?.kids5to12 !== undefined &&
                                            Number(bookingData.clientDetails.kids5to12) > 0 && (
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Kids (5-12)</p>
                                                    <p className="text-gray-800 font-semibold">{bookingData.clientDetails.kids5to12}</p>
                                                </div>
                                            )}
                                        {bookingData.clientDetails?.kidsBelow5 !== undefined &&
                                            Number(bookingData.clientDetails.kidsBelow5) > 0 && (
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Kids (Below 5)</p>
                                                    <p className="text-gray-800 font-semibold">{bookingData.clientDetails.kidsBelow5}</p>
                                                </div>
                                            )}
                                        {bookingData.clientDetails?.rooms !== undefined &&
                                            Number(bookingData.clientDetails.rooms) > 0 && (
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Rooms</p>
                                                    <p className="text-gray-800 font-semibold">{bookingData.clientDetails.rooms}</p>
                                                </div>
                                            )}
                                        {bookingData.clientDetails?.extraBeds !== undefined &&
                                            Number(bookingData.clientDetails.extraBeds) > 0 && (
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Extra mattress</p>
                                                    <p className="text-gray-800 font-semibold">{bookingData.clientDetails.extraBeds}</p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            {bookingData.itineraryData?.vehicle && (
                                console.log(bookingData),

                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-500 px-4 sm:px-6 py-4 rounded-t-2xl">
                                        <h3 className="text-lg sm:text-xl font-bold text-white">Vehicle Details</h3>
                                    </div>
                                    <div className="p-4 sm:p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                            {bookingData.itineraryData.vehicle.image && (
                                                <div className="p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-base">Vehicle Image</h4>
                                                    <img
                                                        src={`${BASE_URL}${bookingData.itineraryData.vehicle.image}`}
                                                        alt={`${bookingData.itineraryData.vehicle.make || ''} ${bookingData.itineraryData.vehicle.model || 'Vehicle'}`}
                                                        className="w-full h-48 object-contain bg-gray-50 rounded-lg"

                                                    />
                                                </div>
                                            )}
                                            <div className="p-4 rounded-lg border border-gray-200">
                                                <h4 className="font-bold text-gray-800 mb-4 text-base">Vehicle Information</h4>
                                                <div className="space-y-3">
                                                    {bookingData.itineraryData.vehicle.type && (
                                                        <div className="p-3 rounded border border-gray-200">
                                                            <span className="text-gray-600 text-sm">Vehicle Type</span>
                                                            <p className="font-semibold text-gray-800 text-base">
                                                                {bookingData.itineraryData.vehicle.type}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {(bookingData.itineraryData.vehicle.model) && (
                                                        <div className="p-3 rounded border border-gray-200">
                                                            <span className="text-gray-600 text-sm">Make / Model</span>
                                                            <p className="font-semibold text-gray-800 text-base">
                                                                {bookingData.itineraryData.vehicle.model}

                                                            </p>
                                                        </div>
                                                    )}

                                                    {bookingData.itineraryData.vehicle.capacity && (
                                                        <div className="p-3 rounded border border-gray-200">
                                                            <span className="text-gray-600 text-sm">passenger</span>
                                                            <p className="font-semibold text-gray-800 text-base">
                                                                {bookingData.itineraryData.vehicle.capacity}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="space-y-6">
                            {/* Pricing Card */}
                            <div className="bg-gradient-to-br from-cyan-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-cyan-300 p-4 sm:p-6 sticky top-24">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing Breakdown</h3>
                                <div className="space-y-3 text-sm">
                                    {offerAmount > 0 && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Base Price:</span>
                                                <span className="line-through text-gray-500">₹{actualAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600 font-semibold">
                                                <span>Discount:</span>
                                                <span>- ₹{offerAmount}</span>
                                            </div>
                                        </>
                                    )}
                                    {hasFestival && (
                                        <div className="flex justify-between text-purple-600 font-semibold">
                                            <span>{festivalOffer.name}:{festivalOffer.value} %</span>
                                            <span>- ₹{festivalDiscount}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t-2 border-cyan-300 flex justify-between items-end">
                                        <span className="font-bold text-gray-900">Total:</span>
                                        <span className="text-xl sm:text-2xl font-serif font-bold text-cyan-900">₹{totalPrice}</span>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/userpayment/${bookingData._id}`)} className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-cyan-700 hover:to-cyan-700 transition-all shadow-md">
                                    Book Now
                                </button>
                            </div>

                            {/* Contact Card */}
                            {bookingData.contact ? (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Your Agent</h3>
                                    <p className="text-xl sm:text-2xl font-serif font-bold text-cyan-900 mb-4">{bookingData.contact.name}</p>
                                    <div className="space-y-3 text-sm">
                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <Phone className="w-4 h-4 mr-1" />
                                                Call Us
                                            </span>
                                            {(bookingData.contact.mobiles || []).map((mobile, index) => {
                                                const cleanMobile = mobile.replace(/^tel:\+?91/, "");
                                                return (
                                                    <a key={`mobile-${index}`} href={`tel:+91${cleanMobile}`} className="text-gray-700 block hover:text-teal-600 transition-colors">
                                                        +91 {cleanMobile}
                                                    </a>
                                                );
                                            })}
                                        </p>

                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <Mail className="w-4 h-4 mr-1" />
                                                Email
                                            </span>
                                            {(bookingData.contact.emails || []).map((email, index) => {
                                                const cleanEmail = email.replace(/^mailto:/, "");
                                                return (
                                                    <a
                                                        key={`email-${index}`}
                                                        href={`mailto:${cleanEmail}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-700 block hover:text-teal-600 transition-colors break-all"
                                                    >
                                                        {cleanEmail}
                                                    </a>
                                                );
                                            })}
                                        </p>

                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                Address
                                            </span>
                                            <span className="text-gray-700 block">
                                                {bookingData.contact.addresses?.[0]
                                                    ? `${bookingData.contact.addresses[0].street}, ${bookingData.contact.addresses[0].area}, ${bookingData.contact.addresses[0].city}, ${bookingData.contact.addresses[0].state} ${bookingData.contact.addresses[0].pincode}`
                                                    : "Head Office, Jaipur, Rajasthan"}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-6 border-t pt-4">
                                        <span className="text-gray-800 mr-2 text-sm font-semibold">Connect:</span>
                                        {bookingData.contact.socialLinks &&
                                            Object.entries(bookingData.contact.socialLinks).map(([platform, link]) => {
                                                if (!link) return null;
                                                return (
                                                    <a
                                                        key={platform}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-3 text-xl text-gray-500 hover:text-teal-600 transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={iconsMap[platform]} />
                                                    </a>
                                                );
                                            })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Your Agent</h3>
                                    <p className="text-xl sm:text-2xl font-serif font-bold text-cyan-900 mb-4">{user?.name}</p>
                                    <div className="space-y-3 text-sm">
                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <Phone className="w-4 h-4 mr-1" />
                                                Call Us
                                            </span>
                                            {(user?.mobiles || []).map((mobile, index) => {
                                                const cleanMobile = mobile.replace(/^tel:\+?91/, "");
                                                return (
                                                    <a key={`mobile-${index}`} href={`tel:+91${cleanMobile}`} className="text-gray-700 block hover:text-teal-600 transition-colors">
                                                        +91 {cleanMobile}
                                                    </a>
                                                );
                                            })}
                                        </p>

                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <Mail className="w-4 h-4 mr-1" />
                                                Email
                                            </span>
                                            {(user?.emails || []).map((email, index) => {
                                                const cleanEmail = email.replace(/^mailto:/, "");
                                                return (
                                                    <a
                                                        key={`email-${index}`}
                                                        href={`mailto:${cleanEmail}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-700 block hover:text-teal-600 transition-colors break-all"
                                                    >
                                                        {cleanEmail}
                                                    </a>
                                                );
                                            })}
                                        </p>

                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                Address
                                            </span>
                                            <span className="text-gray-700 block">
                                                {user?.addresses?.[0]
                                                    ? `${user.addresses[0].street}, ${user.addresses[0].area}, ${user.addresses[0].city}, ${user.addresses[0].state} ${user.addresses[0].pincode}`
                                                    : "Head Office, Jaipur, Rajasthan"}
                                            </span>
                                        </p>
                                        <p className="text-gray-800">
                                            <span className="font-semibold text-teal-600 inline-flex items-center">
                                                <AlertTriangle className="w-4 h-4 mr-1" />
                                                SOS Number
                                            </span>
                                            <span className="text-gray-700 block">
                                                {structureData?.sosNumber ? (
                                                    <a
                                                        href={`tel:${structureData.sosNumber}`}
                                                        className="text-gray-600 hover:text-gray-800 underline"
                                                    >
                                                        {structureData.sosNumber}
                                                    </a>
                                                ) : (
                                                    "Not Available"
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-6 border-t pt-4">
                                        <span className="text-gray-800 mr-2 text-sm font-semibold">Connect:</span>
                                        {user?.socialLinks &&
                                            Object.entries(user.socialLinks).map(([platform, link]) => {
                                                if (!link) return null;
                                                return (
                                                    <a
                                                        key={platform}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-3 text-xl text-gray-500 hover:text-teal-600 transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={iconsMap[platform]} />
                                                    </a>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleSendWhatsApp}
                                    className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3 rounded-xl hover:bg-teal-600 transition-colors font-semibold shadow-md"
                                >
                                    <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={emailLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white py-3 rounded-xl hover:bg-cyan-600 transition-colors font-semibold shadow-md disabled:bg-gray-400"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
                                    {emailLoading ? "Sending..." : "Email"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 mb-4 sm:gap-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 sm:px-6 py-4 rounded-t-2xl">
                                <h3 className="text-lg sm:text-xl font-bold text-white">Day-by-Day Itinerary</h3>
                            </div>
                            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                                {(booking.itinerary || []).map((item, index) => (
                                    <div key={`it-day-${index}`} className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
                                        {/* Left - Text Content */}
                                        <div className="flex-1">
                                            <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg inline-block mb-3">
                                                <p className="font-bold text-sm">{item.day}</p>
                                            </div>
                                            <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-2">{item.title}</h4>
                                            {item.locations.length > 0 && (
                                                <p className="text-sm text-gray-600 mb-3">
                                                    <span className="font-semibold text-teal-600">Locations:</span> {item.locations.join(", ")}
                                                </p>
                                            )}
                                            <div className="ql-editor text-gray-700 text-sm sm:text-base leading-relaxed">
                                                {renderDescription(item.desc)}
                                            </div>
                                        </div>

                                        {/* Right - Image Swiper */}
                                        <div className="w-full md:w-64 flex-shrink-0">
                                            <Swiper
                                                modules={[Pagination, Autoplay]}
                                                spaceBetween={0}
                                                slidesPerView={1}
                                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                                pagination={{ clickable: true }}
                                                className="w-full h-48 md:h-64 rounded-2xl shadow-lg"
                                            >
                                                {item.img &&
                                                    [...item.img] // copy to avoid mutating original
                                                        .sort(() => Math.random() - 0.5) // 🔀 shuffle randomly
                                                        .slice(0, 3) // 🎯 only 3 random images
                                                        .map((img, idx) => (
                                                            <SwiperSlide key={idx}>
                                                                <img
                                                                    src={img || fallbackImage}
                                                                    alt={`${item.title} - ${idx + 1}`}
                                                                    className="w-full h-full object-cover"

                                                                />
                                                            </SwiperSlide>
                                                        ))}


                                            </Swiper>
                                            {item.date && <p className="text-center text-gray-500 text-sm mt-2">{item.date}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hotels & Dining Section */}
                        {bookingData.itineraryData?.hotels && Object.keys(bookingData.itineraryData.hotels).length > 0 && (
                            <div className="rounded-3xl shadow-lg border border-cyan-200 overflow-hidden">

                                {/* Header */}
                                <div className="bg-gradient-to-r from-cyan-500 to-cyan-500 px-4 sm:px-8 py-4 sm:py-5 rounded-t-3xl">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                                        Hotels & Dining
                                    </h3>
                                    <p className="text-white/80 text-sm mt-1">
                                        Handpicked stays & meals during your journey
                                    </p>
                                </div>

                                {/* City Summary */}
                                <div className="px-4 sm:px-8 py-4 border-b border-cyan-200">
                                    <p className="text-cyan-700 text-sm font-medium">
                                        {(() => {
                                            const allCities = Object.entries(bookingData.itineraryData.hotels)
                                                .flatMap(([day, cities]) => Object.keys(cities));
                                            const cityCounts = {};
                                            allCities.forEach(city => (cityCounts[city] = (cityCounts[city] || 0) + 1));
                                            const uniqueCities = [...new Set(allCities)];
                                            return uniqueCities
                                                .map(city => (cityCounts[city] > 1 ? `${city} (${cityCounts[city]})` : city))
                                                .join(" • ");
                                        })()}
                                    </p>
                                </div>

                                {/* Hotel Cards */}
                                <div className="p-4 sm:p-8 space-y-8 sm:space-y-12">
                                    {Object.entries(bookingData.itineraryData.hotels).map(([day, cities]) => {
                                        const allGroups = [];
                                        Object.entries(cities).forEach(([city, meals]) => {
                                            const mealEntries = [];
                                            if (meals.breakfast?.id) mealEntries.push({ type: "Breakfast", data: meals.breakfast });
                                            if (meals.lunch?.id) mealEntries.push({ type: "Lunch", data: meals.lunch });
                                            if (meals.dinner?.id) mealEntries.push({ type: "Dinner", data: meals.dinner });

                                            const grouped = new Map();
                                            mealEntries.forEach(entry => {
                                                const id = entry.data.id;
                                                if (!grouped.has(id)) {
                                                    grouped.set(id, { hotel: entry.data, meals: [], city });
                                                }
                                                grouped.get(id).meals.push(entry.type);
                                            });

                                            Array.from(grouped.values()).forEach(group => {
                                                allGroups.push(group);
                                            });
                                        });

                                        return (
                                            <div key={day}>
                                                {/* Day Header */}
                                                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                                                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                                                        {day}
                                                    </div>
                                                    <p className="text-lg font-semibold text-gray-800">Day {day}</p>
                                                </div>

                                                {/* Hotel Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                                                    {allGroups.map((group, gIndex) => (
                                                        <div
                                                            key={gIndex}
                                                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                                                        >
                                                            {/* Image */}
                                                            <a
                                                                href={group.hotel.googleReviewLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <img
                                                                    src={
                                                                        group.hotel.image
                                                                            ? `https://apitour.rajasthantouring.in${group.hotel.image}`
                                                                            : "https://via.placeholder.com/400x250"
                                                                    }
                                                                    alt={group.hotel.name}
                                                                    className="w-full h-48 sm:h-56 object-cover"
                                                                />
                                                            </a>

                                                            {/* Details */}
                                                            <div className="p-4 sm:p-5">
                                                                <p className="text-base sm:text-lg font-bold text-gray-800">{group.hotel.name}</p>

                                                                {/* Location */}
                                                                <p className="text-xs text-gray-600 mt-1">{group.hotel.location || "N/A"}</p>

                                                                {/* Star Rating Component */}
                                                                <div className="mt-1">
                                                                    <StarRating rating={group.hotel.rating || 4} reviews={group.hotel.reviews || 123} />
                                                                </div>

                                                                <p className="text-xs text-gray-600 mt-2">
                                                                    Check-in:{" "}
                                                                    {group.hotel.checkIn
                                                                        ? new Date(group.hotel.checkIn).toLocaleDateString()
                                                                        : "N/A"}{" "}
                                                                    | Check-out:{" "}
                                                                    {group.hotel.checkOut
                                                                        ? new Date(group.hotel.checkOut).toLocaleDateString()
                                                                        : "N/A"}
                                                                </p>

                                                                {/* Meals */}
                                                                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                                                                    {group.meals.includes("Breakfast") && (
                                                                        <span className="flex items-center gap-1 text-cyan-600 text-xs sm:text-sm font-medium bg-cyan-50 px-2 sm:px-3 py-1 rounded-full">
                                                                            <Coffee className="w-3 sm:w-4 h-3 sm:h-4" /> Breakfast
                                                                        </span>
                                                                    )}
                                                                    {group.meals.includes("Lunch") && (
                                                                        <span className="flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium bg-red-50 px-2 sm:px-3 py-1 rounded-full">
                                                                            <UtensilsCrossed className="w-3 sm:w-4 h-3 sm:h-4" /> Lunch
                                                                        </span>
                                                                    )}
                                                                    {group.meals.includes("Dinner") && (
                                                                        <span className="flex items-center gap-1 text-purple-600 text-xs sm:text-sm font-medium bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                                                                            <Utensils className="w-3 sm:w-4 h-3 sm:h-4" /> Dinner
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Policies Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 sm:px-6 py-4 rounded-t-2xl">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Package Policies</h3>
                            </div>
                            <div className="p-4 sm:p-6">
                                <div className="flex gap-2 sm:gap-8 border-b border-gray-200 font-semibold overflow-x-auto whitespace-nowrap pb-2 sm:pb-3">
                                    {["Inclusions", "Exclusions", "Terms & Conditions", "Cancellation & Refund Policy", "Payment Policy"].map((tab) => {
                                        const key = tab.toLowerCase().replace(/ & /g, " & ");
                                        return (
                                            <button
                                                key={tab}
                                                className={`pb-2 sm:pb-3 transition-all text-sm ${activeTab === key
                                                    ? "text-cyan-600 border-b-2 border-cyan-600"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                                onClick={() => setActiveTab(key)}
                                            >
                                                {tab}
                                            </button>
                                        );
                                    })}
                                    {hasFestival && (
                                        <button
                                            className={`pb-2 sm:pb-3 transition-all text-sm ${activeTab === "festival offer"
                                                ? "text-cyan-600 border-b-2 border-cyan-600"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                            onClick={() => setActiveTab("festival offer")}
                                        >
                                            Festival Offer
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 sm:mt-6 text-gray-700 space-y-4">
                                    {activeTab === "inclusions" && (
                                        <div className="space-y-4">
                                            {(inclusions || []).map((item, i) => {
                                                const hasImage = (item.images && item.images.length > 0) || item.image;
                                                return (
                                                    <div key={`inc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                        <button
                                                            onClick={() => toggleAccordion(`inc-${i}`)}
                                                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Info className="w-5 h-5 text-cyan-500" />
                                                                <span className="text-gray-800">{item.title || `Inclusion ${i + 1}`}</span>
                                                            </div>
                                                            <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems[`inc-${i}`] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedItems[`inc-${i}`] && (
                                                            <div className="p-4 sm:p-5">
                                                                {hasImage && (
                                                                    <div className="float-left mr-4 mb-2">
                                                                        {item.images && item.images.length > 0 && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.images[0]}`}
                                                                                alt={item.title || `Inclusion ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                        {item.image && !item.images?.length && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.image}`}
                                                                                alt={item.title || `Inclusion ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                                    {item.description || item}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!inclusions || inclusions.length === 0) && (
                                                <div className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion('inc-default')}
                                                        className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-cyan-500" />
                                                            <span className="text-gray-800">Standard Inclusions</span>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems['inc-default'] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {expandedItems['inc-default'] && (
                                                        <div className="p-4 sm:p-5">
                                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                                <li>Accommodation in standard rooms.</li>
                                                                <li>Daily breakfast included.</li>
                                                                <li>Sightseeing as per itinerary.</li>
                                                                <li>Transportation in AC vehicle.</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "exclusions" && (
                                        <div className="space-y-4">
                                            {(exclusions || []).map((item, i) => {
                                                const hasImage = (item.images && item.images.length > 0) || item.image;
                                                return (
                                                    <div key={`exc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                        <button
                                                            onClick={() => toggleAccordion(`exc-${i}`)}
                                                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Info className="w-5 h-5 text-cyan-500" />
                                                                <span className="text-gray-800">{item.title || `Exclusion ${i + 1}`}</span>
                                                            </div>
                                                            <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems[`exc-${i}`] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedItems[`exc-${i}`] && (
                                                            <div className="p-4 sm:p-5">
                                                                {hasImage && (
                                                                    <div className="float-left mr-4 mb-2">
                                                                        {item.images && item.images.length > 0 && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.images[0]}`}
                                                                                alt={item.title || `Exclusion ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                        {item.image && !item.images?.length && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.image}`}
                                                                                alt={item.title || `Exclusion ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                                    {item.description || item}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!exclusions || exclusions.length === 0) && (
                                                <div className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion('exc-default')}
                                                        className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-cyan-500" />
                                                            <span className="text-gray-800">Standard Exclusions</span>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems['exc-default'] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {expandedItems['exc-default'] && (
                                                        <div className="p-4 sm:p-5">
                                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                                <li>Personal expenses (laundry, phone calls, tips, etc.).</li>
                                                                <li>Meals not mentioned in the itinerary.</li>
                                                                <li>Entry fees to monuments, museums, or parks.</li>
                                                                <li>Travel insurance.</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "terms & conditions" && (
                                        <div className="space-y-4">
                                            {(terms || []).map((item, i) => {
                                                const hasImage = (item.images && item.images.length > 0) || item.image;
                                                return (
                                                    <div key={`term-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                        <button
                                                            onClick={() => toggleAccordion(`term-${i}`)}
                                                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Info className="w-5 h-5 text-cyan-500" />
                                                                <span className="text-gray-800">{item.title || `Term ${i + 1}`}</span>
                                                            </div>
                                                            <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems[`term-${i}`] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedItems[`term-${i}`] && (
                                                            <div className="p-4 sm:p-5">
                                                                {hasImage && (
                                                                    <div className="float-left mr-4 mb-2">
                                                                        {item.images && item.images.length > 0 && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.images[0]}`}
                                                                                alt={item.title || `Term ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                        {item.image && !item.images?.length && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.image}`}
                                                                                alt={item.title || `Term ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                                    {item.description || item}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!terms || terms.length === 0) && (
                                                <div className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion('term-default')}
                                                        className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-cyan-500" />
                                                            <span className="text-gray-800">Standard Terms & Conditions</span>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems['term-default'] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {expandedItems['term-default'] && (
                                                        <div className="p-4 sm:p-5">
                                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                                <li>Package rates are subject to change without prior notice.</li>
                                                                <li>Booking is confirmed only after advance payment.</li>
                                                                <li>Cancellation charges apply as per company policy.</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "cancellation & refund policy" && (
                                        <div className="space-y-4">
                                            {(cancellationPolicy || []).map((item, i) => {
                                                const hasImage = (item.images && item.images.length > 0) || item.image;
                                                return (
                                                    <div key={`cancel-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                        <button
                                                            onClick={() => toggleAccordion(`cancel-${i}`)}
                                                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Info className="w-5 h-5 text-cyan-500" />
                                                                <span className="text-gray-800">{item.title || `Cancellation Policy ${i + 1}`}</span>
                                                            </div>
                                                            <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems[`cancel-${i}`] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedItems[`cancel-${i}`] && (
                                                            <div className="p-4 sm:p-5">
                                                                {hasImage && (
                                                                    <div className="float-left mr-4 mb-2">
                                                                        {item.images && item.images.length > 0 && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.images[0]}`}
                                                                                alt={item.title || `Cancellation Policy ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                        {item.image && !item.images?.length && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.image}`}
                                                                                alt={item.title || `Cancellation Policy ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                                    {item.description || item}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!cancellationPolicy || cancellationPolicy.length === 0) && (
                                                <div className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion('cancel-default')}
                                                        className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-cyan-500" />
                                                            <span className="text-gray-800">Standard Cancellation & Refund Policy</span>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems['cancel-default'] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {expandedItems['cancel-default'] && (
                                                        <div className="p-4 sm:p-5">
                                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                                <li>Cancellations made 30 days prior to departure will incur a 10% cancellation fee.</li>
                                                                <li>Cancellations made 15-29 days prior to departure will incur a 50% cancellation fee.</li>
                                                                <li>No refunds for cancellations made less than 15 days prior to departure.</li>
                                                                <li>Refunds will be processed within 7-10 business days.</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "Payment Policy" && (
                                        <div className="space-y-4">
                                            {(travelRequirements || []).map((item, i) => {
                                                const hasImage = (item.images && item.images.length > 0) || item.image;
                                                return (
                                                    <div key={`travel-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                        <button
                                                            onClick={() => toggleAccordion(`travel-${i}`)}
                                                            className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Info className="w-5 h-5 text-cyan-500" />
                                                                <span className="text-gray-800">{item.title || `Travel Requirement ${i + 1}`}</span>
                                                            </div>
                                                            <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems[`travel-${i}`] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedItems[`travel-${i}`] && (
                                                            <div className="p-4 sm:p-5">
                                                                {hasImage && (
                                                                    <div className="float-left mr-4 mb-2">
                                                                        {item.images && item.images.length > 0 && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.images[0]}`}
                                                                                alt={item.title || `Travel Requirement ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                        {item.image && !item.images?.length && (
                                                                            <img
                                                                                src={`${BASE_URL}/${item.image}`}
                                                                                alt={item.title || `Travel Requirement ${i + 1}`}
                                                                                className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                                    {item.description || item}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!travelRequirements || travelRequirements.length === 0) && (
                                                <div className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion('travel-default')}
                                                        className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-cyan-50 hover:to-white transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-cyan-500" />
                                                            <span className="text-gray-800">Standard Payment Policy</span>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-cyan-500 transform transition-transform ${expandedItems['travel-default'] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {expandedItems['travel-default'] && (
                                                        <div className="p-4 sm:p-5">
                                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                                <li>Valid passport with at least 6 months validity required.</li>
                                                                <li>Visa may be required depending on the destination.</li>
                                                                <li>Travelers must comply with health and vaccination requirements.</li>
                                                                <li>Carry necessary identification documents during travel.</li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "festival offer" && hasFestival && (
                                        <div className="text-sm p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                                            <h4 className="font-bold text-cyan-800 mb-2">Festival Offer Details</h4>
                                            <p className="text-cyan-700 mb-1"><strong>Offer Name:</strong> {festivalOffer.name}</p>
                                            <p className="text-cyan-700 mb-1"><strong>Discount:</strong> {festivalOffer.value}% OFF</p>
                                            <p className="text-cyan-700 mb-1"><strong>Savings:</strong> ₹{festivalDiscount}</p>
                                            <p className="text-cyan-600 text-xs mt-2">This special festival discount has been applied to your package!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>





                        {/* Achievements */}
                        {tour?.achievements && tour.achievements.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 sm:px-6 py-4 rounded-t-2xl">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">Achievements</h3>
                                </div>
                                <div className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tour.achievements.map((ach, index) => (
                                            <img
                                                key={index}
                                                src={`${BASE_URL}${ach.imageUrl}`}
                                                alt="achievement"
                                                className="w-full h-48 md:h-56 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tour Description */}
                        {tour?.name && tour.description && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 sm:px-6 py-4 rounded-t-2xl">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">{tour.name}</h3>
                                </div>
                                <div className="p-4 sm:p-6">
                                    <div className="md:flex md:justify-between gap-8">
                                        <div className="md:w-1/2 space-y-4 text-sm text-gray-700 text-justify">
                                            {tour.description
                                                ?.slice(0, Math.ceil(tour.description.length / 2))
                                                .map((desc, index) => (
                                                    <p key={index}>{desc}</p>
                                                ))}
                                        </div>
                                        <div className="md:w-1/2 space-y-4 text-sm text-gray-700 text-justify mt-4 md:mt-0">
                                            {tour.description
                                                ?.slice(Math.ceil(tour.description.length / 2))
                                                .map((desc, index) => (
                                                    <p key={index}>{desc}</p>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full flex bg-cover bg-center rounded-xl bg-[#009BC0]  justify-center my-6">
                        <div
                            className="w-[100%] relative overflow-hidden flex flex-col items-center py-10 px-4"
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

                            {/* Updated Button (Cyan Style) */}
                            <button
                                onClick={() => window.open("/pdf_compressed.pdf", "_blank")}
                                className="
                group flex items-center z-[1] justify-center gap-2
                px-6 py-3 text-center cursor-pointer my-4
                bg-cyan-400 hover:bg-cyan-500
                text-white font-semibold border
                rounded-full shadow-md
                transition-all duration-300 ease-in-out
                text-sm sm:text-base md:text-2xl
                hover:scale-105 hover:shadow-lg
            "
                            >


                                <span>Click to View About Our Travel Agency</span>

                            </button>

                        </div>
                    </div>




                    <section className="bg-gradient-to-r from-cyan-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-cyan-300 p-4 sm:p-8 mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-4 sm:mb-6">Have Questions?</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={form.name}
                                    readOnly
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 text-sm"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    value={form.email}
                                    readOnly
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 text-sm"
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Your Phone"
                                    value={form.mobile}
                                    readOnly
                                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 text-sm"
                                    required
                                />
                                <textarea
                                    placeholder="Your Message"
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 resize-none text-sm"
                                    rows={3}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={loadings}
                                    className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white py-2 rounded-lg font-bold hover:from-cyan-700 hover:to-cyan-700 transition-all disabled:bg-gray-400 text-sm"
                                >
                                    {loadings ? "Sending..." : "Send Inquiry"}
                                </button>
                            </form>
                            {booking?.contact && (
                                <div className="bg-gradient-to-b from-cyan-50 to-white border border-gray-200 rounded-2xl shadow-md p-6 sm:p-8">
                                    <h3 className="text-gray-600 text-sm uppercase tracking-wide mb-2 font-medium">
                                        Contact
                                    </h3>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{booking?.contact.name}</h2>
                                    <div className="space-y-4 text-sm text-gray-700">
                                        <div>
                                            <span className="font-semibold block mb-1 text-gray-800">Call</span>
                                            {(booking?.contact.mobiles || []).map((mobile, index) => {
                                                const cleanMobile = mobile.replace(/^tel:\+?91/, "");
                                                return (
                                                    <a
                                                        key={`mobile-${index}`}
                                                        href={`tel:+91${cleanMobile}`}
                                                        className="block hover:text-cyan-600"
                                                    >
                                                        +91 {cleanMobile}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-1 text-gray-800">Email</span>
                                            {(booking?.contact.emails || []).map((email, index) => {
                                                const cleanEmail = email.replace(/^mailto:/, "");
                                                return (
                                                    <a
                                                        key={`email-${index}`}
                                                        href={`mailto:${cleanEmail}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block hover:text-cyan-600 break-all"
                                                    >
                                                        {cleanEmail}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-1 text-gray-800">Address</span>
                                            <p className="text-gray-700 leading-relaxed">
                                                {booking?.contact.addresses?.[0]
                                                    ? `${booking?.contact.addresses[0].street}, ${booking?.contact.addresses[0].area}, ${booking?.contact.addresses[0].city}, ${booking?.contact.addresses[0].state} - ${booking?.contact.addresses[0].pincode}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-1 text-gray-800">SOS Number</span>
                                            <p className="text-gray-700 leading-relaxed">
                                                <span className="text-gray-700 block">
                                                    {structureData?.sosNumber ? (
                                                        <a
                                                            href={`tel:${structureData.sosNumber}`}
                                                            className="text-gray-600 hover:text-gray-800 underline"
                                                        >
                                                            {structureData.sosNumber}
                                                        </a>
                                                    ) : (
                                                        "Not Available"
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    {booking?.contact.socialLinks && (
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <span className="text-gray-800 text-sm font-medium mr-2">
                                                Follow us:
                                            </span>
                                            {Object.entries(booking?.contact.socialLinks).map(([platform, link]) => {
                                                if (!link) return null;
                                                return (
                                                    <a
                                                        key={platform}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mx-2 text-gray-600 hover:text-cyan-700 text-lg"
                                                    >
                                                        <FontAwesomeIcon icon={iconsMap[platform]} />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="text-center text-gray-500 text-xs py-6 border-t border-gray-200">
                        © {softwareData?.year || new Date().getFullYear()} {softwareData?.companyName || "Travel Company"}. All
                        rights reserved.
                    </footer>
                </div>
            </div>
            <style media="print">{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                        color: black !important;
                    }
                  
                    .print\:hidden {
                        display: none !important;
                    }
                   
                        
                    @page {
                        margin: 0in !important;
                        size: A3 !important;
                    }

                }
            `}</style>
        </div>
    )
}

export default Viewdata5Redesigned 