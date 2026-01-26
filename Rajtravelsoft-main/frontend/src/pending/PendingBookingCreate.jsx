"use client"

import axios from "axios"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FastLazyImage from "../LazyImage"
import { Trash2, MapPin, Coffee, CoffeeIcon, Upload, Plus, IndianRupee, CarFront, Moon, User, Phone, Mail, Percent, ArrowDown, LocationEdit, LocateFixedIcon, Info, X, Star, Tag, ExternalLink } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ItineraryAISuggestions from '../itenery/ItineraryAISuggestions'; // Path adjust करें
// Solid icons
import { faPrint, faGlobe, faFileContract, faUndoAlt, faPlane, faCircleInfo, faLocationArrow, faWallet, faCoffee, faUtensils, faMoon, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";




const RichTextEditor = React.memo(({ value, onChange }) => {
    const quillRef = useRef();
    const prevValueRef = useRef(value); // ✅ Track previous value

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean'],
                ['link'],
            ],
        },
    }), []);

    const handleChange = useCallback((content) => {
        // ✅ Only call onChange if content actually changed
        if (prevValueRef.current !== content) {
            prevValueRef.current = content;
            onChange(content);
        }
    }, [onChange]);

    return (
        <ReactQuill
            ref={quillRef}
            value={value}
            onChange={handleChange}
            modules={modules}
            theme="snow"
            placeholder="Enter description..."
        />
    );
}, (prevProps, nextProps) => {
    // ✅ Custom comparison for memo
    return prevProps.value === nextProps.value &&
        prevProps.onChange === nextProps.onChange;
});


export default function PendingBookingCreate() {
    const componentRef = useRef(null);
    const [step, setStep] = useState("client-details")
    const create = useContext(AuthContext);
    let adminuser = create.user
    const [selectedHotelInfo, setSelectedHotelInfo] = useState(null);

    console.log(adminuser);

    const today = new Date().toISOString().split("T")[0];

    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get("id"); // Get ID for edit mode
    const [isEditMode, setIsEditMode] = useState(!!editId);
    const [showNote, setShowNote] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [typedTitle, setTypedTitle] = useState({});
    const [isAISuggestionApplying, setIsAISuggestionApplying] = useState(false);
    const [isBookingSaved, setIsBookingSaved] = useState(false);
    const [clientDetails, setClientDetails] = useState({
        name: "",
        // Title will be kept in separate state (see `title` below). `name` holds the displayed name (prefixed).
        email: "",
        email2: "",
        phone: "",
        adults: "",
        kids5to12: "",
        kidsBelow5: "",
        rooms: "",
        extraBeds: "",
        travelDate: "",
        travelers: 1,
    })

    console.log(clientDetails);

    const [displayName, setDisplayName] = useState("");
    const [selectedItinerary, setSelectedItinerary] = useState({ duration: "", })
    // Title/prefix state (Mr/Ms/Mrs/Miss). We'll keep title separately and ensure it's applied to clientDetails.name
    const [title, setTitle] = useState("");
    // Title select करने पर
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Current name से पुरानी title remove करें
        let currentName = clientDetails.name || "";
        const stripped = currentName.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Miss|Dr\.?|Prof\.?|Er\.?|Engr\.?)\s*/i, "").trim();

        // नई title + name
        const finalName = newTitle ? `${newTitle} ${stripped}`.trim() : stripped;
        setClientDetails({ ...clientDetails, name: finalName });
    }

    // Name input करने पर
    const handleNameChange = (e) => {
        let value = e.target.value || "";

        // Input me likhe title ko hatao
        value = value.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Miss|Dr\.?|Prof\.?|Er\.?|Engr\.?)\s*/i, "");

        // Multiple spaces normalize karo
        value = value.replace(/\s+/g, " ").trimStart();

        // Input me sirf name show hoga
        // Lekin state me title ke sath save karenge
        let finalName = "";
        if (title && value) {
            finalName = `${title} ${value}`.replace(/\s+/g, " ");
        } else if (title && !value) {
            finalName = title;
        } else {
            finalName = value;
        }

        // ✅ State update (title + name save hoga)
        setClientDetails({ ...clientDetails, name: finalName });

        // ✅ Input field me sirf name dikhana hai (title nahi)
        setDisplayName(value);
    };

    useEffect(() => {
        setTimeout(() => {
            document.querySelectorAll("*")
                .forEach(el => el.scrollTo?.({ top: 0, behavior: "smooth" }));
        }, 50);
    }, [step]);

    // ✅ Fetch booking data in edit mode
    useEffect(() => {
        if (isEditMode && editId) {
            const fetchBooking = async () => {
                try {
                    const res = await axios.get(`https://apitour.rajasthantouring.in/api/pending/${editId}`);
                    const data = res.data;

                    console.log("Fetched booking data:", data);

                    // Convert travel date from DD-MM-YYYY to YYYY-MM-DD for input
                    let formattedDate = data.clientDetails?.travelDate || "";
                    if (formattedDate && formattedDate.includes("-")) {
                        const parts = formattedDate.split("-");
                        if (parts.length === 3 && parts[0].length <= 2) {
                            // DD-MM-YYYY format
                            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }

                    // Extract title from name
                    const fullName = data.clientDetails?.name || "";
                    const titleMatch = fullName.match(/^(Mr\.?|Ms\.?|Mrs\.?|Miss)\s*/i);
                    if (titleMatch) {
                        setTitle(titleMatch[1]);
                        const nameWithoutTitle = fullName.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Miss)\s*/i, "").trim();
                        setDisplayName(nameWithoutTitle);
                    } else {
                        setDisplayName(fullName);
                    }

                    // Normalize pricing, offers, bookingAmount from object format to simple values
                    const normalizedItineraryData = { ...data.itineraryData };
                    if (data.noteText) {
                        setNoteText(data.noteText)
                        setShowNote(true)
                    }

                    // Convert pricing from {luxury: {value: 18000}} to {luxury: 18000}
                    if (normalizedItineraryData.pricing) {
                        const normalizedPricing = {};
                        Object.keys(normalizedItineraryData.pricing).forEach(cat => {
                            const priceData = normalizedItineraryData.pricing[cat];
                            normalizedPricing[cat] = typeof priceData === 'object' && priceData.value !== undefined
                                ? priceData.value
                                : priceData;
                        });
                        normalizedItineraryData.pricing = normalizedPricing;
                    }

                    // Convert offers
                    if (normalizedItineraryData.offers) {
                        const normalizedOffers = {};
                        Object.keys(normalizedItineraryData.offers).forEach(cat => {
                            const offerData = normalizedItineraryData.offers[cat];
                            normalizedOffers[cat] = typeof offerData === 'object' && offerData.value !== undefined
                                ? offerData.value
                                : offerData;
                        });
                        normalizedItineraryData.offers = normalizedOffers;
                    }

                    if (normalizedItineraryData.offers === undefined || normalizedItineraryData.offers === null) {
                        normalizedItineraryData.offers = {};
                    }


                    // Convert bookingAmount
                    if (normalizedItineraryData.bookingAmount) {
                        const normalizedBookingAmount = {};
                        Object.keys(normalizedItineraryData.bookingAmount).forEach(cat => {
                            const amountData = normalizedItineraryData.bookingAmount[cat];
                            normalizedBookingAmount[cat] = typeof amountData === 'object' && amountData.value !== undefined
                                ? amountData.value
                                : amountData;
                        });
                        normalizedItineraryData.bookingAmount = normalizedBookingAmount;
                    }

                    // Convert highlightPrice
                    if (normalizedItineraryData.highlightPrice) {
                        const normalizedHighlightPrice = {};
                        Object.keys(normalizedItineraryData.highlightPrice).forEach(cat => {
                            const priceData = normalizedItineraryData.highlightPrice[cat];
                            normalizedHighlightPrice[cat] = typeof priceData === 'object' && priceData.value !== undefined
                                ? priceData.value
                                : priceData;
                        });
                        normalizedItineraryData.highlightPrice = normalizedHighlightPrice;
                    }

                    const hotelSelectionDays = {};

                    const backendDays = data?.hotelSelectionDays || {};


                    Object.keys(data.itineraryData?.hotels || {}).forEach(category => {

                        hotelSelectionDays[category] = {};


                        data.itineraryData?.days?.forEach(day => {
                            const dayId = day.id.toString();

                            // 1️⃣ If backend has value — use EXACTLY that
                            if (backendDays[category] && backendDays[category][dayId] !== undefined) {
                                hotelSelectionDays[category][dayId] = backendDays[category][dayId];
                                return;
                            }
                            // 2️⃣ If backend does NOT have this day — default = FALSE
                            hotelSelectionDays[category][dayId] = false;

                        });
                    });

                    const stayOnlyDays = {};
                    const backendStayDays = data?.stayOnlyDays || {};

                    Object.keys(data.itineraryData?.hotels || {}).forEach(category => {
                        stayOnlyDays[category] = {};

                        data.itineraryData?.days?.forEach(day => {
                            const dayId = day.id.toString();

                            // Backend se value load karo
                            if (backendStayDays[category] && backendStayDays[category][dayId] !== undefined) {
                                stayOnlyDays[category][dayId] = backendStayDays[category][dayId];
                            } else {
                                stayOnlyDays[category][dayId] = false;
                            }
                        });
                    });




                    // Populate all states from fetched data
                    // setClientDetails({
                    //     ...data.clientDetails,
                    //     travelDate: formattedDate
                    // });
                    setClientDetails({
                        ...data.clientDetails,
                        email2: data.clientDetails?.email2 || "",  // ✅ Add this
                        travelDate: formattedDate
                    });

                    // Use hotels from itineraryData instead of hotelSelections for display
                    setItineraryData({
                        ...normalizedItineraryData,
                        hotels: data.itineraryData?.hotels || data.hotelSelections || {},
                        hotelSelectionDays: hotelSelectionDays,
                        stayOnlyDays: stayOnlyDays
                    });
                    // setHotelSelections(data.hotelSelections || {});
                    setHotelSelectionDays(hotelSelectionDays);
                    setHotelSelectionDays(hotelSelectionDays);
                    setBookingInclusions(data.inclusions || []);
                    setBookingExclusions(data.exclusions || []);
                    setSelectedCategories(Object.keys(data.hotelSelections || {}));
                    setSelectedTheme(data.theme || null);
                    setStructure(data.structure || null);
                    setSelectedContact(data.contact || null);




                    // ---------------- EDIT MODE NORMALIZATION ----------------

                    // 🔥 Convert itineraryData.hotels into clean hotelSelections format
                    const normalizedHotelSelections = {};

                    Object.keys(data.itineraryData?.hotels || {}).forEach(category => {
                        normalizedHotelSelections[category] = {};

                        Object.keys(data.itineraryData.hotels[category]).forEach(dayId => {
                            normalizedHotelSelections[category][dayId] = {};

                            Object.keys(data.itineraryData.hotels[category][dayId]).forEach(location => {
                                const meals = data.itineraryData.hotels[category][dayId][location];
                                normalizedHotelSelections[category][dayId][location] = {};

                                ["breakfast", "lunch", "dinner", "stayOnly"].forEach(meal => {
                                    const raw = meals?.[meal];

                                    if (!raw) {
                                        normalizedHotelSelections[category][dayId][location][meal] = [];
                                        return;
                                    }

                                    if (Array.isArray(raw)) {
                                        normalizedHotelSelections[category][dayId][location][meal] =
                                            raw.map(h => h.id || h._id);
                                    }
                                    else if (raw?.options) {
                                        normalizedHotelSelections[category][dayId][location][meal] =
                                            raw.options.map(h => h.id || h._id);
                                    }
                                    else {
                                        normalizedHotelSelections[category][dayId][location][meal] = [];
                                    }
                                });
                            });
                        });
                    });

                    // 🔥🔥 AUTO-PROPAGATE FIX — paste HERE, right before setHotelSelections()
                    Object.keys(normalizedHotelSelections).forEach(category => {
                        Object.keys(normalizedHotelSelections[category]).forEach(dayId => {
                            Object.keys(normalizedHotelSelections[category][dayId]).forEach(location => {

                                const meals = normalizedHotelSelections[category][dayId][location];
                                const mealNames = ["breakfast", "lunch", "dinner", "stayOnly"];

                                let all = [];
                                mealNames.forEach(m => {
                                    all = all.concat(meals[m] || []);
                                });

                                const unique = [...new Set(all)];

                                if (unique.length === 2) {

                                    mealNames.forEach(m => {
                                        const original = meals[m] || [];

                                        // ✅ CASE 1: If original meal already had 1 hotel → fill 2
                                        if (original.length === 1) {
                                            meals[m] = [...unique];
                                        }

                                        // ❌ CASE 2: If original meal had 0 → DO NOT fill (keep empty)
                                        if (original.length === 0) {
                                            meals[m] = [];
                                        }
                                    });
                                }

                            });
                        });
                    });

                    console.log("AFTER FIX:", normalizedHotelSelections);

                    // 🔥 Load normalized + fixed data
                    setHotelSelections(normalizedHotelSelections);



                    let selected = data.selectedItinerary;

                    if (!selected) {
                        setSelectedItinerary(null);
                    } else {
                        // ✅ Check if it's blank
                        const isBlankItinerary =
                            selected._id === "blank" ||
                            selected._id === "" ||
                            !selected._id ||
                            selected.isBlank === true ||
                            String(selected.isBlank) === "true";

                        if (isBlankItinerary) {
                            selected = {
                                _id: "blank",
                                isBlank: true,
                                titles: selected.titles || ["Custom Itinerary"],
                                descriptions: selected.descriptions || ["Create your own custom itinerary"],
                                packagePricing: selected.packagePricing || {},
                                duration: selected.duration || ""
                            };
                        }

                        setSelectedItinerary(selected);
                    }

                    // अगर blank है तो directly itinerary-builder पर जाओ
                    if (selectedItinerary?.isBlank || selected?.isBlank) {
                        setStep("itinerary-builder");
                    } else {
                        setStep("itinerary-builder");
                    }
                } catch (err) {
                    console.error("Failed to fetch booking:", err);
                    setError("Failed to load booking data.");
                }
            };
            fetchBooking();
        } else {
            // Auto-fill client details from URL on first render (create mode)
            const name = searchParams.get("name");
            const email = searchParams.get("email");
            let phone = searchParams.get("phone");

            if (phone && !phone.startsWith("+")) {
                phone = "+91" + phone.replace(/^0+/, "");
            }

            // Remove title from incoming name
            const incoming = name || "";
            const stripped = incoming.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Miss)\s*/i, "").trim();

            // 👇 IMPORTANT: input field ke liye name dikhana
            setDisplayName(stripped);     // <-- yahi missing tha

            setClientDetails((prev) => ({
                ...prev,
                name: title ? `${title} ${stripped}`.trim() : stripped,
                email: email || prev.email,
                phone: phone || prev.phone,
            }));
        }

    }, [isEditMode, editId]);





    console.log(selectedItinerary, "selectedCategoriesselectedCategories");


    const [searchTerm, setSearchTerm] = useState("")
    const [tourCodeFilter, setTourCodeFilter] = useState("")
    const [itineraries, setItineraries] = useState([])
    const [hotels, setHotels] = useState([])
    const [categories, setCategories] = useState([])
    const [locations, setLocations] = useState([])

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [success, setSuccess] = useState("");
    const [inclusions, setInclusions] = useState([]);
    const [exclusions, setExclusions] = useState([]);

    const [terms, setTerms] = useState([]);
    const [bookingInclusions, setBookingInclusions] = useState([]);
    const [bookingExclusions, setBookingExclusions] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [themes, setThemes] = useState([]);
    const [structure, setStructure] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);


    const [cancellationAndRefundPolicy, setCancellationAndRefundPolicy] = useState([]);
    const [travelRequirements, setTravelRequirements] = useState([]);


    // Multi-category support
    const [selectedCategories, setSelectedCategories] = useState([]);


    function toDateOnly(dateStr) {
        if (!dateStr) return "";

        // If ISO (contains T)
        if (dateStr.includes("T")) {
            return dateStr.split("T")[0];
        }

        // If yyyy-mm-dd (already OK)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        // If dd/mm/yyyy
        if (dateStr.includes("/")) {
            const [dd, mm, yyyy] = dateStr.split("/");
            return `${yyyy}-${mm}-${dd}`;
        }

        return dateStr;
    }

    function toLocalDate(dateStr) {
        if (!dateStr) return null;
        const [y, m, d] = toDateOnly(dateStr).split("-").map(Number);
        return new Date(y, m - 1, d); // timezone-safe date
    }



    const [itineraryData, setItineraryData] = useState({
        titles: [""],
        descriptions: [""],
        date: "",
        images: [],
        duration: "",
        days: [
            {
                id: 1,
                titles: [""],
                descriptions: [""],
                locations: [""],
                images: [],
            },
        ],
        tourcode: '',
        itineraryTourcode: '',
        pricing: {},
        offers: {},
        bookingAmount: {},
        vehicle: [], // Changed to array to support up to 2 selections
        hotels: {},
        highlightPrice: {},
        festivalOffer: { name: "", value: 0 }, // NEW: Festival Offer { name: string, value: number (percentage) }
        priceType: "Whole Group/Family",
        createby: null,
        hotelSelectionDays: {},
        duration: ""

    })

    console.log(itineraryData, "itineraryDataitineraryData");


    const [bookingId, setBookingId] = useState(null)
    const [bookingData, setBookingData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadings, setLoadings] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [durationFilter, setDurationFilter] = useState("")
    const [vehicles, setVehicles] = useState([]);
    const [hotelSelections, setHotelSelections] = useState({});
    const [hotelSelectionDays, setHotelSelectionDays] = useState({});
    const [editingInclusions, setEditingInclusions] = useState(false);
    const [editingExclusions, setEditingExclusions] = useState(false);
    const [editableInclusions, setEditableInclusions] = useState([]);
    const [editableExclusions, setEditableExclusions] = useState([]);
    const [selectedSpecialInclusions, setSelectedSpecialInclusions] = useState([]);
    const [dayAccommodationType, setDayAccommodationType] = useState({});
    // Fetch single global document
    const fetchData = async () => {
        try {
            const res = await axios.get("https://apitour.rajasthantouring.in/api/tour-inclusion-exclusion");
            console.log(res.data, "sadfasdf");

            if (res.data.data) {
                const convertToImagesArray = (items) => items.map(item => ({
                    ...item,
                    images: item.image ? [item.image.replace(/\\/g, "/")] : []
                })) || [];

                setInclusions(convertToImagesArray(res.data.data.inclusions));
                setExclusions(convertToImagesArray(res.data.data.exclusions));
                setTerms(convertToImagesArray(res.data.data.termsAndConditions));
                setCancellationAndRefundPolicy(convertToImagesArray(res.data.data.cancellationAndRefundPolicy));
                setTravelRequirements(convertToImagesArray(res.data.data.travelRequirements));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData()
    }, [])




    // Fetch user data
    const fetchUser = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.ok) {
                setUser(data.user);
                setItineraryData(prev => ({ ...prev, createby: data.user }));
            } else {
                setUser(null);
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setUser(null);
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };


    const handleDayStayToggle = (category, dayId, isChecked) => {
        console.log(`🔄 Toggling Stay Only Day ${dayId} for ${category}: ${isChecked}`);

        setItineraryData(prev => {
            const updatedData = { ...prev };

            if (!updatedData.stayOnlyDays) {
                updatedData.stayOnlyDays = {};
            }
            if (!updatedData.stayOnlyDays[category]) {
                updatedData.stayOnlyDays[category] = {};
            }

            updatedData.stayOnlyDays[category][dayId] = isChecked;
            console.log(`✅ Updated stayOnlyDays:`, updatedData.stayOnlyDays);
            return updatedData;
        });
    };


    useEffect(() => {
        fetchUser();
    }, []);

    // Special inclusions that need to be selected
    const SPECIAL_INCLUSION_TITLES = ["Ranthambhore", "Jaisalmer Desert", "Ranthambhore Gypsy"];


    // Locate this section in your code and replace the BLANK_ITINERARY

    const BLANK_ITINERARY = {
        _id: "blank",
        titles: ["Custom Itinerary"],
        descriptions: ["Create your own custom itinerary"],
        date: new Date().toISOString().split("T")[0],
        duration: "2 Days / 1 Night",
        images: [],
        packagePricing: {},
        days: [
            {
                id: 1,
                titles: ["Day 1"],  // ✅ 'title' की जगह 'titles' array
                descriptions: ["Add your activities for Day 1"],  // ✅ array होना चाहिए
                locations: ["Location 1"],
                images: [],
            },
            {
                id: 2,
                titles: ["Day 2"],  // ✅ 'title' की जगह 'titles' array
                descriptions: ["Add your activities for Day 2"],  // ✅ array होना चाहिए
                locations: ["Location 2", "Departure"],
                images: [],
            }
        ],
        tourcode: "CUSTOM",
        itineraryTourcode: "CUSTOM",  // ✅ यह भी add करो
        pricing: {},
        offers: {},
        bookingAmount: {},
        highlightPrice: {},
        festivalOffer: { name: "", value: 0 },
        priceType: "Whole Group/Family",
        vehicle: [],
        hotels: {},
        hotelSelectionDays: {},
        stayOnlyDays: {},
        isBlank: true
    };


    const [blankItinerary, setBlankItinerary] = useState(BLANK_ITINERARY);


    useEffect(() => {
        if (categories.length > 0) {
            const pricingObj = {};

            categories.forEach(cat => {
                pricingObj[cat.name] = 0;
            });

            setBlankItinerary(prev => ({
                ...prev,
                packagePricing: pricingObj
            }));
        }
    }, [categories]);

    useEffect(() => {
        // Only run in edit mode when booking data is loaded
        if (!isEditMode || !bookingInclusions) return;

        // Get all optional inclusion titles from the current booking
        const bookingOptionalTitles = bookingInclusions
            .filter(inc => SPECIAL_INCLUSION_TITLES.some(special =>
                inc.title.toLowerCase().includes(special.toLowerCase())
            ))
            .map(inc => inc.title);

        // Auto-select matching optional inclusions
        if (bookingOptionalTitles.length > 0) {
            setSelectedSpecialInclusions(bookingOptionalTitles);
            console.log("✅ Auto-selected optional inclusions:", bookingOptionalTitles);
        }
    }, [isEditMode, bookingInclusions]);

    // Initialize local booking states from global after fetch (only in create mode)
    useEffect(() => {
        // In edit mode, data is already loaded from database
        if (isEditMode) return;

        if (inclusions.length > 0 && exclusions.length > 0) {
            // Filter out special inclusions from auto-adding
            const filteredInclusions = inclusions.filter(
                inc => !SPECIAL_INCLUSION_TITLES.some(special =>
                    inc.title.toLowerCase().includes(special.toLowerCase())
                )
            );
            setBookingInclusions(filteredInclusions);
            setBookingExclusions(exclusions);
        }
    }, [inclusions, exclusions, isEditMode]);

    // Add selected special inclusions to booking inclusions (only in create mode)
    useEffect(() => {
        // Skip in edit mode - data is already loaded from database
        if (isEditMode) return;

        if (inclusions.length > 0) {
            // Get base inclusions (non-special ones)
            const baseInclusions = inclusions.filter(
                inc => !SPECIAL_INCLUSION_TITLES.some(special =>
                    inc.title.toLowerCase().includes(special.toLowerCase())
                )
            );

            // Get selected special inclusions
            const specialIncs = inclusions.filter(
                inc => selectedSpecialInclusions.includes(inc.title)
            );

            // Combine them
            setBookingInclusions([...baseInclusions, ...specialIncs]);
        }
    }, [selectedSpecialInclusions, inclusions, isEditMode]);

    useEffect(() => {
        if (themes.length > 0 && !selectedTheme) {
            setSelectedTheme(themes[0]);
            handleThemeChange(themes[0]);
        }
    }, [themes]);

    useEffect(() => {
        fetchItineraries()
        fetchHotels()
        fetchCategories()
        fetchLocations()
        fetchVehicles();
    }, [])

    useEffect(() => {
        // Skip if in edit mode - contact already loaded from database
        if (isEditMode) return;

        if (structure?.contacts?.length > 0 && user) {
            // If admin, select first contact
            if (user.role === "admin") {
                setSelectedContact(structure.contacts[0]);
                return;
            }

            // For non-admin users, find and auto-select matching contact
            const userName = user.name?.toLowerCase() || "";
            const userEmail = user.email?.toLowerCase() || "";

            const matchingContact = structure.contacts.find((contact) => {
                const contactName = contact.name?.toLowerCase() || "";
                const contactEmails = contact.emails?.map(e => e.toLowerCase()) || [];

                return contactName.includes(userName) ||
                    userName.includes(contactName) ||
                    contactEmails.some(email => email.includes(userEmail)) ||
                    contactEmails.some(email => userEmail.includes(email));
            });

            // Auto-select matching contact, or first contact if no match
            setSelectedContact(matchingContact || structure.contacts[0]);
        }
    }, [structure, user, isEditMode]);

    const handleContactChange = (contact) => {
        setSelectedContact(contact);
    };

    // Fetch vehicles
    const fetchVehicles = async () => {
        try {
            const res = await axios.get("https://apitour.rajasthantouring.in/api/vehicles");
            setVehicles(res.data);
        } catch (err) {
            console.error("Error fetching vehicles:", err);
        }
    };



    // Add this upload function near the top of your component
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post("https://apitour.rajasthantouring.in/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.url; // Assume backend returns { url: '...' }
        } catch (err) {
            console.error('Upload failed:', err);
            throw err;
        }
    };

    const handleImageUpload = async (index, files, isInclusions = true) => {
        const targetArray = isInclusions ? 'editableInclusions' : 'editableExclusions';
        const currentState = isInclusions ? [...editableInclusions] : [...editableExclusions];

        try {
            const urls = await Promise.all(
                Array.from(files).map(file => uploadImage(file))
            );

            currentState[index].images = [...(currentState[index].images || []), ...urls];
            if (isInclusions) {
                setEditableInclusions(currentState);
            } else {
                setEditableExclusions(currentState);
            }
        } catch (err) {
            setError('Failed to upload images.');
        }
    };

    const removeImage = (index, imageUrl, isInclusions = true) => {
        const targetArray = isInclusions ? 'editableInclusions' : 'editableExclusions';
        const currentState = isInclusions ? [...editableInclusions] : [...editableExclusions];

        currentState[index].images = currentState[index].images.filter(img => img !== imageUrl);
        if (isInclusions) {
            setEditableInclusions(currentState);
        } else {
            setEditableExclusions(currentState);
        }
    };


    const handleSaveInclusions = async () => {
        if (editableInclusions.length === 0 || editableInclusions.every(item => !item.title.trim())) {
            setError("At least one inclusion is required with a title.");
            return;
        }
        setIsSubmitting(true);
        try {
            // NEW: Only update local booking state
            const filtered = editableInclusions.filter(item => item.title.trim());
            setBookingInclusions(filtered);  // Local update
            setEditableInclusions(filtered.map(item => ({ ...item })));

            setEditingInclusions(false);
            setSuccess("Inclusions updated for this booking!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to update inclusions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to handle save exclusions (updates global document)
    const handleSaveExclusions = async () => {
        if (editableExclusions.length === 0 || editableExclusions.every(item => !item.title.trim())) {
            setError("At least one exclusion is required with a title.");
            return;
        }
        setIsSubmitting(true);
        try {
            // NEW: Only update local booking state
            const filtered = editableExclusions.filter(item => item.title.trim());
            setBookingExclusions(filtered);  // Local update
            setEditableExclusions(filtered.map(item => ({ ...item })));

            setEditingExclusions(false);
            setSuccess("Exclusions updated for this booking!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to update exclusions.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Booking_${bookingId}`,
    });


    const formatDuration = (input) => {
        if (!input) return "";

        const clean = input.trim().replace(/\s/g, '').toLowerCase();
        const match = clean.match(/^(\d+)n?$/);

        if (match) {
            const digits = match[1];
            const nights = parseInt(digits, 10);

            // Format nights with leading zero
            const paddedNights = nights < 10 ? `0${nights}` : `${nights}`;

            // Calculate days (nights + 1)
            const days = nights + 1;
            const paddedDays = days < 10 ? `0${days}` : `${days}`;

            return `${paddedNights} Nights / ${paddedDays} Days`;
        }

        return input;
    };

    // Main duration change handler
    const handleDurationChange = (e) => {
        const input = e.target.value;
        const prevValue = itineraryData.duration || "";

        // ✅ Allow deletion/backspace
        if (input.length < prevValue.length) {
            setItineraryData({ ...itineraryData, duration: input });
            // 🔥 selectedItinerary को भी update करो
            setSelectedItinerary(prev => prev ? { ...prev, duration: input } : null);
            return;
        }

        // ✅ Check if user just typed 'n' or 'N'
        const lastChar = input[input.length - 1];
        if (lastChar === 'n' || lastChar === 'N') {
            const formatted = formatDuration(input);
            setItineraryData({ ...itineraryData, duration: formatted });
            // 🔥 selectedItinerary को भी update करो
            setSelectedItinerary(prev => prev ? { ...prev, duration: formatted } : null);

            // Move cursor to end
            setTimeout(() => {
                e.target.setSelectionRange(formatted.length, formatted.length);
            }, 0);
            return;
        }

        // ✅ While typing numbers, show only digits
        const clean = input.trim().replace(/\s/g, '').toLowerCase();
        const match = clean.match(/^(\d+)/);

        if (match) {
            const digitsOnly = match[1];
            setItineraryData({ ...itineraryData, duration: digitsOnly });
            // 🔥 selectedItinerary को भी update करो
            setSelectedItinerary(prev => prev ? { ...prev, duration: digitsOnly } : null);
            return;
        }

        // ✅ Any other input
        setItineraryData(prev => ({
            ...prev,
            duration: input
        }));
        // 🔥 selectedItinerary को भी update करो
        setSelectedItinerary(prev =>
            prev ? { ...prev, duration: input } : null
        );
    };
    console.log(selectedItinerary, "selectedItineraryselectedItinerary");


    // Updated: Initialize pricing etc. for selected categories with auto-fill from itinerary; auto-fill highlightPrice based on pricing/offers/festival; clears non-selected on toggle
    // FIXED: Ensure auto-fill happens reliably by adding selectedItinerary check and initializing bookingAmount as 20% of pricing
    // EDIT MODE FIX: Don't reset data if in edit mode
    const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
    useEffect(() => {
        // Skip auto-fill in edit mode to preserve existing data
        if (isEditMode) return;

        // जब selectedCategories change हो तो pricing को update करो
        if (selectedCategories.length > 0 && categories.length > 0 && selectedItinerary) {
            const initialPricing = {};
            const initialOffers = {};
            const initialBookingAmount = {};
            const initialHighlightPrice = {};

            // केवल selectedCategories के लिए data initialize करो
            selectedCategories.forEach(category => {
                const autoPrice = selectedItinerary.packagePricing?.[category] || 0;
                initialPricing[category] = autoPrice;
                initialOffers[category] = 0;
                initialHighlightPrice[category] = autoPrice;
            });

            setItineraryData((prev) => ({
                ...prev,
                pricing: initialPricing,
                offers: initialOffers,
                highlightPrice: initialHighlightPrice,
                // ❌ केवल selectedCategories के लिए hotels रखो
                hotels: Object.keys(prev.hotels || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = prev.hotels[cat];
                    }
                    return acc;
                }, {})
            }));
        } else if (!isEditMode) {
            // Clear all if no categories selected
            setItineraryData((prev) => ({
                ...prev,
                pricing: {},
                offers: {},
                highlightPrice: {},
                hotels: {}
            }));
        }
    }, [selectedItinerary?._id, selectedCategories.length]);

    // Effect 2: Run when categories are selected
    useEffect(() => {
        if (isEditMode || selectedCategories.length === 0 || !selectedItinerary) return;

        setItineraryData((prev) => {
            const needsUpdate = selectedCategories.some(cat => !prev.pricing?.[cat]);

            if (!needsUpdate) return prev;

            const newPricing = { ...prev.pricing };

            selectedCategories.forEach(category => {
                if (!newPricing[category]) {
                    newPricing[category] = selectedItinerary.packagePricing?.[category] || 0;
                }
            });

            return {
                ...prev,
                pricing: newPricing
            };
        });
    }, [selectedCategories.length]); // ✅ Use length instead

    // Auto-update highlightPrice when pricing, offers, or festivalOffer changes
    // Auto-update highlightPrice when pricing, offers, or festivalOffer changes
    useEffect(() => {
        if (selectedCategories.length > 0) {
            setItineraryData((prev) => {
                const updatedHighlightPrice = {};
                const initialBookingAmount = {};
                const festivalValue = prev.festivalOffer?.value || 0;

                selectedCategories.forEach(category => {
                    if (!category) return;

                    // 🔥 REAL KEY match karo (case-insensitive)
                    const actualKey = Object.keys(prev.pricing).find(
                        key => key.trim().toLowerCase() === category.trim().toLowerCase()
                    ) || category;

                    const basePrice = prev.pricing[actualKey] || 0;
                    const offerDiscount = Number(prev.offers?.[actualKey]) || 0;

                    const festivalDiscount = ((basePrice - offerDiscount) * festivalValue) / 100;

                    updatedHighlightPrice[actualKey] = Math.round(basePrice - offerDiscount - festivalDiscount);

                    const highlight = Math.round(basePrice - offerDiscount - festivalDiscount);

                    initialBookingAmount[actualKey] = Math.round(highlight * 0.2);
                });

                return {
                    ...prev,
                    highlightPrice: updatedHighlightPrice,
                    bookingAmount: initialBookingAmount,
                };
            });
        }
    }, [itineraryData.pricing, itineraryData.offers, itineraryData.festivalOffer?.value, selectedCategories]);

    const fetchItineraries = async () => {
        setLoading(true)
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/itineraries")
            const data = await response.json()
            setItineraries(data)
        } catch (err) {
            console.log("API failed, using static data")
            const mockItineraries = [
                {
                    _id: "68aa730f00ad3fbcf3a3c7b1",
                    titles: ["2 day itinerary data"],
                    descriptions: ["kk  k k kjkf askjfklas k fa klfjaklsf"],
                    date: "2025-08-24T00:00:00.000Z",
                    duration: "1 nights 2 day",
                    images: ["/uploads/itineraries/itinerary-1756001039511-171886643.png"],
                    packagePricing: {
                        luxury: 15000,
                        deluxe: 12000,
                    },
                    days: [
                        {
                            id: 1,
                            title: "Day 1 Activity",
                            description: "Explore the local attractions.",
                            location: "Unknown",
                            images: ["/day1-image.png"],
                        },
                    ],
                    createdAt: "2025-08-24T02:03:59.537Z",
                    updatedAt: "2025-08-24T02:03:59.537Z",
                    __v: 0,
                },
            ]
            setItineraries(mockItineraries)
            setError("Using offline data - API unavailable")
        } finally {
            setLoading(false)
        }
    }

    const fetchHotels = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/hotels")
            const data = await response.json()
            setHotels(data)
        } catch (err) {
            console.log("Hotels API failed, using static data")
            const mockHotels = [
                {
                    _id: "1",
                    name: "HOTEL TO BE BOOKED BY GUEST ON OWN",
                    image: "/luxury-hotel-room.png",
                    categoryId: { name: "3 Star Property" },
                    rating: 3.0,
                    reviews: 24676,
                },
                {
                    _id: "2",
                    name: "LE COXY RESORT (SUPER DELUXE ROOM)",
                    image: "/mountain-resort-exterior.png",
                    categoryId: { name: "3 Star Property" },
                    rating: 3.5,
                    reviews: 234,
                },
            ]
            setHotels(mockHotels)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/categories")
            const data = await response.json()
            setCategories(data)
        } catch (err) {
            console.log("Categories API failed, using static data")
            const mockCategories = [
                { _id: "1", name: "Standard" },
                { _id: "2", name: "Deluxe" },
                { _id: "3", name: "Super Deluxe" },
                { _id: "4", name: "Luxury" },
            ]
            setCategories(mockCategories)
        }
    }

    const fetchLocations = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/locations")
            const data = await response.json()
            setLocations(data)
        } catch (err) {
            console.log("Locations API failed, using static data")
            const mockLocations = [
                { _id: "1", name: "Gangtok" },
                { _id: "2", name: "Lachung" },
                { _id: "3", name: "Darjeeling" },
            ]
            setLocations(mockLocations)
        }
    }

    const calculateDuration = (itinerary) => {
        if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
            return "0 Days 0 Nights"
        }

        const totalDays = itinerary.days.length
        const nights = Math.max(0, totalDays - 1)

        if (itinerary.duration && itinerary.duration.trim()) {
            return itinerary.duration
        }

        return `${totalDays} Days ${nights} Nights`
    }

    const handleClientDetailsSubmit = (e) => {
        e.preventDefault()
        setError(null)
        setStep("itinerary-selection")
    }

    // FIXED: Ensure selectedCategories is set before initializing data
    const initializeCategoryData = (itinerary) => {
        if (categories.length === 0) return; // Wait for categories to load
        if (selectedCategories.length === 0) {
            const firstCategory = categories[0]?.name.toLowerCase() || 'deluxe'
            setSelectedCategories([firstCategory])
        }
    }



    useEffect(() => {
        // Reset AI suggestion state when leaving itinerary-builder step
        if (step !== "itinerary-builder") {
            setTypedTitle({}); // ✅ Clear all typed titles when navigating away
            setIsAISuggestionApplying(false);
        }
    }, [step]);

    const generateFullPackagePricing = (itinerary, categories) => {
        const finalPricing = {};

        categories.forEach(cat => {
            // "cat.name" usually Title Case hota hai (e.g., "Budget", "Deluxe")
            const catName = cat.name;
            const lower = catName.toLowerCase(); // e.g., "budget"

            // Backend se value uthao chahe wo Capital me ho ya Small me
            finalPricing[catName] =
                itinerary.packagePricing?.[catName] ??
                itinerary.packagePricing?.[lower] ??
                0;
        });

        return finalPricing;
    };
    const toLowerCaseKeys = (obj = {}) => {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key.toLowerCase()] = obj[key];
            return acc;
        }, {});
    };


    const handleItinerarySelect = (itinerary) => {

        console.log(itinerary, "diuihstat");

        const isSameItinerary = selectedItinerary?._id === itinerary._id;
        const rawPackagePricing = generateFullPackagePricing(itinerary, categories);
        const fixedPackagePricing = toLowerCaseKeys(rawPackagePricing);

        console.log(fixedPackagePricing, "fixedPackagePricing");

        const departureLocation = locations.find(
            (loc) => loc.name.toLowerCase() === "departure"
        );
        setSelectedItinerary({
            ...itinerary,
            packagePricing: fixedPackagePricing,
            duration: itinerary.duration || itineraryData.duration || ""   // ⭐ FIXED
        });;

        initializeCategoryData(itinerary);

        // Only reset data if selecting a different itinerary
        if (!isSameItinerary) {

            if (String(itinerary.isBlank) === "true") {
                console.log("Blank itinerary detected!");

                // For blank itinerary, start with empty template
                setItineraryData({
                    titles: [""],
                    descriptions: [""],
                    date: clientDetails.travelDate || "",
                    images: [],
                    duration: "",
                    days: [
                        {
                            id: 1,
                            titles: [""],
                            descriptions: [""],
                            locations: [""],
                            images: [],
                        },
                        {
                            id: 2,
                            titles: [""],  // ✅ यह plural होना चाहिए
                            descriptions: [""],
                            locations: ["Departure"],
                            images: departureLocation?.images || [],
                        },
                    ],
                    tourcode: '',
                    itineraryTourcode: '',
                    pricing: {},
                    offers: {},
                    bookingAmount: {},
                    vehicle: [],
                    hotels: {},
                    highlightPrice: {},
                    festivalOffer: { name: "", value: 0 },
                    priceType: "Whole Group/Family",
                    createby: null,
                    hotelSelectionDays: {},
                    stayOnlyDays: {},  // ✅ यह add करो
                });
            } else {

                console.log("not blaht a ");

                // For existing itinerary, populate as before
                const normalizedDays = itinerary.days.map((day, index) => ({
                    id: index + 1,
                    titles: day.titles || [day.title || ""],
                    descriptions: Array.isArray(day.descriptions) ? day.descriptions : [day.description || ""],
                    locations: day.locations || [day.location || ""],
                    images: day.images || [],
                }));


                setItineraryData({
                    titles: itinerary.titles || [""],
                    descriptions: Array.isArray(itinerary.descriptions) ? itinerary.descriptions : [itinerary.descriptions || ""],
                    date: clientDetails.travelDate || "",
                    images: itinerary.images || [],
                    duration: itinerary?.duration || "",
                    days: normalizedDays,
                    tourcode: itinerary.tourcode || '',
                    itineraryTourcode: itinerary.tourcode || '',
                    duration: itinerary.duration || '',
                   pricing: fixedPackagePricing || {}, // ✅ Yeh fixed lowercase/normalized data use karega
                    offers: {},
                    bookingAmount: {},
                    vehicle: [],
                    hotels: {},
                    highlightPrice: {},
                    festivalOffer: { name: "", value: 0 },
                    priceType: "Whole Group/Family",
                });
            }
            setHotelSelections({});
        }
        setStep("itinerary-builder");
    };

    const extractNights = (duration = "") => {
        // Matches: "01 Nights / 02 Days", "1 nights 2 day", "5 nights 6 day", etc.
        const match = duration.match(/(\d+)\s*night/i);
        if (match) return parseInt(match[1]);

        // fallback: extract first number
        const fallback = duration.match(/\d+/);
        return fallback ? parseInt(fallback[0]) : 0;
    };

    const filteredItineraries = [
        blankItinerary,
        ...itineraries
            .filter(
                (itinerary) =>
                    itinerary.titles.some((title) =>
                        title.toLowerCase().includes(searchTerm.toLowerCase()),
                    ) ||
                    itinerary.days.some((day) =>
                        Array.isArray(day.location)
                            ? day.location.some((loc) =>
                                loc.toLowerCase().includes(searchTerm.toLowerCase()),
                            )
                            : typeof day.location === "string"
                                ? day.location.toLowerCase().includes(searchTerm.toLowerCase())
                                : false,
                    ),
            )
            .filter((itinerary) => {
                if (!durationFilter) return true;

                const filter = durationFilter.trim().toLowerCase();

                const durationNumber = extractNights(itinerary.duration);
                const filterNumber = parseInt(filter);

                if (!isNaN(filterNumber)) return durationNumber === filterNumber;

                return itinerary.duration?.toLowerCase().includes(filter);
            })
            .filter((itinerary) =>
                tourCodeFilter
                    ? (itinerary.tourcode || "")
                        .toLowerCase()
                        .includes(tourCodeFilter.toLowerCase())
                    : true,
            )
            .sort((a, b) => extractNights(a.duration) - extractNights(b.duration)),
    ];

    const deleteDay = (dayIdToDelete) => {
        console.log("🗑️ Deleting Day:", dayIdToDelete);

        // पहले mapping बनाओ
        let dayIdMapping = {};
        let newIndex = 1;

        itineraryData.days.forEach((oldDay) => {
            if (oldDay.id !== dayIdToDelete) {
                dayIdMapping[oldDay.id] = newIndex;
                newIndex++;
            }
        });

        console.log("🔄 Day ID Mapping:", dayIdMapping);

        // फिर itineraryData update करो
        setItineraryData((prevData) => {
            const remainingDays = prevData.days.filter((day) => day.id !== dayIdToDelete);

            if (remainingDays.length === 0) {
                remainingDays.push({
                    id: 1,
                    titles: [""],
                    descriptions: [""],
                    locations: [""],
                    images: [],
                });
            }

            // Re-index days
            const reIndexedDays = remainingDays.map((day, index) => ({
                ...day,
                id: index + 1,
            }));

            // Hotels को re-map करो
            const cleanedHotels = {};
            Object.keys(prevData.hotels || {}).forEach((category) => {
                cleanedHotels[category] = {};

                Object.keys(prevData.hotels[category]).forEach((oldDayIdStr) => {
                    const oldDayId = parseInt(oldDayIdStr);

                    if (oldDayId === dayIdToDelete) return;

                    const newDayId = dayIdMapping[oldDayId];
                    if (newDayId !== undefined) {
                        cleanedHotels[category][newDayId] = prevData.hotels[category][oldDayIdStr];
                        console.log(`✅ Mapped hotels - Old Day ${oldDayId} → New Day ${newDayId}`);
                    }
                });
            });

            // hotelSelectionDays को re-map करो
            const cleanedHotelSelectionDays = {};
            Object.keys(prevData.hotelSelectionDays || {}).forEach((category) => {
                cleanedHotelSelectionDays[category] = {};

                Object.keys(prevData.hotelSelectionDays[category]).forEach((oldDayIdStr) => {
                    const oldDayId = parseInt(oldDayIdStr);

                    if (oldDayId === dayIdToDelete) return;

                    const newDayId = dayIdMapping[oldDayId];
                    if (newDayId !== undefined) {
                        cleanedHotelSelectionDays[category][newDayId] =
                            prevData.hotelSelectionDays[category][oldDayIdStr];
                    }
                });
            });

            // stayOnlyDays को re-map करो
            const cleanedStayOnlyDays = {};
            Object.keys(prevData.stayOnlyDays || {}).forEach((category) => {
                cleanedStayOnlyDays[category] = {};

                Object.keys(prevData.stayOnlyDays[category]).forEach((oldDayIdStr) => {
                    const oldDayId = parseInt(oldDayIdStr);

                    if (oldDayId === dayIdToDelete) return;

                    const newDayId = dayIdMapping[oldDayId];
                    if (newDayId !== undefined) {
                        cleanedStayOnlyDays[category][newDayId] =
                            prevData.stayOnlyDays[category][oldDayIdStr];
                    }
                });
            });

            console.log("✅ Final Cleaned Hotels:", cleanedHotels);
            console.log("✅ Final Cleaned HotelSelectionDays:", cleanedHotelSelectionDays);

            return {
                ...prevData,
                days: reIndexedDays,
                hotels: cleanedHotels,
                hotelSelectionDays: cleanedHotelSelectionDays,
                stayOnlyDays: cleanedStayOnlyDays,
            };
        });

        // hotelSelections को update करो
        setHotelSelections((prevSelections) => {
            if (!prevSelections || Object.keys(prevSelections).length === 0) return prevSelections;

            const cleanedSelections = {};

            Object.keys(prevSelections).forEach((category) => {
                cleanedSelections[category] = {};

                Object.keys(prevSelections[category]).forEach((oldDayIdStr) => {
                    const oldDayId = parseInt(oldDayIdStr);

                    if (oldDayId === dayIdToDelete) return;

                    const newDayId = dayIdMapping[oldDayId];
                    if (newDayId !== undefined) {
                        cleanedSelections[category][newDayId] = prevSelections[category][oldDayIdStr];
                        console.log(`✅ Mapped hotelSelections - Old Day ${oldDayId} → New Day ${newDayId}`);
                    }
                });
            });

            console.log("✅ Final Cleaned HotelSelections:", cleanedSelections);
            return cleanedSelections;
        });

        toast.success(`Day ${dayIdToDelete} deleted successfully`);
    };



    const addDay = () => {
        const newDay = {
            id: itineraryData.days.length + 1,
            titles: [""],
            descriptions: [""],
            locations: [""],
            images: [],
        }
        setItineraryData({
            ...itineraryData,
            days: [...itineraryData.days, newDay],
        })
    }

    const saveNewItinerary = async () => {
        try {
            setLoadings(true);
            setError(null);

            console.log("%c================ SAVE ITINERARY START ================", "color: white; background: #444; padding: 5px;");

            // Validation
            if (!itineraryData.titles[0]?.trim()) {
                setError("Title is required");
                console.error("❌ Missing Main Title");
                return;
            }

            if (!itineraryData.duration?.trim()) {
                setError("Duration is required");
                console.error("❌ Missing Duration");
                return;
            }

            console.log("%c✔ Validation Passed", "color: green");

            // FormData banao
            const formData = new FormData();

            // BASIC FIELDS
            console.log("%c📌 BASIC FIELDS:", "color: blue");
            console.log("titles:", itineraryData.titles);
            console.log("descriptions:", itineraryData.descriptions);
            console.log("date:", itineraryData.date);
            console.log("duration:", itineraryData.duration);
            console.log("tourcode:", itineraryData.tourcode);

            formData.append("titles", JSON.stringify(itineraryData.titles.filter(t => t.trim())));
            formData.append("descriptions", JSON.stringify(itineraryData.descriptions.filter(d => d.trim())));
            formData.append("date", itineraryData.date);
            formData.append("duration", itineraryData.duration);
            formData.append("tourcode", itineraryData.tourcode || '');

            // PACKAGE PRICING
            console.log("%c📌 PACKAGE PRICING:", "color: purple");
            console.log(itineraryData.pricing);
            formData.append("packagePricing", JSON.stringify(itineraryData.pricing));

            // DAYS PREPARE
            console.log("%c📌 DAYS DATA:", "color: orange");
            const daysData = itineraryData.days.map((day) => {
                console.log(`➡ Day ${day.id} Data:`, day);
                return {
                    dayNumber: day.id,
                    titles: day.titles.filter(t => t.trim()),
                    descriptions: day.descriptions.filter(d => d.trim()),
                    locations: day.locations.filter(l => l.trim()),
                    images: day.images.filter(img => typeof img === "string"), // Keep only existing URLs
                };
            });

            console.log("%c📎 Final Days JSON to upload:", "color: orange; font-weight: bold;");
            console.log(JSON.stringify(daysData, null, 2));

            formData.append("days", JSON.stringify(daysData));

            // IMAGES UPLOAD LOGS
            console.log("%c📸 IMAGES UPLOAD (files only):", "color: teal");

            itineraryData.days.forEach((day, dayIndex) => {
                day.images?.filter((img) => img instanceof File).forEach((file) => {
                    console.log(`Uploading → Day ${dayIndex + 1} Image:`, file.name);
                    formData.append(`dayImages_${dayIndex}`, file);
                });
            });

            // FORM DATA PREVIEW (DEBUG)
            console.log("%c📦 FINAL FORMDATA CONTENT:", "color: #007bff; font-weight: bold;");
            for (let pair of formData.entries()) {
                console.log(pair[0], "→", pair[1]);
            }

            console.log("%c🚀 Sending API Request...", "color: green; font-weight: bold;");

            // API call
            const response = await fetch("https://apitour.rajasthantouring.in/api/itineraries", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                console.error("❌ Backend Error:", response.status, response.statusText);
                throw new Error("Failed to save itinerary");
            }

            const result = await response.json();

            console.log("%c🎉 SERVER RESPONSE:", "color: green; font-weight: bold;");
            console.log(result);

            alert("✅ Itinerary saved successfully!");

            // fetchItineraries();

        } catch (err) {
            console.error("%c❌ ERROR while saving itinerary:", "color: red; font-weight: bold;");
            console.error(err);

            setError(err.message || "Failed to save itinerary");
            alert("❌ Failed to save itinerary: " + err.message);
        } finally {
            console.log("%c================ SAVE ITINERARY END ================", "color: white; background: #444; padding: 5px;");
            setLoadings(false);
        }
    };


    const updateDay = useCallback((dayId, field, value, index = null) => {
        setItineraryData((prevData) => {
            const updatedDays = prevData.days.map((day) => {
                if (day.id !== dayId) return day;

                // Handle field update
                if (field === "titles" || field === "locations" || field === "descriptions") {
                    if (index === null) {
                        return { ...day, [field]: value };
                    }

                    // Array update
                    const newArray = [...day[field]];
                    const oldValue = newArray[index];
                    newArray[index] = value;

                    // 🔥 SPECIAL HANDLING: Location change होने पर hotels remove करो
                    if (field === "locations" && oldValue !== value) {
                        const oldLocation = locations.find(loc => loc.name === oldValue);
                        const oldImages = oldLocation?.images || [];

                        const newLocation = locations.find(loc => loc.name === value);
                        const newImages = newLocation?.images || [];

                        // Filter out old images
                        const filteredImages = (day.images || []).filter(img => {
                            if (typeof img === 'string') {
                                return !oldImages.includes(img);
                            }
                            return true;
                        });

                        // Add new images
                        const updatedImages = [...filteredImages, ...newImages];

                        // 🔥 FIX: Location change होने पर उस location के सभी hotels remove करो
                        setItineraryData(prev => {
                            const cleanedHotels = { ...prev.hotels };
                            const cleanedSelections = { ...hotelSelections };

                            // सभी categories के लिए check करो
                            Object.keys(cleanedHotels).forEach(category => {
                                if (cleanedHotels[category]?.[dayId]?.[oldValue]) {
                                    // पुराने location के hotels delete करो
                                    delete cleanedHotels[category][dayId][oldValue];

                                    // अगर इस day में कोई और location नहीं बचा, तो day को भी delete करो
                                    if (Object.keys(cleanedHotels[category][dayId]).length === 0) {
                                        delete cleanedHotels[category][dayId];
                                    }
                                }
                            });

                            // hotelSelections से भी remove करो
                            Object.keys(cleanedSelections).forEach(category => {
                                if (cleanedSelections[category]?.[dayId]?.[oldValue]) {
                                    delete cleanedSelections[category][dayId][oldValue];

                                    if (Object.keys(cleanedSelections[category][dayId]).length === 0) {
                                        delete cleanedSelections[category][dayId];
                                    }
                                }
                            });

                            // States update करो
                            setHotelSelections(cleanedSelections);

                            return {
                                ...prev,
                                hotels: cleanedHotels
                            };
                        });

                        return { ...day, [field]: newArray, images: updatedImages };
                    }

                    return { ...day, [field]: newArray };
                }

                // Other field updates
                return { ...day, [field]: value };
            });

            // ✅ Check if anything actually changed
            const hasChanges = JSON.stringify(prevData.days) !== JSON.stringify(updatedDays);
            if (!hasChanges) return prevData;

            return { ...prevData, days: updatedDays };
        });
    }, [locations, hotelSelections]); // ✅ hotelSelections dependency add karo



    const handleDescriptionChange = useCallback((dayId, descIndex, value) => {
        if (isAISuggestionApplying) {
            return;
        }

        updateDay(dayId, "descriptions", value, descIndex);
    }, [updateDay, isAISuggestionApplying]);


    const addDayField = (dayId, field) => {
        const updatedDays = itineraryData.days.map((day) => {
            if (day.id === dayId) {
                if (field === "titles" || field === "locations" || field === "descriptions") {
                    return { ...day, [field]: [...day[field], ""] }
                }
            }
            return day
        })
        setItineraryData({ ...itineraryData, days: updatedDays })
    }

    const removeDayField = (dayId, field, index) => {
        const updatedDays = itineraryData.days.map((day) => {
            if (day.id === dayId) {
                if (field === "titles" || field === "locations" || field === "descriptions") {
                    const newArray = day[field].filter((_, i) => i !== index)
                    return { ...day, [field]: newArray.length > 0 ? newArray : [""] }
                }
            }
            return day
        })
        setItineraryData({ ...itineraryData, days: updatedDays })
    }

    // Upload helper
    const uploadFileAndGetPath = async (file) => {
        if (!file) return null;
        try {
            const formData = new FormData();
            formData.append("screenshot", file);

            const res = await axios.post("https://apitour.rajasthantouring.in/api/bookings/upload-screenshot", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const url = res.data?.screenshotUrl;
            if (!url) return null;
            try {
                const parsed = new URL(url);
                return parsed.pathname;
            } catch (e) {
                return url;
            }
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    }

    const handleUploadItineraryImage = async (file, index = null) => {
        if (!file) return;
        const path = await uploadFileAndGetPath(file);
        if (!path) return;
        if (index === null) {
            setItineraryData((prev) => ({ ...prev, images: [...(prev.images || []), path] }));
        } else {
            setItineraryData((prev) => ({
                ...prev,
                images: prev.images.map((im, i) => (i === index ? path : im)),
            }));
        }
    }

    const handleUploadDayImage = async (file, dayId, index = null) => {
        if (!file) return;
        const path = await uploadFileAndGetPath(file);
        if (!path) return;
        const updatedDays = itineraryData.days.map((d) => {
            if (d.id === dayId) {
                const imgs = d.images || [];
                if (index === null) return { ...d, images: [...imgs, path] };
                return { ...d, images: imgs.map((im, i) => (i === index ? path : im)) };
            }
            return d;
        });
        setItineraryData({ ...itineraryData, days: updatedDays });
    }

    // Multi-category functions - FIXED: Clear data for unselected categories in toggle
    const toggleCategory = (category) => {
        setSelectedCategories(prev => {
            let newCats;

            if (prev.includes(category)) {
                // ❌ Category को UNSELECT कर रहे हैं
                newCats = prev.filter(c => c !== category);

                // 🔴 STEP 1: itineraryData से unselected category को पूरी तरह remove करो
                setItineraryData(prevData => {
                    const newData = { ...prevData };

                    // Hotels को clean करो
                    if (newData.hotels?.[category]) {
                        const newHotels = { ...newData.hotels };
                        delete newHotels[category];
                        newData.hotels = newHotels;
                    }

                    // Pricing को clean करो
                    if (newData.pricing?.[category]) {
                        const newPricing = { ...newData.pricing };
                        delete newPricing[category];
                        newData.pricing = newPricing;
                    }

                    // Offers को clean करो
                    if (newData.offers?.[category]) {
                        const newOffers = { ...newData.offers };
                        delete newOffers[category];
                        newData.offers = newOffers;
                    }

                    // Booking Amount को clean करो
                    if (newData.bookingAmount?.[category]) {
                        const newBookingAmount = { ...newData.bookingAmount };
                        delete newBookingAmount[category];
                        newData.bookingAmount = newBookingAmount;
                    }

                    // Highlight Price को clean करो
                    if (newData.highlightPrice?.[category]) {
                        const newHighlightPrice = { ...newData.highlightPrice };
                        delete newHighlightPrice[category];
                        newData.highlightPrice = newHighlightPrice;
                    }

                    console.log("✅ Cleaned category:", category);
                    console.log("📊 Remaining hotels:", newData.hotels);

                    return newData;
                });

                // 🔴 STEP 2: hotelSelections से भी remove करो
                setHotelSelections(prev => {
                    if (prev?.[category]) {
                        const newSelections = { ...prev };
                        delete newSelections[category];
                        console.log("✅ Cleaned hotelSelections for:", category);
                        return newSelections;
                    }
                    return prev;
                });

                return newCats.length >= 1 ? newCats : prev;
            } else if (prev.length < 2) {
                // ✅ Category को SELECT कर रहे हैं
                newCats = [...prev, category];

                // Auto-fill pricing होगा useEffect में
                return newCats;
            }

            return prev;
        })
    }

    const updatePricing = (category, value) => {
        const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
        setItineraryData(prev => {
            const newPricing = { ...prev.pricing };
            newPricing[category] = numValue;
            return {
                ...prev,
                pricing: newPricing
            };
        });
    };

    const updateOffer = (category, value) => {
        // ✅ If value is empty string, set to 0
        const numValue = value === "" ? 0 : Number.parseFloat(value) || 0;

        setItineraryData(prev => ({
            ...prev,
            offers: { ...prev.offers, [category]: numValue }
        }))
    }
    const updateBookingAmount = (category, value) => {
        const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
        setItineraryData(prev => ({
            ...prev,
            bookingAmount: { ...prev.bookingAmount, [category]: numValue }
        }))
    }

    const updateHighlightPrice = (category, value) => {
        // FIXED: Real-time update, handle empty
        const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
        setItineraryData(prev => ({
            ...prev,
            highlightPrice: { ...prev.highlightPrice, [category]: numValue }
        }))
    }


    const updatePriceType = (value) => {
        setItineraryData({
            ...itineraryData,
            priceType: value,
        })
    }

    // Updated: Add hotel to meal (array support, max 2 for options)
    const addHotelToMeal = (category, dayId, location, meal, hotelId) => {
        setHotelSelections((prev) => {
            const currentHotels = prev[category]?.[dayId]?.[location]?.[meal] || [];

            // 🛑 Stop if already added or reached max
            if (currentHotels?.includes(hotelId) || currentHotels.length >= 2) return prev;

            const newArray = [...currentHotels, hotelId];
            return {
                ...prev,
                [category]: {
                    ...prev[category],
                    [dayId]: {
                        ...prev[category]?.[dayId],
                        [location]: {
                            ...prev[category]?.[dayId]?.[location],
                            [meal]: newArray,
                        },
                    },
                },
            };
        });

        setItineraryData((prev) => {
            // Always force array
            const currentHotelsRaw =
                prev.hotels?.[category]?.[dayId]?.[location]?.[meal];

            const currentHotels = Array.isArray(currentHotelsRaw)
                ? currentHotelsRaw
                : [];

            const hotelIdStr = String(hotelId);
            const normalized = currentHotels.map(String);

            // Prevent duplicates or max 2 selection
            if (normalized.includes(hotelIdStr) || normalized.length >= 2) {
                return prev;
            }

            const newArray = [...currentHotels, hotelIdStr];

            return {
                ...prev,
                hotels: {
                    ...prev.hotels,
                    [category]: {
                        ...prev.hotels?.[category],
                        [dayId]: {
                            ...prev.hotels?.[category]?.[dayId],
                            [location]: {
                                ...prev.hotels?.[category]?.[dayId]?.[location],
                                [meal]: newArray,
                            },
                        },
                    },
                },
            };
        });

    };


    // Updated: Remove hotel from meal
    const removeHotelFromMeal = (category, dayId, location, meal, hotelId) => {
        // Extract ID if hotelId is an object
        const idToRemove = typeof hotelId === 'object' ? (hotelId.id || hotelId._id) : hotelId;
        console.log('Removing hotel ID:', idToRemove);

        setHotelSelections((prev) => {
            const rawCurrent = prev[category]?.[dayId]?.[location]?.[meal];
            console.log('Raw current in hotelSelections:', rawCurrent);

            // Handle both direct array and nested options structure
            let current = [];
            if (Array.isArray(rawCurrent)) {
                current = rawCurrent;
            } else if (rawCurrent?.options && Array.isArray(rawCurrent.options)) {
                current = rawCurrent.options;
            }

            console.log('Normalized current:', current);

            const newArray = current.filter(item => {
                const itemId = typeof item === 'object' ? (item.id || item._id) : item;
                console.log('Comparing:', itemId, 'with', idToRemove, 'Match:', itemId === idToRemove);
                return itemId !== idToRemove;
            });

            console.log('New array after filter:', newArray);

            const newSelections = { ...prev };
            newSelections[category][dayId][location][meal] = newArray.length > 0 ? newArray : undefined;
            if (!newSelections[category][dayId][location][meal]) {
                delete newSelections[category][dayId][location][meal];
            }
            if (Object.keys(newSelections[category][dayId][location]).length === 0) {
                delete newSelections[category][dayId][location];
            }
            if (Object.keys(newSelections[category][dayId]).length === 0) {
                delete newSelections[category][dayId];
            }
            if (Object.keys(newSelections[category]).length === 0) {
                delete newSelections[category];
            }
            return newSelections;
        });

        setItineraryData((prev) => {
            const newHotels = { ...prev.hotels };
            const rawCurrent = newHotels[category]?.[dayId]?.[location]?.[meal];
            // Handle both direct array and nested options structure
            let current = [];
            if (Array.isArray(rawCurrent)) {
                current = rawCurrent;
            } else if (rawCurrent?.options && Array.isArray(rawCurrent.options)) {
                current = rawCurrent.options;
            }

            const newArray = current.filter(item => {
                const itemId = typeof item === 'object' ? (item.id || item._id) : item;
                return itemId !== idToRemove;
            });

            newHotels[category][dayId][location][meal] = newArray.length > 0 ? newArray : undefined;
            if (!newHotels[category][dayId][location][meal]) {
                delete newHotels[category][dayId][location][meal];
            }
            if (Object.keys(newHotels[category][dayId][location]).length === 0) {
                delete newHotels[category][dayId][location];
            }
            if (Object.keys(newHotels[category][dayId]).length === 0) {
                delete newHotels[category][dayId];
            }
            if (Object.keys(newHotels[category]).length === 0) {
                delete newHotels[category];
            }
            return { ...prev, hotels: newHotels };
        });
    };

    // FIXED: Replace your getFilteredHotels function with this

    const getFilteredHotels = (category, location = null, dayId = null, meal) => {

        // Normalized (array of IDs)
        const mealData = hotelSelections?.[category]?.[dayId]?.[location] || {};

        const selectedBreakfast = mealData?.breakfast || [];
        const selectedLunch = mealData?.lunch || [];
        const selectedDinner = mealData?.dinner || [];
        const selectedStay = mealData?.stayOnly || [];

        // Merge all
        const allSelected = [
            ...selectedBreakfast,
            ...selectedLunch,
            ...selectedDinner,
            ...selectedStay
        ];

        const unique = [...new Set(allSelected)];

        const categoryHotels = hotels.filter(
            hotel => hotel.locationId?.name?.toLowerCase() === location?.toLowerCase()
        );

        // 🔥 CASE 1: If PUT + user = 2 hotels → LOCK every dropdown
        if (unique.length === 2) {
            return categoryHotels.filter(h => unique.includes(String(h._id)));
        }

        // 🔥 CASE 2: If THIS meal has 1 selected → allow 1 more
        const thisMealSelected = mealData?.[meal] || [];

        if (thisMealSelected.length === 1) {
            return categoryHotels.filter(
                h => !thisMealSelected.includes(String(h._id))
            );
        }

        // 🔥 CASE 3: Normal (nothing selected) → show all
        return categoryHotels;
    };


    // Helper to get hotel by ID for preview rendering
    const getHotelById = (hotelId) => {
        // If hotelId is already an object (from MongoDB), return it directly
        if (typeof hotelId === 'object' && hotelId !== null) {
            return {
                _id: hotelId.id || hotelId._id,
                name: hotelId.name || 'Hotel Not Found',
                image: hotelId.image || '',
                rating: hotelId.rating || 0,
                reviews: hotelId.reviews || 0,
                googleReviewLink: hotelId.googleReviewLink || ''
            };
        }
        // Otherwise lookup from hotels state
        return hotels.find(h => h._id === hotelId) || { name: 'Hotel Not Found', image: '', rating: 0, reviews: 0 };
    };

    // Helper to normalize hotel data - handles both array and {options: []} structure
    const normalizeHotelData = (rawData) => {
        if (!rawData) return [];

        let dataArray = [];
        if (Array.isArray(rawData)) {
            dataArray = rawData;
        } else if (rawData.options && Array.isArray(rawData.options)) {
            dataArray = rawData.options;
        }

        // Always extract IDs - handle both objects and plain IDs
        return dataArray.map(item => {
            if (typeof item === 'object' && item !== null) {
                return item.id || item._id;
            }
            return item;
        });
    };

    const handleNumericInput = (e) => {
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    // Fetch themes
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const res = await axios.get("https://apitour.rajasthantouring.in/api/themes", {
                    withCredentials: true,
                });
                setThemes(res.data);
                const defaultTheme = res.data.find(theme => theme.isActive && theme.name === "Default Theme") || res.data[0];
                setSelectedTheme(defaultTheme || null);
            } catch (err) {
                console.error("Failed to fetch themes:", err);
            }
        };
        fetchThemes();
    }, []);

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
    };

    // Fetch structure
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await axios.get("https://apitour.rajasthantouring.in/api/structure");
                setStructure(res.data);
            } catch (err) {
                console.error("Error fetching structure:", err);
            }
        };
        fetchStructure();
    }, []);

    // NEW: Vehicle selection functions - Support up to 2 vehicles
    const addVehicle = (vehicleId) => {
        const selectedVehicle = vehicles.find(v => v._id === vehicleId);
        if (selectedVehicle) {
            setItineraryData(prev => ({
                ...prev,
                vehicle: [selectedVehicle]  // always replace old and keep only one
            }));
        }
    };


    const removeVehicle = (vehicleId) => {
        setItineraryData(prev => ({
            ...prev,
            vehicle: prev.vehicle.filter(v => v._id !== vehicleId)
        }));
    };




    // यह function add करो - Hotels selection के लिए
    const handleDayHotelToggle = (category, dayId, isChecked) => {
        console.log(`🔄 Toggling Day ${dayId} for ${category}: ${isChecked}`);

        // ✅ Update hotelSelectionDays - सिर्फ specific category + dayId के लिए
        setItineraryData(prev => {
            const updatedData = { ...prev };

            // Ensure structure exists
            if (!updatedData.hotelSelectionDays) {
                updatedData.hotelSelectionDays = {};
            }
            if (!updatedData.hotelSelectionDays[category]) {
                updatedData.hotelSelectionDays[category] = {};
            }

            // ✅ Set value only for THIS specific category + dayId combination
            updatedData.hotelSelectionDays[category][dayId] = isChecked;

            console.log(`✅ Updated hotelSelectionDays:`, updatedData.hotelSelectionDays);
            return updatedData;
        });

        // अगर CHECKED (true) किया, तो सिर्फ इस category के इस day के hotels delete करो
        if (isChecked) {
            setItineraryData(prev => {
                const newData = { ...prev };
                const newHotels = { ...newData.hotels };

                // ✅ Only delete hotels for THIS specific category + day combination
                if (newHotels[category]?.[dayId]) {
                    delete newHotels[category][dayId];
                    console.log(`✅ Deleted hotels for ${category} Day ${dayId}`);
                }

                return { ...newData, hotels: newHotels };
            });

            // ✅ Also delete from hotelSelections for this specific category + day
            setHotelSelections(prev => {
                const newSelections = { ...prev };
                if (newSelections[category]?.[dayId]) {
                    delete newSelections[category][dayId];
                    console.log(`✅ Deleted hotelSelections for ${category} Day ${dayId}`);
                }
                return newSelections;
            });
        }
    };




    const saveBookingToDatabase = async (status) => {
        if (isSubmitting || isBookingSaved) {
            toast.info("You've already saved this itinerary. Refresh the page to start a new one!");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            // Convert travelDate from YYYY-MM-DD to DD-MM-YYYY
            const formattedClientDetails = { ...clientDetails };
            if (clientDetails.travelDate && clientDetails.travelDate.includes("-")) {
                const parts = clientDetails.travelDate.split("-");
                if (parts.length === 3 && parts[0].length === 4) {
                    formattedClientDetails.travelDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            // 🔴 STEP: केवल selectedCategories का data save करो
            const cleanedItineraryData = {
                ...itineraryData,
                vehicle: itineraryData.vehicle || [],

                // केवल selectedCategories के लिए pricing रखो
                pricing: Object.keys(itineraryData.pricing || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.pricing[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए offers रखो
                offers: Object.keys(itineraryData.offers || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        // ✅ यहाँ ensure करो कि value हमेशा number हो
                        const offerValue = itineraryData.offers[cat];
                        acc[cat] = typeof offerValue === 'number' ? offerValue : (Number(offerValue) || 0);
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए bookingAmount रखो
                bookingAmount: Object.keys(itineraryData.bookingAmount || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.bookingAmount[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए highlightPrice रखो
                highlightPrice: Object.keys(itineraryData.highlightPrice || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.highlightPrice[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए hotels रखो
                hotels: Object.keys(itineraryData.hotels || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        // Filter out days where hotelSelectionDays is marked as true (guest arranges own)
                        const categoryHotels = {};

                        if (itineraryData.hotels[cat]) {
                            Object.keys(itineraryData.hotels[cat]).forEach((dayId) => {
                                // If this day is NOT marked as "guest arranges own" (not true), keep the hotels
                                if (itineraryData.hotelSelectionDays?.[cat]?.[dayId] !== true) {
                                    categoryHotels[dayId] = itineraryData.hotels[cat][dayId];
                                }
                            });
                        }

                        // Only add to accumulator if there are hotels for this category
                        if (Object.keys(categoryHotels).length > 0) {
                            acc[cat] = categoryHotels;
                        }
                    }
                    return acc;
                }, {}),
                festivalOffer: itineraryData.festivalOffer,
            };


            const bookingData = {
                clientDetails: {
                    ...formattedClientDetails,
                    // ✅ These will now be included automatically
                    email2: formattedClientDetails.email2 || "",
                },
                selectedItinerary: selectedItinerary || {},
                itineraryData: cleanedItineraryData,
                hotelSelections: Object.keys(hotelSelections || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = hotelSelections[cat];
                    }
                    return acc;
                }, {}),
                hotelSelectionDays: itineraryData.hotelSelectionDays,
                stayOnlyDays: itineraryData.stayOnlyDays || {},
                totalAmount: getCategoryTotals(),
                grandTotal: getTotalPrice(),
                status,
                createby: user,
                theme: selectedTheme
                    ? {
                        _id: selectedTheme._id,
                        name: selectedTheme.name,
                        link: selectedTheme.link || "",
                        imageUrl: selectedTheme.imageUrl || "",
                        isActive: selectedTheme.isActive,
                    }
                    : { name: "Default Theme", isActive: true },
                contact: selectedContact,
                createbyName: adminuser,
                inclusions: bookingInclusions,
                exclusions: bookingExclusions,
                termsAndConditions: terms,
                cancellationAndRefundPolicy: cancellationAndRefundPolicy,
                travelRequirements: travelRequirements,
                noteText: noteText
            };
            console.log("📤 Saving booking data:", bookingData);

            const url = isEditMode
                ? `https://apitour.rajasthantouring.in/api/pending/${editId}`
                : "https://apitour.rajasthantouring.in/api/pending";
            const method = isEditMode ? "PUT" : "POST";

            console.log("📤 Saving booking data:", bookingData);

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (response.ok) {
                if (!editId && !isEditMode) {
                    setIsBookingSaved(true);
                }
                setBookingId(result._id);
                setBookingData(result);
                alert(`Booking ${isEditMode ? 'updated' : status}! Your booking ID is: ${result.bookingId || result._id}`);
            } else {
                setError("Failed to save booking. Please try again.");
            }
        } catch (error) {
            console.error("Error saving booking:", error);
            setError("Failed to save booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }


    const saveBookingToDatabasePreview = async (status) => {
        setError(null);
        try {
            // Convert travelDate from YYYY-MM-DD to DD-MM-YYYY for database
            const formattedClientDetails = { ...clientDetails };
            if (clientDetails.travelDate && clientDetails.travelDate.includes("-")) {
                const parts = clientDetails.travelDate.split("-");
                if (parts.length === 3 && parts[0].length === 4) {
                    formattedClientDetails.travelDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            // 🔴 STEP: केवल selectedCategories का data save करो
            const cleanedItineraryData = {
                ...itineraryData,
                vehicle: itineraryData.vehicle || [],

                // केवल selectedCategories के लिए pricing रखो
                pricing: Object.keys(itineraryData.pricing || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.pricing[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए offers रखो
                offers: Object.keys(itineraryData.offers || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.offers[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए bookingAmount रखो
                bookingAmount: Object.keys(itineraryData.bookingAmount || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.bookingAmount[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए highlightPrice रखो
                highlightPrice: Object.keys(itineraryData.highlightPrice || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = itineraryData.highlightPrice[cat];
                    }
                    return acc;
                }, {}),

                // केवल selectedCategories के लिए hotels रखो
                hotels: Object.keys(itineraryData.hotels || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        // Filter out days where hotelSelectionDays is marked as true (guest arranges own)
                        const categoryHotels = {};

                        if (itineraryData.hotels[cat]) {
                            Object.keys(itineraryData.hotels[cat]).forEach((dayId) => {
                                // If this day is NOT marked as "guest arranges own" (not true), keep the hotels
                                if (itineraryData.hotelSelectionDays?.[cat]?.[dayId] !== true) {
                                    categoryHotels[dayId] = itineraryData.hotels[cat][dayId];
                                }
                            });
                        }

                        // Only add to accumulator if there are hotels for this category
                        if (Object.keys(categoryHotels).length > 0) {
                            acc[cat] = categoryHotels;
                        }
                    }
                    return acc;
                }, {}),
                festivalOffer: itineraryData.festivalOffer,
            };


            const bookingData = {
                clientDetails: formattedClientDetails,
                selectedItinerary,
                itineraryData: cleanedItineraryData,
                hotelSelections: Object.keys(hotelSelections || {}).reduce((acc, cat) => {
                    if (selectedCategories.includes(cat)) {
                        acc[cat] = hotelSelections[cat];
                    }
                    return acc;
                }, {}),
                hotelSelectionDays: itineraryData.hotelSelectionDays,
                stayOnlyDays: itineraryData.stayOnlyDays || {},
                totalAmount: getCategoryTotals(),
                grandTotal: getTotalPrice(),
                status,
                createby: user,
                theme: selectedTheme
                    ? {
                        _id: selectedTheme._id,
                        name: selectedTheme.name,
                        link: selectedTheme.link || "",
                        imageUrl: selectedTheme.imageUrl || "",
                        isActive: selectedTheme.isActive,
                    }
                    : { name: "Default Theme", isActive: true },
                contact: selectedContact,
                createbyName: adminuser,
                inclusions: bookingInclusions,
                exclusions: bookingExclusions,
                termsAndConditions: terms,
                cancellationAndRefundPolicy: cancellationAndRefundPolicy,
                travelRequirements: travelRequirements,
                noteText: noteText
            };
            // Use PUT if editing, POST if creating
            const url = "https://apitour.rajasthantouring.in/api/previewPending";
            const method = "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();
            console.log(response);

            if (response.ok) {
                setBookingId(result._id);
                setBookingData(result);
                const themeLink = (result.theme?.link || "").replace(/^\//, "");
                const finalUrl = `https://tour.rajasthantouring.in/Senduser${themeLink}/${result._id}`;

                window.open(finalUrl, "_blank"); // <-- NEW TAB OPEN

                // Update itineraryData with saved hotels to ensure preview shows correctly
                if (result.itineraryData?.hotels) {
                    setItineraryData(prev => ({
                        ...prev,
                        hotels: result.itineraryData.hotels
                    }));
                }
            } else {
                setError("Failed to save booking. Please try again.");
            }
        } catch (error) {
            console.log(error);

            console.error("Error saving booking:", error);
            setError("Failed to save booking. Please try again.");
        } finally {

        }
    };
    console.log(itineraryData);


    // UPDATED: Function definition with Festival Offer (percentage discount applied to all categories)
    const getTotalPrice = useCallback(() => {
        if (!itineraryData?.pricing) return 0;
        const festivalValue = itineraryData.festivalOffer?.value || 0;
        return Object.entries(itineraryData.pricing).reduce((sum, [category, price]) => {
            const offer = itineraryData.offers?.[category] || 0;
            const festivalDiscount = price * (festivalValue / 100);
            return sum + (price - offer - festivalDiscount);
        }, 0);
    }, [itineraryData.pricing, itineraryData.offers, itineraryData.festivalOffer?.value]);


    // Call the function to get the value
    console.log(itineraryData, "itineraryDataitineraryData");  // Note the ()


    // New: Get category-wise totals (with festival discount)
    const getCategoryTotals = useCallback(() => {
        const pricing = itineraryData?.pricing || {};     // ← FIX 1
        const offers = itineraryData?.offers || {};       // ← FIX 2
        const festivalValue = itineraryData?.festivalOffer?.value || 0;

        const totals = {};

        selectedCategories?.forEach(category => {
            // actual key match fix (case-insensitive)
            const key = Object.keys(pricing).find(
                k => k.trim().toLowerCase() === category.trim().toLowerCase()
            ) || category;

            const price = pricing[key] || 0;
            const offer = offers[key] || 0;

            if (price > 0) {
                const afterOffer = price - offer;
                const festivalDiscount = afterOffer * (festivalValue / 100);
                totals[key] = afterOffer - festivalDiscount;
            }
        });

        return totals;
    }, [
        itineraryData?.pricing,
        itineraryData?.offers,
        itineraryData?.festivalOffer?.value,
        selectedCategories
    ]);

    console.log(getCategoryTotals());



    const sendWhatsAppMessage = () => {
        if (!bookingData) return; // Agar bookingData nahi hai to return

        const bookingLink = `https://tour.rajasthantouring.in/Senduser${bookingData.theme.link}/${bookingData._id}`;
        const pricing = bookingData.itineraryData?.pricing || {};
        const offers = bookingData.itineraryData?.offers || {};
        const bookingAmount = bookingData.itineraryData?.bookingAmount || {};
        const festivalOffer = bookingData.itineraryData?.festivalOffer || { name: "", value: 0 };

        let message =
            `Hi ${bookingData.clientDetails?.name || "Guest"}!\n\n` +
            `Package: ${bookingData.itineraryData?.titles?.[0] || "N/A"}\n` +
            `Duration: ${bookingData.itineraryData?.duration || "N/A"}\n\n`;

        // NEW: Add festival offer if applicable
        if (festivalOffer.value > 0) {
            message += `${festivalOffer.name}: ${festivalOffer.value}% OFF on all packages!\n\n`;
        }

        // ✅ Sirf selected categories ke liye loop
        Object.keys(pricing).forEach(cat => {
            const priceObj = pricing[cat];
            const offerObj = offers[cat];
            const bookingObj = bookingAmount[cat];

            // Check selected and valid
            if (!priceObj?.selected) return;

            const price = Number(priceObj.value || 0);
            const offer = Number(offerObj?.value || 0);
            const festivalDiscount = price * (festivalOffer.value / 100);
            const subtotal = price - offer - festivalDiscount;
            const catBookingAmount = Number(bookingObj?.value || 0);

            // Category-wise message
            message += `${cat.charAt(0).toUpperCase() + cat.slice(1)} Package:\n`;
            message += `Base: ₹${price}\n`;
            if (offer > 0) message += `Discount: ₹${offer}\n`;
            if (festivalOffer.value > 0) message += `${festivalOffer.name}: ₹${festivalDiscount.toFixed(0)}\n`;
            message += `Total: ₹${subtotal.toFixed(0)}\n`;
            message += `Booking Amount: ₹${catBookingAmount}\n\n`;
        });

        message += `You can view your booking details here:\n${bookingLink}\n\n`;
        message += `Thank you for choosing us for your travel needs!`;

        // ✅ WhatsApp link open
        const phone = bookingData.clientDetails?.phone?.replace(/[^0-9]/g, "");
        if (phone) {
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");
        } else {
            alert("No valid phone number found.");
        }
    };


    if (step === "client-details") {
        return (
            <div className=" w-full mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
                <div className="w-full">
                    <div className="bg-white h-screen overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                </div>
                                <h1 className="text-lg sm:text-xl font-bold">Client Details</h1>
                                <span className="text-blue-200 text-xs font-medium">Step 1 of 3</span>
                            </div>
                        </div>

                        <form onSubmit={handleClientDetailsSubmit} className="p-4 sm:p-6 ">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 flex items-center space-x-2 text-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 tracking-wide">
                                        Client Name <span className="text-red-500">*</span>
                                    </label>

                                    <div className="flex items-center gap-3">
                                        {/* Title Select */}
                                        <select
                                            value={title}
                                            onChange={handleTitleChange}
                                            className="min-w-[90px] px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 shadow-sm transition-all duration-200"

                                        >
                                            <option value="">Title</option>
                                            <option value="Mr.">Mr</option>
                                            <option value="Ms.">Ms</option>
                                            <option value="Mrs.">Mrs</option>
                                            <option value="Miss.">Miss</option>
                                            <option value="Dr.">Dr</option>
                                            <option value="Prof.">Prof</option>
                                            <option value="Rev.">Rev</option>
                                            <option value="Hon.">Hon</option>
                                            <option value="Mx.">Mx</option>
                                            <option value="Sir">Sir</option>
                                            <option value="Madam">Madam</option>
                                            <option value="Master">Master</option>
                                            <option value="Capt.">Capt</option>
                                            <option value="Col.">Col</option>
                                            <option value="Maj.">Maj</option>
                                            <option value="Lt.">Lt</option>
                                            <option value="Engr.">Engr</option>
                                            <option value="Er.">Er</option>
                                            <option value="Adv.">Adv</option>
                                            <option value="CA">CA</option>
                                            <option value="CPA">CPA</option>
                                        </select>

                                        {/* Name Input */}
                                        <div className="flex-1">
                                            <input
                                                id="name"
                                                type="text"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 shadow-sm transition-all duration-200"
                                                placeholder="Enter full name"
                                                value={displayName}
                                                onChange={handleNameChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-800">Email Address</label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            className="w-full px-3 py-2 pl-8 sm:pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter email address"
                                            value={clientDetails.email}
                                            onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}

                                        />
                                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="email2" className="block text-sm font-semibold text-gray-800">Email Address 2 (Optional)</label>
                                    <div className="relative">
                                        <input
                                            id="email2"
                                            type="email"
                                            className="w-full px-3 py-2 pl-8 sm:pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter second email address"
                                            value={clientDetails.email2}
                                            onChange={(e) => setClientDetails({ ...clientDetails, email2: e.target.value })}
                                        />
                                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">Phone Number</label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="w-full px-3 py-2 pl-8 sm:pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter phone number"
                                            value={clientDetails.phone}
                                            onChange={(e) => {
                                                let value = e.target.value.trim();

                                                // 1️⃣ agar user + se start karta hai (any country code), to use rehne do
                                                if (value.startsWith("+")) {
                                                    setClientDetails({ ...clientDetails, phone: value });
                                                    return;
                                                }

                                                // 2️⃣ agar user sirf digits likhta hai, to +91 auto-add karo
                                                if (/^\d+$/.test(value)) {
                                                    value = "+91" + value.replace(/^0+/, "");
                                                }

                                                // 3️⃣ agar user blank kare, to blank hi rehne do
                                                if (value === "") {
                                                    setClientDetails({ ...clientDetails, phone: "" });
                                                    return;
                                                }

                                                setClientDetails({ ...clientDetails, phone: value });
                                            }}
                                            required
                                        />
                                        <svg
                                            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                    </div>

                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="adults" className="block text-sm font-semibold text-gray-800">Number of Adults</label>
                                    <input
                                        id="adults"
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                        placeholder="Enter number of adults"
                                        value={clientDetails.adults}
                                        onChange={(e) => setClientDetails({
                                            ...clientDetails,
                                            adults: e.target.value,
                                            travelers: Number(e.target.value) + Number(clientDetails.kids5to12) + Number(clientDetails.kidsBelow5),
                                        })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="kids5to12" className="block text-sm font-semibold text-gray-800">Kids (5-12 Years)</label>
                                    <input
                                        id="kids5to12"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                        placeholder="Enter number of kids"
                                        value={clientDetails.kids5to12}
                                        onChange={(e) => setClientDetails({
                                            ...clientDetails,
                                            kids5to12: e.target.value,
                                            travelers: Number(clientDetails.adults) + Number(e.target.value) + Number(clientDetails.kidsBelow5),
                                        })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="kidsBelow5" className="block text-sm font-semibold text-gray-800">Kids (Below 5 Years)</label>
                                    <input
                                        id="kidsBelow5"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                        placeholder="Enter number of kids"
                                        value={clientDetails.kidsBelow5}
                                        onChange={(e) => setClientDetails({
                                            ...clientDetails,
                                            kidsBelow5: e.target.value,
                                            travelers: Number(clientDetails.adults) + Number(clientDetails.kids5to12) + Number(e.target.value),
                                        })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="rooms" className="block text-sm font-semibold text-gray-800">Number of Rooms</label>
                                    <input
                                        id="rooms"
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                        placeholder="Enter number of rooms"
                                        value={clientDetails.rooms}
                                        onChange={(e) => setClientDetails({ ...clientDetails, rooms: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="extraBeds" className="block text-sm font-semibold text-gray-800">Extra mattress</label>
                                    <input
                                        id="extraBeds"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                        placeholder="Enter number of extra mattress"
                                        value={clientDetails.extraBeds}
                                        onChange={(e) => setClientDetails({ ...clientDetails, extraBeds: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="travelDate" className="block text-sm font-semibold text-gray-800">Travel Date</label>

                                    <div className="relative">
                                        <DatePicker
                                            selected={toLocalDate(clientDetails.travelDate)}
                                            onChange={(date) => {
                                                if (!date || date < todayDate) {
                                                    toast.error("Past dates nahi chalegi bhai 😅");
                                                    return;
                                                }
                                                const y = date.getFullYear();
                                                const m = String(date.getMonth() + 1).padStart(2, "0");
                                                const d = String(date.getDate()).padStart(2, "0");
                                                const dateStr = `${y}-${m}-${d}`;

                                                setItineraryData(prev => ({ ...prev, date: dateStr }));
                                                setClientDetails(prev => ({ ...prev, travelDate: dateStr }));
                                            }}
                                            minDate={todayDate}
                                            dateFormat="dd - MMM - yyyy"   // Ab yeh dikhega → 05 - Dec - 2025 (bohot premium lagta hai)
                                            placeholderText="Travel Date daal do..."

                                            // Premium Classes
                                            className="custom-premium-datepicker border-none h-10"
                                            calendarClassName="custom-premium-calendar"
                                            dayClassName={(date) =>
                                                date < todayDate
                                                    ? "text-red-400/70 line-through cursor-not-allowed hover:bg-transparent"
                                                    : "hover:bg-blue-100 hover:text-blue-700 font-semibold transition-all duration-150"
                                            }
                                            wrapperClassName="w-full"

                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={15}
                                        />

                                        {/* Premium Calendar Icon with subtle pulse */}
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                            <div className="relative">
                                                <svg
                                                    className="w-5 h-5 text-blue-600 drop-shadow-sm"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                {/* Tiny glowing dot */}
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-ping"></span>
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center sm:justify-end">
                                <button
                                    type="submit"
                                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transform transition-all duration-200 hover:scale-105 shadow w-full sm:w-auto"
                                >
                                    Continue to Itinerary →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    if (step === "itinerary-selection") {
        return (
            <div className=" w-full mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
                <div className="mx-auto w-full">
                    <div className="bg-white overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold">2</span>
                                    </div>
                                    <h1 className="text-lg sm:text-xl font-bold">Select Itinerary</h1>
                                    <span className="text-blue-200 text-xs sm:text-sm font-medium">Step 2 of 3</span>
                                </div>
                                <button
                                    className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center space-x-1 border border-white/20 text-xs sm:text-sm"
                                    onClick={() => setStep("client-details")}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Back</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4">
                            {loading && (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="inline-flex items-center space-x-2 text-blue-600 text-sm sm:text-base">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        <span>Loading itineraries...</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 flex items-center space-x-2 text-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                                <div className="flex-1 w-full">
                                    <label htmlFor="duration-filter" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                                        Filter by Duration
                                    </label>
                                    <select
                                        id="duration-filter"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        value={durationFilter}
                                        onChange={(e) => setDurationFilter(e.target.value)}
                                    >
                                        <option value="">All Durations</option>
                                        {[...new Set(itineraries.map((it) => it.duration))].map((duration) => (
                                            <option key={duration} value={duration}>
                                                {duration}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative w-full sm:w-64 lg:w-80">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">Search Itineraries</label>
                                    <input
                                        type="text"
                                        placeholder="Search by title or location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <svg
                                        className="absolute left-2.5 top-[70%] transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex justify-end mb-3">
                                <button
                                    onClick={() => handleItinerarySelect({ _id: "blank", isBlank: true })}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 hover:scale-105 transition-all"
                                >
                                    ✨ Create Custom Itinerary
                                </button>
                            </div>

                            {selectedItinerary && (
                                <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-400 rounded-lg shadow-sm">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            ✓
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <p className="text-green-800 text-base sm:text-lg font-bold leading-tight">
                                                {selectedItinerary.isBlank ? '✨ Custom Itinerary' : selectedItinerary.titles?.[0] || 'N/A'}
                                            </p>

                                            <p className="text-green-600 text-xs sm:text-sm mt-0.5">
                                                {selectedItinerary.isBlank
                                                    ? 'Create your own custom itinerary'
                                                    : `Duration: ${selectedItinerary.duration || 'N/A'}`}
                                            </p>
                                        </div>

                                        {/* NEW: Continue Button */}
                                        {selectedItinerary._id && (
                                            <button
                                                onClick={() => {
                                                    handleItinerarySelect(selectedItinerary);
                                                    setStep("itinerary-builder");
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold text-sm whitespace-nowrap flex-shrink-0"
                                            >
                                                Continue →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}


                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800">Available Itineraries</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Choose the perfect itinerary for your trip</p>
                                </div>

                                <div className="my-3 px-3">
                                    <input
                                        type="text"
                                        placeholder="Filter by Tour Code"
                                        value={tourCodeFilter}
                                        onChange={(e) => setTourCodeFilter(e.target.value)}
                                        className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>



                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-xs sm:text-sm min-w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                {["Tour Code", "Duration", "Title", "Date", "Locations", "Action"].map((th) => (
                                                    <th key={th} className="px-2 sm:px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        {th}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredItineraries
                                                .filter(itinerary => !itinerary.isBlank)   // 👈 CUSTOM / BLANK REMOVE
                                                .map((itinerary, index) => (
                                                    <tr
                                                        key={itinerary._id}
                                                        className="hover:bg-blue-50 transition-colors duration-150"
                                                    >
                                                        <td className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                            {itinerary.tourcode || ''}
                                                        </td>

                                                        <td className="px-2 sm:px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                                                {itinerary.duration || "N/A"}
                                                            </span>
                                                        </td>

                                                        <td className="px-2 sm:px-3 py-2 font-semibold text-gray-900 truncate max-w-xs">
                                                            {itinerary.titles?.[0] || "N/A"}
                                                        </td>

                                                        <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap">
                                                            {itinerary.date ? new Date(itinerary.date).toLocaleDateString() : "N/A"}
                                                        </td>

                                                        <td className="px-2 sm:px-3 py-2 text-gray-600 max-w-md">
                                                            <div className="flex flex-wrap gap-1">
                                                                {Object.entries(
                                                                    itinerary.days
                                                                        .flatMap(d => d.locations || [d.location])
                                                                        .filter(Boolean)
                                                                        .reduce((acc, loc) => {
                                                                            acc[loc] = (acc[loc] || 0) + 1;
                                                                            return acc;
                                                                        }, {})
                                                                )
                                                                    .slice(0, -1)
                                                                    .map(([loc, count]) => (
                                                                        <span
                                                                            key={loc}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                                                        >
                                                                            {loc} - {count}N
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        </td>

                                                        <td className="px-2 sm:px-3 py-2 text-center">
                                                            <button
                                                                onClick={() => handleItinerarySelect(itinerary)}
                                                                className="px-3 py-1 font-semibold rounded-lg text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105"
                                                            >
                                                                Select
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}

                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden divide-y divide-gray-100">
                                    {filteredItineraries
                                        .filter(itinerary => !itinerary.isBlank)   // 🚀 Blank itinerary removed
                                        .length > 0 ? (

                                        filteredItineraries
                                            .filter(itinerary => !itinerary.isBlank)  // 🚀 Apply same filter here also
                                            .map((itinerary, index) => (
                                                <div
                                                    key={itinerary._id}
                                                    className="p-3 md:hidden transition-colors duration-150 hover:bg-blue-50"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-blue-600 font-bold text-xs">
                                                                {index + 1}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleItinerarySelect(itinerary)}
                                                            className="px-3 py-1 font-semibold rounded-lg text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                                        >
                                                            Select
                                                        </button>
                                                    </div>

                                                    <div className="space-y-1 text-xs">
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Duration:</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 ml-2">
                                                                {itinerary.duration || "N/A"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Title:</span>
                                                            <span className="ml-2">{itinerary.titles?.[0] || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">
                                            No itineraries found
                                        </div>
                                    )}
                                </div>

                            </div>
                            {selectedItinerary?.isBlank && (
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-xs sm:text-sm">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-blue-800">
                                        <span className="font-semibold">✨ Blank Itinerary Selected</span> - Create your custom itinerary from scratch
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "itinerary-builder") {
        return (
            <div className="min-h-screen w-full mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
                <div className="w-full">
                    <div className="bg-white overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold">3</span>
                                    </div>
                                    <h1 className="text-lg sm:text-xl font-bold">Itinerary Builder</h1>
                                    <span className="text-blue-200 text-xs sm:text-sm font-medium">Step 3 of 3</span>
                                </div>
                                <button
                                    className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center space-x-1 border border-white/20 text-xs sm:text-sm"
                                    onClick={() => setStep("itinerary-selection")}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Back</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 ">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 flex items-center space-x-2 text-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-4">


                                    {/* Itinerary Details - IMPROVED: Consistent card styling */}
                                    <div className="space-y-4 py-1 mb-6">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                                <svg
                                                    className="w-4 h-4 text-accent-foreground"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Itinerary Details</h2>
                                        </div>
                                        <div className="border border-gray-300 rounded-xl p-3 sm:p-4 shadow-sm space-y-3 bg-white">
                                            {/* Titles */}
                                            <div className="space-y-2">
                                                <label className="block text-sm sm:text-base font-semibold text-card-foreground">Itinerary Titles</label>
                                                {itineraryData.titles.map((title, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            value={title}
                                                            onChange={(e) =>
                                                                setItineraryData({
                                                                    ...itineraryData,
                                                                    titles: itineraryData.titles.map((t, i) => (i === index ? e.target.value : t)),
                                                                })
                                                            }
                                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                            placeholder={`Title ${index + 1}`}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                setItineraryData({
                                                                    ...itineraryData,
                                                                    titles:
                                                                        itineraryData.titles.filter((_, i) => i !== index).length > 0
                                                                            ? itineraryData.titles.filter((_, i) => i !== index)
                                                                            : [""],
                                                                })
                                                            }
                                                            className="max-h-[40px] py-1 px-2 text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                                            disabled={itineraryData.titles.length === 1}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() =>
                                                        setItineraryData({
                                                            ...itineraryData,
                                                            titles: [...itineraryData.titles, ""],
                                                        })
                                                    }
                                                    className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                                                >
                                                    Add Title
                                                </button>
                                            </div>

                                            {/* Descriptions */}
                                            {/* <div className="space-y-2">
                                                <label className="block text-sm sm:text-base font-semibold text-card-foreground">Itinerary Descriptions</label>
                                                {itineraryData.descriptions.map((desc, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-2">
                                                        <textarea
                                                            value={desc}
                                                            onChange={(e) =>
                                                                setItineraryData({
                                                                    ...itineraryData,
                                                                    descriptions: itineraryData.descriptions.map((d, i) =>
                                                                        i === index ? e.target.value : d
                                                                    ),
                                                                })
                                                            }
                                                            className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                                            rows={3}
                                                            placeholder={`Description ${index + 1}`}
                                                        />

                                                        <button
                                                            onClick={() =>
                                                                setItineraryData({
                                                                    ...itineraryData,
                                                                    descriptions:
                                                                        itineraryData.descriptions.filter((_, i) => i !== index).length > 0
                                                                            ? itineraryData.descriptions.filter((_, i) => i !== index)
                                                                            : [""],
                                                                })
                                                            }
                                                            className="max-h-[40px] py-1 px-2 text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                                            disabled={itineraryData.descriptions.length === 1}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={() =>
                                                        setItineraryData({
                                                            ...itineraryData,
                                                            descriptions: [...itineraryData.descriptions, ""],
                                                        })
                                                    }
                                                    className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                                                >
                                                    Add Description
                                                </button>
                                            </div> */}

                                            {/* Date */}
                                            <div className="space-y-2">
                                                <label className="block text-sm sm:text-base font-semibold text-card-foreground">
                                                    Travel Date
                                                </label>

                                                <div className="relative">
                                                    <DatePicker
                                                        selected={toLocalDate(clientDetails.travelDate)}
                                                        onChange={(date) => {
                                                            if (!date || date < new Date()) {
                                                                toast.info("You cannot select a past date");
                                                                return;
                                                            }

                                                            const y = date.getFullYear();
                                                            const m = String(date.getMonth() + 1).padStart(2, "0");
                                                            const d = String(date.getDate()).padStart(2, "0");
                                                            const dateStr = `${y}-${m}-${d}`;

                                                            setItineraryData(prev => ({ ...prev, date: dateStr }));
                                                            setClientDetails(prev => ({ ...prev, travelDate: dateStr }));
                                                        }}

                                                        minDate={new Date()}
                                                        dateFormat="dd - MMM - yyyy"
                                                        placeholderText="Select travel date"

                                                        className="custom-premium-datepicker h-14 border-none"
                                                        calendarClassName="custom-premium-calendar"
                                                        wrapperClassName="w-full"

                                                        showMonthDropdown
                                                        showYearDropdown
                                                        dropdownMode="select"
                                                        scrollableYearDropdown
                                                        yearDropdownItemNumber={25}
                                                    />

                                                    {/* Calendar Icon */}
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg
                                                            className="w-5 h-5 text-blue-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a 2 2 0 00-2 2v14a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {!selectedItinerary?.isBlank && (
                                                <div className="space-y-2">
                                                    <label className="block text-sm sm:text-base font-semibold text-card-foreground">
                                                        Tour Code
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={itineraryData.tourcode}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setItineraryData(prev => ({
                                                                ...prev,
                                                                tourcode: value,
                                                                itineraryTourcode: value
                                                            }));
                                                        }}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-gray-50"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="block text-sm sm:text-base font-semibold text-card-foreground">Duration</label>
                                                <input
                                                    type="text"
                                                    value={itineraryData.duration}

                                                    onChange={(e) => handleDurationChange(e)}  // e parameter define ho gaya

                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-gray-50"
                                                />
                                            </div>

                                            {/* Images */}
                                            {/* <div className="space-y-3">
                                                    <label className="block text-xs sm:text-sm font-semibold text-gray-800">
                                                        Itinerary Images
                                                    </label>
                                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                                        {itineraryData.images.map((img, index) => (
                                                            <div key={index} className="w-32 sm:w-40 flex flex-col">
                                                                <div className="relative w-full h-20 sm:h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 group-hover:border-gray-300 transition-colors">
                                                                    {img ? (
                                                                        <img
                                                                            src={`https://apitour.rajasthantouring.in${img}`}
                                                                            alt={`Itinerary Image ${index + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <div className="text-xs text-gray-400">No image</div>
                                                                        </div>
                                                                    )}

                                                                    <label className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-80 hover:opacity-100 transition-opacity z-10">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleUploadItineraryImage(e.target.files?.[0], index)}
                                                                            className="hidden"
                                                                        />
                                                                        <Upload className="w-3 h-3 text-gray-700" />
                                                                    </label>

                                                                    <button
                                                                        onClick={() => setItineraryData({ ...itineraryData, images: itineraryData.images.filter((_, i) => i !== index) })}
                                                                        className="absolute top-1 left-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors z-10"
                                                                        title="Remove image"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                                    </button>
                                                                </div>

                                                                <input
                                                                    value={img || ''}
                                                                    onChange={(e) => {
                                                                        const newImgs = itineraryData.images.map((im, i) => i === index ? e.target.value : im);
                                                                        setItineraryData({ ...itineraryData, images: newImgs });
                                                                    }}
                                                                    placeholder="Enter image URL"
                                                                    className="mt-2 text-xs w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                                                                />
                                                            </div>
                                                        ))}

                                                        <div className="w-32 sm:w-40 flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                                                            <label className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-gray-600 transition-colors">
                                                                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                                                                    <Plus className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                                <span>Add Image</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleUploadItineraryImage(e.target.files?.[0], null)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div> */}
                                        </div>
                                    </div>

                                    {/* Days Section - IMPROVED: Consistent styling */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                                <svg
                                                    className="w-4 h-4 text-accent-foreground"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m12 0H7m15 4v-7a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h16a2 2 0 002-2z"
                                                    />
                                                </svg>
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Build Your Itinerary</h2>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">Day-wise Itinerary</h3>
                                            <button
                                                onClick={addDay}
                                                className="mt-1 sm:mt-0 px-4 py-2 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 font-medium"
                                            >
                                                Add Day
                                            </button>
                                        </div>

                                        {itineraryData.days.map((day) => {
                                            const currentDay = itineraryData.days.find(d => d.id === day.id);
                                            return (
                                                <div key={day.id} className="border border-gray-300 rounded-xl p-3 sm:p-4 shadow-sm space-y-3 bg-white">
                                                    <div className="flex flex-wrap justify-between gap-3">
                                                        <h4 className="text-base sm:text-lg font-semibold text-card-foreground">Day {day.id}</h4>
                                                        {itineraryData.days.length > 2 ? (
                                                            <button
                                                                onClick={() => deleteDay(day.id)}
                                                                className="px-1 py- bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-medium flex items-center gap-1"
                                                            >
                                                                <Trash2 size={12} />
                                                                Delete Day
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                Minimum 2 days required
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Titles Section */}
                                                    {/* Titles Section */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm sm:text-base font-semibold text-card-foreground">Titles</label>

                                                        {currentDay.titles.map((title, index) => (
                                                            <div key={`${currentDay.id}-title-${index}`} className="flex flex-col sm:flex-row gap-2">
                                                                <input
                                                                    type="text"
                                                                    // ✅ हर बार fresh value लो itineraryData से
                                                                    value={itineraryData.days.find(d => d.id === currentDay.id)?.titles[index] || ""}
                                                                    onChange={(e) => {
                                                                        if (isAISuggestionApplying) {
                                                                            console.log("⏭️ Skipping title onChange - AI suggestion is applying");
                                                                            return;
                                                                        }

                                                                        console.log("✏️ Title changed:", e.target.value);
                                                                        updateDay(currentDay.id, "titles", e.target.value, index);
                                                                        setTypedTitle(prev => ({
                                                                            ...prev,
                                                                            [currentDay.id]: true
                                                                        }));
                                                                    }}
                                                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                                    placeholder={`Title ${index + 1}`}
                                                                />

                                                                <button
                                                                    onClick={() => removeDayField(currentDay.id, "titles", index)}
                                                                    className="max-h-[40px] text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium px-2"
                                                                    disabled={currentDay.titles.length === 1}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}



                                                        {/* 🔥 AI Suggestions - Sirf last title complete hone par dikhega */}






                                                        <button
                                                            onClick={() => addDayField(day.id, "titles")}
                                                            className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                                                        >
                                                            Add Title
                                                        </button>
                                                    </div>
                                                    {typedTitle[day.id] === true && (
                                                        <ItineraryAISuggestions
                                                            day={day}
                                                            dayTitle={day.titles[day.titles.length - 1]}
                                                            dayId={day.id}
                                                            onAddSuggestion={(suggestion) => {
                                                                console.log("🎯 AI Suggestion received:", suggestion);

                                                                // ✅ Mark that we're applying suggestion
                                                                setIsAISuggestionApplying(true);

                                                                // Update itineraryData
                                                                setItineraryData((prev) => {
                                                                    const updatedDays = prev.days.map((currentDay) => {
                                                                        if (currentDay.id !== day.id) {
                                                                            return currentDay;
                                                                        }

                                                                        const newDay = { ...currentDay };
                                                                        let newTitles = [...(newDay.titles || [""])];
                                                                        let newDescriptions = [...(newDay.descriptions || [""])];

                                                                        const maxLen = Math.max(newTitles.length, newDescriptions.length);
                                                                        while (newTitles.length < maxLen) newTitles.push("");
                                                                        while (newDescriptions.length < maxLen) newDescriptions.push("");

                                                                        const lastIdx = newTitles.length - 1;
                                                                        newTitles[lastIdx] = suggestion.title;
                                                                        newDescriptions[lastIdx] = suggestion.description;

                                                                        return {
                                                                            ...newDay,
                                                                            titles: newTitles,
                                                                            descriptions: newDescriptions,
                                                                        };
                                                                    });

                                                                    return {
                                                                        ...prev,
                                                                        days: updatedDays,
                                                                    };
                                                                });

                                                                // ✅ IMPORTANT: Reset the typedTitle for THIS day so suggestion doesn't show again
                                                                setTimeout(() => {
                                                                    setTypedTitle(prev => ({
                                                                        ...prev,
                                                                        [day.id]: false  // ← Set to FALSE instead of TRUE to hide suggestion
                                                                    }));
                                                                    setIsAISuggestionApplying(false);
                                                                }, 300);
                                                            }}
                                                        />
                                                    )}
                                                    {/* Descriptions Section */}
                                                    <div className="space-y-3">
                                                        <label className="block text-sm sm:text-base font-semibold text-card-foreground">
                                                            Descriptions
                                                        </label>

                                                        {currentDay.descriptions.map((desc, descIndex) => (
                                                            <div
                                                                key={`${currentDay.id}-desc-${descIndex}`}
                                                                className="border border-gray-300 rounded-xl p-3 space-y-3 bg-card bg-gray-50"
                                                            >
                                                                <div className="flex flex-col sm:flex-row gap-3 items-start">
                                                                    <div className="flex-1 w-full">
                                                                        <div className="ql-container ql-snow rounded-lg">
                                                                            <RichTextEditor
                                                                                value={itineraryData.days.find(d => d.id === currentDay.id)?.descriptions[descIndex] || ""}
                                                                                onChange={(value) => handleDescriptionChange(currentDay.id, descIndex, value)}
                                                                                className="flex-1 min-h-[150px] max-h-[300px] overflow-y-auto rounded-lg"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => removeDayField(currentDay.id, "descriptions", descIndex)}
                                                                        className="text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium self-start px-2"
                                                                        disabled={currentDay.descriptions.length === 1}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button
                                                            onClick={() => addDayField(day.id, "descriptions")}
                                                            className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                                                        >
                                                            Add Description
                                                        </button>
                                                    </div>

                                                    {/* Locations Section */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm sm:text-base font-semibold text-card-foreground">Locations</label>
                                                        {day.locations.map((location, index) => (
                                                            <div key={index} className="flex flex-col sm:flex-row gap-2">
                                                                <select
                                                                    value={location}
                                                                    onChange={(e) => updateDay(day.id, "locations", e.target.value, index)}
                                                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                                >
                                                                    <option value="">Select Location</option>
                                                                    {locations.map((loc) => (
                                                                        <option key={loc._id} value={loc.name}>
                                                                            {loc.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => removeDayField(day.id, "locations", index)}
                                                                    className="max-h-[40px] text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium px-2"
                                                                    disabled={day.locations.length === 1}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => addDayField(day.id, "locations")}
                                                            className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                                                        >
                                                            Add Location
                                                        </button>
                                                    </div>

                                                    {/* Images Section */}
                                                    <div className="space-y-3">
                                                        <label className="block text-xs sm:text-sm font-semibold text-gray-800">
                                                            Day Images
                                                        </label>
                                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                                            {day.images.map((img, index) => (
                                                                <div key={index} className="relative group w-20 sm:w-24 flex flex-col">
                                                                    <div className="relative w-full h-20 sm:h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 group-hover:border-gray-300 transition-colors">
                                                                        {img ? (
                                                                            <FastLazyImage
                                                                                src={`https://apitour.rajasthantouring.in${img}`}
                                                                                alt={`Day ${day.id} - Image ${index + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />

                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <div className="text-xs text-gray-400">No image</div>
                                                                            </div>
                                                                        )}

                                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                            <div className="flex gap-2">
                                                                                <label className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 cursor-pointer transition-colors">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) handleUploadDayImage(file, day.id, index);
                                                                                        }}
                                                                                        className="hidden"
                                                                                    />
                                                                                    <Upload className="w-4 h-4 text-gray-700" />
                                                                                </label>

                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newDays = itineraryData.days.map(d =>
                                                                                            d.id === day.id ? { ...d, images: d.images.filter((_, i) => i !== index) } : d
                                                                                        );
                                                                                        setItineraryData({ ...itineraryData, days: newDays });
                                                                                    }}
                                                                                    className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 transition-colors"
                                                                                    title="Remove image"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <div className="w-20 sm:w-24 flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                                                                <label className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-gray-600 transition-colors">
                                                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                                                                        <Plus className="w-4 h-4 text-gray-400" />
                                                                    </div>
                                                                    <span>Add Image</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleUploadDayImage(file, day.id, null);
                                                                        }}
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>


                                                </div>
                                            )


                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={saveNewItinerary}
                                        disabled={loadings}
                                        className="px-4 sm:px-6 py-3 mb-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loadings ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                </svg>
                                                <span>Save New Itinerary</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Package Pricing - IMPROVED: Added note for auto-fill and 20% booking */}
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                                <IndianRupee className="w-4 h-4" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Package Pricing</h2>
                                        </div>
                                        <div className="border border-gray-300 rounded-xl p-2 sm:p-3 shadow-sm space-y-3 bg-white">
                                            <h4 className="text-sm sm:text-base font-semibold text-muted-foreground mb-2">Select Categories (Max 2)</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                                                {categories.map((cat) => {
                                                    const catName = cat.name.toLowerCase()
                                                    const isSelected = selectedCategories.includes(catName)
                                                    return (
                                                        <button
                                                            key={cat._id}
                                                            onClick={() => toggleCategory(catName)}
                                                            className={`p-2 rounded-lg border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'} transition-all text-xs sm:text-sm`}
                                                            disabled={selectedCategories.length >= 2 && !isSelected}
                                                        >
                                                            <span className="font-semibold">{cat.name}</span>
                                                            {isSelected && <span className="ml-1">✓</span>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            {selectedCategories.map((category) => (
                                                <div key={category} className="border-t pt-3">
                                                    <h5 className="text-xs sm:text-sm inline-flex bg-blue-200 px-2 py-1 rounded-2xl font-semibold mb-2 capitalize">For {category}</h5>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Package Price (Auto-filled from Itinerary)</label>
                                                            <input
                                                                type="text"
                                                                pattern="[0-9]*"
                                                                inputMode="numeric"
                                                                value={itineraryData.pricing?.[category] || ""}
                                                                onChange={(e) => updatePricing(category, e.target.value)}
                                                                onKeyDown={handleNumericInput}
                                                                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                                placeholder="Enter price"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Auto-filled from selected itinerary</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Discount Price (Optional)</label>
                                                            <input
                                                                type="text"
                                                                pattern="[0-9]*"
                                                                inputMode="numeric"
                                                                value={itineraryData.offers?.[category] === "" ? "" : (itineraryData.offers?.[category] ?? "")}
                                                                onChange={(e) => updateOffer(category, e.target.value)}
                                                                onKeyDown={handleNumericInput}
                                                                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                                placeholder="Enter Discount Price"
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* NEW: Festival Offer Section - Applies to all selected categories */}
                                    {/* <div className="border border-gray-300 rounded-xl p-2 sm:p-3 shadow-sm space-y-3 bg-yellow-50">
                                            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                                                <Percent className="w-4 h-4 text-yellow-600" />
                                                Festival Offer (Applies to All Categories)
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Offer Name</label>
                                                    <input
                                                        type="text"
                                                        value={itineraryData.festivalOffer?.name || ""}
                                                        onChange={(e) => updateFestivalOfferName(e.target.value)}
                                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                        placeholder="e.g., Diwali Special"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Percentage (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                        value={itineraryData.festivalOffer?.value || ""}
                                                        onChange={(e) => updateFestivalOfferValue(e.target.value)}
                                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                        placeholder="e.g., 10"
                                                    />
                                                </div>
                                            </div>
                                            {itineraryData.festivalOffer?.value > 0 && (
                                                <p className="text-xs text-yellow-700 mt-2">
                                                    Applied: {itineraryData.festivalOffer.value}% off on total package price for all categories.
                                                </p>
                                            )}
                                        </div> */}

                                    {/* Booking Amount */}
                                    <div className="border border-gray-300 rounded-xl p-2 sm:p-3 shadow-sm space-y-2 bg-white">
                                        <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3">Booking Amount</h3>
                                        {selectedCategories.map((category) => (
                                            <div key={category} className="border-t pt-2 first:border-t-0">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">For {category}</label>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    value={itineraryData.bookingAmount?.[category] === "" ? "" : itineraryData.bookingAmount?.[category]}
                                                    onChange={(e) => updateBookingAmount(category, e.target.value)}
                                                    onKeyDown={handleNumericInput}
                                                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                    placeholder="5000"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* UPDATED: Vehicle Selection - Improved Responsive Design */}
                                    <div className="border border-gray-300 rounded-xl p-2 sm:p-3 shadow-sm space-y-3 bg-indigo-50">
                                        <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                                            <CarFront className="w-4 h-4 text-indigo-600" />
                                            Vehicle Selection
                                        </h3>
                                        <div className="space-y-3">
                                            {[...Array(1)].map((_, slotIndex) => {
                                                const currentVehicles = itineraryData.vehicle || [];
                                                const isSlotUsed = currentVehicles.length > slotIndex;
                                                return (
                                                    <div key={slotIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                                        <select
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                            value={isSlotUsed ? currentVehicles[slotIndex]._id : ""}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    addVehicle(e.target.value);
                                                                }
                                                            }}
                                                            disabled={currentVehicles.length >= 2}
                                                        >
                                                            <option value="">Select Vehicle </option>
                                                            {vehicles.map((v) => (
                                                                <option key={v._id} value={v._id}>
                                                                    {v.make} {v.model}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isSlotUsed && (
                                                            <button
                                                                onClick={() => removeVehicle(currentVehicles[slotIndex]._id)}
                                                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-xs font-medium flex items-center gap-1"
                                                            >
                                                                <Trash2 size={14} />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {itineraryData.vehicle.length > 0 && (
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {itineraryData.vehicle.map((vehicle, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-indigo-100 rounded-lg border border-indigo-200">
                                                        <span className="text-sm font-medium text-indigo-800">
                                                            {vehicle.make} {vehicle.model}
                                                        </span>
                                                        <button
                                                            onClick={() => removeVehicle(vehicle._id)}
                                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Highlight Price - FIXED: Real-time user input, no auto-fill */}
                                    <div className="border border-gray-300 rounded-xl p-2 sm:p-3 shadow-sm space-y-2 bg-white">
                                        <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3">Final Price</h3>
                                        {selectedCategories.map((category) => (
                                            <div key={category} className="border-t pt-2 first:border-t-0">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">For {category}</label>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    value={itineraryData.highlightPrice?.[category] === "" ? "" : itineraryData.highlightPrice?.[category]}
                                                    onChange={(e) => updateHighlightPrice(category, e.target.value)}
                                                    onKeyDown={handleNumericInput}
                                                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                    placeholder="Enter highlight price" // FIXED: User-defined
                                                />
                                            </div>
                                        ))}
                                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="priceType"
                                                    value="perPerson"
                                                    checked={itineraryData.priceType === "perPerson"}
                                                    onChange={() => updatePriceType("perPerson")}
                                                    className="h-4 w-4 text-primary focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span className="text-sm sm:text-base text-muted-foreground">Per Person</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="priceType"
                                                    value="Whole Group/Family"
                                                    checked={itineraryData.priceType === "Whole Group/Family"}
                                                    onChange={() => updatePriceType("Whole Group/Family")}
                                                    className="h-4 w-4 text-primary focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span className="text-sm sm:text-base text-muted-foreground">Whole Group/Family</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* UPDATED: Hotels Selection - Improved Responsive Design with Cards */}
                                    {selectedCategories.map((category) => (
                                        <div key={category} className="border border-gray-300 rounded-xl p-2 sm:p-3 mb-6 shadow-sm space-y-3 bg-gray-50">
                                            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                                                <Moon className="w-4 h-4 text-gray-600" />
                                                Hotels for {category.charAt(0).toUpperCase() + category.slice(1)} Category
                                            </h3>
                                            <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Hotel Category</label>
                                                <select
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                                                    value={category}
                                                    disabled
                                                >
                                                    {categories.map((cat) => (
                                                        <option key={cat._id} value={cat.name.toLowerCase()}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {itineraryData.days.map((day) => {


                                                const isDayHotelsEnabled = itineraryData.hotelSelectionDays?.[category]?.[day.id] !== true;
                                                const isStayOnly = itineraryData.stayOnlyDays?.[category]?.[day.id] === true;

                                                const validLocations = day.locations?.filter(
                                                    (location) => location?.toLowerCase() !== "departure"
                                                );

                                                if (!validLocations || validLocations.length === 0) {
                                                    return null;
                                                }

                                                return (
                                                    <div key={day.id} className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                        {/* Day Header with Checkboxes */}
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                                                            <div className="flex items-center gap-3">

                                                                <label
                                                                    htmlFor={`day-${category}-${day.id}`}
                                                                    className="text-sm bg-blue-900 inline-flex px-2 text-white py-0.5 rounded-full font-semibold cursor-pointer"
                                                                >
                                                                    Night - {String(day.id).padStart(2, "0")}
                                                                </label>
                                                            </div>

                                                            {/* NEW: Stay Only Checkbox */}
                                                            <div className="flex items-center gap-3 ml-0 sm:ml-auto">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`stay-only-${category}-${day.id}`}
                                                                    checked={isStayOnly}
                                                                    onChange={(e) => {
                                                                        handleDayStayToggle(category, day.id, e.target.checked);

                                                                        // अगर stay-only enable किया तो meals clear करो
                                                                        if (e.target.checked) {
                                                                            setHotelSelections(prev => {
                                                                                const newSelections = { ...prev };
                                                                                if (newSelections[category]?.[day.id]) {
                                                                                    delete newSelections[category][day.id];
                                                                                }
                                                                                return newSelections;
                                                                            });

                                                                            setItineraryData(prev => {
                                                                                const newData = { ...prev };
                                                                                const newHotels = { ...newData.hotels };
                                                                                if (newHotels[category]?.[day.id]) {
                                                                                    delete newHotels[category][day.id];
                                                                                }
                                                                                return { ...newData, hotels: newHotels };
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="w-3 h-3 text-orange-600 accent-green-600 rounded focus:ring-2"
                                                                />
                                                                <label
                                                                    htmlFor={`stay-only-${category}-${day.id}`}
                                                                    className="text-sm font-medium text-blue-700 cursor-pointer flex items-center gap-2"
                                                                >
                                                                    {/* <Moon size={16} className="text-orange-600" /> */}
                                                                    EPAI Plan Only
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Show Hotels Section ONLY if checkbox is NOT checked */}
                                                        {isDayHotelsEnabled ? (
                                                            isStayOnly ? (
                                                                // 🏨 STAY ONLY MODE - केवल होटल, कोई मील नहीं
                                                                <div className="space-y-4">
                                                                    <div className="p-4   rounded-lg">
                                                                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                            <Moon className="w-4 h-4" />
                                                                            Stay Only - Accommodation Only
                                                                        </h5>

                                                                        {validLocations.map((location, locIndex) => (
                                                                            <div
                                                                                key={`${day.id}-${location}-${locIndex}`}
                                                                                className="mb-4 p-3 rounded-lg bg-white border last:mb-0"
                                                                            >
                                                                                <h6 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                                                                                    <MapPin className="w-4 h-4 text-gray-600" /> {location}
                                                                                </h6>

                                                                                <div className="space-y-2">
                                                                                    <label className="text-sm font-semibold text-gray-900">
                                                                                        Hotel (Up to 2 options)
                                                                                    </label>
                                                                                    <div className="space-y-2">
                                                                                        {[...Array(2)].map((_, slotIndex) => {
                                                                                            const currentHotels = normalizeHotelData(
                                                                                                hotelSelections[category]?.[day.id]?.[location]?.stayOnly
                                                                                            );
                                                                                            const isSlotUsed = currentHotels.length > slotIndex;


                                                                                            return (
                                                                                                <div key={slotIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                                                                                    <select
                                                                                                        className="flex-1 px-2 py-1 border whitespace-normal max-w-[245px] break-wordsborder-gray-300 rounded text-xs bg-gray-50"
                                                                                                        value={isSlotUsed ? currentHotels[slotIndex] : ""}
                                                                                                        onChange={(e) => {
                                                                                                            if (e.target.value) {
                                                                                                                addHotelToMeal(category, day.id, location, "stayOnly", e.target.value);
                                                                                                            }
                                                                                                        }}
                                                                                                        disabled={currentHotels.length >= 2}
                                                                                                    >
                                                                                                        <option value="">Select Hotel {slotIndex + 1}</option>
                                                                                                        {getFilteredHotels(category, location, day.id, "stayOnly").map((hotel) => (

                                                                                                            <option key={hotel._id} value={hotel._id}>
                                                                                                                {hotel.name} - {hotel.rating}★ - {hotel.categoryId?.name}
                                                                                                            </option>
                                                                                                        ))}
                                                                                                    </select>
                                                                                                    {/* {isSlotUsed && (


                                                                                                        <button
                                                                                                            onClick={() => removeHotelFromMeal(
                                                                                                                category,
                                                                                                                day.id,
                                                                                                                location,
                                                                                                                "stayOnly",
                                                                                                                currentHotels[slotIndex]
                                                                                                            )}
                                                                                                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-all"
                                                                                                        >
                                                                                                            <Trash2 size={12} />
                                                                                                        </button>
                                                                                                    )} */}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>

                                                                                    {normalizeHotelData(
                                                                                        hotelSelections[category]?.[day.id]?.[location]?.stayOnly
                                                                                    ).length > 0 && (
                                                                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                                {normalizeHotelData(
                                                                                                    hotelSelections[category][day.id][location].stayOnly
                                                                                                ).map((hotelId, idx) => {
                                                                                                    const hotel = getHotelById(hotelId);
                                                                                                    const isOpen = selectedHotelInfo?._id === hotel._id;
                                                                                                    return (
                                                                                                        <div>
                                                                                                            <div key={idx} className="flex items-center gap-2 p-2 bg-orange-100 rounded border border-orange-200">
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-8 h-8 object-cover rounded"
                                                                                                                />
                                                                                                                <span className="text-xs flex-1 font-medium">{hotel.name}</span>

                                                                                                                <button
                                                                                                                    onClick={() => setSelectedHotelInfo(hotel)}
                                                                                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                                                                                                                    title="View hotel details and price"
                                                                                                                >
                                                                                                                    <Info size={14} className="stroke-2" />
                                                                                                                </button>

                                                                                                                <button
                                                                                                                    onClick={() => removeHotelFromMeal(
                                                                                                                        category,
                                                                                                                        day.id,
                                                                                                                        location,
                                                                                                                        "stayOnly",
                                                                                                                        hotelId
                                                                                                                    )}
                                                                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                                                                >
                                                                                                                    <Trash2 size={14} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                            {isOpen && (
                                                                                                                <div className="mt-1 animate-in slide-in-from-top duration-300">
                                                                                                                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                                                                                                        {/* Header */}
                                                                                                                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2  flex justify-end items-center">

                                                                                                                            <button
                                                                                                                                onClick={() => setSelectedHotelInfo(null)}
                                                                                                                                className="hover:bg-white/20  rounded-full transition-all"
                                                                                                                            >
                                                                                                                                <X size={18} strokeWidth={2.5} />
                                                                                                                            </button>
                                                                                                                        </div>

                                                                                                                        {/* Price Description Body */}
                                                                                                                        <div className="p-1 bg-gray-50">
                                                                                                                            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-medium">
                                                                                                                                {hotel.price || "No pricing details available."}
                                                                                                                            </p>
                                                                                                                        </div>


                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}

                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // 🍽️ NORMAL MODE - सभी Meals के साथ
                                                                <div className="space-y-4">
                                                                    {validLocations.map((location, locIndex) => (
                                                                        <div
                                                                            key={`${day.id}-${location}-${locIndex}`}
                                                                            className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100"
                                                                        >
                                                                            <h5 className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
                                                                                <MapPin className="w-4 h-4 text-blue-600" /> {location}
                                                                            </h5>

                                                                            {/* Breakfast */}
                                                                            <div className="space-y-2 mb-4">
                                                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                                                    <Coffee className="w-4 h-4 text-yellow-600" /> Breakfast Hotel (Up to 2 options)
                                                                                </label>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                    {[...Array(2)].map((_, slotIndex) => {
                                                                                        const currentHotels = normalizeHotelData(
                                                                                            hotelSelections[category]?.[day.id]?.[location]?.breakfast
                                                                                        );
                                                                                        const isSlotUsed = currentHotels.length > slotIndex;
                                                                                        return (
                                                                                            <div key={slotIndex} className="flex items-center overflow-hidden gap-2 p-2 bg-white rounded border">
                                                                                                <select
                                                                                                    className="flex-1 px-2 py-1 whitespace-normal break-words border max-w-[245px] border-gray-300 rounded text-xs bg-gray-50 "
                                                                                                    value={isSlotUsed ? currentHotels[slotIndex] : ""}
                                                                                                    onChange={(e) => {
                                                                                                        if (e.target.value) {
                                                                                                            addHotelToMeal(category, day.id, location, "breakfast", e.target.value);
                                                                                                        }
                                                                                                    }}
                                                                                                    disabled={currentHotels.length >= 2}
                                                                                                >
                                                                                                    <option value="">Breakfast Hotel {slotIndex + 1}</option>
                                                                                                    {getFilteredHotels(category, location, day.id, "breakfast").map((hotel) => (
                                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                                            {hotel.name} - {hotel.rating}★ - {hotel.categoryId?.name}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                {/* {isSlotUsed && (
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            removeHotelFromMeal(category, day.id, location, "breakfast", currentHotels[slotIndex])
                                                                                                        }
                                                                                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-all"
                                                                                                    >
                                                                                                        <Trash2 size={12} />
                                                                                                    </button>
                                                                                                )} */}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                {normalizeHotelData(hotelSelections[category]?.[day.id]?.[location]?.breakfast).length >
                                                                                    0 && (
                                                                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                            {normalizeHotelData(hotelSelections[category][day.id][location].breakfast).map(
                                                                                                (hotelId, idx) => {
                                                                                                    const hotel = getHotelById(hotelId);
                                                                                                    const isOpen = selectedHotelInfo?._id === hotel._id;
                                                                                                    return (
                                                                                                        <div>

                                                                                                            <div
                                                                                                                key={idx}
                                                                                                                className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200"
                                                                                                            >
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-8 h-8 object-cover rounded"
                                                                                                                />
                                                                                                                <span className="text-xs flex-1 font-medium">{hotel.name}</span>
                                                                                                                <button
                                                                                                                    onClick={() => setSelectedHotelInfo(hotel)}
                                                                                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                                                                                                                    title="View hotel details and price"
                                                                                                                >
                                                                                                                    <Info size={14} className="stroke-2" />
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() =>
                                                                                                                        removeHotelFromMeal(category, day.id, location, "breakfast", hotelId)
                                                                                                                    }
                                                                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                                                                >
                                                                                                                    <Trash2 size={14} />
                                                                                                                </button>
                                                                                                            </div>

                                                                                                            {isOpen && (
                                                                                                                <div className="mt-1 animate-in slide-in-from-top duration-300">
                                                                                                                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                                                                                                        {/* Header */}
                                                                                                                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2  flex justify-end items-center">

                                                                                                                            <button
                                                                                                                                onClick={() => setSelectedHotelInfo(null)}
                                                                                                                                className="hover:bg-white/20  rounded-full transition-all"
                                                                                                                            >
                                                                                                                                <X size={18} strokeWidth={2.5} />
                                                                                                                            </button>
                                                                                                                        </div>

                                                                                                                        {/* Price Description Body */}
                                                                                                                        <div className="p-1 bg-gray-50">
                                                                                                                            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-medium">
                                                                                                                                {hotel.price || "No pricing details available."}
                                                                                                                            </p>
                                                                                                                        </div>


                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                    );
                                                                                                }
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                            </div>

                                                                            {/* Lunch */}
                                                                            <div className="space-y-2 mb-4">
                                                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                                                    <CoffeeIcon className="w-4 h-4 text-green-600" /> Lunch Hotel (Up to 2 options)
                                                                                </label>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                    {[...Array(2)].map((_, slotIndex) => {
                                                                                        const currentHotels = normalizeHotelData(
                                                                                            hotelSelections[category]?.[day.id]?.[location]?.lunch
                                                                                        );
                                                                                        const isSlotUsed = currentHotels.length > slotIndex;
                                                                                        return (
                                                                                            <div key={slotIndex} className="flex items-center overflow-hidden gap-2 p-2 bg-white rounded border">
                                                                                                <select
                                                                                                    className="flex-1 px-2 py-1 whitespace-normal break-words border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all overflow-hidden max-w-[245px] bg-gray-50"
                                                                                                    value={isSlotUsed ? currentHotels[slotIndex] : ""}
                                                                                                    onChange={(e) => {
                                                                                                        if (e.target.value) {
                                                                                                            addHotelToMeal(category, day.id, location, "lunch", e.target.value);
                                                                                                        }
                                                                                                    }}
                                                                                                    disabled={currentHotels.length >= 2}
                                                                                                >
                                                                                                    <option value="">Lunch Hotel {slotIndex + 1}</option>
                                                                                                    {getFilteredHotels(category, location, day.id, "lunch").map((hotel) => (
                                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                                            {hotel.name} - {hotel.rating}★ - {hotel.categoryId?.name}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                {/* {isSlotUsed && (
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            removeHotelFromMeal(category, day.id, location, "lunch", currentHotels[slotIndex])
                                                                                                        }
                                                                                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-all"
                                                                                                    >
                                                                                                        <Trash2 size={12} />
                                                                                                    </button>
                                                                                                )} */}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                {normalizeHotelData(hotelSelections[category]?.[day.id]?.[location]?.lunch).length > 0 && (
                                                                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                        {normalizeHotelData(hotelSelections[category][day.id][location].lunch).map(
                                                                                            (hotelId, idx) => {
                                                                                                const hotel = getHotelById(hotelId);
                                                                                                const isOpen = selectedHotelInfo?._id === hotel._id;
                                                                                                return (

                                                                                                    <div>
                                                                                                        <div
                                                                                                            key={idx}
                                                                                                            className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200"
                                                                                                        >
                                                                                                            <img
                                                                                                                src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                alt={hotel.name}
                                                                                                                className="w-8 h-8 object-cover rounded"
                                                                                                            />
                                                                                                            <span className="text-xs flex-1 font-medium">{hotel.name}</span>
                                                                                                            <button
                                                                                                                onClick={() => setSelectedHotelInfo(hotel)}
                                                                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                                                                                                                title="View hotel details and price"
                                                                                                            >
                                                                                                                <Info size={14} className="stroke-2" />
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() =>
                                                                                                                    removeHotelFromMeal(category, day.id, location, "lunch", hotelId)
                                                                                                                }
                                                                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                                                                            >
                                                                                                                <Trash2 size={14} />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                        {isOpen && (
                                                                                                            <div className="mt-1 animate-in slide-in-from-top duration-300">
                                                                                                                <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                                                                                                    {/* Header */}
                                                                                                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2  flex justify-end items-center">

                                                                                                                        <button
                                                                                                                            onClick={() => setSelectedHotelInfo(null)}
                                                                                                                            className="hover:bg-white/20  rounded-full transition-all"
                                                                                                                        >
                                                                                                                            <X size={18} strokeWidth={2.5} />
                                                                                                                        </button>
                                                                                                                    </div>

                                                                                                                    {/* Price Description Body */}
                                                                                                                    <div className="p-1 bg-gray-50">
                                                                                                                        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-medium">
                                                                                                                            {hotel.price || "No pricing details available."}
                                                                                                                        </p>
                                                                                                                    </div>


                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}


                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Dinner */}
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                                                    <Coffee className="w-4 h-4 text-red-600" /> Dinner Hotel (Up to 2 options)
                                                                                </label>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                    {[...Array(2)].map((_, slotIndex) => {
                                                                                        const currentHotels = normalizeHotelData(
                                                                                            hotelSelections[category]?.[day.id]?.[location]?.dinner
                                                                                        );
                                                                                        const isSlotUsed = currentHotels.length > slotIndex;
                                                                                        return (
                                                                                            <div key={slotIndex} className="flex items-center overflow-hidden gap-2 p-2 bg-white rounded border">
                                                                                                <select
                                                                                                    className="flex-1 px-2 py-1 border whitespace-normal break-words border-gray-300 rounded text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 max-w-[245px]"
                                                                                                    value={isSlotUsed ? currentHotels[slotIndex] : ""}
                                                                                                    onChange={(e) => {
                                                                                                        if (e.target.value) {
                                                                                                            addHotelToMeal(category, day.id, location, "dinner", e.target.value);
                                                                                                        }
                                                                                                    }}
                                                                                                    disabled={currentHotels.length >= 2}
                                                                                                >
                                                                                                    <option value="">Dinner Hotel {slotIndex + 1}</option>
                                                                                                    {getFilteredHotels(category, location, day.id, "dinner").map((hotel) => (
                                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                                            {hotel.name} - {hotel.rating}★ - {hotel.categoryId?.name}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                {/* {isSlotUsed && (

                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            removeHotelFromMeal(category, day.id, location, "dinner", currentHotels[slotIndex])
                                                                                                        }
                                                                                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-all"
                                                                                                    >
                                                                                                        <Trash2 size={12} />
                                                                                                    </button>
                                                                                                )} */}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                {normalizeHotelData(hotelSelections[category]?.[day.id]?.[location]?.dinner).length > 0 && (
                                                                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                        {normalizeHotelData(hotelSelections[category][day.id][location].dinner).map(
                                                                                            (hotelId, idx) => {
                                                                                                const hotel = getHotelById(hotelId);
                                                                                                const isOpen = selectedHotelInfo?._id === hotel._id;
                                                                                                return (

                                                                                                    <div>
                                                                                                        <div
                                                                                                            key={idx}
                                                                                                            className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200"
                                                                                                        >
                                                                                                            <img
                                                                                                                src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                alt={hotel.name}
                                                                                                                className="w-8 h-8 object-cover rounded"
                                                                                                            />
                                                                                                            <span className="text-xs flex-1 font-medium">{hotel.name}</span>

                                                                                                            <button
                                                                                                                onClick={() => setSelectedHotelInfo(hotel)}
                                                                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                                                                                                                title="View hotel details and price"
                                                                                                            >
                                                                                                                <Info size={14} className="stroke-2" />
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() =>
                                                                                                                    removeHotelFromMeal(category, day.id, location, "dinner", hotelId)
                                                                                                                }
                                                                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                                                                            >
                                                                                                                <Trash2 size={14} />
                                                                                                            </button>
                                                                                                        </div>

                                                                                                        {isOpen && (
                                                                                                            <div className="mt-1 animate-in slide-in-from-top duration-300">
                                                                                                                <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                                                                                                                    {/* Header */}
                                                                                                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2  flex justify-end items-center">

                                                                                                                        <button
                                                                                                                            onClick={() => setSelectedHotelInfo(null)}
                                                                                                                            className="hover:bg-white/20  rounded-full transition-all"
                                                                                                                        >
                                                                                                                            <X size={18} strokeWidth={2.5} />
                                                                                                                        </button>
                                                                                                                    </div>

                                                                                                                    {/* Price Description Body */}
                                                                                                                    <div className="p-1 bg-gray-50">
                                                                                                                        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-medium">
                                                                                                                            {hotel.price || "No pricing details available."}
                                                                                                                        </p>
                                                                                                                    </div>


                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}

                                                                                                    </div>

                                                                                                );
                                                                                            }
                                                                                        )}

                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )
                                                        ) : (
                                                            // 🔴 Show warning message when checkbox is unchecked
                                                            <div className="p-4 bg-gray-50 border  rounded-lg flex items-start gap-3">

                                                                <p className="text-sm text-gray-800 font-medium">
                                                                    No hotels will be booked for this day. Guest will arrange their own accommodation.
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="grid my-3 grid-cols-[auto_1fr] gap-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`day-${category}-${day.id}`}
                                                                checked={itineraryData.hotelSelectionDays?.[category]?.[day.id] === true}
                                                                onChange={(e) => {
                                                                    handleDayHotelToggle(category, day.id, e.target.checked);
                                                                }}
                                                                className="w-3 h-3 mt-1 accent-green-600"
                                                            />

                                                            <p className="text-sm w-full ">
                                                                If guest has already booked hotel by own or self
                                                                then please click on this checkbox
                                                            </p>
                                                        </div>


                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Special Inclusions Selection */}
                            <div className="border border-gray-300 rounded-xl p-4 sm:p-6 mb-6 shadow-sm space-y-4 bg-white">
                                <h3 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Optional Inclusions
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Select additional inclusions for this booking:
                                    {isEditMode && selectedSpecialInclusions.length > 0 && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {selectedSpecialInclusions.length} selected
                                        </span>
                                    )}
                                </p>
                                <div className="space-y-3">
                                    {inclusions
                                        .filter(inc => SPECIAL_INCLUSION_TITLES.some(special =>
                                            inc.title.toLowerCase().includes(special.toLowerCase())
                                        ))
                                        .map((inc, index) => {
                                            const isChecked = selectedSpecialInclusions.includes(inc.title);

                                            return (
                                                <label
                                                    key={index}
                                                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border ${isChecked
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                // ✅ CHECK: Add to selectedSpecialInclusions
                                                                setSelectedSpecialInclusions([
                                                                    ...selectedSpecialInclusions,
                                                                    inc.title
                                                                ]);

                                                                // और bookingInclusions में भी add करो
                                                                setBookingInclusions([
                                                                    ...bookingInclusions,
                                                                    inc
                                                                ]);

                                                                console.log("✅ Selected:", inc.title);
                                                            } else {
                                                                // ❌ UNCHECK: Remove from selectedSpecialInclusions
                                                                const updatedSpecial = selectedSpecialInclusions.filter(t => t !== inc.title);
                                                                setSelectedSpecialInclusions(updatedSpecial);

                                                                // और bookingInclusions से भी remove करो
                                                                const updatedBooking = bookingInclusions.filter(item => item.title !== inc.title);
                                                                setBookingInclusions(updatedBooking);

                                                                console.log("❌ Unselected:", inc.title);
                                                            }
                                                        }}
                                                        className="mt-1 h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-500 rounded accent-green-600"
                                                    />
                                                    <div className="flex-1">
                                                        <strong className={`text-sm font-semibold ${isChecked ? 'text-green-700' : 'text-gray-700'
                                                            }`}>
                                                            {inc.title}
                                                            {isChecked && (
                                                                <span className="ml-2 text-green-600 text-xs">✓ Added</span>
                                                            )}
                                                        </strong>
                                                        <p className="text-xs text-gray-600 mt-1">{inc.description}</p>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNote(!showNote)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg"
                            >
                                {showNote ? "Hide Note" : "Add Note"}
                            </button>

                            {showNote && (
                                <div className="mt-3">
                                    <textarea
                                        rows={3}
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Write your note..."
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    ></textarea>
                                </div>
                            )}




                            <div className="flex justify-center sm:justify-end pt-4">
                                <button
                                    className="px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                                    onClick={() => setStep("preview")}
                                >
                                    Preview & Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        )
    }

    if (step === "preview") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card max-w-7xl mx-auto w-full py-4 sm:py-8">
                <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8">
                    <div className="rounded-2xl overflow-hidden border">
                        <div className="bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground px-4 sm:px-8 py-4 sm:py-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold">Booking Preview</h1>
                                        <p className="text-primary-foreground/80 text-sm">Review your customized itinerary</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                                    <button
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground rounded-xl hover:bg-primary-foreground/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-primary-foreground/20 text-xs sm:text-sm flex-1 sm:flex-none"
                                        onClick={() => setStep("itinerary-builder")}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span>Back</span>
                                    </button>
                                    <button
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-green-400 text-accent-foreground rounded-xl cursor-pointer hover:bg-green-200/90 transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm flex-1 sm:flex-none"
                                        onClick={sendWhatsAppMessage}
                                    >
                                        <FontAwesomeIcon icon={faWhatsapp} />
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-200 text-accent-foreground rounded-xl hover:bg-blue-200/90 transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm flex-1 sm:flex-none"
                                        onClick={handlePrint}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H3a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>Generate PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div ref={componentRef} className="p-4 sm:p-8" id="itinerary-preview">
                            <div className="relative bg-gradient-to-r from-primary to-accent rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-12 shadow-lg">
                                <div className="absolute inset-0 bg-black/20"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                                    alt="Destination"
                                    className="absolute inset-0 w-full h-48 sm:h-full object-cover mix-blend-overlay"
                                />
                                <div className="relative z-10 p-4 sm:p-12 text-primary-foreground">
                                    <div className="flex flex-col sm:flex-row justify-between items-start">
                                        <div className="flex-1 w-full">
                                            <div className="inline-block bg-blue-200 text-accent-foreground px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-sm">
                                                {calculateDuration(itineraryData)}
                                            </div>
                                            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                                                {itineraryData?.titles?.[0] || selectedItinerary?.titles?.[0] || "Travel Package"}
                                            </h1>
                                            <p className="text-xl sm:text-2xl opacity-90 mb-4 sm:mb-6 font-medium">
                                                {itineraryData?.days?.length || selectedItinerary?.days?.length || 0} Days Amazing Journey
                                            </p>
                                            <div className="space-y-4">
                                                {selectedCategories.map((category) => (
                                                    <div key={category} className="backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-primary-foreground/20">
                                                        <h3 className="text-lg sm:text-xl font-bold mb-4">Selected Package - {category}</h3>
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                            <p className="text-xs sm:text-sm opacity-80 capitalize">{itineraryData.priceType}</p>

                                                            <div className="text-left sm:text-right mt-2 sm:mt-0">
                                                                <span className="text-2xl sm:text-3xl font-bold">
                                                                    ₹{itineraryData.highlightPrice[category] || 0} {/* FIXED: Use user-input highlightPrice */}
                                                                </span>

                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Client Details and Package Summary - IMPROVED: Consistent card styling */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                                <div className="rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-300 bg-white">
                                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-card-foreground">Client Details</h2>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Name:</span>
                                            <span className="text-card-foreground">{clientDetails.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Email:</span>
                                            <span className="text-card-foreground">{clientDetails.email}</span>
                                        </div>
                                        {clientDetails.email2 && (
                                            <div className="flex justify-between text-sm sm:text-base">
                                                <span className="font-medium text-muted-foreground">Email 2:</span>
                                                <span className="text-card-foreground">{clientDetails.email2}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Phone:</span>
                                            <span className="text-card-foreground">{clientDetails.phone}</span>
                                        </div>
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Travel Date:</span>
                                            <span className="text-card-foreground">
                                                {new Date(itineraryData.date || clientDetails.travelDate)
                                                    .toISOString()
                                                    .split("T")[0]
                                                    .split("-")
                                                    .reverse()
                                                    .join("-")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Travelers:</span>
                                            <span className="text-card-foreground">{clientDetails.travelers}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-300 bg-white">
                                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-card-foreground">Package Summary</h2>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Duration:</span>
                                            <span className="text-card-foreground">{calculateDuration(itineraryData)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm sm:text-base">
                                            <span className="font-medium text-muted-foreground">Categories:</span>
                                            <span className="text-card-foreground">{selectedCategories.join(', ')}</span>
                                        </div>
                                        {/* NEW: Show Festival Offer in Summary */}
                                        {/* {itineraryData.festivalOffer?.value > 0 && (
                                                <div className="flex justify-between text-sm sm:text-base bg-yellow-50 p-2 rounded">
                                                    <span className="font-medium text-yellow-800">{itineraryData.festivalOffer.name}:</span>
                                                    <span className="text-yellow-800 font-semibold">{itineraryData.festivalOffer.value}% OFF</span>
                                                </div>
                                            )} */}
                                        {selectedCategories.map((category) => (
                                            <>
                                                <div key={category} className="flex justify-between text-sm sm:text-base">
                                                    <span className="font-medium text-muted-foreground">Base Price ({category}):</span>
                                                    <span className="text-card-foreground">₹{itineraryData.pricing[category] || 0}</span>
                                                </div>
                                                {itineraryData?.offers[category] > 0 && (
                                                    <div className="flex justify-between text-sm sm:text-base">
                                                        <span className="font-medium text-muted-foreground">Discount ({category}):</span>
                                                        <span className="text-green-600 font-semibold">
                                                            ₹{itineraryData.offers[category]}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        ))}

                                    </div>
                                </div>
                            </div>


                            {/* Itinerary - IMPROVED: Consistent timeline styling */}
                            <div className="mb-8 sm:mb-12">
                                <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4 sm:mb-6">
                                    Itinerary <span className="text-primary">{calculateDuration(itineraryData)} - Early Birds</span>
                                    {(itineraryData?.tourcode || selectedItinerary?.tourcode) && (
                                        <span className="ml-2 sm:ml-3 inline-block text-xs sm:text-sm text-muted-foreground">
                                            Code:{' '}
                                            <strong className="text-card-foreground">
                                                {itineraryData?.tourcode || selectedItinerary?.tourcode}
                                            </strong>
                                        </span>
                                    )}


                                </h2>
                                <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
                                    {(() => {
                                        if (!itineraryData?.days) return "";

                                        let allLocations = [];

                                        itineraryData.days.forEach(day => {
                                            const locs = (day.locations || []).filter(loc => loc !== "Departure");

                                            // Same day ke liye → last location hi lena
                                            if (locs.length > 0) {
                                                allLocations.push(locs[locs.length - 1]);
                                            }
                                        });

                                        // Count repeats across all days
                                        const counts = {};
                                        allLocations.forEach(loc => {
                                            counts[loc] = (counts[loc] || 0) + 1;
                                        });

                                        // Add (N) only if repeated
                                        const uniqueWithCount = Object.entries(counts).map(([loc, count]) =>
                                            count > 1 ? `${loc} -${count}N ` : ` ${loc} -${count}N `
                                        );

                                        return uniqueWithCount.join(" • ");
                                    })()}

                                </p>

                                <div className="space-y-6 sm:space-y-10">
                                    {itineraryData.days.map((day, index) => {
                                        const travelDate = new Date(clientDetails.travelDate);
                                        const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);

                                        return (
                                            <div key={day.id} className="relative">
                                                {index < itineraryData.days.length - 1 && (
                                                    <div className="absolute left-6 sm:left-9 top-20 w-0.5 h-full bg-border z-0"></div>
                                                )}
                                                <div className="flex gap-4 sm:gap-6">
                                                    <div className="flex flex-col items-center flex-shrink-0">
                                                        <div className="w-12 sm:w-14 h-12 sm:h-14 bg-green-500 text-primary-foreground rounded-full flex items-center justify-center font-bold text-base sm:text-lg z-10 shadow-md">
                                                            {day.id}
                                                        </div>
                                                        <div className="text-center mt-2 sm:mt-3">
                                                            <div className="text-base sm:text-lg font-semibold text-card-foreground">Day {day.id}</div>
                                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                                {dayDate.toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="rounded-2xl sm:rounded-3xl border border-gray-300 shadow-sm overflow-hidden bg-white">
                                                            <div className="flex flex-col sm:flex-row">
                                                                <div className="w-full sm:w-48 h-32 sm:h-48 flex items-center justify-center bg-gray-100">
                                                                    <div className="w-full sm:w-48 h-32 sm:h-48">
                                                                        <img
                                                                            src={
                                                                                day.images?.[0]?.startsWith("http")
                                                                                    ? day.images[0]
                                                                                    : `https://apitour.rajasthantouring.in${day.images?.[0]}` || "/majestic-mountain-vista.png"
                                                                            }
                                                                            alt={`Day ${day.id} destination`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 p-4 sm:p-6">
                                                                    <div className="inline-flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                                                                        <CarFront size={16} />
                                                                        <span className="text-base sm:text-lg text-muted-foreground font-medium">
                                                                            {itineraryData.vehicle.length > 0 ? (
                                                                                itineraryData.vehicle.map((v, i) => (
                                                                                    <span key={i}>
                                                                                        {` ${v.model} `}
                                                                                        {i < itineraryData.vehicle.length - 1 && ' / '}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                "Wagon R / Similar"
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-xl sm:text-2xl font-bold text-card-foreground mb-3 sm:mb-4">
                                                                        {day.titles?.[0] || `${day.locations} Sightseeing`}
                                                                    </h3>
                                                                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                                                                        {day.descriptions && day.descriptions.length > 0
                                                                            ? day.descriptions.map((desc, i) => (
                                                                                <div key={desc._id || i} className="mb-3">
                                                                                    {typeof desc === "string" ? (
                                                                                        <div
                                                                                            className="prose prose-lg max-w-none"
                                                                                            dangerouslySetInnerHTML={{ __html: desc }}
                                                                                        />
                                                                                    ) : desc ? (
                                                                                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: desc }} />
                                                                                    ) : null}
                                                                                </div>
                                                                            ))
                                                                            : `Explore the beautiful destinations in ${day.locations}. Experience the local culture, visit famous landmarks, and enjoy the scenic beauty.`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* UPDATED: Hotels Details - Improved Design with Cards */}
                            <div className="mb-8 sm:mb-12">
                                <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4 sm:mb-6">
                                    Hotels Details <span className="text-primary">{calculateDuration(itineraryData)}</span>
                                </h2>


                                <div className="space-y-6 sm:space-y-8">
                                    {itineraryData.days.map((day, index) => {
                                        if (!day.locations) return null;
                                        const travelDate = new Date(clientDetails.travelDate);
                                        const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);

                                        return (
                                            <div key={day.id} className="relative">
                                                {index < itineraryData.days.length - 1 && (
                                                    <div className="absolute left-6 sm:left-9 top-20 w-0.5 opacity-80 h-[98%] bg-border z-0"></div>
                                                )}
                                                <div className="flex gap-4 sm:gap-6">
                                                    <div className="flex flex-col items-center flex-shrink-0">
                                                        <div className="w-12 sm:w-14 h-12 sm:h-14 bg-green-500 text-primary-foreground rounded-full flex items-center justify-center font-bold text-base sm:text-lg z-10 shadow-md">
                                                            {day.id}
                                                        </div>
                                                        <div className="text-center mt-2 sm:mt-3">
                                                            <div className="text-base sm:text-lg font-semibold text-card-foreground">Day {day.id}</div>
                                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                                {dayDate.toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="rounded-2xl sm:rounded-3xl border border-gray-300 p-4 sm:p-6 shadow-sm bg-white">
                                                            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4 sm:mb-6">
                                                                {day.titles?.[0] || `Day ${day.id}`}
                                                            </h3>

                                                            {day.locations?.map((location, locIndex) => {
                                                                return (
                                                                    <div key={`${day.id}-${location}-${locIndex}`} className="mb-6 sm:mb-8 last:mb-0">
                                                                        <h4 className="text-base sm:text-lg font-medium text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                                                            <FontAwesomeIcon icon={faLocationArrow} className="text-green-900 mr-1 w-2 h-2" />
                                                                            {location}
                                                                        </h4>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            {selectedCategories.map((category) => {
                                                                                const isStayOnly = itineraryData.stayOnlyDays?.[category]?.[day.id] === true;
                                                                                const locationHotelsRaw = itineraryData.hotels?.[category]?.[day.id]?.[location] || {};

                                                                                const getMealOptions = (meal) => {
                                                                                    const rawData = locationHotelsRaw[meal];
                                                                                    if (!rawData) return [];

                                                                                    let dataArray = [];
                                                                                    if (Array.isArray(rawData)) {
                                                                                        dataArray = rawData;
                                                                                    } else if (rawData.options && Array.isArray(rawData.options)) {
                                                                                        dataArray = rawData.options;
                                                                                    }

                                                                                    return dataArray.map((item, idx) => {
                                                                                        if (typeof item === 'object' && item !== null) {
                                                                                            return {
                                                                                                ...item,
                                                                                                selected: idx === 0
                                                                                            };
                                                                                        }
                                                                                        return {
                                                                                            ...getHotelById(item),
                                                                                            id: item,
                                                                                            selected: idx === 0
                                                                                        };
                                                                                    });
                                                                                };

                                                                                if (isStayOnly) {
                                                                                    // 🏨 STAY ONLY MODE - केवल होटल
                                                                                    const stayOptions = getMealOptions('stayOnly');

                                                                                    return (
                                                                                        <div key={category} className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                                                            <h5 className="text-sm font-medium text-card-foreground capitalize">
                                                                                                {category} - Stay Only
                                                                                            </h5>

                                                                                            {stayOptions.length > 0 ? (
                                                                                                <div className="p-3 rounded-lg bg-white border border-orange-100">
                                                                                                    <span className="text-sm font-medium text-orange-900 block mb-2">
                                                                                                        🏨 Hotel Options
                                                                                                    </span>
                                                                                                    <div className="space-y-2">
                                                                                                        {stayOptions.map((hotel, idx) => (
                                                                                                            <div key={idx} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-12 h-10 object-cover rounded flex-shrink-0"
                                                                                                                />
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <div className="font-medium text-sm truncate">{hotel.name}</div>
                                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                                        {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-xs text-gray-500 italic">No hotels selected</div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                } else {
                                                                                    // 🍽️ NORMAL MODE - सभी Meals के साथ
                                                                                    const breakfastOptions = getMealOptions('breakfast');
                                                                                    const lunchOptions = getMealOptions('lunch');
                                                                                    const dinnerOptions = getMealOptions('dinner');

                                                                                    return (
                                                                                        <div key={category} className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                                                                                            <h5 className="text-sm font-medium text-card-foreground capitalize">For {category}</h5>

                                                                                            {/* Breakfast */}
                                                                                            {breakfastOptions.length > 0 && (
                                                                                                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                                                                                    <span className="text-base font-medium text-yellow-800 block mb-2">🍳 Breakfast</span>
                                                                                                    <div className="space-y-2">
                                                                                                        {breakfastOptions.map((hotel, idx) => (
                                                                                                            <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-12 h-10 object-cover rounded flex-shrink-0"
                                                                                                                />
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <div className="font-medium text-sm truncate">{hotel.name}</div>
                                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                                        {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Lunch */}
                                                                                            {lunchOptions.length > 0 && (
                                                                                                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                                                                                    <span className="text-base font-medium text-green-800 block mb-2">🍽️ Lunch</span>
                                                                                                    <div className="space-y-2">
                                                                                                        {lunchOptions.map((hotel, idx) => (
                                                                                                            <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-12 h-10 object-cover rounded flex-shrink-0"
                                                                                                                />
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <div className="font-medium text-sm truncate">{hotel.name}</div>
                                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                                        {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Dinner */}
                                                                                            {dinnerOptions.length > 0 && (
                                                                                                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                                                                                    <span className="text-base font-medium text-red-800 block mb-2">🍽️ Dinner</span>
                                                                                                    <div className="space-y-2">
                                                                                                        {dinnerOptions.map((hotel, idx) => (
                                                                                                            <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                                                                                                                <img
                                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image || ''}`}
                                                                                                                    alt={hotel.name}
                                                                                                                    className="w-12 h-10 object-cover rounded flex-shrink-0"
                                                                                                                />
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <div className="font-medium text-sm truncate">{hotel.name}</div>
                                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                                        {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* No meals selected */}
                                                                                            {breakfastOptions.length === 0 && lunchOptions.length === 0 && dinnerOptions.length === 0 && (
                                                                                                <div className="text-xs text-gray-500 italic">No meals selected</div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            </div>


                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                                <div className="lg:col-span-2">
                                    <div className="rounded-2xl sm:rounded-3xl border border-gray-300 overflow-hidden shadow-sm bg-white">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Inclusions Section - Editable */}
                                            <div className="flex-1 p-4 sm:p-8 bg-green-50 border-b lg:border-b-0 lg:border-r border-gray-300 relative">
                                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                    <h3 className="font-semibold text-green-800 flex items-center gap-2 text-base sm:text-lg">
                                                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Inclusions
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        {!editingInclusions ? (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingInclusions(true);
                                                                    setEditableInclusions(bookingInclusions.map(item => ({ ...item, images: [...(item.images || [])] })));
                                                                }}
                                                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveInclusions}
                                                                    disabled={isSubmitting}
                                                                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition disabled:opacity-50"
                                                                >
                                                                    {isSubmitting ? "Saving..." : "Save"}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingInclusions(false);
                                                                        setEditableInclusions(bookingInclusions.map(item => ({ ...item, images: [...(item.images || [])] })));
                                                                    }}
                                                                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingInclusions ? (
                                                    <div className="space-y-3">
                                                        {editableInclusions.map((item, index) => (
                                                            <div key={index} className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                                                                <input
                                                                    type="text"
                                                                    value={item.title}
                                                                    onChange={(e) => {
                                                                        const newArr = [...editableInclusions];
                                                                        newArr[index].title = e.target.value;
                                                                        setEditableInclusions(newArr);
                                                                    }}
                                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                                                                    placeholder={`Inclusion Title ${index + 1}`}
                                                                />
                                                                <textarea
                                                                    value={item.description}
                                                                    onChange={(e) => {
                                                                        const newArr = [...editableInclusions];
                                                                        newArr[index].description = e.target.value;
                                                                        setEditableInclusions(newArr);
                                                                    }}
                                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                                                                    placeholder={`Inclusion Description ${index + 1}`}
                                                                    rows={2}
                                                                />
                                                                {/* Current Images */}
                                                                {item.images && item.images.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <label className="block text-sm font-medium text-gray-700">Current Images:</label>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <div key={imgIndex} className="relative">
                                                                                    <img src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`Inclusion image ${imgIndex + 1}`} className="w-full h-20 object-cover rounded" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeImage(index, imgUrl, true)}
                                                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Upload New Images */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Images:</label>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        onChange={(e) => handleImageUpload(index, e.target.files, true)}
                                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newArr = editableInclusions.filter((_, i) => i !== index);
                                                                        setEditableInclusions(newArr.length > 0 ? newArr : [{ title: '', description: '', images: [] }]);
                                                                    }}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditableInclusions([...editableInclusions, { title: '', description: '', images: [] }])}
                                                            className="text-green-600 hover:text-green-800 font-medium text-sm transition"
                                                        >
                                                            + Add Inclusion
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {bookingInclusions.map((item, index) => (
                                                            <details key={index} className="group bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                                <summary className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition list-none">
                                                                    <span className="text-green-600 flex-shrink-0">•</span>
                                                                    <strong className="text-green-600 text-sm font-medium flex-1">{item.title}</strong>
                                                                    <svg className="ml-auto w-4 h-4 text-green-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                                                                    </svg>
                                                                </summary>
                                                                <div className="p-3 border-t border-gray-200">
                                                                    {item.images && item.images.length > 0 && (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <img key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <p className="text-gray-600 text-sm">{item.description}</p>
                                                                </div>
                                                            </details>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Exclusions Section - Editable */}
                                            <div className="flex-1 p-4 sm:p-8 bg-red-50 relative">
                                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                    <h3 className="font-semibold text-red-800 flex items-center gap-2 text-base sm:text-lg">
                                                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Exclusions
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        {!editingExclusions ? (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingExclusions(true);
                                                                    setEditableExclusions(bookingExclusions.map(item => ({ ...item, images: [...(item.images || [])] })));
                                                                }}
                                                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveExclusions}
                                                                    disabled={isSubmitting}
                                                                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition disabled:opacity-50"
                                                                >
                                                                    {isSubmitting ? "Saving..." : "Save"}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingExclusions(false);
                                                                        setEditableExclusions(bookingExclusions.map(item => ({ ...item, images: [...(item.images || [])] })));
                                                                    }}
                                                                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingExclusions ? (
                                                    <div className="space-y-3">
                                                        {editableExclusions.map((item, index) => (
                                                            <div key={index} className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                                                                <input
                                                                    type="text"
                                                                    value={item.title}
                                                                    onChange={(e) => {
                                                                        const newArr = [...editableExclusions];
                                                                        newArr[index].title = e.target.value;
                                                                        setEditableExclusions(newArr);
                                                                    }}
                                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                                                                    placeholder={`Exclusion Title ${index + 1}`}
                                                                />
                                                                <textarea
                                                                    value={item.description}
                                                                    onChange={(e) => {
                                                                        const newArr = [...editableExclusions];
                                                                        newArr[index].description = e.target.value;
                                                                        setEditableExclusions(newArr);
                                                                    }}
                                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                                                                    placeholder={`Exclusion Description ${index + 1}`}
                                                                    rows={2}
                                                                />
                                                                {/* Current Images */}
                                                                {item.images && item.images.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <label className="block text-sm font-medium text-gray-700">Current Images:</label>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <div key={imgIndex} className="relative">
                                                                                    <img src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`Exclusion image ${imgIndex + 1}`} className="w-full h-20 object-cover rounded" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeImage(index, imgUrl, false)}
                                                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Upload New Images */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Images:</label>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        onChange={(e) => handleImageUpload(index, e.target.files, false)}
                                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newArr = editableExclusions.filter((_, i) => i !== index);
                                                                        setEditableExclusions(newArr.length > 0 ? newArr : [{ title: '', description: '', images: [] }]);
                                                                    }}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditableExclusions([...editableExclusions, { title: '', description: '', images: [] }])}
                                                            className="text-red-600 hover:text-red-800 font-medium text-sm transition"
                                                        >
                                                            + Add Exclusion
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {bookingExclusions.map((item, index) => (
                                                            <details key={index} className="group bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                                <summary className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition list-none">
                                                                    <span className="text-red-600 flex-shrink-0">•</span>
                                                                    <strong className="text-red-600 text-sm font-medium flex-1">{item.title}</strong>
                                                                    <svg className="ml-auto w-4 h-4 text-red-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                                                                    </svg>
                                                                </summary>
                                                                <div className="p-3 border-t border-gray-200">
                                                                    {item.images && item.images.length > 0 && (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <img key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <p className="text-gray-600 text-sm">{item.description}</p>
                                                                </div>
                                                            </details>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-8 border-t border-gray-300 bg-gray-50">
                                            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                                                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Terms & Conditions
                                            </h3>
                                            <div className="space-y-3">
                                                {terms.map((item, index) => (
                                                    <details key={index} className="group bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                        <summary className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition list-none">
                                                            <span className="text-blue-600 flex-shrink-0">•</span>
                                                            <strong className="text-blue-600 text-sm font-medium flex-1">{item.title}</strong>
                                                            <svg className="ml-auto w-4 h-4 text-blue-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <img key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cancellation & Refund Policy - Display Only */}
                                        <div className="p-4 sm:p-8 border-t border-gray-300 bg-orange-50">
                                            <h3 className="font-semibold text-orange-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                                                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Cancellation & Refund Policy
                                            </h3>
                                            <div className="space-y-3">
                                                {cancellationAndRefundPolicy.map((item, index) => (
                                                    <details key={index} className="group bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                        <summary className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition list-none">
                                                            <span className="text-orange-600 flex-shrink-0">•</span>
                                                            <strong className="text-orange-600 text-sm font-medium flex-1">{item.title}</strong>
                                                            <svg className="ml-auto w-4 h-4 text-orange-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <img key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Policy - Display Only */}
                                        <div className="p-4 sm:p-8 border-t border-gray-300 bg-purple-50">
                                            <h3 className="font-semibold text-purple-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                                                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                                Payment Policy
                                            </h3>
                                            <div className="space-y-3">
                                                {travelRequirements.map((item, index) => (
                                                    <details key={index} className="group bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                        <summary className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition list-none">
                                                            <span className="text-purple-600 flex-shrink-0">•</span>
                                                            <strong className="text-purple-600 text-sm font-medium flex-1">{item.title}</strong>
                                                            <svg className="ml-auto w-4 h-4 text-purple-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <img key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="rounded-2xl sm:rounded-3xl border border-gray-300 p-4 sm:p-8 sticky top-4 shadow-sm bg-white">
                                        <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-card-foreground">Price Summary</h3>
                                        <div className="space-y-3 sm:space-y-4 text-base sm:text-lg">
                                            {clientDetails.adults || clientDetails.kids5to12 ? (
                                                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-300">
                                                    <span className="text-muted-foreground text-sm">
                                                        {clientDetails.adults || 0} Adults, {clientDetails.kids5to12 || 0} Kid (5-12 Years)
                                                    </span>
                                                </div>
                                            ) : null}

                                            {clientDetails.kidsBelow5 ? (
                                                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-300">
                                                    <span className="text-muted-foreground text-sm">
                                                        {clientDetails.kidsBelow5} Kid (Below 5 years)
                                                    </span>
                                                </div>
                                            ) : null}

                                            {clientDetails.rooms || clientDetails.extraBeds ? (
                                                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-300">
                                                    <span className="text-muted-foreground text-sm">
                                                        {clientDetails.rooms || 0} Room with {clientDetails.extraBeds || 0} Extra mattress
                                                    </span>
                                                </div>
                                            ) : null}

                                            {/* UPDATED: Category-wise price breakdown with Festival Offer */}
                                            {selectedCategories.map((category) => (
                                                <div key={category} className="pt-3 sm:pt-4 space-y-2 border-t border-gray-200">
                                                    <div className="flex justify-between text-sm text-muted-foreground">
                                                        <span className="capitalize font-medium">{category} Base Price</span>
                                                        <span>₹{itineraryData.pricing[category] || 0}</span>
                                                    </div>
                                                    {itineraryData.offers[category] > 0 && (
                                                        <div className="flex justify-between text-sm text-green-600">
                                                            <span className="capitalize">Discount ({category})</span>
                                                            <span>-₹{itineraryData.offers[category]}</span>
                                                        </div>
                                                    )}
                                                    {itineraryData.festivalOffer?.value > 0 && (
                                                        <div className="flex justify-between text-sm text-yellow-600">
                                                            <span>{itineraryData.festivalOffer.name} ({category})</span>
                                                            {(() => {
                                                                const basePrice = itineraryData.pricing[category] || 0;
                                                                const offerDiscount = itineraryData.offers[category] || 0;
                                                                const festivalDiscount = ((basePrice - offerDiscount) * (itineraryData.festivalOffer?.value || 0)) / 100;
                                                                const finalPrice = basePrice - offerDiscount - festivalDiscount;
                                                                const totalDiscount = festivalDiscount;

                                                                return (
                                                                    <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">

                                                                        {/* Discount Label */}
                                                                        {totalDiscount > 0 && (
                                                                            <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-1 rounded-full">
                                                                                You Save ₹{totalDiscount.toFixed(0)} ({itineraryData.festivalOffer?.value || 0}% OFF)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}

                                                        </div>
                                                    )}

                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                        <span className="capitalize text-muted-foreground">Booking Amount ({category})</span>
                                                        <span>₹{itineraryData.bookingAmount[category] || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs sm:text-sm font-semibold">
                                                        <span className="capitalize text-muted-foreground">Highlight ({category})</span>
                                                        <span>₹{itineraryData.highlightPrice[category] || 0}</span> {/* FIXED: User input */}
                                                    </div>

                                                    <div className="flex justify-between font-semibold text-sm sm:text-base">
                                                        <span className="capitalize">{category} Total</span>
                                                        <span>₹{getCategoryTotals()[category] || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3 border-t border-gray-200">
                                                {/* 🟢 Total Offer Savings */}
                                                {/* <div className="flex justify-between text-sm font-semibold text-green-600">
                                                        <span>Discount</span>
                                                        <span>
                                                            ₹
                                                            {Object.values(itineraryData.offers).reduce(
                                                                (sum, o) => sum + (Number(o) || 0),
                                                                0
                                                            ).toFixed(0)}
                                                        </span>
                                                    </div> */}

                                                {/* 🟡 Total Festival Savings */}
                                                {itineraryData.festivalOffer?.value > 0 && (
                                                    <div className="flex justify-between text-sm font-semibold text-yellow-600 bg-yellow-50 p-2 rounded">
                                                        <span>{itineraryData.festivalOffer.name} Savings</span>
                                                        <span>
                                                            -₹
                                                            {Object.entries(itineraryData.pricing).reduce((sum, [category, price]) => {
                                                                const offer = itineraryData.offers?.[category] || 0;
                                                                const effectivePrice = (Number(price) || 0) - (Number(offer) || 0);
                                                                const festivalDiscount =
                                                                    effectivePrice * ((itineraryData.festivalOffer?.value || 0) / 100);
                                                                return sum + festivalDiscount;
                                                            }, 0).toFixed(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                        {/* <button
                                                onClick={() => saveBookingToDatabase("Booked")}
                                                disabled={isSubmitting}
                                                className="w-full mt-6 sm:mt-8 bg-primary text-primary-foreground rounded-xl py-3 sm:py-4 font-semibold hover:bg-primary/90 transition-colors duration-200 text-sm sm:text-base"
                                            >
                                                {isSubmitting ? "Booking Confirmed" : "Book Now"}
                                            </button> */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Theme and Contact Selection - IMPROVED: Grid consistency */}
                        <div className="px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col  justify-between gap-4 sm:gap-6">
                            <section className="mb-6 sm:mb-10 flex-1">
                                <h2 className="text-lg sm:text-xl flex items-center gap-2 font-bold mb-4 text-gray-800 text-center sm:text-left">
                                    <Moon size={20} /> Select a Theme
                                </h2>

                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {themes.map((theme) => {
                                        const isSelected = selectedTheme?._id === theme._id;

                                        return (
                                            <div
                                                key={theme._id}
                                                onClick={() => handleThemeChange(theme)}
                                                className={`cursor-pointer overflow-hidden rounded-lg border relative 
                            ${isSelected ? "border-4 border-blue-500" : "border-gray-300 hover:border-blue-400"}
                            `}
                                            >
                                                {theme.imageUrl && (
                                                    <img
                                                        src={
                                                            theme.imageUrl.startsWith("/uploads")
                                                                ? `https://apitour.rajasthantouring.in${theme.imageUrl}`
                                                                : theme.imageUrl
                                                        }
                                                        alt={theme.name}
                                                        className="w-full h-32 sm:h-52 object-cover"
                                                    />
                                                )}

                                                <div className="absolute bottom-0 w-full bg-gray-800 text-white text-center py-2 text-xs sm:text-sm">
                                                    {theme.name}{" "}
                                                    <span className="text-xs text-gray-300">
                                                        {theme.isActive ? "(Active)" : "(Inactive)"}
                                                    </span>
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                                        Selected
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                                <h4 className="text-lg font-semibold text-gray-700 mb-4">
                                    Select Contact
                                    {user?.role === "admin" && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Admin - All Contacts
                                        </span>
                                    )}
                                </h4>

                                {/* Grid of contacts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {structure?.contacts
                                        ?.filter((contact) => {
                                            // If admin, show all contacts
                                            if (user?.role === "admin") return true;

                                            // Filter contacts based on logged-in user's name or email
                                            if (!user) return false;

                                            const userName = user.name?.toLowerCase() || "";
                                            const userEmail = user.email?.toLowerCase() || "";
                                            const contactName = contact.name?.toLowerCase() || "";
                                            const contactEmails = contact.emails?.map(e => e.toLowerCase()) || [];

                                            console.log(userName, contactName, userEmail, contactEmails, "datasolid");

                                            // Match by name or any email
                                            return contactName.includes(userName) ||
                                                userName.includes(contactName) ||
                                                contactEmails.some(email => email.includes(userEmail)) ||
                                                contactEmails.some(email => userEmail.includes(email));
                                        })
                                        ?.map((contact, index) => {
                                            const isSelected = selectedContact?._id === contact._id;

                                            return (
                                                <div
                                                    key={contact._id || index}
                                                    onClick={() => handleContactChange(contact)}
                                                    className={`cursor-pointer rounded-lg p-4 border relative 
                    ${isSelected ? "border-4 border-blue-500" : "border-gray-200 hover:border-gray-300"}
                    transition-all duration-200
                    `}
                                                >
                                                    <div className="text-base font-semibold mb-2 text-gray-900">
                                                        {contact.name || "Unnamed Contact"}
                                                    </div>

                                                    <div className="text-sm text-gray-600">
                                                        {contact.mobiles?.length > 0 && (
                                                            <p className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-teal-600" />
                                                                <span><strong>Mobile:</strong> {contact.mobiles.join(", ")}</span>
                                                            </p>
                                                        )}
                                                        {contact.emails?.length > 0 && (
                                                            <p className="flex items-center gap-2">
                                                                <Mail className="w-4 h-4 text-purple-600" />
                                                                <span><strong>Email:</strong> {contact.emails.join(", ")}</span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    {/* Show message if no contacts match */}
                                    {structure?.contacts?.filter((contact) => {
                                        if (user?.role === "admin") return true;
                                        if (!user) return false;
                                        const userName = user.name?.toLowerCase() || "";
                                        const userEmail = user.email?.toLowerCase() || "";
                                        const contactName = contact.name?.toLowerCase() || "";
                                        const contactEmails = contact.emails?.map(e => e.toLowerCase()) || [];
                                        return contactName.includes(userName) ||
                                            userName.includes(contactName) ||
                                            contactEmails.some(email => email.includes(userEmail)) ||
                                            contactEmails.some(email => userEmail.includes(email));
                                    }).length === 0 && (
                                            <div className="col-span-full text-center py-8 text-gray-500">
                                                No contacts found for your profile. Please contact admin.
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row justify-between gap-4">
                            <button
                                className="px-6 py-3 text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors duration-200 font-medium w-full sm:w-auto"
                                onClick={() => setStep("itinerary-builder")}
                            >
                                Back to Edit
                            </button>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                                <button
                                    className="px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base flex-1 sm:flex-none"
                                    onClick={() => saveBookingToDatabase("pending")}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save"}
                                </button>
                                <button
                                    className="px-4 sm:px-6 py-3 bg-blue-200 text-accent-foreground rounded-xl hover:bg-blue-200/90 transition-colors duration-200 font-medium text-sm sm:text-base flex-1 sm:flex-none"
                                    onClick={handlePrint}
                                >
                                    Download PDF
                                </button>
                                <button
                                    className="px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base flex-1 sm:flex-none"
                                    onClick={() => saveBookingToDatabasePreview()}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return null
}