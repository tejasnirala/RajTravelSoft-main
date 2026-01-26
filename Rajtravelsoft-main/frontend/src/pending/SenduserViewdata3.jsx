"use client";

import axios from "axios";
import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Cookies from 'js-cookie';
import { ChevronDown, Info, MapPin, Pointer } from 'lucide-react';

// Solid icons
import { faPrint, faStar, faGlobe, faCar, faHotel, faLocationDot, faCoffee, faUtensils, faMoon, faPlaneDeparture, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

// Brand icons
import { faWhatsapp, faFacebookF, faTwitter, faInstagram, faLinkedinIn, faYoutube } from "@fortawesome/free-brands-svg-icons";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Helmet } from "react-helmet-async";
import { Pagination, Autoplay } from "swiper/modules";
import { CarFront, Coffee, Utensils, UtensilsCrossed } from "lucide-react";
import { FaFacebook, FaGlobe, FaInstagram, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa';
import Pdf from "./Pdf";

const StarRating = ({ rating, reviews }) => {
    const totalStars = 5;
    return (
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-1 text-yellow-500">
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <span key={index}>
                        {starValue <= Math.round(rating) ? "★" : "☆"}
                    </span>
                );
            })}

            {/* Rating Number */}
            <span className="text-xs text-gray-600 ml-1">{rating}</span>

            {/* Reviews Count */}
            {reviews && (
                <span className="text-xs text-gray-500 ml-1">
                    ({reviews} reviews)
                </span>
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



const HotelCard = ({ hotel, checkInDate, checkOutDate, nights, includedMeals = [] }) => {
    // includedMeals = ["breakfast", "lunch", "dinner"] में से जो इस hotel के साथ हैं
    const displayCheckIn = checkInDate || safeDateString(hotel.checkIn) || "Check-in TBD";
    const displayCheckOut = checkOutDate || safeDateString(hotel.checkOut) || "Check-out TBD";

    // Meal icons with names
    const mealInfo = [
        { key: "breakfast", icon: faCoffee, label: "Breakfast", color: "text-amber-700" },
        { key: "lunch", icon: faUtensils, label: "Lunch", color: "text-orange-700", rotate: "rotate-90" },
        { key: "stayOnly", icon: faHotel, label: "Stay Only", color: "text-red-700" },
        { key: "dinner", icon: faUtensils, label: "Dinner", color: "text-red-700" }
    ];

    const activeMeals = mealInfo.filter(m => includedMeals.includes(m.key));

    return (
        <div className="relative w-full p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">

            {/* Top Right Meal Badges - Sabse Upar Dikhega */}

            <div className="flex flex-col sm:flex-row gap-6">

                {/* Hotel Image */}
                {hotel.image ? (
                    <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <img
                            src={`https://apitour.rajasthantouring.in${hotel.image}`}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.style.display = 'none')}
                        />
                    </div>
                ) : (
                    <div className="w-full sm:w-40 h-40 bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-500">
                        No Image
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 space-y-3">

                    {/* Hotel Name */}
                    <h3 className="text-xl font-bold text-gray-900">
                        {hotel.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-3">
                        <StarRating rating={hotel.rating || 0} />
                        {hotel.reviews > 0 && (
                            <span className="text-sm text-gray-600">
                                ({hotel.reviews} Reviews)
                            </span>
                        )}
                    </div>

                    {/* Google Link */}
                    {hotel.googleReviewLink && (
                        <a
                            href={hotel.googleReviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm underline hover:text-blue-800"
                        >
                            View Photos
                        </a>
                    )}

                    {/* Check-in / Check-out */}
                    <div className="text-sm text-gray-600 space-y-1 pt-2  border-gray-200">
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-800">Check-in:</span>
                            <span>{displayCheckIn}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-gray-800">Check-out:</span>
                            <span>{displayCheckOut}</span>
                        </div>

                    </div>

                    {/* Meals Included - Bottom */}
                    {activeMeals.length > 0 && (
                        <div className="flex items-center gap-4 mt-4 pt-3  border-gray-200">
                            <div className="flex gap-3 flex-wrap">
                                {activeMeals.map((meal) => (
                                    <span
                                        key={meal.key}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-white text-xs font-bold shadow ${meal.key === 'breakfast' ? 'bg-amber-600' : meal.key === 'lunch' ? 'bg-orange-600' : 'bg-red-700'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={meal.icon} className={meal.rotate || ''} />
                                        {meal.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const safeDateString = (dateStr) => {
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
};

const getHotelId = (hotel) => {
    if (typeof hotel === 'string') return hotel;
    if (hotel && typeof hotel === 'object') {
        return hotel.id || hotel._id || null;
    }
    return null;
};

const getVehicleId = (vehicle) => {
    if (typeof vehicle === 'string') return vehicle;
    if (vehicle && typeof vehicle === 'object') {
        return vehicle.id || vehicle._id || null;
    }
    return null;
};

const SendUser = ({ id: propId, autoDownload, onDownloadComplete }) => {
    const params = useParams();
    const bookingId = params.id || propId;
    const [activeTab, setActiveTab] = useState("inclusions");
    const componentRef = useRef(null);
    const [booking, setBooking] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [userHotelSelections, setUserHotelSelections] = useState({});
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [policies, setPolicies] = useState({
        inclusions: [],
        exclusions: [],
        termsAndConditions: [],
        cancellationAndRefundPolicy: [],
        travelRequirements: [],
    });

    const [adminChooseYourself, setAdminChooseYourself] = useState({});

    const [expandedItems, setExpandedItems] = useState({});

    const [loadings, setLoadings] = useState(false);
    const [user, setUser] = useState(null);
    // New: Construct the correct itinerary URL for PDF generation
    const [itineraryUrl, setItineraryUrl] = useState('');

    const [form, setForm] = useState({ packageTitle: "", name: "", email: "", message: "", mobile: "" });
    const [structureData, setStructureData] = useState(null);
    const [softwareData, setSoftwareData] = useState(null);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const emailId = queryParams.get("emailId");
    const navigate = useNavigate();
    const BASE_URL = "https://apitour.rajasthantouring.in";
    console.log(booking, "statestete");

    // State for dynamic title/meta
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");

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
        if (booking?.adminChooseYourself) {
            setAdminChooseYourself(booking.adminChooseYourself);
        }
    }, [booking]);

    // Automatically trigger print when ready
    useEffect(() => {
        if (autoDownload && bookingId && booking && componentRef.current && itineraryUrl) {
            // Wait a short delay to ensure rendering and DOM updates complete
            const timer = setTimeout(() => {
                handlePrint();
            }, 300); // 200–500ms is usually enough

            return () => clearTimeout(timer);
        }
    }, [autoDownload, bookingId, booking, componentRef.current, itineraryUrl]);


    const getNumericValue = (field, category) => {
        const val = field?.[category];
        if (typeof val === 'number') return val;
        return val?.value || 0;
    };

    const calculateDuration = (itinerary) => {
        if (!itinerary?.days?.length) return "0 Days";
        const totalDays = itinerary.days.length;
        const nights = Math.max(0, totalDays - 1);
        return `${totalDays} Days ${nights} Nights`;
    };


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
        let travelDate = data.clientDetails?.travelDate;
        let startDate;

        if (travelDate) {
            // Replace "/" with "-" for consistency
            const normalized = travelDate.replace(/\//g, "-");

            // Split date string into parts
            const [day, month, year] = normalized.split("-").map(Number);

            // Check valid numbers
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                startDate = new Date(year, month - 1, day); // month 0-based hota hai
            } else {
                startDate = new Date(); // fallback
            }
        } else {
            startDate = new Date(); // fallback
        }

        // ✅ Helper: format date + time (dd-mm-yyyy hh:mm AM/PM)
        function formatDateTime(date) {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;

            return `${day}-${month}-${year}`;
        }

        return {
            customerName: data.clientDetails?.name || "Guest",
            price: data.itineraryData?.pricing?.mk || data.bookingAmount || 0,
            nights: daysLength > 0 ? daysLength - 1 : 0,
            days: daysLength,
            selectedItinerary: data.selectedItinerary,
            vehicle: data.itineraryData?.vehicle
            ,
            itinerary:
                data.itineraryData?.days?.map((day, index) => {
                    let dateStr = "";
                    if (startDate) {
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + index);
                        dateStr = formatDateTime(dayDate); // ✅ add date + time here
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
        };
    };

    useEffect(() => {
        if (loading) {
            setTitleState("Loading Booking...");
            setDescriptionState("Loading booking details...");
            setOgDescriptionState("Loading...");
            setOgImageState("/logo1.png");
        } else if (error) {
            setTitleState("Booking Error | Preview");
            setDescriptionState(`Error: ${error}`);
            setOgDescriptionState("Booking preview error");
            setOgImageState("/logo1.png");
        } else if (booking && structureData) {
            const clientName = booking?.clientDetails?.name || "Traveler";
            const itineraryTitle = booking?.itineraryData?.titles?.[0] || "Booking Preview";
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
    }, [loading, error, booking, structureData]);

    useEffect(() => {
        document.title = titleState;
    }, [titleState]);


    const mealIcons = {
        breakfast: faCoffee,
        lunch: faUtensils,
        dinner: faMoon
    };

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



    const getDateForDay = (dayNumber) => {
        const travelDateStr = booking?.clientDetails?.travelDate; // "14-11-2025"
        if (!travelDateStr) return "Date TBD";

        const [day, month, year] = travelDateStr.split("-");
        const startDate = new Date(`${year}-${month}-${day}`);

        if (isNaN(startDate)) return "Date TBD";

        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayNumber - 1);

        return targetDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); // ⭐ Move this up: Reset early, before any fetches

            try {
                let bookingResponse = null;

                // 👉 STEP 1: Try Pending API — but only accept if status 200
                try {
                    const res = await axios.get(`${BASE_URL}/api/pending/${bookingId}`);
                    const sssssssss = await axios.get(`https://apitour.rajasthantouring.in/api/ssr-data/${bookingId}`);
                    if (res.status === 200 && res.data) {
                        bookingResponse = res;  // OK → Accept
                    }
                } catch (err) {
                    console.log("Pending API failed → Trying previewPending...");
                }

                console.log("After Pending:", bookingResponse);

                // 👉 STEP 2: If pending NOT OK → Try PreviewPending
                if (!bookingResponse) {
                    try {
                        const res = await axios.get(`${BASE_URL}/api/previewPending/${bookingId}`);
                        if (res.status === 200 && res.data) {
                            bookingResponse = res; // OK → Accept
                        } else {
                            throw new Error("PreviewPending returned invalid response");
                        }
                    } catch (err) {
                        console.log("PreviewPending API also failed");
                        throw err; // Re-throw: This will hit outer catch if both main APIs fail
                    }
                }




                // 👉 STEP 4: Use MAIN data (ignore SSR failure)
                const data = bookingResponse.data;
                const transformed = transformBooking(data);

                setBooking({ ...data, ...transformed }); // ⭐ If SSR needed, merge: { ...data, ...ssrData, ...transformed }

                if (data?.hotelSelections && Object.keys(data.hotelSelections).length > 0) {
                    const categories = Object.keys(data.hotelSelections);
                    setSelectedCategory(data.selectedCategory || categories[0]);
                }

                // 👉 Policies
                setPolicies({
                    inclusions: data.inclusions || [],
                    exclusions: data.exclusions || [],
                    termsAndConditions: data.termsAndConditions || [],
                    cancellationAndRefundPolicy: data.cancellationAndRefundPolicy || [],
                    travelRequirements: data.travelRequirements || [],
                });

                // 👉 Itinerary URL
                if (data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/Senduser${data.theme.link}/${bookingId}`);
                } else {
                    setItineraryUrl(window.location.href);
                }

            } catch (err) {
                console.error("Outer Error (main data fetch failed):", err);
                setError("Failed to fetch booking data"); // Only set if core data fails
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) fetchData();
    }, [bookingId]);



    useEffect(() => {
        if (booking) {
            setIsVehicleConfirmed(booking.vehicleConfirmed || booking.status === 'confirmed' || false);
            if (booking.itineraryData?.vehicle) {
                const vehicles = Array.isArray(booking.itineraryData.vehicle) ? booking.itineraryData.vehicle : [booking.itineraryData.vehicle];
                const preSelected = vehicles.find(v => v.selected === true);
                if (preSelected) {
                    setSelectedVehicleId(getVehicleId(preSelected));
                    handleVehicleSelect(getVehicleId(preSelected));
                } else if (vehicles.length > 0) {
                    setSelectedVehicleId(getVehicleId(vehicles[0]));
                } else {
                    setSelectedVehicleId(null);
                }
            } else {
                setSelectedVehicleId(null);
            }
        }
    }, [booking]);

    useEffect(() => {
        const extractIdsFromSelections = (selections) => {
            if (!selections || typeof selections !== 'object') return selections;

            const extractRec = (val) => {
                if (Array.isArray(val)) {
                    return val.map(v => getHotelId(v)).filter(Boolean);
                } else if (typeof val === 'string') {
                    return val;
                } else if (val && typeof val === 'object') {
                    const res = {};
                    Object.keys(val).forEach(k => {
                        res[k] = extractRec(val[k]);
                    });
                    return res;
                }
                return val;
            };

            return extractRec(selections);
        };
        if (booking?.userSelectedHotels) {
            const extracted = extractIdsFromSelections(booking.userSelectedHotels);
            const cleaned = JSON.parse(JSON.stringify(extracted));
            Object.keys(cleaned).forEach(cat => {
                delete cleaned[cat]?.selected;
                delete cleaned[cat]?.category;
            });
            setUserHotelSelections(cleaned);
        } else {
            setUserHotelSelections({});
        }
    }, [booking]);

    const isCategoryConfirmed = (category) => !!userHotelSelections[category]?.confirmed;

    const getCategoryTotals = () => {
        const totals = {};
        const festivalValue = booking.itineraryData.festivalOffer?.value || 0;
        const categories = Object.keys(booking.itineraryData.pricing || {});

        categories.forEach(category => {
            const price = getNumericValue(booking.itineraryData.pricing, category);
            const offer = getNumericValue(booking.itineraryData.offers, category);

            // Pehle offer apply karo
            const afterOffer = price - offer;

            // Ab us amount par festival discount lagao
            const festivalDiscount = afterOffer * (festivalValue / 100);

            // Final total
            totals[category] = afterOffer - festivalDiscount;
        });

        return totals;
    };

    const handleCategorySelect = (category) => {
        if (!isEditMode) return;
        setSelectedCategory(category);
    };

    const handleHotelSelect = (category, dayId, location, meal, hotelId) => {
        if (!isEditMode || isCategoryConfirmed(category)) return;
        setUserHotelSelections(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [dayId]: {
                    ...prev[category]?.[dayId],
                    [location]: {
                        ...prev[category]?.[dayId]?.[location],
                        [meal]: hotelId
                    }
                }
            }
        }));
    };

    const handleVehicleSelect = async (vehicleId) => {
        if (isVehicleConfirmed || !isEditMode) return;
        setSelectedVehicleId(vehicleId);
        try {
            let vehicles = booking.itineraryData.vehicle;
            if (!Array.isArray(vehicles)) vehicles = [vehicles];
            const updatedVehicles = vehicles.map(v => ({
                ...v,
                selected: getVehicleId(v) === vehicleId
            }));
            await axios.put(`${BASE_URL}/api/pending/${bookingId}`, {
                itineraryData: {
                    ...booking.itineraryData,
                    vehicle: updatedVehicles,
                },
                vehicleConfirmed: true,
            });
            const response = await axios.get(`${BASE_URL}/api/pending/${bookingId}`);
            setBooking(response.data);
        } catch (err) {
            setError('Failed to confirm vehicle selection');
            setSelectedVehicleId(null);
        }
    };

    const confirmSelections = async () => {
        try {
            const categoriesToUpdate = {};
            const categories = Object.keys(booking.hotelSelections || {});

            categories.forEach(category => {
                if (isCategoryConfirmed(category)) return;

                const hotelsToSave = { ...userHotelSelections[category] || {} };
                if (booking.itineraryData.hotels?.[category]) {
                    Object.keys(booking.itineraryData.hotels[category]).forEach(dayId => {
                        if (!hotelsToSave[dayId]) hotelsToSave[dayId] = {};
                        Object.keys(booking.itineraryData.hotels[category][dayId]).forEach(location => {
                            if (['selected', 'category'].includes(location)) return;
                            if (!hotelsToSave[dayId][location]) hotelsToSave[dayId][location] = {};
                            ['breakfast', 'lunch', 'dinner', 'stayOnly'].forEach(meal => {
                                if (!hotelsToSave[dayId][location][meal]) {
                                    const mealStruct = booking.itineraryData.hotels[category][dayId][location][meal] || {};
                                    const options = mealStruct.options || [];
                                    const mealOptions = options.filter(h => h && getHotelId(h));
                                    if (mealOptions.length > 0) {
                                        hotelsToSave[dayId][location][meal] = getHotelId(mealOptions[0]);
                                    }
                                }
                            });
                        });
                    });
                }
                hotelsToSave.confirmed = true;
                categoriesToUpdate[category] = hotelsToSave;
            });

            await axios.put(`${BASE_URL}/api/pending/${bookingId}`, {
                userSelectedHotels: categoriesToUpdate,
                selectedCategory,
                status: "confirmed",
                totalAmount: getCategoryTotals()
            });
            const response = await axios.get(`${BASE_URL}/api/pending/${bookingId}`);
            setBooking(response.data);
            const extractIdsFromSelections = (selections) => {
                if (!selections || typeof selections !== 'object') return selections;

                const extractRec = (val) => {
                    if (Array.isArray(val)) {
                        return val.map(v => getHotelId(v)).filter(Boolean);
                    } else if (typeof val === 'string') {
                        return val;
                    } else if (val && typeof val === 'object') {
                        const res = {};
                        Object.keys(val).forEach(k => {
                            res[k] = extractRec(val[k]);
                        });
                        return res;
                    }
                    return val;
                };

                const extracted = extractRec(selections);
                Object.keys(extracted || {}).forEach(cat => {
                    delete extracted[cat].selected;
                    delete extracted[cat].category;
                });
                return extracted;
            };
            setUserHotelSelections(extractIdsFromSelections(response.data.userSelectedHotels || {}));
            setIsEditMode(false);
            alert('All selections confirmed successfully!');
        } catch (err) {
            setError('Failed to update selections');
        }
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    const categories = Object.keys(booking?.hotelSelections || {});

    const festivalOffer = booking?.itineraryData?.festivalOffer || null;
    const festivalValue = festivalOffer?.value || 0;
    const festivalName = festivalOffer?.name || festivalOffer?.title || '';
    const totalPax = Number(booking?.clientDetails?.adults || 0) + Number(booking?.clientDetails?.kids5to12 || 0) + Number(booking?.clientDetails?.kidsBelow5 || 0);
    const selectedCategoryPrice = booking?.totalAmount || 0;

    const uniqueLocations = (
        (booking?.itineraryData?.days || [])
            .flatMap(d => d.locations || [])
            .slice(0, -1) // 👉 last location removed
    ).reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});



    const parseDate = (str) => {
        const [dd, mm, yyyy] = str.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`);
    };
    const formatSingleDate = (day) => {
        return getDateForDays(day);
    };


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

    const formatRangeDate = (startDay, endDay) => {
        const start = getDateForDays(startDay); // "15 Nov 2025"
        const end = getDateForDays(endDay);     // "16 Nov 2025"

        const [sDate, sMonth, sYear] = start.split(" ");
        const [eDate] = end.split(" ");

        return `${sDate}  ${sMonth} to ${eDate} ${sMonth} ${sYear}`;
    };




    let vehicles = booking?.itineraryData?.vehicle;
    if (!Array.isArray(vehicles)) vehicles = [vehicles].filter(Boolean);
    const vehicleOptions = vehicles || [];

    const tabKeyMap = {
        "Inclusions": "inclusions",
        "Exclusions": "exclusions",
        "Terms & Conditions": "termsandconditions",
        "Cancellation & Refund Policy": "cancellationandrefundpolicy",
        "Payment Policy": "travelrequirements"
    };

    const toggleAccordion = (key) => {
        setExpandedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    const allImages = (booking?.itineraryData?.days || [])
        .filter(day =>
            !day.locations?.some(loc => loc?.toLowerCase() === "departure")
        )
        .flatMap(day => day.images || []);

    const mainCircleImage = allImages.length > 0
        ? `${BASE_URL}${allImages[0]}`
        : "/1.avif";


    {/* 🔹 CLIENT DETAILS COMPONENT (Reusable) */ }
    const ClientDetailsCard = ({ booking }) => {
        const d = booking.clientDetails;

        return (
            <div className="space-y-2 text-gray-700">

                {d.name && <Detail label="Name" value={d.name} />}
                {d.email && <Detail label="Email" value={d.email} />}
                {d.phone && <Detail label="Phone" value={d.phone} />}

                {d.adults && d.adults !== "0" && <Detail label="Adults" value={d.adults} />}
                {d.kids5to12 && d.kids5to12 !== "0" && (
                    <Detail label="Kids (5-12)" value={d.kids5to12} />
                )}
                {d.kidsBelow5 && d.kidsBelow5 !== "0" && (
                    <Detail label="Kids (Below 5)" value={d.kidsBelow5} />
                )}

                {d.rooms && d.rooms !== "0" && <Detail label="Rooms" value={d.rooms} />}

                {d.extraBeds && d.extraBeds !== "0" && (
                    <Detail label="Extra mattress" value={d.extraBeds} />
                )}

                {d.travelDate && <Detail label="Travel Date" value={d.travelDate} />}

            </div>
        );
    };


    /* 🔹 SMALL DETAIL ROW COMPONENT */
    const Detail = ({ label, value }) => (
        <div className="flex justify-between">
            <span>{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );



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
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    if (!booking) return null;

    return (
        <div style={{ fontFamily: "Nunito Sans" }} className="bg-white max-w-7xl w-full p-2 mx-auto">
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

            <div className="flex justify-between items-center py-4 w-full mx-auto px-6 mb-4">
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
                {booking?.contact?.mobiles?.[0] && (
                    <a
                        href={`https://wa.me/${booking.contact.mobiles[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                        {booking.contact.mobiles[0]}
                    </a>
                )}
            </div>

            <div style={{ fontFamily: "Nunito Sans" }} ref={componentRef} className="">
                <div className="hero-wrapper flex flex-col lg:flex-row relative min-h-[60vh] print:h-auto mx-auto">

                    <div className="w-full hero-left order-2 lg:order-1 lg:w-1/2 p-6 md:p-12 text-lg">
                        <h1 style={{ fontFamily: "Nunito Sans" }} className="font-bold mt-10 text-2xl  sm:text-3xl lg:text-4xl text-black">Hi {booking.customerName},</h1>
                        <p className="mt-4 text-gray-500  ">
                            Here is the package exclusively designed/tailor made <br /> for you
                        </p>
                        <div className="mt-6">
                            <span className="px-4 py-2 bg-yellow-300 text-[#343333] rounded-md text-sm sm:text-lg font-bold shadow-md">
                                {booking.selectedItinerary.duration}
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="font-bold text-2xl uppercase sm:text-3xl text-black leading-snug text-pretty">
                                {booking.customerName?.toUpperCase()} || {booking.itineraryData?.titles?.[0] || "RAJASTHAN TOUR PACKAGE"}
                            </p>
                        </div>
                        {festivalOffer && festivalOffer.selected && festivalValue > 0 && (
                            <div className="mt-4 bg-green-50 text-green-900 p-4 rounded-lg border border-green-200">
                                <p className="text-sm font-bold text-green-800">Festival Offer</p>
                                <p className="text-lg font-semibold">{festivalOffer.title}: {festivalOffer.value}% Off</p>
                            </div>
                        )}

                        {categories.length === 1 && categories.map((category) => {
                            const price = getNumericValue(booking.itineraryData.pricing, category);
                            const total = getCategoryTotals()[category];

                            return (
                                <div
                                    key={category}
                                    className="flex justify-between items-center text-2xl sm:text-3xl md:text-4xl mb-4 mt-2"
                                >
                                    <span className="text-gray-900 font-bold">
                                        ₹{total.toLocaleString("en-IN")}/-
                                    </span>
                                </div>
                            );
                        })}


                        <div className="flex flex-wrap gap-2 sm:text-lg gap-y-2 mt-3 sm:mt-4 text-sm font-medium text-gray-700">
                            {Object.entries(uniqueLocations).map(([loc, count]) => (
                                <p key={loc} className="flex items-center gap-1">
                                    <span className="">•</span> {loc}{count > 1 ? ` ` : ''}
                                </p>
                            ))}
                        </div>
                        <div className="flex flex-col  justify-between items-center md:items-start gap-6 mt-6">

                            {/* LEFT SIDE - Reviews */}
                            <div className="flex flex-wrap gap-4 w-full md:w-auto">

                                {/* Customer Reviews */}
                                <a
                                    href={softwareData?.g2ReviewLink || "/reviews"}
                                    className=" items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm  inline-flex"
                                >
                                    <img src="/gg.webp" className="w-12 h-12" />
                                    <div>
                                        <p className="font-semibold text-lg">Customer Reviews</p>
                                        <div className="flex items-center text-yellow-500">
                                            <StarRating rating={softwareData?.rating || 0} reviews={softwareData?.reviews} />
                                        </div>

                                    </div>
                                </a>

                                {/* TripAdvisor Review */}
                                <Link
                                    to={softwareData?.tripadviserlink || "/reviews"}
                                    className="inline-flex items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm "
                                >
                                    <img
                                        src="/image.png"
                                        className="w-12 h-12 rounded-full p-1"
                                    />
                                    <div>
                                        <p className="font-semibold text-lg">TripAdvisor Review</p>
                                        <div className="flex items-center text-yellow-500">
                                            <StarRating rating={softwareData?.tripadvisorRating || 0} reviews={softwareData?.tripadvisorReviews} />
                                        </div>

                                    </div>
                                </Link>

                            </div>

                            {/* RIGHT SIDE - Buttons */}
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => navigate(`/userpayment/${booking?._id}?tab=Optional`)}
                                    className="px-8 py-3 bg-yellow-600 text-3xl text-white font-semibold rounded-lg sm:min-w-[280px] w-full sm:w-0 "
                                >
                                    Book Now
                                </button>

                                <button
                                    onClick={handlePrint}
                                    disabled={pdfLoading}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-green-600 border rounded-lg hover:bg-gray-100 min-w-[200px]"
                                >
                                    {pdfLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Generating PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPrint} className="w-5 h-5" />
                                            <span>Generate PDF</span>
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>


                    </div>
                    <div className="w-full hero-right order-1 lg:order-2 lg:w-1/2 relative flex justify-center items-center mt-8 lg:mt-0">
                        <div className="circle-img w-full aspect-square rounded-full overflow-hidden print-circle">
                            <img
                                src={mainCircleImage}
                                className="w-full h-full object-cover print:object-contain"
                                alt="image"
                            />
                        </div>

                        <div className="absolute lg:-top-20 top-[0px] left-0 lg:w-72 lg:h-72 w-28 h-28 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full opacity-90"></div>
                        <div className="absolute bottom-10 right-0 lg:w-60 lg:h-60 w-24 h-24 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full opacity-90 "></div>
                    </div>

                </div>

                {/* Price Summary */}
                <div
                    className={`my-4 
                           ${categories.length !== 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6" : "block"}
                               `}
                >


                    {/* CASE 1 → Only 1 category */}
                    {categories.length === 1 && (
                        <>
                            {/* RIGHT – CLIENT DETAILS */}
                            <div className="bg-white p-6 border shadow-md rounded-2xl h-fit ">
                                <h2 className="text-xl font-bold mb-4">Client Details</h2>

                                <ClientDetailsCard booking={booking} />
                            </div>
                            {/* LEFT – PACKAGE CARD */}
                            {categories.map(category => {
                                const price = getNumericValue(booking.itineraryData.pricing, category);
                                const offer = getNumericValue(booking.itineraryData.offers, category);
                                const festivalDiscount = Math.round((price - offer) * (festivalValue / 100));
                                const total = getCategoryTotals()[category];
                                const bookingAmount = getNumericValue(booking.itineraryData.bookingAmount, category);
                                const totalSavings = price - offer - festivalDiscount;

                                return (
                                    <div
                                        key={category}
                                        className="bg-white border shadow-md rounded-2xl w-full p-4 sm:p-5 md:p-6"
                                    >

                                        <h3 className="text-gray-700 font-extrabold capitalize  text-2xl mb-4">{category} Package</h3>

                                        <div className="flex justify-between text-gray-700 mb-2">
                                            <span>Base Price</span>
                                            <span className="font-semibold">₹{price}/-</span>
                                        </div>

                                        {offer > 0 && (
                                            <div className="flex justify-between text-gray-700 mb-2">
                                                <span>Discount</span>
                                                <span className="font-semibold text-red-500">- ₹{offer}/-</span>
                                            </div>
                                        )}

                                        {festivalValue > 0 && (
                                            <div className="flex justify-between text-yellow-700 mb-2">
                                                <span>{festivalName} ({festivalValue}%)</span>
                                                <span className="font-semibold">- ₹{festivalDiscount}/-</span>
                                            </div>
                                        )}

                                        <hr className="my-3" />

                                        <div className="flex justify-between font-semibold text-gray-900">
                                            <span>Total Price</span>
                                            <span>₹{total}/-</span>
                                        </div>

                                        <div className="flex justify-between text-gray-700 my-1">
                                            <span>Booking Amount</span>
                                            <span>₹{bookingAmount}/-</span>
                                        </div>

                                        <button
                                            onClick={() =>
                                                navigate(`/userpayment/${booking?._id}?tab=Optional`)
                                            }
                                            className="
                        mt-6 w-full bg-black text-white 
                        py-3 rounded-xl text-center text-base font-semibold
                    "
                                        >
                                            Book Now
                                        </button>


                                    </div>
                                );
                            })}


                        </>
                    )}

                    {
                        categories.length === 2 && (
                            <div className="bg-white p-6 border shadow-md rounded-2xl h-fit ">
                                <h2 className="text-xl font-bold mb-4">Client Details</h2>

                                <ClientDetailsCard booking={booking} />
                            </div>
                        )
                    }


                    {/* CASE 3 → More than 2 categories */}
                    {categories.length > 2 &&
                        categories.map(category => {
                            const price = getNumericValue(booking.itineraryData.pricing, category);
                            const offer = getNumericValue(booking.itineraryData.offers, category);
                            const festivalDiscount = Math.round((price - offer) * (festivalValue / 100));
                            const total = getCategoryTotals()[category];
                            const bookingAmount = getNumericValue(booking.itineraryData.bookingAmount, category);


                            return (
                                <div key={category} className="bg-white border shadow-md rounded-2xl p-6">
                                    <h3 className="text-gray-700 font-extrabold text-2xl lg:text-3xl capitalize mb-4">{category} Package</h3>

                                    <div className="flex justify-between text-gray-700 mb-2">
                                        <span>Base Price</span>
                                        <span className="font-semibold">₹{price}/-</span>
                                    </div>

                                    {offer > 0 && (
                                        <div className="flex justify-between text-gray-700 mb-2">
                                            <span>Discount</span>
                                            <span className="text-red-500 font-semibold">- ₹{offer}/-</span>
                                        </div>
                                    )}

                                    {festivalValue > 0 && (
                                        <div className="flex justify-between text-yellow-700 mb-2">
                                            <span>{festivalName} ({festivalValue}%)</span>
                                            <span className="font-semibold">- ₹{festivalDiscount}/-</span>
                                        </div>
                                    )}

                                    <hr className="my-3" />

                                    <div className="flex justify-between font-semibold text-gray-900">
                                        <span>Total Price</span>
                                        <span>₹{total}/-</span>
                                    </div>

                                    <div className="flex justify-between text-gray-700 my-1">
                                        <span>Booking Amount</span>
                                        <span>₹{bookingAmount}/-</span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            navigate(`/userpayment/${booking?._id}?tab=Optional`)
                                        }
                                        className="
                        mt-6 w-full bg-black text-white 
                        py-3 rounded-xl text-center text-base font-semibold
                    "
                                    >
                                        Book Now
                                    </button>

                                </div>
                            );
                        })}

                </div>




                {/* Itinerary */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-200 mb-10">
                    <div className=' sm:text-2xl md:text-3xl font-extrabold text-lg text-green-700'>
                        Travel Itinerary
                    </div>

                    <p className="text-gray-700 mt-1 flex flex-wrap gap-2 text-lg font-inter">

                        <p className='text-green-600 text-xl'>Covering Destinations</p>
                        {Object.entries(uniqueLocations).map(([loc, count]) => (
                            <p key={loc} className="flex items-center gap-1 mr-2">
                                <span className="text-yellow-500">•</span> {loc}{count > 1 ? ` -${count}N` : `-${count}N`}
                            </p>
                        ))}
                    </p>
                    {booking?.itineraryData?.tourcode && (
                        <p className="text-gray-700 my-2 underline text-sm md:text-lg">
                            <span className="font-semibold text-gray-900">Tour Code:</span>{" "}
                            <span className="text-green-600 font-medium">{booking.itineraryData.tourcode}</span>
                        </p>
                    )}
                    <div className="mt-6 space-y-12 relative text-lg">
                        {booking?.itinerary?.map((item, index) => (
                            console.log(item),

                            <div key={index} className="sm:flex  flex-col sm:flex-row gap-4 sm:gap-6 relative">
                                <div className="w-full sm:w-24 sm:text-right text-left">
                                    <p className="text-green-600 font-bold">{item.day}</p>
                                    <p className="text-gray-500 text-sm">{item.date}</p>
                                </div>
                                <div className="relative flex flex-col items-center w-8 sm:w-12 self-stretch">
                                    {index !== booking.itinerary.length - 1 && (
                                        <div className="absolute top-4 bottom-0 w-0.5 bg-green-500"></div>
                                    )}
                                    <div className="w-4 h-4 sm:flex hidden rounded-full border-2 border-green-500 bg-white z-10"></div>
                                </div>
                                <div className="w-full sm:w-1/4 mt-4 sm:mt-0 text-lg">
                                    <p className="font-bold text-gray-800">{item.title}</p>
                                    {item.img && item.img.length > 0 ? (
                                        <Swiper
                                            modules={[Pagination, Autoplay]}
                                            pagination={{ clickable: true }}
                                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                                            loop={true}
                                            spaceBetween={10}
                                            className="rounded-lg overflow-hidden w-full h-48 sm:h-60 mt-4"
                                        >
                                            {item.img &&
                                                [...item.img] // make a copy
                                                    .sort(() => Math.random() - 0.5) // 🔀 randomize image order
                                                    .slice(0, 3) // 🎯 show only 3 random images
                                                    .map((imgUrl, idx) => (
                                                        <SwiperSlide key={idx}>
                                                            <img
                                                                src={imgUrl}
                                                                alt={`${item.title} image ${idx + 1}`}
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
                                <div className="flex-1 mt-4 sm:mt-6">
                                    {(() => {
                                        let vehicles = [];

                                        // If array → use directly (all vehicles)
                                        if (Array.isArray(booking?.vehicle)) {
                                            vehicles = booking.vehicle;
                                        }
                                        // If single object → convert to array
                                        else if (booking?.vehicle) {
                                            vehicles = [booking.vehicle];
                                        }

                                        // If no vehicle found
                                        if (vehicles.length === 0) return null;

                                        return vehicles.map((v, index) => (
                                            <div key={index} className="inline-flex items-center">
                                                <p className="font-semibold capitalize mb-2 px-2 py-1 rounded-lg gap-2 text-white bg-[#00A63E] inline-flex items-center text-sm sm:text-lg">
                                                    <CarFront /> {v.model}/Similar
                                                </p>

                                                {/* Add "&" between vehicles (not after last one) */}
                                                {index < vehicles.length - 1 && (
                                                    <span className="font-bold mx-2 text-lg">&</span>
                                                )}
                                            </div>
                                        ));
                                    })()}


                                    <div
                                        className="ql-editor text-muted-foreground text-lg prose prose-sm sm:prose-lg max-w-none leading-relaxed font-inter"
                                        dangerouslySetInnerHTML={{ __html: item.desc }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SHOW NOTE ABOVE TOUR CODE (only if note exists) */}
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
                            <p className="text-md md:text-lg text-black font-bold leading-relaxed whitespace-pre-wrap">
                                <strong className="text-xl md:text-lg font-bold text-black">
                                    Note :-{" "}
                                </strong>
                                {booking.noteText}
                            </p>

                        </div>
                    </div>
                )}




                <section className="mb-8 border-2 border-gray-200 rounded-2xl  bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl">
                    {categories.length > 1 && (
                        <div className="col-span-1 mt-4 md:col-span-2">
                            <h2 className="text-xl sm:text-2xl font-extrabold underline mb-2 text-gray-700">
                                Travel Packages Options
                            </h2>

                            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-green-900">
                                We’ve curated two exclusive travel packages just for you.
                                Choose the one that suits your journey best – or explore both!
                            </h2>
                        </div>
                    )}
                    {/* <h1 className="text-2xl my-2    font-bold">
                        <span className="text-red-900 mt-4">
                            Note :-
                        </span>
                        <span className="text-gray-700 font-normal">
                            The above quote is valid for 3 days from the date of
                            quotation. Kindly send your confirmation within the time limit or else the quoted rate might vary.
                        </span>
                    </h1> */}


                    <div className="grid grid-cols-1 gap-8">
                        {categories.map((category, index) => {
                            const hotelData = booking.itineraryData.hotels?.[category];
                            if (!hotelData) return null;
                            const isTwoCategories = categories.length === 2;

                            const dayKeys = Object.keys(hotelData)
                                .filter((k) => !isNaN(k) && !["selected", "category"].includes(k))
                                .map(Number)
                                .sort((a, b) => a - b);

                            if (dayKeys.length === 0) return null;

                            const deepEqual = (a, b) => {
                                return JSON.stringify(a, Object.keys(a || {}).sort()) === JSON.stringify(b, Object.keys(b || {}).sort());
                            };
                            const formatDay = (day) => {
                                return day.toString().padStart(2, '0');
                            };
                            const groups = [];
                            let current = { days: [dayKeys[0]], structure: hotelData[dayKeys[0]] };

                            for (let i = 1; i < dayKeys.length; i++) {
                                const day = dayKeys[i];
                                const prev = dayKeys[i - 1];
                                if (day === prev + 1 && deepEqual(hotelData[prev], hotelData[day])) {
                                    current.days.push(day);
                                } else {
                                    groups.push(current);
                                    current = { days: [day], structure: hotelData[day] };
                                }
                            }
                            groups.push(current);

                            const totalNights = Math.max(...dayKeys);
                            const departureDay = totalNights + 1;

                            const locationNightsMap = {};
                            groups.forEach(group => {
                                Object.keys(group.structure).forEach(loc => {
                                    if (!["selected", "category"].includes(loc)) {
                                        locationNightsMap[loc] = (locationNightsMap[loc] || 0) + group.days.length;
                                    }
                                });
                            });

                            const price = getNumericValue(booking.itineraryData.pricing, category);
                            const offer = getNumericValue(booking.itineraryData.offers, category);
                            const festivalDiscount = Math.round((price - offer) * (festivalValue / 100));
                            const total = getCategoryTotals()[category];
                            const bookingAmount = getNumericValue(booking.itineraryData.bookingAmount, category);
                            const sortedLocations = Object.keys(locationNightsMap);

                            return (
                                <div key={category} className="">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-green-900">
                                        <h3 className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl text-green-900 capitalize font-poppins">
                                            <span key={index}>
                                                {isTwoCategories
                                                    ? `Option ${index + 1} : ${category} Package`
                                                    : `${category} Package`
                                                }
                                            </span>
                                        </h3>
                                    </div>

                                    {categories.length === 2 && (
                                        <div
                                            key={category}
                                            className="bg-white mb-4 border shadow-md rounded-2xl p-4 sm:p-5 md:p-6 w-full min-w-0"
                                        >
                                            <h3 className="text-gray-700 capitalize lg:text-3xl font-extrabold text-xl sm:text-2xl mb-4 break-words">
                                                {category} Package
                                            </h3>

                                            <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
                                                <span>Base Price</span>
                                                <span className="font-semibold">₹{price}/-</span>
                                            </div>

                                            {offer > 0 && (
                                                <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
                                                    <span>Discount</span>
                                                    <span className="font-semibold text-red-500">- ₹{offer}/-</span>
                                                </div>
                                            )}

                                            {festivalValue > 0 && (
                                                <div className="flex justify-between text-yellow-700 mb-2 text-sm sm:text-base">
                                                    <span>{festivalName} ({festivalValue}%)</span>
                                                    <span className="font-semibold">- ₹{festivalDiscount}/-</span>
                                                </div>
                                            )}

                                            <hr className="my-3" />

                                            <div className="flex justify-between text-gray-900 font-bold text-base sm:text-lg">
                                                <span>Total Price</span>
                                                <span>₹{total}/-</span>
                                            </div>

                                            <div className="flex justify-between text-gray-700 mt-1 text-sm sm:text-base">
                                                <span>Booking Amount</span>
                                                <span>₹{bookingAmount}/-</span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    navigate(`/userpayment/${booking?._id}?tab=Optional`)
                                                }
                                                className="
                        mt-6 w-full bg-black text-white 
                        py-3 rounded-xl text-center text-base font-semibold
                    "
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-8">

                                        {/* Pehle saare days ko chronologically process karo */}
                                        {booking?.itineraryData?.days?.map((dayItem) => {
                                            const dayNum = dayItem.id;
                                            const isDayHotelsDisabled = booking.hotelSelectionDays?.[category]?.[dayNum] === true;


                                            const itineraryDay = booking?.itineraryData?.days?.find(d => Number(d.id) === Number(dayNum));
                                            const locations = itineraryDay?.locations?.filter(loc => loc.toLowerCase() !== "departure") || [];

                                            // Agar hotel disabled hai → warning dikhao
                                            if (isDayHotelsDisabled) {
                                                return (
                                                    <div
                                                        key={`no-hotel-${category}-${dayNum}`}
                                                        className="bg-gray-50 border-2  rounded-2xl p-6 mb-8"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {/* <FontAwesomeIcon
                                                                icon={faTriangleExclamation}
                                                                className="w-7 h-7 text-orange-700 flex-shrink-0 mt-1"
                                                            /> */}
                                                            <div className="flex-1">
                                                                <div>
                                                                    <h4 className="font-bold text-lg text-white inline-flex px-3 py-1 rounded-full bg-green-900 mb-2">
                                                                        Night {formatDay(dayNum)}
                                                                    </h4>
                                                                    <br />
                                                                    <h4 className=" mt-2 gap-4 inline-flex flex-wrap bg-green-50 px-3 py-1 rounded-full text-green-700 border border-green-200">
                                                                        {getDateForDays(dayNum)}
                                                                    </h4>
                                                                </div>

                                                                <div>
                                                                    {locations?.length > 0 && (
                                                                        <span className="text-xl capitalize font-bold text-gray-800 mb-4">
                                                                            {" "}  {locations.join(", ")}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-3 mt-4">
                                                                    <FontAwesomeIcon
                                                                        icon={faHotel}
                                                                        size="3x"
                                                                        className="w-6 h-6 text-gray-700 mt-1 flex-shrink-0"
                                                                    />
                                                                    <p className="text-gray-800 text-base leading-relaxed font-medium">
                                                                        No hotels booked for this day. Guest will arrange their own accommodation.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Agar hotel enabled hai → check karo kya is day ka hotel group hai?
                                            const hasHotelData = hotelData?.[dayNum] && Object.keys(hotelData[dayNum]).some(key =>
                                                !["selected", "category"].includes(key)
                                            );

                                            if (!hasHotelData) return null;

                                            // Find the group jisme ye day aata hai
                                            const relevantGroup = groups.find(group => group.days.includes(dayNum));
                                            if (!relevantGroup) return null;

                                            // Sirf pehli baar group render karo (taki duplicate na ho)
                                            const isFirstDayOfGroup = relevantGroup.days[0] === dayNum;
                                            if (!isFirstDayOfGroup) return null;

                                            // Ab group ka full block render karo
                                            const startDay = relevantGroup.days[0];
                                            const endDay = relevantGroup.days[relevantGroup.days.length - 1];
                                            const nights = relevantGroup.days.length;

                                            // === Yahan se mergedBlocks wali puri logic same rahegi ===
                                            const daySignatures = relevantGroup.days.map(day => {
                                                const dayData = hotelData[day] || {};
                                                const signature = { hotels: new Set(), mealMap: {} };

                                                Object.keys(dayData).forEach(location => {
                                                    if (["selected", "category"].includes(location)) return;
                                                    const locData = dayData[location];

                                                    ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                        const options = locData[meal]?.options || locData[meal] || [];
                                                        options.forEach(hotel => {
                                                            const id = getHotelId(hotel);
                                                            if (id) {
                                                                signature.hotels.add(id);
                                                                if (!signature.mealMap[id]) signature.mealMap[id] = new Set();
                                                                signature.mealMap[id].add(meal);
                                                            }
                                                        });
                                                    });
                                                });

                                                const sortedHotels = Array.from(signature.hotels).sort();
                                                const keyParts = sortedHotels.map(id => {
                                                    const meals = Array.from(signature.mealMap[id] || []).sort().join(',');
                                                    return `${id}:${meals || 'none'}`;
                                                });
                                                return {
                                                    day,
                                                    key: keyParts.join('|'),
                                                    raw: dayData,
                                                    mealMap: signature.mealMap
                                                };
                                            });

                                            const mergedBlocks = [];
                                            let currentBlock = null;

                                            daySignatures.forEach(item => {
                                                if (!currentBlock || currentBlock.key !== item.key) {
                                                    currentBlock = {
                                                        days: [item.day],
                                                        key: item.key,
                                                        hotelMealMap: { ...item.mealMap },
                                                        locations: new Set(),
                                                        hotelObjects: {},
                                                        hotelMap: {}
                                                    };
                                                    mergedBlocks.push(currentBlock);
                                                } else {
                                                    currentBlock.days.push(item.day);
                                                    Object.keys(item.mealMap).forEach(hotelId => {
                                                        if (!currentBlock.hotelMealMap[hotelId]) currentBlock.hotelMealMap[hotelId] = new Set();
                                                        item.mealMap[hotelId].forEach(meal => currentBlock.hotelMealMap[hotelId].add(meal));
                                                    });
                                                }

                                                const dayData = hotelData[item.day] || {};
                                                Object.keys(dayData).forEach(location => {
                                                    if (["selected", "category"].includes(location)) return;
                                                    currentBlock.locations.add(location);
                                                    const locData = dayData[location];
                                                    ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                        const options = locData[meal]?.options || locData[meal] || [];
                                                        options.forEach(hotel => {
                                                            const id = getHotelId(hotel);
                                                            if (id && !currentBlock.hotelObjects[id]) {
                                                                currentBlock.hotelObjects[id] = hotel;
                                                                currentBlock.hotelMap[id] = hotel;
                                                            }
                                                        });
                                                    });
                                                });
                                            });

                                            return (
                                                <div key={`hotel-group-${startDay}-${endDay}`} className="bg-white rounded-2xl border border-gray-300 shadow-lg p-6 mb-8">
                                                    {mergedBlocks.map((block, blockIdx) => {
                                                        const blockDays = block.days.sort((a, b) => a - b);
                                                        const firstDay = blockDays[0];
                                                        const lastDay = blockDays[blockDays.length - 1];
                                                        const isMultiDay = blockDays.length > 1;

                                                        return (
                                                            <div key={blockIdx} className="mb-12">
                                                                <div className=" mb-6">
                                                                    <span className="bg-green-900 text-white px-3 py-1 rounded-full font-bold text-lg shadow-md">
                                                                        {isMultiDay
                                                                            ? `Night ${formatDay(firstDay)}-${formatDay(lastDay)} `
                                                                            : `Night ${formatDay(firstDay)} `
                                                                        }
                                                                    </span>
                                                                    <br />

                                                                    {/* pending: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: Clock, dot: "bg-blue-400" }, */}
                                                                    <span className=" mt-4 gap-4 inline-flex flex-wrap bg-green-50 px-3 py-1 rounded-full text-green-700 border border-green-200">
                                                                        {isMultiDay
                                                                            ? `  ${formatRangeDate(firstDay, lastDay)} -`
                                                                            : `  ${getDateForDays(firstDay)} -`
                                                                        }

                                                                        {formatDay(blockDays.length)} {blockDays.length > 1 ? 'Nights' : 'Night'}
                                                                    </span>
                                                                </div>

                                                                <div className="space-y-10">
                                                                    {Array.from(block.locations).map(location => {
                                                                        const hotels = Object.values(block.hotelObjects).filter(
                                                                            h => h?.location?.toLowerCase() === location.toLowerCase()
                                                                        );

                                                                        if (hotels.length === 0) return null;

                                                                        return (
                                                                            <div key={location}>
                                                                                <h5 className="text-xl font-bold text-gray-800 mb-4">
                                                                                    {location.charAt(0).toUpperCase() + location.slice(1)}
                                                                                </h5>

                                                                                <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-evenly lg:gap-6 w-full">
                                                                                    {hotels.map((hotel, i) => {
                                                                                        const hotelId = getHotelId(hotel);
                                                                                        const hotelMeals = Array.from(block.hotelMealMap[hotelId] || []);

                                                                                        return (
                                                                                            <React.Fragment key={hotelId}>
                                                                                                <div className={hotels.length > 1 ? "w-full max-w-[450px]" : "w-full"}>
                                                                                                    <HotelCard
                                                                                                        hotel={hotel}
                                                                                                        checkInDate={getDateForDays(firstDay)}
                                                                                                        checkOutDate={getDateForDays(lastDay + 1)}
                                                                                                        nights={blockDays.length}
                                                                                                        includedMeals={hotelMeals}
                                                                                                    />
                                                                                                </div>
                                                                                                {i < hotels.length - 1 && (
                                                                                                    <>
                                                                                                        <div className="hidden lg:block text-green-900 font-bold text-xl">OR</div>
                                                                                                        <div className="lg:hidden py-2 text-green-900 font-bold text-xl text-center">OR</div>
                                                                                                    </>
                                                                                                )}
                                                                                            </React.Fragment>
                                                                                        );
                                                                                    })}
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
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>


                {/* Policies Tabs */}
                <div className="w-full  mx-auto ">
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
                            {activeTab === "inclusions" && (
                                <div className="space-y-4">
                                    {policies.inclusions.map((item, i) => {
                                        const hasImage = (item.images && item.images.length > 0) || item.image;
                                        return (
                                            <div key={`inc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                                                <button
                                                    onClick={() => toggleAccordion(`inc-${i}`)}
                                                    className="w-full text-left p-4 sm:p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Info className="w-5 h-5 text-green-500" />
                                                        <span className="text-gray-800">{item.title}</span>
                                                    </div>
                                                    <ChevronDown className={`w-5 h-5 text-green-500 transform transition-transform ${expandedItems[`inc-${i}`] ? 'rotate-180' : ''}`} />
                                                </button>
                                                {expandedItems[`inc-${i}`] && (
                                                    <div className="p-4 sm:p-5">
                                                        {hasImage && (
                                                            <div className="float-left mr-4 mb-2">
                                                                {item.images && item.images.length > 0 && (
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

                            {activeTab === "exclusions" && (
                                <div className="space-y-4">
                                    {policies.exclusions.map((item, i) => (
                                        <div key={`exc-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md p-4">
                                            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "termsandconditions" && (
                                <div className="space-y-4">
                                    {policies.termsAndConditions.map((item, i) => (
                                        <div key={`term-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md p-4">
                                            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "cancellationandrefundpolicy" && (
                                <div className="space-y-4">
                                    {policies.cancellationAndRefundPolicy.map((item, i) => (
                                        <div key={`cancel-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md p-4">
                                            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "travelrequirements" && (
                                <div className="space-y-4">
                                    {policies.travelRequirements.map((item, i) => (
                                        <div key={`travel-${i}`} className="border-2 border-gray-200 rounded-xl shadow-md p-4">
                                            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ fontFamily: "Nunito Sans" }} className="p-8 space-y-12">
                    <section className="mt-14 sm:text-lg">
                        <p className=" font-bold text-sm sm:text-lg">{tour?.name}</p>
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
                    <section style={{ fontFamily: "Nunito Sans" }} className="mt-10">
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

                <div className="w-full flex flex-wrap justify-center my-6 bg-cover bg-center rounded-xl bg-[#008236df]">
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


                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 max-w-full  mx-auto">
                    <div className="flex-1 p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Write to us</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                            <div>
                                <label className="text-sm sm:text-lg text-gray-500">Name</label>
                                <input
                                    type="text"
                                    value={booking?.clientDetails?.name || ""}
                                    readOnly
                                    className="border-b rounded-lg w-full p-2 text-sm sm:text-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-sm sm:text-lg text-gray-500">Email</label>
                                <input
                                    type="email"
                                    value={booking?.clientDetails?.email || ""}
                                    readOnly
                                    className="border-b rounded-lg w-full p-2 text-sm sm:text-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-sm sm:text-lg  text-gray-500">Message</label>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="border-b w-full p-2 rounded-2xl resize-none text-sm sm:text-lg"
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
                        <div className="w-full sm:text-lg lg:w-80 xl:w-96 bg-gradient-to-b from-green-50 to-white border border-gray-200 rounded-2xl shadow-md p-6 sm:p-8">
                            <h3 className="text-gray-600 text-sm sm:text-lg uppercase tracking-wide mb-2 font-medium">
                                Contact
                            </h3>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">{booking?.contact.name}</h2>
                            <div className="space-y-4 text-sm sm:text-lg text-gray-700">
                                <div>
                                    <span className="font-semibold block mb-1 text-gray-800">Call To Expert</span>
                                    {(booking?.contact.mobiles || []).map((mobile, index) => {
                                        const cleanMobile = mobile;
                                        return (
                                            <a
                                                key={`mobile-${index}`}
                                                href={`tel:${cleanMobile}`}
                                                className="block hover:text-green-600"
                                            >
                                                {cleanMobile}
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
                                    <span className="text-gray-800 text-sm sm:text-lg font-medium mr-2">
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
  .print-circle {
      width: 450px !important;
      height: 450px !important;
      aspect-ratio: 1 / 1 !important; /* ensures circle */
      border-radius: 50% !important;
      overflow: hidden !important;
  }

  .print-circle img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
  }
 .hero-wrapper {
    min-height: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .hero-left,
  .hero-right {
    width: 50% !important;     /* print me full width */
  }

  /* remove any top gaps created by margin */
  .hero-left * {
    margin-top: 0 !important;
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

export default SendUser;