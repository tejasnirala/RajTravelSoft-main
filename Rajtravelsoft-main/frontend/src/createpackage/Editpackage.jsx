"use client"

import axios from "axios"
import { useRef } from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useReactToPrint } from "react-to-print"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';
import { Trash2, MapPin, Coffee, CupSoda, Plus, Upload, IndianRupee, Phone, Mail, CoffeeIcon, Moon } from "lucide-react";
import { toast } from "react-toastify"
import { faBed } from "@fortawesome/free-solid-svg-icons"
import FastLazyImage from "../LazyImage"
const RichTextEditor = ({ value, onChange }) => {
    const quillRef = useRef();

    const modules = {
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
    };

    const handleChange = (content) => {
        onChange(content);
    };

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
};

export default function Editpackage() {
    const componentRef = useRef(null);
    const params = useParams()
    const bookingId = params.id
    const isEditMode = !!bookingId
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [step, setStep] = useState("client-details")
    const [checkedDaysState, setCheckedDaysState] = useState({});
    const [clientDetails, setClientDetails] = useState({
        name: "",
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
    const [hotelSelectionDays, setHotelSelectionDays] = useState({});
    const [searchTerm, setSearchTerm] = useState("")
    const [itineraries, setItineraries] = useState([])
    const [tourCodeFilter, setTourCodeFilter] = useState("")
    const [hotels, setHotels] = useState([])
    const [resive, setresive] = useState(false)
    const [categories, setCategories] = useState([])
    const [locations, setLocations] = useState([])
    const [bookingall, setbookingall] = useState([])
    const [selectedItinerary, setSelectedItinerary] = useState(null)
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
        pricing: {},
        offers: {},
        bookingAmount: 0,
        vehicle: {},
        hotels: {},
        highlightPrice: 0,
        priceType: "perPerson",
        festivalOffer: { selected: false, value: 0, name: "" }, // NEW: Festival Offer State
    })


    useEffect(() => {
        setTimeout(() => {
            document.querySelectorAll("*")
                .forEach(el => el.scrollTo?.({ top: 0, behavior: "smooth" }));
        }, 50);
    }, [step]);
    console.log(itineraryData)

    // Fetch user data
    const fetchUser = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.ok) {
                setUser(data.user);
                console.log(data.user);


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

    useEffect(() => {
        fetchUser();
    }, []);

    const [hotelSelections, setHotelSelections] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentBookingId, setCurrentBookingId] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [durationFilter, setDurationFilter] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("deluxe")
    const [vehicles, setVehicles] = useState([]);
    const [vehicleOptions, setvehicleOptions] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null); // NEW: State for selected theme
    const [themes, setThemes] = useState([]); // NEW: State for selected theme
    const [structure, setStructure] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [inclusions, setInclusions] = useState([]);
    const [exclusions, setExclusions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [bookingInclusions, setBookingInclusions] = useState([]);
    const [bookingExclusions, setBookingExclusions] = useState([]);
    const [editingInclusions, setEditingInclusions] = useState(false);
    const [editingExclusions, setEditingExclusions] = useState(false);
    const [editableInclusions, setEditableInclusions] = useState([]);
    const [editableExclusions, setEditableExclusions] = useState([]);
    const [cancellationAndRefundPolicy, setCancellationAndRefundPolicy] = useState([]);
    const [travelRequirements, setTravelRequirements] = useState([]);
    const [addons, setAddons] = useState([]);
    const [showNote, setShowNote] = useState(false);
    const [noteText, setNoteText] = useState("");


    console.log(bookingInclusions);

    // const vehicleOptions = ["Wagon R / Similar", "Swift Dzire / Similar", "Innova / Similar", "Tempo Traveller", "Bus"]



    useEffect(() => {
        fetchItineraries()
        fetchHotels()
        fetchCategories()
        fetchLocations()
        fetchVehicles();

        fetchStructureData(); // NEW: Fetch structure for contacts and inclusions/exclusions

        // <CHANGE> Fetch existing booking data when in edit mode
        if (isEditMode && bookingId) {
            fetchBookingData(bookingId)
        }
    }, [bookingId, isEditMode, user])

    useEffect(() => {
        fetchThemes(); // Sirf ek baar call ho
    }, []) // Empty dependency - sirf mount par


    // Phir booking data se match karo - alag useEffect
    useEffect(() => {
        // Agar themes loaded hain, booking data hai, aur selectedTheme empty hai
        if (bookingall?.theme?._id && themes.length > 0 && !selectedTheme) {
            const matchedTheme = themes.find(t => t._id === bookingall.theme._id);
            if (matchedTheme) {
                setSelectedTheme(matchedTheme);
                console.log("Theme matched:", matchedTheme.name);
            }
        }
    }, [bookingall?.theme?._id]) // Sirf booking theme change par depend karo


    // NEW: Fetch structure data for contacts and inclusions/exclusions
    const fetchStructureData = async () => {
        try {
            const res = await axios.get("https://apitour.rajasthantouring.in/api/structure");
            setStructure(res.data);

            // Fetch inclusions/exclusions
            const incRes = await axios.get("https://apitour.rajasthantouring.in/api/tour-inclusion-exclusion");
            if (incRes.data.data) {
                const convertToImagesArray = (items) => items.map(item => ({
                    ...item,
                    images: item.image ? [item.image.replace(/\\/g, "/")] : []
                })) || [];

                setInclusions(convertToImagesArray(incRes.data.data.inclusions));
                setExclusions(convertToImagesArray(incRes.data.data.exclusions));
                setTerms(convertToImagesArray(incRes.data.data.termsAndConditions));
                setCancellationAndRefundPolicy(convertToImagesArray(incRes.data.data.cancellationAndRefundPolicy));
                setTravelRequirements(convertToImagesArray(incRes.data.data.travelRequirements));
            }

            if (res.data.contacts?.length > 0) {
                setSelectedContact(res.data.contacts[0]);
            }
        } catch (err) {
            console.error("Error fetching structure:", err);
        }
    };

    const handleContactChange = (contact) => {
        setSelectedContact(contact);
    };

    useEffect(() => {
        if (structure?.contacts?.length > 0 && !bookingall?.contact) {
            setSelectedContact(structure.contacts[0]);
        }
    }, [structure]);

    // Match contact by email when both structure and booking data are loaded
    useEffect(() => {
        if (bookingall?.contact && structure?.contacts?.length > 0) {
            const bookingEmails = bookingall.contact?.emails || [];

            const matchedContact = structure.contacts.find(contact => {
                const contactEmails = Array.isArray(contact.emails)
                    ? contact.emails
                    : contact.email
                        ? [contact.email]
                        : [];

                return contactEmails.some(
                    cEmail =>
                        bookingEmails.some(
                            bEmail => bEmail?.toLowerCase() === cEmail?.toLowerCase()
                        )
                );
            });

            console.log(matchedContact, "Matched contact by email");
            setSelectedContact(matchedContact || structure.contacts[0]);
        }
    }, [bookingall, structure]);

    // Initialize local booking states from global after fetch (only if not already loaded from booking)
    useEffect(() => {
        if (inclusions.length > 0 && exclusions.length > 0 && bookingInclusions.length === 0 && bookingExclusions.length === 0) {
            setBookingInclusions(inclusions);
            setBookingExclusions(exclusions);
        }
    }, [inclusions, exclusions]);
    console.log(inclusions, exclusions);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Booking_${bookingId}`,
    });

    // Upload image function
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post("https://apitour.rajasthantouring.in/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.url;
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
            const filtered = editableInclusions.filter(item => item.title.trim());
            setBookingInclusions(filtered);
            setEditableInclusions(filtered.map(item => ({ ...item })));

            setEditingInclusions(false);
            toast.success("Inclusions updated for this booking!");
        } catch (err) {
            console.error(err);
            setError("Failed to update inclusions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveExclusions = async () => {
        if (editableExclusions.length === 0 || editableExclusions.every(item => !item.title.trim())) {
            setError("At least one exclusion is required with a title.");
            return;
        }
        setIsSubmitting(true);
        try {
            const filtered = editableExclusions.filter(item => item.title.trim());
            setBookingExclusions(filtered);
            setEditableExclusions(filtered.map(item => ({ ...item })));

            setEditingExclusions(false);
            alert("Exclusions updated for this booking!");
        } catch (err) {
            console.error(err);
            setError("Failed to update exclusions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // NEW: Fetch all themes
    const fetchThemes = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/themes");
            const data = await response.json();
            setThemes(data);
            // Set default theme if none selected
            if (!selectedTheme && data.length > 0) {
                setSelectedTheme(data[0]); // Or find by ID if needed
            }
        } catch (err) {
            console.error("Error fetching themes:", err);
            // Mock data fallback if needed
            const mockThemes = [
                { _id: "default", name: "Default Theme", link: "", imageUrl: "", isActive: true }
            ];
            setThemes(mockThemes);
            setSelectedTheme(mockThemes[0]);
        }
    };

    // ✅ Fetch all vehicles
    const fetchVehicles = async () => {
        try {
            const res = await axios.get("https://apitour.rajasthantouring.in/api/vehicles");
            // console.log(res);
            setVehicles(res.data);
            // database se vehicle options banaye (make + model + year etc.)
            const dbOptions = res.data.map(
                (v) => `${v.make} ${v.model} `
            );
            // final merge karke state me daal do
            setvehicleOptions(dbOptions);
        } catch (err) {
            console.error("Error fetching vehicles:", err);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    // // Update useEffect to initialize pricing based on selected itinerary categories
    // useEffect(() => {
    //     if (selectedItinerary && categories.length > 0) {
    //         // Initialize pricing object with categories from the selected itinerary or available categories
    //         const initialPricing = {}
    //         const initialOffers = {}

    //         categories.forEach((category) => {
    //             const categoryName = category.name.toLowerCase()
    //             initialPricing[categoryName] = 0
    //             initialOffers[categoryName] = 0
    //         })

    //         setItineraryData((prev) => ({
    //             ...prev,
    //             pricing: initialPricing,
    //             offers: initialOffers,
    //         }))
    //     }
    // }, [selectedItinerary, categories,bookingId])

    const fetchItineraries = async () => {
        setLoading(true)
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/itineraries")
            const data = await response.json()
            setItineraries(data)
            // console.log(data)
        } catch (err) {
            // console.log("API failed, using static data")
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
                // Add more mock itineraries if needed
            ]
            setItineraries(mockItineraries)
            setError("Using offline data - API unavailable")
        } finally {
            setLoading(false)
        }
    }
    // console.log(itineraries)

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

    const getHighlightPrice = () => {
        if (itineraryData.highlightPrice && itineraryData.highlightPrice > 0) {
            return itineraryData.highlightPrice
        }
        return getPricePerPerson()
    }

    const handleClientDetailsSubmit = (e) => {
        e.preventDefault()
        if (!clientDetails.name || !clientDetails.email || !clientDetails.phone || !clientDetails.travelDate) {
            setError("Please fill all required fields")
            return
        }
        setError(null)
        setStep("itinerary-selection")
    }

    const handleItinerarySelect = (itinerary) => {
        setSelectedItinerary(itinerary)
        // Normalize descriptions to array of strings if needed
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
            date: itinerary.date || "",
            images: itinerary.images || [],
            duration: itinerary.duration || "",
            days: normalizedDays,
            tourcode: itinerary.tourcode || '',
            pricing: itinerary.packagePricing || {},
            offers: Object.keys(itinerary.packagePricing || {}).reduce((acc, key) => {
                acc[key] = 0
                return acc
            }, {}),
            bookingAmount: 0,
            vehicle: itinerary.vehicle || {},
            hotels: {},
            highlightPrice: 0,
            priceType: "perPerson",
            festivalOffer: { selected: false, value: 0, name: "" }, // NEW: Initialize Festival Offer
        })
        setHotelSelections({})
        setStep("itinerary-builder")
    }

    // console.log(itineraryData)

    const filteredItineraries = itineraries
        .filter(
            (itinerary) =>
                itinerary.titles.some((title) => title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                itinerary.days.some((day) =>
                    typeof day.location === "string"
                        ? day.location.toLowerCase().includes(searchTerm.toLowerCase())
                        : Array.isArray(day.location)
                            ? day.location.some((loc) => loc.toLowerCase().includes(searchTerm.toLowerCase()))
                            : false,
                ),
        )
        .filter((itinerary) => (durationFilter ? itinerary.duration === durationFilter : true))
        .filter((itinerary) => (tourCodeFilter ? (itinerary.tourcode || '').toLowerCase().includes(tourCodeFilter.toLowerCase()) : true))

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

    const updateDay = (dayId, field, value, index = null) => {
        const updatedDays = itineraryData.days.map((day) => {
            if (day.id === dayId) {
                if (field === "titles" || field === "locations") {
                    // Handle array fields
                    if (index !== null) {
                        const newArray = [...day[field]]
                        newArray[index] = value
                        return { ...day, [field]: newArray }
                    }
                    return { ...day, [field]: value }
                } else if (field === "descriptions") {
                    // Handle descriptions array - now strings for Quill
                    if (index !== null) {
                        const newDescriptions = [...day.descriptions]
                        newDescriptions[index] = value // value is HTML string from Quill
                        return { ...day, descriptions: newDescriptions }
                    }
                    return { ...day, descriptions: value }
                } else {
                    return { ...day, [field]: value }
                }
            }
            return day
        })
        setItineraryData({ ...itineraryData, days: updatedDays })
    }

    // Upload helper - reuse bookings upload endpoint which returns a public URL
    const uploadFileAndGetPath = async (file) => {
        if (!file) return null;
        try {
            const formData = new FormData();
            // endpoint expects field name 'screenshot'
            formData.append("screenshot", file);

            const res = await axios.post("https://apitour.rajasthantouring.in/api/bookings/upload-screenshot", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const url = res.data?.screenshotUrl;
            if (!url) return null;
            // convert to server-relative path like '/uploads/..'
            try {
                const parsed = new URL(url);
                return parsed.pathname;
            } catch (e) {
                // fallback: if it's already a path
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

    const addDayField = (dayId, field) => {
        const updatedDays = itineraryData.days.map((day) => {
            if (day.id === dayId) {
                if (field === "titles" || field === "locations") {
                    return { ...day, [field]: [...day[field], ""] }
                } else if (field === "descriptions") {
                    return { ...day, descriptions: [...day.descriptions, ""] } // Empty string for Quill
                }
            }
            return day
        })
        setItineraryData({ ...itineraryData, days: updatedDays })
    }

    const removeDayField = (dayId, field, index) => {
        const updatedDays = itineraryData.days.map((day) => {
            if (day.id === dayId) {
                if (field === "titles" || field === "locations") {
                    const newArray = day[field].filter((_, i) => i !== index)
                    return { ...day, [field]: newArray.length > 0 ? newArray : [""] }
                } else if (field === "descriptions") {
                    const newDescriptions = day.descriptions.filter((_, i) => i !== index)
                    return { ...day, descriptions: newDescriptions.length > 0 ? newDescriptions : [""] }
                }
            }
            return day
        })
        setItineraryData({ ...itineraryData, days: updatedDays })
    }
    const updatePricing = (category, value) => {
        // Allow empty string to clear the field (don't coerce to 0 immediately)
        const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
        const newPricing = { ...itineraryData.pricing };
        const newOffers = { ...itineraryData.offers };

        // IMPORTANT: Clear ALL other categories when setting a new price
        Object.keys(newPricing).forEach((key) => {
            newPricing[key] = 0;
            newOffers[key] = 0;
        });

        // Only set the selected category price
        newPricing[category] = numValue;
        setSelectedCategory(category);

        setItineraryData({
            ...itineraryData,
            pricing: newPricing,
            offers: newOffers,
        });
    };

    // Update the handleCategorySelection function
    const handleCategorySelection = (category) => {
        setSelectedCategory(category);

        // Clear all categories first
        const newPricing = { ...itineraryData.pricing };
        const newOffers = { ...itineraryData.offers };

        Object.keys(newPricing).forEach((key) => {
            newPricing[key] = 0;
            newOffers[key] = 0;
        });

        // Only set the selected category pricing if it has a package price
        if (category && selectedItinerary.packagePricing?.[category]) {
            const packagePrice = selectedItinerary.packagePricing[category];
            newPricing[category] = packagePrice;
        }

        setItineraryData({
            ...itineraryData,
            pricing: newPricing,
            offers: newOffers,
        });
    };

    // Update the useEffect that calculates booking amount
    useEffect(() => {
        if (selectedCategory && itineraryData.pricing[selectedCategory]) {
            const selectedPrice = itineraryData.pricing[selectedCategory];
            const offer = itineraryData.offers[selectedCategory];
            const bookingAmount = ((selectedPrice - offer) * 20) / 100; // 20% calculation
            setItineraryData(prev => ({
                ...prev,
                bookingAmount: Math.round(bookingAmount), // Round to nearest integer
                // Auto-calculate highlight price from selected category only
                highlightPrice: selectedPrice - offer // Set to final price of selected category
            }));
        }
    }, [selectedCategory, itineraryData.pricing, itineraryData.offers]);


    const updateOffer = (category, value) => {
        // Allow empty string to clear
        const numValue = value === "" ? "" : Number.parseFloat(value);
        if (itineraryData.pricing[category] > 0 || value === "") {
            setItineraryData({
                ...itineraryData,
                offers: { ...itineraryData.offers, [category]: numValue },
            });
        } else {
            setItineraryData({
                ...itineraryData,
                offers: { ...itineraryData.offers, [category]: 0 },
            });
        }
    }

    const updateHighlightPrice = (value) => {
        // Allow empty string to clear
        const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
        setItineraryData({
            ...itineraryData,
            highlightPrice: numValue,
        });
    }

    const updatePriceType = (value) => {
        setItineraryData({
            ...itineraryData,
            priceType: value,
        })
    }

    // NEW: Festival Offer Handlers
    const updateFestivalOffer = (field, value) => {
        setItineraryData((prev) => ({
            ...prev,
            festivalOffer: {
                ...prev.festivalOffer,
                [field]: value,
            },
        }));
    };

    const toggleFestivalOffer = () => {
        setItineraryData((prev) => ({
            ...prev,
            festivalOffer: {
                ...prev.festivalOffer,
                selected: !prev.festivalOffer.selected,
                ...(!prev.festivalOffer.selected && { value: 0, name: "" }), // Reset if enabling
            },
        }));
    };

    // NEW: Handle theme selection
    const handleThemeSelection = (themeId) => {
        const theme = themes.find(t => t._id === themeId);
        setSelectedTheme(theme || null);
    };

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
    };


    useEffect(() => {
        if (selectedCategory && itineraryData.pricing[selectedCategory]) {
            const selectedPrice = itineraryData.pricing[selectedCategory];
            const offer = itineraryData.offers[selectedCategory];
            const bookingAmount = ((selectedPrice - offer) * 20) / 100; // 20% calculation
            setItineraryData(prev => ({
                ...prev,
                bookingAmount: Math.round(bookingAmount) // Round to nearest integer
            }));
        }
    }, [selectedCategory, itineraryData.pricing, itineraryData.offers]);


    const updateHotelSelection = (dayId, location, meal, hotelId) => {
        setHotelSelections((prev) => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [location]: {
                    ...prev[dayId]?.[location],
                    [meal]: hotelId,
                },
            },
        }))

        setItineraryData((prev) => ({
            ...prev,
            hotels: {
                ...prev.hotels,
                [dayId]: {
                    ...prev.hotels[dayId],
                    [location]: {
                        ...prev.hotels[dayId]?.[location],
                        [meal]: hotelId,
                    },
                },
            },
        }))
    }

    const removeHotelSelection = (dayId, location, meal) => {
        setHotelSelections((prev) => {
            const newSelections = { ...prev }
            if (newSelections[dayId]?.[location]) {
                delete newSelections[dayId][location][meal]
                // If no meals left for this location, remove the location
                if (Object.keys(newSelections[dayId][location]).length === 0) {
                    delete newSelections[dayId][location]
                }
                // If no locations left for this day, remove the day
                if (Object.keys(newSelections[dayId]).length === 0) {
                    delete newSelections[dayId]
                }
            }
            return newSelections
        })

        setItineraryData((prev) => {
            const newHotels = { ...prev.hotels }
            if (newHotels[dayId]?.[location]) {
                delete newHotels[dayId][location][meal]
                // If no meals left for this location, remove the location
                if (Object.keys(newHotels[dayId][location]).length === 0) {
                    delete newHotels[dayId][location]
                }
                // If no locations left for this day, remove the day
                if (Object.keys(newHotels[dayId]).length === 0) {
                    delete newHotels[dayId]
                }
            }
            return {
                ...prev,
                hotels: newHotels,
            }
        })
    }

    const getFilteredHotels = (location, category, dayId) => {

        // 🟦 Step 1: Get selected hotels for SAME DAY + SAME LOCATION
        const mealData = hotelSelections?.[dayId]?.[location] || {};

        let combinedSelected = [];

        if (mealData.breakfast) combinedSelected.push(mealData.breakfast);
        if (mealData.lunch) combinedSelected.push(mealData.lunch);
        if (mealData.dinner) combinedSelected.push(mealData.dinner);
        if (mealData.stayOnly) combinedSelected.push(mealData.stayOnly);

        const uniqueSelected = [...new Set(combinedSelected.map(String))];

        // 🟩 Step 2: If any hotel selected → only those hotels show
        if (uniqueSelected.length > 0) {
            return hotels
                .filter(hotel => uniqueSelected.includes(String(hotel._id)))
                .sort(sortByCategoryOrder);
        }

        // 🟥 Step 3: First time → show ALL hotels matching SAME LOCATION
        const locationHotels = hotels.filter(hotel => {
            return hotel.locationId?.name?.toLowerCase() === location?.toLowerCase();
        });

        // 🟨 Sort by category order
        return locationHotels.sort(sortByCategoryOrder);
    };

    const sortByCategoryOrder = (a, b) => {
        const categoriesOrder = categories.map(c => c.name.toLowerCase());

        const catA = a.categoryId?.name?.toLowerCase() || "";
        const catB = b.categoryId?.name?.toLowerCase() || "";

        const indexA = categoriesOrder.indexOf(catA);
        const indexB = categoriesOrder.indexOf(catB);

        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    };




    // <CHANGE> Updated fetchBookingData to properly load existing data, matching create structure
    const fetchBookingData = async (id) => {
        try {
            setLoading(true)
            const response = await axios.get(`https://apitour.rajasthantouring.in/api/bookings/${id}`)
            const booking = response.data
            setbookingall(booking)

            console.log(booking, "booking data ");

            // Pre-populate client details
            setClientDetails({
                name: booking.clientDetails?.name || "",
                email: booking.clientDetails?.email || "",
                email2: booking.clientDetails?.email2 || "",
                phone: booking.clientDetails?.phone || "",
                adults: booking.clientDetails?.adults || "",
                kids5to12: booking.clientDetails?.kids5to12 || "",
                kidsBelow5: booking.clientDetails?.kidsBelow5 || "",
                rooms: booking.clientDetails?.rooms || "",
                extraBeds: booking.clientDetails?.extraBeds || "",
                travelDate: booking.clientDetails?.travelDate || "",
                travelers: booking.clientDetails?.travelers || 1,

            })
            setresive(!!booking?.payments?.find(p => p.status === "success"));

            if (booking.noteText) {
                setNoteText(booking.noteText)
                setShowNote(true)
            }
            // Set selected itinerary
            setSelectedItinerary(booking.selectedItinerary || null)

            // Normalize and set itineraryData - handle rich text descriptions as strings
            const normalizedDays = (booking.itineraryData?.days || []).map((day, index) => ({
                id: day.id || index + 1,
                titles: day.titles || [day.title || ""],
                descriptions: Array.isArray(day.descriptions)
                    ? day.descriptions.map(desc => typeof desc === 'object' ? desc.text || '' : desc || '')  // Handle as strings for Quill
                    : [day.description || ""],
                locations: day.locations || [day.location || ""],
                images: day.images || [],
            }))

            // Hotels with IDs only for selections
            const hotelsWithIds = {};

            if (booking.itineraryData?.hotels) {
                for (const day in booking.itineraryData.hotels) {
                    const cities = booking.itineraryData.hotels[day];
                    for (const city in cities) {
                        const meals = cities[city];
                        for (const meal in meals) {
                            const hotel = meals[meal];
                            const hotelId = hotel?.id || hotel;

                            // Only add if hotelId exists and is not empty
                            if (hotelId) {
                                if (!hotelsWithIds[day]) hotelsWithIds[day] = {};
                                if (!hotelsWithIds[day][city]) hotelsWithIds[day][city] = {};
                                hotelsWithIds[day][city][meal] = hotelId;
                            }
                        }
                    }
                }
            }

            console.log(hotelsWithIds);

            setItineraryData({
                titles: booking.itineraryData?.titles || [""],
                descriptions: Array.isArray(booking.itineraryData?.descriptions)
                    ? booking.itineraryData.descriptions.map(desc => typeof desc === 'object' ? desc.text || '' : desc || '')
                    : [booking.itineraryData?.descriptions || ""],
                date: booking.itineraryData?.date || "",
                images: booking.itineraryData?.images || [],
                duration: booking.itineraryData?.duration || "",
                days: normalizedDays,
                pricing: booking.itineraryData?.pricing || {},
                offers: booking.itineraryData?.offers || {},
                bookingAmount: booking.itineraryData?.bookingAmount || 0,
                vehicle: booking.itineraryData?.vehicle || {},
                hotels: hotelsWithIds,  // Keep full hotels in itineraryData, but IDs for selections
                highlightPrice: booking.itineraryData?.highlightPrice || 0,
                priceType: booking.itineraryData?.priceType || "perPerson",
                festivalOffer: booking.itineraryData?.festivalOffer || { selected: false, value: 0, name: "" }, // NEW: Load Festival Offer
            })

            // Set hotel selections to IDs
            setHotelSelections(hotelsWithIds || {})

            // Set selected category
            setSelectedCategory(Object.keys(booking.itineraryData?.pricing || {})[0] || "deluxe")


            // Set selected theme
            if (booking.theme && booking.theme._id) {
                const matchedTheme = themes.find(t => t._id === booking.theme._id);
                if (matchedTheme) {
                    setSelectedTheme(matchedTheme);
                } else {
                    setSelectedTheme(booking.theme);
                }
            } else {
                setSelectedTheme(null);
            }
            console.log(booking.theme, "Current booking theme");


            // Set booking inclusions and exclusions from existing booking data
            if (booking.inclusions && booking.inclusions.length > 0) {
                setBookingInclusions(booking.inclusions);
            }
            if (booking.exclusions && booking.exclusions.length > 0) {
                setBookingExclusions(booking.exclusions);
            }

            // Set addons from existing booking data
            if (booking.addons && booking.addons.length > 0) {
                setAddons(booking.addons);
            }

            // For edit mode, go to builder or preview? Set to builder to allow edits
            setStep("itinerary-builder")  // Changed to builder for editing
            setLoading(false)
        } catch (error) {
            console.log(error);

            console.error("Error fetching booking:", error)
            setError(error.response.data.message || "Failed to load booking data")
            setLoading(false)
        }
    }



    // Load saved hotelSelectionDays into state on edit mode
    // Load booking data
    useEffect(() => {
        if (!bookingall?._id) return;

        // ✅ Load hotelSelectionDays
        if (bookingall.hotelSelectionDays) {
            const normalizedData = {};
            Object.entries(bookingall.hotelSelectionDays).forEach(([category, dayData]) => {
                normalizedData[category] = {};
                Object.entries(dayData).forEach(([dayId, value]) => {
                    normalizedData[category][dayId] = value;
                    normalizedData[category][String(dayId)] = value;
                    normalizedData[category][Number(dayId)] = value;
                });
            });
            setHotelSelectionDays(normalizedData);
        }

        // ✅ Load stayOnlyDays from hotels data
        if (bookingall.itineraryData?.hotels) {
            const stayOnlyData = {};

            Object.entries(bookingall.itineraryData.hotels).forEach(([dayId, locations]) => {
                Object.entries(locations).forEach(([location, meals]) => {
                    if (meals.stayOnly) {
                        // Agar stayOnly meal hai to mark karo
                        if (!stayOnlyData[selectedCategory]) {
                            stayOnlyData[selectedCategory] = {};
                        }
                        stayOnlyData[selectedCategory][dayId] = true;
                        stayOnlyData[selectedCategory][String(dayId)] = true;
                    }
                });
            });

            console.log("✅ Extracted Stay Only Days:", stayOnlyData);

            // Update itineraryData with stayOnlyDays
            setItineraryData(prev => ({
                ...prev,
                stayOnlyDays: stayOnlyData
            }));
        }

    }, [bookingall, selectedCategory]);


    const sendWhatsAppMessage = () => {
        if (!bookingall) return

        const origin = window.location.origin
        const bookingLink = `https://tour.rajasthantouring.in/${bookingall.theme.link}/${bookingall._id}`;
        // Get the offers object safely
        const offers = bookingall.itineraryData?.offers || {}

        // Find the offer with the highest value
        const maxOfferEntry = Object.entries(offers).reduce(
            (max, [key, value]) => (value > max[1] ? [key, value] : max),
            ["none", 0],
        )

        // WhatsApp message (text encode hoga but link raw rahega)
        const message =
            `Hi ${bookingall.clientDetails.name}!\n\n` +
            `Package: ${bookingall.itineraryData?.titles?.[0] || "N/A"}\n` +
            `Duration: ${calculateDuration(bookingall.itineraryData)}\n` +
            `Total Amount: ₹${bookingall.totalAmount || 0}/-\n` +
            `Offer Amount: ₹${maxOfferEntry[1] > 0 ? maxOfferEntry[1] : 0}/-\n` +
            `${resive ? "Received Amount" : "Booking Amount"}: ₹${resive
                ? (bookingall?.payments?.find(p => p.status === "success")?.amount || 0)
                : (
                    bookingall?.itineraryData?.bookingAmount
                        ? Object.values(bookingall.itineraryData.bookingAmount)
                            .reduce((sum, v) => sum + (Number(v.value) || 0), 0)
                        : 0
                )
            }/-\n\n` +
            `You can view your booking details here:\n${bookingLink}\n\n` +
            `Thank you for choosing us for your travel needs!`

        const phone = bookingall.clientDetails.phone?.replace(/[^0-9]/g, "")
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

        window.open(whatsappUrl, "_blank")
    }

    // <CHANGE> Updated save function to handle both create and update operations
    const saveBookingToDatabase = async (e) => {
        setError(null);

        if (bookingall.status === "completed") {
            alert("Booking is already completed. Cannot update Data.");
            return;
        }
        setIsSubmitting(true);

        try {
            // Create pricing with ONLY selected category
            const cleanedPricing = {};
            const cleanedOffers = {};

            if (selectedCategory && itineraryData.pricing[selectedCategory]) {
                cleanedPricing[selectedCategory] = itineraryData.pricing[selectedCategory];
                cleanedOffers[selectedCategory] = itineraryData.offers[selectedCategory] || 0;
            }

            const completeHotelSelectionDays = {};

            // Get all categories from cleaned pricing
            Object.keys(cleanedPricing).forEach((category) => {
                completeHotelSelectionDays[category] = {};

                // Add ALL days with their checked status
                itineraryData.days.forEach((day) => {
                    const isChecked = hotelSelectionDays[category]?.[day.id] === true;
                    completeHotelSelectionDays[category][day.id] = isChecked;
                    completeHotelSelectionDays[category][String(day.id)] = isChecked;
                });
            });

            const bookingData = {
                clientDetails: {
                    ...clientDetails,
                    email2: clientDetails.email2 || "",
                },
                selectedItinerary,
                itineraryData: {
                    ...itineraryData,
                    vehicle: itineraryData.vehicle || {},
                    festivalOffer: itineraryData.festivalOffer,
                    pricing: cleanedPricing, // ONLY selected category
                    offers: cleanedOffers, // ONLY selected category
                    highlightPrice: itineraryData.highlightPrice, // Will be auto-calculated
                },
                hotelSelections,
                hotelSelectionDays: completeHotelSelectionDays,
                totalAmount:
                    Object.values(cleanedPricing).reduce((sum, price) => sum + (price || 0), 0) -
                    Object.values(cleanedOffers).reduce((sum, offer) => sum + (offer || 0), 0),
                bookingAmount: itineraryData.bookingAmount,
                status: e,
                updatedAt: new Date().toISOString(),
                createby: user,
                theme: {
                    ...selectedTheme,
                    link: "viewData4",
                },
                contact: selectedContact,
                inclusions: bookingInclusions,
                exclusions: bookingExclusions,
                termsAndConditions: terms,
                cancellationAndRefundPolicy: cancellationAndRefundPolicy,
                travelRequirements: travelRequirements,
                addons: addons,
                noteText: noteText,
            };

            console.log(bookingData, "Only selected category is saved");

            const url = isEditMode ? `https://apitour.rajasthantouring.in/api/bookings/${bookingId}` : "https://apitour.rajasthantouring.in/api/bookings";
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (response.ok) {
                setCurrentBookingId(result._id);
                setbookingall(result);
                const message = isEditMode
                    ? `Booking updated successfully! Booking ID: ${result.bookingId || result._id}`
                    : `Booking confirmed! Your booking ID is: ${result.bookingId || result._id}`;
                alert(message);
            } else {
                setError(`Failed to ${isEditMode ? "update" : "save"} booking. Please try again.`);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? "updating" : "saving"} booking:`, error);
            setError(`Failed to ${isEditMode ? "update" : "save"} booking. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const uniqueLocations = [...new Set(itineraryData.days.map((day) => day.locations).filter(Boolean))]

    const getActualPrice = () => {
        return Object.values(itineraryData.pricing).reduce((sum, price) => sum + (price || 0), 0)
    }

    const getDiscount = () => {
        return Object.values(itineraryData.offers).reduce((sum, offer) => sum + (offer || 0), 0)
    }

    const getTotalPrice = () => {
        return getActualPrice() - getDiscount()
    }

    const getPricePerPerson = () => {
        const selectedPrice = itineraryData.pricing[selectedCategory] || 0
        const offer = itineraryData.offers[selectedCategory] || 0
        return Math.max(0, selectedPrice - offer)
    }

    // Numeric input handler to prevent non-numbers and allow clearing
    const handleNumericInput = (e) => {
        // Allow backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Allow home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        // Ensure only numbers (block letters)
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    // <CHANGE> Added loading state for edit mode
    if (isEditMode && loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading booking data...</p>
                </div>
            </div>
        )
    }

    if (step === "client-details") {
        return (
            <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-blue-600 text-white px-4 sm:px-8 py-4 sm:py-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs sm:text-sm font-bold">1</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold">Client Details</h1>
                                <span className="text-blue-200 text-xs sm:text-sm font-medium">Step 1 of 3</span>
                            </div>
                        </div>

                        <form onSubmit={handleClientDetailsSubmit} className="p-6 sm:p-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-6 flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-800">
                                        Client Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="name"
                                            type="text"
                                            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter full name"
                                            value={clientDetails.name}
                                            onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                                            required
                                        />
                                        <svg
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter email address"
                                            value={clientDetails.email}
                                            onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                                            required
                                        />
                                        <svg
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="email2" className="block text-sm font-semibold text-gray-800">Email Address 2 (Optional)</label>
                                    <div className="relative">
                                        <input
                                            id="email2"
                                            type="email"
                                            className="w-full px-2 py-1.5 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter second email address"
                                            value={clientDetails.email2}
                                            onChange={(e) => setClientDetails({ ...clientDetails, email2: e.target.value })}
                                        />
                                        <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            placeholder="Enter phone number"
                                            value={clientDetails.phone}
                                            onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                                            required
                                        />
                                        <svg
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
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

                                <div className="space-y-3">
                                    <label htmlFor="adults" className="block text-sm font-semibold text-gray-800">
                                        Number of Adults
                                    </label>
                                    <input
                                        id="adults"
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer text-sm"
                                        placeholder="Enter number of adults"
                                        value={clientDetails.adults}
                                        onChange={(e) => {
                                            setClientDetails({
                                                ...clientDetails,
                                                adults: e.target.value,
                                                travelers:
                                                    Number(e.target.value) + Number(clientDetails.kids5to12) + Number(clientDetails.kidsBelow5),
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="kids5to12" className="block text-sm font-semibold text-gray-800">
                                        Kids (5-12 Years)
                                    </label>
                                    <input
                                        id="kids5to12"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer text-sm"
                                        placeholder="Enter number of kids"
                                        value={clientDetails.kids5to12}
                                        onChange={(e) => {
                                            setClientDetails({
                                                ...clientDetails,
                                                kids5to12: e.target.value,
                                                travelers:
                                                    Number(clientDetails.adults) + Number(e.target.value) + Number(clientDetails.kidsBelow5),
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="kidsBelow5" className="block text-sm font-semibold text-gray-800">
                                        Kids (Below 5 Years)
                                    </label>
                                    <input
                                        id="kidsBelow5"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer text-sm"
                                        placeholder="Enter number of kids"
                                        value={clientDetails.kidsBelow5}
                                        onChange={(e) => {
                                            setClientDetails({
                                                ...clientDetails,
                                                kidsBelow5: e.target.value,
                                                travelers:
                                                    Number(clientDetails.adults) + Number(clientDetails.kids5to12) + Number(e.target.value),
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="rooms" className="block text-sm font-semibold text-gray-800">
                                        Number of Rooms
                                    </label>
                                    <input
                                        id="rooms"
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer text-sm"
                                        placeholder="Enter number of rooms"
                                        value={clientDetails.rooms}
                                        onChange={(e) => setClientDetails({ ...clientDetails, rooms: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="extraBeds" className="block text-sm font-semibold text-gray-800">
                                        Extra mattress
                                    </label>
                                    <input
                                        id="extraBeds"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer text-sm"
                                        placeholder="Enter number of extra mattress"
                                        value={clientDetails.extraBeds}
                                        onChange={(e) => setClientDetails({ ...clientDetails, extraBeds: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label htmlFor="travelDate" className="block text-sm font-semibold text-gray-800">
                                        Travel Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="travelDate"
                                            type="date"
                                            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                                            value={
                                                clientDetails.travelDate
                                                    ? (() => {
                                                        const [day, month, year] = clientDetails.travelDate.split("-");
                                                        return `${year}-${month}-${day}`; // YYYY-MM-DD for input
                                                    })()
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const [year, month, day] = e.target.value.split("-");
                                                const value = e.target.value;

                                                const today = new Date().toISOString().split("T")[0];

                                                // ❌ Past date not allowed
                                                if (value < today) {
                                                    toast.info("You cannot select a past date");
                                                    return;
                                                }
                                                setClientDetails({
                                                    ...clientDetails,
                                                    travelDate: `${day}-${month}-${year}`, // store as DD-MM-YYYY
                                                });
                                            }}
                                            required
                                        />

                                        <svg
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-base"
                                >
                                    Continue to Itinerary →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }


    if (step === "itinerary-selection") {
        return (
            <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-blue-600 text-white px-4 sm:px-8 py-4 sm:py-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold">2</span>
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-bold">Select Itinerary</h1>
                                    <span className="text-blue-200 text-sm font-medium">Step 2 of 3</span>
                                </div>
                                <button
                                    className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20 w-full sm:w-auto"
                                    onClick={() => setStep("client-details")}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Back</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {loading && (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center space-x-3 text-blue-600">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="text-lg font-medium">Loading itineraries...</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center space-x-3">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="font-medium text-base">{error}</span>
                                </div>
                            )}

                            <div className="mb-8 flex flex-col lg:flex-row gap-6 items-start lg:items-end">
                                <div className="flex-1 w-full">
                                    <label htmlFor="duration-filter" className="block text-sm font-semibold text-gray-800 mb-3">
                                        Filter by Duration
                                    </label>
                                    <select
                                        id="duration-filter"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-base"
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

                                <div className="relative w-full lg:w-80">
                                    <label className="block text-sm font-semibold text-gray-800 mb-3">Search Itineraries</label>
                                    <input
                                        type="text"
                                        placeholder="Search by title or location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-base"
                                    />
                                    <svg
                                        className="absolute left-4 top-[70%] transform -translate-y-1/2 text-gray-400 h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="px-6 py-5 text-right border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => setStep("itinerary-builder")}
                                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                                >
                                    Select continued itinerary
                                </button>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-800">Available Itineraries</h2>
                                    <p className="text-sm text-gray-600 mt-1">Choose the perfect itinerary for your trip</p>
                                </div>

                                <div className="px-4 py-3">
                                    <input
                                        type="text"
                                        placeholder="Filter by Tour Code"
                                        value={tourCodeFilter}
                                        onChange={(e) => setTourCodeFilter(e.target.value)}
                                        className="w-full pl-3 pr-3 py-2 mb-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Tour Code
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Duration
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                                                    Date
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Locations
                                                </th>

                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredItineraries.length > 0 ? (
                                                filteredItineraries
                                                    .sort((a, b) => {
                                                        const getDurationNum = (d) => {
                                                            if (!d) return 999;
                                                            const num = parseInt(d); // "01 Nights" → 1
                                                            return isNaN(num) ? 999 : num;
                                                        };

                                                        return getDurationNum(a.duration) - getDurationNum(b.duration);
                                                    })
                                                    .map((itinerary, index) => (
                                                        <tr key={itinerary._id} className="hover:bg-blue-50 transition-colors duration-200">
                                                            <td className="px-6 py-5 text-sm font-medium text-gray-900">
                                                                <div className="text-sm font-semibold text-gray-900">{itinerary.tourcode || ''}</div>
                                                            </td>

                                                            <td className="px-6 py-5">
                                                                <span className="inline-flex items-center min-w-[120px] px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                    {itinerary.duration || "N/A"}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-5 text-sm font-semibold text-gray-900 max-w-[150px] sm:max-w-xs truncate">
                                                                {itinerary.titles?.[0] || "N/A"}
                                                            </td>

                                                            <td className="px-6 py-5 text-sm text-gray-600 hidden md:table-cell">
                                                                {itinerary.date ? new Date(itinerary.date).toLocaleDateString() : "N/A"}
                                                            </td>

                                                            <td className="px-6 py-5 text-sm text-gray-600 max-w-[150px] sm:max-w-md">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(() => {
                                                                        const locationCounts = Object.entries(
                                                                            itinerary.days
                                                                                .flatMap((day) => day.locations || [day.location])
                                                                                .filter(Boolean)
                                                                                .reduce((acc, loc) => {
                                                                                    acc[loc] = (acc[loc] || 0) + 1;
                                                                                    return acc;
                                                                                }, {})
                                                                        );

                                                                        const visibleLocations = locationCounts.slice(0, 2);
                                                                        const hiddenCount = locationCounts.length - visibleLocations.length;

                                                                        return (
                                                                            <>
                                                                                {visibleLocations.map(([loc, count]) => (
                                                                                    <span
                                                                                        key={loc}
                                                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                                                                    >
                                                                                        {loc} ({count})
                                                                                    </span>
                                                                                ))}
                                                                                {hiddenCount > 0 && (
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
                                                                                        +{hiddenCount} more
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-5 text-center">
                                                                <button
                                                                    onClick={() => handleItinerarySelect(itinerary)}
                                                                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                                                                >
                                                                    Select
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-12">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            <p className="text-gray-500 font-medium text-base">No itineraries found</p>
                                                            <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>

                            {selectedItinerary && (
                                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-blue-800 font-medium text-base">
                                            You have selected: <span className="font-semibold">{selectedItinerary.titles[0]}</span> - <span className="font-semibold">{selectedItinerary.duration}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">Tour Code: <span className="font-semibold">{selectedItinerary.tourcode || itineraryData.tourcode || ''}</span></p>
                                    </div>
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
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="w-full sm:w-[95%] mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-blue-600 text-white p-8 mb-4">
                            <div className="flex justify-between flex-wrap gap-4 items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-bold">3</span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold">Itinerary Builder</h1>
                                        <p className="text-blue-100 text-sm">Customize your perfect journey</p>
                                    </div>
                                </div>
                                <button
                                    className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center space-x-2 border border-white/20"
                                    onClick={() => setStep("itinerary-selection")}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Back</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center space-x-3">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    {/* Itinerary Details */}
                                    <div className="space-y-8 mb-12">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <svg
                                                    className="w-5 h-5 text-white"
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
                                            <h2 className="text-3xl font-bold text-gray-900">Itinerary Details</h2>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-6">
                                            {/* Titles */}
                                            <div className="space-y-4">
                                                <label className="block text-lg font-semibold text-gray-900">Itinerary Titles</label>
                                                {itineraryData.titles.map((title, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-3">
                                                        <input
                                                            type="text"
                                                            value={title}
                                                            onChange={(e) =>
                                                                setItineraryData({
                                                                    ...itineraryData,
                                                                    titles: itineraryData.titles.map((t, i) => (i === index ? e.target.value : t)),
                                                                })
                                                            }
                                                            className="flex-1 p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                                            className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                            disabled={itineraryData.titles.length === 1}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                                >
                                                    Add Title
                                                </button>
                                            </div>

                                            {/* Descriptions */}
                                            {/* <div className="space-y-4">
                                                <label className="block text-lg font-semibold text-gray-900">Itinerary Descriptions</label>
                                                {itineraryData.descriptions.map((desc, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-3">
                                                        <div className="flex-1">
                                                            <RichTextEditor
                                                                value={desc}
                                                                onChange={(value) =>
                                                                    setItineraryData({
                                                                        ...itineraryData,
                                                                        descriptions: itineraryData.descriptions.map((d, i) => (i === index ? value : d)),
                                                                    })
                                                                }
                                                                className="flex-1 min-h-[100px]"
                                                            />
                                                        </div>
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
                                                            className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                            disabled={itineraryData.descriptions.length === 1}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                                >
                                                    Add Description
                                                </button>
                                            </div> */}

                                            {/* Date */}
                                            <div className="space-y-4">
                                                <label className="block text-lg font-semibold text-gray-900">Travel Date</label>
                                                <input
                                                    type="date"
                                                    value={itineraryData.date ? new Date(itineraryData.date).toISOString().split("T")[0] : ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const today = new Date().toISOString().split("T")[0];

                                                        // Stop past dates
                                                        if (value < today) {
                                                            toast.info("You cannot select a past date");
                                                            e.target.value = ""; // reset field
                                                            return;
                                                        }

                                                        // Update state SAFE
                                                        setItineraryData((prev) => ({
                                                            ...prev,
                                                            date: value,
                                                        }));
                                                        setClientDetails(prev => ({ ...prev, travelDate: value }));
                                                    }}

                                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm sm:text-base font-semibold text-card-foreground">Tour Code</label>
                                                <input
                                                    type="text"
                                                    value={itineraryData.tourcode}

                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        setItineraryData(prev => ({ ...prev, tourcode: value }));

                                                    }}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-gray-50"
                                                />
                                            </div>


                                        </div>
                                    </div>

                                    {/* Days Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <svg
                                                    className="w-5 h-5 text-white"
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
                                            <h2 className="text-3xl font-bold text-gray-900">Build Your Itinerary</h2>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                                            <h3 className="text-xl font-semibold text-gray-700">Day-wise Itinerary</h3>
                                            <button
                                                onClick={addDay}
                                                className="mt-2 sm:mt-0 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                                            >
                                                Add Day
                                            </button>
                                        </div>

                                        {itineraryData.days.map((day) => (
                                            <div key={day.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-6">
                                                <h4 className="text-lg font-semibold text-gray-900">Day {day.id}</h4>

                                                {/* Titles Section */}
                                                <div className="space-y-4">
                                                    <label className="block text-lg font-semibold text-gray-900">Titles</label>
                                                    {day.titles.map((title, index) => (
                                                        <div key={index} className="flex flex-col sm:flex-row gap-3">
                                                            <input
                                                                type="text"
                                                                value={title}
                                                                onChange={(e) => updateDay(day.id, "titles", e.target.value, index)}
                                                                className="flex-1 p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                placeholder={`Title ${index + 1}`}
                                                            />
                                                            <button
                                                                onClick={() => removeDayField(day.id, "titles", index)}
                                                                className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                disabled={day.titles.length === 1}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addDayField(day.id, "titles")}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                                    >
                                                        Add Title
                                                    </button>
                                                </div>

                                                {/* Descriptions Section - Updated with RichTextEditor */}
                                                <div className="space-y-4">
                                                    <label className="block text-lg font-semibold text-gray-900">Descriptions</label>
                                                    {day.descriptions.map((desc, descIndex) => (
                                                        <div key={descIndex} className="bg-white border border-gray-200 rounded-2xl p-2 space-y-4">
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <div className="flex-1">
                                                                    <RichTextEditor
                                                                        value={desc}
                                                                        onChange={(value) => updateDay(day.id, "descriptions", value, descIndex)}
                                                                        className="flex-1 min-h-[150px]"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => removeDayField(day.id, "descriptions", descIndex)}
                                                                    className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                    disabled={day.descriptions.length === 1}
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addDayField(day.id, "descriptions")}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                                    >
                                                        Add Description
                                                    </button>
                                                </div>

                                                {/* Locations Section - Updated to Select */}
                                                <div className="space-y-4">
                                                    <label className="block text-lg font-semibold text-gray-900">Locations</label>
                                                    {day.locations.map((location, index) => (
                                                        <div key={index} className="flex flex-col sm:flex-row gap-3">
                                                            <select
                                                                value={location}
                                                                onChange={(e) => updateDay(day.id, "locations", e.target.value, index)}
                                                                className="flex-1 p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                                                className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                disabled={day.locations.length === 1}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addDayField(day.id, "locations")}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                                    >
                                                        Add Location
                                                    </button>
                                                </div>

                                                {/* Images Section */}
                                                <div className="space-y-3">
                                                    <label className="block text-base font-semibold text-gray-900">
                                                        Day Images
                                                    </label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {day.images.map((img, index) => (
                                                            <div key={index} className="w-24 flex flex-col">
                                                                {/* Simple image thumbnail with actions */}
                                                                <div className="relative w-full h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
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

                                                                    {/* Visible replace button (top-right) */}
                                                                    <label className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleUploadDayImage(file, day.id, index);
                                                                            }}
                                                                            className="hidden"
                                                                        />
                                                                        <Upload className="w-3 h-3 text-gray-600" />
                                                                    </label>

                                                                    {/* Visible delete button (top-left) */}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newDays = itineraryData.days.map(d =>
                                                                                d.id === day.id ? { ...d, images: d.images.filter((_, i) => i !== index) } : d
                                                                            );
                                                                            setItineraryData({ ...itineraryData, days: newDays });
                                                                        }}
                                                                        className="absolute top-1 left-1 bg-white rounded-full p-1 shadow-sm hover:bg-red-50"
                                                                        title="Remove image"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Simple add slot */}
                                                        <div className="w-24 flex flex-col items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-lg">
                                                            <label className="flex flex-col items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                                                <Plus className="w-4 h-4 text-gray-400" />
                                                                <span>Add</span>
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
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Package Pricing */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <IndianRupee className="w-6 text-white h-6" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-gray-900">Package Pricing</h2>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-6">
                                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Select Package Category</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(selectedItinerary.packagePricing || {}).map(([key, defaultPrice]) => (
                                                    <div key={key} className="relative">
                                                        <input
                                                            type="radio"
                                                            id={`category-${key}`}
                                                            name="packageCategory"
                                                            value={key}
                                                            checked={selectedCategory === key}
                                                            onChange={(e) => handleCategorySelection(e.target.value)}
                                                            className="sr-only peer"
                                                        />
                                                        <label
                                                            htmlFor={`category-${key}`}
                                                            className="flex flex-col p-4 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all duration-200"
                                                        >
                                                            <span className="font-semibold text-gray-900 capitalize mb-2">{key}</span>
                                                            <span className="text-sm text-gray-600">Base: ₹{defaultPrice}</span>
                                                            {selectedCategory === key && (
                                                                <div className="mt-3 space-y-3">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Price</label>
                                                                        <input
                                                                            type="text"
                                                                            pattern="[0-9]*"
                                                                            inputMode="numeric"
                                                                            value={
                                                                                itineraryData.pricing?.[selectedCategory] === ""
                                                                                    ? ""
                                                                                    : (itineraryData.pricing?.[selectedCategory] ?? selectedItinerary.packagePricing[selectedCategory] ?? "")
                                                                            }
                                                                            onChange={(e) => updatePricing(selectedCategory, e.target.value)}
                                                                            onKeyDown={handleNumericInput}
                                                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                            placeholder="Enter price"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Optional)</label>
                                                                        <input
                                                                            type="text"
                                                                            pattern="[0-9]*"
                                                                            inputMode="numeric"
                                                                            value={itineraryData.offers?.[selectedCategory] === "" ? "" : (itineraryData.offers?.[selectedCategory] ?? "")}
                                                                            onChange={(e) => updateOffer(selectedCategory, e.target.value)}
                                                                            onKeyDown={handleNumericInput}
                                                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                            placeholder="Enter Discount Price"
                                                                            disabled={
                                                                                !(
                                                                                    itineraryData.pricing?.[selectedCategory] ??
                                                                                    selectedItinerary.packagePricing[selectedCategory]
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* NEW: Festival Offer Section - Show in Edit Mode if Missing */}
                                    {isEditMode && (!bookingall.itineraryData.festivalOffer || bookingall.itineraryData.festivalOffer.value === 0) && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                                            <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Add Festival Offer (Recommended for Updates)
                                            </h4>
                                            <div className="space-y-4">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={itineraryData.festivalOffer.selected}
                                                        onChange={toggleFestivalOffer}
                                                        className="h-5 w-5 text-yellow-600 focus:ring-yellow-500"
                                                    />
                                                    <span className="text-sm font-medium text-yellow-800">Enable Festival Offer</span>
                                                </label>
                                                {itineraryData.festivalOffer.selected && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title</label>
                                                            <input
                                                                type="text"
                                                                value={itineraryData.festivalOffer.name}
                                                                onChange={(e) => updateFestivalOffer("name", e.target.value)}
                                                                placeholder="e.g., Diwali Special 10% OFF"
                                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={itineraryData.festivalOffer.value === 0 ? "" : itineraryData.festivalOffer.value}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    // Empty string allow karen taaki user 0 type kar sake
                                                                    updateFestivalOffer("value", val === "" ? 0 : parseFloat(val));
                                                                }}
                                                                placeholder="10"
                                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            />
                                                        </div>

                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Booking Amount */}
                                    <div className="bg-gray-50 border border-gray-200 text-lg font-semibold rounded-2xl p-4 sm:p-6 space-y-4">
                                        {resive ? `Received Amount` : "Booking Amount"}
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">Price</label>
                                            <input
                                                type="text"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                value={itineraryData.bookingAmount === "" ? "" : itineraryData.bookingAmount}
                                                onChange={(e) =>
                                                    setItineraryData({ ...itineraryData, bookingAmount: e.target.value === "" ? "" : Number.parseFloat(e.target.value) || 0 })
                                                }
                                                onKeyDown={handleNumericInput}
                                                placeholder="5000"
                                            />
                                        </div>
                                    </div>

                                    {/* Vehicle Selection */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-4">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Vehicle</h3>
                                        <select
                                            className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            value={itineraryData.vehicle?._id || ""}
                                            onChange={(e) => {
                                                const selected = vehicles.find((v) => v._id === e.target.value);
                                                setItineraryData({ ...itineraryData, vehicle: selected || {} });
                                            }}
                                        >
                                            <option value="">Select Vehicle</option>
                                            {vehicles.map((v) => (
                                                <option key={v._id} value={v._id}>
                                                    {v.make} {v.model}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Highlight Price */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-4">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Final Price</h3>
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">Price</label>
                                            <input
                                                type="text"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                value={itineraryData.highlightPrice === "" ? "" : itineraryData.highlightPrice}
                                                onChange={(e) => updateHighlightPrice(e.target.value)}
                                                onKeyDown={handleNumericInput}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-6 mt-4">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="priceType"
                                                    value="perPerson"
                                                    checked={itineraryData.priceType === "perPerson"}
                                                    onChange={() => updatePriceType("perPerson")}
                                                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-lg text-gray-700">Per Person</span>
                                            </label>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="priceType"
                                                    value="Whole Group/Family"
                                                    checked={itineraryData.priceType === "Whole Group/Family"}
                                                    onChange={() => updatePriceType("Whole Group/Family")}
                                                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-lg text-gray-700">Whole Group/Family</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Select Hotels by Day & Meal - Updated to match create */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-12 space-y-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                            Select Hotels by Day & Meal ({selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)})
                                        </h3>
                                        <div className="mb-6">
                                            <label className="block text-lg font-semibold text-gray-700 mb-3">Hotel Category</label>
                                            <select
                                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                value={selectedCategory}
                                                disabled
                                                onChange={(e) => handleCategorySelection(e.target.value)}
                                            >
                                                {categories.map((category) => (
                                                    <option key={category._id} value={category.name.toLowerCase()}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {itineraryData.days
                                            ?.filter(day => day.locations?.every(loc => loc.toLowerCase() !== "departure"))
                                            .map((day, dayIndex) => {
                                                // Check if this day has "no hotels booked" flag
                                                const normalize = (s) =>
                                                    s.toLowerCase().trim().replace(/\s+/g, " ");
                                                const normCat = normalize(selectedCategory);
                                                const matchedCategory = Object.keys(bookingall.hotelSelectionDays || {}).find(
                                                    (k) => normalize(k) === normCat
                                                );
                                                const savedDays = bookingall.hotelSelectionDays?.[matchedCategory] || {};
                                                const isDayHotelsDisabled =
                                                    hotelSelectionDays[selectedCategory]?.[day.id] === true;

                                                // ✅ Define isStayOnly variable HERE
                                                const isStayOnly =
                                                    itineraryData.stayOnlyDays?.[selectedCategory]?.[day.id] === true ||
                                                    itineraryData.stayOnlyDays?.[selectedCategory]?.[String(day.id)] === true ||
                                                    (hotelSelections[day.id] &&
                                                        Object.values(hotelSelections[day.id]).some(loc =>
                                                            Object.keys(loc).includes('stayOnly')
                                                        ));

                                                return (
                                                    <div key={day.id} className="mb-12 border-b pb-8 last:border-b-0 last:mb-0">
                                                        {/* Day Header with checkboxes */}
                                                        <div className="flex items-center gap-3 mb-6">
                                                            {/* No Hotels Checkbox */}

                                                            <label
                                                                htmlFor={`day-hotels-${selectedCategory}-${day.id}`}
                                                                className="text-lg sm:text-xl font-semibold text-gray-900 mb-0 cursor-pointer flex items-center gap-2"
                                                            >
                                                                <span className="bg-blue-800 px-2 text-white rounded-full">Night {day.id} </span>
                                                            </label>

                                                            {isDayHotelsDisabled && (
                                                                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full ml-auto">
                                                                    ✓ No Hotels Booked
                                                                </span>
                                                            )}

                                                            {/* ✅ Stay Only Checkbox */}
                                                            <div className="flex items-center gap-3 ml-auto">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`stay-only-${selectedCategory}-${day.id}`}
                                                                    checked={isStayOnly}
                                                                    onChange={(e) => {
                                                                        const isChecked = e.target.checked;

                                                                        // Update stayOnlyDays in itineraryData
                                                                        setItineraryData(prev => {
                                                                            const updated = { ...prev };
                                                                            if (!updated.stayOnlyDays) {
                                                                                updated.stayOnlyDays = {};
                                                                            }
                                                                            if (!updated.stayOnlyDays[selectedCategory]) {
                                                                                updated.stayOnlyDays[selectedCategory] = {};
                                                                            }
                                                                            updated.stayOnlyDays[selectedCategory][day.id] = isChecked;
                                                                            updated.stayOnlyDays[selectedCategory][String(day.id)] = isChecked;
                                                                            return updated;
                                                                        });

                                                                        if (isChecked) {
                                                                            // Clear regular meals, keep stayOnly
                                                                            setHotelSelections(prev => {
                                                                                const newSelections = { ...prev };
                                                                                if (newSelections[day.id]) {
                                                                                    // Remove breakfast/lunch/dinner, keep only stayOnly
                                                                                    Object.keys(newSelections[day.id]).forEach(loc => {
                                                                                        const meals = newSelections[day.id][loc];
                                                                                        Object.keys(meals).forEach(meal => {
                                                                                            if (meal !== 'stayOnly') {
                                                                                                delete meals[meal];
                                                                                            }
                                                                                        });
                                                                                        // Remove empty locations
                                                                                        if (Object.keys(meals).length === 0) {
                                                                                            delete newSelections[day.id][loc];
                                                                                        }
                                                                                    });
                                                                                    // Clean empty day
                                                                                    if (Object.keys(newSelections[day.id]).length === 0) {
                                                                                        delete newSelections[day.id];
                                                                                    }
                                                                                }
                                                                                return newSelections;
                                                                            });
                                                                        } else {
                                                                            // Restore full meal selections, remove stayOnly
                                                                            setHotelSelections(prev => {
                                                                                const newSel = { ...prev };
                                                                                // First, remove stayOnly from current
                                                                                if (newSel[day.id]) {
                                                                                    Object.keys(newSel[day.id]).forEach(loc => {
                                                                                        const meals = newSel[day.id][loc];
                                                                                        delete meals.stayOnly;
                                                                                        if (Object.keys(meals).length === 0) {
                                                                                            delete newSel[day.id][loc];
                                                                                        }
                                                                                    });
                                                                                    if (Object.keys(newSel[day.id]).length === 0) {
                                                                                        delete newSel[day.id];
                                                                                    }
                                                                                }
                                                                                // Restore meals from itineraryData.hotels (without stayOnly)
                                                                                if (itineraryData.hotels?.[day.id]) {
                                                                                    const restoredDay = {};
                                                                                    Object.entries(itineraryData.hotels[day.id]).forEach(([loc, meals]) => {
                                                                                        const filteredMeals = {};
                                                                                        Object.entries(meals).forEach(([meal, hotelId]) => {
                                                                                            if (meal !== 'stayOnly') {
                                                                                                filteredMeals[meal] = hotelId;
                                                                                            }
                                                                                        });
                                                                                        if (Object.keys(filteredMeals).length > 0) {
                                                                                            restoredDay[loc] = filteredMeals;
                                                                                        }
                                                                                    });
                                                                                    if (Object.keys(restoredDay).length > 0) {
                                                                                        newSel[day.id] = {
                                                                                            ...(newSel[day.id] || {}),
                                                                                            ...restoredDay
                                                                                        };
                                                                                    } else if (!newSel[day.id]) {
                                                                                        delete newSel[day.id];
                                                                                    }
                                                                                } else {
                                                                                    // If no itineraryData, just ensure day is cleaned
                                                                                    delete newSel[day.id];
                                                                                }
                                                                                return newSel;
                                                                            });

                                                                            // ✅ FIX: Also remove stayOnly from itineraryData.hotels to prevent zombie state
                                                                            setItineraryData(prev => {
                                                                                const newHotels = { ...prev.hotels };
                                                                                if (newHotels[day.id]) {
                                                                                    const newDayHotels = { ...newHotels[day.id] };
                                                                                    let hasChanges = false;

                                                                                    Object.keys(newDayHotels).forEach(loc => {
                                                                                        if (newDayHotels[loc]?.stayOnly) {
                                                                                            const newLocMeals = { ...newDayHotels[loc] };
                                                                                            delete newLocMeals.stayOnly;
                                                                                            newDayHotels[loc] = newLocMeals;
                                                                                            hasChanges = true;
                                                                                        }
                                                                                    });

                                                                                    if (hasChanges) {
                                                                                        newHotels[day.id] = newDayHotels;
                                                                                    }
                                                                                }
                                                                                return {
                                                                                    ...prev,
                                                                                    hotels: newHotels
                                                                                };
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="w-3 h-3 text-orange-600 accent-green-600 rounded "
                                                                />
                                                                <label
                                                                    htmlFor={`stay-only-${selectedCategory}-${day.id}`}
                                                                    className="text-sm font-medium text-blue-700 cursor-pointer flex items-center gap-2"
                                                                >
                                                                    {/* <Moon size={16} className="text-orange-600" /> */}
                                                                    EPAI Plan Only
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Show hotels section only if checkbox is NOT checked */}
                                                        {!isDayHotelsDisabled ? (
                                                            isStayOnly ? (
                                                                // 🏨 STAY ONLY MODE
                                                                <div className="space-y-4">
                                                                    <div className="p-4  border  rounded-lg">
                                                                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                            <Moon className="w-4 h-4" />
                                                                            Stay Only - Accommodation Only (No Meals)
                                                                        </h5>

                                                                        {day.locations?.filter((location) => location.toLowerCase() !== "departure")?.map((location, locIndex) => {
                                                                            return (
                                                                                <div key={`${day.id}-${location}-${locIndex}`} className="mb-4 p-3 rounded-lg bg-white border  last:mb-0">
                                                                                    <h6 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                                                                                        <MapPin className="w-4 h-4 text-gray-600" /> {location}
                                                                                    </h6>

                                                                                    <div className="space-y-4">
                                                                                        <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                            <Moon className="w-4 h-4 text-gray-600" /> Stay Hotel
                                                                                        </label>
                                                                                        <select
                                                                                            className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                                                                            value={hotelSelections[day.id]?.[location]?.stayOnly || ""}
                                                                                            onChange={(e) => updateHotelSelection(day.id, location, "stayOnly", e.target.value)}
                                                                                        >
                                                                                            <option value="">Select Stay Hotel</option>
                                                                                            {getFilteredHotels(location, selectedCategory, day.id).map((hotel) => (
                                                                                                <option key={hotel._id} value={hotel._id}>
                                                                                                    {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                        {hotelSelections[day.id]?.[location]?.stayOnly && (
                                                                                            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4  p-4 rounded-lg border ">
                                                                                                <FastLazyImage
                                                                                                    src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.image}`}
                                                                                                    alt="Hotel"
                                                                                                    className="w-32 h-32 object-cover rounded-xl"
                                                                                                />
                                                                                                <div className="flex-1">
                                                                                                    <h5 className="font-medium text-gray-900">
                                                                                                        {hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.name}
                                                                                                    </h5>
                                                                                                    <p className="text-sm text-gray-600">
                                                                                                        {hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.rating}★ (
                                                                                                        {hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.reviews} reviews)
                                                                                                    </p>
                                                                                                </div>
                                                                                                <button
                                                                                                    onClick={() => removeHotelSelection(day.id, location, "stayOnly")}
                                                                                                    className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                                                >
                                                                                                    <Trash2 className="w-5 h-5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // 🍽️ NORMAL MODE - Regular meals
                                                                <>
                                                                    {day.locations?.filter((location) => location.toLowerCase() !== "departure")?.map((location, locIndex) => (
                                                                        <div
                                                                            key={`${day.id}-${location}-${locIndex}`}
                                                                            className="mb-8 bg-white p-4 rounded-2xl space-y-4 border border-gray-200"
                                                                        >
                                                                            <h5 className="inline-flex w-fit items-center gap-2 text-base font-medium bg-blue-600 text-white mb-4 px-2 py-1 rounded-lg">
                                                                                <MapPin className="w-4 h-4" /> {location}
                                                                            </h5>

                                                                            <div className="space-y-4">
                                                                                <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                    <Coffee className="w-4 h-4" /> Breakfast Hotel
                                                                                </label>
                                                                                <select
                                                                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                                    value={hotelSelections[day.id]?.[location]?.breakfast || ""}
                                                                                    onChange={(e) => updateHotelSelection(day.id, location, "breakfast", e.target.value)}
                                                                                >
                                                                                    <option value="">Select Breakfast Hotel</option>
                                                                                    {getFilteredHotels(location, selectedCategory, day.id).map((hotel) => (
                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                            {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {hotelSelections[day.id]?.[location]?.breakfast && (
                                                                                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                                                                        <FastLazyImage
                                                                                            src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].breakfast)?.image}`}
                                                                                            alt="Hotel"
                                                                                            className="w-32 h-32 object-cover rounded-xl"
                                                                                        />
                                                                                        <div className="flex-1">
                                                                                            <h5 className="font-medium text-gray-900">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].breakfast)?.name}
                                                                                            </h5>
                                                                                            <p className="text-sm text-gray-600">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].breakfast)?.rating}★ (
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].breakfast)?.reviews} reviews)
                                                                                            </p>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => removeHotelSelection(day.id, location, "breakfast")}
                                                                                            className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                                        >
                                                                                            <Trash2 className="w-5 h-5" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                    <CupSoda className="w-4 h-4" /> Lunch Hotel
                                                                                </label>
                                                                                <select
                                                                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                                    value={hotelSelections[day.id]?.[location]?.lunch || ""}
                                                                                    onChange={(e) => updateHotelSelection(day.id, location, "lunch", e.target.value)}
                                                                                >
                                                                                    <option value="">Select Lunch Hotel</option>
                                                                                    {getFilteredHotels(location, selectedCategory, day.id).map((hotel) => (
                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                            {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {hotelSelections[day.id]?.[location]?.lunch && (
                                                                                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                                                                        <FastLazyImage
                                                                                            src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].lunch)?.image}`}
                                                                                            alt="Hotel"
                                                                                            className="w-32 h-32 object-cover rounded-xl"
                                                                                        />
                                                                                        <div className="flex-1">
                                                                                            <h5 className="font-medium text-gray-900">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].lunch)?.name}
                                                                                            </h5>
                                                                                            <p className="text-sm text-gray-600">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].lunch)?.rating}★ (
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].lunch)?.reviews} reviews)
                                                                                            </p>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => removeHotelSelection(day.id, location, "lunch")}
                                                                                            className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                                        >
                                                                                            <Trash2 className="w-5 h-5" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                    <CupSoda className="w-4 h-4" /> Dinner Hotel
                                                                                </label>
                                                                                <select
                                                                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                                                    value={hotelSelections[day.id]?.[location]?.dinner || ""}
                                                                                    onChange={(e) => updateHotelSelection(day.id, location, "dinner", e.target.value)}
                                                                                >
                                                                                    <option value="">Select Dinner Hotel</option>
                                                                                    {getFilteredHotels(location, selectedCategory, day.id).map((hotel) => (
                                                                                        <option key={hotel._id} value={hotel._id}>
                                                                                            {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {hotelSelections[day.id]?.[location]?.dinner && (
                                                                                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                                                                        <FastLazyImage
                                                                                            src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].dinner)?.image}`}
                                                                                            alt="Hotel"
                                                                                            className="w-32 h-32 object-cover rounded-xl"
                                                                                        />
                                                                                        <div className="flex-1">
                                                                                            <h5 className="font-medium text-gray-900">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].dinner)?.name}
                                                                                            </h5>
                                                                                            <p className="text-sm text-gray-600">
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].dinner)?.rating}★ (
                                                                                                {hotels.find((h) => h._id === hotelSelections[day.id][location].dinner)?.reviews} reviews)
                                                                                            </p>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => removeHotelSelection(day.id, location, "dinner")}
                                                                                            className="text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                                                                                        >
                                                                                            <Trash2 className="w-5 h-5" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            )
                                                        ) : (
                                                            /* No Hotels Message */
                                                            <div className="p-4 bg-gray-50 border  rounded-lg flex items-start gap-3">
                                                                <p className="text-sm text-gray-800 font-medium">
                                                                    No hotels will be booked for this day. Guest will arrange their own accommodation.
                                                                </p>
                                                            </div>
                                                        )}


                                                        <div className="grid my-3 grid-cols-[auto_1fr] items-center gap-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`day-hotels-${selectedCategory}-${day.id}`}
                                                                checked={isDayHotelsDisabled}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;

                                                                    // Update hotelSelectionDays state
                                                                    setHotelSelectionDays((prev) => {
                                                                        const updated = { ...prev };
                                                                        if (!updated[selectedCategory]) {
                                                                            updated[selectedCategory] = {};
                                                                        }
                                                                        // Set both formats (number and string)
                                                                        updated[selectedCategory][day.id] = isChecked;
                                                                        updated[selectedCategory][String(day.id)] = isChecked;
                                                                        return updated;
                                                                    });

                                                                    // Also update bookingall if in edit mode
                                                                    if (isEditMode && bookingall) {
                                                                        setbookingall(prev => {
                                                                            const updated = { ...prev };
                                                                            if (!updated.hotelSelectionDays) {
                                                                                updated.hotelSelectionDays = {};
                                                                            }
                                                                            if (!updated.hotelSelectionDays[selectedCategory]) {
                                                                                updated.hotelSelectionDays[selectedCategory] = {};
                                                                            }
                                                                            updated.hotelSelectionDays[selectedCategory][day.id] = isChecked;
                                                                            return updated;
                                                                        });
                                                                    }

                                                                    // If checked (no hotels), remove hotels for this day
                                                                    if (isChecked) {
                                                                        setHotelSelections((prev) => {
                                                                            const newSelections = { ...prev };
                                                                            if (newSelections[day.id]) {
                                                                                delete newSelections[day.id];
                                                                            }
                                                                            return newSelections;
                                                                        });

                                                                        setItineraryData((prev) => {
                                                                            const newHotels = { ...prev.hotels };
                                                                            if (newHotels[day.id]) {
                                                                                delete newHotels[day.id];
                                                                            }
                                                                            return { ...prev, hotels: newHotels };
                                                                        });
                                                                    } else {
                                                                        // Restore hotels if unchecked
                                                                        if (itineraryData.hotels?.[day.id]) {
                                                                            setHotelSelections((prev) => ({
                                                                                ...prev,
                                                                                [day.id]: itineraryData.hotels[day.id],
                                                                            }));
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-3 h-3 text-orange-600 accent-green-600 rounded "
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

                            <div className="flex justify-between pt-8 px-4 sm:px-0">
                                <button
                                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
                                    onClick={() => setStep("itinerary-selection")}
                                >
                                    Back to Selection
                                </button>
                                <button
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
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
            <div ref={componentRef} className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl px-8 py-6 overflow-hidden">
                        <div className="bg-blue-600 text-white p-8 mb-6 rounded-t-2xl -mx-8 -mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
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
                                        <h1 className="text-2xl font-bold">Booking Preview</h1>
                                        <p className="text-blue-100 text-sm">Review your customized itinerary</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button
                                        className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
                                        onClick={() => setStep("itinerary-builder")}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span>Back</span>
                                    </button>
                                    <button
                                        className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-2"
                                        onClick={sendWhatsAppMessage}
                                    >
                                        <FontAwesomeIcon icon={faWhatsapp} />
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
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

                        <div id="itinerary-preview" className="space-y-12">
                            {/* Hero Section - Removed Gradient, Used Solid Blue */}
                            <div className="relative bg-blue-600 rounded-3xl overflow-hidden mb-12 shadow-lg">
                                <FastLazyImage
                                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                                    alt="Destination"
                                    className="absolute inset-0 w-full h-64 sm:h-80 object-cover opacity-50"
                                />
                                <div className="relative z-10 p-6 sm:p-12 text-white">
                                    <div className="flex flex-col sm:flex-row justify-between items-start">
                                        <div className="flex-1">
                                            <div className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                                                {calculateDuration(selectedItinerary)}
                                            </div>
                                            <h1 className="text-4xl sm:text-6xl font-bold mb-4 leading-tight">
                                                {itineraryData?.titles?.[0] || selectedItinerary?.titles?.[0] || "Travel Package"}
                                            </h1>
                                            <p className="text-2xl opacity-90 mb-6 font-medium">
                                                {itineraryData?.days?.length || selectedItinerary?.days?.length || 0} Days Amazing Journey
                                            </p>
                                            {selectedCategory &&
                                                (itineraryData.pricing[selectedCategory] > 0 ||
                                                    selectedItinerary.packagePricing?.[selectedCategory]) && (
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                                                        <h3 className="text-xl font-bold mb-4">Selected Package</h3>
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                            <span className="capitalize font-semibold text-lg">{selectedCategory} Category</span>
                                                            <div className="text-left sm:text-right mt-2 sm:mt-0">
                                                                <span className="text-3xl font-bold">
                                                                    ₹
                                                                    {(() => {
                                                                        const basePrice = itineraryData.pricing[selectedCategory] || selectedItinerary.packagePricing?.[selectedCategory] || 0;
                                                                        const categoryDiscount = itineraryData.offers?.[selectedCategory] || 0;
                                                                        const priceAfterCategoryDiscount = basePrice - categoryDiscount;

                                                                        const festivalDiscount = itineraryData.festivalOffer?.selected && itineraryData.festivalOffer?.value > 0
                                                                            ? (priceAfterCategoryDiscount * itineraryData.festivalOffer.value / 100)
                                                                            : 0;

                                                                        const finalPrice = priceAfterCategoryDiscount - festivalDiscount;
                                                                        return finalPrice.toFixed(2);
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}
                                        </div>
                                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                                <p className="text-2xl font-bold">₹{itineraryData.highlightPrice}</p>
                                                <p className="text-sm opacity-80 capitalize">{itineraryData.priceType}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Details and Package Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Client Details</h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Name:</span>
                                            <span className="text-gray-900">{clientDetails.name}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Email:</span>
                                            <span className="text-gray-900">{clientDetails.email}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Phone:</span>
                                            <span className="text-gray-900">{clientDetails.phone}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Travel Date:</span>
                                            <span className="text-gray-900">
                                                {clientDetails.travelDate}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Travelers:</span>
                                            <span className="text-gray-900">{clientDetails.travelers}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Package Summary</h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Duration:</span>
                                            <span className="text-gray-900">{calculateDuration(selectedItinerary)}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium text-gray-700">Category:</span>
                                            <span className="text-gray-900 capitalize">{selectedCategory || "Not Selected"}</span>
                                        </div>
                                        {selectedCategory && itineraryData.pricing[selectedCategory] > 0 && (
                                            <>
                                                <div className="flex justify-between text-base">
                                                    <span className="font-medium text-gray-700">Base Price:</span>
                                                    <span className="text-gray-900">₹{itineraryData.pricing[selectedCategory]}</span>
                                                </div>
                                                {itineraryData.offers[selectedCategory] > 0 && (
                                                    <div className="flex justify-between text-base">
                                                        <span className="font-medium text-gray-700">Discount Price:</span>
                                                        <span className="text-green-600 font-semibold">
                                                            ₹{itineraryData.offers[selectedCategory]}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Festival Offer Discount */}
                                                {itineraryData.festivalOffer?.selected && itineraryData.festivalOffer?.value > 0 && (() => {
                                                    const basePrice = itineraryData.pricing?.[selectedCategory] || 0;
                                                    const categoryDiscount = itineraryData.offers?.[selectedCategory] || 0;
                                                    const priceAfterCategoryDiscount = basePrice - categoryDiscount;
                                                    const festivalDiscount = priceAfterCategoryDiscount * itineraryData.festivalOffer.value / 100;

                                                    console.log("Selected Category:", selectedCategory);
                                                    console.log("Base Price:", basePrice);
                                                    console.log("Category Discount:", categoryDiscount);
                                                    console.log("Price After Category Discount:", priceAfterCategoryDiscount);
                                                    console.log("Festival Value (%):", itineraryData.festivalOffer.value);
                                                    console.log("Festival Discount Amount:", festivalDiscount);

                                                    return (
                                                        <div className="flex justify-between text-base">
                                                            <span className="font-medium text-gray-700">Festival Offer Discount:</span>
                                                            <span className="text-green-600 font-semibold">
                                                                ₹{festivalDiscount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Total Amount After Discounts */}
                                                <div className="border-t pt-2 mt-2">
                                                    <div className="flex justify-between text-lg font-semibold">
                                                        <span className="text-gray-900">Total Amount:</span>
                                                        <span className="text-blue-600">
                                                            ₹{(() => {
                                                                const basePrice = itineraryData.pricing?.[selectedCategory] || 0;
                                                                const categoryDiscount = itineraryData.offers?.[selectedCategory] || 0;
                                                                const priceAfterCategoryDiscount = basePrice - categoryDiscount;

                                                                const festivalDiscount = itineraryData.festivalOffer?.selected && itineraryData.festivalOffer.value > 0
                                                                    ? (priceAfterCategoryDiscount * itineraryData.festivalOffer.value / 100)
                                                                    : 0;

                                                                const total = priceAfterCategoryDiscount - festivalDiscount;

                                                                console.log("Total Amount Calculation:");
                                                                console.log("Base Price:", basePrice);
                                                                console.log("Category Discount:", categoryDiscount);
                                                                console.log("Price After Category Discount:", priceAfterCategoryDiscount);
                                                                console.log("Festival Discount:", festivalDiscount);
                                                                console.log("Total Amount:", total);

                                                                return total.toFixed(2);
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>


                                            </>
                                        )}
                                        <div className="flex justify-between text-base">
                                            {resive ? `Received Amount` : "Booking Amount:"}
                                            <span className="text-gray-900">₹{itineraryData.bookingAmount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Itinerary */}
                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                    Itinerary <span className="text-blue-600">{calculateDuration(selectedItinerary)} - Early Birds</span>
                                    {(itineraryData?.tourcode || selectedItinerary?.tourcode) && (
                                        <span className="ml-2 sm:ml-3 inline-block text-xs sm:text-sm text-muted-foreground">
                                            Code:{' '}
                                            <strong className="text-card-foreground">
                                                {itineraryData?.tourcode || selectedItinerary?.tourcode}
                                            </strong>
                                        </span>
                                    )}

                                </h2>
                                <p className="text-gray-600 mb-8 text-base">
                                    {(() => {
                                        if (!itineraryData?.days) return "";

                                        // Flatten all locations
                                        const allLocations = itineraryData.days
                                            .map(day => day.locations || [])
                                            .flat()
                                            .filter(loc =>
                                                loc && typeof loc === "string" && loc.toLowerCase() !== "departure"
                                            ); // 🔥 departure remove

                                        // Count frequency
                                        const counts = {};
                                        allLocations.forEach(loc => {
                                            counts[loc] = (counts[loc] || 0) + 1;
                                        });

                                        // Format
                                        const uniqueWithCount = Object.entries(counts).map(
                                            ([loc, count]) => (count > 0 ? `${loc} -${count}N` : loc)
                                        );

                                        return uniqueWithCount.join(" • ");
                                    })()}
                                </p>


                                <div className="space-y-10">
                                    {itineraryData.days.map((day, index) => {
                                        const travelDate = new Date(clientDetails.travelDate);
                                        const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);

                                        return (
                                            <div key={day.id} className="relative">
                                                {index < itineraryData.days.length - 1 && (
                                                    <div className="absolute left-9 top-20 w-0.5 h-full bg-gray-200 z-0"></div>
                                                )}
                                                <div className="flex gap-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-md">
                                                            {day.id}
                                                        </div>
                                                        <div className="text-center mt-3">
                                                            <div className="text-lg font-semibold text-gray-900">Day {day.id}</div>
                                                            <div className="text-sm text-gray-600">
                                                                {dayDate.toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                                            <div className="flex flex-col sm:flex-row">
                                                                <div className="w-full sm:w-48 h-48">
                                                                    <FastLazyImage
                                                                        src={
                                                                            day.images?.[0]?.startsWith("http")
                                                                                ? day.images[0]
                                                                                : `https://apitour.rajasthantouring.in${day.images?.[0]}` || "/majestic-mountain-vista.png"
                                                                        }
                                                                        alt={`Day ${day.id} destination`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 p-6">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-1-1h-2z" />
                                                                        </svg>
                                                                        <span className="text-lg text-gray-700 font-medium">
                                                                            {itineraryData.vehicle?.type ? (
                                                                                <>
                                                                                    {` ${itineraryData.vehicle.model} `}

                                                                                </>
                                                                            ) : (
                                                                                "Wagon R / Similar"
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                                                        {day.titles?.[0] || `${day.locations} Sightseeing`}
                                                                    </h3>
                                                                    <p className="text-gray-700 text-lg leading-relaxed">
                                                                        {day.descriptions && day.descriptions.length > 0
                                                                            ? day.descriptions.map((desc, i) => (
                                                                                <div key={desc._id || i} className="mb-3">
                                                                                    {typeof desc === "string" ? (
                                                                                        // Render HTML safely for rich text from ReactQuill
                                                                                        <div
                                                                                            className="prose prose-lg max-w-none"
                                                                                            dangerouslySetInnerHTML={{ __html: desc }}
                                                                                        />
                                                                                    ) : desc ? (
                                                                                        // Fallback for structured text
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


                            {/* Hotels Details */}
                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                    Hotels Details <span className="text-blue-600">{calculateDuration(selectedItinerary)}</span>
                                </h2>


                                <div className="space-y-10">
                                    {itineraryData.days.map((day, index) => {
                                        if (!day.locations) return null;
                                        const travelDate = new Date(clientDetails.travelDate);
                                        const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);

                                        return (
                                            <div key={day.id} className="relative">
                                                {index < itineraryData.days.length - 1 && (
                                                    <div className="absolute left-9 top-20 w-0.5 h-full bg-gray-200 z-0"></div>
                                                )}
                                                <div className="flex gap-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-md">
                                                            {day.id}
                                                        </div>
                                                        <div className="text-center mt-3">
                                                            <div className="text-lg font-semibold text-gray-900">Day {day.id}</div>
                                                            <div className="text-sm text-gray-600">
                                                                {dayDate.toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                                                {day.titles?.[0] || `Day ${day.id}`}
                                                            </h3>

                                                            {day.locations?.map((location, locIndex) => {
                                                                const locationHotels = hotelSelections[day.id]?.[location];
                                                                return (
                                                                    <div key={`${day.id}-${location}-${locIndex}`} className="mb-8 last:mb-0">
                                                                        <h4 className="inline-flex w-fit bg-blue-600 text-lg font-medium text-white px-2 rounded-lg mb-4 items-center gap-2">
                                                                            <MapPin className="w-4 h-4" /> {location}
                                                                        </h4>

                                                                        {locationHotels ? (
                                                                            <div className="space-y-4">
                                                                                {locationHotels.breakfast && (
                                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                                                        <span className="text-lg font-medium text-blue-600 min-w-[100px] flex items-center gap-2">
                                                                                            <Coffee className="w-4 h-4" /> Breakfast
                                                                                        </span>
                                                                                        {(() => {
                                                                                            const hotel = hotels.find((h) => h._id === locationHotels.breakfast);
                                                                                            return hotel ? (
                                                                                                <div className="flex items-center gap-4 flex-1">
                                                                                                    <FastLazyImage
                                                                                                        src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                        alt={hotel.name}
                                                                                                        className="w-24 h-20 object-cover rounded-xl shadow-sm"
                                                                                                    />
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-medium text-gray-900 text-base">{hotel.name}</div>
                                                                                                        <div className="text-sm text-gray-600">
                                                                                                            {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 text-sm">Hotel not found</span>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                                {locationHotels.lunch && (
                                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                                                        <span className="text-lg font-medium text-blue-600 min-w-[100px] flex items-center gap-2">
                                                                                            <CoffeeIcon className="w-4 h-4" /> Lunch
                                                                                        </span>
                                                                                        {(() => {
                                                                                            const hotel = hotels.find((h) => h._id === locationHotels.lunch);
                                                                                            return hotel ? (
                                                                                                <div className="flex items-center gap-4 flex-1">
                                                                                                    <FastLazyImage
                                                                                                        src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                        alt={hotel.name}
                                                                                                        className="w-24 h-20 object-cover rounded-xl shadow-sm"
                                                                                                    />
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-medium text-gray-900 text-base">{hotel.name}</div>
                                                                                                        <div className="text-sm text-gray-600">
                                                                                                            {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 text-sm">Hotel not found</span>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                                {locationHotels.dinner && (
                                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                                                        <span className="text-lg font-medium text-blue-600 min-w-[100px] flex items-center gap-2">
                                                                                            <CoffeeIcon className="w-4 h-4" /> Dinner
                                                                                        </span>
                                                                                        {(() => {
                                                                                            const hotel = hotels.find((h) => h._id === locationHotels.dinner);
                                                                                            return hotel ? (
                                                                                                <div className="flex items-center gap-4 flex-1">
                                                                                                    <FastLazyImage
                                                                                                        src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                        alt={hotel.name}
                                                                                                        className="w-24 h-20 object-cover rounded-xl shadow-sm"
                                                                                                    />
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-medium text-gray-900 text-base">{hotel.name}</div>
                                                                                                        <div className="text-sm text-gray-600">
                                                                                                            {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 text-sm">Hotel not found</span>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                                {locationHotels.stayOnly && (
                                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                                                        <span className="text-lg font-medium text-blue-600 min-w-[100px] flex items-center gap-2">

                                                                                            <FontAwesomeIcon icon={faBed} className="w-4 h-4" />
                                                                                            Stay Only

                                                                                        </span>
                                                                                        {(() => {
                                                                                            const hotel = hotels.find((h) => h._id === locationHotels.stayOnly);
                                                                                            return hotel ? (
                                                                                                <div className="flex items-center gap-4 flex-1">
                                                                                                    <FastLazyImage
                                                                                                        src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                        alt={hotel.name}
                                                                                                        className="w-24 h-20 object-cover rounded-xl shadow-sm"
                                                                                                    />
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-medium text-gray-900 text-base">{hotel.name}</div>
                                                                                                        <div className="text-sm text-gray-600">
                                                                                                            {hotel.rating}★ ({hotel.reviews} reviews)
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 text-sm">Hotel not found</span>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-sm text-gray-600 italic p-4 bg-gray-50 rounded-2xl">
                                                                                No hotels selected for this location yet
                                                                            </div>
                                                                        )}
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


                            {/* Theme Selection */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900">Theme Selection</h2>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Select Theme</h4>

                                    {/* Grid of themes */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {themes
                                            ?.filter(theme => theme.isActive)
                                            ?.map((theme) => (
                                                <div
                                                    key={theme._id}
                                                    className={`cursor-pointer border rounded-xl overflow-hidden p-2 transition-all duration-200
              ${selectedTheme?._id == theme._id ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:ring-2 hover:ring-gray-300"}`}
                                                    onClick={() => handleThemeSelection(theme._id)}
                                                >
                                                    {theme.imageUrl ? (
                                                        <FastLazyImage
                                                            src={`https://apitour.rajasthantouring.in${theme.imageUrl}`}
                                                            alt={theme.name}
                                                            className="w-full h-32 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg">
                                                            <p className="text-gray-500">{theme.name}</p>
                                                        </div>
                                                    )}
                                                    <p className="mt-2 text-center font-medium text-gray-900">{theme.name}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Selection */}
                            <div className="space-y-6 mt-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Contact Selection</h2>
                                </div>

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

                            {/* Inclusions, Exclusions, and Terms */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
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
                                                                                    <FastLazyImage src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`Inclusion image ${imgIndex + 1}`} className="w-full h-20 object-cover rounded" />
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
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                                                                    </svg>
                                                                </summary>
                                                                <div className="p-3 border-t border-gray-200">
                                                                    {item.images && item.images.length > 0 && (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <FastLazyImage key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
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
                                                                                    <FastLazyImage src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`Exclusion image ${imgIndex + 1}`} className="w-full h-20 object-cover rounded" />
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
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                                                                    </svg>
                                                                </summary>
                                                                <div className="p-3 border-t border-gray-200">
                                                                    {item.images && item.images.length > 0 && (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                            {item.images.map((imgUrl, imgIndex) => (
                                                                                <FastLazyImage key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <FastLazyImage key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <FastLazyImage key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="p-3 border-t border-gray-200">
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                    {item.images.map((imgUrl, imgIndex) => (
                                                                        <FastLazyImage key={imgIndex} src={`https://apitour.rajasthantouring.in/${imgUrl}`} alt={`${item.title} image ${imgIndex + 1}`} className="w-16 h-16 object-cover rounded" />
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

                                    {/* Addons Section - Editable */}
                                    <div className="p-4 my-3 sm:p-8 rounded-2xl border-t border-gray-300 bg-blue-50">
                                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                                            <h3 className="font-semibold text-blue-800 flex items-center gap-2 text-base sm:text-lg">
                                                <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                                                Add-ons
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {addons.map((addon, index) => (
                                                <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={addon.title}
                                                            onChange={(e) => {
                                                                const newAddons = [...addons];
                                                                newAddons[index].title = e.target.value;
                                                                setAddons(newAddons);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm mb-2"
                                                            placeholder="Addon Title"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={addon.value}
                                                            onChange={(e) => {
                                                                const newAddons = [...addons];
                                                                newAddons[index].value = parseFloat(e.target.value) || 0;
                                                                setAddons(newAddons);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                                            placeholder="Addon Price (₹)"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setAddons(addons.filter((_, i) => i !== index))}
                                                        className="ml-3 p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setAddons([...addons, { title: '', value: 0 }])}
                                                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add New Addon
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 sticky top-4 shadow-sm">
                                        <h3 className="text-xl font-semibold mb-6 text-gray-900">Price Summary</h3>
                                        <div className="space-y-4 text-lg">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700">
                                                    {clientDetails.adults || 2} Adults, {clientDetails.kids5to12 || 1} Kid (5-12 Years),
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700">
                                                    {clientDetails.kidsBelow5 || 1} Kid (Below 5 years)
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700">
                                                    {clientDetails.rooms || 1} Room with {clientDetails.extraBeds || 1} Extra mattress
                                                </span>
                                            </div>
                                            <div className="pt-4 space-y-3">
                                                {/* Actual Price */}
                                                <div className="flex justify-between text-gray-700 line-through">
                                                    <span>Actual Price</span>
                                                    <span>₹{itineraryData.pricing?.[selectedCategory] || 0}/-</span>
                                                </div>

                                                {/* Total Price after all discounts */}
                                                <div className="flex justify-between font-semibold text-2xl">
                                                    <span>Total Price</span>
                                                    <span>
                                                        ₹{(() => {
                                                            const basePrice = itineraryData.pricing?.[selectedCategory] || 0;
                                                            const categoryDiscount = itineraryData.offers?.[selectedCategory] || 0;
                                                            const festivalDiscount = itineraryData.festivalOffer?.selected
                                                                ? ((basePrice - categoryDiscount) * (itineraryData.festivalOffer.value || 0) / 100)
                                                                : 0;
                                                            const total = basePrice - categoryDiscount - festivalDiscount;
                                                            return total.toFixed(2);
                                                        })()}/-
                                                    </span>
                                                </div>

                                                {/* Booking Amount */}
                                                <div className="flex justify-between text-green-600">
                                                    {resive
                                                        ? `Received Amount (20%) `
                                                        : "Booking Amount (20%)"}
                                                    <span>₹{itineraryData.bookingAmount || 0}/-</span>
                                                </div>

                                                {/* Total Savings */}
                                                <div className="flex justify-between text-green-600 font-semibold">
                                                    <span>Total Savings</span>
                                                    <span>
                                                        {(() => {
                                                            const basePrice = itineraryData.pricing?.[selectedCategory] || 0;
                                                            const categoryDiscount = itineraryData.offers?.[selectedCategory] || 0;
                                                            const festivalDiscount = itineraryData.festivalOffer?.selected
                                                                ? ((basePrice - categoryDiscount) * (itineraryData.festivalOffer.value || 0) / 100)
                                                                : 0;
                                                            const totalSavings = categoryDiscount + festivalDiscount;
                                                            return totalSavings.toFixed(2);
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                        {/* <button
                                            onClick={() => saveBookingToDatabase("Booked")}
                                            className="w-full mt-8 bg-blue-600 text-white rounded-xl py-4 font-semibold hover:bg-blue-700 transition-colors duration-200"
                                        >
                                            Book Now
                                        </button> */}
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 sm:px-8 pb-8 flex flex-col sm:flex-row justify-between gap-4">
                                <button
                                    className="px-6 sm:px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
                                    onClick={() => setStep("itinerary-builder")}
                                >
                                    Back to Edit
                                </button>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        className="px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                                        onClick={() => saveBookingToDatabase()}
                                        disabled={isSubmitting || currentBookingId}
                                    >
                                        {isSubmitting ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        className="px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                                        onClick={() => window.print()}
                                    >
                                        Download PDF
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null
}