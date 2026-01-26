"use client"
import axios from "axios"
import React, { useRef } from "react"
import { CarFront, CheckCircle2, CreditCard, FileText, MapPin, Plane, Pointer, RotateCcw, Wallet, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
// ✅ Brand icons
import {
    faFacebookF,
    faTwitter,
    faInstagram,
    faLinkedinIn,
    faYoutube,
    faWhatsapp,
} from "@fortawesome/free-brands-svg-icons"
// ✅ Solid icons
import { faCheckCircle, faEnvelope, faGlobe, faHotel, faLocationDot, faMapMarkerAlt, faPhoneAlt, faPrint, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import { Helmet } from "react-helmet-async"
import Cookies from "js-cookie"
import html2pdf from "html2pdf.js"
import { FaComment, FaHandPointer, FaHeart, FaLocationArrow, FaShare, FaShareAlt } from "react-icons/fa"


import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { toast } from "react-toastify"

// Define the base URL for your backend server
const BASE_URL = "https://apitour.rajasthantouring.in" // Replace with your production server URL
export default function pendingItierary({ id: propId, autoDownload, onDownloadComplete }) {
    const id = useParams().id || propId
    const navigate = useNavigate()
    const [booking, setBooking] = useState(null)
    const [policies, setPolicies] = useState({
        inclusions: [],
        exclusions: [],
        termsAndConditions: [],
        cancellationAndRefundPolicy: [],
        travelRequirements: [],
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState("")
    const [softwareData, setSoftwareData] = useState(null)
    const [itineraryUrl, setItineraryUrl] = useState('');
    const [structureData, setStructureData] = useState(null)
    const [approveLoading, setApproveLoading] = useState(false);
    const [tour, setTour] = useState(null)
    const queryParams = new URLSearchParams(location.search);
    const emailId = queryParams.get("emailId");
    const [openPolicyIndex, setOpenPolicyIndex] = useState({}); // { inclusion: 0, exclusion: 2, ... }



    const [heroImageLoaded, setHeroImageLoaded] = useState(false)
    const [showContent, setShowContent] = useState(false) // Data ko hide rakhne ke liye



    const getNumericValue = (field, category) => {
        const val = field?.[category]
        if (typeof val === "number") return val
        return val?.value || 0
    }
    const safeDateString = (dateStr) => {
        try {
            const date = new Date(dateStr)
            return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString()
        } catch {
            return "Invalid Date"
        }
    }
    const togglePolicy = (section, index) => {
        setOpenPolicyIndex(prev => ({
            ...prev,
            [section]: prev[section] === index ? null : index
        }));
    };
    const getHotelId = (hotel) => {
        if (typeof hotel === "string") return hotel
        if (hotel && typeof hotel === "object") {
            return hotel.id || hotel._id || null
        }
        return null
    }
    const getVehicleId = (vehicle) => {
        if (typeof vehicle === "string") return vehicle
        if (vehicle && typeof vehicle === "object") {
            return vehicle.id || vehicle._id || null
        }
        return null
    }
    const componentRef = useRef(null)
    // Fetch software data for footer
    useEffect(() => {
        const fetchSoftwareData = async () => {
            try {
                const response = await fetch("https://apitour.rajasthantouring.in/api/toursoftware")
                const data = await response.json()
                if (data && data.length > 0) {
                    setSoftwareData(data[0])
                }
            } catch (error) {
                console.error("Error fetching software data:", error)
            }
        }
        fetchSoftwareData()
    }, [])
    // Fetch structure data for logo
    useEffect(() => {
        const fetchStructureData = async () => {
            try {
                const response = await fetch("https://apitour.rajasthantouring.in/api/structure")
                const data = await response.json()
                setStructureData(data)
            } catch (error) {
                console.error("Error fetching structure data:", error)
            }
        }
        fetchStructureData()
    }, [])
    useEffect(() => {
        const fetchTour = async () => {
            try {
                const res = await fetch("https://apitour.rajasthantouring.in/api/achivement")
                const data = await res.json()
                setTour(data)
            } catch (error) {
                console.error("Error fetching tour:", error)
            }
        }
        fetchTour()
    }, [])




    useEffect(() => {
        if (emailId) {
            axios
                .post(`${BASE_URL}/api/emails/mark-seen/${emailId}/${id}`)
                .then((res) => console.log("Marked as seen:", res.data))
                .catch((err) => console.error("Error marking seen:", err));
        }
    }, [emailId, id]);

    console.log(booking)

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
        const totalDays = itinerary.days?.length || 0
        const nights = Math.max(0, totalDays - 1)
        return `${totalDays} Days ${nights} Nights`
    }
    const getCategoryTotals = () => {
        const totals = {}
        const festivalValue = booking?.itineraryData.festivalOffer?.value || 0
        const categories = Object.keys(booking?.itineraryData.pricing || {})
        categories.forEach((category) => {
            const price = getNumericValue(booking?.itineraryData.pricing, category)
            const offer = getNumericValue(booking?.itineraryData.offers, category)
            // Pehle offer apply karo
            const afterOffer = price - offer
            // Ab us amount par festival discount lagao
            const festivalDiscount = afterOffer * (festivalValue / 100)
            // Final total
            totals[category] = afterOffer - festivalDiscount
        })
        return totals
    }
    console.log(booking)
    const categories = Object.keys(booking?.hotelSelections || {})
    const festivalValue = booking?.itineraryData.festivalOffer?.value || 0
    const festivalName = booking?.itineraryData.festivalOffer?.name || booking?.itineraryData.festivalOffer?.title || ""
    let vehicles = booking?.itineraryData.vehicle
    if (!Array.isArray(vehicles)) vehicles = [vehicles].filter(Boolean)
    const vehicleOptions = vehicles || []
    const iconsMap = {
        facebook: faFacebookF,
        twitter: faTwitter,
        instagram: faInstagram,
        linkedin: faLinkedinIn,
        youtube: faYoutube,
        website: faGlobe,
    }
    const [pdfLoading, setPdfLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const isPuppeteer = searchParams.get("print") === "1";
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [pdfStatus, setPdfStatus] = useState("");




    const handlePrint = async () => {
        if (pdfLoading) return;
        setPdfLoading(true);
        setDownloadProgress(0);
        setPdfStatus("Starting download...");

        try {
            // Use the constructed itinerary URL instead of current window.location
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
                if (onDownloadComplete) onDownloadComplete(); // Call callback if provided
            }, 2000);

        } catch (err) {
            console.error("PDF Download Error:", err);
            setPdfStatus(`❌ Error: ${err.message}`);
            setTimeout(() => {
                setPdfStatus("");
                setDownloadProgress(0);
                if (onDownloadComplete) onDownloadComplete();
            }, 3000);
        } finally {
            setPdfLoading(false);
        }
    };
    useEffect(() => {
        if (autoDownload && id && booking && itineraryUrl) {
            setTimeout(() => {
                handlePrint()
            }, 300) // delay ensures DOM renders
        }
    }, [autoDownload, id, booking, itineraryUrl])




    const firstSuccessPayment =
        booking?.payment?.find((p) => p.status === "success") || null;


    const clientName = booking?.clientDetails?.name || "Traveler"
    const itineraryTitle = booking?.itineraryData?.titles?.[0] || "Booking Preview"
    const title = `${clientName} - ${itineraryTitle} | Booking Preview`
    const description = `Booking details for ${clientName} - ${itineraryTitle}`
    const ogDescription = `Check the booking details for ${clientName} with itinerary: ${itineraryTitle}`
    const ogImage = structureData?.logo
        ? structureData?.logo.startsWith("/uploads")
            ? `${BASE_URL}${structureData.logo}`
            : structureData.logo
        : "/logo1.png"
    const getImage = (item) => {
        console.log(item);
        if (item.images?.length) return `${BASE_URL}/${item.images[0]}`;
        if (item.image) return `${BASE_URL}/${item.image}`;
        return "/placeholder-policy.png"; // public/ folder ke andar fallback image
    };

    useEffect(() => {
        console.log("🖼️ [START] Image preload immediately");

        const img = new Image();
        img.src = "/selava.pdf/1.svg"; // Force correct URL
        img.crossOrigin = "anonymous";

        img.onload = () => {
            console.log("✅ [HERO] Image loaded 100%");
            setHeroImageLoaded(true);

            // Image load hone ke 300ms baad hi content dikhayenge
            // Taki image pehle render ho jaye
            setTimeout(() => {
                setShowContent(true);
            }, 300);
        };

        img.onerror = () => {
            console.log("⚠️ [HERO] Image failed, showing content anyway");
            setHeroImageLoaded(true);
            setShowContent(true);
        };

        // Fallback safety timer
        const timeout = setTimeout(() => {
            setHeroImageLoaded(true);
            setShowContent(true);
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);



    useEffect(() => {
        const fetchData = async () => {
            let bookingResponse = null;

            try {
                // Try pending first
                try {
                    bookingResponse = await axios.get(`https://apitour.rajasthantouring.in/api/pending/${id}`);
                    const sssssssss = await axios.get(`https://apitour.rajasthantouring.in/api/ssr-data/${id}`);

                } catch (err) {
                    console.log("Pending failed, trying preview...");
                    bookingResponse = await axios.get(`https://apitour.rajasthantouring.in/api/previewPending/${id}`);
                }


                // Agar dono me se kisi se data aa gaya → no error
                const data = bookingResponse?.data;
                console.log("Final Booking Response:", data);

                // Set booking
                setBooking(data);

                // Category set
                if (data?.hotelSelections && Object.keys(data.hotelSelections).length > 0) {
                    const categories = Object.keys(data.hotelSelections);
                    setSelectedCategory(data.selectedCategory || categories[0]);
                }

                // Itinerary URL
                if (data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/Senduser${data.theme.link}/${id}`);
                } else {
                    setItineraryUrl(window.location.href);
                }

                // Policies
                setPolicies({
                    inclusions: data.inclusions || [],
                    exclusions: data.exclusions || [],
                    termsAndConditions: data.termsAndConditions || [],
                    cancellationAndRefundPolicy: data.cancellationAndRefundPolicy || [],
                    travelRequirements: data.travelRequirements || [],
                });

            } catch (err) {
                console.log("Outer Error:", err);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);




    // ============================================
    // 5. SHOW HERO IMAGE IMMEDIATELY
    // ============================================
    if (!heroImageLoaded || !booking) {
        return (
            <div className="fixed inset-0 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center z-50">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 border-4 border-gray-700 border-t-yellow-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-white text-lg font-semibold">Creating your experience...</p>
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Booking Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        className="px-6 py-3 bg-blue-500 text-white border rounded hover:bg-blue-600 transition-all font-medium"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    // ---- 1. Pick the **first** hotel category (luxury in your data) ----
    const hotelCategories = booking?.itineraryData?.hotels ?? {};
    const firstCategory = Object.keys(hotelCategories)[0];

    const totalPax =
        Number(booking?.clientDetails?.adults || 0) +
        Number(booking?.clientDetails?.kids5to12 || 0) +
        Number(booking?.clientDetails?.kidsBelow5 || 0);
    const selectedCategoryPrice = booking?.totalAmount || 0;
    const categoryData = hotelCategories[firstCategory];
    console.log(categoryData);



    const PolicyAccordion = ({
        title,
        items = [],
        section,
        headerColor = "#FFBC00",
        icon,
        iconColor,
        openPolicyIndex,
        togglePolicy,
        getImage,
    }) => {
        const isInclusionsSection = section === "inclusions";

        return (
            <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="sm:text-2xl pb-4 text-xl">
                {/* HEADER */}
                <div className="flex items-center mb-4">
                    <div className={`bg-[#FFBC00] flex items-center justify-between gap-3 px-5 py-1 rounded-md`}>
                        <h4 className="font-bold text-[white]">{title} :</h4>
                        <span className={`font-bold text-[white]`}>{icon}</span>
                    </div>
                </div>

                {/* LIST ITEMS */}
                <div className="md:p-6 p-1 space-y-4">
                    {items
                        .filter((item) => item.title?.trim()) // sirf valid title wale dikhao
                        .map((item, idx) => (
                            <div key={idx} className="rounded-lg !font-bold overflow-hidden">

                                {/* SIRF INCLUSIONS MEIN → Accordion with Image + Description */}
                                {isInclusionsSection ? (
                                    <>
                                        <button
                                            onClick={() => togglePolicy(section, idx)}
                                            className="w-full px-5 py-4 text-left font-bold text-[#3e3b3b]  flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition rounded-t-lg"
                                        >
                                            <span className="flex text-[#5e5e5e] items-center gap-2">
                                                <span className="">•</span> {item.title}
                                            </span>
                                            <svg
                                                className={`w-5 h-5 transition-transform duration-300 ${openPolicyIndex[section] === idx ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Content - Only in Inclusions */}
                                        <div
                                            className={`overflow-hidden transition-all duration-500 bg-white border-t ${openPolicyIndex[section] === idx
                                                ? "max-h-96 opacity-100"
                                                : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="p-6">
                                                <ContentWithImage item={item} getImage={getImage} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* BAaki SAB SECTIONS MEIN → Sirf Title dikhega, kuch nahi open hoga */
                                    <div className=" text-[#5e5e5e]  flex items-center gap-x-2 font-bold">
                                        <span className="">•</span>
                                        <span className="">{item.title}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        );
    };

    // Image + Description sirf Inclusions mein use hoga
    const ContentWithImage = ({ item, getImage }) => (
        <div className="flex gap-6 items-start">
            {item.image && (
                <div className="flex-shrink-0">
                    <img
                        src={getImage(item)}
                        alt={item.title}
                        className="sm:w-36 sm:h-36 w-24 h-24 object-cover rounded-xl shadow-lg border"
                    />
                </div>
            )}
            {item.description && (
                <div className="flex-1 text-gray-700 leading-relaxed space-y-2">
                    {item.description
                        .split("\n")
                        .filter((l) => l.trim())
                        .map((line, i) => (
                            <p key={i} className="flex items-start gap-2">
                                <span className="text-gray-600 mt-1">•</span>
                                <span>{line.trim()}</span>
                            </p>
                        ))}
                </div>
            )}
        </div>
    );

    const NoHotelWarning = ({ dayId, category, locations }) => {
        console.log(dayId, category, locations);

        const getDateForDays = (dayNumber) => {
            const travelDateStr = booking?.clientDetails?.travelDate; // "14-11-2025"
            if (!travelDateStr || travelDateStr === "Invalid Date") return "Date TBD";

            const [day, month, year] = travelDateStr.split("-");
            const startDate = new Date(`${year}-${month}-${day}`);

            if (isNaN(startDate.getTime())) return "Date TBD";

            const targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + dayNumber - 1);

            return targetDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        };

        // Normalize both values
        const normalize = (s) =>
            s?.toLowerCase().trim().replace(/\s+/g, " ");

        const bookingCategory = Object.keys(booking?.hotelSelectionDays || {}).find(
            (key) => normalize(key) === normalize(category)
        );

        const isDisabled =
            bookingCategory &&
            booking?.hotelSelectionDays?.[bookingCategory]?.[dayId] === true;

        if (!isDisabled) return null;

        return (
            <div className=" ">
                <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="font-bold text-xl text-gray-900 mb-2">
                    Night - {String(dayId).padStart(2, '0')}
                    {/* - {getDateForDays(dayId)} */}

                </h4><hr />


                <div className="flex items-center gap-2 m-3">
                    <FontAwesomeIcon
                        icon={faLocationDot}
                        className="text-3xl  text-yellow-600"
                    />
                    {locations?.length > 0 && (
                        <span style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="font-semibold md:text-3xl uppercase sm:text-2xl text-lg text-gray-700">
                            {" "}  {locations.join(", ")}
                        </span>
                    )}
                </div>


                <div className=" bg-gray-50 p-6 mb-8 border-2  rounded-2xl">



                    <div className="flex items-center gap-3">
                        <FontAwesomeIcon
                            icon={faHotel}
                            size="3x"
                            className="w-32 h-32  text-gray-700 mt-1 flex-shrink-0"
                        />
                        <p className="text-gray-800 text-base leading-relaxed font-medium">
                            No hotels booked for this day. Guest will arrange their own accommodation.
                        </p>
                    </div>
                </div>
            </div>
        );
    };


    const StarRating = ({ rating }) => {
        return (
            <div className="flex items-center gap-2" style={{ fontFamily: "poppins" }}>
                <span className="text-lg font-bold text-orange-600">{rating}</span>

                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                        let fill = rating - (star - 1);

                        // Clamp the fill between 0 and 1
                        if (fill < 0) fill = 0;
                        if (fill > 1) fill = 1;

                        return (
                            <div key={star} className="relative w-6 h-6">

                                {/* Empty Star */}
                                <svg
                                    className="absolute top-0 left-0 text-gray-300 w-6 h-6"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.788 1.48 8.28L12 18.896l-7.416 4.478 1.48-8.28L0 9.306l8.332-1.151z" />
                                </svg>

                                {/* Filled Star */}
                                <div
                                    className="absolute top-0 left-0 h-full overflow-hidden text-orange-500"
                                    style={{ width: `${fill * 100}%` }}
                                >
                                    <svg
                                        className="w-6 h-6"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.788 1.48 8.28L12 18.896l-7.416 4.478 1.48-8.28L0 9.306l8.332-1.151z" />
                                    </svg>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };




    const getImageUrl = (path) =>
        path?.startsWith("/uploads")
            ? `https://apitour.rajasthantouring.in${path}`
            : path || "/placeholder.png";
    // Get first UPI with QR (for main QR display)
    const mainQr = structureData?.paymentIds?.find((p) => p.qrImageUrl);
    console.log(structureData);

    // Get first bank
    const mainBank = structureData?.bankDetails?.[0];

    // Get first UPI ID (for UPI number/email)
    const mainUpi = structureData?.paymentIds?.[0];
    const pad = (num) => String(num).padStart(2, "0");




    if (!booking) return null
    return (
        <div style={{ fontFamily: "poppins" }} className={`min-h-screen flex flex-col bg-gray-50 `}>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={ogDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={ogDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Helmet>

            {/* <div className="flex justify-between items-center pt-4 w-full px-6 mb-4">
                <img
                    src={
                        structureData?.logo
                            ? structureData.logo.startsWith("/uploads")
                                ? `https://apitour.rajasthantouring.in${structureData.logo}`
                                : structureData.logo
                            : "/logo1.png"
                    }
                    alt="Company Logo"
                    className="h-16 w-auto object-contain"
                />
                {booking?.contact?.mobiles?.[0] && (
                    <a
                        href={`https://wa.me/${booking?.contact.mobiles[0].replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                        {booking?.contact.mobiles[0].replace(/[^0-9]/g, "")}
                    </a>
                )}
            </div> */}

            <div
                className={`transition-opacity duration-1000 ease-in-out ${showContent ? 'opacity-100' : 'opacity-0'}`}
            >
                <div ref={componentRef} className="w-full max-w-7xl no-break print-area mx-auto ">


                    <div className="flex w-full pop justify-end p-3 gap-4">
                        {/* Print Button */}




                        <button onClick={() => navigate(`/userpayment/${booking?._id}?tab=Optional`)} className=" inline-block px-4 bg-yellow-600 z-20 text-white py-3 rounded-md cursor-pointer">
                            Book Now
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={pdfLoading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg
                        hover:bg-yellow-700 transition-colors text-sm font-medium sm:w-auto
                        disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pdfLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{pdfStatus || "Generating PDF..."}</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
                                    <span>Print</span>
                                </>
                            )}
                        </button>

                    </div>


                    <section className="relative bg-[#FFFFFF] w-full rounded-lg shadow-lg overflow-hidden">


                        {/* Visible hero - now should be cached */}
                        <img
                            src="/selava.pdf/1.svg"
                            alt="Rajasthan Touring"
                            className="w-full h-auto block object-cover md:object-contain"
                            loading="eager"
                            decoding="sync"
                        />

                        {/* Contact Info - Responsive */}
                        {booking?.contact && (
                            <div className="absolute inset-0 flex items-start top-[-4%] sm:top-0 justify-end py-4 w-full md:py-6 pointer-events-none">
                                <div className="rounded-lg  py-4 md:py-6 px-2 md:px-4 md:mt-6  w-full  pointer-events-auto">
                                    <div className="flex items-center w-[100%] justify-end gap-2 md:gap-3">

                                        <span style={{ fontFamily: "sans-serif" }} className="mr-4 text-gray-800  min-w-[100%  font-extrabold text-sm sm:text-2xl md:text-3xl ">(A Unit of Karni Kripa Holidays)</span>
                                    </div>

                                    <div className=" flex justify-end gap-0 p-0   relative font-bold flex-col  mt-4  md:space-y-4 text-gray-800 text-xs md:text-sm lg:text-base">



                                        {/* ✅ Address */}
                                        {Array.isArray(booking?.contact?.addresses) && booking.contact.addresses.length > 0 && (
                                            <div style={{ fontFamily: "poppins" }} className="flex items-start m-0  justify-end gap-2 md:gap-3">
                                                <p
                                                    style={{ fontFamily: "poppins" }}
                                                    className="leading-tight sm:max-w-[50%] max-w-[60%] text-sm sm:text-xl md:text-2xl md:max-w-[75%] text-wrap text-right"
                                                >
                                                    {booking.contact.addresses.map((addr, index) => (
                                                        <span key={index}>
                                                            {/* STREET */}
                                                            {addr.street && (
                                                                <>
                                                                    {addr.street}
                                                                    {/* sm se upar <br> add */}
                                                                    <br className="hidden sm:block" />
                                                                </>
                                                            )}

                                                            {/* AREA */}
                                                            {addr.area && <>{addr.area}</>}

                                                            {/* CITY */}
                                                            {addr.city && <>{addr.city}, </>}

                                                            {/* STATE */}
                                                            {addr.state && <>{addr.state} </>}

                                                            {/* PINCODE */}
                                                            {addr.pincode && (
                                                                <>
                                                                    {addr.pincode}
                                                                    <br />
                                                                </>
                                                            )}

                                                            {/* COUNTRY */}
                                                            {addr.country && <>{addr.country}</>}
                                                        </span>
                                                    ))}
                                                </p>

                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-base md:text-lg mt-0.5 flex-shrink-0" />
                                            </div>
                                        )}

                                        {/* ✅ Phone */}
                                        {Array.isArray(booking?.contact?.mobiles) && booking.contact.mobiles.length > 0 && (
                                            <div className="flex items-center p-0  text-sm sm:text-xl md:text-2xl m-0 justify-end gap-x-2 md:gap-x-3">
                                                <a
                                                    href={`tel:${booking.contact.mobiles[0]}`}
                                                    className="underline"
                                                >
                                                    {booking.contact.mobiles.join(", ")}
                                                </a>

                                                <a href={`tel:${booking.contact.mobiles[0]}`}>
                                                    <FontAwesomeIcon
                                                        icon={faPhoneAlt}
                                                        className="text-orange-500 text-base md:text-lg flex-shrink-0"
                                                    />
                                                </a>
                                            </div>
                                        )}


                                        {/* ✅ Website */}
                                        {booking?.contact?.socialLinks?.website && (
                                            <div className="flex items-center   text-sm sm:text-xl md:text-2xl  m-0 justify-end gap-2 md:gap-3">
                                                <a
                                                    href={booking.contact.socialLinks.website}
                                                    className="text-gray-700 hover:underline break-all"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {booking.contact.socialLinks.website}
                                                </a>
                                                <FontAwesomeIcon icon={faGlobe} className="text-orange-500 text-base md:text-lg flex-shrink-0" />
                                            </div>
                                        )}

                                        {/* ✅ Email */}
                                        {Array.isArray(booking?.contact?.emails) && booking.contact.emails.length > 0 && (
                                            <div className="flex items-center  text-sm sm:text-xl md:text-2xl m-0  justify-end gap-2 md:gap-3">
                                                <a
                                                    href={`mailto:${booking.contact.emails[0]}`}
                                                    className="text-gray-700 hover:underline break-all"
                                                >
                                                    {booking.contact.emails.join(", ")}
                                                </a>
                                                <FontAwesomeIcon icon={faEnvelope} className="text-orange-500 text-base md:text-lg flex-shrink-0" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute capitalize bottom-[12%] md:bottom-[12%] w-[70%] left-1/2 transform -translate-x-1/2 ">
                            {booking.clientDetails.name && (
                                <div className="mx-auto max-w-6xl text-center

            ">
                                    <h1 className="montserrat
    font-bold text-white leading-tight
    text-[clamp(12px,3vw,12px)]
    md:text-[clamp(38px,4vw,46px)]
">
                                        {booking.clientDetails.name} & Family
                                    </h1>

                                    <h1
                                        style={{ fontFamily: "Times New Roman, Times, serif" }} className="flex justify-center flex-wrap
    font-semibold text-gray-800 mt-1 leading-tight
    text-[clamp(10px,3vw,12px)]
    md:text-[clamp(18px,1.8vw,24px)]
">
                                        {booking.selectedItinerary.duration}

                                        ({[
                                            booking.clientDetails.adults > 0 &&
                                            `${String(booking.clientDetails.adults).padStart(2, "0")} Adults`,
                                            booking.clientDetails.kids5to12 > 0 &&
                                            `${String(booking.clientDetails.kids5to12).padStart(2, "0")} Children`,
                                            booking.clientDetails.kidsBelow5 > 0 &&
                                            `${String(booking.clientDetails.kidsBelow5).padStart(2, "0")} Infants`
                                        ]
                                            .filter(Boolean)
                                            .join(" + ")}
                                        )

                                    </h1>

                                </div>
                            )}
                        </div>

                        <h1
                            className=" absolute sm:bottom-0 bottom-[-5px] left-1/2 -translate-x-1/2
             sm:px-3 border inline-block rounded-2xl m-2
             sm:text-lg md:text-xl font-bold text-black leading-relaxed
             flex px-1 flex-col text-[8px] sm:flex-row sm:flex-wrap sm:items-center
             gap-2 sm:gap-3"
                        >

                            {/* Travel Date */}
                            {booking?.clientDetails?.travelDate && (
                                <>
                                    Travel Date:-
                                    <span className="text-white ">
                                        {booking.clientDetails.travelDate}
                                    </span>
                                </>
                            )}

                        </h1>



                    </section>



                    <img src="/selava.pdf/2-cropped.svg" loading="eager"
                        decoding="sync" className="w-full h-auto block object-cover md:object-contain" alt="" />
                    {/* {(() => {
                    const firstSuccessPayment =
                        booking?.payments?.find((p) => p.status === "success") || null;

                    return (
                        firstSuccessPayment && (
                            <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="my-1 w-full flex flex-col justify-end px-4 md:px-10">
                                <p className="text-green-700 font-bold text-sm sm:text-lg md:text-xl text-center mt-4">
                                    Thank you for depositing the amount ({firstSuccessPayment.amount} INR) — Your Rajasthan trip is confirmed!
                                    Confirmation Number: RT{booking.bookingId}
                                </p>
                                <p className="text-green-700 font-bold text-sm sm:text-lg md:text-xl text-center">Please check and approve the details.</p>

                            </div>
                        )
                    );
                })()} */}



                    {booking?.itineraryData?.days?.length > 0 && (
                        <section className=" mb-8 overflow-hidden">
                            {/* Itinerary Days */}
                            <div className="md:p-8 sm:p-4 p-2 relative space-y-10">
                                {booking?.itineraryData?.days?.map((day, index) => {
                                    // Convert "DD-MM-YYYY" → proper Date
                                    const travelDateStr = booking?.clientDetails?.travelDate;
                                    let travelStart = null;

                                    if (travelDateStr) {
                                        const [dayPart, monthPart, yearPart] = travelDateStr.split("-");
                                        travelStart = new Date(`${yearPart}-${monthPart}-${dayPart}T00:00:00`);
                                    }

                                    // Calculate date for current day
                                    const currentDayDate = travelStart
                                        ? new Date(travelStart.getTime() + index * 24 * 60 * 60 * 1000)
                                        : null;

                                    // Format "10TH JAN’26"
                                    let formattedDate = "";
                                    let displayDate = "";
                                    let location = "";

                                    if (currentDayDate) {
                                        const dayNum = currentDayDate.getDate();
                                        const suffix =
                                            dayNum === 1 || dayNum === 21 || dayNum === 31
                                                ? "ST"
                                                : dayNum === 2 || dayNum === 22
                                                    ? "ND"
                                                    : dayNum === 3 || dayNum === 23
                                                        ? "RD"
                                                        : "TH";

                                        const month = currentDayDate
                                            .toLocaleString("en-GB", { month: "short" })
                                            .toUpperCase();

                                        const year = currentDayDate.getFullYear().toString().slice(-2);

                                        formattedDate = `${dayNum}${suffix} ${month}'${year}`;

                                        // ✅ Join all locations with commas
                                        const allLocations = day.locations?.length
                                            ? day.locations.join(", ")
                                            : "";

                                        location = allLocations

                                        const allLocationsz = day.locations?.length
                                            ? day.locations.slice(0, 3).join(", ") + (day.locations.length > 3 ? "..." : "")
                                            : "";
                                        // ✅ Final display text
                                        displayDate = `${formattedDate}${allLocations ? "  " : ""}`;
                                    }
                                    return (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-8 last:border-b-0"
                                        >
                                            {/* Left Side - Day Info */}
                                            <div>
                                                <div className=" flex items-center gap-4">
                                                    <div style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="inline-block bg-[#0f2a49] min-w-[100px] text-white px-4 py-1 rounded-b-md mb-4 text-lg font-bold">
                                                        DAY {index + 1}


                                                    </div>

                                                    <div
                                                        style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="pb-4 flex gap-2  capitalize rounded-b-2xl  text-wrap  font-bold sm:text-lg tracking-wide leading-snug"
                                                    >
                                                        {day.titles[0] || day.titles[0]}
                                                    </div>

                                                </div>

                                                <div className=" flex items-center gap-4">

                                                    <div
                                                        style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="  capitalize pb-2 rounded-b-2xl text-center text-wrap  font-bold text-lg tracking-wide leading-snug"
                                                        dangerouslySetInnerHTML={{ __html: displayDate }}
                                                    />


                                                </div>



                                                {day.descriptions?.length ? (
                                                    <div className="space-y-4 text-[#605b5b]   leading-relaxed sm:text-[22px]  ql-editor">
                                                        {day.descriptions.map((desc, descIndex) => (
                                                            <div
                                                                style={{ fontFamily: "Montserrat", fontWeight: 800, color: "#605b5b", background: "none" }} key={descIndex}
                                                                dangerouslySetInnerHTML={{ __html: desc }}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-600 italic">No description available.</p>
                                                )}

                                            </div>

                                            {/* Right Side - Image Card */}
                                            {day.images?.length > 0 && (
                                                <div className="inline-flex justify-center">
                                                    <div className="relative w-full rounded-2xl overflow-hidden h-auto">

                                                        {/** RANDOM IMAGE LOGIC   */}
                                                        {(() => {
                                                            const shuffled = [...day.images].sort(() => 0.5 - Math.random());
                                                            const randomThree = shuffled.slice(0, 3);

                                                            return (
                                                                <Swiper
                                                                    modules={[Autoplay, Pagination]}
                                                                    autoplay={{ delay: 3000 }}

                                                                    loop={true}
                                                                    className="rounded-t-2xl"
                                                                >
                                                                    {randomThree.map((img, i) => (
                                                                        <SwiperSlide key={i}>
                                                                            <img
                                                                                src={`${BASE_URL}${img}`}
                                                                                alt={`Day ${index + 1}`}
                                                                                className="w-full h-64 md:h-80 object-cover"
                                                                                onError={(e) => {
                                                                                    e.target.src =
                                                                                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                                                                                }}
                                                                            />
                                                                        </SwiperSlide>
                                                                    ))}
                                                                </Swiper>
                                                            );
                                                        })()}

                                                        {/* Bottom Overlay */}
                                                        <div
                                                            style={{ fontFamily: "Montserrat", fontWeight: 800 }}
                                                            className=" capitalize flex w-full justify-center gap-2 bg-[#d7a33b] rounded-b-2xl text-center text-white py-3 font-bold text-lg tracking-wide leading-snug"
                                                        >
                                                            <CarFront className="w-7 h-7" />   {booking.itineraryData.vehicle?.map((v) => v.model).join(", ")}/Similar
                                                        </div>

                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>

                        </section>
                    )}

                    {booking?.noteText && (
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
                                <p className="text-md md:text-lg font-bold text-black leading-relaxed whitespace-pre-wrap">
                                    <strong className="text-xl md:text-lg font-bold text-black">
                                        Note :-{" "}
                                    </strong>
                                    {booking.noteText}
                                </p>

                            </div>
                        </div>
                    )}



                    <div className="overflow-hidden">
                        <img src="/selava.pdf/6-cropped.svg" className="w-full h-auto block object-cover md:object-contain" alt="" />

                        {/* <p className="h-22 absolute  bg-gradient-to-b from-[#afa489] via-[#f8d687] to-[#D7A022]"></p>    */}
                        <section className="py-10 mt-0 bg-gradient-to-r from-[#D7A022] via-[#EBB22D] to-[#D7A022] flex flex-col items-center justify-center text-center ">
                            <div className="flex gap-6 my-12 sm:gap-8 w-full max-w-6xl px-4 justify-center items-center">
                                {categories.map((category, index) => {
                                    const categoryHotels = booking?.itineraryData.hotels?.[category];
                                    if (!categoryHotels) return null;

                                    let representativeImage = null;
                                    for (const day in categoryHotels) {
                                        for (const location in categoryHotels[day]) {
                                            const hotelGroup = categoryHotels[day][location];
                                            if (hotelGroup.breakfast?.options?.length) {
                                                representativeImage = hotelGroup.breakfast.options[0].image;
                                                break;
                                            }
                                        }
                                        if (representativeImage) break;
                                    }

                                    const isLeft = index === 0 && categories.length > 1;
                                    const isRight = index === categories.length - 1 && categories.length > 1;
                                    const isCenter = categories.length > 2 && index === 1;

                                    // 👇 Conditional image logic
                                    const defaultImage =
                                        categories.length === 2
                                            ? index === 0
                                                ? "/selava.pdf/Untitled design (21).svg"
                                                : "/selava.pdf/Untitled design (22).svg"
                                            : "/selava.pdf/Untitled design (21).svg";

                                    return (
                                        <div
                                            key={category}
                                            data-index={index}
                                            className={`
            relative bg-white p-4 rounded-xl shadow-lg overflow-hidden transition-all sm:w-[30%] duration-500 ease-in-out transform-gpu
            ${isLeft ? '-rotate-12 hover:rotate-6' : ''}
            ${isRight ? 'rotate-12 hover:-rotate-6' : ''}
            ${isCenter || categories.length === 1 ? 'rotate-0 hover:rotate-0' : ''}
            hover:shadow-2xl hover:scale-105
          `}
                                            style={{
                                                transform: isLeft ? 'rotate(-12deg)' : isRight ? 'rotate(12deg)' : 'rotate(0deg)',
                                            }}
                                        >
                                            {/* Hotel Image */}
                                            <div className="aspect-[4/3] overflow-hidden rounded-lg">
                                                <img
                                                    src={defaultImage}
                                                    alt={`${category} hotel`}
                                                    className="object-cover w-full h-full transition-transform duration-700"
                                                    onError={(e) => (e.target.src = "/placeholder-hotel.jpg")}
                                                />
                                            </div>

                                            {/* Overlay + Info */}
                                            <div className="bg-white text-center py-4 flex flex-col items-center -mt-2">
                                                <div className="flex justify-center gap-6 mb-2 text-gray-700">
                                                    <button className="text-red-500 hover:scale-125 transition-transform duration-200">
                                                        <FaHeart className="text-xl sm:text-2xl" />
                                                    </button>
                                                    <button className="hover:text-blue-500 hover:scale-125 transition-transform duration-200">
                                                        <FaComment className="text-xl sm:text-2xl" />
                                                    </button>
                                                    <button className="hover:text-green-500 hover:scale-125 transition-transform duration-200">
                                                        <FaShareAlt className="text-xl sm:text-2xl" />
                                                    </button>
                                                </div>
                                                <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 uppercase tracking-wider">
                                                    {category} Hotels Package
                                                </h4>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="mt-6 sm:mt-12 max-w-[600px] mx-auto px-4 text-white text-shadow-black">
                                We’ve curated two exclusive travel packages just for you. Choose the one that suits your journey best – or explore both!
                            </p>
                        </section>

                    </div>

                    {(() => {
                        const categories = Object.keys(booking?.itineraryData?.hotels || {}).filter(
                            (cat) => booking?.itineraryData?.hotels?.[cat]
                        );



                        if (categories.length === 0) return null;

                        // Sirf pehli category ke liye data
                        const firstCategory = categories[0];
                        const categoryData = booking?.itineraryData?.hotels?.[firstCategory];


                        console.log(categoryData);

                        return (
                            <>
                                {/* ====== FIRST CATEGORY (Always Show) ====== */}
                                <section className="relative bg-[#FFFFFF] w-full md:pb-60 sm:pb-20 pb-10 shadow-lg overflow-hidden">
                                    {/* Background Image */}
                                    <div className="relative w-full">
                                        <img
                                            src="/selava.pdf/7-cropped.svg"
                                            alt="Rajasthan Touring"
                                            loading="eager"
                                            decoding="sync"
                                            className="w-full h-auto p-0 m-0 block object-cover"
                                        />
                                        <div className="inset-0 absolute bg-black/40"></div>

                                        <div className="bg-white p-0.5 z-[0] h-[80%] absolute bottom-[-40%] right-[5%] w-[40%] rounded-2xl overflow-hidden  pointer-events-none shadow-lg">
                                            {(() => {
                                                const allImages = booking?.itineraryData?.days
                                                    ?.flatMap((day) => day.images || [])
                                                    .filter((img) => !!img);

                                                const imageToShow =
                                                    allImages?.length > 0
                                                        ? allImages[Math.floor(Math.random() * allImages.length)]
                                                        : null;

                                                return imageToShow ? (
                                                    <img
                                                        src={`/selava.pdf/Untitled design (21).svg`}
                                                        alt="Itinerary Highlight"
                                                        className="w-full h-full object-cover rounded-2xl opacity-90 hover:opacity-100 transition-opacity duration-500"

                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-white text-sm font-semibold">
                                                        No Image Available
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Overlay */}
                                    <div className="absolute z-[1] inset-0 flex flex-col justify-start items-start p-4 md:p-8">
                                        <div className="w-full max-w-4xl space-y-3 md:space-y-6">
                                            <h3 className="font-bold Baloo Balooow capitalize text-white leading-tight text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl">
                                                {firstCategory} <br className="block md:hidden" />
                                                <span className="hidden md:inline"> </span>Hotels Package
                                            </h3>

                                            <p className="text-white md:text-left">
                                                <span style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="flex flex-wrap items-center justify-start md:justify-start gap-1 md:gap-2 text-sm sm:text-xl md:text-2xl lg:text-3xl">
                                                    <span className="font-semibold text-2xl ">Cost for</span>{' '}
                                                    {booking?.clientDetails?.adults > 0 && (
                                                        <span className="">
                                                            {String(booking.clientDetails.adults).padStart(2, '0')} Adults
                                                        </span>
                                                    )}
                                                    {booking?.clientDetails?.kids5to12 > 0 && (
                                                        <>
                                                            {booking?.clientDetails?.adults > 0 && <span className="hidden md:inline mx-1">&</span>}
                                                            <span className="">
                                                                {String(booking.clientDetails.kids5to12).padStart(2, '0')} Child (5-12 yrs)
                                                            </span>
                                                        </>
                                                    )}
                                                    {booking?.clientDetails?.kidsBelow5 > 0 && (
                                                        <>
                                                            {(booking?.clientDetails?.adults > 0 || booking?.clientDetails?.kids5to12 > 0) && (
                                                                <span className="hidden md:inline mx-1">&</span>
                                                            )}
                                                            <span className="">
                                                                {String(booking.clientDetails.kidsBelow5).padStart(2, '0')} Infant
                                                            </span>
                                                        </>
                                                    )}
                                                    {booking?.clientDetails?.rooms > 0 && (
                                                        <>
                                                            {(booking?.clientDetails?.rooms > 0 || booking?.clientDetails?.rooms > 0) && (
                                                                <span className="hidden md:inline mx-1">&</span>
                                                            )}
                                                            <span className="">
                                                                {String(booking.clientDetails.rooms).padStart(2, '0')} Rooms
                                                            </span>
                                                        </>
                                                    )}
                                                    {booking?.clientDetails?.extraBeds > 0 && (
                                                        <>
                                                            {(booking?.clientDetails?.extraBeds > 0 || booking?.clientDetails?.extraBeds > 0) && (
                                                                <span className="hidden md:inline mx-1">&</span>
                                                            )}
                                                            <span className="font-bold">
                                                                {String(booking.clientDetails.extraBeds).padStart(2, '0')} ExtraBeds
                                                            </span>
                                                        </>
                                                    )}
                                                    {(!booking?.clientDetails?.adults && !booking?.clientDetails?.kids5to12 && !booking?.clientDetails?.kidsBelow5) && (
                                                        <span className="text-gray-400">No guests</span>
                                                    )}
                                                </span>
                                            </p>

                                            <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="flex justify-start md:justify-start">
                                                <div className="rounded-xl p-3 md:p-6 inline-block">
                                                    <div className="font-bold flex items-center text-white text-3xl sm:text-4xl md:text-5xl lg:text-8xl">
                                                        <span className="text-[45px] font-medium sm:text-[50px] md:text-[65px] lg:text-[140px]"> ₹</span>{booking?.totalAmount?.[firstCategory] || 0}/-
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hotel Names List */}
                                    <div className="relative z-[1]">
                                        <div className="rounded overflow-hidden">
                                            <div className="pt-22 pl-6">
                                                <div>
                                                    {booking?.itineraryData?.hotels?.[firstCategory] ? (() => {

                                                        const uniqueHotels = new Set();

                                                        // Collect All Unique Hotel Names
                                                        Object.keys(booking.itineraryData.hotels[firstCategory]).forEach((dayId) => {
                                                            const dayData = booking.itineraryData.hotels[firstCategory][dayId];

                                                            Object.keys(dayData).forEach((location) => {
                                                                const locationHotels = dayData[location];

                                                                ["breakfast", "lunch", "dinner", "stayOnly"].forEach((meal) => {
                                                                    const mealStruct = locationHotels[meal] || {};
                                                                    const options = mealStruct.options || [];

                                                                    const mealOptions = options.filter((h) => h && getHotelId(h));

                                                                    mealOptions.forEach((hotel) => {
                                                                        if (hotel?.name) uniqueHotels.add(hotel.name);
                                                                    });
                                                                });
                                                            });
                                                        });

                                                        const finalHotels = Array.from(uniqueHotels);

                                                        return (
                                                            <div className="mb-0 w-full break-words whitespace-normal pr-[48%] md:pr-[45%] sm:pr-[50%]">
                                                                {finalHotels.length > 0 ? (
                                                                    <ul className="list-disc  ml-5">
                                                                        {finalHotels.map((hotelName, index) => (
                                                                            <li key={index} className="mb-2">
                                                                                <span
                                                                                    style={{ fontFamily: "Montserrat", fontWeight: 600, }}
                                                                                    className="
                                        text-[10px]
                                        sm:text-[12px]
                                        md:text-[18px]
                                        lg:text-[22px]
                                        xl:text-[26px]
                                        text-[#275d69]
                                    "
                                                                                >
                                                                                    {hotelName}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">No hotels found</p>
                                                                )}
                                                            </div>
                                                        );

                                                    })() : (
                                                        <div className="p-3 border rounded bg-gray-50 text-center">
                                                            <p className="text-sm text-gray-700">No hotels available for this category.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    <div className="min-h-[380px] block">
                                        <img
                                            src="/selava.pdf/Untitled design (1).svg"
                                            alt="Rajasthan Touring"
                                            loading="eager"
                                            decoding="sync"
                                            className="w-[400px] absolute bottom-0 right-0 h-auto block object-cover"
                                        />
                                    </div>
                                </section>

                                {/* ====== DETAILED HOTEL LIST (First Category) ====== */}
                                {/* ====== DETAILED HOTEL LIST (First Category) ====== */}
                                <section className=" mb-8 overflow-hidden">
                                    <div className="bg-[#ffffff] rounded overflow-hidden">
                                        <div className="p-4">
                                            <div className="rounded bg-gray-50 md:p-4">
                                                {(() => {


                                                    // 🔥 Get all possible day IDs from booking
                                                    const allDayIds = booking?.itineraryData?.days?.map(d => d.id) || [];

                                                    return allDayIds.sort((a, b) => parseInt(a) - parseInt(b)).map((dayId) => {
                                                        // Find correct category key (case-insensitive)
                                                        const matchedCategory = Object.keys(booking?.hotelSelectionDays || {}).find(
                                                            k => k.toLowerCase().trim() === firstCategory.toLowerCase().trim()
                                                        );


                                                        // Check if this day is disabled
                                                        const isDisabled = booking?.hotelSelectionDays?.[matchedCategory]?.[dayId] === true;
                                                        const itineraryDay = booking?.itineraryData?.days?.find(d => Number(d.id) === Number(dayId));
                                                        const locations = itineraryDay?.locations?.filter(loc => loc.toLowerCase() !== "departure") || [];

                                                        // If disabled, show warning
                                                        if (isDisabled) {
                                                            return <NoHotelWarning key={dayId} dayId={dayId} category={firstCategory} locations={locations} />;
                                                        }

                                                        // Check if day has hotels
                                                        const day = categoryData[dayId];
                                                        if (!day) return null;

                                                        const hasValidMeals = Object.keys(day).some((location) => {
                                                            const meals = day[location];
                                                            if (!meals) return false;
                                                            return Object.keys(meals).some((meal) => {
                                                                const mealData = meals[meal];
                                                                const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                return hotels.length > 0;
                                                            });
                                                        });

                                                        const safeDayId = Number(dayId) || 0;
                                                        const label = String(safeDayId).padStart(2, "0");

                                                        if (!hasValidMeals) return null;

                                                        return (
                                                            <div key={dayId} className="mb-6">
                                                                <div className="mb-3 pb-2 border-b border-gray-200">
                                                                    <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="font-bold text-md text-gray-800">
                                                                        Night- {label}
                                                                    </h4>
                                                                </div>
                                                                {Object.keys(day).map((location) => {
                                                                    const meals = day[location];
                                                                    if (!meals) return null;
                                                                    const hasValidMeals = Object.keys(meals).some((meal) => {
                                                                        const mealData = meals[meal];
                                                                        const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                        return hotels.length > 0;
                                                                    });
                                                                    if (!hasValidMeals) return null;
                                                                    return (
                                                                        <div key={location} className="mt-4">
                                                                            <div className="flex items-center gap-2 ">
                                                                                <div className="flex items-center gap-2 m-3">
                                                                                    <FontAwesomeIcon
                                                                                        icon={faLocationDot}
                                                                                        className="text-3xl text-yellow-600"
                                                                                    />
                                                                                    <span style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="font-semibold md:text-3xl sm:text-2xl text-lg text-gray-700">
                                                                                        {location.toUpperCase()}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-4">
                                                                                {Object.keys(meals).map((meal) => {
                                                                                    const mealData = meals[meal];
                                                                                    const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                                    if (!hotels.length) return null;
                                                                                    return (
                                                                                        <div key={meal} className="overflow-hidden">
                                                                                            <div className="flex items-center justify-start mb-2">
                                                                                                <span
                                                                                                    style={{ fontFamily: "Montserrat", fontWeight: 600 }}
                                                                                                    className="text-xs text-gray-500"
                                                                                                >
                                                                                                    {meal === "stayOnly"
                                                                                                        ? "Stay Only"
                                                                                                        : meal.charAt(0).toUpperCase() + meal.slice(1)}
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="w-full">
                                                                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr] sm:gap-6 gap-1 items-center justify-items-center">
                                                                                                    {hotels.map((hotel, index) => (
                                                                                                        <React.Fragment key={hotel.id}>
                                                                                                            {/* Hotel Card */}
                                                                                                            <div className="w-full max-w-md bg-gray-200  border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                                                                                <div className="flex items-start gap-4">
                                                                                                                    <div className="w-32 h-32 flex-shrink-0">
                                                                                                                        {hotel.image ? (
                                                                                                                            <img
                                                                                                                                src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                                                alt={hotel.name}
                                                                                                                                className="w-full h-full rounded-2xl object-cover"
                                                                                                                                onError={(e) => {
                                                                                                                                    e.target.style.display = "none";
                                                                                                                                    e.target.nextElementSibling?.classList.remove("hidden");
                                                                                                                                }}
                                                                                                                            />
                                                                                                                        ) : null}
                                                                                                                        <div className="hidden w-full h-full bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center">
                                                                                                                            <span className="text-xs text-gray-500">No Image</span>
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    <div className="flex-1">
                                                                                                                        <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="font-bold sm:text-lg text-gray-900">{hotel.name}</h4>
                                                                                                                        <div className="flex items-center flex-wrap gap-1 text-sm text-amber-600 mt-1">
                                                                                                                            <StarRating rating={hotel.rating || 0} />
                                                                                                                            <span className="text-gray-500">({hotel.reviews || 0} reviews)</span>
                                                                                                                        </div>
                                                                                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                                                                                            {hotel.description || "Relaxed hotel with dining & a bar"}
                                                                                                                        </p>

                                                                                                                        {hotel.googleReviewLink && (
                                                                                                                            <a
                                                                                                                                href={hotel.googleReviewLink}
                                                                                                                                target="_blank"
                                                                                                                                rel="noopener noreferrer"
                                                                                                                                className="mt-3 inline-block px-4 py-2 text-xs font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 transition"
                                                                                                                            >
                                                                                                                                View Photos
                                                                                                                            </a>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>

                                                                                                            {/* OR Separator - Only show between hotels */}
                                                                                                            {index < hotels.length - 1 && (
                                                                                                                <div className="hidden md:flex items-center justify-center w-20">
                                                                                                                    <span className="text-2xl font-bold text-gray-500 select-none">OR</span>
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {/* Mobile mein OR ko cards ke neeche dikhane ke liye */}
                                                                                                            {index < hotels.length - 1 && (
                                                                                                                <div className="md:hidden w-full flex justify-center ">
                                                                                                                    <span className="text-sm font-bold text-gray-500 px-6 py- rounded-full">OR</span>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </React.Fragment>
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
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* ====== SECOND CATEGORY (Only if 2 categories exist) ====== */}
                                {categories.length === 2 && (() => {
                                    const secondCategory = categories[1];
                                    const secondCategoryData = booking?.itineraryData?.hotels?.[secondCategory];

                                    return (
                                        <>
                                            {/* Background Section for Second Category */}
                                            <section className="relative bg-[#FFFFFF] w-full md:pb-60 sm:pb-20 pb-10 shadow-lg overflow-hidden">
                                                <div className="relative w-full">
                                                    <img
                                                        src="/selava.pdf/7-cropped.svg"
                                                        alt="Rajasthan Touring"
                                                        loading="eager"
                                                        decoding="sync"
                                                        className="w-full h-auto block object-cover"
                                                    />
                                                    <div className="inset-0 absolute bg-black/40"></div>

                                                    <div className="bg-[#FFFFFF] p-0.5 z-[0] h-[80%] absolute bottom-[-40%] right-[5%] w-[40%] pointer-events-none rounded-2xl overflow-hidden shadow-lg">
                                                        {(() => {
                                                            const allImages = booking?.itineraryData?.days
                                                                ?.flatMap((day) => day.images || [])
                                                                .filter((img) => !!img);
                                                            const imageToShow =
                                                                allImages?.length > 0
                                                                    ? allImages[Math.floor(Math.random() * allImages.length)]
                                                                    : null;

                                                            return imageToShow ? (
                                                                <img
                                                                    src={`/selava.pdf/Untitled design (22).svg`}
                                                                    alt="Itinerary Highlight"
                                                                    className="w-full h-full object-cover rounded-2xl opacity-90 hover:opacity-100 transition-opacity duration-500"
                                                                    onError={(e) => {
                                                                        e.target.src =
                                                                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full text-white text-sm font-semibold">
                                                                    No Image Available
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="absolute z-[1] inset-0 flex flex-col justify-start items-start h-full p-4 md:p-8">
                                                    <div className="w-full mt-5 max-w-4xl m-0 space-y-3 md:space-y-6">
                                                        <h3 className="font-bold Baloo Balooow capitalize font-[Luckiest Guy] text-white text-start leading-tight text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl">
                                                            {secondCategory} <br className="block md:hidden" />
                                                            <span className="hidden md:inline"> </span>Hotels Package
                                                        </h3>

                                                        <p className="text-white md:text-left">
                                                            <span style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="flex flex-wrap items-center justify-start md:justify-start gap-1 md:gap-3 text-sm sm:text-xl md:text-2xl lg:text-3xl">
                                                                <span className="font-semibold">Cost for</span>{' '}
                                                                {booking?.clientDetails?.adults > 0 && (
                                                                    <span className="font-bold">
                                                                        {String(booking.clientDetails.adults).padStart(2, '0')} Adults
                                                                    </span>
                                                                )}
                                                                {booking?.clientDetails?.kids5to12 > 0 && (
                                                                    <>
                                                                        {booking?.clientDetails?.adults > 0 && <span className="hidden md:inline mx-1">&</span>}
                                                                        <span className="font-bold">
                                                                            {String(booking.clientDetails.kids5to12).padStart(2, '0')} Child (5-12 yrs)
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {booking?.clientDetails?.kidsBelow5 > 0 && (
                                                                    <>
                                                                        {(booking?.clientDetails?.adults > 0 || booking?.clientDetails?.kids5to12 > 0) && (
                                                                            <span className="hidden md:inline mx-1">&</span>
                                                                        )}
                                                                        <span className="font-bold">
                                                                            {String(booking.clientDetails.kidsBelow5).padStart(2, '0')} Infant
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {booking?.clientDetails?.rooms > 0 && (
                                                                    <>
                                                                        {(booking?.clientDetails?.rooms > 0 || booking?.clientDetails?.rooms > 0) && (
                                                                            <span className="hidden md:inline mx-1">&</span>
                                                                        )}
                                                                        <span className="font-bold">
                                                                            {String(booking.clientDetails.rooms).padStart(2, '0')} Rooms
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {booking?.clientDetails?.extraBeds > 0 && (
                                                                    <>
                                                                        {(booking?.clientDetails?.extraBeds > 0 || booking?.clientDetails?.extraBeds > 0) && (
                                                                            <span className="hidden md:inline mx-1">&</span>
                                                                        )}
                                                                        <span className="font-bold">
                                                                            {String(booking.clientDetails.extraBeds).padStart(2, '0')} ExtraBeds
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </span>
                                                        </p>


                                                        <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="flex justify-start items-center md:justify-start">
                                                            <div className="rounded-xl p-3 md:p-6 inline-block">
                                                                <div className="font-bold flex items-center text-white text-3xl sm:text-4xl md:text-5xl lg:text-8xl">
                                                                    <span className="text-[45px] font-medium sm:text-[50px] md:text-[65px] lg:text-[140px]"> ₹</span>{booking?.totalAmount?.[secondCategory] || 0}/-
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-[1]">
                                                    <div className="rounded overflow-hidden">
                                                        <div className="flex items-center gap-6 p-6  ">
                                                            <div className="pt-22 pl-6">
                                                                {booking?.itineraryData?.hotels?.[secondCategory] ? (() => {

                                                                    // 🔥 GLOBAL UNIQUE HOTEL LIST
                                                                    const globalHotels = new Set();

                                                                    // Step 1: Collect all hotel names from all days + meals
                                                                    Object.keys(booking.itineraryData.hotels[secondCategory]).forEach(dayId => {
                                                                        const dayData = booking.itineraryData.hotels[secondCategory][dayId];

                                                                        Object.keys(dayData).forEach(location => {
                                                                            const locationHotels = dayData[location];

                                                                            ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                                                const mealStruct = locationHotels[meal] || {};
                                                                                const options = mealStruct.options || [];
                                                                                const mealOptions = options.filter(h => h && getHotelId(h));

                                                                                mealOptions.forEach(hotel => {
                                                                                    if (hotel?.name) {
                                                                                        globalHotels.add(hotel.name); // 🔥 UNIQUE ADD
                                                                                    }
                                                                                });
                                                                            });
                                                                        });
                                                                    });

                                                                    // Step 2: Final Unique Hotels Array
                                                                    const finalHotelList = Array.from(globalHotels);

                                                                    return (
                                                                        <div className="mb-0 w-full whitespace-normal ">

                                                                            {finalHotelList.length > 0 ? (
                                                                                <ul className="list-disc font-semibold  ml-5">

                                                                                    {finalHotelList.map((hotelName, index) => (
                                                                                        <li key={index} className="mb-2">
                                                                                            <span
                                                                                                style={{ fontFamily: "Montserrat", fontWeight: 600 }}
                                                                                                className="
                                        text-[clamp(10px,3vw,12px)]
                                        md:text-[clamp(18px,2vw,26px)]
                                        text-[#275d69]
                                    "
                                                                                            >
                                                                                                {hotelName}
                                                                                            </span>
                                                                                        </li>
                                                                                    ))}

                                                                                </ul>
                                                                            ) : (
                                                                                <p className="text-gray-500">No hotels found</p>
                                                                            )}

                                                                        </div>
                                                                    );

                                                                })() : (
                                                                    <div className="p-3 border rounded bg-gray-50 text-center">
                                                                        <p className="text-sm text-gray-700">No hotels available for this category.</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="min-h-[380px] block">
                                                    <img
                                                        src="/selava.pdf/Untitled design (1).svg"
                                                        alt="Rajasthan Touring"
                                                        className="w-[400px] absolute bottom-0 right-0 h-auto block object-cover"
                                                    />
                                                </div>
                                            </section>

                                            {/* Detailed List for Second Category */}
                                            <section className=" mb-8 overflow-hidden">
                                                <div className="bg-white  border-gray-200 rounded overflow-hidden">
                                                    <div className="md:p-4">
                                                        <div className=" rounded bg-gray-50 p-4">
                                                            {(() => {
                                                                // 🔥 Get all possible day IDs from booking
                                                                const allDayIds = booking?.itineraryData?.days?.map(d => d.id) || [];

                                                                return allDayIds.sort((a, b) => parseInt(a) - parseInt(b)).map((dayId) => {
                                                                    // Find correct category key (case-insensitive)
                                                                    const matchedCategory = Object.keys(booking?.hotelSelectionDays || {}).find(
                                                                        k => k.toLowerCase().trim() === secondCategory.toLowerCase().trim()
                                                                    );

                                                                    // Check if this day is disabled
                                                                    const isDisabled = booking?.hotelSelectionDays?.[matchedCategory]?.[dayId] === true;
                                                                    const itineraryDay = booking?.itineraryData?.days?.find(d => Number(d.id) === Number(dayId));
                                                                    const locations = itineraryDay?.locations?.filter(loc => loc.toLowerCase() !== "departure") || [];

                                                                    // If disabled, show warning
                                                                    if (isDisabled) {
                                                                        return <NoHotelWarning key={dayId} dayId={dayId} category={secondCategory} locations={locations} />;
                                                                    }

                                                                    // Check if day has hotels
                                                                    const day = secondCategoryData[dayId];
                                                                    if (!day) return null;

                                                                    const hasValidMeals = Object.keys(day).some((location) => {
                                                                        const meals = day[location];
                                                                        if (!meals) return false;
                                                                        return Object.keys(meals).some((meal) => {
                                                                            const mealData = meals[meal];
                                                                            const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                            return hotels.length > 0;
                                                                        });
                                                                    });
                                                                    const safeDayId = Number(dayId) || 0;
                                                                    const label = String(safeDayId).padStart(2, "0");

                                                                    if (!hasValidMeals) return null;

                                                                    return (
                                                                        <div key={dayId} className="mb-6">
                                                                            <div className="mb-3 pb-2 border-b border-gray-200">
                                                                                <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className=" text-md text-gray-800">
                                                                                    Night -{label}
                                                                                </h4>
                                                                            </div>
                                                                            {Object.keys(day).map((location) => {
                                                                                const meals = day[location];
                                                                                if (!meals) return null;
                                                                                const hasValidMeals = Object.keys(meals).some((meal) => {
                                                                                    const mealData = meals[meal];
                                                                                    const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                                    return hotels.length > 0;
                                                                                });
                                                                                if (!hasValidMeals) return null;
                                                                                return (
                                                                                    <div key={location} className="mt-4">
                                                                                        <div className="flex items-center gap-2 ">
                                                                                            <div className="flex items-center gap-2 m-3">
                                                                                                <FontAwesomeIcon
                                                                                                    icon={faLocationDot}
                                                                                                    className="text-3xl text-yellow-600"
                                                                                                />
                                                                                                <span style={{ fontFamily: "Montserrat", fontWeight: 800, }} className="font-semibold md:text-3xl sm:text-2xl text-lg text-gray-700">
                                                                                                    {location.toUpperCase()}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="space-y-4">
                                                                                            {Object.keys(meals).map((meal) => {
                                                                                                const mealData = meals[meal];
                                                                                                const hotels = Array.isArray(mealData) ? mealData : (Array.isArray(mealData?.options) ? mealData.options : []);
                                                                                                if (!hotels.length) return null;
                                                                                                return (
                                                                                                    <div key={meal} className="overflow-hidden">
                                                                                                        <div className="flex items-center justify-start mb-2">
                                                                                                            <span
                                                                                                                style={{ fontFamily: "Montserrat", fontWeight: 600 }}
                                                                                                                className="text-xs text-gray-500"
                                                                                                            >
                                                                                                                {meal === "stayOnly"
                                                                                                                    ? "Stay Only"
                                                                                                                    : meal.charAt(0).toUpperCase() + meal.slice(1)}
                                                                                                            </span>
                                                                                                        </div>

                                                                                                        <div className="w-full">
                                                                                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr] sm:gap-6 gap-1 items-center justify-items-center">
                                                                                                                {hotels.map((hotel, index) => (
                                                                                                                    <React.Fragment key={hotel.id}>
                                                                                                                        {/* Hotel Card */}
                                                                                                                        <div className="w-full max-w-md bg-gray-200 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                                                                                            <div className="flex items-start gap-4">
                                                                                                                                <div className="w-32 h-32 flex-shrink-0">
                                                                                                                                    {hotel.image ? (
                                                                                                                                        <img
                                                                                                                                            src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                                                            alt={hotel.name}
                                                                                                                                            className="w-full h-full rounded-2xl object-cover"
                                                                                                                                            onError={(e) => {
                                                                                                                                                e.target.style.display = "none";
                                                                                                                                                e.target.nextElementSibling?.classList.remove("hidden");
                                                                                                                                            }}
                                                                                                                                        />
                                                                                                                                    ) : null}
                                                                                                                                    <div className="hidden w-full h-full bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center">
                                                                                                                                        <span className="text-xs text-gray-500">No Image</span>
                                                                                                                                    </div>
                                                                                                                                </div>

                                                                                                                                <div className="flex-1">
                                                                                                                                    <h4 style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="font-bold sm:text-lg text-gray-900">{hotel.name}</h4>
                                                                                                                                    <div className="flex flex-wrap items-center gap-1 text-sm text-amber-600 mt-1">
                                                                                                                                        <StarRating rating={hotel.rating || 0} />
                                                                                                                                        <span className="text-gray-500">({hotel.reviews || 0} reviews)</span>
                                                                                                                                    </div>
                                                                                                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                                                                                                        {hotel.description || "Relaxed hotel with dining & a bar"}
                                                                                                                                    </p>

                                                                                                                                    {hotel.googleReviewLink && (
                                                                                                                                        <a
                                                                                                                                            href={hotel.googleReviewLink}
                                                                                                                                            target="_blank"
                                                                                                                                            rel="noopener noreferrer"
                                                                                                                                            className="mt-3 inline-block px-4 py-2 text-xs font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 transition"
                                                                                                                                        >
                                                                                                                                            View Photos
                                                                                                                                        </a>
                                                                                                                                    )}
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        </div>

                                                                                                                        {/* OR Separator - Only show between hotels */}
                                                                                                                        {index < hotels.length - 1 && (
                                                                                                                            <div className="hidden md:flex items-center justify-center w-20">
                                                                                                                                <span className="sm:text-2xl text-lg font-bold text-gray-500 select-none">OR</span>
                                                                                                                            </div>
                                                                                                                        )}

                                                                                                                        {/* Mobile mein OR ko cards ke neeche dikhane ke liye */}
                                                                                                                        {index < hotels.length - 1 && (
                                                                                                                            <div className="md:hidden w-full flex justify-center ">
                                                                                                                                <span className="text-sm font-bold text-gray-500 px-6 py- rounded-full">OR</span>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </React.Fragment>
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
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </>
                                    );
                                })()}
                            </>
                        );
                    })()}




                    <section className=" bg-[#FFFFFF]  mb-8 overflow-hidden">
                        <img
                            src="/selava.pdf/0.svg"
                            alt="Rajasthan Touring"
                            className="w-full h-auto block object-cover"
                        />


                        <div className="md:p-8 py-4 px-2 bg">
                            <div className="bg-[#FFFFFF]  rounded-xl  ">

                                {/* INCLUSIONS */}
                                <PolicyAccordion
                                    title="Package Inclusions"
                                    items={policies.inclusions}
                                    section="inclusions"
                                    headerColor="bg-yellow-400"
                                    icon={<CheckCircle2 className="w-6 h-6" />}
                                    iconColor="text-green-700"
                                    openPolicyIndex={openPolicyIndex}
                                    togglePolicy={togglePolicy}
                                    getImage={getImage}
                                />

                                {/* EXCLUSIONS */}
                                <PolicyAccordion
                                    title="Package Exclusions"
                                    items={policies.exclusions}
                                    section="exclusions"
                                    headerColor="bg-yellow-400"
                                    icon={<XCircle className="w-6 h-6" />}
                                    iconColor="text-red-600"
                                    openPolicyIndex={openPolicyIndex}
                                    togglePolicy={togglePolicy}
                                    getImage={getImage}
                                />

                                {/* YELLOW PILL */}
                                {/* YELLOW PILL */}
                                <div className="my-6 text-center text-white">
                                    <h1 className="sm:text-3xl px-8 text-2xl md:text-4xl w-auto rounded-md inline-block sm:px-4 sm:py-2 py-1 mx-auto text-center bg-yellow-500 font-bold  drop-shadow-sm">
                                        Rajasthan Touring
                                    </h1>
                                </div>

                                {/* TERMS & CONDITIONS */}
                                <PolicyAccordion
                                    title="Terms & Conditions"
                                    items={policies.termsAndConditions}
                                    section="termsAndConditions"
                                    headerColor="bg-yellow-400"
                                    icon={<FileText className="w-6 h-6" />}
                                    iconColor="text-blue-600"
                                    openPolicyIndex={openPolicyIndex}
                                    togglePolicy={togglePolicy}
                                    getImage={getImage}
                                />

                                {/* CANCELLATION & REFUND */}
                                <PolicyAccordion
                                    title="Cancellation & Refund Policy"
                                    items={policies.cancellationAndRefundPolicy}
                                    section="cancellationAndRefundPolicy"
                                    headerColor="bg-yellow-400"
                                    icon={<RotateCcw className="w-6 h-6" />}
                                    iconColor="text-purple-600"
                                    openPolicyIndex={openPolicyIndex}
                                    togglePolicy={togglePolicy}
                                    getImage={getImage}
                                />

                                {/* Payment Policy */}
                                <PolicyAccordion
                                    title="Payment Policy"
                                    items={policies.travelRequirements}
                                    section="travelRequirements"
                                    headerColor="bg-yellow-400"
                                    icon={<Wallet className="w- Agri h-6" />}
                                    iconColor="text-indigo-600"
                                    openPolicyIndex={openPolicyIndex}
                                    togglePolicy={togglePolicy}
                                    getImage={getImage}
                                />
                                <div className="sm:p-8 p-2 space-y-12 sm:text-2xl text-xl">
                                    <section style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="mt-14">
                                        <p className=" font-bold ">{tour?.name}</p>
                                        <div className="md:flex md:justify-between gap-8 mt-4">
                                            <div className="md:w-1/2 space-y-4 text-justify">
                                                {tour?.description
                                                    ?.slice(0, Math.ceil(tour.description.length / 2))
                                                    .map((desc, index) => (
                                                        <p key={index}>{desc}</p>
                                                    ))}
                                            </div>
                                            <div className="md:w-1/2 space-y-4 text-justify mt-6 md:mt-0">
                                                {tour?.description
                                                    ?.slice(Math.ceil(tour.description.length / 2))
                                                    .map((desc, index) => (
                                                        <p key={index}>{desc}</p>
                                                    ))}
                                            </div>
                                        </div>
                                    </section>
                                    <section style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="mt-10">
                                        <h3 className=" font-bold mb-4 underline">Achievements</h3>
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
                                </div>
                            </div>
                        </div>


                    </section>




                    <div className="w-full flex justify-center my-6 bg-cover bg-center rounded-xl bg-[#bda557] ">
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


                            {/* Button */}
                            <button
                                onClick={() => window.open('/pdf_compressed.pdf', '_blank')}
                                className="
        mt-6 relative cursor-pointer group flex items-center gap-2
        px-8 py-3 font-semibold text-sm sm:text-base md:text-2xl capitalize
        rounded-full bg-white text-[#3e3b3b] border-2
        hover:bg-yellow-500 hover:text-gray-600
        hover:shadow-[0_6px_18px_rgba(255,193,7,0.6)]
        transition-all duration-300 ease-in-out
        active:scale-95
      "
                            >
                                <span style={{ fontFamily: "Montserrat", fontWeight: 600, }}>Click to View About Our Travel Agency</span>
                            </button>
                        </div>
                    </div>





                    <div className=" text-white">
                        {/* Header image + title */}
                        <div className="relative">
                            <img
                                src="/selava.pdf/15.svg"
                                alt="Rajasthan Palace"
                                className="w-full h-56 md:h-72 object-cover opacity-90"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-wider mb-2">
                                    GO AHEAD WITH THE
                                </h1>
                                <h2 className="text-5xl md:text-7xl font-extrabold text-yellow-400 tracking-wide">
                                    PAYMENTS
                                </h2>
                            </div>
                        </div>

                        <div className=" sm:p-4 md:p-6 space-y-8">
                            {/* Phone + QR section */}
                            <div className=" max-w-7xl mx-auto grid md:grid-cols-2 gap-6 items-center px-0">
                                {/* Phone mockup */}
                                <div className="flex justify-center items-center w-full   p-4">
                                    <div className="relative w-full max-w-md">
                                        {/* Background Image */}
                                        <img
                                            src="/selava.pdf/14.png"
                                            alt="Payment Background"
                                            className="w-full h-auto"
                                        />

                                        {/* Absolute Content Overlay */}
                                        <div className="absolute inset-0 flex justify-center items-start pt-8 sm:pt-10 md:pt-12">
                                            <div className="w-[75%] sm:w-[70%] max-w-sm">
                                                <div className="rounded-2xl p-4 pt-12 sm:p-5 text-center">
                                                    {/* Logo Section */}
                                                    <div className="w-full flex justify-center py-3 mb-3">
                                                        {structureData?.logo ? (
                                                            <img
                                                                src={getImageUrl(structureData.logo)}
                                                                alt="Company Logo"
                                                                className="h-16 sm:h-20 md:h-24 object-contain"
                                                            />
                                                        ) : (
                                                            <div className="h-16 sm:h-20 md:h-24 w-40 sm:w-48 bg-gray-700 rounded flex items-center justify-center text-sm text-white">
                                                                Logo
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Scan Text */}
                                                    <p className="text-sm sm:text-base md:text-lg text-gray-700 font-medium mb-4">
                                                        Scan & Pay using Payment App
                                                    </p>

                                                    {/* QR Code */}
                                                    <div className="flex justify-center mb-5">
                                                        <div className="border-2 border-dashed border-gray-400 rounded-xl w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center overflow-hidden bg-white">
                                                            {mainQr?.qrImageUrl ? (
                                                                <img
                                                                    src={getImageUrl(mainQr.qrImageUrl)}
                                                                    alt="UPI QR"
                                                                    className="w-full h-full object-contain p-2"
                                                                />
                                                            ) : (
                                                                <div className="text-gray-400 text-sm">No QR Code</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* UPI Apps Icons */}
                                                    <div className="flex justify-center gap-3 sm:gap-4 mb-4 flex-wrap">
                                                        {[
                                                            { name: "UPI", img: "/payment/Untitled design (10).svg" },
                                                            { name: "PhonePe", img: "/payment/Untitled design (11).svg" },
                                                            { name: "Paytm", img: "/payment/Untitled design (12).svg" },
                                                            { name: "Amazon Pay", img: "/payment/Untitled design (13).svg" },
                                                            { name: "BharatPe", img: "/payment/Untitled design (14).svg" },
                                                        ].map((app) => (
                                                            <div
                                                                key={app.name}
                                                                className="rounded flex items-center justify-center"
                                                            >
                                                                <img
                                                                    src={app.img}
                                                                    alt={app.name}
                                                                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Copyright */}
                                                    <p style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="text-xs sm:text-sm text-gray-600">
                                                        © {new Date().getFullYear()}, All rights reserved. PhonePe Ltd
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Right side – Bank + UPI */}
                                <div className="space-y-6 relative overflow-hidden px-0">

                                    {/* ✅ Background Image */}
                                    <img
                                        src="/selava.pdf/16.svg"
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
                                    />

                                    {/* ✅ Rajasthan Logo */}
                                    <div className="flex relative z-10 justify-center md:justify-start">
                                        {structureData?.logo ? (
                                            <img
                                                src="/payment/fccaf19902ac5accf0f09d2e0c0714ec24afe245.png"
                                                alt="Company Logo"
                                                className="h-46 w-46 object-contain drop-shadow-md"
                                            />
                                        ) : (
                                            <div className="h-16 w-40 bg-gray-700 rounded flex items-center justify-center text-xs text-white">
                                                Logo
                                            </div>
                                        )}
                                    </div>

                                    {/* ✅ BANK TRANSFER SECTION */}
                                    <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="relative z-10 text-gray-900 text-2xl rounded-lg p-4 ">
                                        <h4 className="font-bold bg-yellow-500 inline-block rounded-2xl px-5 mb-3 text-center shadow-md">
                                            BANK TRANSFER
                                        </h4>
                                        {mainBank ? (
                                            <div className="space-y-2 text-sm sm:text-2xl">
                                                <p><span className="font-semibold">Bank Name:</span> {mainBank.bankName}</p>
                                                <p><span className="font-semibold">Account No.:</span> {mainBank.accountNumber}</p>
                                                <p><span className="font-semibold">Account Name:</span> {mainBank.accountName}</p>
                                                <p><span className="font-semibold">IFSC Code:</span> {mainBank.ifscCode}</p>
                                            </div>
                                        ) : (
                                            <p className="text-center text-xs">No bank details</p>
                                        )}
                                    </div>

                                    {/* ✅ UPI PAYMENT SECTION */}
                                    <div style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="relative z-10 text-gray-900 rounded-lg p-4">
                                        <h4 className="font-bold bg-yellow-500 inline-block rounded-2xl px-4 text-2xl mb-3 text-center shadow-md">
                                            UPI - PAYMENT
                                        </h4>
                                        {mainUpi ? (
                                            <div className="space-y-2 text-sm sm:text-2xl">
                                                <p><span className="font-semibold">Name:</span> {mainUpi.receiverName || "N/A"}</p>
                                                <p><span className="font-semibold">Email:</span> {mainUpi.value || "N/A"}</p>
                                                <p><span className="font-semibold">UPI ID:</span> {mainUpi.value || "N/A"}</p>
                                                <p><span className="font-semibold">Mo. :-</span> {mainUpi.mobileNumber || "N/A"}</p>
                                            </div>
                                        ) : (
                                            <p className="text-center text-xs">No UPI details</p>
                                        )}

                                        <button onClick={() => navigate(`/userpayment/${booking?._id}?tab=Optional`)} className=" inline-block mt-6 min-w-[300px] px-4 bg-yellow-600 z-20 text-white py-3 rounded-md cursor-pointer">
                                            Book Now
                                        </button>
                                    </div>
                                </div>


                            </div>

                            {/* Footer */}
                            <footer
                                style={{ fontFamily: "Montserrat", fontWeight: 600, }} className="relative flex items-end w-full bg-[url('/selava.pdf/12.svg')] bg-no-repeat bg-bottom min-h-[250px] bg-cover text-yellow-400 pt-12"
                            >
                                <div
                                    className="relative w-full flex flex-row justify-between items-center md:items-end
    text-center md:text-left gap-6 sm:py-8 sm:px-6 px-2 py-4 max-w-6xl mx-auto"
                                >

                                    {/* 🌐 Left Section — Website */}
                                    <div className="w-full  md:w-1/3 whitespace-break-spaces sm:flex hidden justify-start">
                                        <a
                                            href={structureData?.socialLinks?.website || 'https://welcomerajasthantours.com'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-yellow-400 hover:text-yellow-300 sm:max-w-[150px] text-center"
                                        >
                                            {structureData?.socialLinks?.website || 'welcomerajasthantours.com'}
                                        </a>

                                    </div>

                                    {/* 👤 Right Section — Name (top), Phone + Email (below) */}
                                    <div className="w-full md:w-2/3 flex flex-col items-center  md:flex-col md:justify-end md:items-end md:text-right gap-2 md:gap-4">

                                        {/* 1️⃣ Line 1 - Name */}
                                        {booking?.contact?.name && (
                                            <div className="font-bold text-lg">{booking.contact.name}</div>
                                        )}

                                        {/* 2️⃣ Line 2 - Phones + Emails */}
                                        <div className="flex flex-wrap justify-center flex-col md:justify-end items-center md:items-end gap-3 text-sm">
                                            {/* Phones */}
                                            {Array.isArray(booking?.contact?.mobiles) &&
                                                booking?.contact?.mobiles.length > 0 &&
                                                booking.contact.mobiles.slice(0, 2).map((num, index) => (
                                                    <a
                                                        key={index}
                                                        href={`tel:${num}`}
                                                        className="underline text-yellow-400 hover:text-yellow-300"
                                                    >
                                                        {num}
                                                    </a>
                                                ))}

                                            {/* Emails */}
                                            {booking?.contact?.emails?.length > 0 &&
                                                booking.contact.emails.map((email, index) => (
                                                    <a
                                                        key={index}
                                                        href={`mailto:${email}`}
                                                        className="underline  text-yellow-400 hover:text-yellow-300"
                                                    >
                                                        {email}
                                                    </a>
                                                ))}
                                        </div>
                                        <div className="w-full  md:w-1/3 whitespace-break-spaces flex sm:hidden justify-center">
                                            <a
                                                href={structureData?.socialLinks?.website || 'https://welcomerajasthantours.com'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline text-yellow-400 hover:text-yellow-300 break-all sm:max-w-[150px] text-center"
                                            >
                                                {structureData?.socialLinks?.website || 'welcomerajasthantours.com'}
                                            </a>

                                        </div>

                                    </div>
                                </div>
                            </footer>



                        </div>
                    </div>





                </div>
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
    )
}