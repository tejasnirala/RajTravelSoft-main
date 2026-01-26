import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from "react-helmet-async";
import { 
  Printer, Globe, Car, CheckCircle, 
  XCircle, FileText, RotateCcw, 
  MapPin, Calendar, Wallet, 
  ArrowRight, ArrowLeft, 
  ChevronDown, ChevronUp,
  Star, Clock, Building, Phone, Mail
} from "lucide-react";

// --- Custom Icons (Inline SVGs for Brands - From Design 4) ---
const BrandIcon = ({ name, className }) => {
    const icons = {
        whatsapp: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        ),
        facebook: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.059v.912h5.114l-.712 3.666h-4.402v7.98C19.61 21.58 24 15.4 24 8.237 24 3.687 20.317 0 15.766 0S1.533 3.687 1.533 8.237c0 7.163 4.389 13.341 7.568 15.454z"/></svg>
        ),
        instagram: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        ),
        youtube: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        ),
        linkedin: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
        )
    };
    return icons[name] || <Globe className={className} />;
};

// --- Hero Image Slider ---
const HeroSlider = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }, 4000); 
        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) return <div className="absolute inset-0 bg-black/60"></div>;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {images.map((img, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <img 
                        src={img.startsWith('http') ? img : `https://apitour.rajasthantouring.in${img}`} 
                        alt={`Hero Slide ${index}`} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
            ))}
        </div>
    );
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
                                className={`transition-all duration-300 cursor-pointer rounded-full ${
                                    currentIndex === slideIndex ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"
                                }`}
                            ></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Helper Functions from Logic 5 ---
const getHotelId = (hotel) => {
    if (typeof hotel === 'string') return hotel;
    if (hotel && typeof hotel === 'object') return hotel.id || hotel._id || null;
    return null;
};

const getVehicleId = (vehicle) => {
    if (typeof vehicle === 'string') return vehicle;
    if (vehicle && typeof vehicle === 'object') return vehicle.id || vehicle._id || null;
    return null;
};

const StarRating = ({ rating = 0 }) => {
    const total = 5;
    const r = Math.max(0, Math.min(5, Number(rating)));
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(total)].map((_, i) => {
                const fillPercent = Math.min(Math.max(r - i, 0), 1) * 100;
                return (
                    <div key={i} className="relative w-3.5 h-3.5">
                        <Star className="absolute top-0 left-0 text-gray-300 w-full h-full" strokeWidth={1.5} />
                        <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                            <Star className="text-yellow-500 w-full h-full fill-yellow-500" strokeWidth={0} />
                        </div>
                    </div>
                );
            })}
            <span className="text-xs text-gray-600 ml-1 font-medium">{r.toFixed(1)}</span>
        </div>
    );
};

// --- MAIN COMPONENT: ViewdataSendUser5 with Design 4 ---
const viewdatasenduser5 = ({ id: propId, autoDownload, onDownloadComplete }) => {
    const params = useParams();
    const id = params.id || propId;
    const navigate = useNavigate();
    const componentRef = useRef(null);
    const BASE_URL = "https://apitour.rajasthantouring.in";

    // --- STATES FROM LOGIC 5 ---
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
    const [openDayIndex, setOpenDayIndex] = useState(0); // Using 0 as default open like Design 4

    // Viewdata4/5 states
    const [softwareData, setSoftwareData] = useState(null);
    const [tour, setTour] = useState(null);
    const [structureData, setStructureData] = useState(null);
    
    // SEO / Meta
    const [titleState, setTitleState] = useState("Loading Booking...");
    const [descriptionState, setDescriptionState] = useState("Loading booking details...");
    const [ogDescriptionState, setOgDescriptionState] = useState("Loading...");
    const [ogImageState, setOgImageState] = useState("/logo1.png");

    // PDF States
    const [pdfLoading, setPdfLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [pdfStatus, setPdfStatus] = useState("");
    const [itineraryUrl, setItineraryUrl] = useState('');
    
    // Accordion State
    const [expandedItems, setExpandedItems] = useState({});
    
    // Scroll state for Design 4 Header
    const [scrolled, setScrolled] = useState(false);

    // --- EFFECTS & LOGIC FROM 5 ---

    // Scroll Effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleAccordion = (key) => {
        setExpandedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // PDF Logic (From Logic 5)
    const handlePrint = async () => {
        if (pdfLoading) return;
        setPdfLoading(true);
        setDownloadProgress(0);
        setPdfStatus("Starting download...");

        try {
            const pageUrl = new URL(itineraryUrl || window.location.href);
            pageUrl.searchParams.set("print", "1");

            const fullUrl = `${BASE_URL}/api/generate-pdf?url=${encodeURIComponent(pageUrl.toString())}`;

            setPdfStatus("Rendering PDF (15-20 seconds)...");
            const startTime = Date.now();

            const response = await fetch(fullUrl, { method: 'GET', timeout: 120000 });

            if (!response.ok) throw new Error(await response.text());

            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);

            if (!total) throw new Error("Server did not provide file size");

            const reader = response.body.getReader();
            const chunks = [];
            let loaded = 0;

            setPdfStatus("Downloading...");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                const progress = Math.round((loaded / total) * 100);
                setDownloadProgress(progress);
                setPdfStatus(`Downloading... ${progress}%`);
            }

            const blob = new Blob(chunks, { type: 'application/pdf' });
            const timeTaken = Math.round((Date.now() - startTime) / 1000);

            if (blob.size === 0) throw new Error("Downloaded PDF is empty");

            setPdfStatus(`Processing (${timeTaken}s)...`);

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Booking_${booking?.clientDetails?.name || "Traveler"}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            setPdfStatus("✅ Downloaded successfully!");
            setTimeout(() => {
                setPdfStatus("");
                setDownloadProgress(0);
                if (onDownloadComplete) onDownloadComplete();
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
        if (autoDownload && id && booking && componentRef.current && itineraryUrl) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [autoDownload, id, booking, componentRef.current, itineraryUrl]);

    // Data Fetching Logic (From Logic 5)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                let bookingResponse = null;
                try {
                    const res = await axios.get(`${BASE_URL}/api/pending/${id}`);
                    if (res.status === 200 && res.data) bookingResponse = res;
                } catch (err) { console.log("Pending API failed"); }

                if (!bookingResponse) {
                    try {
                        const res = await axios.get(`${BASE_URL}/api/previewPending/${id}`);
                        if (res.status === 200 && res.data) bookingResponse = res;
                    } catch (err) { throw err; }
                }

                const data = bookingResponse.data;
                setBooking(data);

                if (data && Object.keys(data.hotelSelections || {}).length > 0) {
                    const categories = Object.keys(data.hotelSelections);
                    setSelectedCategory(data.selectedCategory || categories[0]);
                }

                setPolicies({
                    inclusions: data.inclusions || [],
                    exclusions: data.exclusions || [],
                    termsAndConditions: data.termsAndConditions || [],
                    cancellationAndRefundPolicy: data.cancellationAndRefundPolicy || [],
                    travelRequirements: data.travelRequirements || [],
                });

                if (data?.theme?.link) {
                    const base = window.location.origin;
                    setItineraryUrl(`${base}/Senduser${data.theme.link}/${id}`);
                } else {
                    setItineraryUrl(window.location.href);
                }

                const softwareRes = await axios.get(`${BASE_URL}/api/toursoftware`);
                if (softwareRes.data && softwareRes.data.length > 0) setSoftwareData(softwareRes.data[0]);

                const tourRes = await axios.get(`${BASE_URL}/api/achivement`);
                setTour(tourRes.data);

                const structureRes = await axios.get(`${BASE_URL}/api/structure`);
                setStructureData(structureRes.data);
                setUser(structureRes.data);

            } catch (err) {
                console.error("Outer Error:", err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    useEffect(() => {
        if (booking?.clientDetails) {
            setForm(prev => ({
                ...prev,
                name: booking.clientDetails.name || "",
                email: booking.clientDetails.email || "",
                packageTitle: booking?.itineraryData?.titles?.[0] || "",
            }));
        }
    }, [booking]);

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

    // Selection Logic (Logic 5)
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
            await axios.put(`${BASE_URL}/api/pending/${id}`, {
                itineraryData: { ...booking.itineraryData, vehicle: updatedVehicles },
                vehicleConfirmed: true,
            });
            const response = await axios.get(`${BASE_URL}/api/pending/${id}`);
            setBooking(response.data);
        } catch (err) {
            setError('Failed to confirm vehicle selection');
            setSelectedVehicleId(null);
        }
    };

    // --- HELPERS FOR RENDERING ---
    const getNumericValue = (field, category) => {
        const val = field?.[category];
        if (typeof val === 'number') return val;
        return val?.value || 0;
    };

    const getCategoryTotals = () => {
        if (!booking?.itineraryData) return {};
        const totals = {};
        const festivalValue = booking.itineraryData.festivalOffer?.value || 0;
        const categories = Object.keys(booking.itineraryData.pricing || {});
        categories.forEach(category => {
            const price = getNumericValue(booking.itineraryData.pricing, category);
            const offer = getNumericValue(booking.itineraryData.offers, category);
            const afterOffer = price - offer;
            const festivalDiscount = afterOffer * (festivalValue / 100);
            totals[category] = afterOffer - festivalDiscount;
        });
        return totals;
    };

    const getDateForDays = (dayNumber) => {
        if (!booking?.clientDetails?.travelDate) return `Day ${dayNumber}`;
        const normalized = booking.clientDetails.travelDate.replace(/\//g, "-");
        const [day, month, year] = normalized.split("-");
        const startDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(startDate.getTime())) return `Day ${dayNumber}`;
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayNumber - 1);
        return targetDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    // --- RENDER (Design 4 Structure) ---
    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div></div>;
    if (error) return <div className="p-6 text-center text-red-500 font-bold">{error}</div>;
    if (!booking) return <div className="p-6 text-center">Booking not found</div>;

    const categories = Object.keys(booking.hotelSelections || {});
    const categoryTotals = getCategoryTotals();

    // Image shuffling logic from Viewdata5 adapted for HeroSlider
    const days = booking?.itineraryData?.days || [];
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

    // Vehicle Logic
    const vehicleList = Array.isArray(booking.itineraryData?.vehicle) ? booking.itineraryData.vehicle : (booking.itineraryData?.vehicle ? [booking.itineraryData.vehicle] : []);
    const showVehicleEverywhere = vehicleList.length === 1 || selectedVehicleId !== null;
    const universalVehicle = vehicleList.length === 1 ? vehicleList[0] : vehicleList.find(v => getVehicleId(v) === selectedVehicleId);

    const tabKeyMap = {
        'Inclusions': 'inclusions',
        'Exclusions': 'exclusions',
        'Terms & Conditions': 'termsandconditions',
        'Cancellation & Refund Policy': 'cancellationandrefundpolicy',
        'Payment Policy': 'travelrequirements'
    };
    const tabIcons = {
        'Inclusions': CheckCircle,
        'Exclusions': XCircle,
        'Terms & Conditions': FileText,
        'Cancellation & Refund Policy': RotateCcw,
        'Payment Policy': Wallet
    };

    return (
        <div ref={componentRef} className="relative font-['Manrope'] bg-gray-50 min-h-screen w-full antialiased text-gray-800">
            <Helmet>
                <title>{`${booking.clientDetails.name} - Trip`}</title>
                <link href="https://fonts.googleapis.com/css2?family=Kaushan+Script&family=Manrope:wght@300;400;500;600;700;800&family=Oswald:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Helmet>

            {/* Sticky Decorative Image */}
            <div className="hidden lg:block fixed right-0 top-1/4 z-0 pointer-events-none opacity-90 w-24 xl:w-32">
                 <img src="https://media1.thrillophilia.com/filestore/85sot70hodekrzm9bvekja2p7i7y_498903915-artboard-1.png?w=200&dpr=1.3" alt="Decoration" className="w-full h-auto" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <img 
                        src={structureData?.logo ? (structureData.logo.startsWith("/uploads") ? `${BASE_URL}${structureData.logo}` : structureData.logo) : "/logo1.png"} 
                        alt="Logo" 
                        className="h-10 sm:h-12 w-auto object-contain" 
                    />
                    <div className="flex items-center gap-3">
                        {booking?.contact?.mobiles?.[0] && (
                            <a href={`https://wa.me/${booking.contact.mobiles[0].replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${scrolled ? 'bg-green-600 text-white' : 'bg-white/20 backdrop-blur-sm text-white border border-white/40'}`}>
                                <BrandIcon name="whatsapp" className="w-5 h-5" /> <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                        )}
                        <button onClick={handlePrint} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${scrolled ? 'bg-red-900 text-white' : 'bg-white text-red-900'}`} disabled={pdfLoading}>
                            <Printer size={18} /> <span className="hidden sm:inline">{pdfLoading ? pdfStatus || "Generating..." : "PDF"}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative w-full h-[60vh] sm:h-[70vh] flex items-center justify-center bg-black">
                <HeroSlider images={heroImages} />
                <div className="relative z-10 text-center px-4 mt-10">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl text-[#fdbb2e] font-['Kaushan_Script'] mb-2 transform -rotate-2 drop-shadow-lg">
                        {booking.clientDetails.name ? `${booking.clientDetails.name}'s` : "Your"}
                    </h2>
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white font-['Oswald'] tracking-wider uppercase drop-shadow-2xl">
                        RAJASTHAN <span className="block text-2xl sm:text-4xl font-['Manrope'] font-light tracking-[0.2em] mt-2">TRIP</span>
                    </h1>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full mt-6 text-white">
                        <Clock className="text-[#fdbb2e]" size={20} />
                        <span className="font-semibold tracking-wide">{booking.itineraryData.days.length} Days | {Math.max(0, booking.itineraryData.days.length - 1)} Nights</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-20 mt-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT COLUMN */}
                    <div className="w-full lg:w-2/3 space-y-8">
                        
                        {/* ITINERARY */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-3xl font-bold font-['Oswald'] text-gray-900 uppercase">Itinerary Details</h2>
                                <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                            </div>

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
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* HOTELS */}
                        {categories.length > 0 && (
                            <div className="pt-8 mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-3xl sm:text-4xl font-bold font-['Oswald'] text-gray-900 uppercase tracking-wide">ACCOMMODATIONS</h2>
                                    <div className="h-0.5 flex-1 bg-gray-300 rounded-full mt-1"></div>
                                </div>
                                
                                {categories.map(cat => {
                                    const hotels = booking.itineraryData.hotels?.[cat];
                                    if(!hotels) return null;
                                    const uniqueHotels = [];
                                    const seen = new Set();
                                    
                                    // Logic to gather unique hotels for display (simplified from Logic 5 for display)
                                    Object.values(hotels).forEach(dayH => {
                                        Object.keys(dayH).forEach(city => {
                                            if(city === 'selected' || city === 'category') return;
                                            ['stayOnly','breakfast','lunch','dinner'].forEach(meal => {
                                                const opts = dayH[city]?.[meal]?.options || [];
                                                opts.forEach(h => {
                                                    const hid = getHotelId(h);
                                                    if(!seen.has(hid)) {
                                                        seen.add(hid);
                                                        uniqueHotels.push({...h, city});
                                                    }
                                                });
                                            });
                                        });
                                    });

                                    if(uniqueHotels.length === 0) return null;

                                    return (
                                        <div key={cat} className="mb-10">
                                            {categories.length > 1 && (
                                                <h3 className="text-xl font-bold text-red-900 mb-5 capitalize font-['Manrope']">
                                                    {cat} Package Stays
                                                </h3>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {uniqueHotels.map(hotel => (
                                                    <div key={getHotelId(hotel)} className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex h-[140px] group">
                                                        <div className="w-[140px] h-full relative flex-shrink-0 bg-gray-200 overflow-hidden">
                                                            {hotel.image ? (
                                                                <img src={`${BASE_URL}${hotel.image}`} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><Building size={32} /></div>
                                                            )}
                                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-[2px] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                                                {hotel.city}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 font-['Manrope']">
                                                                    {hotel.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <StarRating rating={hotel.rating} />
                                                                </div>
                                                            </div>
                                                            
                                                            <a href={hotel.googleReviewLink || "#"} target="_blank" rel="noreferrer" 
                                                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 transition-colors">
                                                                View on Google Maps
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* POLICIES */}
                        <div className="pt-4">
                             <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-3xl font-bold font-['Oswald'] text-gray-900 uppercase">Policies & Info</h2>
                                <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                            </div>
                            
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                                    {Object.keys(tabIcons).map((tab) => {
                                        const key = tabKeyMap[tab];
                                        const isActive = activeTab === key;
                                        const Icon = tabIcons[tab];
                                        return (
                                            <button key={tab} onClick={() => setActiveTab(key)}
                                                className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${isActive ? 'text-red-900 border-red-900 bg-red-50/30' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                                                <Icon size={16} /> {tab}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="p-6">
                                    {activeTab === 'inclusions' ? (
                                        <div className="space-y-3">
                                            {policies.inclusions.map((item, i) => (
                                                <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                                                     <button onClick={() => toggleAccordion(`inc-${i}`)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left">
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="text-green-600" size={18} />
                                                            <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                                                        </div>
                                                        {expandedItems[`inc-${i}`] ? <ChevronUp className="text-gray-400" size={16} /> : <ChevronDown className="text-gray-400" size={16} />}
                                                    </button>
                                                    {expandedItems[`inc-${i}`] && (
                                                        <div className="p-4 bg-white text-sm text-gray-600 border-t border-gray-100 leading-relaxed flex gap-4">
                                                            {item.image && <img src={`${BASE_URL}/${item.image}`} alt="" className="w-16 h-16 object-cover rounded-md" />}
                                                            <div>{item.description}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {policies[activeTab]?.map((item, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <span className="text-red-900 mt-0.5">•</span>
                                                    <span><strong className="block text-gray-900 mb-1">{item.title}</strong>{item.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full lg:w-1/3 relative">
                        <div className={`space-y-6 ${scrolled ? 'lg:sticky lg:top-24' : ''}`}>
                            {/* Price Card */}
                            {categories.map(cat => {
                                const total = categoryTotals[cat];
                                const price = getNumericValue(booking.itineraryData.pricing, cat);
                                return (
                                    <div key={cat} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-800 to-red-600"></div>
                                            <div className="p-6">
                                                {categories.length > 1 && <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{cat} Package</div>}
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-sm text-gray-500 line-through">₹{(price * 1.2).toLocaleString()}</span>
                                                    <div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">20% OFF</div>
                                                </div>
                                                <div className="flex items-end gap-1 mb-6">
                                                    <span className="text-4xl font-['Oswald'] font-bold text-gray-900">₹{total?.toLocaleString()}</span>
                                                    <span className="text-gray-500 font-medium mb-1.5">/ person</span>
                                                </div>
                                                <button onClick={() => navigate(`/userpayment/${booking._id}?tab=Optional`)}
                                                    className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition-all mb-4 flex items-center justify-center gap-2">
                                                    Book Now <ArrowRight size={18} />
                                                </button>
                                                <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    <div className="flex justify-between"><span>Booking Amount</span><span className="font-bold text-gray-900">₹{getNumericValue(booking.itineraryData.bookingAmount, cat).toLocaleString()}</span></div>
                                                    <div className="flex items-center gap-2 text-green-700"><CheckCircle size={12} /> Best Price Guaranteed</div>
                                                </div>
                                            </div>
                                    </div>
                                )
                            })}

                            {/* Inquiry Form */}
                            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                                <h3 className="font-['Oswald'] text-xl font-bold mb-4 text-gray-800 uppercase">Have Questions?</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Name</label><input type="text" value={form.name} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={form.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Message</label><textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} rows="3" placeholder="Type your query here..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-900 outline-none" required></textarea></div>
                                    <button type="submit" disabled={loadings} className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl transition text-sm">{loadings ? 'Sending...' : 'Send Enquiry'}</button>
                                </form>
                            </div>

                            {/* Contact */}
                            {booking.contact && (
                                <div className="bg-gradient-to-br from-red-900 to-black text-white rounded-2xl shadow-md p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3"><Globe size={100} /></div>
                                    <h3 className="font-['Oswald'] text-lg font-bold mb-4 uppercase tracking-wider opacity-80">Need Help?</h3>
                                    <div className="space-y-4 relative z-10">
                                        <div><p className="text-xs text-white/60 uppercase font-bold">Call Our Expert</p><a href={`tel:${booking.contact.mobiles?.[0]}`} className="text-xl font-bold hover:text-yellow-400 transition">{booking.contact.mobiles?.[0]}</a></div>
                                        <div><p className="text-xs text-white/60 uppercase font-bold">Email Us</p><a href={`mailto:${booking.contact.emails?.[0]}`} className="text-sm font-medium hover:text-yellow-400 transition truncate block">{booking.contact.emails?.[0]}</a></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="bg-gray-900 text-white/40 text-center py-6 text-sm border-t border-white/10">
                 © {new Date().getFullYear()} {softwareData?.companyName || "Rajasthan Tourism"}. All rights reserved.
            </footer>
        </div>
    );
};

export default viewdatasenduser5;