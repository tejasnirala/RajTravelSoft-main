import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { useReactToPrint } from "react-to-print";

// Solid icons
import { faPrint, faGlobe, faCoffee, faUtensils, faMoon, faCar, faCheckCircle, faTimesCircle, faFileContract, faUndoAlt, faPlane, faCircleInfo, faHotel, faLocationDot, faCalendar, faCircle, faLocationPin, faLocationPinLock, faLocationArrow, faUserGroup, faWallet, faTriangleExclamation, faBed, faClock, faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";

// Regular icons
import { faArrowAltCircleDown, faStar } from "@fortawesome/free-regular-svg-icons";
import { FaStar, FaRegStar, FaArrowDown, FaChevronDown } from "react-icons/fa";

// Brand icons
import { faWhatsapp, faFacebookF, faTwitter, faInstagram, faLinkedinIn, faYoutube } from "@fortawesome/free-brands-svg-icons";
import Pdf from './Pdf';
import { ArrowLeft, ArrowRight, Bed, Calendar, Car, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Coffee, Globe, Hotel, MapPin, Moon, Pointer, Utensils } from 'lucide-react';

const safeDateString = (dateStr) => {
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
};


// --- Hero Image Slider ---
const HeroSlider = ({ images }) => {
    if (!images || images.length === 0) {
        return (
            <div className="absolute inset-0">
                <img src="/banner-fallback.jpg" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60" />
            </div>
        );
    }

    return (
        <Swiper
            id="hero-slider"
            modules={[Navigation, Autoplay]}
            loop={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            speed={1200}
            navigation={{
                nextEl: ".hero-next-btn",
                prevEl: ".hero-prev-btn"
            }}
            className="h-full w-full"
        >
            {images.map((img, index) => (
                <SwiperSlide key={index}>
                    <div className="relative w-full h-screen">
                        <img
                            src={img.startsWith('http') ? img : `https://apitour.rajasthantouring.in${img}`}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
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

const StarRating = ({ rating = 0 }) => {
    const total = 5;
    const r = Math.max(0, Math.min(5, Number(rating))); // limit 0–5

    return (
        <div className="flex items-center gap-1">
            {[...Array(total)].map((_, i) => {
                const fillPercent = Math.min(Math.max(r - i, 0), 1) * 100; // % of fill for each star
                return (
                    <div key={i} className="relative w-3 h-3">
                        {/* Empty outline star */}
                        <FaRegStar className="absolute top-0 left-0 text-gray-300 w-3 h-3" />

                        {/* Yellow filled part */}
                        <div
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercent}%` }}
                        >
                            <FaStar className="text-yellow-500 w-3 h-3" />
                        </div>
                    </div>
                );
            })}
            <span className="text-xs text-gray-700 ml-1">{r.toFixed(1)}</span>
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

// --- Custom Image Slider (For Itinerary Cards) ---
const CustomSlider = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevSlide = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextSlide = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="relative group w-full h-full">
            <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 relative">
                <img
                    src={images[currentIndex].startsWith('http') ? images[currentIndex] : `https://apitour.rajasthantouring.in${images[currentIndex]}`}
                    alt="Slide"
                    className="w-full h-full object-cover transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            {images.length > 1 && (
                <>
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 p-2 bg-white/80 rounded-full cursor-pointer hover:bg-white text-gray-800 transition z-10 shadow-sm opacity-0 group-hover:opacity-100" onClick={prevSlide}>
                        <ArrowLeft size={16} />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-white/80 rounded-full cursor-pointer hover:bg-white text-gray-800 transition z-10 shadow-sm opacity-0 group-hover:opacity-100" onClick={nextSlide}>
                        <ArrowRight size={16} />
                    </div>
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                        {images.map((_, slideIndex) => (
                            <div
                                key={slideIndex}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(slideIndex); }}
                                className={`transition-all duration-300 cursor-pointer rounded-full ${currentIndex === slideIndex ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"
                                    }`}
                            ></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const viewdatasenduser4 = ({ id: propId, autoDownload, onDownloadComplete }) => {
    const params = useParams();
    const id = params.id || propId;
    const navigate = useNavigate();
    const componentRef = useRef(null);
    const BASE_URL = "https://apitour.rajasthantouring.in";

    const [booking, setBooking] = useState(null);
    const [policies, setPolicies] = useState({
        inclusions: [],
        exclusions: [],
        termsAndConditions: [],
        cancellationAndRefundPolicy: [],
        travelRequirements: [],
    });

    const [user, setUser] = useState(null);

    const [form, setForm] = useState({
        packageTitle: "",
        name: "",
        email: "",
        message: "",
    });
    const [loadings, setLoadings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [userHotelSelections, setUserHotelSelections] = useState({});
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState("inclusions");
    const [openDayIndex, setOpenDayIndex] = useState(null);

    // Viewdata4 states
    const [softwareData, setSoftwareData] = useState(null);
    const [tour, setTour] = useState(null);
    const [structureData, setStructureData] = useState(null);
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");

    const [pdfLoading, setPdfLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const isPuppeteer = searchParams.get("print") === "1";
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [pdfStatus, setPdfStatus] = useState("");
    // New: Construct the correct itinerary URL for PDF generation
    const [itineraryUrl, setItineraryUrl] = useState('');
    const [expandedItems, setExpandedItems] = useState({});
    // Scroll state for Design 4 Header
    const [scrolled, setScrolled] = useState(false);
    const [openCategory, setOpenCategory] = useState(null);

    const [activeTabs, setActiveTabs] = useState('stays');

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

    // Automatically trigger print when ready
    useEffect(() => {
        if (autoDownload && id && booking && componentRef.current && itineraryUrl) {
            // Wait a short delay to ensure rendering and DOM updates complete
            const timer = setTimeout(() => {
                handlePrint();
            }, 300); // 200–500ms is usually enough

            return () => clearTimeout(timer);
        }
    }, [autoDownload, id, booking, componentRef.current, itineraryUrl]);



    const getNumericValue = (field, category) => {
        const val = field?.[category];
        if (typeof val === 'number') return val;
        return val?.value || 0;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // ⭐ Add this: Start with loading
            setError(null); // ⭐ Reset error early

            try {
                let bookingResponse = null;

                // 👉 STEP 1: Try Pending API — but only accept if status 200
                try {
                    const res = await axios.get(`${BASE_URL}/api/pending/${id}`); // ⭐ Use BASE_URL for consistency
                    const sssssssss = await axios.get(`https://apitour.rajasthantouring.in/api/ssr-data/${id}`);
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
                        const res = await axios.get(`${BASE_URL}/api/previewPending/${id}`);
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



                console.log("Final Used API Response:", bookingResponse);


                // 👉 Use MAIN data (from pending or preview)
                const data = bookingResponse.data;
                setBooking(data); // ⭐ If SSR needed: setBooking({ ...data, ...ssrData });

                if (data && Object.keys(data.hotelSelections || {}).length > 0) {
                    const categories = Object.keys(data.hotelSelections);
                    setSelectedCategory(data.selectedCategory || categories[0]);
                }

                // Set policies from booking data instead of API
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
                    setItineraryUrl(`${base}/Senduser${data.theme.link}/${id}`);
                } else {
                    // Fallback to current location if no theme.link
                    setItineraryUrl(window.location.href);
                }

                // Fetch additional Viewdata4 data
                const softwareRes = await axios.get(`${BASE_URL}/api/toursoftware`);
                if (softwareRes.data && softwareRes.data.length > 0) {
                    setSoftwareData(softwareRes.data[0]);
                }

                const tourRes = await axios.get(`${BASE_URL}/api/achivement`);
                setTour(tourRes.data);

                const structureRes = await axios.get(`${BASE_URL}/api/structure`);
                setStructureData(structureRes.data);

            } catch (err) {
                console.error("Outer Error (main data fetch failed):", err);
                setError('Failed to load data'); // Only set if core data fails
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);


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
        if (booking?.clientDetails) {
            setForm((prev) => ({
                ...prev,
                name: booking.clientDetails.name || "",
                email: booking.clientDetails.email || "",
                packageTitle: booking?.itineraryData?.titles?.[0] || "",
            }));
        }
    }, [booking]);
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


    useEffect(() => {
        if (loading) {
            setTitleState("Loading Booking...");
            setDescriptionState("Loading booking details...");
            setOgDescriptionState("Loading...");
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
    }, [loading, booking, structureData]);

    useEffect(() => {
        if (booking) {
            setIsVehicleConfirmed(booking.vehicleConfirmed || booking.status === 'confirmed' || false);
            if (booking.itineraryData?.vehicle) {
                const vehicles = Array.isArray(booking.itineraryData.vehicle) ? booking.itineraryData.vehicle : [booking.itineraryData.vehicle];
                const preSelected = vehicles.find(v => v.selected === true);

                console.log(vehicles, preSelected);

                if (preSelected) {
                    setSelectedVehicleId(getVehicleId(preSelected));
                } else if (vehicles.length > 0) {
                    setSelectedVehicleId(getVehicleId(vehicles[0]));

                    handleVehicleSelect(getVehicleId(vehicles[0]))

                } else {
                    setSelectedVehicleId(null);
                }
            } else {
                setSelectedVehicleId(null);
            }
        }
    }, [booking, isEditMode]);

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
            await axios.put(`https://apitour.rajasthantouring.in/api/pending/${id}`, {
                itineraryData: {
                    ...booking.itineraryData,
                    vehicle: updatedVehicles,
                },
                vehicleConfirmed: true,
            });
            const response = await axios.get(`https://apitour.rajasthantouring.in/api/pending/${id}`);
            setBooking(response.data);
        } catch (err) {
            setError('Failed to confirm vehicle selection');
            setSelectedVehicleId(null);
        }
    };



    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!booking) return <div className="p-6 text-center">Booking not found</div>;

    const calculateDuration = (itinerary) => {
        const totalDays = itinerary.days?.length || 0;
        const nights = Math.max(0, totalDays - 1);
        return `${totalDays} Days ${nights} Nights`;
    };

    const getDateForDay = (dayNumber) => {
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

    const categoryTotals = getCategoryTotals();
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

        return `${sDate}-${eDate} ${sMonth} ${sYear}`;
    };


    // Viewdata4 calculations
    const categories = Object.keys(booking.hotelSelections || {});
    const festivalValue = booking.itineraryData.festivalOffer?.value || 0;
    const festivalName = booking.itineraryData.festivalOffer?.name || booking.itineraryData.festivalOffer?.title || '';
    let vehicles = booking.itineraryData.vehicle;
    if (!Array.isArray(vehicles)) vehicles = [vehicles].filter(Boolean);
    const vehicleOptions = vehicles || [];

    const pricing = booking?.itineraryData?.pricing || {};
    const offers = booking?.itineraryData?.offers || {};
    const festivalOffer = booking?.itineraryData?.festivalOffer || null;
    const selectedCategorys = Object.keys(pricing).find((key) => pricing[key]?.value > 0) || selectedCategory;
    const actualAmount = selectedCategorys ? (pricing[selectedCategorys]?.value || pricing[selectedCategorys] || 0) : (booking?.totalAmount || 0);
    const offerAmount = selectedCategorys ? (offers[selectedCategorys]?.value || offers[selectedCategorys] || 0) : 0;
    const totalPrice = booking?.totalAmount || 0;
    const discountedPrice = booking?.itineraryData?.highlightPrice?.[selectedCategorys] || 0;
    const festivalDiscount = (festivalOffer?.selected ? ((actualAmount - offerAmount) * festivalOffer.value) / 100 : 0);
    const totalSavings = offerAmount + festivalDiscount;

    const days = booking?.itineraryData?.days || [];

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

    // Step 3: Fill missing from day-wise images (still skip departure days)
    if (selectedImages.length < 3) {
        const dayWiseImages = days
            .map(day => {
                const isDepartureDay = (day.locations || []).some(
                    loc => loc.toLowerCase() === "departure"
                );
                if (isDepartureDay) return null; // ⛔ Skip these days completely

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

        while (selectedImages.length < 3 && dayWiseImages.length > 0) {
            const img = dayWiseImages.shift();
            if (!selectedImages.includes(img)) {
                selectedImages.push(img);
            }
        }
    }

    // Step 4: Shuffle
    const shuffled = [...selectedImages].sort(() => Math.random() - 0.5);

    // Step 5: Assign with fallback images
    const mainCircleImage = shuffled[0] || "/r1.jpg";
    const smallCircleImage = shuffled[1] || "/r2.png";
    const thirdCircleImage = shuffled[2] || "/r3.png";

    const allLocations = (booking?.itineraryData?.days || []).flatMap(
        (d) => d.locations || []
    );

    const locationCounts = allLocations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});

    let uniqueLocations = Object.entries(locationCounts).map(([loc, count]) => ({
        loc,
        count,
    }));

    // 👇 Last location remove (safe way)
    uniqueLocations = uniqueLocations.slice(0, -1);

    console.log(uniqueLocations);


    let heroImages = [];
    // Collect all valid images
    const allImages = new Set();
    days.forEach(day => {
        const locs = day.locations || [];
        if (locs.some(l => l.toLowerCase() === 'departure')) return;
        (day.images || []).forEach(img => allImages.add(img));
    });
    // Shuffle
    heroImages = Array.from(allImages).sort(() => Math.random() - 0.5);
    // Fallback if no images found
    if (heroImages.length === 0 && booking.itineraryData?.images) {
        heroImages = booking.itineraryData.images;
    }
    if (heroImages.length === 0) heroImages = ["/banner-fallback.jpg"];

    const totalPax =
        Number(booking?.clientDetails?.adults || 0) +
        Number(booking?.clientDetails?.kids5to12 || 0) +
        Number(booking?.clientDetails?.kidsBelow5 || 0);

    const transformBooking = (data) => {
        const daysLength = data.itineraryData?.days?.length || 0;
        let travelDate = data.clientDetails?.travelDate;
        let startDate;

        if (travelDate) {
            // Normalize separators
            const normalized = travelDate.replace(/\//g, "-");

            // Split by "-"
            const [day, month, year] = normalized.split("-");

            // Convert to valid JS format yyyy-mm-dd
            startDate = new Date(`${year}-${month}-${day}`);
        } else {
            startDate = new Date();
        }
        return {
            customerName: data?.clientDetails?.name || "Guest",
            nights: daysLength > 0 ? daysLength - 1 : 0,
            days: daysLength,
            price: data?.itineraryData?.pricing?.mk || data.bookingAmount || 0,
            vehicle: data?.itineraryData?.vehicle
            ,
            itinerary:
                data?.itineraryData?.days?.map((day, index) => {
                    let dateStr = "";
                    if (startDate) {
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + index);
                        // Format output as dd/mm/yyyy
                        dateStr = dayDate.toLocaleDateString("en-GB");
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
                                    : ["https://via.placeholder.com/300x200"]),
                        desc: day.descriptions?.[0] || "No description available",
                        locations: day.locations || [],
                    };
                }) || [],
        };
    };

    console.log(totalPrice);


    const transformedBooking = transformBooking(booking);

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

    const mealIcons = {
        breakfast: faCoffee,
        lunch: faUtensils,
        dinner: faMoon
    };




    return (
        <div ref={componentRef} style={{ fontFamily: "'PoltawskiNowy'" }} className="relative font-[Poltawski_Nowy] overflow-hidden min-h-screen w-full  antialiased">
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



            <div className="relative mx-auto   text-gray-900">


                {/* Header */}
                <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
                    <div className=" mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <img
                            src={structureData?.logo ? (structureData.logo.startsWith("/uploads") ? `${BASE_URL}${structureData.logo}` : structureData.logo) : "/logo1.png"}
                            alt="Logo"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <div className="flex items-center gap-3">
                            {booking?.contact?.mobiles?.[0] && (
                                <a href={`https://wa.me/${booking.contact.mobiles[0].replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${scrolled ? 'bg-green-600 text-white' : 'bg-white/20 backdrop-blur-sm text-white border border-white/40'}`}>
                                    <FontAwesomeIcon icon={faWhatsapp} name="whatsapp" className="w-5 h-5" /> <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                            )}
                            <button onClick={handlePrint} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${scrolled ? 'bg-red-900 text-white' : 'bg-white text-red-900'}`} disabled={pdfLoading}>
                                <FontAwesomeIcon icon={faPrint} size={18} /> <span className="hidden sm:inline">{pdfLoading ? pdfStatus || "Generating..." : "PDF"}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                {/* Hero Section - 100% Match with your uploaded image */}
                <div className="relative w-full h-screen overflow-hidden">
                    <HeroSlider images={heroImages} />

                    {/* Premium Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10 pointer-events-none"></div>

                    {/* Main Text Content - EXACTLY like your image */}
                    {/* Main Text Content - EXACT SAME POSITION LIKE SAMPLE IMAGE */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center"
                        style={{ transform: "translateY(-40px)" }}  // ↑ Moves text slightly upward like sample
                    >

                        {/* Name - Golden Handwriting */}
                        <h2
                            className="text-[65px] md:text-[80px] font-dancing font-bold mb-0 pb-0 text-[#fdb813]"
                            style={{
                                fontFamily: "Dancing Script, cursive",
                                textShadow: '4px 4px 15px rgba(0,0,0,0.7)',
                            }}
                        >
                            {booking.clientDetails.name ? `${booking.clientDetails.name}'s` : "Your"}
                        </h2>

                        {/* RAJASTHAN - BIG & Compact Spacing */}
                        <h1
                            className="text-[80px] mt-0 pt-0 md:text-[140px] font-black text-white leading-[0.8] tracking-[0.05em]"

                        >
                            RAJASTHAN
                        </h1>
                        <div className='inline-flex gap-3'>



                            {/* Days | Nights Badge */}
                            <div className="mt-5 flex items-center bg-white/10 backdrop-blur-lg border border-yellow-500/30 px-3 rounded-xl shadow-2xl"
                                style={{ paddingTop: "0px", paddingBottom: "0px", lineHeight: "1" }}>

                                <span className="text-xl md:text-2xl font-bold text-white tracking-wider drop-shadow-lg leading-none">
                                    {booking.itineraryData.duration}
                                </span>
                            </div>


                            {/* TRIP - right aligned effect */}
                            <h3
                                className="md:text-[45px] text-[25px] font-black text-white"

                            >
                                TRIP
                            </h3>
                        </div>

                    </div>


                    {/* WORKING Left/Right Arrows - Ab kaam karenge! */}
                    <button
                        className="absolute hero-prev-btn left-6 md:left-10 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-md p-4 rounded-full hover:bg-white/40 transition-all duration-300 shadow-2xl"
                    >
                        <ChevronLeft size={40} className="text-white" />
                    </button>

                    <button
                        className="absolute hero-next-btn right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-md p-4 rounded-full hover:bg-white/40 transition-all duration-300 shadow-2xl"
                    >
                        <ChevronRight size={40} className="text-white" />
                    </button>
                </div>






                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-20 mt-12">

                    <div className="w-full  p-6 bg-white">

                        <div className="flex items-center justify-between gap-4 mb-8">

                            {/* Typographic Lockup Container */}
                            <div className="relative shrink-0 flex flex-col items-center justify-center">

                                {/* Layer 1: Background "DETAILS" (Gray, Block, Condensed) */}
                                <h2 className="text-4xl  md:text-5xl font-bold font-['Oswald'] text-gray-300 uppercase  leading-none select-none">
                                    You'll Love
                                </h2>

                                {/* Layer 2: Foreground "Itinerary" (Orange, Script, Overlapping) */}
                                <span className="itinerary-text  absolute -top-3 md:-top-6 font-['Dancing_Script'] text-3xl md:text-4xl font-bold text-orange-500 transform -rotate-3 tracking-wide bg-white/0">
                                    Itinerary
                                </span>

                            </div>

                            {/* Pagoda Icon placeholder based on image */}
                            <div className="text-orange-400 opacity-80">
                                <img src="/artbord.avif" alt="" />
                            </div>


                        </div>
                        {/* The horizontal line - made thinner (h-px) to match the elegance of the image */}
                        <div className="h-px flex-1 bg-gray-200 mt-2"></div>

                        {/* Optional: Lower section matching the "Pranajit's trip..." part of the image 
         to show how the rest of the design fits.
      */}
                        <div className="flex w-full mt-4 justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-lg">
                                    <span className="font-bold text-gray-900">{booking.clientDetails.name}</span> {booking.itineraryData.days.length} Days trip to
                                </p>
                                <h1 className="text-4xl font-bold text-orange-500 font-['Oswald'] mt-1">
                                    Rajasthan
                                </h1>
                                <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                                    <span>{booking.itineraryData.days.length}D</span>
                                    <span>☀️</span>
                                    <span>|</span>
                                    <span>{booking.itineraryData.days.length - 1}N</span>
                                    <span>🌙</span>
                                </div>
                            </div>


                        </div>

                    </div>
                    <div className="flex flex-col lg:flex-row gap-8">



                        {/* LEFT COLUMN */}
                        <div className="w-full lg:w-2/3 space-y-8">

                            {/* ITINERARY */}
                            <div className="space-y-6">

                                {booking.itineraryData.days.map((day, index) => {
                                    const isOpen = openDayIndex === index;
                                    const hasImages = (day.images?.length > 0 || booking.itineraryData.images?.length > 0);

                                    return (
                                        <div key={day.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                                            <div
                                                onClick={() => setOpenDayIndex(isOpen ? null : index)}
                                                className="cursor-pointer p-5 flex items-center justify-between bg-white"
                                            >
                                                <div className="flex items-center gap-5 w-full">
                                                    <div className="flex flex-col items-center justify-center bg-[#ffeceb] text-[#d12c2c] w-[70px] h-[70px] rounded-xl flex-shrink-0 border border-red-100">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">DAY</span>
                                                        <span className="text-2xl font-['Oswald'] font-bold leading-none">{String(index + 1).padStart(2, '0')}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2">
                                                            {day.titles[0]}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar size={14} className="text-orange-500" />
                                                                {getDateForDays(index + 1)}
                                                            </span>
                                                            {day.locations?.filter(l => l.toLowerCase() !== 'departure').length > 0 && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin size={14} className="text-blue-500" />
                                                                    {day.locations.filter(l => l.toLowerCase() !== 'departure').join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 transition-transform duration-300 ml-2 ${isOpen ? 'rotate-180 bg-gray-100' : ''}`}>
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                </div>
                                            </div>

                                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="p-5 pt-0 border-t border-dashed border-gray-100 mt-2">
                                                    {hasImages && (
                                                        <div className="mt-4 mb-5 rounded-xl overflow-hidden shadow-sm h-52 sm:h-64 md:h-72">
                                                            <CustomSlider images={day.images?.length > 0 ? day.images : booking.itineraryData.images || []} />
                                                        </div>
                                                    )}

                                                    <div
                                                        className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-['Manrope']"
                                                        dangerouslySetInnerHTML={{ __html: day.descriptions[0] }}
                                                    />
                                                    {/* 
                                                    {(showVehicleEverywhere && universalVehicle) && (
                                                        <div className="mt-5 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                                <Car size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-blue-900 uppercase">Vehicle Included</p>
                                                                <p className="text-sm text-gray-700 font-medium">{universalVehicle.model}</p>
                                                            </div>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

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
                            </div>


                            <section className="mb-8 border-2 rounded-2xl overflow-hidden  shadow-lg hover:shadow-xl border-gray-200 bg-white">
                                <div className="flex items-center justify-between p-5 border-b-2  bg-white shadow-sm">

                                    {/* LEFT: ICON + TEXT */}
                                    <div className="flex items-center gap-4">
                                        <p className='mr-[15px] w-[56px] h-[56px] flex items-start'>
                                            <svg xmlns='http://www.w3.org/2000/svg' width={'100%'} height={'100%'} viewBox='0 0 56 56' fill='none'>
                                                <path d='M35.323 6.69822C40.4211 7.28433 44.521 10.9243 45.6961 15.8744C45.8528 16.5379 45.9693 17.4964 46.0457 18.7498C46.3446 23.6564 46.6338 28.5677 46.9133 33.4839C46.9148 33.5087 46.9258 33.532 46.9442 33.549C46.9625 33.566 46.9868 33.5754 47.012 33.5753C48.9125 33.5739 50.607 34.778 51.0814 36.6582C51.1655 36.989 51.2081 37.4885 51.2091 38.1569C51.2139 41.2151 51.2144 44.2733 51.2105 47.3316C51.209 49.2916 49.7597 50.8657 47.9506 51.2791C47.2441 51.4416 45.0926 51.5722 44.4281 51.1645C44.3827 51.1365 44.3425 51.1418 44.3077 51.1805C43.4392 52.1187 42.5 52.8779 41.4903 53.4582C40.0119 54.3069 39.0849 55.0932 37.2845 55.0932C31.1187 55.0961 24.9529 55.0966 18.7871 55.0947C17.5974 55.0947 16.7299 54.819 15.6752 54.1546C14.1968 53.2232 12.8868 52.4891 11.6841 51.179C11.6483 51.1404 11.6086 51.1346 11.5651 51.1616C10.889 51.5722 8.72594 51.4474 8.00925 51.269C5.75039 50.7061 4.77547 48.9942 4.78128 46.7614C4.78901 43.7448 4.79046 40.7281 4.78563 37.7115C4.78128 35.2916 6.66003 33.6522 8.97257 33.5579C9.04318 33.555 9.08041 33.5182 9.08428 33.4476C9.37154 28.455 9.66072 23.5432 9.95185 18.7121C10.0263 17.4818 10.1482 16.5238 10.3174 15.8381C11.5608 10.7981 15.5751 7.34962 20.6745 6.68516C20.748 6.67549 20.7843 6.63342 20.7833 6.55894C20.7761 5.94962 20.7471 5.25615 20.8617 4.6976C21.2157 2.97552 22.6389 1.61179 24.2797 1.13449C25.7755 0.699254 28.6335 0.882052 30.2395 0.918322C32.5245 0.969099 34.6905 2.42568 35.146 4.73967C35.2476 5.25905 35.1983 5.96993 35.2258 6.59521C35.2287 6.65711 35.2611 6.69145 35.323 6.69822ZM29.7709 4.0578C31.5554 4.07811 32.1589 4.76433 32.0951 6.54298C32.0931 6.58651 32.1139 6.60827 32.1574 6.60827L33.1701 6.60682C33.1933 6.60682 33.2156 6.5977 33.2322 6.58141C33.2487 6.56513 33.2582 6.54299 33.2586 6.51977C33.2644 5.18796 33.2934 4.31749 32.1168 3.5007C31.4901 3.06547 30.8063 2.84882 30.0654 2.85076C28.8468 2.85269 27.6262 2.85801 26.4037 2.86672C25.1966 2.87542 24.3871 2.99293 23.5587 3.75894C22.7579 4.50029 22.5838 5.51438 22.7796 6.56185C22.7854 6.5928 22.8043 6.60827 22.8362 6.60827H23.8053C23.8721 6.60827 23.903 6.5749 23.8982 6.50817C23.7889 4.83397 24.5515 4.00509 26.186 4.02153C27.3815 4.03217 28.5764 4.04426 29.7709 4.0578ZM30.134 6.0607C30.1341 6.05556 30.133 6.05046 30.1311 6.04571C30.1291 6.04095 30.1263 6.03663 30.1226 6.03298C30.119 6.02934 30.1147 6.02645 30.1099 6.02447C30.1052 6.02249 30.1001 6.02147 30.0949 6.02146L25.9022 6.01415C25.8918 6.01413 25.8818 6.01824 25.8745 6.02557C25.8671 6.03291 25.863 6.04286 25.863 6.05325L25.8621 6.56102C25.8621 6.56616 25.8631 6.57126 25.865 6.57601C25.867 6.58077 25.8699 6.58509 25.8735 6.58874C25.8771 6.59238 25.8814 6.59528 25.8862 6.59725C25.8909 6.59923 25.896 6.60025 25.9012 6.60026L30.0939 6.60757C30.1043 6.60759 30.1143 6.60348 30.1216 6.59615C30.129 6.58881 30.1331 6.57886 30.1332 6.56848L30.134 6.0607ZM13.692 38.4688C14.5334 34.2079 18.0153 30.9102 22.2472 30.0862C22.9049 29.9576 23.8667 29.8865 25.1328 29.8729C27.0188 29.8526 28.9053 29.8497 30.7923 29.8642C32.0757 29.8739 33.039 29.9402 33.6822 30.063C38.0636 30.8943 41.5425 34.2963 42.3346 38.6762C42.4526 39.3252 42.5107 40.2881 42.5087 41.5647C42.5058 44.416 42.5058 47.2687 42.5087 50.1229C42.5089 50.1314 42.5115 50.1397 42.5163 50.1467C42.5211 50.1538 42.5278 50.1593 42.5357 50.1625C42.5436 50.1658 42.5522 50.1666 42.5606 50.165C42.5689 50.1634 42.5766 50.1593 42.5827 50.1533C44.7173 47.9395 45.6888 45.2724 45.4973 42.1523C45.0486 34.8385 44.6075 27.5236 44.1742 20.2079C44.0775 18.5694 44.0084 17.6056 43.9668 17.3165C43.237 12.1764 38.9775 8.54796 33.8026 8.55231C30.3575 8.55521 26.9114 8.55715 23.4644 8.55811C22.1074 8.55811 21.1427 8.60067 20.5701 8.68578C16.0292 9.36039 12.2426 13.1469 11.967 17.8083C11.5143 25.4229 11.066 33.0376 10.6221 40.6522C10.5331 42.1833 10.4983 43.1485 10.5176 43.548C10.6405 46.051 11.6004 48.2528 13.3974 50.1533C13.405 50.1616 13.4148 50.1673 13.4257 50.1698C13.4365 50.1723 13.4479 50.1715 13.4583 50.1674C13.4686 50.1633 13.4775 50.1562 13.4838 50.1469C13.49 50.1377 13.4933 50.1268 13.4932 50.1156C13.4884 47.2044 13.4888 44.2845 13.4946 41.3558C13.4975 40.0821 13.5633 39.1197 13.692 38.4688ZM20.2379 53.0984C24.9229 53.1516 30.0277 53.1589 35.5523 53.1202C36.5896 53.1129 39.14 52.8083 39.8683 51.9349C40.3161 51.3971 40.5424 50.7694 40.5473 50.0518C40.556 48.4782 40.5555 45.5771 40.5458 41.3486C40.542 40.1406 40.4709 39.2329 40.3326 38.6255C39.584 35.3424 36.8841 32.7745 33.6053 32.0506C32.9834 31.9132 32.022 31.8441 30.7212 31.8431C28.7346 31.8421 26.7489 31.8441 24.7643 31.8489C23.7768 31.8508 22.9958 31.9161 22.4213 32.0447C19.1121 32.7875 16.3295 35.3786 15.6345 38.7473C15.5136 39.3325 15.4522 40.2958 15.4503 41.6373C15.4474 44.3628 15.4488 47.0879 15.4546 49.8124C15.4561 50.8816 15.7608 51.9857 16.8445 52.4195C17.9451 52.8586 19.0763 53.0849 20.2379 53.0984Z'
                                                    fill='#202020' ></path>

                                                <path d='M28.3984 12.4738C21.6349 12.3331 16.6993 15.3217 15.5663 22.2593C15.3733 23.4431 13.8732 23.5331 13.657 22.5117C13.6174 22.327 13.6358 22.0218 13.7122 21.5963C14.674 16.2124 17.9847 12.2214 23.4599 11.0201C26.6091 10.3295 29.7539 10.3566 32.8943 11.1014C38.3028 12.3838 41.4829 16.5911 42.3389 21.9329C42.5072 22.9803 41.3277 23.6854 40.6473 22.8236C40.3644 22.4653 40.273 21.5513 40.1395 20.9724C38.7743 15.033 34.0869 12.5913 28.3984 12.4738Z' fill='#202020'></path>
                                                <path d='M31.6423 15.561H24.3594C23.833 15.561 23.4062 15.9878 23.4062 16.5142V16.5577C23.4062 17.0841 23.833 17.5109 24.3594 17.5109H31.6423C32.1687 17.5109 32.5955 17.0841 32.5955 16.5577V16.5142C32.5955 15.9878 32.1687 15.561 31.6423 15.561Z' fill='#202020'></path>
                                                <path d='M48.5619 17.0587L48.4374 17.067C47.937 17.1002 47.5582 17.5329 47.5914 18.0334L47.6668 19.1683C47.7001 19.6688 48.1327 20.0475 48.6332 20.0143L48.7577 20.006C49.2582 19.9728 49.6369 19.5401 49.6037 19.0396L49.5283 17.9047C49.4951 17.4043 49.0624 17.0255 48.5619 17.0587Z' fill='#202020'></path>
                                                <path d='M7.46075 18.0352L7.40571 18.032C6.88177 18.0018 6.43254 18.402 6.40233 18.926L6.07646 24.5775C6.04625 25.1015 6.4465 25.5507 6.97045 25.5809L7.02549 25.5841C7.54943 25.6143 7.99866 25.214 8.02887 24.6901L8.35474 19.0386C8.38495 18.5146 7.9847 18.0654 7.46075 18.0352Z' fill='#202020'></path>
                                                <path d='M48.7972 21.3647L48.7479 21.368C48.2227 21.4029 47.8252 21.857 47.86 22.3822L48.3029 29.0498C48.3378 29.5751 48.7919 29.9726 49.3171 29.9377L49.3664 29.9344C49.8916 29.8995 50.2891 29.4455 50.2543 28.9202L49.8114 22.2526C49.7765 21.7274 49.3224 21.3298 48.7972 21.3647Z' fill='#202020'></path>
                                                <path d='M6.97115 27.0533L6.84944 27.0471C6.3501 27.0218 5.92481 27.4061 5.89951 27.9055L5.83962 29.0878C5.81432 29.5871 6.19861 30.0124 6.69794 30.0377L6.81965 30.0439C7.31899 30.0692 7.74428 29.6849 7.76958 29.1856L7.82947 28.0032C7.85477 27.5039 7.47048 27.0786 6.97115 27.0533Z' fill='#202020'></path>
                                                <path d='M30.4133 33.7378H25.5851C25.0635 33.7378 24.6406 34.1606 24.6406 34.6823V34.7403C24.6406 35.2619 25.0635 35.6847 25.5851 35.6847H30.4133C30.9349 35.6847 31.3577 35.2619 31.3577 34.7403V34.6823C31.3577 34.1606 30.9349 33.7378 30.4133 33.7378Z' fill='#202020'  ></path>
                                                <path d='M35.2727 42H20.7273C20.3256 42 20 42.3256 20 42.7273C20 46.7439 23.2561 50 27.2727 50H28.7273C32.7439 50 36 46.7439 36 42.7273C36 42.3256 35.6744 42 35.2727 42Z' fill='#F37022' stroke='black' strokeWidth='2'></path>
                                            </svg>

                                        </p>

                                        {/* Title + Subtitle */}
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Trip Summary</h2>
                                            <p className="text-gray-600 text-sm">
                                                Consolidated view of all your itinerary events at one place!
                                            </p>
                                        </div>
                                    </div>

                                    {/* RIGHT: DOWN ARROW */}
                                    <ChevronDown size={20} className="text-gray-600" />

                                </div>

                                <div className=" p-4  bg-white">
                                    {categories.length > 1 && (
                                        <section className="mb-6 border-b-2 border-red-900 pb-2">
                                            <h2 className="text-xl sm:text-2xl underline font-semibold mb-4 text-gray-700">
                                                Travel Packages Options
                                            </h2>
                                            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-red-900">
                                                We’ve curated two exclusive travel packages just for you. Choose the one that suits your journey best – or explore both!
                                            </h2>
                                        </section>
                                    )}

                                    {/* --- TABS FOR STAYS / TRANSFERS --- */}
                                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                                        <button
                                            onClick={() => setActiveTabs('stays')}
                                            className={`pb-2 px-4 font-bold text-lg transition-colors relative ${activeTabs === 'stays'
                                                ? 'text-red-900 border-b-4 border-red-900'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Bed size={20} />
                                                Stays (Hotels)
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTabs('transfers')}
                                            className={`pb-2 px-4 font-bold text-lg transition-colors relative ${activeTabs === 'transfers'
                                                ? 'text-red-900 border-b-4 border-red-900'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Car size={20} />
                                                Transfers (Vehicles)
                                            </div>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                                        {categories.map((category, index) => {

                                            // --- RENDER CONTENT BASED ON ACTIVE TAB ---
                                            if (activeTabs === 'stays') {
                                                const hotelsByCategory = booking.itineraryData.hotels?.[category] || {};

                                                // Step 1: Valid days logic
                                                const validDays = Object.keys(hotelsByCategory)
                                                    .filter(key => !isNaN(parseInt(key)))
                                                    .map(Number)
                                                    .filter(day => {
                                                        const dayData = hotelsByCategory[day];
                                                        if (!dayData) return false;
                                                        return Object.keys(dayData).some(loc =>
                                                            !['selected', 'category'].includes(loc) &&
                                                            Object.values(dayData[loc] || {}).some(mealObj =>
                                                                mealObj?.options?.length > 0
                                                            )
                                                        );
                                                    })
                                                    .sort((a, b) => a - b);

                                                if (validDays.length === 0 && !booking.hotelSelectionDays?.[category]) return null;

                                                // Fingerprint function
                                                const getFingerprint = (day) => {
                                                    const dayData = hotelsByCategory[day];
                                                    if (!dayData) return '';
                                                    const parts = [];
                                                    Object.keys(dayData)
                                                        .filter(loc => !['selected', 'category'].includes(loc))
                                                        .sort()
                                                        .forEach(loc => {
                                                            const locMeals = dayData[loc];
                                                            ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                                const options = locMeals[meal]?.options || [];
                                                                if (options.length > 0) {
                                                                    const hotelIds = options
                                                                        .map(h => getHotelId(h))
                                                                        .filter(Boolean)
                                                                        .sort()
                                                                        .join('-');
                                                                    if (hotelIds) parts.push(`${loc}|${meal}|${hotelIds}`);
                                                                }
                                                            });
                                                        });
                                                    return parts.sort().join('||');
                                                };

                                                // Grouping Logic
                                                const groups = [];
                                                let currentGroup = null;
                                                validDays.forEach(day => {
                                                    const fingerprint = getFingerprint(day);
                                                    if (currentGroup && currentGroup.fingerprint === fingerprint && day === currentGroup.endDay + 1) {
                                                        currentGroup.days.push(day);
                                                        currentGroup.endDay = day;
                                                    } else {
                                                        currentGroup = {
                                                            days: [day],
                                                            startDay: day,
                                                            endDay: day,
                                                            fingerprint,
                                                            data: hotelsByCategory[day]
                                                        };
                                                        groups.push(currentGroup);
                                                    }
                                                });

                                                return (
                                                    <div key={`stay-${category}`} className="bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm mb-8">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                                            <h3 className="font-bold text-xl sm:text-2xl md:text-3xl text-red-900 capitalize">
                                                                {categories.length === 2 ? `Option ${index + 1} : ${category} Package` : `${category} Package`}
                                                            </h3>

                                                            {/* ⭐ DROPDOWN BUTTON */}
                                                            <button
                                                                onClick={() => setOpenCategory(openCategory === category ? null : category)}
                                                                className="px-3 py-1 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 transition flex items-center gap-2"
                                                            >

                                                                {openCategory === category ? (
                                                                    <ChevronUp size={14} className="transition-all duration-300" />
                                                                ) : (
                                                                    <ChevronDown size={14} className="transition-all duration-300" />
                                                                )}
                                                            </button>

                                                        </div>


                                                        {/* MAIN CONTENT */}
                                                        {openCategory === category &&

                                                            <div
                                                                className={`transition-all duration-500 ease-in-out overflow-hidden 
    ${openCategory === category ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"}`}
                                                            >
                                                                <div className={`space-y-8  `}>
                                                                    {booking?.itineraryData?.days?.map((dayItem) => {
                                                                        const dayNum = dayItem.id;
                                                                        const isDisabled = booking.hotelSelectionDays?.[category]?.[dayNum] === true;
                                                                        const itineraryDay = booking?.itineraryData?.days?.find(d => Number(d.id) === Number(dayNum));
                                                                        const locations = itineraryDay?.locations?.filter(loc => loc.toLowerCase() !== "departure") || [];

                                                                        // Case 1: Hotel disabled → Warning
                                                                        if (isDisabled) {
                                                                            return (
                                                                                <div key={`no-hotel-${category}-${dayNum}`} className="flex gap-4 opacity-75">
                                                                                    <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                                                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 overflow-hidden">
                                                                                            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Day</span>
                                                                                            <span className="text-2xl sm:text-3xl font-bold text-gray-400">
                                                                                                {String(dayNum).padStart(2, "0")}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-3 bg-gray-100 border-l-4 border-gray-400 rounded-r-xl p-5">
                                                                                            <Hotel size={24} className="text-gray-500" />
                                                                                            <p className="text-gray-700 text-base leading-relaxed">
                                                                                                No hotels booked for this day. Guest will arrange their own accommodation.
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        // Case 2: Hotel enabled
                                                                        const relevantGroup = groups.find(g => g.days.includes(dayNum));
                                                                        if (!relevantGroup) return null;
                                                                        if (relevantGroup.startDay !== dayNum) return null;

                                                                        const { startDay, endDay, days: groupDays } = relevantGroup;
                                                                        const isMultiDay = startDay !== endDay;
                                                                        const checkIn = getDateForDays(startDay);
                                                                        const checkOut = getDateForDays(endDay + 1);
                                                                        const pad = (num) => String(num).padStart(2, "0");

                                                                        // Formatting dates for display
                                                                        const formatDayMonth = (dateStr) => {
                                                                            if (!dateStr) return "";
                                                                            const parts = dateStr.split(" ");
                                                                            return `${parts[0]} ${parts[1]}`;
                                                                        };

                                                                        return (
                                                                            <div key={`hotel-group-${startDay}`} className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-fadeIn">
                                                                                {/* LEFT: Calendar Day Widget */}
                                                                                <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                                                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 overflow-hidden relative group">
                                                                                        <div className="absolute top-0 w-full h-1 bg-orange-500"></div>
                                                                                        <span className="text-[10px] sm:text-xs text-orange-500 font-bold uppercase tracking-wider mt-1">Day</span>
                                                                                        <span className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                                                                                            {pad(startDay)}
                                                                                        </span>
                                                                                        <div className="hidden sm:block w-px h-full bg-gray-200 mx-auto mt-2"></div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* RIGHT: Content Area */}
                                                                                <div className="flex-1 pb-8 sm:border-b sm:border-gray-100 sm:last:border-0">
                                                                                    {/* Orange Header Bar */}
                                                                                    <div className="bg-orange-50 rounded-xl p-3 sm:px-5 sm:py-3 flex flex-wrap justify-between items-center mb-6 border border-orange-100 shadow-sm">
                                                                                        <div className="flex flex-col sm:items-center gap-1">
                                                                                            <span className="font-bold text-gray-800 text-lg">{checkIn}</span>
                                                                                            <span className="text-orange-600 font-bold">
                                                                                                {isMultiDay ? `${groupDays.length} Nights` : '1 Night'} Stay
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center text-gray-600 font-medium text-sm sm:text-base mt-2 sm:mt-0">
                                                                                            <MapPin className="mr-2 text-orange-400" size={16} />
                                                                                            {locations.length > 0 ? locations.join(", ") : "Destination"}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Hotels Rendering */}
                                                                                    <div className="space-y-6">
                                                                                        {(() => {
                                                                                            const sampleDay = groupDays[0];
                                                                                            const dayData = hotelsByCategory[sampleDay] || {};

                                                                                            return Object.keys(dayData)
                                                                                                .filter(loc => !['selected', 'category'].includes(loc))
                                                                                                .map(location => {
                                                                                                    const locationData = dayData[location];
                                                                                                    const hotelsForThisBlock = [];

                                                                                                    ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                                                                        const options = locationData[meal]?.options || [];
                                                                                                        options.forEach(hotel => {
                                                                                                            const id = getHotelId(hotel);
                                                                                                            let existing = hotelsForThisBlock.find(h => getHotelId(h) === id);
                                                                                                            if (!existing) {
                                                                                                                existing = { ...hotel, meals: [] };
                                                                                                                hotelsForThisBlock.push(existing);
                                                                                                            }
                                                                                                            if (!existing.meals.includes(meal)) existing.meals.push(meal);
                                                                                                        });
                                                                                                    });

                                                                                                    if (hotelsForThisBlock.length === 0) return null;

                                                                                                    return (
                                                                                                        <div key={location} className="space-y-6">
                                                                                                            {hotelsForThisBlock.map((hotel, hIdx, arr) => (
                                                                                                                <div key={getHotelId(hotel)} className="relative">
                                                                                                                    <div className="flex flex-col sm:flex-row gap-5 items-start group">
                                                                                                                        {/* Circular Image */}
                                                                                                                        <div className="flex-shrink-0 relative">
                                                                                                                            {hotel.image ? (
                                                                                                                                <img src={`https://apitour.rajasthantouring.in${hotel.image}`} alt={hotel.name}
                                                                                                                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300" />
                                                                                                                            ) : (
                                                                                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center text-gray-400">
                                                                                                                                    <Hotel size={32} />
                                                                                                                                </div>
                                                                                                                            )}
                                                                                                                        </div>

                                                                                                                        {/* Hotel Details */}
                                                                                                                        <div className="flex-1 min-w-0">
                                                                                                                            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                                                                                                                                {hotel.name}
                                                                                                                            </h4>

                                                                                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                                                                                <span className="text-sm text-gray-500 font-medium">
                                                                                                                                    {hotel.roomType || category} Room
                                                                                                                                </span>
                                                                                                                                {hotel.rating > 0 && (
                                                                                                                                    <>
                                                                                                                                        <span className="text-gray-300">•</span>
                                                                                                                                        <StarRating rating={hotel.rating} />
                                                                                                                                    </>
                                                                                                                                )}
                                                                                                                                {hotel.reviews > 0 && <p className="text-xs text-gray-400">({hotel.reviews} Reviews)</p>}
                                                                                                                            </div>

                                                                                                                            {/* Meal Logic */}
                                                                                                                            <div className="mt-3 w-full items-center">
                                                                                                                                {hotel.meals.map((meal) => {
                                                                                                                                    let bgColor = "";
                                                                                                                                    let icon = null;
                                                                                                                                    let label = "";

                                                                                                                                    switch (meal) {
                                                                                                                                        case "breakfast":
                                                                                                                                            bgColor = "bg-amber-600";
                                                                                                                                            icon = Coffee;
                                                                                                                                            label = "Breakfast";
                                                                                                                                            break;
                                                                                                                                        case "lunch":
                                                                                                                                            bgColor = "bg-orange-600";
                                                                                                                                            icon = Utensils;
                                                                                                                                            label = "Lunch";
                                                                                                                                            break;
                                                                                                                                        case "dinner":
                                                                                                                                            bgColor = "bg-red-700";
                                                                                                                                            icon = Moon;
                                                                                                                                            label = "Dinner";
                                                                                                                                            break;
                                                                                                                                        case "stayOnly":
                                                                                                                                            bgColor = "bg-cyan-700";
                                                                                                                                            icon = Bed;
                                                                                                                                            label = "Stay Only";
                                                                                                                                            break;
                                                                                                                                        default: return null;
                                                                                                                                    }
                                                                                                                                    return (
                                                                                                                                        <span key={meal} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold shadow mr-2 ${bgColor}`}>
                                                                                                                                            {icon && React.createElement(icon, { size: 12 })}
                                                                                                                                            {label}
                                                                                                                                        </span>
                                                                                                                                    );
                                                                                                                                })}
                                                                                                                                <br />
                                                                                                                                {/* Stay Duration Pill */}
                                                                                                                                <div className="inline-flex mt-3 items-center gap-2 text-cyan-600 bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full text-xs font-semibold">
                                                                                                                                    <Clock size={12} />
                                                                                                                                    <span>
                                                                                                                                        {groupDays.length} {groupDays.length > 1 ? 'Nights' : 'Night'} ({formatDayMonth(checkIn)} - {formatDayMonth(checkOut)})
                                                                                                                                    </span>
                                                                                                                                </div>
                                                                                                                            </div>

                                                                                                                            {hotel.googleReviewLink && (
                                                                                                                                <a href={hotel.googleReviewLink} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-blue-500 underline hover:text-blue-700">
                                                                                                                                    View Photos
                                                                                                                                </a>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {/* Divider for OR logic */}
                                                                                                                    {hIdx < arr.length - 1 && (
                                                                                                                        <div className="my-6 flex items-center gap-4">
                                                                                                                            <div className="h-px bg-gray-200 flex-1"></div>
                                                                                                                            <span className="text-red-900 text-sm font-bold uppercase bg-white px-2">OR</span>
                                                                                                                            <div className="h-px bg-gray-200 flex-1"></div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    );
                                                                                                });
                                                                                        })()}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                );
                                            }


                                        })}
                                    </div>
                         
                                    {activeTabs === "transfers" && (
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">

                                            <h3 className="font-bold text-2xl text-red-900 mb-6 pb-4 border-b border-gray-300">
                                                Vehicle Details
                                            </h3>

                                            {booking.itineraryData.vehicle?.length === 0 && (
                                                <p className="text-gray-500 italic">No vehicle information available.</p>
                                            )}

                                            {booking.itineraryData.vehicle?.length > 0 && (
                                                <div className="space-y-8">
                                                    {booking.itineraryData.days.map((day, index) => {
                                                        const v = booking.itineraryData.vehicle[0];

                                                        return (
                                                            <div key={index} className="flex flex-col sm:flex-row gap-6">

                                                                {/* Left Day Widget */}
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-20 h-20 bg-white border border-gray-300 rounded-xl shadow-sm flex flex-col justify-center items-center relative">
                                                                        <div className="absolute top-0 w-full h-1 bg-blue-600"></div>
                                                                        <span className="text-xs text-blue-700 font-bold">Day</span>
                                                                        <span className="text-2xl font-bold text-gray-800">
                                                                            {String(index + 1).padStart(2, "0")}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Right Vehicle Card */}
                                                                <div className="flex-1 border-b border-gray-200 pb-6">
                                                                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center gap-6">

                                                                        {/* Image */}
                                                                        <div className="w-32 h-24 bg-white rounded-lg shadow flex items-center justify-center">
                                                                            <img
                                                                                src={`https://apitour.rajasthantouring.in${v.image}`}
                                                                                alt={v.model}
                                                                                className="max-w-full max-h-full object-contain"
                                                                            />
                                                                        </div>

                                                                        {/* Details */}
                                                                        <div className="flex-1">
                                                                            <h4 className="text-xl font-bold text-gray-800">{v.model}</h4>

                                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                                <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-bold">
                                                                                    {v.type}
                                                                                </span>

                                                                                <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-bold">
                                                                                    {v.capacity} Seater
                                                                                </span>
                                                                            </div>

                                                                            <p className="text-gray-600 mt-2 text-sm">
                                                                                This vehicle will be available for your entire travel on this day.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                        </div>
                                    )}

                                </div>

                            </section>



                        </div>


                        <div className="w-full lg:w-1/3 relative">
                            <div className={`space-y-6 ${scrolled ? 'lg:sticky lg:top-24' : ''}`}>
                                {/* Price Card */}
                                {categories.map(category => {


                                    const price = getNumericValue(booking.itineraryData.pricing, category);
                                    const total = getCategoryTotals()[category];
                                    const bookingAmt = getNumericValue(
                                        booking.itineraryData.bookingAmount,
                                        category
                                    );
                                    const offer = booking.itineraryData.offers?.[category]?.value;

                                    return (
                                        <div key={category} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-800 to-red-600"></div>

                                            <div className="p-6">

                                                {/* Category Title */}
                                                {categories.length > 1 && (
                                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                                                        {category} Package
                                                    </div>
                                                )}

                                                {/* Original Price + Discount */}
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-sm text-gray-500 line-through">
                                                        ₹{(price * 1.2).toLocaleString("en-IN")}
                                                    </span>
                                                    <div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                                        20% OFF
                                                    </div>
                                                </div>

                                                {/* Final Price */}
                                                <div className="flex items-end gap-1 mb-6">
                                                    <span className="text-4xl font-['Oswald'] font-bold text-gray-900">
                                                        ₹{total?.toLocaleString("en-IN")}
                                                    </span>
                                                    <span className="text-gray-500 font-medium mb-1.5">/ {booking.itineraryData.priceType}</span>
                                                </div>

                                                {/* Book Now Button */}
                                                <button
                                                    onClick={() => navigate(`/userpayment/${booking._id}?tab=Optional`)}
                                                    className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition-all mb-4 flex items-center justify-center gap-2"
                                                >
                                                    Book Now <ArrowRight size={18} />
                                                </button>

                                                {/* FULL PRICE DETAILS (Same as your second box) */}
                                                <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">

                                                    <div className="flex justify-between">
                                                        <span>Base Price</span>
                                                        <strong>₹{price?.toLocaleString("en-IN")}</strong>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Total</span>
                                                        <strong>₹{total?.toLocaleString("en-IN")}</strong>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Booking Amount</span>
                                                        <strong>₹{bookingAmt?.toLocaleString("en-IN")}</strong>
                                                    </div>

                                                    {offer > 0 && (
                                                        <div className="flex justify-between text-green-700">
                                                            <span>Offer</span>
                                                            <strong>₹{offer.toLocaleString("en-IN")} OFF</strong>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-green-700 pt-1">
                                                        <CheckCircle size={12} /> Best Price Guaranteed
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}


                                {/* Inquiry Form */}
                                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                                    <h3 className="font-['Oswald'] text-xl font-bold mb-4 text-gray-800 uppercase">Have Questions?</h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Name</label><input type="text" value={form.name} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={form.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows="3" placeholder="Type your query here..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-900 outline-none" required></textarea></div>
                                        <button type="submit" disabled={loadings} className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl transition text-sm">{loadings ? 'Sending...' : 'Send Enquiry'}</button>
                                    </form>
                                </div>

                                {/* Contact */}
                                {booking.contact && (
                                    <div className="bg-gradient-to-br from-red-900 to-black text-white rounded-2xl shadow-md p-6 relative overflow-hidden">

                                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                                            <Globe size={100} />
                                        </div>

                                        <h3 className="font-['Oswald'] text-lg font-bold mb-4 uppercase tracking-wider opacity-80">
                                            Need Help?
                                        </h3>

                                        <div className="space-y-4 relative z-10">

                                            {/* 📞 All Mobile Numbers */}
                                            <div>
                                                <p className="text-xs text-white/60 uppercase font-bold">Call Our Expert</p>
                                                <div className="flex flex-col gap-1">
                                                    {(booking.contact.mobiles || []).map((mobile, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`tel:${mobile}`}
                                                            className="text-xl font-bold hover:text-yellow-400 transition"
                                                        >
                                                            {mobile}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ✉ All Emails */}
                                            <div>
                                                <p className="text-xs text-white/60 uppercase font-bold">Email Us</p>
                                                <div className="flex flex-col gap-1">
                                                    {(booking.contact.emails || []).map((email, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`mailto:${email}`}
                                                            className="text-sm font-medium hover:text-yellow-400 transition break-all"
                                                        >
                                                            {email}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 🏠 Full Address */}
                                            <div>
                                                <p className="text-xs text-white/60 uppercase font-bold">Office Address</p>
                                                <p className="text-sm font-medium text-white/90">
                                                    {booking.contact.addresses?.[0]
                                                        ? `${booking.contact.addresses[0].street}, ${booking.contact.addresses[0].area}, ${booking.contact.addresses[0].city}, ${booking.contact.addresses[0].state} - ${booking.contact.addresses[0].pincode}`
                                                        : "Not Available"}
                                                </p>
                                            </div>

                                            {/* 🚨 SOS Number */}
                                            <div>
                                                <p className="text-xs text-white/60 uppercase font-bold">SOS Number</p>
                                                {structureData?.sosNumber ? (
                                                    <a
                                                        href={`tel:${structureData.sosNumber}`}
                                                        className="text-sm font-medium hover:text-yellow-400 transition"
                                                    >
                                                        {structureData.sosNumber}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm opacity-70">Not Available</p>
                                                )}
                                            </div>

                                            {/* 📍 Get Direction */}
                                            <div>
                                                <p className="text-xs text-white/60 uppercase font-bold">Get Direction</p>
                                                {softwareData?.g2ReviewLink ? (
                                                    <a
                                                        href={softwareData.g2ReviewLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium hover:text-yellow-400 transition"
                                                    >
                                                        Open Map
                                                    </a>
                                                ) : (
                                                    <p className="text-sm opacity-70">Not Available</p>
                                                )}
                                            </div>

                                            {/* 🌐 Social Links */}
                                            {booking.contact.socialLinks && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-white/60 uppercase font-bold">Follow Us</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {Object.entries(booking.contact.socialLinks).map(([platform, link]) => {
                                                            if (!link) return null;
                                                            return (
                                                                <a
                                                                    key={platform}
                                                                    href={link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-lg hover:text-yellow-400"
                                                                >
                                                                    <FontAwesomeIcon icon={iconsMap[platform]} />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>


                <section className="mb-8 border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800">
                        What's inside the package?
                    </h2>
                    <hr className='my-2' />
                    {/* GRID + DIVIDER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">

                        {/* Center Vertical Line */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200"></div>

                        {/* ---------------- INCLUSIONS WITH DROPDOWN ---------------- */}
                        <div className="pr-0 md:pr-10">
                            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Inclusions</h3>

                            <div className="space-y-4">
                                {policies.inclusions.map((item, i) => {
                                    const key = `inc-${i}`;
                                    const hasImage = (item.images && item.images.length > 0) || item.image;

                                    return (
                                        <div
                                            key={key}
                                            className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                                        >
                                            {/* Header */}
                                            <button
                                                onClick={() => toggleAccordion(key)}
                                                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FontAwesomeIcon
                                                        icon={faCircleCheck}
                                                        className="text-green-600 text-lg"
                                                    />
                                                    <span className="text-gray-800 font-medium text-sm sm:text-base">
                                                        {item.title}
                                                    </span>
                                                </div>

                                                {/* Arrow */}
                                                <FaArrowDown
                                                    className={`text-green-600 transition-transform duration-300 ${expandedItems[key] ? "rotate-180" : ""}`}
                                                />
                                            </button>

                                            {/* Body */}
                                            {expandedItems[key] && (
                                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                                    <div className="flex gap-4 items-start">

                                                        {/* Image (optional) */}
                                                        {hasImage && (
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={`${BASE_URL}/${item.images?.[0] || item.image}`}
                                                                    className="w-24 h-24 object-cover rounded-lg shadow"
                                                                    alt={item.title}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Description */}
                                                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ---------------- EXCLUSIONS ---------------- */}
                        <div className="pl-0 md:pl-10">
                            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Exclusions</h3>

                            <ul className="space-y-3">
                                {policies.exclusions.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <FontAwesomeIcon
                                            icon={faCircleXmark}
                                            className="text-red-600 text-lg mt-1"
                                        />
                                        <span className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                            {item.title}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </section>



                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">

                    {/* ================= GOOGLE REVIEW CARD ================= */}
                    <Link
                        to={softwareData?.g2ReviewLink || "/reviews"}
                        className="flex items-center gap-4 bg-white px-6 py-4 w-full sm:w-auto 
                   rounded-full shadow-md hover:shadow-lg transition border border-gray-200"
                    >
                        {/* Google Icon */}
                        <img src="/gg.webp" className="w-10 h-10 object-contain" alt="Google Logo" />

                        {/* Divider */}
                        <div className="w-px h-10 bg-gray-300"></div>

                        {/* Text Section */}
                        <div className="flex flex-col justify-center">
                            <p className="font-semibold text-gray-900 leading-tight">Google</p>

                            <div className="flex items-center gap-2">
                                <StarRating rating={softwareData?.rating || 0} />
                                <span className="text-gray-500 text-xs">
                                    {softwareData?.reviews || 0}+ reviews
                                </span>
                            </div>
                        </div>
                    </Link>


                    {/* ================= TRIPADVISOR REVIEW CARD ================= */}
                    <Link
                        to={softwareData?.tripadviserlink || "/reviews"}
                        className="flex items-center gap-4 bg-white px-6 py-4 w-full sm:w-auto 
                   rounded-full shadow-md hover:shadow-lg transition border border-gray-200"
                    >
                        {/* TripAdvisor Icon */}
                        <img
                            src="/image.png"
                            className="w-10 h-10 rounded-full object-contain"
                            alt="TripAdvisor Logo"
                        />

                        {/* Divider */}
                        <div className="w-px h-10 bg-gray-300"></div>

                        {/* Text Section */}
                        <div className="flex flex-col justify-center">
                            <p className="font-semibold text-gray-900 leading-tight">TripAdvisor</p>

                            <div className="flex items-center gap-2">
                                <StarRating rating={softwareData?.tripadvisorRating || 0} />
                                <span className="text-gray-500 text-xs">
                                    {softwareData?.tripadvisorReviews || 0}+ reviews
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
                <section className="mb-10 p-4 border rounded-2xl shadow-sm bg-white mt-8">
                    {/* PAYMENT OPTIONS */}
                    <div className="border-b pb-6 mb-6">
                        <button
                            onClick={() => toggleAccordion("payment")}
                            className="w-full flex justify-between items-center mb-4"
                        >
                            <h3 className="text-xl font-semibold text-gray-800">Payment Options</h3>
                            <FaChevronDown
                                className={`text-gray-700 transition-transform duration-300 ${expandedItems.payment ? "rotate-180" : ""
                                    }`}
                                size={18}
                            />
                        </button>

                        {expandedItems.payment && (
                            <ul className="list-disc ml-6 text-gray-700 space-y-2 text-base">
                                {policies?.paymentPolicy?.length ? (
                                    policies.paymentPolicy.map((item, i) => (
                                        <li key={`pay-${i}`}>{item.title ?? item.description ?? item}</li>
                                    ))
                                ) : (
                                    <li>No payment policy available.</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* CANCELLATIONS & REFUNDS (timeline style) */}
                    <div className="border-b pb-6  mb-6">
                        <button
                            onClick={() => toggleAccordion("cancellation")}
                            className="w-full flex justify-between items-center mb-4"
                        >
                            <h3 className="text-xl font-semibold text-gray-800">Cancellations & Refunds</h3>
                            <FaChevronDown
                                className={`text-gray-700 transition-transform duration-300 ${expandedItems.cancellation ? "rotate-180" : ""
                                    }`}
                                size={18}
                            />
                        </button>

                        {expandedItems.cancellation && (
                            <div className="space-y-6">
                                {/* Timeline container */}
                                <div className="relative pl-10">
                                    {/* vertical dashed line */}
                                    <div className="absolute left-5 top-0 bottom-0 w-px bg-transparent">
                                        <div className="h-full w-px bg-transparent border-l-2 border-dashed border-orange-300" />
                                    </div>

                                    {policies?.cancellationAndRefundPolicy?.length ? (
                                        policies.cancellationAndRefundPolicy.map((item, i) => {
                                            const isFirst = i === 0;
                                            const isLast = i === policies.cancellationAndRefundPolicy.length - 1;

                                            return (
                                                <div key={`cancel-${i}`} className="relative pl-10 mb-8">

                                                    {/* --- Orange Dot (Proper Position) --- */}
                                                    <div className="absolute left-0 top-1">
                                                        <div
                                                            className={`w-4 h-4 rounded-full border-2 
              ${isFirst || isLast
                                                                    ? "bg-orange-500 border-orange-500"
                                                                    : "bg-white border-orange-500"
                                                                }`}
                                                        />
                                                    </div>

                                                    {/* --- Content --- */}
                                                    <div>
                                                        <p className="text-gray-900 font-semibold text-lg">
                                                            {item.title ?? item.date ?? "—"}
                                                        </p>

                                                        {item.refund ? (
                                                            <p className="text-green-600 font-semibold mt-1">{item.refund}</p>
                                                        ) : item.description ? (
                                                            <p className="text-gray-700 mt-1">{item.description}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-700">No cancellation policy available.</p>
                                    )}

                                </div>

                                {/* Bottom note if present */}
                                {policies?.cancellationNote && (
                                    <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                                        {policies.cancellationNote}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* TERMS & CONDITIONS */}
                    <div className="pb-6">
                        <button
                            onClick={() => toggleAccordion("terms")}
                            className="w-full flex justify-between items-center mb-4"
                        >
                            <h3 className="text-xl font-semibold text-gray-800">Terms & Conditions</h3>
                            <FaChevronDown
                                className={`text-gray-700 transition-transform duration-300 ${expandedItems.terms ? "rotate-180" : ""
                                    }`}
                                size={18}
                            />
                        </button>

                        {expandedItems.terms && (
                            <ul className="space-y-3">
                                {policies?.termsAndConditions?.length ? (
                                    policies.termsAndConditions.map((item, i) => (
                                        <li
                                            key={`term-${i}`}
                                            className="flex items-start gap-3 text-gray-700 text-base leading-relaxed"
                                        >
                                            <span className="text-red-700 mt-1">•</span>
                                            <span>{item.title ?? item.description ?? item}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-700">No terms & conditions available.</li>
                                )}
                            </ul>
                        )}
                    </div>
                </section>
















                <div className="flex justify-between items-center py-4 w-full px-4 sm:px-6 mb-4">
                    <img
                        src={
                            structureData?.logo
                                ? structureData.logo.startsWith("/uploads")
                                    ? `${BASE_URL}${structureData.logo}`
                                    : structureData.logo
                                : "/logo1.png"
                        }
                        alt="Company Logo"
                        className="h-10 sm:h-12 w-auto object-contain"
                    />
                    {booking?.contact?.mobiles?.[0] && (
                        <a
                            href={`https://wa.me/${booking.contact.mobiles[0].replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-900 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-800 transition-all flex items-center gap-2 text-xs sm:text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                            {booking.contact.mobiles[0].replace(/[^0-9]/g, '')}
                        </a>
                    )}
                </div>

                <section className="pt-4 sm:pt-6 md:pt-8">
                    <div className="flex flex-col lg:flex-row items-start justify-between flex-wrap gap-6 lg:gap-0">
                        <div className="w-full lg:order-1 order-2 lg:w-1/2">
                            <h1 style={{ fontFamily: "'PoltawskiNowy'" }} className="mt-4 sm:mt-6 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                                Hi {booking.clientDetails.name},
                            </h1>
                            <p className="text-sm md:text-lg text-gray-700 mt-3 leading-relaxed">
                                Here is the package exclusively designed / tailor made for you
                            </p>
                            <div className="mt-4 sm:mt-6 inline-block bg-red-900 text-white text-sm md:text-lg px-4 py-1.5 rounded font-medium">
                                {booking.selectedItinerary.duration}
                            </div>
                            <h3 style={{ fontFamily: "'PoltawskiNowy'" }} className="text-lg md:text-2xl   font-bold mt-5 sm:mt-7 leading-snug">
                                {booking.clientDetails.name?.toUpperCase()} || RAJASTHAN TOUR PACKAGE FOR {booking.itineraryData.days.length} Days
                            </h3>
                            {categories.length === 1 && (
                                categories.map((category) => {
                                    const price = getNumericValue(booking.itineraryData.pricing, category);
                                    const total = getCategoryTotals()[category];

                                    return (
                                        <div
                                            key={category}
                                            className="flex justify-between items-center text-2xl sm:text-3xl md:text-4xl mb-4 mt-2"
                                        >
                                            <span className="text-red-900 font-bold">
                                                ₹{total?.toLocaleString("en-IN")}/-
                                            </span>
                                        </div>
                                    );
                                })
                            )}

                            <div className="flex flex-wrap gap-2 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-lg font-medium text-gray-700">
                                {uniqueLocations.map(({ loc, count }, i) => (
                                    <p key={`loc-${i}`} className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faLocationPinLock} className="text-red-900 w-2 h-2" />
                                        {loc}
                                        {count > 1 ? ` ` : ''}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row sm:items-stretch gap-4 max-w-xl">
                                <div className="flex flex-col sm:flex-row  w-full sm:w-auto ">

                                    <button
                                        className="px-3 flex sm:hidden w-full sm:w-auto sm:px-4 md:px-6 py-3 cursor-pointer bg-[#6a66662c] text-red-900 rounded-lg hover:bg-gray-300 transition-all duration-200 items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <div className='flex flex-col gap-2'>
                                    <Link
                                        to={softwareData?.g2ReviewLink || "/reviews"}
                                        className="text-sm border flex items-center md:justify-center w-full sm:w-auto px-3 text-gray-800 bg-white rounded-md cursor-pointer hover:shadow-md transition"
                                    >
                                        <img src="/gg.webp" className="w-12 sm:w-14 h-12 sm:h-14 object-contain mr-3" alt="Google Logo" />

                                        <div className="flex flex-col justify-center">
                                            <p className="font-semibold leading-tight">Customer Reviews</p>
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={softwareData?.rating} />
                                                <span className="text-red-900 text-xs">{softwareData?.reviews} Google Reviews</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        to={softwareData?.tripadviserlink || "/reviews"}
                                        className="text-sm border flex items-center md:justify-start w-full sm:w-auto px-3 text-gray-800 bg-white rounded-md cursor-pointer hover:shadow-md transition"
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
                                                    {softwareData?.tripadvisorReviews || 0} Reviews
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                            </div>
                            <button
                                className="px-3 sm:flex hidden sm:px-4 md:px-6 py-2 cursor-pointer my-2 bg-white text-red-900 rounded-lg hover:bg-gray-300 transition-all duration-200 items-center justify-center space-x-2 text-sm sm:text-base w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="relative order-1 md:w-auto max-w-7xl lg:order-2 p-2 sm:p-4 mx-auto lg:w-auto lg:mx-auto flex justify-center">
                            <img
                                src={mainCircleImage}
                                alt="Hero Circle"
                                className="w-[250px] sm:w-[280px] md:w-[320px] lg:w-[350px] h-[250px] sm:h-[280px] md:h-[320px] lg:h-[350px] rounded-full object-cover shadow-lg mx-auto lg:mx-0"
                            />
                            <div className="absolute sm:-top-4 lg:-top-6 sm:-left-8 lg:-left-12 top-0 left-0 block">
                                <img
                                    src={smallCircleImage}
                                    alt="Small Circle"
                                    className="w-20 sm:w-24 md:w-40 h-20 sm:h-24 md:h-40 rounded-full border-4 border-white shadow-md object-cover"
                                />
                            </div>
                            <div className="absolute sm:-bottom-4 lg:-bottom-6 sm:-right-8 lg:-right-12 right-0 bottom-0 block">
                                <img
                                    src={thirdCircleImage}
                                    alt="Small Circle"
                                    className="w-20 sm:w-24 md:w-40 h-20 sm:h-24 md:h-40 rounded-full border-4 border-white shadow-md object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>


                {/* Client Details Section */}
                {/* Wrapper: Client + Categories */}
                <div
                    className={`grid gap-6 ${categories.length === 1
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1"
                        }`}
                >
                    {/* CLIENT DETAILS */}
                    {booking.clientDetails &&
                        Object.keys(booking.clientDetails).length > 0 && (
                            <section className="my-3  shadow-sm   border-2 p-4 rounded-lg">
                                <h2 className="text-2xl border-b font-semibold mb-4 text-gray-700">
                                    Your Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4  bg-white text-lg ">

                                    {booking.clientDetails.name && (
                                        <p>
                                            <strong>Name:</strong> {booking.clientDetails.name}
                                        </p>
                                    )}
                                    {booking.clientDetails.email && (
                                        <p>
                                            <strong>Email:</strong> {booking.clientDetails.email}
                                        </p>
                                    )}
                                    {booking.clientDetails.phone && (
                                        <p>
                                            <strong>Phone:</strong> {booking.clientDetails.phone}
                                        </p>
                                    )}
                                    {booking.clientDetails.travelDate && (
                                        <p>
                                            <strong>Travel Date:</strong> {booking.clientDetails.travelDate}
                                        </p>
                                    )}
                                    {(booking.clientDetails.adults ||
                                        booking.clientDetails.adults === 0) && (
                                            <p>
                                                <strong>Adults:</strong> {booking.clientDetails.adults}
                                            </p>
                                        )}
                                    {(booking.clientDetails.kids5to12 ||
                                        booking.clientDetails.kids5to12 === 0) && (
                                            <p>
                                                <strong>Kids (5-12 Years):</strong> {booking.clientDetails.kids5to12}
                                            </p>
                                        )}
                                    {(booking.clientDetails.kidsBelow5 ||
                                        booking.clientDetails.kidsBelow5 === 0) && (
                                            <p>
                                                <strong>Kids (Below 5 Years):</strong> {booking.clientDetails.kidsBelow5}
                                            </p>
                                        )}
                                    {(booking.clientDetails.rooms ||
                                        booking.clientDetails.rooms === 0) && (
                                            <p>
                                                <strong>Rooms:</strong> {booking.clientDetails.rooms}
                                            </p>
                                        )}
                                    {(booking.clientDetails.extraBeds ||
                                        booking.clientDetails.extraBeds === 0) && (
                                            <p>
                                                <strong>Extra mattress:</strong> {booking.clientDetails.extraBeds}
                                            </p>
                                        )}
                                </div>
                            </section>
                        )}

                    {/* PACKAGE SUMMARY – ONLY FOR SINGLE CATEGORY */}
                    {categories.length === 1 && (
                        <section className="my-3  shadow-sm   border-2 p-4 rounded-lg">
                            <h2 className="text-2xl border-b font-semibold mb-4 text-gray-700">
                                Package Summary
                            </h2>

                            <div className="grid grid-cols-1">
                                {categories.map((category) => {
                                    const price = getNumericValue(booking.itineraryData.pricing, category);
                                    const total = getCategoryTotals()[category];
                                    const bookingAmt = getNumericValue(
                                        booking.itineraryData.bookingAmount,
                                        category
                                    );
                                    const offer = booking.itineraryData.offers?.[category]?.value;
                                    console.log(booking, "bookigdata");

                                    return (
                                        <div
                                            key={category}
                                            className="p-1 bg-white transition-all text-lg"
                                        >
                                            <h3 className="font-bold text-2xl capitalize text-gray-900 mb-6">
                                                {category} Package
                                            </h3>

                                            {/* Base Price */}
                                            <div className="flex justify-between items-center text-lg border-b py-2">
                                                <span className="text-gray-700 font-semibold">Base Price</span>
                                                <span className="text-gray-900 font-bold">
                                                    ₹{price?.toLocaleString("en-IN")}
                                                </span>
                                            </div>

                                            {/* Total */}
                                            <div className="flex justify-between items-center text-lg border-b py-2 mt-2">
                                                <span className="text-gray-700 font-semibold">Total ({category})</span>
                                                <span className="text-green-700 font-bold">
                                                    ₹{total?.toLocaleString("en-IN")}/-
                                                </span>
                                            </div>

                                            {/* Booking Amount */}
                                            <div className="flex justify-between items-center text-lg py-2 mt-2">
                                                <span className="text-gray-700 font-semibold">
                                                    Booking Amount ({category})
                                                </span>
                                                <span className="text-red-700 font-bold">
                                                    ₹{bookingAmt?.toLocaleString("en-IN")}/-
                                                </span>
                                            </div>

                                            {/* OFFER BOX */}
                                            {offer && (
                                                <div className="flex justify-between items-center text-lg py-3 mt-4 bg-green-50 border border-green-300 rounded-xl px-4">
                                                    <span className="text-green-700 font-semibold">Offer:-</span>
                                                    <span className="text-green-800 font-bold">
                                                        {typeof offer === "number"
                                                            ? `₹${offer?.toLocaleString("en-IN")} OFF`
                                                            : offer}
                                                    </span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => navigate(`/userpayment/${booking?._id}?tab=Optional`)}
                                                className="inline-block mt-8 w-full px-4 bg-red-900 text-white py-4 rounded-xl text-xl font-semibold hover:bg-red-800"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>






                {/* Itinerary Overview - Using Viewdata4 Design with Enhanced Details */}
                {booking.itineraryData?.days?.length > 0 && (
                    <section className="mb-6">

                        <div className=' sm:text-2xl md:text-3xl font-extrabold text-lg text-red-900'>
                            Travel Itinerary
                        </div>

                        <p className="text-gray-700 mt-1 flex flex-wrap gap-2 ">

                            <p className='text-red-900 text-xl'>Covering Destinations</p>
                            {(() => {
                                const allDays = booking.itineraryData?.days || [];

                                const locationNightCount = {};

                                allDays.forEach((day) => {
                                    const dayLocs = day.locations || [];

                                    dayLocs.forEach((loc) => {
                                        const cleanLoc = loc.trim().toLowerCase();

                                        // ❌ Departure ko bilkul skip karna hai
                                        if (cleanLoc === "departure") return;

                                        // ✅ Normal location count
                                        locationNightCount[loc] = (locationNightCount[loc] || 0) + 1;
                                    });
                                });

                                const uniqueLocations = Object.keys(locationNightCount);

                                return uniqueLocations.length > 0 ? (
                                    uniqueLocations.map((loc, i) => (
                                        <span key={i} className="flex items-center gap-1">
                                            <FontAwesomeIcon
                                                icon={faLocationArrow}
                                                className="text-red-900 mr-1 w-2 h-2"
                                            />

                                            {/* Location Name */}
                                            <span className="font-semibold text-gray-800">
                                                {loc}
                                            </span>

                                            {/* Nights */}
                                            {locationNightCount[loc] > 0 && (
                                                <span className="text-sm text-red-900 ml-1">
                                                    -{locationNightCount[loc]}N
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

                        {booking.itineraryData?.tourcode && (
                            <p className="text-gray-700 my-3 underline text-sm md:text-lg">
                                <span className="font-semibold text-gray-900">Tour Code:</span>{" "}
                                <span className="text-red-900 font-medium">{booking.itineraryData.tourcode}</span>
                            </p>
                        )}
                        <div className="mt-6 space-y-8 sm:space-y-10">
                            {(transformedBooking.itinerary || []).map((item, index) => (
                                <div key={`it-day-${index}`} className="flex flex-col sm:flex-row gap-4 text-lg sm:gap-6">
                                    <div className="w-full sm:w-28 sm:text-right text-left">
                                        <p className="text-red-900 font-semibold ">{item.day}</p>
                                        {item.date && <p className="text-gray-600 text-sm ">{item.date}</p>}
                                    </div>
                                    <div className="relative sm:flex hidden flex-col items-center w-8 sm:w-12 self-stretch">
                                        {index !== transformedBooking.itinerary.length - 1 && (
                                            <div className="absolute top-4 bottom-0 w-0.5 bg-red-900"></div>
                                        )}
                                        <div className="w-4 h-4 rounded-full border-2 border-red-900 bg-white z-10"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className='flex w-full gap-3 flex-wrap'>
                                            <button
                                                onClick={() => setOpenDayIndex(openDayIndex === index ? null : index)}
                                                className="inline-block text-left font-semibold text-gray-900 flex items-center justify-between "
                                            >
                                                <span className="">{item.title}</span>


                                            </button>

                                            {Array.isArray(transformedBooking?.vehicle) && (
                                                <span className="flex flex-wrap items-center gap-2">
                                                    {transformedBooking.vehicle.map((v, index, arr) => (
                                                        <span key={index} className="flex items-center gap-2">
                                                            <span className="bg-red-900 flex items-center capitalize text-white px-2 py-1 rounded-lg text-xs sm:text-sm">
                                                                <FontAwesomeIcon icon={faCar} className="mx-1 w-4 h-4" />
                                                                {v.model}/Similar
                                                            </span>
                                                            {index < arr.length - 1 && (
                                                                <span className="font-semibold text-sm text-red-900">OR</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                        </div>
                                        {/* {(item.locations || []).length > 0 && (
                                            <p className="text-gray-700  mt-1  text-lg leading-relaxed">
                                                {item.locations.map((l, i) => (i ? `, ${l}` : l))}
                                                {item.locations.length > 4 ? "…" : ""}
                                            </p>
                                        )} */}
                                        <div className="mt-4">
                                            <div className="flex justify-start w-full">
                                                {item.img && item.img.length > 0 ? (
                                                    <Swiper
                                                        modules={[Pagination, Autoplay]}
                                                        pagination={{ clickable: true }}
                                                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                                                        loop
                                                        spaceBetween={20}
                                                        className="rounded-lg overflow-hidden w-full max-w-3xl h-48 sm:h-64 md:h-72 lg:h-80"
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
                                                        src="https://via.placeholder.com/300x200"
                                                        alt="Placeholder"
                                                        className="rounded-lg object-cover w-full max-w-xs h-48 sm:h-60 md:h-72"
                                                    />
                                                )}
                                            </div>
                                            <div className="mt-3 text-gray-800">
                                                {Array.isArray(transformedBooking?.vehicle) &&
                                                    transformedBooking.vehicle
                                                        .filter(v => v.selected)
                                                        .map((v, index) => (
                                                            <p
                                                                key={index}
                                                                className="font-semibold bg-red-900 mb-2 inline-flex px-2 py-1 rounded-lg gap-2 text-white text-xs sm:text-sm"
                                                            >
                                                                <FontAwesomeIcon icon={faCar} className="w-4 h-4" />{v.model}
                                                            </p>
                                                        ))}

                                                <div
                                                    className="ql-editor text-lg text-muted-foreground prose prose-sm sm:prose-lg max-w-none leading-relaxed "
                                                    dangerouslySetInnerHTML={{ __html: item.desc }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                            <p className="text-md md:text-lg text-black font-bold leading-relaxed whitespace-pre-wrap">
                                <strong className="text-xl md:text-lg font-bold text-black">
                                    Note :-{" "}
                                </strong>
                                {booking.noteText}
                            </p>

                        </div>
                    </div>
                )}


                {/* Hotels Section - Integrated with Viewdata4 Hotel Display */}
                <section className="mb-8 border-2 rounded-2xl p-4 shadow-lg hover:shadow-xl  border-gray-200">

                    {categories.length > 1 && (
                        <section className="mb-6 border-b-2 border-red-900">
                            <h2 className="text-xl sm:text-2xl underline font-semibold mb-4 text-gray-700 ">
                                Travel Packages Options
                            </h2>
                            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-red-900 ">
                                We’ve curated two exclusive travel packages just for you. Choose the one that suits your journey best – or explore both!
                            </h2>



                        </section>
                    )}
                    {/* <h1 style={{ fontFamily: "'PoltawskiNowy'" }} className="text-2xl my-2    font-bold">
                        <span className="text-red-900 mt-4">
                            Note :-
                        </span>
                        <span className="text-gray-700 font-normal">
                            The above quote is valid for 3 days from the date of
                            quotation. Kindly send your confirmation within the time limit or else the quoted rate might vary.
                        </span>
                    </h1> */}
                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                        {categories.map((category, index) => {
                            const hotelsByCategory = booking.itineraryData.hotels?.[category] || {};

                            // Step 1: Valid days jahan hotel data hai
                            const validDays = Object.keys(hotelsByCategory)
                                .filter(key => !isNaN(parseInt(key)))
                                .map(Number)
                                .filter(day => {
                                    const dayData = hotelsByCategory[day];
                                    if (!dayData) return false;
                                    return Object.keys(dayData).some(loc =>
                                        !['selected', 'category'].includes(loc) &&
                                        Object.values(dayData[loc] || {}).some(mealObj =>
                                            mealObj?.options?.length > 0
                                        )
                                    );
                                })
                                .sort((a, b) => a - b);

                            if (validDays.length === 0 && !booking.hotelSelectionDays?.[category]) return null;

                            // Fingerprint function (same as before)
                            const getFingerprint = (day) => {
                                const dayData = hotelsByCategory[day];
                                if (!dayData) return '';
                                const parts = [];
                                Object.keys(dayData)
                                    .filter(loc => !['selected', 'category'].includes(loc))
                                    .sort()
                                    .forEach(loc => {
                                        const locMeals = dayData[loc];
                                        ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                            const options = locMeals[meal]?.options || [];
                                            if (options.length > 0) {
                                                const hotelIds = options
                                                    .map(h => getHotelId(h))
                                                    .filter(Boolean)
                                                    .sort()
                                                    .join('-');
                                                if (hotelIds) parts.push(`${loc}|${meal}|${hotelIds}`);
                                            }
                                        });
                                    });
                                return parts.sort().join('||');
                            };

                            // Groups banao (same as before)
                            const groups = [];
                            let currentGroup = null;
                            validDays.forEach(day => {
                                const fingerprint = getFingerprint(day);
                                if (currentGroup && currentGroup.fingerprint === fingerprint && day === currentGroup.endDay + 1) {
                                    currentGroup.days.push(day);
                                    currentGroup.endDay = day;
                                } else {
                                    currentGroup = {
                                        days: [day],
                                        startDay: day,
                                        endDay: day,
                                        fingerprint,
                                        data: hotelsByCategory[day]
                                    };
                                    groups.push(currentGroup);
                                }
                            });

                            const price = getNumericValue(booking.itineraryData.pricing, category);
                            const total = getCategoryTotals()[category];
                            const bookingAmt = getNumericValue(booking.itineraryData.bookingAmount, category);
                            const offer = booking.itineraryData.offers?.[category]?.value;

                            return (
                                <div key={category} className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 rounded-2xl shadow-md mb-8">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-red-900">
                                        <h3 className="font-bold text-xl sm:text-2xl md:text-3xl text-red-900 capitalize">
                                            {categories.length === 2 ? `Option ${index + 1} : ${category} Package` : `${category} Package`}
                                        </h3>
                                    </div>

                                    {/* Price Summary */}
                                    {categories.length > 1 && (
                                        <div className="bg-white p-5 rounded-2xl shadow mb-6 border">
                                            <h4 className="font-bold text-2xl mb-4">{category} Package</h4>
                                            <div className="space-y-3 text-lg">
                                                <div className="flex justify-between"><span>Base Price</span> <strong>₹{price?.toLocaleString("en-IN")}</strong></div>
                                                <div className="flex justify-between text-green-700"><span>Total</span> <strong>₹{total?.toLocaleString("en-IN")}/-</strong></div>
                                                <div className="flex justify-between text-red-700"><span>Booking Amount</span> <strong>₹{bookingAmt?.toLocaleString("en-IN")}/-</strong></div>
                                                {offer > 0 && <div className="bg-green-50 px-4 py-2 rounded-lg text-green-800"><strong>Offer:</strong> ₹{offer?.toLocaleString("en-IN")} OFF</div>}
                                            </div>
                                            <button onClick={() => navigate(`/userpayment/${booking._id}?tab=Optional`)}
                                                className="mt-5 w-full bg-red-900 text-white py-3 rounded-xl font-bold hover:bg-red-800 transition">
                                                Book Now
                                            </button>
                                        </div>
                                    )}

                                    {/* MAIN CONTENT: Chronological Order Mein Sab Kuch */}
                                    <div className="space-y-8">
                                        {booking?.itineraryData?.days?.map((dayItem) => {
                                            const dayNum = dayItem.id;
                                            const isDisabled = booking.hotelSelectionDays?.[category]?.[dayNum] === true;
                                            const itineraryDay = booking?.itineraryData?.days?.find(d => Number(d.id) === Number(dayNum));
                                            const locations = itineraryDay?.locations?.filter(loc => loc.toLowerCase() !== "departure") || [];

                                            // Case 1: Hotel disabled → Warning dikhao
                                            if (isDisabled) {
                                                return (
                                                    <div key={`no-hotel-${category}-${dayNum}`} className="">

                                                        <div className=" gap-2">
                                                            <p className="bg-red-900  font-bold text-white px-3 py-1 inline-flex items-center rounded-full">
                                                                Night {String(dayNum).padStart(2, "0")}
                                                            </p>
                                                            <br />
                                                            <p className=" inline-flex flex-wrap gap-2 mt-4 bg-red-50 px-4 py-0 inline-flex items-center rounded-full text-red-700 border border-red-200">
                                                                {getDateForDays(dayNum)}
                                                            </p>


                                                        </div>


                                                        <div className='border p-4 rounded-2xl my-2'>

                                                            <div>
                                                                {locations?.length > 0 && (
                                                                    <span className="text-xl my-2 capitalize font-bold text-gray-800 mb-4">
                                                                        {" "}  {locations.join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-3 bg-gray-100 border-l-4  rounded-xl p-5">
                                                                <FontAwesomeIcon icon={faHotel} size='3x' className="w-6 h-6 text-gray-700 mt-1 flex-shrink-0" />
                                                                <p className="text-gray-900 text-base leading-relaxed">
                                                                    No hotels booked for this day. Guest will arrange their own accommodation.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Case 2: Hotel enabled hai → check karo kya iska group hai?
                                            const relevantGroup = groups.find(g => g.days.includes(dayNum));
                                            if (!relevantGroup) return null;

                                            // Sirf group ka pehla din render karega → duplicate nahi hoga
                                            if (relevantGroup.startDay !== dayNum) return null;

                                            const { startDay, endDay, days: groupDays } = relevantGroup;
                                            const isMultiDay = startDay !== endDay;
                                            const checkIn = getDateForDays(startDay);
                                            const checkOut = getDateForDays(endDay + 1);
                                            const pad = (num) => String(num).padStart(2, "0");

                                            const formatDayMonth = (dateStr) => {
                                                const [day, month] = dateStr.split(" ");
                                                return `${day} ${month}`;
                                            };

                                            const getYear = (dateStr) => dateStr.split(" ")[2];

                                            return (
                                                <div key={`hotel-group-${startDay}`} className="overflow-hidden">
                                                    <div className=' mb-3 '>

                                                        <div className="bg-red-900 font-bold text-white px-3 py-1 inline-flex items-center rounded-full">
                                                            <span>
                                                                {isMultiDay
                                                                    ? `Night ${pad(startDay)} – ${pad(endDay)} `
                                                                    : `Night ${pad(startDay)} `
                                                                }
                                                            </span>
                                                        </div>
                                                        <br />

                                                        <div className=" inline-flex flex-wrap gap-2 mt-4 bg-red-50 px-4 py-0 inline-flex items-center rounded-full text-red-700 border border-red-200">
                                                            <span>
                                                                {isMultiDay
                                                                    ? ` ${formatDayMonth(checkIn)} to ${formatDayMonth(checkOut)} ${getYear(checkOut)} -`
                                                                    : ` ${checkIn} -`
                                                                }
                                                            </span>
                                                            <span>
                                                                {pad(groupDays.length)} {groupDays.length > 1 ? 'Nights' : 'Night'}
                                                            </span>
                                                        </div>

                                                    </div>


                                                    <div className="p-5 space-y-6 bg-white border border-gray-300 rounded-xl shadow-sm">
                                                        {(() => {
                                                            const sampleDay = groupDays[0];
                                                            const dayData = hotelsByCategory[sampleDay] || {};

                                                            return Object.keys(dayData)
                                                                .filter(loc => !['selected', 'category'].includes(loc))
                                                                .map(location => {
                                                                    const locationData = dayData[location];
                                                                    const hotelsForThisBlock = [];

                                                                    ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                                                        const options = locationData[meal]?.options || [];
                                                                        options.forEach(hotel => {
                                                                            const id = getHotelId(hotel);
                                                                            let existing = hotelsForThisBlock.find(h => getHotelId(h) === id);
                                                                            if (!existing) {
                                                                                existing = { ...hotel, meals: [] };
                                                                                hotelsForThisBlock.push(existing);
                                                                            }
                                                                            if (!existing.meals.includes(meal)) {
                                                                                existing.meals.push(meal);
                                                                            }
                                                                        });
                                                                    });

                                                                    if (hotelsForThisBlock.length === 0) return null;

                                                                    return (
                                                                        <div key={location} className="border-b pb-6 last:border-0 last:pb-0">
                                                                            <h5 className="font-bold text-lg mb-4 text-gray-800">
                                                                                {location.charAt(0).toUpperCase() + location.slice(1)}
                                                                            </h5>

                                                                            <div className={`flex flex-col md:flex-row items-center lg:gap-6 md:gap-4 gap-4 w-full ${hotelsForThisBlock.length === 1 ? "justify-start" : "justify-center"}`}>
                                                                                {hotelsForThisBlock.map((hotel, hIdx, arr) => (
                                                                                    <React.Fragment key={getHotelId(hotel)}>
                                                                                        <div className="w-full md:w-1/2">
                                                                                            <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:border-red-300 transition">
                                                                                                {hotel.image ? (
                                                                                                    <img src={`https://apitour.rajasthantouring.in${hotel.image}`} alt={hotel.name}
                                                                                                        className="w-full sm:w-28 sm:h-28 h-32 object-cover rounded-lg shadow-md" />
                                                                                                ) : (
                                                                                                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-28 h-28 flex items-center justify-center text-gray-500 text-xs">
                                                                                                        No Image
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="flex-1">
                                                                                                    <p className="font-bold text-gray-900">{hotel.name}</p>
                                                                                                    <StarRating rating={hotel.rating || 0} />
                                                                                                    {hotel.reviews > 0 && <p className="text-xs text-gray-500">({hotel.reviews} Reviews)</p>}

                                                                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                                                                        {hotel.meals.map((meal) => {
                                                                                                            let bgColor = "";
                                                                                                            let icon = null;
                                                                                                            let label = "";

                                                                                                            switch (meal) {
                                                                                                                case "breakfast":
                                                                                                                    bgColor = "bg-amber-600";
                                                                                                                    icon = faCoffee;
                                                                                                                    label = "Breakfast";
                                                                                                                    break;

                                                                                                                case "lunch":
                                                                                                                    bgColor = "bg-orange-600";
                                                                                                                    icon = faUtensils;
                                                                                                                    label = "Lunch";
                                                                                                                    break;

                                                                                                                case "dinner":
                                                                                                                    bgColor = "bg-red-700";
                                                                                                                    icon = faMoon;
                                                                                                                    label = "Dinner";
                                                                                                                    break;

                                                                                                                case "stayOnly":
                                                                                                                    bgColor = "bg-red-700";    // ⭐ you can change color
                                                                                                                    icon = faBed;              // ⭐ Bed icon
                                                                                                                    label = "Stay Only";       // ⭐ Proper spaced label
                                                                                                                    break;

                                                                                                                default:
                                                                                                                    return null;
                                                                                                            }

                                                                                                            return (
                                                                                                                <span
                                                                                                                    key={meal}
                                                                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow ${bgColor}`}
                                                                                                                >
                                                                                                                    <FontAwesomeIcon icon={icon} />
                                                                                                                    {label}
                                                                                                                </span>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>


                                                                                                    {hotel.googleReviewLink && (
                                                                                                        <a href={hotel.googleReviewLink} target="_blank" rel="noopener noreferrer"
                                                                                                            className="text-blue-600 my-1 text-sm underline hover:text-blue-800">
                                                                                                            View Photos
                                                                                                        </a>
                                                                                                    )}

                                                                                                    <div className="text-sm text-gray-600 mt-2">
                                                                                                        <strong>Check-in:</strong> {checkIn} <br />
                                                                                                        <strong>Check-out:</strong> {checkOut}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        {hIdx < arr.length - 1 && (
                                                                                            <>
                                                                                                <div className="hidden md:flex items-center justify-center px-3">
                                                                                                    <span className="text-red-900 font-bold text-2xl">OR</span>
                                                                                                </div>
                                                                                                <div className="md:hidden py-2 text-center text-red-900 font-bold text-xl">OR</div>
                                                                                            </>
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                        })()}
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


                {/* Tour Policies - Using Viewdata4 Tabs */}
                {/* Tour Policies - Using Viewdata4 Tabs */}
                <section className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 ">
                        Tour Policies
                    </h2>

                    <div className="w-full">
                        {/* Tabs */}
                        <div className="flex gap-6 border-b font-semibold overflow-x-auto whitespace-nowrap pb-2">
                            {["Inclusions", "Exclusions", "Terms & Conditions", "Cancellation & Refund Policy", "Payment Policy"].map((tab) => {
                                const key = tabKeyMap[tab];
                                return (
                                    <button
                                        key={tab}
                                        className={`pb-2 text-sm sm:text-base flex items-center gap-2 ${activeTab === key ? "text-black border-b-2 border-red-900" : "text-gray-500 hover:text-gray-700"
                                            } transition-colors`}
                                        onClick={() => setActiveTab(key)}
                                    >
                                        <FontAwesomeIcon
                                            icon={tabIcons[tab]}
                                            className={`w-4 h-4 ${activeTab === key ? "text-red-900" : "text-gray-500"}`}
                                        />
                                        {tab}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="mt-6">

                            {/* ==================== INCLUSIONS → WITH DROPDOWN ==================== */}
                            {activeTab === "inclusions" && (
                                <div className="space-y-4">
                                    {policies.inclusions.map((item, i) => {
                                        const key = `inc-${i}`;
                                        const hasImage = (item.images && item.images.length > 0) || item.image;

                                        return (
                                            <div
                                                key={key}
                                                className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
                                            >
                                                {/* Accordion Header */}
                                                <button
                                                    onClick={() => toggleAccordion(key)}
                                                    className="w-full text-left p-5 font-bold text-base sm:text-lg md:text-xl flex justify-between items-center font-poppins bg-gradient-to-r from-gray-50 to-white hover:from-red-50 hover:to-white transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5 text-red-900" />
                                                        <span className="text-gray-800">{item.title}</span>
                                                    </div>
                                                    <FaArrowDown
                                                        className={`text-xl text-red-900 transition-transform ${expandedItems[key] ? "rotate-180" : ""
                                                            }`}
                                                    />
                                                </button>

                                                {/* Accordion Body - Only opens when clicked */}
                                                {expandedItems[key] && (
                                                    <div className="p-5 border-t border-gray-200">
                                                        <div className="flex gap-5 items-start">
                                                            {/* Image on left */}
                                                            {hasImage && (
                                                                <div className="flex-shrink-0">
                                                                    {item.images?.[0] && (
                                                                        <img
                                                                            src={`${BASE_URL}/${item.images[0]}`}
                                                                            alt={item.title}
                                                                            className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg shadow-md"
                                                                        />
                                                                    )}
                                                                    {item.image && !item.images?.length && (
                                                                        <img
                                                                            src={`${BASE_URL}/${item.image}`}
                                                                            alt={item.title}
                                                                            className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg shadow-md"
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Description */}
                                                            <p className="text-sm sm:text-base md:text-lg leading-relaxed font-roboto text-gray-700 whitespace-pre-wrap">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ==================== ALL OTHER TABS → ONLY TITLE (NO DROPDOWN) ==================== */}
                            {(activeTab === "exclusions" ||
                                activeTab === "termsandconditions" ||
                                activeTab === "cancellationandrefundpolicy" ||
                                activeTab === "travelrequirements" ||
                                activeTab === "paymentpolicy") && (
                                    <div className="space-y-4">
                                        {(() => {
                                            let items = [];
                                            if (activeTab === "exclusions") items = policies.exclusions;
                                            else if (activeTab === "termsandconditions") items = policies.termsAndConditions;
                                            else if (activeTab === "cancellationandrefundpolicy") items = policies.cancellationAndRefundPolicy;
                                            else if (activeTab === "travelrequirements") items = policies.travelRequirements;
                                            else if (activeTab === "paymentpolicy") items = policies.paymentPolicy || [];

                                            return items.map((item, i) => (
                                                <div
                                                    key={`${activeTab}-${i}`}
                                                    className="border-2 border-gray-200 rounded-xl p-5 shadow-md bg-gradient-to-r from-gray-50 to-white flex items-center gap-3"
                                                >
                                                    <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5 text-red-900 flex-shrink-0" />
                                                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 font-poppins">
                                                        {item.title}
                                                    </h3>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                )}

                        </div>
                    </div>
                </section>

                <section className="mt-10 sm:mt-14">
                    <p className=" font-bold text-lg sm:text-2xl">{tour?.name}</p>
                    <div className="md:flex md:justify-between text-lg gap-8 mt-4">
                        <div className="md:w-1/2 space-y-4 text-justify ">
                            {tour?.description?.slice(0, Math.ceil(tour.description.length / 2)).map((desc, index) => (
                                <p key={index} className="leading-relaxed">{desc}</p>
                            ))}
                        </div>
                        <div className="md:w-1/2 space-y-4 text-justify mt-6 md:mt-0 ">
                            {tour?.description?.slice(Math.ceil(tour.description.length / 2)).map((desc, index) => (
                                <p key={index} className="leading-relaxed">{desc}</p>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-8 sm:mt-10">
                    <h3 style={{ fontFamily: "'PoltawskiNowy'" }} className=" font-bold mb-4 underline text-lg sm:text-xl">Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tour?.achievements?.map((ach, index) => (
                            <img
                                key={index}
                                src={`${BASE_URL}${ach.imageUrl}`}
                                alt="achievement"
                                className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-lg"
                            />
                        ))}
                    </div>
                </section>


                <div className="w-full relative flex bg-[#9F0712] bg-center rounded-xl justify-center my-6">
                    <div
                        className="
            w-full bg-cover relative   overflow-hidden
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
                bg-red-900 hover:bg-red-800
                text-white font-semibold  border
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


                <section className="mt-8 sm:mt-12">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 border p-2 sm:p-4 rounded-2xl">
                            <h2 style={{ fontFamily: "'PoltawskiNowy'" }} className="text-lg sm:text-xl md:text-2xl  font-bold mb-4">Write to us</h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <input type="hidden" value={form.packageTitle} readOnly />
                                <div>
                                    <label className="text-xs sm:text-lg text-gray-700 ">Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        readOnly
                                        className="border-b w-full p-2 text-sm bg-gray-100 cursor-not-allowed outline-none "
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs sm:text-lg text-gray-700 ">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        readOnly
                                        className="border-b w-full p-2 text-sm bg-gray-100 cursor-not-allowed outline-none "
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs sm:text-lg text-gray-700 ">Message</label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="border w-full p-2 resize-none text-sm bg-transparent outline-none "
                                        rows={4}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loadings}
                                    className={`px-6 py-2 rounded mt-2 text-sm sm:text-lg transition-colors  ${loadings ? "bg-gray-400 cursor-not-allowed text-white" : "bg-red-900 hover:bg-red-800 text-white"
                                        }`}
                                >
                                    {loadings ? "Submitting..." : "Submit"}
                                </button>
                            </form>
                        </div>
                        {booking?.contact && (
                            <div className="w-full border rounded-2xl border-[#0000006c] p-4 lg:w-80 xl:w-96">
                                <h3 className="text-gray-700 text-sm sm:text-lg mb-1 ">Contact</h3>
                                <h2 className="text-lg sm:text-xl md:text-2xl  font-bold mb-2">{booking?.contact.name}</h2>
                                <p className="text-gray-800 flex flex-col mb-2 text-sm sm:text-lg ">
                                    <span className="font-semibold sm:text-lg">Call To Expert</span>
                                    {(booking?.contact.mobiles || []).map((mobile, index) => {
                                        const cleanMobile = mobile
                                        return (
                                            <a key={`mobile-${index}`} href={`tel:${cleanMobile}`} className="text-gray-700 hover:underline">
                                                {cleanMobile}
                                            </a>
                                        );
                                    })}
                                </p>
                                <p className="text-gray-800 flex flex-col mb-2 text-sm sm:text-lg ">
                                    <span className="font-semibold">Email</span>
                                    {(booking?.contact.emails || []).map((email, index) => {
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
                                <p className="text-gray-800 flex flex-col mb-2 text-sm  sm:text-lg ">
                                    <span className="font-semibold">Address</span>
                                    <span>
                                        {booking?.contact.addresses?.[0]
                                            ? `${booking?.contact.addresses[0].street}, ${booking?.contact.addresses[0].area}, ${booking?.contact.addresses[0].city}, ${booking?.contact.addresses[0].state} ${booking?.contact.addresses[0].pincode}`
                                            : ""}
                                    </span>
                                </p>
                                <p className="text-gray-800 flex flex-col mb-2 text-sm sm:text-lg ">
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
                                <p className="text-gray-800 flex flex-col mb-2 text-sm sm:text-lg ">

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
                                        <span className="text-gray-800 mr-2 text-sm sm:text-lg ">Follow us on</span>
                                        {booking?.contact.socialLinks &&
                                            Object.entries(booking?.contact.socialLinks).map(([platform, link]) => {
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



                <footer className="text-center text-gray-700 text-sm sm:text-lg py-8 ">
                    © {softwareData?.year || new Date().getFullYear()} {softwareData?.companyName || "Rajasthan Tourism"}. All rights reserved.
                </footer>
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
  i,
  a,
  strong,
  em {
    font-family: 'Poltawski Nowy' !important;
  }
    .font-dancing {
  font-family: "Dancing Script", cursive !important;
}
  .itinerary-text {
    font-family: 'Dancing Script', cursive !important;
   
    font-style: italic  !important;
    text-shadow: 
        1px 1px 0px rgba(0,0,0,0.05),
        -1px -1px 0px rgba(0,0,0,0.05);
}



`}
            </style>

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

export default viewdatasenduser4;