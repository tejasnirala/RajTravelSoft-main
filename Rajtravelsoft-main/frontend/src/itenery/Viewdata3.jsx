
"use client";

import axios from "axios";
import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Solid icons
import { faPrint, faStar, faGlobe } from "@fortawesome/free-solid-svg-icons";

// Brand icons
import { faWhatsapp, faFacebookF, faTwitter, faInstagram, faLinkedinIn, faYoutube } from "@fortawesome/free-brands-svg-icons";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { CarFront, CheckCircle2, ChevronDown, Coffee, Info, MapPin, Pointer, Utensils, UtensilsCrossed } from "lucide-react";
import DOMPurify from "dompurify";
import Pdf from "../pending/Pdf";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

const StarRating = ({ rating, reviews }) => {
    const totalStars = 5;
    return (
        <div className="flex items-center flex-wrap gap-1 text-yellow-500">
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <span key={index}>
                        {starValue <= Math.round(rating) ? "★" : "☆"}
                    </span>
                );
            })}
            <span className="text-xs text-gray-600 ml-1">{rating}</span>
            {reviews && (
                <span className="text-xs text-gray-600 ml-1">({reviews} reviews)</span>
            )}
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

const Viewdata3admin = ({ id, autoDownload, onDownloadComplete }) => {
    const [activeTab, setActiveTab] = useState("inclusions");
    const componentRef = useRef(null);
    const params = useParams();
    const bookingId = params.id || id;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [user, setUser] = useState(null);
    const [inclusions, setInclusions] = useState([]);
    const [approveLoading, setApproveLoading] = useState(false);
    const [exclusions, setExclusions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [cancellationPolicy, setCancellationPolicy] = useState([]);
    const [travelRequirements, setTravelRequirements] = useState([]);
    const [loadings, setLoadings] = useState(false);
    const [form, setForm] = useState({ packageTitle: "", name: "", email: "", message: "", mobile: "" });
    const [structureData, setStructureData] = useState(null);
    const [tour, setTour] = useState(null);
    const [softwareData, setSoftwareData] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const emailId = queryParams.get("emailId");
    const [itineraryUrl, setItineraryUrl] = useState('')

    const navigate = useNavigate();
    const BASE_URL = "https://apitour.rajasthantouring.in";
    const [policies, setPolicies] = useState({
        inclusions: [],
        exclusions: [],
        termsAndConditions: [],
        cancellationAndRefundPolicy: [],
        travelRequirements: [],
    });


    const [expandedItems, setExpandedItems] = useState({});

    const toggleAccordion = (key) => {
        setExpandedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");
    const [isChecked, setIsChecked] = useState(false);
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
    }


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

    const calculateDuration = (itinerary) => {
        if (!itinerary?.days?.length) return "0 Days";
        return `${itinerary.days.length} Days`;
    };

    const transformBooking = (data) => {
        const daysLength = data.itineraryData?.days?.length || 0;
        let startDate;
        if (data.clientDetails?.travelDate) {
            const [day, month, year] = data.clientDetails.travelDate.split("-");
            startDate = new Date(`${year}-${month}-${day}`); // convert to JS valid format
        } else {
            startDate = new Date();
        }
        return {
            customerName: data.clientDetails?.name || "Guest",
            price: data.itineraryData?.pricing?.mk || data.bookingAmount || 0,
            nights: daysLength > 0 ? daysLength - 1 : 0,
            days: daysLength,
            vehicle: data.itineraryData?.vehicle
            ,
            itinerary:
                data.itineraryData?.days?.map((day, index) => {
                    let dateStr = "";
                    const dayDate = new Date(startDate);
                    if (!isNaN(dayDate)) {
                        dayDate.setDate(startDate.getDate() + index);

                        const d = String(dayDate.getDate()).padStart(2, "0");
                        const m = String(dayDate.getMonth() + 1).padStart(2, "0");
                        const y = String(dayDate.getFullYear()).slice(-2);

                        dateStr = `${d}-${m}-${y}`; // ✅ always dd-mm-yy format
                    } else {
                        // fallback in same format
                        const fallback = new Date();
                        const d = String(fallback.getDate()).padStart(2, "0");
                        const m = String(fallback.getMonth() + 1).padStart(2, "0");
                        const y = String(fallback.getFullYear()).slice(-2);
                        dateStr = `${d}-${m}-${y}`;
                    }

                    return {
                        day: `Day ${index + 1}`,
                        date: dateStr,
                        title: day.titles?.[0] || "Untitled",
                        img:
                            (day.images && day.images.length > 0
                                ? day.images.map((img) => `${BASE_URL}${img}`)
                                : data.itineraryData?.images && data.itineraryData.images.length > 0
                                    ? data.itineraryData.images.map((img) => `${BASE_URL}${img}`)
                                    : ["https://via.placeholder.com/300x200"]),
                        desc: day.descriptions?.[0] || "No description available",
                    };
                }) || [],

            contact: data.contact,
            approvel: data.approvel
        };
    };

    useEffect(() => {
        if (bookingData?.clientDetails) {
            setForm({
                name: bookingData.clientDetails.name || "",
                email: bookingData.clientDetails.email || "",
                mobile: bookingData.clientDetails.phone || "",
                message: "",
                packageTitle: bookingData?.itineraryData?.titles?.[0] || "",
            });
        }
    }, [bookingData]);

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

    useEffect(() => {
        if (emailId) {
            axios
                .post(`${BASE_URL}/api/emails/mark-seen/${emailId}`)
                .then((res) => console.log("Marked as seen:", res.data))
                .catch((err) => console.error("Error marking seen:", err));
        }
    }, [emailId]);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}`);
                const booking = await axios.get(`${BASE_URL}/api/ssr-data/${bookingId}`);
                if (!response.ok) {
                    throw new Error("Booking not found");
                }
                const data = await response.json();
                const transformed = transformBooking(data);

                setPolicies({
                    inclusions: data.inclusions || [],
                    exclusions: data.exclusions || [],
                    termsAndConditions: data.termsAndConditions || [],
                    cancellationAndRefundPolicy: data.cancellationAndRefundPolicy || [],
                    travelRequirements: data.travelRequirements || [],
                });
                if (data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/${data.theme.link}/${bookingId}`);
                } else {
                    // Fallback to current location if no theme.link
                    setItineraryUrl(window.location.href);
                }
                setBookingData(data);
                setBooking(transformed);
                setUser(data.contact);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch booking");
                console.error("Error fetching booking:", err);
            } finally {
                setLoading(false);
            }
        };
        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadings(true);
        try {
            await axios.post(`${BASE_URL}/api/softmails`, form);
            alert("Inquiry submitted successfully!");
            setForm({ ...form, message: "" });
        } catch (err) {
            console.error(err);
            alert("Error submitting inquiry");
        } finally {
            setLoadings(false);
        }
    };




    const allLocations = (bookingData?.itineraryData?.days || []).flatMap((d) => d.locations || []);
    const locationCounts = allLocations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});
    const uniqueLocations = Object.entries(locationCounts).map(([loc, count]) => ({ loc, count }));

    const pricing = bookingData?.itineraryData?.pricing || {};
    const offers = bookingData?.itineraryData?.offers || {};
    const festivalOffer = bookingData?.itineraryData?.festivalOffer || null;
    const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
    const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
    const totalPrice = bookingData?.totalAmount || 0;
    const discountedPrice = bookingData?.itineraryData?.highlightPrice || totalPrice;
    const discount = totalPrice - discountedPrice;
    const festivalDiscount = festivalOffer?.selected ? ((actualAmount - offerAmount) * festivalOffer.value) / 100 : 0;

    const totalPax =
        Number(bookingData?.clientDetails?.adults || 0) +
        Number(bookingData?.clientDetails?.kids5to12 || 0) +
        Number(bookingData?.clientDetails?.kidsBelow5 || 0);
    // Total savings is the festival discount plus any other offerAmount
    const totalSavings = offerAmount + festivalDiscount;

    const days = bookingData?.itineraryData?.days || [];
    const allImages = days.flatMap(day => day.images || []);

    // ✅ Pick a random image (if available)
    const mainCircleImage =
        allImages.length > 0
            ? `${BASE_URL}${allImages[Math.floor(Math.random() * allImages.length)]}`
            : "/1.avif";




    const tabKeyMap = {
        "Inclusions": "inclusions",
        "Exclusions": "exclusions",
        "Terms & Conditions": "termsandconditions",
        "Cancellation & Refund Policy": "cancellationandrefundpolicy",
        "Payment Policy": "travelrequirements"
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading your journey...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Booking Not Found</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!bookingData) return null;

    return (
        <div className="bg-white p-2 w-full max-w-7xl mx-auto">

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
            <div ref={componentRef} className="">
                <div className="flex flex-col lg:flex-row relative min-h-[60vh] mx-auto">
                    <div className="w-full order-2 lg:order-1 lg:w-1/2 px-6 md:px-12">
                        <h1 className="font-bold mt-10 text-2xl sm:text-3xl md:text-4xl text-black">Hi {booking.customerName},</h1>
                        <p className="mt-4 text-gray-500 font-mono font-semibold">
                            Here is the package exclusively designed/tailor made <br /> for you
                        </p>
                        <div className="mt-6">
                            <span className="px-4 py-2 bg-green-300 text-black rounded-md text-sm sm:text-lg font-bold shadow-md">
                                {bookingData.selectedItinerary.duration}
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="font-bold text-2xl sm:text-3xl text-black leading-snug text-pretty">
                                {booking.customerName.toUpperCase()} || RAJASTHAN TOUR PACKAGE FOR {booking.days} Days WITH {Object.keys(bookingData.itineraryData.pricing)[0]} HOTELS
                            </p>
                        </div>
                        {festivalOffer && festivalOffer.selected && (
                            <div className="mt-4 bg-green-50 text-green-900 p-4 rounded-lg border border-green-200">
                                <p className="text-sm font-bold text-green-800">Festival Offer</p>
                                <p className="text-lg font-semibold">{festivalOffer.name}: {festivalOffer.value}% Off</p>
                            </div>
                        )}
                        <div className="mt-4">
                            <span className="text-3xl sm:text-4xl font-bold text-black">
                                ₹{discountedPrice}
                            </span>
                            <span className="text-lg font-medium">/-</span>
                            <span className="text-sm sm:text-lg text-gray-500 ml-2">-{bookingData.itineraryData.priceType}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 gap-y-2 mt-3 sm:mt-4 text-sm sm:text-lg  font-medium text-gray-700">
                            {uniqueLocations.map(({ loc, count }, i) => (
                                <p key={`loc-${i}`} className="flex items-center gap-1">
                                    <span className="text-purple-500">•</span> {loc}{count > 1 ? ` (${count})` : ''}
                                </p>
                            ))}
                        </div>

                        <div className="w-full ">
                            <a href={softwareData?.g2ReviewLink || "/reviews"} className="inline-flex w-fit items-center my-4 gap-3 px-4 sm:px-6 py-2 bg-white text-black rounded-md border border-gray-300 cursor-pointer shadow-sm">
                                <img
                                    src="/gg.webp"
                                    className="w-10 h-10 sm:w-12 sm:h-12"
                                    alt="Google Logo"
                                />
                                <div className="text-left">
                                    <p className="font-semibold">Customer Reviews</p>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <StarRating rating={softwareData?.rating || 0} reviews={softwareData?.reviews} />
                                    </div>
                                </div>
                            </a>
                            <Link
                                to={softwareData?.tripadviserlink || "/reviews"}
                                className="text-sm border inline-flex items-center justify-center w-full sm:w-auto px-3 text-gray-800 bg-white rounded-md cursor-pointer hover:shadow-md transition"
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
                                        <StarRating rating={softwareData?.tripadvisorRating || 0} reviews={softwareData?.tripadvisorReviews} />

                                    </div>
                                </div>
                            </Link>
                        </div>


                        <div className="flex items-center gap-2">
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
                                className="px-3 sm:px-4 md:px-6 py-2 cursor-pointer my-2 bg-[#e0dcdc5b] text-green-600 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handlePrint}
                                disabled={pdfLoading}
                            >
                                {pdfLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
                    <div className="w-full order-1 lg:order-2 lg:w-1/2 relative flex justify-center items-center mt-8 lg:mt-0">
                        <div className="w-full aspect-square rounded-full overflow-hidden">
                            <img src={mainCircleImage} className="w-full h-full object-cover" alt="image" />
                        </div>
                        <div className="block absolute lg:-top-40 top-[0px] left-0 lg:w-72 lg:h-72 w-28 h-28 bg-green-400 rounded-full opacity-90"></div>
                        <div className="block absolute bottom-10 right-0 lg:w-60 lg:h-60 w-24 h-24 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full opacity-90"></div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
                    <div className="w-full  bg-white p-6 text-lg rounded-xl shadow-lg">
                        <h2 className="text-gray-700 text-sm sm:text-lg">Price Summary</h2>

                        <div className="mt-4 space-y-2">
                            {actualAmount > 0 && offerAmount > 0 && (
                                <p className="text-gray-500 text-2xl line-through">₹{actualAmount}</p>
                            )}
                            {festivalOffer && festivalOffer.selected && (
                                <p className="text-green-600 font-semibold">
                                    Festival Offer ({festivalOffer.name}): {festivalOffer.value}% Off
                                </p>
                            )}
                            {bookingData?.totalAmount > 0 && (
                                <p className="text-2xl font-bold text-black">₹{totalPrice}</p>
                            )}
                            {bookingData?.bookingAmount > 0 && (
                                <p className="text-gray-700">
                                    Booking Amount: <span className="font-semibold">₹{bookingData.bookingAmount}</span>
                                </p>
                            )}
                            {(offerAmount > 0 || (festivalOffer && festivalOffer.selected)) && (
                                <p className="text-green-600 font-semibold">
                                    Total Savings: ₹{totalSavings}
                                </p>
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
                    </div>
                    <div className="bg-white p-6 w-full text-lg rounded-xl shadow-lg space-y-2">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Client Details</h2>
                        <p><span className="font-semibold text-gray-600">Name:</span> {bookingData?.clientDetails?.name}</p>
                        <p><span className="font-semibold text-gray-600">Email:</span> {bookingData?.clientDetails?.email}</p>
                        <p><span className="font-semibold text-gray-600">Phone:</span> {bookingData?.clientDetails?.phone}</p>
                        <p><span className="font-semibold text-gray-600">Travel Date:</span> {bookingData?.clientDetails?.travelDate}</p>

                        <p className="text-sm sm:text-lg text-gray-700">
                            {[
                                bookingData?.clientDetails?.adults > 0 ? `${bookingData.clientDetails.adults} Adults` : null,
                                bookingData?.clientDetails?.kids5to12 > 0 ? `${bookingData.clientDetails.kids5to12} Kids (5–12)` : null,
                                bookingData?.clientDetails?.kidsBelow5 > 0 ? `${bookingData.clientDetails.kidsBelow5} Kids (Below 5)` : null,
                                bookingData?.clientDetails?.extraBeds > 0 ? `${bookingData.clientDetails.extraBeds} Extra mattress` : null,
                                bookingData?.clientDetails?.rooms > 0 ? `${bookingData.clientDetails.rooms} Rooms` : null
                            ].filter(Boolean).join(", ")}
                        </p>

                        <p><span className="font-semibold text-gray-600">Total Travelers:</span> {bookingData?.clientDetails?.travelers}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-200 mb-10">

                    <div className=' sm:text-2xl md:text-3xl font-extrabold text-lg text-green-700'>
                        Travel Itinerary
                    </div>

                    <p className="text-gray-700 mt-1 flex flex-wrap gap-2 text-lg font-inter">

                        <p className='text-green-600 text-xl'>Covering Destinations</p>
                        {uniqueLocations.map(({ loc, count }, i) => (
                            <p key={`loc-${i}`} className="flex items-center gap-1">
                                <span className="text-purple-500">•</span> {loc}{count > 1 ? ` (${count})` : ''}
                            </p>
                        ))}
                    </p>
                    {bookingData?.itineraryData?.tourcode && (
                        <p className="text-gray-700 my-2 underline text-sm md:text-lg">
                            <span className="font-semibold text-gray-900">Tour Code:</span>{" "}
                            <span className="text-teal-600 font-medium">{bookingData.itineraryData.tourcode}</span>
                        </p>
                    )}
                    {Array.isArray(bookingData?.itineraryData?.descriptions) &&
                        bookingData.itineraryData.descriptions.length > 0 && (
                            <div className="space-y-4 mb-6 mt-2 text-lg">
                                {bookingData.itineraryData.descriptions.map((desc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 sm:p-4 p-1 bg-gray-50 rounded border border-gray-200"
                                    >
                                        <span className="sm:flex-shrink-0 hidden w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {i + 1}
                                        </span>
                                        <div
                                            className="ql-editor text-gray-700 leading-relaxed font-medium  prose prose-sm sm:prose-lg max-w-none"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(desc) }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    <div className="mt-6 space-y-12 relative">
                        {booking.itinerary.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
                                <div className="w-full sm:w-24 sm:text-right text-left">
                                    <p className="bg-green-600 text-gray-100 inline-block px-2 rounded-lg font-bold">{item.day}</p>
                                    <p className="text-gray-500 text-sm">{item.date}</p>
                                </div>
                                <div className="relative sm:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                                    {index !== booking.itinerary.length - 1 && (
                                        <div className="absolute top-4 bottom-0 w-0.5 bg-green-500"></div>
                                    )}
                                    <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white z-10"></div>
                                </div>
                                <div className="w-full sm:w-1/4  sm:mt-0">
                                    <p className="font-bold text-gray-800 text-lg">{item.title}</p>
                                    {item.img && item.img.length > 0 ? (
                                        <Swiper
                                            modules={[Pagination, Autoplay]}
                                            pagination={{ clickable: true }}
                                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                                            loop={true}
                                            spaceBetween={10}
                                            className="rounded-lg overflow-hidden w-full h-48 sm:h-60 mt-4"
                                        >
                                            {item.img?.slice(0, 5)?.map((imgUrl, idx) => (
                                                <SwiperSlide key={idx}>
                                                    <img
                                                        src={imgUrl}
                                                        alt={item.title + " image " + (idx + 1)}
                                                        className="object-cover w-full h-48 sm:h-60 rounded-lg"
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    ) : (
                                        <img
                                            src="/placeholder.svg"
                                            alt="Placeholder"
                                            className="rounded-lg object-cover w-full h-48 sm:w-80 sm:h-60 mt-4"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 mt-4 sm:mt-6 text-lg">
                                    {booking?.vehicle && (
                                        <p className="font-semibold mb-2 flex gap-2 text-gray-700 text-sm sm:text-lg">
                                            <CarFront className="" /> {booking.vehicle.model}
                                        </p>
                                    )}
                                    <div
                                        className="ql-editor text-muted-foreground text-sm sm:text-lg md:text-xl prose prose-sm sm:prose-lg max-w-none leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.desc) }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {bookingData.itineraryData?.hotels && Object.keys(bookingData.itineraryData.hotels).length > 0 && (
                    <div className="bg-white sm:p-8 p-3 rounded-3xl shadow-xl border border-yellow-200 mb-10">
                        <h1 className="text-xl sm:text-2xl font-bold text-black">
                            Hotels Details :{" "}
                            <span className="text-orange-500">
                                {Object.keys(bookingData.itineraryData.hotels).length - 1} Nights /{" "}
                                {Object.keys(bookingData.itineraryData.hotels).length} Days
                            </span>{" "}
                        </h1>
                        <p className="text-gray-500 mt-1 text-xl">
                            {(() => {
                                const hotels = bookingData.itineraryData?.hotels || {};
                                const allCities = Object.values(hotels).flatMap(cityObj => Object.keys(cityObj));

                                // Calculate nights (count of appearance)
                                const cityNights = {};
                                allCities.forEach(city => {
                                    cityNights[city] = (cityNights[city] || 0) + 1;
                                });

                                // Unique cities
                                const uniqueCities = [...new Set(allCities)];

                                return uniqueCities
                                    .map(city => {
                                        const nights = cityNights[city];
                                        return nights > 1
                                            ? `${city}- ${nights} N`
                                            : `${city} - N`;
                                    })
                                    .join(" | ");
                            })()}
                        </p>

                        <div className="mt-6 space-y-12 relative">
                            {Object.entries(bookingData.itineraryData.hotels).map(([day, cities], index, arr) => {
                                const allGroups = [];
                                Object.entries(cities).forEach(([city, meals]) => {
                                    const mealEntries = [];
                                    if (meals.breakfast?.id) mealEntries.push({ type: 'Breakfast', data: meals.breakfast });
                                    if (meals.lunch?.id) mealEntries.push({ type: 'Lunch', data: meals.lunch });
                                    if (meals.dinner?.id) mealEntries.push({ type: 'Dinner', data: meals.dinner });
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
                                    <div key={day} className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
                                        <div className="w-full sm:w-24 sm:text-right text-lg">
                                            <p className="bg-green-600 text-gray-100 inline-block px-2 rounded-lg font-bold">Day {day}</p>
                                        </div>
                                        <div className="relative sm:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                                            {index !== arr.length && <div className="absolute top-6 bottom-0 w-0.5 bg-green-500"></div>}
                                            <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white z-10"></div>
                                        </div>
                                        <div className="flex-1 space-y-10 text-lg">
                                            {allGroups.map((group, gIndex) => (
                                                <div key={gIndex} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                    <div className="w-full sm:w-1/4">
                                                        <a href={group.hotel.googleReviewLink} target="_blank"
                                                            rel="noopener noreferrer">
                                                            <img
                                                                src={
                                                                    group.hotel.image
                                                                        ? `${BASE_URL}${group.hotel.image}`
                                                                        : "https://via.placeholder.com/300x200"
                                                                }
                                                                alt={group.hotel.name || "Hotel"}
                                                                className="rounded-lg object-cover w-full h-48 sm:w-80 sm:h-60"
                                                            />
                                                        </a>
                                                    </div>
                                                    <div className="flex-1 mt-5">
                                                        <div className="flex flex-wrap items-center gap-2 mt-4">
                                                            <StarRating rating={group.hotel.rating || 0} reviews={group.hotel.reviews || 0} />
                                                            <span className="text-green-600 font-bold">
                                                                {group.hotel.rating || "0"} Star in {group.city.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-gray-800 mt-4 text-lg capitalize">{group.hotel.name || "Hotel Name"}</p>
                                                        <p className="text-sm sm:text-lg text-gray-600">
                                                            {group.hotel.rating || "0"} Based on {group.hotel.reviews || "0"} Reviews
                                                        </p>
                                                        <p className="text-sm sm:text-lg text-gray-500 mt-4">
                                                            Check-in: {group.hotel.checkIn ? new Date(group.hotel.checkIn).toLocaleDateString() : "N/A"} |
                                                            Check-out: {group.hotel.checkOut ? new Date(group.hotel.checkOut).toLocaleDateString() : "N/A"}
                                                        </p>
                                                        <div className="flex gap-3 mt-4 text-green-600 font-semibold flex-wrap">
                                                            {group.meals.includes("Breakfast") && (
                                                                <span className="flex items-center gap-1">
                                                                    <Coffee className="w-4 h-4" /> Breakfast
                                                                </span>
                                                            )}
                                                            {group.meals.includes("Lunch") && (
                                                                <span className="flex items-center gap-1">
                                                                    <UtensilsCrossed className="w-4 h-4" /> Lunch
                                                                </span>
                                                            )}
                                                            {group.meals.includes("Dinner") && (
                                                                <span className="flex items-center gap-1">
                                                                    <Utensils className="w-4 h-4" /> Dinner
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }).concat([
                                <div key="extra-day" className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
                                    <div className="w-full sm:w-24 sm:text-right text-lg">
                                        <p className="bg-green-600 text-gray-100 inline-block px-2 rounded-lg font-bold">
                                            Day {Object.keys(bookingData.itineraryData.hotels).length + 1}
                                        </p>
                                    </div>
                                    <div className="relative sm:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                                        <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white z-10"></div>
                                    </div>
                                    <div className="flex-1 space-y-10 text-lg">
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">

                                            <div className="flex-1 mt-5">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-amber-600" />
                                                    <span className="font-semibold text-sm text-gray-700">
                                                        { 'DEPARTURE'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-3 mt-4 text-green-600 font-semibold flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Coffee className="w-4 h-4" /> Breakfast Included
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ])}
                        </div>
                    </div>
                )}



                <div className="w-full max-w-7xl mx-auto ">
                    <div className="w-full bg-white p-6 rounded-xl ">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">Tour Policies</h2>

                        {/* Tabs */}
                        <div className="flex gap-6 border-b font-semibold overflow-x-auto whitespace-nowrap pb-2">
                            {["Inclusions", "Exclusions", "Terms & Conditions", "Cancellation & Refund Policy", "Payment Policy"].map((tab) => {
                                const key = tabKeyMap[tab];
                                return (
                                    <button
                                        key={tab}
                                        className={`pb-2 text-sm sm:text-base flex items-center gap-2 ${activeTab === key
                                            ? "text-black border-b-2 border-green-500"
                                            : "text-gray-500 hover:text-gray-700"
                                            } transition-colors`}
                                        onClick={() => setActiveTab(key)}
                                    >
                                        <Info className={`w-4 h-4 ${activeTab === key ? 'text-green-500' : 'text-gray-500'}`} />
                                        {tab}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="mt-4 text-black space-y-4">

                            {/* ------------------- INCLUSIONS (Accordion + Image + Description) ------------------- */}
                            {activeTab === "inclusions" && (
                                <div className="space-y-4">
                                    {policies.inclusions.map((item, i) => {
                                        const hasImage = (item.images && item.images.length > 0) || item.image;
                                        return (
                                            <div key={`inc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">

                                                {/* Accordion Button */}
                                                <button
                                                    onClick={() => toggleAccordion(`inc-${i}`)}
                                                    className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Info className="w-5 h-5 text-green-500" />
                                                        <span className="text-gray-800">{item.title}</span>
                                                    </div>

                                                    <ChevronDown
                                                        className={`w-5 h-5 text-green-500 transform transition-transform ${expandedItems[`inc-${i}`] ? "rotate-180" : ""
                                                            }`}
                                                    />
                                                </button>

                                                {/* Accordion Body */}
                                                {expandedItems[`inc-${i}`] && (
                                                    <div className="p-4 sm:p-5">
                                                        {hasImage && (
                                                            <div className="float-left mr-4 mb-2">
                                                                <img
                                                                    src={`${BASE_URL}/${item.images?.[0] || item.image}`}
                                                                    alt={item.title}
                                                                    className="w-[100px] h-[100px] object-cover rounded-lg shadow-md"
                                                                />
                                                            </div>
                                                        )}
                                                        <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ------------------- EXCLUSIONS (Title Only - No Dropdown) ------------------- */}
                            {activeTab === "exclusions" && (
                                <div className="space-y-3">
                                    {policies.exclusions.map((item, i) => (
                                        <div key={i} className="p-4 border rounded-lg bg-gray-50 shadow-sm font-semibold text-gray-700">
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ------------------- TERMS & CONDITIONS (Title Only) ------------------- */}
                            {activeTab === "termsandconditions" && (
                                <div className="space-y-3">
                                    {policies.termsAndConditions.map((item, i) => (
                                        <div key={i} className="p-4 border rounded-lg bg-gray-50 shadow-sm font-semibold text-gray-700">
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ------------------- CANCELLATION POLICY (Title Only) ------------------- */}
                            {activeTab === "cancellationandrefundpolicy" && (
                                <div className="space-y-3">
                                    {policies.cancellationAndRefundPolicy.map((item, i) => (
                                        <div key={i} className="p-4 border rounded-lg bg-gray-50 shadow-sm font-semibold text-gray-700">
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ------------------- TRAVEL REQUIREMENTS (Title Only) ------------------- */}
                            {activeTab === "travelrequirements" && (
                                <div className="space-y-3">
                                    {policies.travelRequirements.map((item, i) => (
                                        <div key={i} className="p-4 border rounded-lg bg-gray-50 shadow-sm font-semibold text-gray-700">
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                    </div>
                </div>


                <div className="p-8 space-y-12">
                    <section className="mt-14">
                        <p className="font-serif font-bold text-sm sm:text-lg">{tour?.name}</p>
                        <div className="md:flex md:justify-between gap-8 mt-4">
                            <div className="md:w-1/2 space-y-4 sm:text-lg text-justify">
                                {tour?.description
                                    ?.slice(0, Math.ceil(tour.description.length / 2))
                                    .map((desc, index) => (
                                        <p key={index}>{desc}</p>
                                    ))}
                            </div>
                            <div className="md:w-1/2 space-y-4 text-justify mt-6 sm:text-lg md:mt-0">
                                {tour?.description
                                    ?.slice(Math.ceil(tour.description.length / 2))
                                    .map((desc, index) => (
                                        <p key={index}>{desc}</p>
                                    ))}
                            </div>
                        </div>
                    </section>
                    <section className="mt-10">
                        <h3 className="font-serif font-bold mb-4 sm:text-lg underline">Achievements</h3>
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
                <div className="w-full flex justify-center my-6 bg-cover bg-center rounded-xl bg-[#008236df]">
                    <div
                        className="w-[100%] relative  overflow-hidden flex flex-col items-center py-10 px-4"
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
                px-6 py-3 cursor-pointer my-4 capitalize
                bg-green-400 hover:bg-green-500
                text-white font-semibold border
                rounded-full shadow-md
                transition-all duration-300 ease-in-out
                text-sm sm:text-base md:text-xl
                hover:scale-105 hover:shadow-lg
            "
                        >


                            <span>click to view about our Travel Agency</span>


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


                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-7xl mx-auto">
                    <div className="flex-1 sm:text-lg p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Write to us</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                            <div>
                                <label className="text-xs sm:text-sm text-gray-500">Name</label>
                                <input
                                    type="text"
                                    value={bookingData?.clientDetails?.name || ""}
                                    readOnly
                                    className="border-b rounded-lg w-full p-2 text-sm sm:text-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-xs sm:text-sm text-gray-500">Email</label>
                                <input
                                    type="email"
                                    value={bookingData?.clientDetails?.email || ""}
                                    readOnly
                                    className="border-b rounded-lg w-full p-2 text-sm sm:text-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-xs sm:text-sm text-gray-500">Message</label>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="border-b rounded-lg w-full p-2 resize-none text-sm sm:text-lg"
                                    rows={4}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loadings}
                                className={`px-4 sm:px-6 py-2 rounded-lg mt-3 sm:mt-4 text-sm sm:text-lg transition-colors ${loadings ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                            >
                                {loadings ? "Submitting..." : "Submit"}
                            </button>
                        </form>
                    </div>
                    {booking?.contact && (
                        <div className="w-full lg:w-80 xl:w-96 bg-gradient-to-b from-green-50 to-white border border-gray-200 rounded-2xl shadow-md p-4 sm:p-6">
                            <h3 className="text-gray-600 text-sm sm:text-lg uppercase tracking-wide mb-2 font-medium">
                                Contact
                            </h3>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">{booking?.contact.name}</h2>
                            <div className="space-y-4 text-sm sm:text-lg  text-gray-700">
                                <div>
                                    <span className="font-semibold block mb-1 text-gray-800">Call</span>
                                    {(booking?.contact.mobiles || []).map((mobile, index) => {
                                        const cleanMobile = mobile.replace(/^tel:\+?91/, "");
                                        return (
                                            <a
                                                key={`mobile-${index}`}
                                                href={`tel:+91${cleanMobile}`}
                                                className="block hover:text-green-600"
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
                                                className="block hover:text-green-600 break-all"
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
                                    </p>
                                </div>
                            </div>
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
                            {booking?.contact.socialLinks && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <span className="text-gray-800 text-sm sm:text-lg  font-medium mr-2">
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
                                                className="inline-block mx-2 text-gray-600 hover:text-green-700 text-lg"
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



                <div className="text-center text-gray-600 text-sm sm:text-lg py-4">
                    © {softwareData?.year || "2025"} {softwareData?.companyName || "Rajasthan Tourism"}. All rights reserved.
                </div>
            </div>

            <style>
                {`
  /* index.css */
  h1, h2, h3, h4, h5, h6,
  p,
  span,
  ul,
  ol,
  li,
  b,
  a,
  i,
  strong,
  input,
  em {
    font-family: 'montaz' !important;
  }
`}
            </style>
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
    );
};

export default Viewdata3admin;
