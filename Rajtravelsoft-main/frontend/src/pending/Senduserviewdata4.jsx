import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { useReactToPrint } from "react-to-print";

// Solid icons
import { faPrint, faGlobe, faCoffee, faUtensils, faMoon, faCar, faCheckCircle, faTimesCircle, faFileContract, faUndoAlt, faPlane, faCircleInfo, faHotel, faLocationDot, faCalendar, faCircle, faLocationPin, faLocationPinLock, faLocationArrow, faUserGroup, faWallet, faTriangleExclamation, faBed } from "@fortawesome/free-solid-svg-icons";

// Regular icons
import { faArrowAltCircleDown, faStar } from "@fortawesome/free-regular-svg-icons";
import { FaStar, FaRegStar, FaArrowDown } from "react-icons/fa";

// Brand icons
import { faWhatsapp, faFacebookF, faTwitter, faInstagram, faLinkedinIn, faYoutube } from "@fortawesome/free-brands-svg-icons";
import Pdf from './Pdf';
import { Pointer } from 'lucide-react';

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

            <div
                className="absolute top-0 left-0 w-[30%] h-full z-0 bg-repeat-y bg-left block"
                style={{ backgroundImage: "url('/bl.jpg')", backgroundSize: "contain" }}
                aria-hidden="true"
            />
            <div
                className="absolute top-0 right-0 w-[30%] h-full z-0 bg-repeat-y bg-right block"
                style={{ backgroundImage: "url('/br.jpg')", backgroundSize: "contain" }}
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
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