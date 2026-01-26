"use client"
import axios from "axios"
import React, { useRef } from "react"
import { CheckCircle2, FileText, MapPin, Plane, Pointer, RotateCcw, Wallet, XCircle } from "lucide-react"
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
import { faEnvelope, faGlobe, faMapMarkerAlt, faPhoneAlt, faPrint } from "@fortawesome/free-solid-svg-icons"
import { Helmet } from "react-helmet-async"
import Cookies from "js-cookie"
import { FaComment, FaHeart, FaShare, FaShareAlt } from "react-icons/fa"
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { toast } from "react-toastify"
// Define the base URL for your backend server
const BASE_URL = "https://apitour.rajasthantouring.in" // Replace with your production server URL
export default function ViewDataadmin({ id: propId, autoDownload, onDownloadComplete }) {
    const id = useParams().id || propId
    const navigate = useNavigate()
    const [booking, setBooking] = useState(null)
    const [bookingData, setBookingData] = useState(null)
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
    const [structureData, setStructureData] = useState(null)
    const [emailLoading, setEmailLoading] = useState(false)
    const [approveLoading, setApproveLoading] = useState(false);
    const [tour, setTour] = useState(null)
    const [isChecked, setIsChecked] = useState(false);

    const [openPolicyIndex, setOpenPolicyIndex] = useState({}); // { inclusion: 0, exclusion: 2, ... }
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
        const fetchData = async () => {
            try {
                // Fetch booking data
                const bookingResponse = await axios.get(`https://apitour.rajasthantouring.in/api/bookings/${id}`)
                const bookingxx = await axios.get(`https://apitour.rajasthantouring.in/api/ssr-data/${id}`);
                setBooking(bookingResponse.data)
                setBookingData(bookingResponse.data)
                // Determine selected category from pricing
                const pricing = bookingResponse.data.itineraryData?.pricing || {}
                const selectedCat = Object.keys(pricing).find(key => getNumericValue(pricing, key) > 0) || 'luxury'
                setSelectedCategory(selectedCat)
                if (bookingResponse.data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/${bookingResponse.data.theme.link}/${id}`);
                } else {
                    // Fallback to current location if no theme.link
                    setItineraryUrl(window.location.href);
                }
                setPolicies({
                    inclusions: bookingResponse.data.inclusions || [],
                    exclusions: bookingResponse.data.exclusions || [],
                    termsAndConditions: bookingResponse.data.termsAndConditions || [],
                    cancellationAndRefundPolicy: bookingResponse.data.cancellationAndRefundPolicy || [],
                    travelRequirements: bookingResponse.data.travelRequirements || [],
                });
                // Fetch tour inclusion/exclusion data
                const token = Cookies.get("token") || Cookies.get("admin_token")
            } catch (err) {
                setError("Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        if (id) {
            fetchData()
        }
    }, [id])
    console.log(booking)
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
    // Single category logic
    const selectedCategoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
    // Find a representative image for the single category card
    let representativeImage = null
    const allHotels = booking?.itineraryData?.hotels || {}
    for (const day in allHotels) {
        for (const location in allHotels[day]) {
            const meals = allHotels[day][location]
            for (const meal in meals) {
                if (meals[meal]?.image) {
                    representativeImage = meals[meal].image
                    break
                }
            }
            if (representativeImage) break
        }
        if (representativeImage) break
    }
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
    const [itineraryUrl, setItineraryUrl] = useState('');


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
                handlePrint()
            }, 300) // delay ensures DOM renders
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




    const clientName = booking?.clientDetails?.name || "Traveler"
    const itineraryTitle = booking?.itineraryData?.titles?.[0] || "Booking Preview"
    const title = `${clientName} - ${itineraryTitle} | Booking Preview`
    const description = `Booking details for ${clientName} - ${itineraryTitle}`
    const ogDescription = `Check the booking details for ${clientName} with itinerary: ${itineraryTitle}`
    const pricing = bookingData?.itineraryData?.pricing || {}
    const offers = bookingData?.itineraryData?.offers || {}
    const festivalOffer = bookingData?.itineraryData?.festivalOffer || null // Access festivalOffer



    const totalPax =
        Number(bookingData?.clientDetails?.adults || 0) +
        Number(bookingData?.clientDetails?.kids5to12 || 0) +
        Number(bookingData?.clientDetails?.kidsBelow5 || 0);


    const actualAmount = selectedCategory ? pricing[selectedCategory] : 0
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0



    const handleSendWhatsApp = () => {
        if (!bookingData?.clientDetails) return

        const link = bookingData.theme?.link
        const bookingLink = `https://tour.rajasthantouring.in/${link}/${bookingData._id}`
        const maxOfferEntry = Object.entries(offers).reduce(
            (max, [key, value]) => (value > max[1] ? [key, value] : max),
            ["none", 0],
        )

        const message = `
    Hello ${bookingData.clientDetails.name}!
    
    This is from ${softwareData.companyName}!
    
    Here's your: ${bookingData.itineraryData?.titles?.[0] || "N/A"}
    Duration: ${calculateDuration(bookingData.itineraryData)}
    Package Cost: ₹${bookingData.totalAmount || 0}/-
    Offer Amount: ₹${maxOfferEntry[1] > 0 ? maxOfferEntry[1] : 0}/-
    ${festivalOffer && festivalOffer.selected ? `Festival Offer: ${festivalOffer.name} (${festivalOffer.value}%)` : ""}
    Booking Amount: ₹${bookingData.bookingAmount || 0}/-
    Please review your itinerary and let us know if you'd like any changes before we finalize the booking.
    
    View Itinerary: ${bookingLink}
    
    We're excited to make your trip truly memorable!
    — Team ${softwareData.companyName}
    `

        const phone = bookingData.clientDetails.phone?.replace(/[^0-9]/g, "")
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")
    }

    const handleSendEmail = async () => {
        if (!bookingData?.clientDetails) return

        setEmailLoading(true)

        const origin = window.location.origin
        const bookingLink = `https://tour.rajasthantouring.in/${bookingData.theme.link}/${bookingData._id}`

        const subject = `Your - ${bookingData.itineraryData?.titles?.[0] || "Travel Package"} from ${softwareData?.companyName} – Review & Confirm Your Plan`
        const mobileNumber = bookingData.contact?.mobiles?.[0] || ""
        const mobileLink = mobileNumber ? `<a href="tel:${mobileNumber}">${mobileNumber}</a>` : "N/A"

        const body = `Dear ${bookingData.clientDetails.name || "Customer"},

    
    Here's Your Personalized Tour Plan
    You can view your booking here: ${bookingLink}
    
    Best regards,
    Travel Team`

        const html = `
          <p>Dear ${bookingData.clientDetails.name || "Customer"},</p>

    <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
          <p>Here's Your Personalized Tour Plan</p>
          <p><b>Booking Details:</b></p>
          <ul>
            <li><b>Package:</b> ${bookingData.itineraryData?.titles?.[0] || "N/A"}</li>
            <li><b>Duration:</b> ${calculateDuration(bookingData.itineraryData)}</li>
            <li><b>Total Amount:</b> ₹${bookingData.totalAmount || 0}/-</li>
            ${festivalOffer && festivalOffer.selected ? `<li><b>Festival Offer:</b> ${festivalOffer.name} (${festivalOffer.value}%)</li>` : ""}
            <li><b>Booking Amount:</b> ₹${bookingData.bookingAmount || 0}/-</li>
            <li><b>Booking Date:</b> ${new Date(bookingData.createdAt).toLocaleDateString()}</li>
          </ul>
          <p>You can view your booking details here: 
            <a href="${bookingLink}" target="_blank">View Full Itinerary</a>
          </p>
          <p>Kindly review the attached itinerary and let us know if you'd like to make any changes or customizations.</p>
          <p>Once confirmed, we'll proceed with your booking and payment details.</p>
    
          <p>We look forward to making your journey memorable!</p>
    
          <p><b>Best regards,</b></p>
          <p><b>${bookingData.contact.name}</b><br/>${softwareData?.companyName}</p>
          <p style="margin:0;">
            ${mobileLink} |
            <a href="${bookingData.contact?.socialLinks?.website}" target="_blank" style="color:#FF4500; text-decoration:none;">
              ${bookingData.contact?.socialLinks?.website}
            </a>
          </p>
        `

        try {
            const res = await axios.post(`${BASE_URL}/api/emails/send-email`, {
                to: bookingData.clientDetails.email,
                bcc: booking.clientDetails.email2 || undefined,
                subject,
                body,
                html,
            })

            if (res.data.success) {
                alert("Email sent successfully!")
            }
        } catch (error) {
            console.error("Error sending email:", error)
            alert("Failed to send email.")
        } finally {
            setEmailLoading(false)
        }
    }


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
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading...</p>
                </div>
            </div>
        )
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
    // Single category data
    const categoryData = booking?.itineraryData?.hotels || {}
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
            <div style={{ fontFamily: "poppins" }} className="sm:text-2xl text-xl">
                {/* HEADER */}
                <div className="flex items-center mb-4">
                    <div className={`bg-[#FFBC00] flex items-center justify-between gap-3 px-5 py-1 rounded-md`}>
                        <h4 className="font-bold text-gray-800">{title} :</h4>
                        <span className={`font-bold ${iconColor}`}>{icon}</span>
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
                                            <span className="flex items-center gap-2">
                                                <span className="text-[#3e3b3b]">•</span> {item.title}
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
                                    <div className="  flex items-center gap-x-2 font-bold">
                                        <span className="text-[#3e3b3b]">•</span>
                                        <span className="text-[#3e3b3b]">{item.title}</span>
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

    const StarRating = ({ rating }) => {
        return (
            <div className="flex items-center gap-1 mt-1">
                {/* Rating Number */}
                <span className="text-sm font-bold text-amber-600">{rating}</span>
                {/* Stars */}
                <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const position = rating - i;
                        const fill = Math.min(Math.max(position * 100, 0), 100); // 0–100%
                        return (
                            <div key={i} className="relative w-4 h-4">
                                {/* Empty Star */}
                                <svg
                                    className="absolute top-0 left-0 text-gray-300"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.788 1.48 8.28L12 18.896l-7.416 4.478 1.48-8.28L0 9.306l8.332-1.151z" />
                                </svg>
                                {/* Filled Star (percentage mask) */}
                                <div
                                    className="absolute top-0 left-0 overflow-hidden text-orange-500"
                                    style={{ width: `${fill}%` }}
                                >
                                    <svg
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
        <div style={{ fontFamily: "poppins" }} className="min-h-screen flex flex-col bg-gray-50">
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
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap');
@media print {
  .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-area {
    page-break-before: always;
  }
  body {
     font-family: "poppins" !important;
    background: white !important;
  }
  .devanagari-text {
     font-family: "poppins" !important;
  }
  /* Remove blur from print and improve text rendering */
  .prose, .prose-lg {
    filter: none !important;
    text-shadow: none !important;
  }
  ul li, ol li {
    filter: none !important;
    text-shadow: none !important;
  }
  body, p, span, li, h1, h2, h3, h4, h5, h6 {
    filter: none !important;
    text-shadow: none !important;
  }
}`}
            </style>
            <div ref={componentRef} className="w-full max-w-7xl no-break print-area mx-auto ">


                <div className="flex bg-[#EEEADD] mb-0 flex-wrap gap-3 sm:gap-4 p-3 w-full">



                    {!booking?.approvel && (
                        <button
                            onClick={handleApprove}
                            disabled={approveLoading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full 
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

                    {/* Print */}
                    <button
                        onClick={handlePrint}
                        disabled={pdfLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 bg-yellow-600 
      text-white rounded-full text-sm font-semibold shadow-md
      hover:bg-yellow-700 transition-colors
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
                    {/* Background Image */}
                    <img
                        src="/selava.pdf/1.svg"
                        alt="Rajasthan Touring"
                        className="w-full h-auto block object-cover md:object-contain"
                    />
                    {/* Contact Info - Responsive */}
                    {booking?.contact && (
                        <div className="absolute inset-0 flex items-start top-[-4%] sm:top-0 justify-end py-4 w-full md:py-6 pointer-events-none">
                            <div className="rounded-lg  py-4 md:py-6 px-2 md:px-4 md:mt-6  w-full  pointer-events-auto">
                                <div className="flex items-center w-[100%] justify-end gap-2 md:gap-3">

                                    <span style={{ fontFamily: "sans-serif" }} className="mr-4 text-gray-800  min-w-[100%  font-extrabold text-lg sm:text-2xl md:text-3xl ">(A Unit of Karni Kripa Holidays)</span>
                                </div>

                                <div className=" flex justify-end m-0  relative font-bold flex-col  mt-4  md:space-y-4 text-gray-800 text-xs md:text-sm lg:text-base">



                                    {Array.isArray(booking?.contact?.addresses) && booking.contact.addresses.length > 0 && (
                                        <div className="flex items-start m-0 justify-end gap-x-2 md:gap-x-3">
                                            <p className="leading-tight max-w-[50%] text-sm sm:text-xl md:text-2xl  md:max-w-[75%] text-right">
                                                {booking.contact.addresses.map((addr, index) => (
                                                    <span key={index}>
                                                        {addr.street && <>{addr.street},<br /></>}
                                                        {addr.city && <>{addr.city}, </>}
                                                        {addr.state && <>{addr.state} </>}
                                                        {addr.pincode && <>{addr.pincode}<br /></>}
                                                        {addr.country && <>{addr.country}</>}
                                                    </span>
                                                ))}
                                            </p>
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-base md:text-lg mt-0.5 flex-shrink-0" />
                                        </div>
                                    )}
                                    {/* ✅ Phone */}
                                    {Array.isArray(booking?.contact?.mobiles) && booking.contact.mobiles.length > 0 && (
                                        <div className="flex items-center m-0 text-sm sm:text-xl md:text-2xl  justify-end gap-2 md:gap-3">
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
                                        <div className="flex items-center text-sm m-0 sm:text-xl md:text-2xl  justify-end gap-2 md:gap-3">
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
                                        <div className="flex items-center text-sm m-0 sm:text-xl md:text-2xl  justify-end gap-2 md:gap-3">
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

                    <div className="absolute capitalize bottom-[8%] w-[50%] left-1/2 transform -translate-x-1/2 ">
                        {booking.clientDetails.name && (
                            <div className="mx-auto max-w-xl text-center 
            
            ">
                                <h1 className="
    font-bold text-white leading-tight
    text-[clamp(10px,3vw,12px)] 
    md:text-[clamp(20px,2vw,28px)]
">
                                    {booking.clientDetails.name}
                                </h1>

                                <h1
                                    className="flex justify-center flex-wrap
    font-semibold text-gray-800 mt-1 leading-tight
    text-[clamp(10px,3vw,12px)]
    md:text-[clamp(18px,1.8vw,24px)]
">
                                    {booking.selectedItinerary.duration}

                                    (  {[
                                        booking.clientDetails.adults > 0 &&
                                        `${String(booking.clientDetails.adults).padStart(2, "0")} Adults`,
                                        booking.clientDetails.kids5to12 > 0 &&
                                        `${String(booking.clientDetails.kids5to12).padStart(2, "0")} Children`,
                                        booking.clientDetails.kidsBelow5 > 0 &&
                                        `${String(booking.clientDetails.kidsBelow5).padStart(2, "0")} Infants`
                                    ]
                                        .filter(Boolean)
                                        .join(" + ")})


                                </h1>

                            </div>
                        )}
                    </div>

                </section>
                <img src="/selava.pdf/2-cropped.svg" className="w-full h-auto block object-cover md:object-contain" alt="" />
                {booking?.itineraryData?.days?.length > 0 && (
                    <section className="border mb-8 overflow-hidden">


                        <h1 className="text-base px-3 bg-gray-500/30 inline-block rounded-2xl m-2 sm:text-lg md:text-xl font-bold text-black leading-relaxed flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">

                            {/* Travel Date */}
                            {booking?.clientDetails?.travelDate && (
                                <>
                                    {" "}

                                    Travel Date:-
                                    <span className="text-orange-500">
                                        {booking.clientDetails.travelDate}
                                    </span>
                                </>
                            )}

                        </h1>
                        {/* Itinerary Days */}
                        <div className="p-8 relative space-y-10">
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
                                    // ✅ Final display text
                                    const allLocationsz = day.locations?.length
                                        ? day.locations.slice(0, 3).join(", ") + (day.locations.length > 3 ? "..." : "")
                                        : "";

                                    // ✅ Final display text
                                    displayDate = `${formattedDate}${allLocations ? " : " + allLocationsz : ""}`;
                                }
                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-8 last:border-b-0"
                                    >
                                        {/* Left Side - Day Info */}
                                        <div>
                                            <div className="inline-block bg-[#0f2a49] text-white px-4 py-1 rounded-b-md mb-4 text-lg font-bold">
                                                DAY {index + 1}
                                            </div>
                                            {day.descriptions?.length ? (
                                                <div className="space-y-4 text-[#605b5b]   leading-relaxed text-[22px] ql-editor">
                                                    {day.descriptions.map((desc, descIndex) => (
                                                        <div
                                                            style={{ fontFamily: "Montserrat", fontWeight: 800 }} key={descIndex}
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
                                                    {/** RANDOM IMAGE LOGIC */}
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
                                                        className=" bottom-0 left-0 right-0 bg-[#d7a33b] rounded-b-2xl text-center text-white py-3 font-bold text-lg tracking-wide leading-snug"
                                                        dangerouslySetInnerHTML={{ __html: displayDate }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}


                <div className="overflow-hidden">
                    <img src="/selava.pdf/6-cropped.svg" className="w-full h-auto block object-cover md:object-contain" alt="" />
                    {/* <p className="h-22 absolute bg-gradient-to-b from-[#afa489] via-[#f8d687] to-[#D7A022]"></p> */}
                    <section className="py-10 mt-0 bg-gradient-to-r from-[#D7A022] via-[#EBB22D] to-[#D7A022] flex flex-col items-center justify-center text-center ">
                        <div className="flex gap-6 sm:gap-8 w-full max-w-6xl my-12 px-4 justify-center items-center">
                            {/* Single category card */}
                            <div
                                className="
                                relative bg-white p-4 rounded-xl shadow-lg  sm:w-[30%] overflow-hidden transition-all duration-500 ease-in-out transform-gpu
                                rotate-0 hover:rotate-0
                                hover:shadow-2xl hover:scale-105
                              "
                            >
                                {/* Hotel Image */}
                                <div className="aspect-[4/3] overflow-hidden rounded-lg">
                                    <img
                                        src="/selava.pdf/Untitled design (21).svg"
                                        alt={`${selectedCategoryName} hotel`}
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
                                    <h4 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 uppercase tracking-wider">
                                        {selectedCategoryName} Hotels Package
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <p className="mt-6 sm:mt-12 px-4 text-white max-w-[500px] mx-auto text-shadow-black"> We’ve curated an exclusive travel package just for you.
                            Explore the best of {selectedCategoryName} accommodations !</p>
                    </section>
                </div>
                {(() => {
                    if (Object.keys(categoryData).length === 0) return null;
                    // Single category display
                    return (
                        <>
                            {/* ====== SINGLE CATEGORY (Always Show) ====== */}
                            <section className="relative bg-[#FFFFFF] w-full md:pb-60 sm:pb-20 pb-10  overflow-hidden">
                                {/* Background Image */}
                                <div className="relative w-full">
                                    <img
                                        src={`/selava.pdf/7-cropped.svg`}


                                        alt="Rajasthan Touring"
                                        className="w-full h-auto p-0 m-0 block object-cover"
                                    />
                                    <div className="inset-0 absolute bg-black/40"></div>
                                    <div className="bg-white p-0.5 z-[0] h-[80%] absolute bottom-[-40%] right-[5%] w-[40%] rounded-2xl overflow-hidden shadow-lg">
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
                                {/* Overlay */}
                                <div className="absolute z-[1] inset-0 flex flex-col justify-start items-start p-4 md:p-8">
                                    <div className="w-full max-w-4xl space-y-3 md:space-y-6">
                                        <h3 className="font-bold Baloo Balooow text-white leading-tight text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl">
                                            {selectedCategoryName} <br className="block md:hidden" />
                                            <span className="hidden md:inline"> </span>Hotels Package
                                        </h3>
                                        <p className="text-white md:text-left">
                                            <span className="flex flex-wrap items-center justify-start md:justify-start gap-1 md:gap-2 text-sm md:text-base lg:text-lg">
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
                                                {(!booking?.clientDetails?.adults && !booking?.clientDetails?.kids5to12 && !booking?.clientDetails?.kidsBelow5) && (
                                                    <span className="text-gray-400">No guests</span>
                                                )}
                                            </span>
                                        </p>
                                        <div className="flex justify-start md:justify-start">
                                            <div className="rounded-xl p-3 md:p-6 inline-block">
                                                <div className="font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-8xl">
                                                    ₹{(booking?.totalAmount) || 0}/-
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Hotel Names List - Adapted for single category */}
                                <div className="relative z-[1]">
                                    <div className="rounded overflow-hidden">
                                        <div className="flex pt-22  items-center gap-6 p-6">
                                            <div>
                                                {categoryData ? (
                                                    Object.keys(categoryData).map((dayId) => (
                                                        <div key={dayId} className="mb-0">
                                                            {Object.keys(categoryData[dayId])
                                                                .filter((location) => !["selected", "category"].includes(location))
                                                                .map((location) => {
                                                                    const locationHotels = categoryData[dayId][location];
                                                                    return (
                                                                        <div key={location} className="mb-0 w-full   break-words whitespace-normal pr-[48%] md:pr-[40%] lg:pr-[20%] sm:pr-[50%]">
                                                                            {["breakfast", "lunch", "dinner"].map((meal) => {
                                                                                const mealHotel = locationHotels[meal]; // ⭐ DIRECT HOTEL OBJECT

                                                                                if (!mealHotel || !mealHotel.name) return null;

                                                                                return (


                                                                                    <ul key={meal} className="list-disc  font-semibold  break-words whitespace-normal uppercase ml-5">
                                                                                        <li className="mb-2">
                                                                                            <span style={{ fontFamily: "Montserrat", fontWeight: 600 }} className="
                text-[clamp(10px,3vw,12px)]     /* Mobile: 10–12px */
                md:text-[clamp(18px,2vw,26px)]  /* Desktop: 18–26px */
               text-[#275d69]
            "
                                                                                            >   {mealHotel.name}</span>
                                                                                        </li>
                                                                                    </ul>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    ))
                                                ) : (
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
                            <section className="border mb-8 overflow-hidden">
                                <div className="bg-[#FFFFFF] border border-gray-200 rounded overflow-hidden">
                                    <div className="p-4">
                                        <div className="rounded bg-gray-50 md:p-4">
                                            <div className="mb-3 pb-2 border-b border-gray-200">
                                                <h3 className="font-bold text-lg text-gray-800 capitalize">
                                                    {selectedCategoryName} Package
                                                </h3>
                                            </div>
                                            {(() => {
                                                // Get sorted day keys (numeric only)
                                                const dayKeys = Object.keys(categoryData)
                                                    .filter(key => !isNaN(parseInt(key)))
                                                    .sort((a, b) => parseInt(a) - parseInt(b));

                                                return dayKeys.map((dayId) => {
                                                    const day = categoryData[dayId];
                                                    if (!day) return null;

                                                    return (
                                                        <div key={dayId} className="mb-6">
                                                            <div className="mb-3 pb-2 border-b border-gray-200">
                                                                <h4 className="font-bold text-md text-gray-800">
                                                                    Day {dayId}
                                                                </h4>
                                                            </div>
                                                            <div className="space-y-6">
                                                                {Object.keys(day).map((location) => {
                                                                    const meals = day[location];
                                                                    if (!meals) return null;

                                                                    return (
                                                                        <div key={location}>
                                                                            <div className="flex items-center gap-2 m-3">
                                                                                <MapPin className="w-4 h-4 text-amber-600" />
                                                                                <span className="font-semibold text-sm text-gray-700">
                                                                                    {location.toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-4">
                                                                                {["breakfast", "lunch", "dinner"].map((meal) => {
                                                                                    const mealData = meals[meal];
                                                                                    if (!mealData) return null;

                                                                                    let hotels = [];
                                                                                    // 🌟 Handle direct hotel object
                                                                                    if (!mealData.options && mealData.id) {
                                                                                        hotels = [mealData];
                                                                                    }
                                                                                    // 🌟 Handle options array
                                                                                    else if (Array.isArray(mealData.options)) {
                                                                                        hotels = mealData.options.filter(hotel => hotel);
                                                                                    }

                                                                                    if (!hotels.length) return null;

                                                                                    return (
                                                                                        <div key={meal} className="overflow-hidden">
                                                                                            <div className="flex items-center justify-start mb-2">
                                                                                                <span className="text-xs text-gray-500 capitalize">{meal}</span>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-4 justify-start">
                                                                                                {hotels.map((hotel, index) => (
                                                                                                    <React.Fragment key={hotel.id}>
                                                                                                        <div className="bg-gray-200 border border-gray-200 rounded-xl p-2 shadow-sm hover:shadow-md transition-shadow inline-block min-w-[340px] sm:min-w-auto max-w-[450px]">
                                                                                                            <div className="flex items-center gap-4">
                                                                                                                <div className="w-32 flex-shrink-0">
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
                                                                                                                    <div className="hidden w-full h-full bg-gray-200 border-2 border-dashed rounded-l-xl flex items-center justify-center">
                                                                                                                        <span className="text-xs text-gray-500">No Image</span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                                <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
                                                                                                                    <div>
                                                                                                                        <h4 className="font-bold text-base text-gray-900">{hotel.name}</h4>
                                                                                                                        <div className="flex flex-wrap items-center gap-1 text-xs text-amber-600 mt-1">
                                                                                                                            <StarRating rating={hotel.rating || 0} />
                                                                                                                            <span className="text-gray-500">({hotel.reviews || 0} reviews)</span>
                                                                                                                        </div>
                                                                                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                                                                            {hotel.description || "Relaxed hotel with dining & a bar"}
                                                                                                                        </p>
                                                                                                                    </div>
                                                                                                                    {hotel.googleReviewLink ? (
                                                                                                                        <a
                                                                                                                            href={hotel.googleReviewLink}
                                                                                                                            target="_blank"
                                                                                                                            rel="noopener noreferrer"
                                                                                                                            className="text-xs px-3 py-1 underline rounded-2xl text-white bg-gray-400 transition self-start mt-1 inline-block"
                                                                                                                        >
                                                                                                                            View Photos
                                                                                                                        </a>
                                                                                                                    ) : null}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {index < hotels.length - 1 && (
                                                                                                            <div className="flex items-center justify-center min-w-[50px] flex-shrink-0">
                                                                                                                <span className="text-sm font-medium text-gray-500">OR</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </React.Fragment>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }).concat([ // Adding a static extra day after existing days
                                                    <div key="extra-day" className="mb-6">
                                                        <div className="mb-3 pb-2 border-b border-gray-200">
                                                            <h4 className="font-bold text-md text-gray-800">
                                                                Day {dayKeys.length + 1}
                                                            </h4>
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="flex items-center gap-2 m-3">
                                                                <MapPin className="w-4 h-4 text-amber-600" />
                                                                <span className="font-semibold text-sm text-gray-700">
                                                                    Departure {/* You can replace this with dynamic location if needed */}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {/* Hardcoded breakfast meal without hotels */}
                                                                <div className="overflow-hidden">
                                                                    <div className="flex items-center justify-start mb-2">
                                                                        <span className="text-xs text-gray-500 capitalize">breakfast</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-4 w-full justify-between">
                                                                        {/* No hotels shown, just a placeholder message */}
                                                                        <div className="w-full text-center py-4 text-gray-500 italic">
                                                                            Breakfast included
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* You can add more meals here if needed, e.g., lunch or dinner without hotels */}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ]);
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    );
                })()}
                <section className="border  mb-8 overflow-hidden">
                    <img
                        src="/selava.pdf/0.svg"
                        alt="Rajasthan Touring"
                        className="w-full h-auto block object-cover"
                    />
                    <div className="md:p-8 py-4 px-2">
                        <div className="bg-white  rounded-xl ">
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
                            {/* YELLOW PILL */}
                            <div className="my-6 text-center text-white">
                                <h1 className="sm:text-3xl text-2xl md:text-4xl w-auto rounded-2xl inline-block px-4 py-2 mx-auto text-center bg-yellow-500 font-bold  drop-shadow-sm">
                                    Welcome Rajasthan Tours
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
                                icon={<Wallet className="w-6 h-6" />}
                                iconColor="text-indigo-600"
                                openPolicyIndex={openPolicyIndex}
                                togglePolicy={togglePolicy}
                                getImage={getImage}
                            />

                            <div className="sm:p-8 p-2 space-y-12 sm:text-2xl text-xl">
                                <section className="mt-14">
                                    <p className="font-serif font-bold ">{tour?.name}</p>
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
                                <section className="mt-10">
                                    <h3 className="font-serif font-bold mb-4 underline">Achievements</h3>
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
                            <span>Click to View About Our Travel Agency</span>
                        </button>
                    </div>
                </div>



                <div className="min-h-screen text-white">
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
                    <div className="  ">
                        {/* Phone + QR section */}
                        <div className=" max-w-7xl mx-auto grid md:grid-cols-2 gap-6 items-center px-0">
                            {/* Phone mockup */}
                            <div className="flex justify-center items-center w-full min-h-screen  p-4">
                                <div className="relative w-full max-w-md">
                                    {/* Background Image */}
                                    <img
                                        src="/selava.pdf/14.png"
                                        alt="Payment Background"
                                        className="w-full h-auto"
                                    />

                                    {/* Absolute Content Overlay */}
                                    <div className="absolute inset-0 flex justify-center items-start pt-8 sm:pt-10 md:pt-12">
                                        <div className="w-[75%] sm:w-[70%] pt-12 max-w-sm">
                                            <div className="rounded-2xl p-4 sm:p-5 text-center">
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
                                                <p className="text-xs sm:text-sm text-gray-600">
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
                                <div className="relative z-10 text-gray-900 text-2xl rounded-lg p-4 ">
                                    <h4 className="font-bold bg-yellow-500 inline-block rounded-2xl px-5 mb-3 text-center shadow-md">
                                        BANK TRANSFER
                                    </h4>
                                    {mainBank ? (
                                        <div className="space-y-2 text-2xl">
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
                                <div className="relative z-10 text-gray-900 rounded-lg p-4">
                                    <h4 className="font-bold bg-yellow-500 inline-block rounded-2xl px-4 text-2xl mb-3 text-center shadow-md">
                                        UPI - PAYMENT
                                    </h4>
                                    {mainUpi ? (
                                        <div className="space-y-2 text-2xl">
                                            <p><span className="font-semibold">Name:</span> {mainUpi.receiverName || "N/A"}</p>
                                            <p><span className="font-semibold">Email:</span> {mainUpi.value || "N/A"}</p>
                                            <p><span className="font-semibold">UPI ID:</span> {mainUpi.value || "N/A"}</p>
                                            <p><span className="font-semibold">Mo. Number:</span> {mainUpi.mobileNumber || "N/A"}</p>
                                        </div>
                                    ) : (
                                        <p className="text-center text-xs">No UPI details</p>
                                    )}
                                </div>
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
                                className="inline-flex items-center text-2xl justify-center gap-2 px-4 py-2 bg-green-600 
                   text-white rounded-lg hover:bg-green-700 transition-colors font-medium   mb-6
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
                                        <span>Approve</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Footer */}
                        <footer
                            className="relative flex items-end w-full bg-[url('/selava.pdf/12.svg')] bg-no-repeat bg-bottom min-h-[250px] bg-cover text-yellow-400 pt-12"
                        >
                            <div
                                className="relative w-full flex flex-row justify-between items-center md:items-end 
    text-center md:text-left gap-6 sm:py-8 sm:px-6 px-2 py-4 max-w-6xl mx-auto"
                            >

                                {/* 🌐 Left Section — Website */}
                                <div className="w-full md:w-1/3 flex justify-start">
                                    <a
                                        href={structureData?.socialLinks?.website || 'https://welcomerajasthantours.com'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline text-lg hover:text-yellow-300 transition"
                                    >
                                        {structureData?.socialLinks?.website || 'welcomerajasthantours.com'}
                                    </a>
                                </div>




                                {/* 👤 Right Section — Name (top), Phone + Email (below) */}
                                <div className="w-full md:w-2/3 flex flex-col md:flex-col md:justify-end md:items-end md:text-right gap-2 md:gap-4">

                                    {/* 1️⃣ Line 1 - Name */}
                                    {booking?.contact?.name && (
                                        <div className="font-bold text-lg">{booking.contact.name}</div>
                                    )}

                                    {/* 2️⃣ Line 2 - Phones + Emails */}
                                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 text-sm">
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
                                                    className="underline text-yellow-400 hover:text-yellow-300"
                                                >
                                                    {email}
                                                </a>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
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