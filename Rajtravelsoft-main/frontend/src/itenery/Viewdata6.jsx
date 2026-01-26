
"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Phone, Mail, MapPin, CarFront } from "lucide-react";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Solid icons
import { faPrint, faCheckCircle, faTimesCircle, faGlobe } from "@fortawesome/free-solid-svg-icons";

// Brand icons
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import {
    faFacebookF,
    faTwitter,
    faInstagram,
    faLinkedinIn,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import Pdf from "../pending/Pdf";

const StarRating = ({ rating = 4 }) => {
    const total = 5;
    const r = Math.round(Number(rating) || 0);
    return (
        <div className="flex items-center gap-1">
            <span className="text-yellow-500">
                {[...Array(total)].map((_, i) => (
                    <span key={i} className="text-lg">
                        {i + 1 <= r ? "★" : "☆"}
                    </span>
                ))}
            </span>
            <span className="text-xs text-gray-700 ml-1">{Number(rating).toFixed(1)}</span>
        </div>
    );
};

const iconsMap = {
    facebook: faFacebookF,
    twitter: faTwitter,
    instagram: faInstagram,
    linkedin: faLinkedinIn,
    youtube: faYoutube,
    website: faGlobe,
};

const Viewdata6 = ({ id }) => {
    const componentRef = useRef(null);
    const params = useParams();
    const navigate = useNavigate();

    const BASE_URL = "https://apitour.rajasthantouring.in";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [booking, setBooking] = useState(null);
    const [openDayIndex, setOpenDayIndex] = useState(null);
    const [openHotelDayIndex, setOpenHotelDayIndex] = useState(null);
    const [inclusions, setInclusions] = useState([]);
    const [exclusions, setExclusions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [cancellationPolicy, setCancellationPolicy] = useState([]);
    const [travelRequirements, setTravelRequirements] = useState([]);
    const [structureData, setStructureData] = useState(null);
    const [user, setUser] = useState(null);
    const [tour, setTour] = useState(null);
    const [softwareData, setSoftwareData] = useState(null);
    const [form, setForm] = useState({
        packageTitle: "",
        name: "",
        email: "",
        message: "",
        mobile: "",
    });
    const [loadings, setLoadings] = useState(false);
    const [activeTab, setActiveTab] = useState("inclusions");
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");

    const statusColors = {
        confirmed: "bg-green-100 text-green-800",
        pending: "bg-purple-100 text-purple-800",
        cancelled: "bg-red-100 text-red-800",
        approved: "bg-blue-100 text-blue-800",
        completed: "bg-blue-100 text-blue-800",
        rejected: "bg-pink-100 text-pink-800",
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Booking_${id || params.id || "preview"}`,
        onBeforePrint: () => {
            setOpenDayIndex('all');
            return new Promise((resolve) => setTimeout(resolve, 50));
        },
        onAfterPrint: () => setOpenDayIndex(null),
    });

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
    }, [loading, error, bookingData, structureData]);

    useEffect(() => {
        document.title = titleState;
    }, [titleState]);

    const getAllImages = () => {
        const dayImages = bookingData.itineraryData?.days?.flatMap((day) => {
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

    const fallbackImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    const getImageAtIndex = (index) => {
        const allImages = getAllImages();
        return allImages[index] || fallbackImage;
    };

    const transformBooking = (data) => {
        const travelDateStr = data.clientDetails?.travelDate || "22-10-2025"; // fallback
        const [day, month, year] = travelDateStr.split("-").map(Number);
        const startDate = new Date(year, month - 1, day);

        return {
            customerName: data.clientDetails?.name || "Guest",
            nights: data.selectedItinerary?.duration || 0,
            days: (parseInt(data.selectedItinerary?.duration, 10) || 0) + 1,
            price: data.pricing?.mk || data.bookingAmount || 0,
            vehicle: data.itineraryData?.vehicle
                ? { make: data.itineraryData.vehicle.make, model: data.itineraryData.vehicle.model }
                : null,
            itinerary:
                (data.itineraryData?.days || []).map((day ,index) => {


                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + index); // 🔥 correct day increment

                    const d = String(dayDate.getDate()).padStart(2, "0");
                    const m = String(dayDate.getMonth() + 1).padStart(2, "0");
                    const y = String(dayDate.getFullYear()).slice(-2);
                    const dateStr = `${d}-${m}-${y}`;


                    return {
                        id: day.id,
                        day: `Day ${day.id}`,
                        date: dateStr,
                        title: day.titles?.[0] || "Untitled",
                        img: day.images
                            ? day.images.map((img) => `${BASE_URL}${img}`)
                            : (data.itineraryData?.images
                                ? data.itineraryData.images.map((img) => `${BASE_URL}${img}`)
                                : (data.selectedItinerary?.images
                                    ? data.selectedItinerary.images.map((img) => `${BASE_URL}${img}`)
                                    : ["https://via.placeholder.com/800x500"])),
                        desc: day.descriptions?.[0] || "No description available",
                        locations: day.locations || [],
                    };
                }),
        };
    };

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const bookingId = params.id || id;
                const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                const transformed = transformBooking(data);
                setBookingData(data);
                setBooking(transformed);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch booking");
                console.error("Error fetching booking:", err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id || id) fetchBooking();

        axios
            .get(`${BASE_URL}/api/structure`)
            .then((res) => {
                setUser(res.data);
                setStructureData(res.data);
            })
            .catch((err) => console.error(err));

        axios
            .get(`${BASE_URL}/api/tour-inclusion-exclusion`)
            .then((res) => {
                if (res.data?.data) {
                    setInclusions(res.data.data.inclusions || []);
                    setExclusions(res.data.data.exclusions || []);
                    setTerms(res.data.data.termsAndConditions || []);
                    setCancellationPolicy(res.data.data.cancellationAndRefundPolicy || []);
                    setTravelRequirements(res.data.data.travelRequirements || []);
                }
            })
            .catch((err) => console.error(err));

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
    }, [id, params.id]);

    useEffect(() => {
        if (bookingData?.clientDetails) {
            setForm((prev) => ({
                ...prev,
                name: bookingData.clientDetails.name || "",
                email: bookingData.clientDetails.email || "",
                mobile: bookingData.clientDetails.phone || "",
                packageTitle: bookingData?.itineraryData?.titles?.[0] || "",
            }));
        }
    }, [bookingData]);

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
                mobile: form.mobile,
            });
        } catch (err) {
            console.error(err);
            alert("Error submitting inquiry");
        } finally {
            setLoadings(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
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
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    if (!booking) return <div className="p-6 text-center">No booking found</div>;

    const pricing = bookingData?.itineraryData?.pricing || {};
    const offers = bookingData?.itineraryData?.offers || {};
    const festivalOffer = bookingData?.itineraryData?.festivalOffer || null;
    const selectedCategory = Object.keys(pricing).find((key) => pricing[key] > 0);
    const actualAmount = selectedCategory ? pricing[selectedCategory] : bookingData?.totalAmount || 0;
    const offerAmount = selectedCategory ? offers[selectedCategory] || 0 : 0;
    const totalPrice = bookingData?.totalPrice || bookingData.totalAmount || 0;
    const discountedPrice = bookingData?.itineraryData?.highlightPrice || totalPrice;

    const contactData = bookingData.contact || user;

    const allLocations = (bookingData?.itineraryData?.days || []).flatMap((d) => d.locations || []);
    const locationCounts = allLocations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});
    const uniqueLocations = Object.entries(locationCounts).map(([loc, count]) => ({ loc, count }));

    return (
        <div ref={componentRef} className="relative min-h-screen w-full bg-white font-sans text-gray-800">
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

            <div className="flex mx-auto max-w-7xl justify-between items-center py-4 w-full px-4 sm:px-6 mb-4 bg-white">
                <img
                    src={
                        structureData?.logo
                            ? structureData.logo.startsWith("/uploads")
                                ? `${BASE_URL}${structureData.logo}`
                                : structureData.logo
                            : "/logo1.png"
                    }
                    alt="Company Logo"
                    className="h-12 sm:h-16 w-auto object-contain"
                />
                {contactData?.mobiles?.[0] && (
                    <a
                        href={`https://wa.me/${contactData.mobiles[0].replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-600 transition-all flex items-center gap-2 text-xs sm:text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                        {contactData.mobiles[0].replace(/[^0-9]/g, '')}
                    </a>
                )}
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <section className="pt-8 sm:pt-10 md:pt-14">
                    <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 lg:gap-0 justify-between">
                        <div className="w-full lg:w-1/2 order-2 lg:order-1">
                            <h1 className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-gray-900 leading-tight">
                                Hello, <span className="text-purple-700">{booking.customerName}</span>
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">
                                Your exclusive, tailor-made travel package awaits!
                            </p>
                            <div className="mt-4 sm:mt-6 inline-block bg-purple-600 text-white text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1.5 rounded-full font-semibold shadow-md">
                                {booking.nights} Nights / {booking.days} Days
                            </div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900 mt-4 sm:mt-6 leading-snug">
                                {bookingData?.itineraryData?.titles?.[0] || `Premium Package for ${booking.days} Days`}
                            </h3>
                            {festivalOffer && festivalOffer.selected && (
                                <div className="mt-4 bg-purple-50 text-purple-900 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm font-bold text-purple-800">Festival Offer</p>
                                    <p className="text-lg font-semibold">{festivalOffer.name}: {festivalOffer.value}% Off</p>
                                </div>
                            )}
                            <div className="mt-3 sm:mt-4 flex items-baseline gap-2 sm:gap-3">
                                <p className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-purple-700">
                                    ₹{discountedPrice.toLocaleString('en-IN')}/-
                                </p>
                                <span className="text-sm sm:text-md font-medium text-gray-500">{bookingData.itineraryData.priceType}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-700">
                                {uniqueLocations.map(({ loc, count }, i) => (
                                    <p key={`loc-${i}`} className="flex items-center gap-1">
                                        <span className="text-purple-500">•</span> {loc}{count > 1 ? ` (${count})` : ''}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-start max-w-xl gap-6">
                                <button
                                    onClick={() => navigate(`/userpayment/${bookingData?._id}`)}
                                    className="bg-purple-700 text-white px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-purple-200 hover:bg-purple-800 transition-colors w-full sm:w-auto"
                                >
                                    Book Now
                                </button>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="text-xs sm:text-sm border flex items-center px-4 text-gray-800 w-max">
                                        <img src="/gg.webp" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" alt="" />
                                        <div className="text-left ml-2">
                                            <p className="font-semibold">Customer Reviews</p>
                                            <div className="flex items-center gap-2">
                                                <StarRating className="text-yellow-500" rating={softwareData?.rating} />
                                                <span className="text-blue-600 text-xs">{softwareData?.reviews} Google Reviews</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative w-full lg:w-1/2 h-48 sm:h-64 lg:h-[480px] overflow-hidden order-1 lg:order-2 lg:ml-8">
                            <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-50 rounded-xl shadow-lg border border-gray-100">
                                <div className="w-full h-48 sm:h-auto rounded-lg overflow-hidden shadow-md border border-white">
                                    <img
                                        src={getImageAtIndex(0)}
                                        alt="Activity 1"
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                    />
                                </div>
                                <div className="w-full h-48 sm:h-auto rounded-lg overflow-hidden shadow-md border border-white sm:row-span-2">
                                    <img
                                        src={getImageAtIndex(1)}
                                        alt="Scenic View"
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                    />
                                </div>
                                <div className="w-full h-48 sm:h-auto rounded-lg overflow-hidden shadow-md border border-white">
                                    <img
                                        src={getImageAtIndex(2)}
                                        alt="Activity 2"
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-12 flex justify-between flex-wrap gap-4 sm:mt-16">
                    <div className="bg-white w-full rounded-lg shadow border border-gray-200">
                        <div className="bg-gray-50 px-4 sm:px-6 py-4 rounded-t-lg">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Traveler Details</h3>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { label: "Name", value: bookingData?.clientDetails?.name },
                                    { label: "Email", value: bookingData?.clientDetails?.email },
                                    { label: "Phone", value: bookingData?.clientDetails?.phone },
                                    { label: "Adults", value: bookingData?.clientDetails?.adults },
                                    { label: "Kids (5–12)", value: bookingData?.clientDetails?.kids5to12 },
                                    { label: "Kids (Below 5)", value: bookingData?.clientDetails?.kidsBelow5 },
                                    { label: "Rooms", value: bookingData?.clientDetails?.rooms },
                                    { label: "Extra mattress", value: bookingData?.clientDetails?.extraBeds },
                                    {
                                        label: "Travel Date",
                                        value: (() => {
                                            const rawDate = bookingData?.clientDetails?.travelDate;
                                            if (!rawDate) return "";
                                            if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
                                                const [day, month, year] = rawDate.split("-");
                                                return `${day}-${month}-${year}`;
                                            }
                                            const date = new Date(rawDate);
                                            if (isNaN(date)) return "Invalid Date";
                                            const day = String(date.getDate()).padStart(2, "0");
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const year = date.getFullYear();
                                            return `${day}-${month}-${year}`;
                                        })(),
                                    },
                                ]
                                    .filter((item) => item.value !== "" && item.value !== null && item.value !== undefined && item.value !== 0)
                                    .map((item, index) => (
                                        <div key={index} className="p-3 sm:p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">{item.label}</p>
                                            <p className="text-gray-800 font-semibold text-sm sm:text-base break-all">{item.value}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <aside className="w-full  p-4 sm:p-6 bg-purple-50 rounded-xl shadow-xl border border-purple-100 h-fit">
                        <h2 className="text-purple-900 text-lg sm:text-xl font-serif font-bold mb-3">Booking Price Summary</h2>
                        <p className="text-purple-700 text-xs sm:text-sm mt-1 border-b pb-3 font-medium">
                            {[
                                bookingData?.clientDetails?.adults > 0
                                    ? `${bookingData.clientDetails.adults} Adult${bookingData.clientDetails.adults > 1 ? "s" : ""}`
                                    : null,
                                bookingData?.clientDetails?.kids5to12 > 0
                                    ? `${bookingData.clientDetails.kids5to12} Kid${bookingData.clientDetails.kids5to12 > 1 ? "s" : ""} (5–12)`
                                    : null,
                                bookingData?.clientDetails?.rooms > 0
                                    ? `${bookingData.clientDetails.rooms} Room${bookingData.clientDetails.rooms > 1 ? "s" : ""}`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        </p>
                        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                            {offerAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-gray-700 text-base sm:text-lg">
                                        <span className="font-medium">Package Cost:</span>
                                        <span className="line-through text-gray-500">₹{actualAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500 font-semibold text-base sm:text-lg">
                                        <span>Discount:</span>
                                        <span>- ₹{offerAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                </>
                            )}
                            {festivalOffer && festivalOffer.selected && (
                                <div className="bg-purple-100 p-2 rounded-md">
                                    <p className="text-purple-900 font-semibold text-sm">
                                        Festival Offer ({festivalOffer.name}): {festivalOffer.value}% Off
                                    </p>
                                </div>
                            )}
                            {bookingData?.itineraryData?.bookingAmount > 0 && (
                                <div className="flex justify-between text-purple-600 font-semibold text-base sm:text-lg">
                                    <span>Booking Amount:</span>
                                    <span>- ₹{bookingData.itineraryData.bookingAmount.toLocaleString("en-IN")}</span>
                                </div>
                            )}
                            <div className="border-t border-purple-300 pt-3 sm:pt-4"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-base sm:text-lg font-bold text-gray-900">Total Amount:</span>
                                <span className="text-2xl sm:text-4xl font-serif font-extrabold text-purple-700">
                                    ₹{totalPrice.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                            <button
                                onClick={() => navigate(`/userpayment/${bookingData?._id}`)}
                                className="w-full bg-purple-700 text-white py-3 rounded-lg font-bold hover:bg-purple-800 transition-colors shadow-md text-sm"
                            >
                                Pay Now & Confirm
                            </button>
                            <button
                                className="w-full px-4 py-2 cursor-pointer bg-white text-purple-700 rounded-lg border border-purple-700 hover:bg-purple-50 transition-colors text-sm"
                                onClick={handlePrint}
                            >
                                <FontAwesomeIcon icon={faPrint} className="mr-2 w-3 h-3" />
                                Download PDF / Print
                            </button>
                        </div>
                    </aside>
                </section>

                <section className="mt-12 sm:mt-16">
                    <div className="flex flex-col border-r border-l lg:flex-row gap-6 sm:gap-10">
                        <div className="w-full ">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900 border-b pb-2 sm:pb-3 mb-4 sm:mb-6">
                                Detailed Itinerary <span className="text-purple-500">{booking.nights} Nights</span>
                            </h1>
                            {bookingData?.itineraryData?.tourcode && (
                                <h1 className="text-xl sm:text-2xl md:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2 border-b-2 border-purple-300 pb-3 mb-6">
                                    <span className="text-gray-700">Tour Code:</span>
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-semibold tracking-wide">
                                        {bookingData.itineraryData.tourcode}
                                    </span>
                                </h1>
                            )}
                            {Array.isArray(bookingData?.itineraryData?.descriptions) && bookingData.itineraryData.descriptions.length > 0 && (
                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    {bookingData.itineraryData.descriptions.map((desc, i) => (
                                        <div key={i} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded border border-gray-200">
                                            <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                {i + 1}
                                            </span>
                                            <div className="ql-editor text-gray-700 leading-relaxed font-medium text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: desc }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-8 sm:space-y-12">
                                {(booking.itinerary || []).map((item, index) => (
                                    <div key={`it-day-${index}`} className="flex flex-col sm:flex-row gap-3">
                                        <div className="md:w-22 flex md:flex-col sm:w-22 sm:text-right text-left order-1">
                                            <p className="text-purple-500 font-bold text-base sm:text-lg">{item.day}</p>
                                            {item.date && <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{item.date}</p>}
                                        </div>
                                        <div className="relative md:flex hidden flex-col items-center w-6 sm:w-8 self-stretch order-2 -mt-2 sm:-mt-1">
                                            {index !== booking.itinerary.length - 1 && (
                                                <div className="absolute top-4 bottom-0 w-0.5 bg-gray-200"></div>
                                            )}
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-3 border-purple-600 bg-white z-10 shadow-md"></div>
                                        </div>
                                        <div className="flex-1 order-3 -mt-2 sm:-mt-1">
                                            <button
                                                onClick={() => setOpenDayIndex(openDayIndex === index ? null : index)}
                                                className="w-full text-left font-serif font-semibold text-base sm:text-xl text-gray-900 flex items-center justify-between"
                                            >
                                                <span className="hover:text-purple-600 transition-colors">{item.title}</span>
                                            </button>
                                            {(item.locations || []).length > 0 && (
                                                <p className="text-gray-700 text-xs sm:text-sm mt-1">
                                                    <span className="font-semibold text-purple-600">Visits:</span> {item.locations.map((l, i) => (i ? `, ${l}` : l))}
                                                    {item.locations.length > 4 ? "…" : ""}
                                                </p>
                                            )}
                                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg shadow-inner flex flex-col md:flex-row gap-3 sm:gap-4">
                                                <div className="w-full sm:w-[300px] flex-none flex-shrink-0">
                                                    <Swiper
                                                        modules={[Pagination, Autoplay]}
                                                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                                                        loop={true}
                                                        spaceBetween={10}
                                                        className="rounded-lg overflow-hidden md:w-[300px] h-40 md:h-48 mt-3 sm:mt-4"
                                                    >
                                                        {item.img.map((imgUrl, idx) => (
                                                            <SwiperSlide key={idx}>
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={item.title + " image " + (idx + 1)}
                                                                    className="object-cover w-full h-40 sm:h-48 sm:h-60 rounded-lg"
                                                                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                                                />
                                                            </SwiperSlide>
                                                        ))}
                                                    </Swiper>
                                                </div>
                                                <div className="w-full sm:w-2/3 text-gray-800 text-xs sm:text-sm">
                                                    {booking?.vehicle && (
                                                        <p className="font-semibold bg-purple-700 px-2 py-1 rounded-lg text-white mb-2 inline-flex gap-2 text-xs sm:text-sm">
                                                            <CarFront className="text-white" /> {booking.vehicle.make} / {booking.vehicle.model}
                                                        </p>
                                                    )}
                                                    <div
                                                        className="ql-editor text-muted-foreground text-xs sm:text-sm sm:text-lg prose prose-sm sm:prose-lg max-w-none leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: item.desc }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>

                {bookingData.itineraryData?.vehicle && (
                    <section className="mt-12 sm:mt-16">
                        <div className="bg-white rounded-lg shadow border border-gray-200">
                            <div className="bg-gray-50 px-4 sm:px-6 py-4 rounded-t-lg">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Vehicle Details</h3>
                            </div>
                            <div className="p-4 sm:p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 sm:p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Vehicle Information</h4>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Vehicle Type</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {bookingData.itineraryData.vehicle.type || "N/A"}
                                                </p>
                                            </div>
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Make / Model</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {bookingData.itineraryData.vehicle.make} {bookingData.itineraryData.vehicle.model} (
                                                    {bookingData.itineraryData.vehicle.year})
                                                </p>
                                            </div>
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Color</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {bookingData.itineraryData.vehicle.color || "N/A"}
                                                </p>
                                            </div>
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Price</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    ₹{bookingData.itineraryData.vehicle.price}/km
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Additional Info</h4>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Owner</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {bookingData.itineraryData.vehicle.owner || "N/A"}
                                                </p>
                                            </div>
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Registration Expiry</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {new Date(bookingData.itineraryData.vehicle.regExpiry).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                <span className="text-gray-600 text-xs sm:text-sm">Notes</span>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {bookingData.itineraryData.vehicle.notes || "N/A"}
                                                </p>
                                            </div>
                                            {bookingData.itineraryData.vehicle.image && (
                                                <div className="p-2 sm:p-3 rounded border border-gray-200">
                                                    <span className="text-gray-600 text-xs sm:text-sm">Vehicle Image</span>
                                                    <img
                                                        src={`${BASE_URL}${bookingData.itineraryData.vehicle.image}`}
                                                        alt="Vehicle"
                                                        className="rounded mt-2 w-full sm:w-48 border h-32 sm:h-auto"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {bookingData.itineraryData?.hotels && Object.keys(bookingData.itineraryData.hotels).length > 0 && (
                    <section className="mt-12 sm:mt-16">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900 border-b pb-2 sm:pb-3 mb-4 sm:mb-6">
                            Hotels & Dining
                        </h1>
                        <div className="space-y-4 sm:space-y-6">
                            {Object.entries(bookingData.itineraryData.hotels).map(([day, cities]) => {
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
                                            grouped.set(id, { hotel: entry.data, meals: [] });
                                        }
                                        grouped.get(id).meals.push(entry.type);
                                    });
                                    Array.from(grouped.values()).forEach(group => {
                                        allGroups.push({ ...group, city });
                                    });
                                });
                                return (
                                    <div key={day} className="space-y-3 sm:space-y-4">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 sm:pb-2">
                                            Day {day}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {allGroups.map((group, gIndex) => (
                                                <div key={gIndex} className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-purple-50 shadow">
                                                    <h6 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                                        {group.meals.join(' & ')} at {group.hotel.name} in <span className="bg-purple-700 text-white px-2 rounded-2xl">{group.city}</span>
                                                    </h6>
                                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                        <a href={group.hotel.googleReviewLink} target="_blank"
                                                            rel="noopener noreferrer">
                                                            <img
                                                                src={`${BASE_URL}${group.hotel.image}`}
                                                                alt={group.hotel.name}
                                                                className="w-full sm:w-20 h-24 sm:h-20 object-cover rounded mb-2 sm:mb-3"
                                                                onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                                            />
                                                        </a>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">{group.hotel.name}</p>
                                                            <p className="text-xs sm:text-sm text-gray-600">{group.hotel.location}</p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{group.hotel.category}</p>
                                                            {group.hotel.rating && (
                                                                <div className="flex items-center gap-1 mb-1 sm:mb-2">
                                                                    <StarRating rating={group.hotel.rating} />
                                                                    <span className="text-xs sm:text-sm font-medium">{group.hotel.rating}</span>
                                                                    <span className="text-xs sm:text-sm text-gray-500">({group.hotel.reviews} reviews)</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 sm:mt-2 space-y-1">
                                                        <p className="text-xs sm:text-sm text-gray-500">
                                                            Check-in: {new Date(group.hotel.checkIn).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-500">
                                                            Check-out: {new Date(group.hotel.checkOut).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                                                        <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm text-gray-700 space-y-1">
                                                            {group.meals.map((m, mIndex) => (
                                                                <li key={mIndex}>{m}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="mt-12 sm:mt-16">
                    <div className="w-full">
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-4 sm:mb-6">Important Information</h2>
                        <div className="flex gap-4 sm:gap-8 border-b border-gray-200 font-bold overflow-x-auto whitespace-nowrap pb-2 sm:pb-3">
                            {["Inclusions", "Exclusions", "Terms & Conditions", "Cancellation & Refund Policy", "Payment Policy"].map((tab) => {
                                const key = tab.toLowerCase().replace(/ & /g, " & ");
                                return (
                                    <button
                                        key={tab}
                                        className={`pb-2 sm:pb-3 transition-all text-xs sm:text-base ${activeTab === key ? "text-purple-700 border-b-2 border-purple-700" : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        onClick={() => setActiveTab(key)}
                                    >
                                        {tab}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 sm:mt-6 text-gray-700 space-y-2 sm:space-y-3">
                            {activeTab === "inclusions" && (
                                <ul className="list-none space-y-1 sm:space-y-2 text-sm sm:text-base">
                                    {(inclusions || []).map((item, i) => (
                                        <li key={`inc-${i}`} className="flex items-start gap-2 sm:gap-3">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                            {item}
                                        </li>
                                    ))}
                                    {(!inclusions || inclusions.length === 0) && (
                                        <>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Accommodation in mentioned hotels or similar.
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Daily breakfast and dinner as per itinerary.
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Private vehicle for transfers and sightseeing.
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                All applicable taxes and service charges.
                                            </li>
                                        </>
                                    )}
                                </ul>
                            )}
                            {activeTab === "exclusions" && (
                                <ul className="list-none space-y-1 sm:space-y-2 text-sm sm:text-base">
                                    {(exclusions || []).map((item, i) => (
                                        <li key={`exc-${i}`} className="flex items-start gap-2 sm:gap-3">
                                            <FontAwesomeIcon icon={faTimesCircle} className="text-purple-500 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                            {item}
                                        </li>
                                    ))}
                                    {(!exclusions || exclusions.length === 0) && (
                                        <>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-purple-500 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Personal expenses (laundry, phone calls, tips, etc.).
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-purple-500 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Meals not mentioned in the itinerary.
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-purple-500 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Entry fees to monuments, museums, or parks.
                                            </li>
                                            <li className="flex items-start gap-2 sm:gap-3">
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-purple-500 mt-1 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                                Travel insurance.
                                            </li>
                                        </>
                                    )}
                                </ul>
                            )}
                            {activeTab === "terms & conditions" && (
                                <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                    {(terms || []).map((item, i) => (
                                        <li key={`term-${i}`}>{item}</li>
                                    ))}
                                    {(!terms || terms.length === 0) && (
                                        <>
                                            <li>Package rates are subject to change without prior notice.</li>
                                            <li>Booking is confirmed only after advance payment.</li>
                                            <li>Cancellation charges apply as per company policy.</li>
                                            <li>Hotels and vehicles are subject to availability at the time of booking.</li>
                                        </>
                                    )}
                                </ul>
                            )}
                            {activeTab === "cancellation & refund policy" && (
                                <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                    {(cancellationPolicy || []).map((item, i) => (
                                        <li key={`cancel-${i}`}>{item}</li>
                                    ))}
                                    {(!cancellationPolicy || cancellationPolicy.length === 0) && (
                                        <>
                                            <li>Cancellations made 30 days prior to departure will incur a 10% cancellation fee.</li>
                                            <li>Cancellations made 15-29 days prior to departure will incur a 50% cancellation fee.</li>
                                            <li>No refunds for cancellations within 14 days of departure.</li>
                                        </>
                                    )}
                                </ul>
                            )}
                            {activeTab === "Payment Policy" && (
                                <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                    {(travelRequirements || []).map((item, i) => (
                                        <li key={`travel-${i}`}>{item}</li>
                                    ))}
                                    {(!travelRequirements || travelRequirements.length === 0) && (
                                        <>
                                            <li>Valid passport with at least 6 months validity required.</li>
                                            <li>Visa may be required depending on the destination.</li>
                                            <li>Travel insurance is recommended.</li>
                                        </>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>

              <div className="print:hidden">
                    <Pdf />
                </div>
                <section className="mt-14">
                    <p className="font-serif font-bold text-sm">{tour?.name}</p>
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

                <section className="mt-8 sm:mt-10">
                    <h3 className="font-serif font-bold mb-3 sm:mb-4 underline text-lg">Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {tour?.achievements?.map((ach, index) => (
                            <img
                                key={index}
                                src={`${BASE_URL}${ach.imageUrl}`}
                                alt="achievement"
                                className="w-full h-32 sm:h-48 md:h-56 object-cover rounded-lg"
                                onError={(e) => { e.currentTarget.src = fallbackImage; }}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-12 sm:mt-20 mb-8 sm:mb-12 border-t pt-6 sm:pt-8 border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-10">
                        <div className="flex-1 p-4 sm:p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-4 sm:mb-6 text-gray-900">Quick Inquiry</h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                                <input type="hidden" value={form.packageTitle} readOnly />
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        disabled
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="border border-gray-300 w-full p-2 sm:p-3 rounded-lg text-sm bg-white outline-none focus:border-purple-600 transition-colors"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">Email</label>
                                        <input
                                            type="email"

                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="border border-gray-300 w-full p-2 sm:p-3 rounded-lg text-sm bg-white outline-none focus:border-purple-600 transition-colors"
                                            required
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">Mobile</label>
                                        <input
                                            type="tel"
                                            value={form.mobile}
                                            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                            className="border border-gray-300 w-full p-2 sm:p-3 rounded-lg text-sm bg-white outline-none focus:border-purple-600 transition-colors"
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 block mb-1">Your Message</label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="border border-gray-300 w-full p-2 sm:p-3 resize-none text-sm bg-white rounded-lg outline-none focus:border-purple-600 transition-colors"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loadings}
                                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg mt-3 sm:mt-4 text-sm sm:text-base font-bold transition-colors shadow-md ${loadings ? "bg-gray-400 cursor-not-allowed text-white" : "bg-purple-700 hover:bg-purple-800 text-white shadow-purple-300"
                                        }`}
                                >
                                    {loadings ? "Sending..." : "Send Inquiry"}
                                </button>
                            </form>
                        </div>
                        {contactData && (
                            <div className="w-full lg:w-96 p-4 sm:p-8 bg-purple-700 rounded-xl shadow-2xl text-white">
                                <h3 className="text-purple-200 text-sm sm:text-base mb-1">Talk to Your Agent</h3>
                                <h2 className="text-2xl sm:text-3xl font-serif font-extrabold mb-4 sm:mb-5">{contactData.name}</h2>
                                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                                    <p>
                                        <span className="font-bold text-purple-200 flex items-center gap-2">
                                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                                            Call Us
                                        </span>
                                        {(contactData.mobiles || []).map((mobile, index) => {
                                            const cleanMobile = mobile.replace(/^tel:\+?91/, "");
                                            return (
                                                <a
                                                    key={`mobile-${index}`}
                                                    href={`tel:+91${cleanMobile}`}
                                                    className="text-white block hover:text-purple-300 transition-colors"
                                                >
                                                    +91 {cleanMobile}
                                                </a>
                                            );
                                        })}
                                    </p>
                                    <p>
                                        <span className="font-bold text-purple-200 flex items-center gap-2">
                                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                                            Email
                                        </span>
                                        {(contactData.emails || []).map((email, index) => {
                                            const cleanEmail = email.replace(/^mailto:/, "");
                                            return (
                                                <a
                                                    key={`email-${index}`}
                                                    href={`mailto:${cleanEmail}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white block hover:text-purple-300 transition-colors break-all"
                                                >
                                                    {cleanEmail}
                                                </a>
                                            );
                                        })}
                                    </p>
                                    <p>
                                        <span className="font-bold text-purple-200 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                                            Address
                                        </span>
                                        <span className="text-white block text-xs sm:text-sm">
                                            {contactData.addresses?.[0]
                                                ? `${contactData.addresses[0].street}, ${contactData.addresses[0].area}, ${contactData.addresses[0].city}, ${contactData.addresses[0].state} ${contactData.addresses[0].pincode}`
                                                : "Head Office, Jaipur, Rajasthan"}
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-6 sm:mt-8 border-t border-purple-600 pt-4 sm:pt-5">
                                    <span className="text-purple-200 mr-2 text-xs sm:text-sm font-semibold">Connect:</span>
                                    {contactData.socialLinks &&
                                        Object.entries(contactData.socialLinks).map(([platform, link]) => {
                                            if (!link) return null;
                                            return (
                                                <a
                                                    key={platform}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 sm:ml-3 text-lg sm:text-xl text-purple-300 hover:text-white transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={iconsMap[platform]} />
                                                </a>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <footer className="text-center text-gray-500 text-xs sm:text-sm py-4 sm:py-6 border-t border-gray-100">
                    © {softwareData?.year || new Date().getFullYear()} {softwareData?.companyName || "Rajasthan Tourism"}. All rights reserved.
                </footer>
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
    );
};

export default Viewdata6;
