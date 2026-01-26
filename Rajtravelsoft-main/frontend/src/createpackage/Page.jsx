"use client"

import axios from "axios"
import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';
import { Trash2, MapPin, Coffee, CoffeeIcon, Upload, Plus, IndianRupee, CarFront, Moon, User, Phone, Mail, LocationEdit, Bed } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

export default function BookingPage() {
  const componentRef = useRef(null);
  const [step, setStep] = useState("client-details")
  const searchParams = new URLSearchParams(window.location.search);

  const [clientDetails, setClientDetails] = useState({
    title: "", // ✅ Added title field
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

  // ✅ Auto-fill client details from URL on first render
  useEffect(() => {
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    setClientDetails((prev) => ({
      ...prev,
      name: name || prev.name,
      email: email || prev.email,
      phone: phone || prev.phone,
    }));
  }, []);

  // console.log(clientDetails, "sssssssssssssss");


  const [searchTerm, setSearchTerm] = useState("")
  const [tourCodeFilter, setTourCodeFilter] = useState("")
  const [itineraries, setItineraries] = useState([])
  const [hotels, setHotels] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedItinerary, setSelectedItinerary] = useState(null)
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hotelSelectionDays, setHotelSelectionDays] = useState({});
  const [stayOnlyDays, setStayOnlyDays] = useState({});
  const [success, setSuccess] = useState("");
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [bookingInclusions, setBookingInclusions] = useState([]);
  const [bookingExclusions, setBookingExclusions] = useState([]);
  const [cancellationAndRefundPolicy, setCancellationAndRefundPolicy] = useState([]);
  const [travelRequirements, setTravelRequirements] = useState([]);
  const [resive, setresive] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null); // State to track selected theme
  const [themes, setThemes] = useState([]); // List of available themes
  const [structure, setStructure] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingInclusions, setEditingInclusions] = useState(false);
  const [editingExclusions, setEditingExclusions] = useState(false);
  const [editableInclusions, setEditableInclusions] = useState([]);
  const [editableExclusions, setEditableExclusions] = useState([]);
  const [selectedSpecialInclusions, setSelectedSpecialInclusions] = useState([]);

  // console.log(selectedItinerary);

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
    bookingAmount: 0,
    vehicle: {},
    hotels: {},
    highlightPrice: 0,
    hotelSelectionDays: {},
    stayOnlyDays: {},
    priceType: "Whole Group/Family",
    createby: null,
    festivalOffer: {
      name: "",
      value: 0,
      selected: false
    },

  })



useEffect(() => {
  setTimeout(() => {
    document.querySelectorAll("*")
      .forEach(el => el.scrollTo?.({ top: 0, behavior: "smooth" }));
  }, 50);
}, [step]);


  // Fetch single global document
  const fetchData = async () => {
    try {
      const res = await axios.get("https://apitour.rajasthantouring.in/api/tour-inclusion-exclusion");
      // console.log(res.data, "sadfasdf");

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

  useEffect(() => {
    fetchUser();
  }, []);







  // console.log(itineraryData)
  const [bookingId, setBookingId] = useState(null)
  const [bookingData, setBookingData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [durationFilter, setDurationFilter] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [vehicles, setVehicles] = useState([]);
  const [regulerId, setregulerId] = useState('');
  const [vehicleOptions, setvehicleOptions] = useState([]);
  const [hotelSelections, setHotelSelections] = useState({});
  const [params] = useSearchParams(); // ✅ Hook used correctly at top level
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isBookingSaved, setIsBookingSaved] = useState(false);

const [pendingInclusionTitles, setPendingInclusionTitles] = useState([]);

  // console.log(selectedCategory);





  const renderGuard = useRef(false);
  useEffect(() => {
    if (renderGuard.current) return;
    renderGuard.current = true;

    setTimeout(() => {
      renderGuard.current = false;
    }, 50);  // 50ms lock → all repeated renders blocked

  }, [itineraryData, selectedItinerary]);


  useEffect(() => {
    console.log("LOOP HERE ----> USEEFFECT 1");
  }, [selectedItinerary]);
  useEffect(() => {
    console.log("LOOP HERE ----> USEEFFECT 2");
  }, [itineraryData]);
  useEffect(() => {
    console.log("LOOP HERE ----> USEEFFECT 3");
  }, [selectedCategory]);
  useEffect(() => {
    console.log("LOOP HERE ----> USEEFFECT 4");
  }, [itineraryData.pricing]);






  useEffect(() => {
    if (themes.length > 0 && !selectedTheme) {
      // Default me first theme select kar do
      setSelectedTheme(themes[0]);
      handleThemeChange(themes[0]); // Agar aapke paas koi callback hai
    }
  }, [themes]);
  // const vehicleOptions = ["Wagon R / Similar", "Swift Dzire / Similar", "Innova / Similar", "Tempo Traveller", "Bus"]
  useEffect(() => {
    fetchItineraries()
    fetchHotels()
    fetchCategories()
    fetchLocations()
    fetchVehicles();
  }, [])




  useEffect(() => {
    if (structure?.contact?.length > 0) {
      setSelectedContact(structure.contact[0]);
    }
  }, [structure]);

  const handleContactChange = (contact) => {
    setSelectedContact(contact);
  };

  // console.log(selectedItinerary)







  // ✅ Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      const res = await axios.get("https://apitour.rajasthantouring.in/api/vehicles");
      // console.log(res);
      setVehicles(res.data);
      // database se vehicle options banaye (make + model + year etc.)
      const dbOptions = res.data.map(
        (v) => ` ${v.model} `
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

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Booking_${bookingId}`,

  });

  // Special inclusions that need to be selected
  const SPECIAL_INCLUSION_TITLES = ["Ranthambhore", "Jaisalmer Desert", "Ranthambhore Gypsy"];

  // Initialize local booking states from global after fetch
useEffect(() => {
  if (inclusions.length > 0 && exclusions.length > 0) {
    // Filter out special inclusions from auto-adding
    const filteredInclusions = inclusions.filter(
      inc => !SPECIAL_INCLUSION_TITLES.some(special =>
        inc.title.toLowerCase().includes(special.toLowerCase())
      )
    );
    
    // अगर pending booking नहीं है, तो केवल base inclusions set करो
    if (!bookingId) {
      setBookingInclusions(filteredInclusions);
    }
    
    setBookingExclusions(exclusions);
  }
}, [inclusions, exclusions, bookingId]);


// ============================================
// STEP 4: Special inclusions logic (IMPORTANT)
// ============================================
useEffect(() => {
  if (inclusions.length > 0) {
    // Base inclusions (non-special)
    const baseInclusions = inclusions.filter(
      inc => !SPECIAL_INCLUSION_TITLES.some(special =>
        inc.title.toLowerCase().includes(special.toLowerCase())
      )
    );

    // ✅ केवल SELECTED SPECIAL inclusions add करो (not pending वाले)
    const selectedSpecialIncs = inclusions.filter(
      inc => selectedSpecialInclusions.includes(inc.title)
    );

    // ✅ Combine करो: base + केवल selected special
    const finalInclusions = [...baseInclusions, ...selectedSpecialIncs];
    
    setBookingInclusions(finalInclusions);
  }
}, [selectedSpecialInclusions, inclusions]);
  // console.log(clientDetails);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";

    // If date is in DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split("-");
      return `${yyyy}-${mm}-${dd}`;  // return ISO format
    }

    // If date is in YYYY-MM-DD (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // If date looks like ISO with time
    if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    }

    // Otherwise fallback
    return dateStr;
  };




  const normalizeItineraryData = (bookingData) => {
    if (!bookingData.itineraryData) return bookingData;

    const itData = bookingData.itineraryData;

    // Fix pricing if it has nested object structure
    const fixedPricing = {};
    if (itData.pricing) {
      Object.entries(itData.pricing).forEach(([key, val]) => {
        if (typeof val === 'object' && val.value) {
          fixedPricing[key] = val.value;
        } else {
          fixedPricing[key] = val;
        }
      });
    }
    // Fix offers similarly
    const fixedOffers = {};
    if (itData.offers) {
      Object.entries(itData.offers).forEach(([key, val]) => {
        if (typeof val === 'object' && val.value) {
          fixedOffers[key] = val.value;
        } else {
          fixedOffers[key] = val;
        }
      });
    }

    return {
      ...bookingData,
      itineraryData: {
        ...itData,
        pricing: fixedPricing,
        offers: fixedOffers
      }

    };
  };


  useEffect(() => {
    const bookingId = params.get("bookingId");
    const step = params.get("step") || "client-details";
    const itineraryId = params.get("itineraryId");

    // ===========================
    //    EDIT MODE (bookingId)
    // ===========================
    if (bookingId) {
      const fetchBookingData = async () => {
        try {
          const res = await fetch(`https://apitour.rajasthantouring.in/api/pending/${bookingId}`);
          if (!res.ok) return toast.error("Failed to load booking");

          const booking = await res.json();

          // Normalize old itinerary structure
          const normalized = normalizeItineraryData(booking);
 // ✅ PENDING INCLUSIONS को store करो
      if (booking.inclusions && Array.isArray(booking.inclusions)) {
        const allPendingTitles = booking.inclusions.map(inc => inc.title);
        setPendingInclusionTitles(allPendingTitles);

        // Booking inclusions में सभी pending add करो
        setBookingInclusions(booking.inclusions);

        // ✅ जो special inclusions pending में थे, उन्हें auto-check करो
        const specialPendingTitles = allPendingTitles.filter(title => 
          SPECIAL_INCLUSION_TITLES.some(special =>
            title.toLowerCase().includes(special.toLowerCase())
          )
        );
        
        if (specialPendingTitles.length > 0) {
          setSelectedSpecialInclusions(specialPendingTitles);
        }
      }
          // Prefill client details
          setClientDetails({
            title: booking.clientDetails?.title || "",
            name: booking.clientDetails?.name || "",
            email: booking.clientDetails?.email || "",
            email2: booking.clientDetails?.email2 || "",
            phone: booking.clientDetails?.phone || "",
            adults: booking.clientDetails?.adults || "",
            kids5to12: booking.clientDetails?.kids5to12 || "",
            kidsBelow5: booking.clientDetails?.kidsBelow5 || "",
            rooms: booking.clientDetails?.rooms || "",
            extraBeds: booking.clientDetails?.extraBeds || "",
            travelDate: formatDateForInput(booking.clientDetails?.travelDate) || "",
            travelers: booking.clientDetails?.travelers || 1,
          });


          if (booking.noteText) {
            setNoteText(booking.noteText)
            setShowNote(true)
          }
          if (Array.isArray(booking.payments)) {
            const successPayment = booking.payments.find((p) => p.status === "success");

            if (successPayment) {
              setresive(true);
            }
          }
          if (booking.hotelSelectionDays) {
            // Data को normalize करें - सभी keys को string में convert करें
            const normalizedData = {};

            Object.entries(booking.hotelSelectionDays).forEach(([category, dayData]) => {
              normalizedData[category] = {};
              Object.entries(dayData).forEach(([dayId, value]) => {
                // दोनों string और numeric keys add करें
                normalizedData[category][dayId] = value;
                normalizedData[category][String(dayId)] = value;
                normalizedData[category][Number(dayId)] = value;
              });
            });

            // console.log("Normalized hotelSelectionDays:", normalizedData);
            setHotelSelectionDays(normalizedData)
          }
          if (booking.stayOnlyDays) {
            // Data को normalize करें - सभी keys को string में convert करें
            const normalizedData = {};

            Object.entries(booking.stayOnlyDays).forEach(([category, dayData]) => {
              normalizedData[category] = {};
              Object.entries(dayData).forEach(([dayId, value]) => {
                // दोनों string और numeric keys add करें
                normalizedData[category][dayId] = value;
                normalizedData[category][String(dayId)] = value;
                normalizedData[category][Number(dayId)] = value;
              });
            });

            // console.log("Normalized hotelSelectionDays:", normalizedData);
            setStayOnlyDays(normalizedData)
            setItineraryData(prev => ({
              ...prev,
              stayOnlyDays: normalizedData
            }));
          }



          if (booking.itineraryData?.hotels) {
            // console.log("✅ Loading hotels from booking:", booking.itineraryData.hotels);
            setItineraryData(prev => ({
              ...prev,
              hotels: booking.itineraryData.hotels
            }));
            // Also update hotelSelections for immediate display
            setHotelSelections(booking.itineraryData.hotels);
          }


          // Set received amount in your state




          setSelectedTheme(booking?.theme)
          setSelectedContact(booking.contact)

          // ============================
          //  PRELOAD ITINERARY DETAILS
          // ============================
          if (booking.selectedItinerary?._id) {
            let fullItinerary = null;

            try {
              const fullItRes = await fetch(
                `https://apitour.rajasthantouring.in/api/itineraries/${booking.selectedItinerary._id}`
              );

              if (fullItRes.ok) {
                fullItinerary = await fullItRes.json();
              } else {
                console.warn("⚠ Itinerary API failed. Using saved itinerary data.");
                fullItinerary = booking.selectedItinerary;
              }
            } catch (err) {
              console.warn("⚠ Itinerary API error. Using saved itinerary data.");
              fullItinerary = booking.selectedItinerary;
            }
            console.log("selecht akhtk ahdk sadklfas dkhl")
            // Merge pricing + offers only (No overwrite itinerary)
            handleItinerarySelect(fullItinerary, normalized.itineraryData);

            // =============================
            //  SET itineraryData from booking ONLY
            // =============================
            setItineraryData({
              titles: booking.itineraryData?.titles || [""],
              descriptions: booking.itineraryData?.descriptions || [""],
              date: booking.itineraryData?.date || "",
              images: booking.itineraryData?.images || [],
              duration: booking.itineraryData?.duration || "",
              days: booking.itineraryData?.days || [],

              tourcode: booking.itineraryData?.tourcode || "",
              itineraryTourcode: booking.itineraryData?.itineraryTourcode || "",

              pricing: booking.itineraryData?.pricing || {},
              offers: booking.itineraryData?.offers || {},
              bookingAmount: booking.itineraryData?.bookingAmount || {},

              // ⭐ ONLY 0 INDEX VEHICLE
              vehicle:
                Array.isArray(booking.itineraryData?.vehicle) &&
                  booking.itineraryData.vehicle.length > 0
                  ? booking.itineraryData.vehicle[0]
                  : {},

              hotels: {}, // Don't auto load hotels
              highlightPrice: booking.itineraryData?.highlightPrice || {},
              priceType: booking.itineraryData?.priceType || "Whole Group/Family",

              festivalOffer: booking.itineraryData?.festivalOffer || {
                name: "",
                value: 0,
                selected: false,
              },
            });

            // setHotelSelections({});
            setSelectedCategory(booking.selectedCategory || "");
            setregulerId(booking._id || "");
          }

          if (step === "itinerary-builder") setStep("itinerary-builder");
        } catch (err) {
          console.error(err);
          toast.error("Error loading booking");
        }
      };

      fetchBookingData();
      return;
    }

    // ===========================
    //    NEW BOOKING MODE
    // ===========================
    const name = params.get("name");
    const email = params.get("email");
    const phone = params.get("phone");
    const travelDate = params.get("travelDate");

    setClientDetails((prev) => ({
      ...prev,
      title: params.get("title") || "",
      name: name || prev.name,
      email: email || prev.email,
      email2: params.get("email2") || "",
      phone: phone || prev.phone,
      adults: params.get("adults") || "",
      kids5to12: params.get("kids5to12") || "",
      kidsBelow5: params.get("kidsBelow5") || "",
      rooms: params.get("rooms") || "",
      extraBeds: params.get("extraBeds") || "",
      travelDate: travelDate || prev.travelDate,
      travelers: Number(params.get("travelers") || 1),
    }));


    // Direct itinerary selection
    if (itineraryId) {
      fetch(`https://apitour.rajasthantouring.in/api/itineraries/${itineraryId}`)
        .then((res) => res.json())
        .then((itinerary) => handleItinerarySelect(itinerary))
        .catch(() => toast.error("Failed to load itinerary"));
    }

    if (step === "itinerary-builder") setStep("itinerary-builder");
  }, []);





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


  // Update useEffect to initialize pricing based on selected itinerary categories
  useEffect(() => {
    if (selectedItinerary && categories.length > 0) {
      // Initialize pricing object with categories from the selected itinerary or available categories
      const initialPricing = {}
      const initialOffers = {}

      categories.forEach((category) => {
        const categoryName = category.name.toLowerCase()
        initialPricing[categoryName] = 0
        initialOffers[categoryName] = 0
      })

      setItineraryData((prev) => ({
        ...prev,
        pricing: initialPricing,
        offers: initialOffers,
      }))
    }
  }, [selectedItinerary, categories])

  // ✅ Auto-fill booking amount to 20% of package price (after discount if any)
  useEffect(() => {
    if (selectedCategory && itineraryData.pricing[selectedCategory] > 0) {
      const basePrice = itineraryData.pricing[selectedCategory] || 0;
      const offerDiscount = itineraryData.offers[selectedCategory] || 0;
      const festivalPercent = itineraryData.festivalOffer?.value || 0;
      const priceAfterOffer = basePrice - offerDiscount;
      const festivalDiscount = (priceAfterOffer * festivalPercent) / 100;
      const finalPrice = Math.round(priceAfterOffer - festivalDiscount);

      const bookingAmount = Math.round(finalPrice * 0.20); // 20% of net price
      setItineraryData(prev => ({ ...prev, bookingAmount }));
    }
  }, [selectedCategory, itineraryData.pricing, itineraryData.offers]);

  // Auto-update highlightPrice when pricing, offers, or festivalOffer changes
  useEffect(() => {
    if (selectedCategory && itineraryData.pricing[selectedCategory] > 0) {
      const basePrice = itineraryData.pricing[selectedCategory] || 0;
      const offerDiscount = itineraryData.offers[selectedCategory] || 0;
      const festivalPercent = itineraryData.festivalOffer?.value || 0;
      const priceAfterOffer = basePrice - offerDiscount;
      const festivalDiscount = (priceAfterOffer * festivalPercent) / 100;
      const finalPrice = Math.round(priceAfterOffer - festivalDiscount);

      setItineraryData(prev => ({ ...prev, highlightPrice: finalPrice }));
    }
  }, [selectedCategory, itineraryData.pricing, itineraryData.offers, itineraryData.festivalOffer]);

  useEffect(() => {
    if (!selectedCategory) return;

    const normalize = (s) =>
      s.toLowerCase().trim().replace(/\s+/g, " ");

    const normCat = normalize(selectedCategory);

    // ✅ Hotel Selection Days ke liye
    const matchedHotelKey = Object.keys(hotelSelectionDays).find(
      (k) => normalize(k) === normCat
    );

    if (matchedHotelKey) {
      const savedDays = hotelSelectionDays[matchedHotelKey];
      const updatedSelections = {};

      itineraryData.days.forEach((day) => {
        const dayId = day.id;
        const isChecked =
          savedDays[dayId] === true ||
          savedDays[String(dayId)] === true;

        if (isChecked) {
          updatedSelections[dayId] = true;
        }
      });

      setHotelSelectionDays({
        [selectedCategory]: {
          ...hotelSelectionDays[selectedCategory],
          ...updatedSelections
        }
      });
    }

    // ✅ Stay Only Days ke liye (YE ADD KARO)
    const matchedStayKey = Object.keys(itineraryData.stayOnlyDays || {}).find(
      (k) => normalize(k) === normCat
    );

    if (matchedStayKey) {
      const savedStayDays = itineraryData.stayOnlyDays[matchedStayKey];

      // Normalize karo just like hotel days
      const normalizedStayData = {};
      Object.entries(savedStayDays).forEach(([dayId, value]) => {
        normalizedStayData[dayId] = value;
        normalizedStayData[String(dayId)] = value;
        normalizedStayData[Number(dayId)] = value;
      });

      // console.log("✅ Loading Stay Only Days:", normalizedStayData);

      // Update the state with normalized data
      setStayOnlyDays({
        [selectedCategory]: normalizedStayData
      });
    }

  }, [selectedCategory, itineraryData.days, itineraryData.stayOnlyDays]);


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
      // console.log("Hotels API failed, using static data")
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
      // console.log("Categories API failed, using static data")
      const mockCategories = [
        { _id: "1", name: "Standard" },
        { _id: "2", name: "Deluxe" },
        { _id: "3", name: "Super Deluxe" },
        { _id: "4", name: "Luxury" },
      ]
      setCategories(mockCategories)
    }
  }





  const sendWhatsAppMessage = () => {

    if (!bookingData) return

    const origin = window.location.origin
    const bookingLink = `https://tour.rajasthantouring.in/${bookingData.theme.link}/${bookingData._id}`;
    // Get the offers object safely
    const offers = bookingData.itineraryData?.offers || {}

    // Find the offer with the highest value
    const maxOfferEntry = Object.entries(offers).reduce(
      (max, [key, value]) => (value > max[1] ? [key, value] : max),
      ["none", 0],
    )

    // WhatsApp message (text encode hoga but link raw rahega)
    const message =
      `Hi ${bookingData.clientDetails.title} ${bookingData.clientDetails.name}!\n\n` +
      `Package: ${bookingData.itineraryData?.titles?.[0] || "N/A"}\n` +
      `Duration: ${calculateDuration(bookingData.itineraryData)}\n` +
      `Total Amount: ₹${bookingData.totalAmount || 0}/-\n` +
      `Offer Amount: ₹${maxOfferEntry[1] > 0 ? maxOfferEntry[1] : 0}/-\n` +
      `${resive ? "Received Amount" : "Booking Amount"
        }: ₹${resive
          ? (bookingData?.payments?.find(p => p.status === "success")?.amount || 0)
          : (bookingData?.itineraryData?.bookingAmount
            ? Object.values(bookingData.itineraryData.bookingAmount)
              .reduce((sum, v) => sum + (Number(v.value) || 0), 0)
            : 0)
        }/-\n\n`

        `You can view your booking details here:\n${bookingLink}\n\n` +
      `Thank you for choosing us for your travel needs!`

    const phone = bookingData.clientDetails.phone?.replace(/[^0-9]/g, "")
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, "_blank")
  }



  const handleDayStayToggle = (category, dayId, isChecked) => {
    // console.log(`🔄 Toggling Stay Only Day ${dayId} for ${category}: ${isChecked}`);

    setItineraryData(prev => {
      const updatedData = { ...prev };

      if (!updatedData.stayOnlyDays) {
        updatedData.stayOnlyDays = {};
      }
      if (!updatedData.stayOnlyDays[category]) {
        updatedData.stayOnlyDays[category] = {};
      }

      updatedData.stayOnlyDays[category][dayId] = isChecked;
      // console.log(`✅ Updated stayOnlyDays:`, updatedData.stayOnlyDays);
      return updatedData;
    });

    // अगर CHECKED (true) किया तो meals clear करो
    if (isChecked) {
      setHotelSelections(prev => {
        const newSelections = { ...prev };
        if (newSelections[category]?.[dayId]) {
          delete newSelections[category][dayId];
        }
        return newSelections;
      });

      setItineraryData(prev => {
        const newData = { ...prev };
        const newHotels = { ...newData.hotels };
        if (newHotels[category]?.[dayId]) {
          delete newHotels[category][dayId];
        }
        return { ...newData, hotels: newHotels };
      });
    }
  };





  const fetchLocations = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/locations")
      const data = await response.json()
      setLocations(data)
    } catch (err) {
      // console.log("Locations API failed, using static data")
      const mockLocations = [
        { _id: "1", name: "Gangtok" },
        { _id: "2", name: "Lachung" },
        { _id: "3", name: "Darjeeling" },
      ]
      setLocations(mockLocations)
    }
  }

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

  const todayDate = new Date(new Date().setHours(0, 0, 0, 0));

  function toLocalDate(dateStr) {


    if (!dateStr) return null;
    const [y, m, d] = toDateOnly(dateStr).split("-").map(Number);
    return new Date(y, m - 1, d); // timezone-safe date
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
    if (!clientDetails.name || !clientDetails.phone || !clientDetails.travelDate) {
      setError("Please fill all required fields")
      return
    }
    setError(null)
    setStep("itinerary-selection")
  }

  const normalizeKey = (key = "") =>
    key.toString().trim().toLowerCase().replace(/\s+/g, " ");

  const mergePricingAndOffers = (itinerary, oldPricing = {}, oldOffers = {}) => {
    const pkgPricing = itinerary.packagePricing || {};

    const normalizedOldPricing = {};
    const normalizedOldOffers = {};

    // Normalize old pricing
    Object.keys(oldPricing).forEach(k => {
      const val = oldPricing[k];
      // Handle nested: { value: 50200, category: 'super luxury', selected: true }
      const numVal = typeof val === 'object' ? (val.value || 0) : val;
      normalizedOldPricing[normalizeKey(k)] = numVal;
    });

    // Normalize old offers
    Object.keys(oldOffers).forEach(k => {
      const val = oldOffers[k];
      // Handle nested: { value: 10, selected: true }
      const numVal = typeof val === 'object' ? (val.value || 0) : val;
      normalizedOldOffers[normalizeKey(k)] = numVal;
    });

    const mergedPricing = {};
    const mergedOffers = {};

    Object.keys(pkgPricing).forEach(cat => {
      const norm = normalizeKey(cat);

      // Pricing: use old if > 0, else use package price
      mergedPricing[cat] =
        normalizedOldPricing[norm] > 0
          ? normalizedOldPricing[norm]
          : pkgPricing[cat];

      // ✅ Offers: use old if defined and > 0, else 0
      // This preserves the discount from previous booking!
      mergedOffers[cat] =
        normalizedOldOffers[norm] > 0
          ? normalizedOldOffers[norm]
          : 0;
    });

    return { mergedPricing, mergedOffers };
  };



  const handleItinerarySelect = (itinerary, oldItineraryData = null) => {

    // console.log(itinerary, "oldolddfdskjkasjdf ");

    const isSameItinerary = selectedItinerary?._id === itinerary._id;

    let pricing = {};
    let offers = {};



    // --- 1) MERGE PRICING & OFFERS ---
    if (oldItineraryData) {
      const merge = mergePricingAndOffers(
        itinerary,
        oldItineraryData.pricing,
        oldItineraryData.offers
      );

      pricing = merge.mergedPricing;
      offers = merge.mergedOffers;
    } else {
      pricing = itinerary.packagePricing || {};
      offers = Object.keys(pricing).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {});
    }

    setSelectedItinerary({ ...itinerary, packagePricing: pricing, offers });

    // --- 2) IF SAME ITINERARY SELECTED AGAIN, JUST OPEN BUILDER ---
    if (isSameItinerary) {
      setStep("itinerary-builder");
      return;
    }

    // --- 3) DAYS NORMALIZATION (OLD OR NEW) ---
    const normalizedDays = oldItineraryData?.days
      ? oldItineraryData.days.map((d, index) => ({
        id: index + 1,
        titles: d.titles || [""],
        descriptions: Array.isArray(d.descriptions)
          ? d.descriptions
          : [d.descriptions || ""],
        locations: d.locations || [],
        images: d.images || [],
      }))
      : itinerary.days.map((day, index) => ({
        id: index + 1,
        titles: day.titles || [day.title || ""],
        descriptions: Array.isArray(day.descriptions)
          ? day.descriptions
          : [day.description || ""],
        locations: day.locations || [day.location || ""],
        images: day.images || [],
      }));

    // --- 4) VEHICLE (OLD → NEW FALLBACK) — ONLY INDEX 0 ---
    let vehicleArray =
      oldItineraryData?.vehicle ||
      oldItineraryData?.itineraryData?.vehicle ||
      itinerary.vehicle ||
      [];

    // vehicleArray is an array → pick only index 0 object
    let selectedVehicle =
      Array.isArray(vehicleArray) && vehicleArray.length > 0
        ? vehicleArray[0]        // 👈 ONLY object, no array
        : {};

    // console.log(selectedVehicle, "seeeeeeeeeeeeffffffffffffffff");

    // --- 5) SET ITINERARY DATA ---
    setItineraryData({
      titles: oldItineraryData?.titles || itinerary.titles || [""],
      descriptions:
        oldItineraryData?.descriptions ||
        (Array.isArray(itinerary.descriptions)
          ? itinerary.descriptions
          : [itinerary.descriptions || ""]),
      date: oldItineraryData?.date || itinerary.date || "",
      images: oldItineraryData?.images || itinerary.images || [],
      duration: oldItineraryData?.duration || itinerary.duration || "",
      days: normalizedDays,
      tourcode: itinerary.tourcode || "",
      itineraryTourcode: itinerary.tourcode || "",
      pricing,
      offers,
      bookingAmount: oldItineraryData?.bookingAmount || 0,
      vehicle: selectedVehicle, // ⭐ ONLY INDEX 0 VEHICLE
      hotels: oldItineraryData?.hotels || {},
      highlightPrice: oldItineraryData?.highlightPrice || 0,
      priceType: oldItineraryData?.priceType || "Whole Group/Family",
      festivalOffer:
        oldItineraryData?.festivalOffer || {
          name: "",
          value: 0,
          selected: false,
        },
    });

    setHotelSelections(oldItineraryData?.hotels || {});
    setStep("itinerary-builder");
  };



  // console.log(selectedItinerary)

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
        if (field === "titles" || field === "locations" || field === "descriptions") {
          // Handle array fields
          if (index !== null) {
            const newArray = [...day[field]]
            newArray[index] = value
            return { ...day, [field]: newArray }
          }
          return { ...day, [field]: value }
        } else {
          return { ...day, [field]: value }
        }
      }
      return day
    })
    setItineraryData({ ...itineraryData, days: updatedDays })
  }

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


  const updatePricing = (category, value) => {
    // Allow empty string to clear the field (don't coerce to 0 immediately)
    const numValue = value === "" ? "" : Number.parseFloat(value) || 0;
    const newPricing = { ...itineraryData.pricing };
    const newOffers = { ...itineraryData.offers };

    if (numValue > 0 || value === "") {
      Object.keys(newPricing).forEach((key) => {
        if (key !== category) {
          newPricing[key] = 0;
          newOffers[key] = 0;
        }
      });
      newPricing[category] = numValue; // Keep as "" if empty
      setSelectedCategory(category);
    } else {
      newPricing[category] = 0;
      newOffers[category] = 0;
    }

    setItineraryData({
      ...itineraryData,
      pricing: newPricing,
      offers: newOffers,
    });
  };
  const normalize = (str) => str.toLowerCase().replace(/\s+/g, "");


  const handleCategorySelection = (category) => {
    setSelectedCategory(category);

    const normalizedCategory = normalize(category);

    // Find exact matched key
    const matchedKey = Object.keys(selectedItinerary.packagePricing || {})
      .find((key) => normalize(key) === normalizedCategory);

    if (!matchedKey) {
      // console.log("Category not found:", category);
      return;
    }

    const packagePrice = selectedItinerary.packagePricing[matchedKey];

    // ✅ Get offer from selectedItinerary (which may have merged offers from old booking)
    let offerValue = 0;

    // Check selectedItinerary.offers first (has priority - comes from merge)
    if (selectedItinerary.offers?.[matchedKey] !== undefined) {
      const offerData = selectedItinerary.offers[matchedKey];
      // Handle nested object structure { value: 10, selected: true }
      if (typeof offerData === 'object' && offerData.value !== undefined) {
        offerValue = offerData.value;
      } else {
        offerValue = offerData;
      }
    }
    // Fallback to itineraryData offers if not found in selectedItinerary
    else if (itineraryData.offers?.[matchedKey] !== undefined) {
      const offerData = itineraryData.offers[matchedKey];
      if (typeof offerData === 'object' && offerData.value !== undefined) {
        offerValue = offerData.value;
      } else {
        offerValue = offerData;
      }
    }

    // ⚡ Only keep selected category (pricing + offers)
    const newPricing = {
      [matchedKey]: packagePrice,
    };

    const newOffers = {
      [matchedKey]: offerValue, // ✅ NOW INCLUDES THE DISCOUNT!
    };

    // console.log("Selected Category:", matchedKey);
    // console.log("Package Price:", packagePrice);
    // console.log("Offer Value:", offerValue); // Debug log

    setItineraryData({
      ...itineraryData,
      pricing: newPricing,
      offers: newOffers,
    });
  };






  // Fetch structure data
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

  // console.log(structure);





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

  // New functions for Festival Offer
  const updateFestivalOffer = (field, value) => {
    setItineraryData(prev => ({
      ...prev,
      festivalOffer: {
        ...prev.festivalOffer,
        [field]: field === 'value' ? Number.parseFloat(value) || 0 : value
      }
    }));
  };

  const toggleFestivalOffer = () => {
    setItineraryData(prev => ({
      ...prev,
      festivalOffer: {
        ...prev.festivalOffer,
        selected: !prev.festivalOffer.selected
      }
    }));
  };

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


  const sortByCategoryOrder = (a, b) => {
    const categoriesOrder = categories.map(c =>
      c.name.toLowerCase()
    );

    const catA = a.categoryId?.name?.toLowerCase() || "";
    const catB = b.categoryId?.name?.toLowerCase() || "";

    const indexA = categoriesOrder.indexOf(catA);
    const indexB = categoriesOrder.indexOf(catB);

    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  };

  // Updated function to get hotels - now shows all hotels matching category, not just location
  const getFilteredHotels = (category, location = null, dayId = null) => {

    // Read selected hotels for SAME DAY + SAME LOCATION
    const mealData = hotelSelections?.[dayId]?.[location] || {};

    const combinedSelected = [
      mealData.breakfast,
      mealData.lunch,
      mealData.dinner,
      mealData.stayOnly,
    ].filter(Boolean);

    const uniqueSelected = [...new Set(combinedSelected)];

    // 🔐 Lock selected hotel(s)
    if (uniqueSelected.length > 0) {
      return hotels
        .filter(hotel =>
          uniqueSelected.includes(String(hotel._id))
        )
        .sort(sortByCategoryOrder); // ← sort with category order
    }

    // ⭐ Show ALL CATEGORY hotels but SAME LOCATION only
    const matchedHotels = hotels.filter(hotel => {
      const matchesLocation =
        !location ||
        hotel.locationId?.name?.toLowerCase() === location?.toLowerCase();

      return matchesLocation;
    });

    return matchedHotels.sort(sortByCategoryOrder); // ← sorted list
  };





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

  // Fetch themes on component mount
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await axios.get("https://apitour.rajasthantouring.in/api/themes", {
          withCredentials: true,
        });
        setThemes(res.data);
        // Set default theme (e.g., first active theme or a specific default)
        const defaultTheme = res.data.find(theme => theme.isActive && theme.name === "Default Theme") || res.data[0];
        setSelectedTheme(defaultTheme || null);
      } catch (err) {
        console.error("Failed to fetch themes:", err);
      }
    };
    fetchThemes();
  }, []);

  // Function to handle theme selection
  const handleThemeChange = (theme) => {
    // console.log(theme);

    setSelectedTheme(theme);
  };



  // यह useEffect को replace करो:

  useEffect(() => {
    if (!selectedCategory) return;

    const normalize = (s) =>
      s.toLowerCase().trim().replace(/\s+/g, " ");

    const normCat = normalize(selectedCategory);

    const matchedKey = Object.keys(hotelSelectionDays).find(
      (k) => normalize(k) === normCat
    );

    if (!matchedKey) {
      // console.log("❌ No matching category found in hotelSelectionDays");
      return;
    }

    const savedDays = hotelSelectionDays[matchedKey];

    // console.log("✔ Saved Days:", savedDays);
    // console.log("✔ itineraryData.days:", itineraryData.days);

    const updatedSelections = {}; // only for days checkbox UI

    itineraryData.days.forEach((day) => {
      const dayId = day.id;

      // ⬇️ AUTO-CHECK logic (TRUE means checkbox ON)
      const isChecked =
        savedDays[dayId] === true ||
        savedDays[String(dayId)] === true;

      if (isChecked) {
        updatedSelections[dayId] = true;
      }
    });

    // console.log("⬆️ Final Checkbox Auto Fill:", updatedSelections);

    // This only updates checkbox UI, not hotels
    setHotelSelectionDays({
      [selectedCategory]: {
        ...hotelSelectionDays[selectedCategory],
        ...updatedSelections
      }
    });


  }, [selectedCategory, itineraryData.days]);


  const saveBookingToDatabase = async (e) => {

    if (isSubmitting || isBookingSaved) {
      toast.info("You've already saved this itinerary. Refresh the page to start a new one!");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    // Log to verify the vehicle object
    // // console.log("Vehicle data before saving:", itineraryData.vehicle);

    // console.log(selectedTheme);

    let finalInclusions = bookingInclusions;

    if (bookingId && pendingInclusionTitles.length > 0) {
      // Pending booking है: pending base inclusions + केवल selected special
      const pendingBaseInclusions = inclusions.filter(inc =>
        pendingInclusionTitles.includes(inc.title) &&
        !SPECIAL_INCLUSION_TITLES.some(special =>
          inc.title.toLowerCase().includes(special.toLowerCase())
        )
      );

      const selectedSpecialIncs = inclusions.filter(inc =>
        selectedSpecialInclusions.includes(inc.title)
      );

      finalInclusions = [...pendingBaseInclusions, ...selectedSpecialIncs];
    }




    try {
      const bookingData = {
        clientDetails: {
          ...clientDetails,
          name: `${clientDetails.title} ${clientDetails.name}`.trim(),
          email2: clientDetails.email2 || "",
        },
        selectedItinerary,
        itineraryData: {
          ...itineraryData,
          vehicle: itineraryData.vehicle || {}, // Ensure the full vehicle object is included
        },
        hotelSelectionDays,
        stayOnlyDays: itineraryData.stayOnlyDays || {},
        hotelSelections,
        totalAmount:
          Object.values(itineraryData.pricing).reduce((sum, price) => sum + (price || 0), 0) -
          Object.values(itineraryData.offers).reduce((sum, offer) => sum + (offer || 0), 0),
        bookingAmount: itineraryData.bookingAmount,
        createdAt: new Date().toISOString(), // Use current time
        status: e,
        createby: user,
        theme: selectedTheme
          ? {
            _id: selectedTheme._id,
            name: selectedTheme.name,
            link: "viewData4",                // 🔥 ALWAYS STATIC
            imageUrl: selectedTheme.imageUrl || "",
            isActive: selectedTheme.isActive,
          }
          : {
            name: "Default Theme",
            isActive: true,
            link: "viewData4",                // 🔥 DEFAULT ALSO STATIC
          },

        contact: selectedContact,
        createby: user,
         inclusions: finalInclusions, // Editable local
        exclusions: bookingExclusions, // Editable local
        termsAndConditions: terms, // Global
        cancellationAndRefundPolicy: cancellationAndRefundPolicy, // Global
        travelRequirements: travelRequirements, // Global
        regularId: regulerId, // For tracking
        noteText: noteText

      };

      // // console.log("Booking data being sent:", bookingData);

      const response = await fetch("https://apitour.rajasthantouring.in/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      // console.log(bookingData);


      if (response.ok) {
        setIsBookingSaved(true);
        setBookingId(result._id);
        setBookingData(result)
        toast.success(`Booking confirmed! Your booking ID is: ${result.bookingId || result._id}`, {
          position: "top-right",
        });
      } else {
        const message =
          result?.message || "Failed to save booking. Please try again.";
        toast.error(message, { position: "top-right" });
        setError(message);

      }
    } catch (error) {
      toast.error("⚠️ Failed to save booking. Please try again.", {
        position: "top-right",
      });
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (step === "client-details") {
    return (
      <div className="min-h-screen ovveflow max-w-[1800px] w-full mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
        <div className="w-full">
          <div className="bg-white ">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <h1 className="text-xl font-bold">Client Details</h1>
                <span className="text-blue-200 text-xs font-medium">Step 1 of 3</span>
              </div>
            </div>

            <form onSubmit={handleClientDetailsSubmit} className="p-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Name with Title */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm  text-gray-800">Client Name</label>
                  <div className="flex items-center gap-2 w-full">
                    {/* Title Select */}
                    <select
                      value={clientDetails.title}
                      onChange={(e) =>
                        setClientDetails({ ...clientDetails, title: e.target.value })
                      }
                      className="min-w-[90px] px-3 py-2 border border-gray-300 rounded-lg 
               bg-white text-gray-800 text-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500 
               focus:border-blue-400 transition-all duration-200 
               hover:border-blue-400 shadow-sm"

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
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg 
             bg-white text-gray-800 text-sm 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:border-blue-400 transition-all duration-200 
             hover:border-blue-400 shadow-sm"
                      placeholder="Enter full name"
                      value={clientDetails.name}  // 👈 only name show, no title
                      onChange={(e) => {
                        const inputValue = e.target.value || "";

                        // agar user galti se title likh bhi de (mr/ms/dr etc.) to hatao
                        const nameOnly = inputValue.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Miss|Dr\.?|Prof\.?|Er\.?|Engr\.?)\s*/i, "").trimStart();

                        // internally title ke sath store karo
                        const fullName = clientDetails.title
                          ? `${clientDetails.title} ${nameOnly}`.trim()
                          : nameOnly;

                        // update state
                        setClientDetails({
                          ...clientDetails,
                          name: nameOnly, // 👈 input ke liye clean name
                          fullName,       // 👈 optional: agar alag se fullName chahiye
                        });
                      }}
                      required
                    />

                  </div>

                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800">Email Address</label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      className="w-full px-2 py-1.5 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                      placeholder="Enter email address"
                      value={clientDetails.email}
                      onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}

                    />
                    <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {/* Phone */}
                <div className="space-y-1">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">Phone Number</label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      className="w-full px-2 py-1.5 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                      placeholder="Enter phone number"
                      value={clientDetails.phone}
                      onChange={(e) => {
                        let value = e.target.value.trim();

                        // agar user ne + ke sath kuch likha (dusri country code)
                        if (value.startsWith("+")) {
                          setClientDetails({ ...clientDetails, phone: value });
                          return;
                        }

                        // agar user sirf digits likh raha hai (to +91 auto add kar do)
                        if (/^\d+$/.test(value)) {
                          value = "+91 " + value;
                        }

                        setClientDetails({ ...clientDetails, phone: value });
                      }}
                      required
                    />
                    <svg
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
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

                {/* Adults */}
                <div className="space-y-1">
                  <label htmlFor="adults" className="block text-sm font-semibold text-gray-800">Number of Adults</label>
                  <input
                    id="adults"
                    type="number"
                    min="1"

                    step="1"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                    placeholder="Enter number of adults"
                    value={clientDetails.adults}
                    onChange={(e) => setClientDetails({
                      ...clientDetails,
                      adults: e.target.value,
                      travelers: Number(e.target.value) + Number(clientDetails.kids5to12) + Number(clientDetails.kidsBelow5),
                    })}
                  />
                </div>

                {/* Kids 5-12 */}
                <div className="space-y-1">
                  <label htmlFor="kids5to12" className="block text-sm font-semibold text-gray-800">Kids (5-12 Years)</label>
                  <input
                    id="kids5to12"
                    type="number"
                    min="0"

                    step="1"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
                    placeholder="Enter number of kids"
                    value={clientDetails.kids5to12}
                    onChange={(e) => setClientDetails({
                      ...clientDetails,
                      kids5to12: e.target.value,
                      travelers: Number(clientDetails.adults) + Number(e.target.value) + Number(clientDetails.kidsBelow5),
                    })}
                  />
                </div>

                {/* Kids Below 5 */}
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

                {/* Rooms */}
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

                {/* Extra Bemattressds */}
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

                {/* Travel Date */}
                <div className="space-y-1 ">
                  <label htmlFor="travelDate" className="block text-sm font-semibold text-gray-800">Travel Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={toLocalDate(clientDetails.travelDate)}
                      onChange={(date) => {
                        if (!date) return;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        // ❌ Past date not allowed
                        if (date < today) {
                          toast.info("You cannot select a past date");
                          return;
                        }

                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, "0");
                        const d = String(date.getDate()).padStart(2, "0");
                        const dateStr = `${y}-${m}-${d}`;

                        setClientDetails({ ...clientDetails, travelDate: dateStr });
                      }}
                      minDate={new Date()}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select travel date"
                      className="custom-premium-datepicker border-none h-14
    "
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

                    {/* SAME ICON – perfectly aligned */}
                    <svg
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
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

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transform transition-all duration-200 hover:scale-105 shadow"
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
      <div className="min-h-screen max-w-[1800px] w-full mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
        <div className="mx-auto">
          <div className="bg-white overflow-hidden">
            {/* Header */}
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

            {/* Content */}
            <div className="p-3 sm:p-4">
              {/* Loading */}
              {loading && (
                <div className="text-center py-6 sm:py-8">
                  <div className="inline-flex items-center space-x-2 text-blue-600 text-sm sm:text-base">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Loading itineraries...</span>
                  </div>
                </div>
              )}

              {/* Error */}
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

              {/* Filters & Search */}
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <label htmlFor="duration-filter" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                    Filter by Duration
                  </label>
                  <select
                    id="duration-filter"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-2 top-[70%] transform -translate-y-1/2 text-gray-400 h-3.5 sm:h-4 w-3.5 sm:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Table / Cards */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h2 className="text-sm sm:text-base font-bold text-gray-800">Available Itineraries</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Choose the perfect itinerary for your trip</p>
                </div>

                {/* Add Tour Code filter */}
                <div className="my-3 px-3">
                  <input
                    type="text"
                    placeholder="Filter by Tour Code"
                    value={tourCodeFilter}
                    onChange={(e) => setTourCodeFilter(e.target.value)}
                    className="w-full pl-3 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Table for md+ */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Tour Code", "Duration", "Title", "Date", "Locations", "Action"].map((th) => (
                          <th key={th} className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">{th}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItineraries.length > 0 ? (
                        filteredItineraries
                          .sort((a, b) => {
                            const getDurationNum = (d) => {
                              if (!d) return 999;               // duration missing → bottom
                              const num = parseInt(d);          // "01 Nights" → 1
                              return isNaN(num) ? 999 : num;
                            };
                            return getDurationNum(a.duration) - getDurationNum(b.duration);
                          })
                          .map((itinerary, index) => (
                            <tr key={itinerary._id} className="hover:bg-blue-50 transition-colors duration-150">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">{itinerary.tourcode || ''}</td>

                              <td className="px-3 py-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                  {itinerary.duration || "N/A"}
                                </span>
                              </td>

                              <td className="px-3 py-2 font-semibold text-gray-900 truncate max-w-xs">
                                {itinerary.titles?.[0] || "N/A"}
                              </td>

                              <td className="px-3 py-2 text-gray-600">
                                {itinerary.date ? new Date(itinerary.date).toLocaleDateString() : "N/A"}
                              </td>

                              <td className="px-3 py-2 text-gray-600 max-w-md">
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(
                                    itinerary.days
                                      .flatMap(d => d.locations || [d.location])
                                      .filter(Boolean)
                                      .reduce((acc, loc) => {
                                        acc[loc] = (acc[loc] || 0) + 1;
                                        return acc;
                                      }, {})
                                  ).map(([loc, count]) => (
                                    <span
                                      key={loc}
                                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {loc} {count > 1 ? `(${count})` : ""}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleItinerarySelect(itinerary)}
                                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg text-xs hover:scale-105 transform transition-all duration-150"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-gray-500 text-xs sm:text-sm">
                            No itineraries found
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredItineraries.length > 0 ? filteredItineraries.map((itinerary, index) => (
                    <div key={itinerary._id} className="p-3 hover:bg-blue-50 transition-colors duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                        </div>
                        <button
                          onClick={() => handleItinerarySelect(itinerary)}
                          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg text-xs hover:scale-105 transform transition-all duration-150"
                        >
                          Select
                        </button>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div><span className="font-semibold text-gray-700">Duration:</span> <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">{itinerary.duration || "N/A"}</span></div>
                        <div><span className="font-semibold text-gray-700">Title:</span> {itinerary.titles?.[0] || "N/A"}</div>
                        <div><span className="font-semibold text-gray-700">Date:</span> {itinerary.date ? new Date(itinerary.date).toLocaleDateString() : "N/A"}</div>
                        <div><span className="font-semibold text-gray-700">Locations:</span> <div className="flex flex-wrap gap-1 mt-0.5">{Object.entries(itinerary.days.flatMap(d => d.locations || [d.location]).filter(Boolean).reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {})).map(([loc, count]) => (<span key={loc} className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs">{loc} ({count})</span>))}</div></div>
                        <div>
                          <span className="font-semibold text-gray-700">Images:</span>
                          {itinerary.images?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              <FastLazyImage
                                src={`https://apitour.rajasthantouring.in${itinerary.images[0]}`}
                                alt="img-0"
                                className="w-12 h-12 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No itineraries found</div>
                  )}
                </div>
              </div>

              {/* Selected Itinerary */}
              {selectedItinerary && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-xs sm:text-sm">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-800">
                    Selected: <span className="font-semibold">{selectedItinerary.titles[0]}</span> - <span className="font-semibold">{selectedItinerary.duration}</span>
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
      <div className="min-h-screen  ">
        <div className="w-full  max-w-[1800px] mx-auto ">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50  border-gray-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3">
              <div className="flex justify-between flex-wrap gap-2 items-center">
                <div className="flex items-center  space-x-2">
                  <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                    <span className="text-base font-bold">3</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Itinerary Builder</h1>
                    <p className="text-primary-foreground/80 text-xs">Customize your perfect journey</p>
                  </div>
                </div>
                <button
                  className="px-4 py-1 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground rounded-lg hover:bg-primary-foreground/20 transition-all duration-200 flex items-center space-x-1 border border-primary-foreground/20"
                  onClick={() => setStep("itinerary-selection")}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg mb-4 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 lg:gap-6  mx-auto px-2 sm:px-4 lg:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Itinerary Details */}
                  <div className="space-y-3 sm:space-y-4 py-1 mb-4 sm:mb-6">
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
                    <div className=" border border-gray-300 rounded-xl p-2 sm:p-3 md:p-4 shadow-sm space-y-3">
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
                              className="flex-1 p-1   border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
                              className=" max-h-[40px] py-1 text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                              disabled={itineraryData.titles.length === 1}
                            >
                              <Trash2 />
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
                              className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className=" max-h-[40px] py-1 text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                              disabled={itineraryData.descriptions.length === 1}
                            >
                              <Trash2 />
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
                        <label className="block text-sm sm:text-base font-semibold text-card-foreground">Travel Date</label>

                        <div className="relative">
                          <DatePicker
                            selected={toLocalDate(clientDetails.travelDate)}
                            onChange={(date) => {
                              if (!date) return;

                              const today = new Date();
                              today.setHours(0, 0, 0, 0);

                              // ❌ Past date block
                              if (date < today) {
                                toast.info("You cannot select a past date");
                                return;
                              }

                              const y = date.getFullYear();
                              const m = String(date.getMonth() + 1).padStart(2, "0");
                              const d = String(date.getDate()).padStart(2, "0");
                              const dateStr = `${y}-${m}-${d}`;


                              // Update in states
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

                      <div className="space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-card-foreground">Tour Code</label>
                        <input
                          type="text"
                          value={itineraryData.tourcode}

                          onChange={(e) => {
                            const value = e.target.value;

                            setItineraryData(prev => ({ ...prev, tourcode: value, itineraryTourcode: value }));

                          }}

                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-gray-50"
                        />
                      </div>



                    </div>
                  </div>

                  {/* Days Section */}
                  <div className="space-y-3 sm:space-y-4">
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
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">Day-wise Itinerary</h3>
                      <button
                        onClick={addDay}
                        className="mt-1 sm:mt-0 px-3 sm:px-4 py-1 sm:py-2 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 font-medium"
                      >
                        Add Day
                      </button>
                    </div>

                    {itineraryData.days.map((day) => (
                      <div key={day.id} className=" border border-gray-300 rounded-xl p-1 sm:p-3 md:p-4 shadow-sm space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-semibold text-card-foreground">Day {day.id}</h4>

                        {/* Titles Section */}
                        <div className="space-y-2">
                          <label className="block text-sm sm:text-base font-semibold text-card-foreground">Titles</label>
                          {day.titles.map((title, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={title}
                                onChange={(e) => updateDay(day.id, "titles", e.target.value, index)}
                                className="flex-1 p-1.5   border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder={`Title ${index + 1}`}
                              />
                              <button
                                onClick={() => removeDayField(day.id, "titles", index)}
                                className="  max-h-[40px] text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                disabled={day.titles.length === 1}
                              >
                                <Trash2 />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addDayField(day.id, "titles")}
                            className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                          >
                            Add Title
                          </button>
                        </div>

                        {/* Descriptions Section - Simplified with RichTextEditor */}
                        <div className="space-y-3">
                          <label className="block text-sm sm:text-base font-semibold text-card-foreground">
                            Descriptions
                          </label>

                          {day.descriptions.map((desc, descIndex) => (
                            <div
                              key={descIndex}
                              className="border border-gray-300 rounded-xl p-3 space-y-3 bg-card"
                            >
                              <div className="flex flex-col sm:flex-row gap-3 items-start">
                                {/* Editor box */}
                                <div className="flex-1 w-full">
                                  <div className="ql-container ql-snow rounded-lg">
                                    <RichTextEditor
                                      value={desc}
                                      onChange={(value) =>
                                        updateDay(day.id, "descriptions", value, descIndex)
                                      }
                                      className="flex-1 min-h-[150px] max-h-[300px] overflow-y-auto rounded-lg"
                                    />
                                  </div>
                                </div>

                                {/* Remove button */}
                                <button
                                  onClick={() => removeDayField(day.id, "descriptions", descIndex)}
                                  className=" text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium self-start"
                                  disabled={day.descriptions.length === 1}
                                >
                                  <Trash2 />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add button */}
                          <button
                            onClick={() => addDayField(day.id, "descriptions")}
                            className="px-3 py-1 bg-blue-200 text-accent-foreground rounded-lg hover:bg-blue-200/90 transition-colors duration-200 text-xs font-medium"
                          >
                            Add Description
                          </button>
                        </div>




                        {/* Locations Section - Now using Select from API */}
                        <div className="space-y-2">
                          <label className="block text-sm sm:text-base font-semibold text-card-foreground">Locations</label>
                          {day.locations.map((location, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={location}
                                onChange={(e) => updateDay(day.id, "locations", e.target.value, index)}
                                className="flex-1 p-2   border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
                                className=" max-h-[40px] text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                disabled={day.locations.length === 1}
                              >
                                <Trash2 />
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
                          <label className="block text-sm font-semibold text-gray-800 sm:text-base">
                            Day Images
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {day.images.map((img, index) => (
                              <div key={index} className="relative group w-20 sm:w-24 flex flex-col">
                                {/* Image thumbnail */}
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

                                  {/* Overlay for actions on hover */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                      {/* Replace button */}
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

                                      {/* Delete button */}
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

                                {/* Hidden file input for replace (if needed, but using label above) */}
                              </div>
                            ))}

                            {/* Add new image slot */}
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
                    ))}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Package Pricing */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                        <IndianRupee className="w-4   h-4" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Package Pricing</h2>
                    </div>
                    <div className=" border border-gray-300 rounded-xl p-1.5 sm:p-2 shadow-sm space-y-3">
                      <h4 className="text-sm sm:text-base font-semibold text-muted-foreground mb-2">Select Package Category</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                              className="flex flex-col p-2  border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-muted/80 peer-checked:border-primary peer-checked:bg-primary/5 transition-all duration-200"
                            >
                              <span className="font-semibold text-card-foreground capitalize mb-1">{key}</span>
                              <span className="text-xs text-muted-foreground">Base: ₹{defaultPrice}</span>
                              {selectedCategory === key && (
                                <div className="mt-2 space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Package Price</label>
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
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                      placeholder="Enter price"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Discount Price (Optional)</label>
                                    <input
                                      type="text"
                                      pattern="[0-9]*"
                                      inputMode="numeric"
                                      value={itineraryData.offers?.[selectedCategory] === "" ? "" : (itineraryData.offers?.[selectedCategory] ?? "")}
                                      onChange={(e) => updateOffer(selectedCategory, e.target.value)}
                                      onKeyDown={handleNumericInput}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                      placeholder="Enter Discount Price"
                                      disabled={
                                        !(
                                          itineraryData.pricing?.[selectedCategory] ?? selectedItinerary.packagePricing[selectedCategory]
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
                  {/* NEW: Festival Offer Section */}
                  {/* <div className="border border-gray-300 rounded-xl p-1.5 sm:p-2 shadow-sm space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2 sm:mb-3">Festival Offer (% Discount)</h3>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Offer Name</label>
                      <input
                        type="text"
                        value={itineraryData.festivalOffer.name}
                        onChange={(e) => updateFestivalOffer('name', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Diwali Special"
                      />
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Discount %</label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={itineraryData.festivalOffer.value}
                        onChange={(e) => updateFestivalOffer('value', e.target.value)}
                        onKeyDown={handleNumericInput}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 10"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={itineraryData.festivalOffer.selected}
                          onChange={toggleFestivalOffer}
                          className="h-4 w-4 text-primary focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sm text-muted-foreground">Apply Festival Offer</span>
                      </label>
                    </div>
                  </div> */}
                  {/* Booking Amount */}
                  <div className=" border border-gray-300 rounded-xl p-1.5 sm:p-2 shadow-sm space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2 sm:mb-3">
                      {resive ? `Received Amount` : "Booking Amount"}
                    </h3>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-muted-foreground mb-1">Price</label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={itineraryData.bookingAmount === "" ? "" : itineraryData.bookingAmount}
                        onChange={(e) =>
                          setItineraryData({ ...itineraryData, bookingAmount: e.target.value === "" ? "" : Number.parseFloat(e.target.value) || 0 })
                        }
                        onKeyDown={handleNumericInput}
                        className="w-full px-2 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  {/* Vehicle Selection */}
                  <div className=" border border-gray-300 rounded-xl p-1.5 sm:p-2 shadow-sm space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2 sm:mb-3">Vehicle</h3>
                    <select
                      className="w-full px-2 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      value={itineraryData.vehicle?._id || ""}
                      onChange={(e) => {
                        const selected = vehicles.find((v) => v._id === e.target.value);
                        setItineraryData({ ...itineraryData, vehicle: selected || {} });
                      }}
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Highlight Price */}
                  <div className=" border border-gray-300 rounded-xl p-1.5 sm:p-2 shadow-sm space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2 sm:mb-3">Final Price</h3>
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-muted-foreground mb-1">Price</label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={itineraryData.highlightPrice === "" ? "" : itineraryData.highlightPrice}
                        onChange={(e) => updateHighlightPrice(e.target.value)}
                        onKeyDown={handleNumericInput}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                        placeholder=""
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
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

                  {/* Select Hotels by Day & Meal */}
                  <div className="border border-gray-300 rounded-xl p-1.5 sm:p-2 mb-4 sm:mb-6 shadow-sm space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2 sm:mb-3">
                      Select Hotels by Day & Meal ({selectedCategory?.charAt(0)?.toUpperCase() + selectedCategory?.slice(1)})
                    </h3>
                    <div className="mb-3">
                      <label className="block text-sm sm:text-base font-semibold text-muted-foreground mb-2">Hotel Category</label>
                      <select
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
                        // ✅ Check both formats (number and string)
                        const isDayHotelsDisabled =
                          hotelSelectionDays?.[selectedCategory]?.[day.id] === true ||
                          hotelSelectionDays?.[selectedCategory]?.[String(day.id)] === true;

                        // ✅ NEW: Check if Stay Only is enabled
                        const isStayOnly = itineraryData.stayOnlyDays?.[selectedCategory]?.[day.id] === true || stayOnlyDays?.[selectedCategory]?.[day.id] === true;

                        // ✅ Check if this day has hotels in itineraryData
                        const dayHasHotels = itineraryData.hotels?.[day.id] && Object.keys(itineraryData.hotels[day.id]).length > 0;

                        // console.log(`Day ${day.id}: disabled=${isDayHotelsDisabled}, stayOnly=${isStayOnly}, hasHotels=${dayHasHotels}`);

                        return (
                          <div key={day.id} className="mb-4 sm:mb-6 border-b pb-3 sm:pb-4 last:border-b-0">
                            {/* DAY HEADER WITH CHECKBOXES */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                              {/* No Hotels Checkbox */}
                              <div className="flex items-center gap-3">

                                <label
                                  htmlFor={`day-hotels-${selectedCategory}-${day.id}`}
                                  className="text-base sm:text-lg font-semibold text-card-foreground mb-0 cursor-pointer flex items-center gap-2"
                                >
                                  <span className="bg-blue-800 px-2 text-white rounded-full">Night - {day.id}</span>

                                  {isDayHotelsDisabled && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded ml-2">
                                      No Hotels Booked
                                    </span>
                                  )}
                                </label>
                              </div>

                              {/* ✅ NEW: Stay Only Checkbox */}
                              <div className="flex items-center gap-3 ml-0 sm:ml-auto">
                                <input
                                  type="checkbox"
                                  id={`stay-only-${selectedCategory}-${day.id}`}
                                  checked={isStayOnly}
                                  onChange={(e) => {
                                    handleDayStayToggle(selectedCategory, day.id, e.target.checked);

                                    // अगर stay-only enable किया तो meals clear करो
                                    if (e.target.checked) {
                                      setHotelSelections(prev => {
                                        const newSelections = { ...prev };
                                        if (newSelections[day.id]) {
                                          delete newSelections[day.id];
                                        }
                                        return newSelections;
                                      });

                                      setItineraryData(prev => {
                                        const newData = { ...prev };
                                        const newHotels = { ...newData.hotels };
                                        if (newHotels[day.id]) {
                                          delete newHotels[day.id];
                                        }
                                        return { ...newData, hotels: newHotels };
                                      });
                                    }
                                  }}
                                  className="w-3 h-3 text-orange-600 accent-green-600 rounded focus:ring-2"
                                />
                                <label
                                  htmlFor={`stay-only-${selectedCategory}-${day.id}`}
                                  className="text-sm font-medium text-blue-700 cursor-pointer flex items-center gap-2"
                                >
                                  {/* <Moon size={16} className="text-gray-600" /> */}
                                  EPAI Plan Only
                                </label>
                              </div>
                            </div>

                            {/* SHOW HOTELS ONLY IF CHECKBOX IS NOT CHECKED */}
                            {!isDayHotelsDisabled ? (
                              isStayOnly ? (
                                // 🏨 STAY ONLY MODE - केवल होटल, कोई मील नहीं
                                <div className="space-y-4">
                                  <div className="p-4  border  rounded-lg">
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <Moon className="w-4 h-4" />
                                      Stay Only - Accommodation Only (No Meals)
                                    </h5>

                                    {day.locations?.filter((location) => location.toLowerCase() !== "departure")?.map((location, locIndex) => (
                                      <div
                                        key={`${day.id}-${location}-${locIndex}`}
                                        className="mb-4 p-3 rounded-lg bg-white border  last:mb-0"
                                      >
                                        <h6 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-gray-600" /> {location}
                                        </h6>

                                        <div className="space-y-2">
                                          <label className="text-sm flex items-center gap-2 font-semibold text-gray-800">
                                            <Bed /> Hotel (Accommodation Only)
                                          </label>
                                          <select
                                            className="w-full >px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all duration-200"
                                            value={hotelSelections[day.id]?.[location]?.stayOnly || ""}
                                            onChange={(e) => updateHotelSelection(day.id, location, "stayOnly", e.target.value)}
                                          >
                                            <option value="">Select Hotel</option>
                                            {getFilteredHotels(selectedCategory, location, day.id).map((hotel) => (
                                              <option key={hotel._id} value={hotel._id}>
                                                {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                              </option>
                                            ))}
                                          </select>
                                          {hotelSelections[day.id]?.[location]?.stayOnly && (
                                            <div className="mt-2 flex items-center gap-2 p-2 bg-orange-50 rounded border">
                                              <img
                                                src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.image}`}
                                                alt="Hotel"
                                                className="w-20 h-16 object-cover rounded"
                                              />
                                              <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                  {hotels.find((h) => h._id === hotelSelections[day.id][location].stayOnly)?.name}
                                                </p>
                                              </div>
                                              <button
                                                onClick={() => removeHotelSelection(day.id, location, "stayOnly")}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <Trash2 size={16} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                // 🍽️ NORMAL MODE - सभी Meals के साथ
                                <div className="space-y-3">
                                  {day.locations?.filter((location) => location.toLowerCase() !== "departure")?.map((location, locIndex) => (
                                    <div
                                      key={`${day.id}-${location}-${locIndex}`}
                                      className="mb-3 sm:mb-4 p-1.5 sm:p-2 rounded-xl space-y-2 border border-gray-200 bg-white"
                                    >
                                      <h5 className="text-sm sm:text-base font-medium text-card-foreground mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" /> {location}
                                      </h5>

                                      {/* BREAKFAST */}
                                      <div className="space-y-2">
                                        <label className="text-sm sm:text-base font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                          <Coffee className="w-4 h-4 text-primary" /> <span>Breakfast Hotel</span>
                                        </label>
                                        <select
                                          className="w-full px-2 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                          value={hotelSelections[day.id]?.[location]?.breakfast || ""}
                                          onChange={(e) => updateHotelSelection(day.id, location, "breakfast", e.target.value)}
                                        >
                                          <option value="">Select Breakfast Hotel</option>
                                          {getFilteredHotels(selectedCategory, location, day.id).map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                              {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                            </option>
                                          ))}
                                        </select>
                                        {hotelSelections[day.id]?.[location]?.breakfast && (
                                          <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
                                            <img
                                              src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].breakfast)?.image}`}
                                              alt="Hotel"
                                              className="w-20 sm:w-24 h-16 sm:h-20 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                              onClick={() => removeHotelSelection(day.id, location, "breakfast")}
                                              className="text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                            >
                                              <Trash2 />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* LUNCH */}
                                      <div className="space-y-2">
                                        <label className="text-sm sm:text-base font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                          <CoffeeIcon className="w-4 h-4 text-primary" /> <span>Lunch Hotel</span>
                                        </label>
                                        <select
                                          className="w-full px-2 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                          value={hotelSelections[day.id]?.[location]?.lunch || ""}
                                          onChange={(e) => updateHotelSelection(day.id, location, "lunch", e.target.value)}
                                        >
                                          <option value="">Select Lunch Hotel</option>
                                          {getFilteredHotels(selectedCategory, location, day.id).map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                              {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                            </option>
                                          ))}
                                        </select>
                                        {hotelSelections[day.id]?.[location]?.lunch && (
                                          <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
                                            <img
                                              src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].lunch)?.image}`}
                                              alt="Hotel"
                                              className="w-20 sm:w-24 h-16 sm:h-20 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                              onClick={() => removeHotelSelection(day.id, location, "lunch")}
                                              className="text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                            >
                                              <Trash2 />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* DINNER */}
                                      <div className="space-y-2">
                                        <label className="text-sm sm:text-base font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                          <Coffee className="w-4 h-4 text-primary" /> <span>Dinner Hotel</span>
                                        </label>
                                        <select
                                          className="w-full px-2 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                          value={hotelSelections[day.id]?.[location]?.dinner || ""}
                                          onChange={(e) => updateHotelSelection(day.id, location, "dinner", e.target.value)}
                                        >
                                          <option value="">Select Dinner Hotel</option>
                                          {getFilteredHotels(selectedCategory, location, day.id).map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                              {hotel.name} - {hotel.rating}★ -{hotel.categoryId?.name}
                                            </option>
                                          ))}
                                        </select>
                                        {hotelSelections[day.id]?.[location]?.dinner && (
                                          <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
                                            <img
                                              src={`https://apitour.rajasthantouring.in${hotels.find((h) => h._id === hotelSelections[day.id][location].dinner)?.image}`}
                                              alt="Hotel"
                                              className="w-20 sm:w-24 h-16 sm:h-20 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                              onClick={() => removeHotelSelection(day.id, location, "dinner")}
                                              className="text-red-500 rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-xs font-medium"
                                            >
                                              <Trash2 />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            ) : (
                              /* SHOW WARNING WHEN CHECKBOX IS CHECKED */
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

                                  // console.log(`Day ${day.id} checkbox changed to:`, isChecked);

                                  // Update hotelSelectionDays
                                  setHotelSelectionDays(prev => {
                                    const updated = { ...prev };
                                    if (!updated[selectedCategory]) {
                                      updated[selectedCategory] = {};
                                    }

                                    // Set both formats
                                    updated[selectedCategory][day.id] = isChecked;
                                    updated[selectedCategory][String(day.id)] = isChecked;

                                    // console.log(`✅ Updated hotelSelectionDays:`, updated);
                                    return updated;
                                  });

                                  // If checked (no hotels), remove hotels for this day
                                  if (isChecked) {
                                    setHotelSelections(prev => {
                                      const newSelections = { ...prev };
                                      if (newSelections[day.id]) {
                                        delete newSelections[day.id];
                                      }
                                      return newSelections;
                                    });

                                    // Also update itineraryData.hotels
                                    setItineraryData(prev => {
                                      const newHotels = { ...prev.hotels };
                                      if (newHotels[day.id]) {
                                        delete newHotels[day.id];
                                      }
                                      return { ...prev, hotels: newHotels };
                                    });
                                  } else {
                                    // ✅ जब uncheck करो, तो saved hotels को restore करो
                                    if (itineraryData.hotels?.[day.id]) {
                                      setHotelSelections(prev => ({
                                        ...prev,
                                        [day.id]: itineraryData.hotels[day.id]
                                      }));
                                    }
                                  }
                                }}
                                className="w-4 h-4 text-red-600 rounded accent-green-600"
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
    {bookingId 
      ? "Select additional inclusions for this booking (checked ones from pending will be included):"
      : "Select additional inclusions for this booking:"}
  </p>
  
  <div className="space-y-3">
    {inclusions
      .filter(inc => SPECIAL_INCLUSION_TITLES.some(special =>
        inc.title.toLowerCase().includes(special.toLowerCase())
      ))
      .map((inc, index) => {
        // ✅ Check करो: क्या यह inclusion pending में था?
        const isPendingInclusion = pendingInclusionTitles.includes(inc.title);
        const isSelected = selectedSpecialInclusions.includes(inc.title);

        return (
          <label 
            key={index} 
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSpecialInclusions([...selectedSpecialInclusions, inc.title]);
                } else {
                  setSelectedSpecialInclusions(selectedSpecialInclusions.filter(t => t !== inc.title));
                }
              }}
              className="mt-1 h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-500 rounded"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-semibold text-green-700">{inc.title}</strong>
                
                
              </div>
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

              <div className="flex justify-between pt-4">
                <button
                  className="sm:px-6 sm:py-2 p-1 bg-primary  text-white  rounded-lg hover:bg-primary/80 transition-colors duration-200 font-medium"
                  onClick={() => setStep("itinerary-selection")}
                >
                  Back to Selection
                </button>
                <button
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
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
      <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card  sm:py-4 ">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className=" rounded-2xl   overflow-hidden border">
            <div className="bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
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
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    className="px-4 sm:px-6 py-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground rounded-xl hover:bg-primary-foreground/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-primary-foreground/20"
                    onClick={() => setStep("itinerary-builder")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                  <button
                    className="px-4 sm:px-6 py-2 bg-green-400 text-accent-foreground rounded-xl cursor-pointer hover:bg-green-200/90 transition-all duration-200 flex items-center justify-center space-x-2"
                    onClick={sendWhatsAppMessage}
                  >
                    <FontAwesomeIcon icon={faWhatsapp} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    className="px-4 sm:px-6 py-2 bg-blue-200 text-accent-foreground rounded-xl hover:bg-blue-200/90 transition-all duration-200 flex items-center justify-center space-x-2"
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

            <div ref={componentRef} className=" sm:p-8" id="itinerary-preview">
              <div className="relative bg-gradient-to-r from-primary to-accent rounded-3xl overflow-hidden mb-8 sm:mb-12 shadow-lg">
                <div className="absolute inset-0 bg-black/20"></div>
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  alt="Destination"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                />
                <div className="relative z-10 p-6 sm:p-12 text-primary-foreground">
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-block bg-blue-200 text-accent-foreground px-3 sm:px-4 py-2 rounded-full text-sm font-semibold mb-4 sm:mb-6 shadow-sm">
                        {calculateDuration(selectedItinerary)}
                      </div>
                      <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
                        {itineraryData?.titles?.[0] || selectedItinerary?.titles?.[0] || "Travel Package"}
                      </h1>
                      <p className="text-lg sm:text-2xl opacity-90 mb-4 sm:mb-6 font-medium">
                        {itineraryData?.days?.length || selectedItinerary?.days?.length || 0} Days Amazing Journey
                      </p>
                      {selectedCategory &&
                        (itineraryData.pricing[selectedCategory] > 0 ||
                          selectedItinerary.packagePricing?.[selectedCategory]) && (
                          // console.log(bookingData),

                          <div className="/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-primary-foreground/20">
                            <h3 className="text-lg sm:text-xl font-bold mb-4">Selected Package</h3>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                              <span className="capitalize font-semibold text-base sm:text-lg">{selectedCategory} Category</span>
                              <div className="text-left sm:text-right mt-2 sm:mt-0">
                                <span className="text-xl sm:text-3xl font-bold">
                                  ₹
                                  {(itineraryData.pricing?.[selectedCategory] || 0) -
                                    (itineraryData.offers?.[selectedCategory] || 0)}
                                </span>
                              </div>



                            </div>
                          </div>
                        )}
                    </div>
                    <div className="text-left sm:text-right mt-4 sm:mt-0">
                      <div className="/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-primary-foreground/20">
                        <p className="text-xl sm:text-2xl font-bold">₹{itineraryData?.highlightPrice}</p>
                        <p className="text-sm opacity-80 capitalize">{itineraryData?.priceType}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Details and Package Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                <div className=" rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-300">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-card-foreground">Client Details</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-medium text-muted-foreground">Name:</span>
                      <span className="text-card-foreground">{`${clientDetails.title} ${clientDetails.name}`}</span>
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

                <div className=" rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-300">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-card-foreground">Package Summary</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-medium text-muted-foreground">Duration:</span>
                      <span className="text-card-foreground">{calculateDuration(selectedItinerary)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-medium text-muted-foreground">Category:</span>
                      <span className="text-card-foreground capitalize">{selectedCategory || "Not Selected"}</span>
                    </div>
                    {selectedCategory && itineraryData.pricing[selectedCategory] > 0 && (
                      <>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="font-medium text-muted-foreground">Base Price:</span>
                          <span className="text-card-foreground">₹{itineraryData.pricing[selectedCategory]}</span>
                        </div>
                        {itineraryData.offers[selectedCategory] > 0 && (
                          <div className="flex justify-between text-sm sm:text-base">
                            <span className="font-medium text-muted-foreground">Discount Price:</span>
                            <span className="text-green-600 font-semibold">
                              ₹{itineraryData.offers[selectedCategory]}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-base sm:text-lg font-semibold">
                            <span className="text-card-foreground">Total Amount:</span>
                            <span className="text-primary">
                              ₹
                              {(itineraryData.pricing?.[selectedCategory] || 0) -
                                (itineraryData.offers?.[selectedCategory] || 0)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-medium text-muted-foreground">
                        {resive ? `Received Amount` : "Booking Amount:"}
                      </span>

                      <span className="text-card-foreground">₹{itineraryData.bookingAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4 sm:mb-6">
                  Itinerary <span className="text-primary">{calculateDuration(selectedItinerary)} - Early Birds</span>
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


                <div className="space-y-8 sm:space-y-10">
                  {itineraryData.days.map((day, index) => {
                    const travelDate = new Date(clientDetails.travelDate);
                    const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);
                    const isDayHotelsDisabled =
                      hotelSelectionDays?.[selectedCategory]?.[day.id] === true ||
                      hotelSelectionDays?.[selectedCategory]?.[String(day.id)] === true;
                    const isStayOnly = itineraryData.stayOnlyDays?.[selectedCategory]?.[day.id] === true; // ✅ Add this line

                    const uniqueLocations = [...new Set(
                      day.locations?.filter(location =>
                        location &&
                        !location.toLowerCase().includes("departure") &&
                        !location.toLowerCase().includes("Departure") &&
                        !location.toLowerCase().includes("drop") &&
                        !location.toLowerCase().includes("flight")
                      ) || []
                    )];
                    if (uniqueLocations.length === 0 && !isDayHotelsDisabled) {
                      return null; // Nothing to show
                    }
                    return (
                      <div key={day.id} className="relative">
                        {index < itineraryData.days.length - 1 && (
                          <div className="absolute left-8 sm:left-9 top-16 sm:top-20 w-0.5 h-full bg-border z-0"></div>
                        )}
                        <div className="flex gap-1 sm:gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-green-500 text-primary-foreground rounded-full flex items-center justify-center font-bold text-base sm:text-lg z-10 shadow-md">
                              {day.id}
                            </div>
                            <div className="text-center mt-2 sm:mt-3">
                              <div className="text-[10px] sm:text-lg font-semibold text-card-foreground">Day {day.id}</div>
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
                            <div className=" rounded-3xl border border-gray-300 shadow-sm overflow-hidden">
                              <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-48 h-40 sm:h-48 flex items-center justify-center bg-gray-100">
                                  <div className="w-full sm:w-48 h-40 sm:h-48">
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
                                </div>
                                <div className="flex-1 p-4 sm:p-6">
                                  <div className="inline-flex  items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <CarFront />
                                    <span className="text-sm sm:text-lg text-muted-foreground font-medium">
                                      {itineraryData.vehicle?.type ? (
                                        <>
                                          {`${itineraryData.vehicle.type} ${itineraryData.vehicle.model}`}
                                        </>
                                      ) : (
                                        "Wagon R / Similar"
                                      )}
                                    </span>
                                  </div>
                                  <h3 className="text-lg sm:text-2xl font-bold text-card-foreground mb-3 sm:mb-4">
                                    {day.titles?.[0] || `${day.locations} Sightseeing`}
                                  </h3>
                                  <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed">

                                    {day.descriptions && day.descriptions.length > 0
                                      ? day.descriptions.map((desc, i) => (
                                        <div key={desc._id || i} className="mb-3">
                                          {typeof desc === "string" ? (
                                            // Render HTML safely for rich text from ReactQuill
                                            <div
                                              className="prose prose-sm sm:prose-lg max-w-none"
                                              dangerouslySetInnerHTML={{ __html: desc }}
                                            />
                                          ) : desc ? (
                                            // Fallback for structured text
                                            <div className="prose prose-sm sm:prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: desc }} />
                                          ) : null}
                                        </div>
                                      ))
                                      : `Explore the beautiful destinations in ${day.locations}. Experience the local culture, visit famous landmarks, and enjoy the scenic beauty.`}   </p>
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
              <div className="mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-4 sm:mb-6">
                  Hotels Details <span className="text-primary">{calculateDuration(selectedItinerary)}</span>
                </h2>

                <div className="space-y-6 sm:space-y-8">
                  {itineraryData.days.map((day, index) => {
                    if (!day.locations) return null;
                    const travelDate = new Date(clientDetails.travelDate);
                    const dayDate = new Date(travelDate.getTime() + index * 24 * 60 * 60 * 1000);

                    return (
                      <div key={day.id} className="relative">
                        {index < itineraryData.days.length - 1 && (
                          <div className="absolute left-8 sm:left-9 top-16 sm:top-20 w-0.5 opacity-80 h-[98%] bg-border z-0"></div>
                        )}
                        <div className="flex gap-1 sm:gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-green-500 text-primary-foreground rounded-full flex items-center justify-center font-bold text-base sm:text-lg z-10 shadow-md">
                              {day.id}
                            </div>
                            <div className="text-center mt-2 sm:mt-3">
                              <div className="text-[10px] sm:text-lg font-semibold text-card-foreground">Day {day.id}</div>
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
                            <div className=" rounded-2xl border border-gray-300 p-4 sm:p-6 shadow-sm">
                              <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4 sm:mb-6">
                                {day.titles?.[0] || `Day ${day.id}`}
                              </h3>

                              {day.locations?.map((location, locIndex) => {
                                const locationHotels = hotelSelections[day.id]?.[location];
                                return (
                                  <div key={`${day.id}-${location}-${locIndex}`} className="mb-6 sm:mb-8 last:mb-0">
                                    <h4 className="text-base sm:text-lg font-medium text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                      <MapPin className="w-4 h-4" /> {location}
                                    </h4>

                                    {locationHotels ? (
                                      <div className="space-y-4">
                                        {locationHotels.breakfast && (
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4  rounded-2xl">
                                            <span className="text-base sm:text-lg font-medium text-primary min-w-[80px] sm:min-w-[100px]">
                                              🍳 Breakfast
                                            </span>
                                            {(() => {
                                              const hotel = hotels.find((h) => h._id === locationHotels.breakfast);
                                              return hotel ? (
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                                  <img
                                                    src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                    alt={hotel.name}
                                                    className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl shadow-sm"
                                                  />
                                                  <div className="flex-1">
                                                    <div className="font-medium text-card-foreground text-sm sm:text-base">{hotel.name}</div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                                      {hotel.rating}★ ({hotel.reviews} reviews)
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground text-sm">Hotel not found</span>
                                              );
                                            })()}
                                          </div>
                                        )}
                                        {locationHotels.lunch && (
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4  rounded-2xl">
                                            <span className="text-base sm:text-lg font-medium text-primary min-w-[80px] sm:min-w-[100px]">
                                              🍽️ Lunch
                                            </span>
                                            {(() => {
                                              const hotel = hotels.find((h) => h._id === locationHotels.lunch);
                                              return hotel ? (
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                                  <img
                                                    src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                    alt={hotel.name}
                                                    className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl shadow-sm"
                                                  />
                                                  <div className="flex-1">
                                                    <div className="font-medium text-card-foreground text-sm sm:text-base">{hotel.name}</div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                                      {hotel.rating}★ ({hotel.reviews} reviews)
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground text-sm">Hotel not found</span>
                                              );
                                            })()}
                                          </div>
                                        )}
                                        {locationHotels.dinner && (
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4  rounded-2xl">
                                            <span className="text-base sm:text-lg font-medium text-primary min-w-[80px] sm:min-w-[100px]">
                                              🍽️ Dinner
                                            </span>
                                            {(() => {
                                              const hotel = hotels.find((h) => h._id === locationHotels.dinner);
                                              return hotel ? (
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                                  <img
                                                    src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                    alt={hotel.name}
                                                    className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl shadow-sm"
                                                  />
                                                  <div className="flex-1">
                                                    <div className="font-medium text-card-foreground text-sm sm:text-base">{hotel.name}</div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                                      {hotel.rating}★ ({hotel.reviews} reviews)
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground text-sm">Hotel not found</span>
                                              );
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground italic p-3 sm:p-4  rounded-2xl">
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


              {/* Inclusions, Exclusions, and Price Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                {/* Left Section: Inclusions + Exclusions + Terms */}
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
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




                {/* Right Section: Price Summary */}
                <div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 p-6 sm:p-8 sticky top-4 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Price Summary</h3>
                      <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {selectedCategory.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">Travelers</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {clientDetails.adults && (
                            <p> Adults: {clientDetails.adults}</p>
                          )}
                          {clientDetails.kids5to12 && (
                            <p> Kids (5-12 yrs): {clientDetails.kids5to12}</p>
                          )}
                          {clientDetails.kidsBelow5 && (
                            <p> Kids (Below 5 yrs): {clientDetails.kidsBelow5}</p>
                          )}
                        </div>

                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Moon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">Accommodation</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {clientDetails.rooms && (
                            <p> Rooms: {clientDetails.rooms}</p>
                          )}
                          {clientDetails.extraBeds && (
                            <p> Extra mattress: {clientDetails.extraBeds}</p>
                          )}
                        </div>

                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                      {(() => {
                        const basePrice = itineraryData.pricing?.[selectedCategory] || 0;
                        const offerDiscount = itineraryData.offers?.[selectedCategory] || 0;
                        const festivalPercent = itineraryData.festivalOffer?.value || 0;
                        const priceAfterOffer = basePrice - offerDiscount;
                        const festivalDiscount = (priceAfterOffer * festivalPercent) / 100;
                        const finalPrice = priceAfterOffer - festivalDiscount;
                        const totalSavings = offerDiscount + (festivalDiscount > 0 ? festivalDiscount : 0);

                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                              <span className="text-sm text-gray-600">Base Price</span>
                              <span className="text-lg font-semibold text-gray-400 line-through">₹{basePrice.toLocaleString()}</span>
                            </div>

                            {offerDiscount > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Offer Discount</span>
                                <span className="text-green-600 font-semibold">- ₹{offerDiscount.toLocaleString()}</span>
                              </div>
                            )}

                            {festivalDiscount > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600"> Festival ({festivalPercent}%)</span>
                                <span className="text-green-600 font-semibold">- ₹{festivalDiscount.toFixed(0)}</span>
                              </div>
                            )}

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-base font-bold text-gray-800">Final Price</span>
                                <span className="text-2xl font-bold text-green-700">₹{finalPrice.toLocaleString()}</span>
                              </div>
                              {totalSavings > 0 && (
                                <div className="text-xs text-green-600 font-semibold">
                                  You save ₹{totalSavings.toLocaleString()}!
                                </div>
                              )}
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-blue-800">
                                  {resive
                                    ? `Received Amount (20%) `
                                    : "Booking Amount (20%)"}
                                </span>

                                <span className="text-xl font-bold text-blue-600">₹{itineraryData?.bookingAmount || 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => saveBookingToDatabase("Booked")}
                      disabled={true}
                      className="w-full cursor-not-allowed bg-gray-300 text-gray-500 rounded-xl py-4 font-bold text-lg transition-all duration-200"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>





            </div>
            <div>
              {/* Theme Selection Dropdown */}
              <div className="px-4 py-4">
                {/* ========================= THEME SELECTION ========================= */}
                <section className="mb-10">
                  <h2 className="text-xl flex items-center gap-2 font-bold mb-4 text-gray-800 text-center sm:text-left">
                    <Moon /> Select a Theme
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {themes.map((theme) => {
                      const isSelected = selectedTheme?._id === theme._id;

                      return (
                        <div
                          key={theme._id}
                          onClick={() => handleThemeChange(theme)}
                          className={`cursor-pointer overflow-hidden rounded-lg border relative 
                ${isSelected ? "border-4 border-blue-500" : "border-gray-300"}
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
                              className="w-full h-44 sm:h-52 md:h-60 lg:h-64 object-cover"
                            />
                          )}

                          <div className="absolute bottom-0 w-full bg-gray-800 text-white text-center py-2 text-sm">
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

                {/* ========================= CONTACT SELECTION ========================= */}
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

                        // console.log(userName, contactName, userEmail, contactEmails, "datasolid");

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




              {/* Your existing booking UI */}
              <div className="px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row justify-between gap-4">
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors duration-200 font-medium"
                  onClick={() => setStep("itinerary-builder")}
                >
                  Back to Edit
                </button>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium"
                    onClick={() => saveBookingToDatabase("pending")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-200 text-accent-foreground rounded-xl hover:bg-blue-200/90 transition-colors duration-200 font-medium"
                    onClick={handlePrint}
                  >
                    Download PDF
                  </button>
                  {/* <button
                    className="px-4 cursor-pointer sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium"
                    onClick={() => saveBookingToDatabase("Booked")}
                  >
                    {isSubmitting ? "Booking Confirmed" : "Confirm Booking"}
                  </button> */}
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