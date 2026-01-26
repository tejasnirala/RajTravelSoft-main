"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange }) => {
  const quillRef = useRef();

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

const EnhancedItineraryManager = () => {
  const [itineraries, setItineraries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false); // Added to ensure categories are loaded
  const [showForm, setShowForm] = useState(false); // <-- New state
  const [itineraryData, setItineraryData] = useState({
    titles: [""],
    descriptions: [""],
    date: "",
    tourcode: '',
    duration: "",
    packagePricing: {}, // Initialized as empty object, populated after categories load
    days: [
      {
        dayNumber: 1,
        titles: [""],
        descriptions: [""],
        locations: [""],
        images: [],
      },
    ],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [dayImagePreviews, setDayImagePreviews] = useState({});
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [titleSearch, setTitleSearch] = useState("");
  const [tourcodesearch, setTourcodesearch] = useState("");
  const [durationSearch, setDurationSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [warning, setWarning] = useState(""); // warning state

  // Fetch categories, locations, and itineraries on component mount
  useEffect(() => {
    fetchItineraries();
    fetchLocations();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      console.log("Fetched categories:", data); // Debug log
      setCategories(data);

      // Initialize packagePricing with categories
      const initialPricing = {};
      data.forEach((category) => {
        initialPricing[category.name] = 0;
      });

      setItineraryData((prev) => ({
        ...prev,
        packagePricing: initialPricing,
      }));
      setCategoriesLoaded(true);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to fetch categories");
    }
  };

  const fetchItineraries = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/itineraries");
      if (!response.ok) throw new Error("Failed to fetch itineraries");
      const data = await response.json();
      setItineraries(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setError("Failed to fetch locations");
    }
  };

  const handleInputChange = (e, index, field) => {
    const { name, value: rawValue, files } = e.target;

    if (field === "images" && files && files.length) {
      const newImages = Array.from(files);
      setItineraryData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      setImagePreviews((prev) => [...prev, ...newImages.map((file) => URL.createObjectURL(file))]);
    } else if (name.startsWith("package.")) {
      const packageType = name.split(".")[1];
      setItineraryData((prev) => ({
        ...prev,
        packagePricing: {
          ...prev.packagePricing,
          [packageType]: Number(rawValue) || 0,
        },
      }));
    } else if (field === "titles" || field === "descriptions") {
      setItineraryData((prev) => ({
        ...prev,
        [field]: prev[field].map((item, i) => (i === index ? rawValue : item)),
      }));
    } else if (name === "tourcode") {
      setItineraryData((prev) => ({
        ...prev,
        tourcode: rawValue
      }));
    } else if (name === "duration") {
      const input = e.target;
      const rawValue = e.target.value;
      const prevValue = itineraryData.duration || "";

      const clean = rawValue.trim().replace(/\s/g, '');
      const match = clean.match(/^(\d+)n?$/);

      if (match) {
        const digits = match[1]; // "0", "05", "11"
        const hasN = clean.endsWith('n');
        const nights = parseInt(digits, 10);

        // Format nights
        let paddedNights;
        if (nights === 0) {
          paddedNights = '0'; // 0 → 0
        } else if (nights < 10) {
          paddedNights = `0${nights}`; // 1-9 → 01-09
        } else {
          paddedNights = `${nights}`; // 10+ → 10, 11...
        }

        // Format days (nights + 1)
        const days = nights + 1;
        let paddedDays;
        if (days < 10) {
          paddedDays = `0${days}`;
        } else {
          paddedDays = `${days}`;
        }

        const formatted = `${paddedNights} Nights / ${paddedDays} Days`;

        // Allow deletion
        if (rawValue.length < prevValue.length) {
          setItineraryData(prev => ({ ...prev, [name]: rawValue }));
          return;
        }

        // Format only when 'n' is pressed
        if (hasN) {
          setItineraryData(prev => ({ ...prev, [name]: formatted }));
          setTimeout(() => input.setSelectionRange(formatted.length, formatted.length), 0);
          return;
        }

        // Show original digits (with leading zeros if user typed)
        setItineraryData(prev => ({ ...prev, [name]: digits }));
        setTimeout(() => input.setSelectionRange(digits.length, digits.length), 0);
        return;
      }

      // Any other input
      setItineraryData(prev => ({ ...prev, [name]: rawValue }));
      setTimeout(() => input.setSelectionRange(rawValue.length, rawValue.length), 0);
    }
  }

  const removeMainImage = (index) => {
    const previewToRemove = imagePreviews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }


  };

  const removeDayImage = (dayIndex, imageIndex) => {
    const previewToRemove = dayImagePreviews[dayIndex]?.[imageIndex];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    setDayImagePreviews((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex]?.filter((_, i) => i !== imageIndex) || [],
    }));
    setItineraryData((prev) => ({
      ...prev,
      days: prev.days.map((day, dIndex) =>
        dIndex === dayIndex
          ? { ...day, images: day.images.filter((_, i) => i !== imageIndex) }
          : day
      ),
    }));
  };

  const handleDayDescriptionChange = (dayIndex, descIndex, value) => {
    setItineraryData((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i === dayIndex
          ? {
            ...day,
            descriptions: day.descriptions.map((desc, j) => (j === descIndex ? value : desc)),
          }
          : day,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itineraryData.titles[0].trim() ) {
      setError("Please fill all required fields (Title, Description, Date)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("titles", JSON.stringify(itineraryData.titles.filter((title) => title.trim())));
      formData.append("descriptions", JSON.stringify(itineraryData.descriptions.filter((desc) => desc.trim())));
      // Include tourcode (default or user-provided)
      formData.append("tourcode", itineraryData.tourcode);
      formData.append("date", itineraryData.date);
      formData.append("duration", itineraryData.duration);
      formData.append("packagePricing", JSON.stringify(itineraryData.packagePricing));
      formData.append(
        "days",
        JSON.stringify(
          itineraryData.days.map((day) => ({
            ...day,
            titles: day.titles.filter((title) => title.trim()),
            descriptions: day.descriptions.filter((desc) => desc.trim()),
            locations: day.locations.filter((loc) => loc.trim()),
            images: day.images.filter((img) => typeof img === "string"), // Preserve only existing image paths (strings)
          })),
        ),
      );

      // Append only new day images (Files)
      itineraryData.days.forEach((day, dayIndex) => {
        day.images?.filter((img) => img instanceof File).forEach((image) => {
          formData.append(`dayImages_${dayIndex}`, image);
        });
      });

      // Log FormData content for debugging
      console.log("FormData being sent:");
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }

      const url = editingItinerary
        ? `https://apitour.rajasthantouring.in/api/itineraries/${editingItinerary._id}`
        : "https://apitour.rajasthantouring.in/api/itineraries";
      const method = editingItinerary ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(editingItinerary ? "Failed to update itinerary" : "Failed to add itinerary");
      }

      const initialPricing = {};
      categories.forEach((category) => {
        initialPricing[category.name] = 0;
      });
      setShowForm(false); // <-- Hide form after submit

      setItineraryData({
        titles: [""],
        descriptions: [""],
        date: "",
        duration: "",
        packagePricing: initialPricing,
        days: [
          {
            dayNumber: 1,
            titles: [""],
            descriptions: [""],
            locations: [""],
            images: [],
          },
        ],
      });
      setImagePreviews([]);
      setDayImagePreviews({});
      setEditingItinerary(null);
      fetchItineraries();
    } catch (err) {
      console.log(err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (itinerary) => {
    setEditingItinerary(itinerary);
    setShowForm(true); // <-- Show form for edit
    const currentPricing = itinerary.packagePricing || {};
    const updatedPricing = {};
    categories.forEach((category) => {
      const key = category.name
      updatedPricing[key] = Number(currentPricing[key]) || 0;
    });
    console.log("Edited packagePricing:", updatedPricing); // Debug log

    setItineraryData({
      titles: itinerary.titles.length ? itinerary.titles : [""],
      descriptions: itinerary.descriptions.length ? itinerary.descriptions : [""],
      date: itinerary.date ? new Date(itinerary.date).toISOString().split("T")[0] : "",

      tourcode: itinerary.tourcode,
      duration: itinerary.duration || "",
      packagePricing: updatedPricing,
      days: itinerary.days.length
        ? itinerary.days.map((day) => ({
          ...day,
          titles: day.titles.length ? day.titles : [""],
          descriptions: day.descriptions.length ? day.descriptions : [""],
          locations: day.locations && day.locations.length ? day.locations : [""],
          images: day.images || [], // Preserve existing day image paths (strings)
        }))
        : [
          {
            dayNumber: 1,
            titles: [""],
            descriptions: [""],
            locations: [""],
            images: [],
          },
        ],
    });
    setImagePreviews(itinerary.images?.map((img) => `https://apitour.rajasthantouring.in${img}`) || []);
    setDayImagePreviews(
      itinerary.days?.reduce(
        (acc, day, index) => ({
          ...acc,
          [index]: day.images?.map((img) => `https://apitour.rajasthantouring.in${img}`) || [],
        }),
        {},
      ) || {},
    );
  };

  const handleCancelEdit = () => {
    // Revoke blob URLs
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    });
    Object.values(dayImagePreviews).forEach(previews => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      });
    });
    setEditingItinerary(null);
    setShowForm(false); // <-- Hide form
    const initialPricing = {};
    categories.forEach((category) => {
      initialPricing[category.name] = 0;
    });

    setItineraryData({
      titles: [""],
      descriptions: [""],
      date: "",

      duration: "",
      packagePricing: initialPricing,
      days: [
        {
          dayNumber: 1,
          titles: [""],
          descriptions: [""],
          locations: [""],
          images: [],
        },
      ],
    });
    setImagePreviews([]);
    setDayImagePreviews({});
  };

  const handleDayChange = (dayIndex, index, field, value) => {
    setItineraryData((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== dayIndex) return day;

        let updatedDay = day;
        if (field === "locations") {
          updatedDay = {
            ...updatedDay,
            locations: day.locations.map((loc, j) => (j === index ? value : loc)),
          };

          // Auto-append images from the selected location if a value is selected
          if (value) {
            const selectedLoc = locations.find((l) => l.name === value);
            if (selectedLoc?.images?.length > 0) {
              const newImagePaths = selectedLoc.images;
              updatedDay = {
                ...updatedDay,
                images: [...updatedDay.images, ...newImagePaths],
              };
            }
          }
        } else {
          updatedDay = {
            ...updatedDay,
            [field]: updatedDay[field]?.map((item, j) => (j === index ? value : item)) || [],
          };
        }
        return updatedDay;
      }),
    }));

    // Update previews for location images (appended above)
    if (field === "locations" && value) {
      const selectedLoc = locations.find((l) => l.name === value);
      if (selectedLoc?.images?.length > 0) {
        const newPreviews = selectedLoc.images.map((img) => `https://apitour.rajasthantouring.in${img}`);
        setDayImagePreviews((prev) => ({
          ...prev,
          [dayIndex]: [...(prev[dayIndex] || []), ...newPreviews],
        }));
      }
    }
  };

  const handleDayImageChange = (dayIndex, files) => {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files);
    setItineraryData((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i === dayIndex ? { ...day, images: [...(day.images || []), ...newImages] } : day,
      ),
    }));
    setDayImagePreviews((prev) => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), ...newImages.map((file) => URL.createObjectURL(file))],
    }));
  };

  const addTitle = (field, index = null, type = null, dayIndex = null, descIndex = null) => {
    if (index === null) {
      setItineraryData((prev) => ({
        ...prev,
        [field]: [...prev[field], ""],
      }));
    } else if (type === "descriptions") {
      setItineraryData((prev) => ({
        ...prev,
        days: prev.days.map((day, i) =>
          i === dayIndex
            ? {
              ...day,
              descriptions: [...day.descriptions, ""],
            }
            : day,
        ),
      }));
    } else {
      setItineraryData((prev) => ({
        ...prev,
        days: prev.days.map((day, i) => (i === dayIndex ? { ...day, [field]: [...day[field], ""] } : day)),
      }));
    }
  };

  const removeTitle = (field, titleIndex, index = null, type = null, dayIndex = null, descIndex = null) => {
    if (index === null) {
      if (itineraryData[field].length > 1) {
        setItineraryData((prev) => ({
          ...prev,
          [field]: prev[field].filter((_, i) => i !== titleIndex),
        }));
      }
    } else if (type === "descriptions") {
      setItineraryData((prev) => ({
        ...prev,
        days: prev.days.map((day, i) =>
          i === dayIndex && day.descriptions.length > 1
            ? {
              ...day,
              descriptions: day.descriptions.filter((_, j) => j !== index),
            }
            : day,
        ),
      }));
    } else {
      setItineraryData((prev) => ({
        ...prev,
        days: prev.days.map((day, i) =>
          i === dayIndex && day[field].length > 1
            ? { ...day, [field]: day[field].filter((_, j) => j !== titleIndex) }
            : day,
        ),
      }));
    }
  };

  const addDay = () => {
    setItineraryData((prev) => ({
      ...prev,
      days: [
        ...prev.days,
        {
          dayNumber: prev.days.length + 1,
          titles: [""],
          descriptions: [""],
          locations: [""],
          images: [],
        },
      ],
    }));
  };

  const removeDay = (dayIndex) => {
    if (itineraryData.days.length > 1) {
      // Revoke blob URLs for removed day
      const previewsToRevoke = dayImagePreviews[dayIndex] || [];
      previewsToRevoke.forEach(preview => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      });
      setItineraryData((prev) => ({
        ...prev,
        days: prev.days
          .filter((_, index) => index !== dayIndex)
          .map((day, index) => ({ ...day, dayNumber: index + 1 })),
      }));
      setDayImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[dayIndex];
        return newPreviews;
      });
    }
  };

  const handleDelete = async (id) => {

    setWarning({ message: "Are you sure you want to delete this Itinerary?", id });

  };

  const confirmDelete = async (id) => {
    setWarning(""); // remove warning
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/itineraries/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete itinerary");
      fetchItineraries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocationCounts = (days) => {
    const locationCounts = {};

    // Exclude the last day from counting (only count locations from previous days)
    const daysToCount = days.length > 1 ? days.slice(0, -1) : days;

    daysToCount.forEach((day) => {
      if (day.locations && day.locations.length) {
        day.locations.forEach((location) => {
          if (location.trim()) {
            locationCounts[location] = (locationCounts[location] || 0) + 1;
          }
        });
      }
    });

    // Format like "Jaipur 1-n"
    return Object.entries(locationCounts)
      .map(([loc, count]) => `${loc} ${count}-N`)
      .join(", ");
  };


  const filteredItineraries = itineraries.filter(
    (itinerary) => {
      const matchesTitle = !titleSearch || itinerary.titles.some((title) => title.toLowerCase().includes(titleSearch.toLowerCase()));
      const matchtourcode = !tourcodesearch || itinerary.tourcode?.toLowerCase().includes(tourcodesearch.toLowerCase());
      const matchesDuration = !durationSearch || itinerary.duration?.toLowerCase().includes(durationSearch.toLowerCase());
      const matchesLocation = !locationSearch || itinerary.days.some((day) => day.locations.some((loc) => loc.toLowerCase().includes(locationSearch.toLowerCase())));
      return matchesTitle && matchesDuration && matchesLocation && matchtourcode;
    }
  );

  const sortedItineraries = filteredItineraries.sort((a, b) => {
    const extractNumber = (duration) => {
      if (!duration) return 0;

      // Remove all non-digit chars and extract continuous numbers
      const match = duration.match(/(\d+)/);

      return match ? parseInt(match[1], 10) : 0;
    };

    return extractNumber(a.duration) - extractNumber(b.duration);
  });



  return (
    <div className="min-h-screen ">
      <div className="text-blue-500 p-1 sm:p-2">
        <h1 className="sm:text-2xl text-lg text-center font-bold">{editingItinerary ? "Edit Itinerary" : "Manage Itinerary"}</h1>
      </div>

      <div className="w-full mx-auto p-2 space-y-4">
        {loading && <div className="text-center text-sm font-medium text-gray-600 animate-pulse">Loading...</div>}

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

        {/* Add Hotel Button */}
        {!showForm && (
          <div className="text-right">
            <button
              onClick={() => setShowForm(true)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-300"
            >
              Add Itinerary
            </button>
          </div>
        )}

        {warning && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className=" bg-white text-yellow-800 p-4 rounded-lg shadow-lg max-w-sm w-full text-center">
              {/* Message */}
              <p className="mb-2 text-sm">Are you sure you want to delete this itinerary?</p>

              {/* Yes / No buttons */}
              <div className="flex justify-center gap-2">
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                  onClick={() => confirmDelete(warning.id)}
                >
                  Yes
                </button>
                <button
                  className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 transition text-sm"
                  onClick={() => setWarning(null)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md sm:p-4 p-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Titles</h3>
                {itineraryData.titles.map((title, index) => (
                  <div key={index} className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleInputChange(e, index, "titles")}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      placeholder={`Title ${index + 1}`}
                      required={index === 0}
                    />
                    {itineraryData.titles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTitle("titles", index)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTitle("titles")}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Title
                </button>
              </div>

              {/* <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Descriptions</h3>
                {itineraryData.descriptions.map((desc, index) => (
                  <div key={index} className="flex gap-1 items-center">
                    <textarea
                      value={desc}
                      onChange={(e) => handleInputChange(e, index, "descriptions")}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      placeholder={`Description ${index + 1}`}
                      rows={3}
                      required={index === 0}
                    />
                    {itineraryData.descriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTitle("descriptions", index)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
             
              </div> */}

              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={itineraryData.duration}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      placeholder="e.g., 5 Nights/6 Days"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tour Code</label>
                    <input
                      type="text"
                      name="tourcode"
                      value={itineraryData.tourcode}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      placeholder="e.g., "
                    />
                  </div>
                </div>
              </div>




              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Day-wise Itinerary</h3>
                  <button
                    type="button"
                    onClick={addDay}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Add Day
                  </button>
                </div>

                {itineraryData.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="bg-gray-50 p-2 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700 text-sm">Day {day.dayNumber}</h4>
                      {itineraryData.days.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDay(dayIndex)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove Day
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Day Title</h5>
                        {day.titles.map((title, titleIndex) => (
                          <div key={titleIndex} className="flex gap-1 items-center mb-1">
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => handleDayChange(dayIndex, titleIndex, "titles", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                              placeholder={`Day ${day.dayNumber} Title ${titleIndex + 1}`}
                            />
                            {day.titles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTitle("titles", titleIndex, dayIndex, "day", dayIndex)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTitle("titles", dayIndex, "day", dayIndex)}
                          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                        >
                          Add Title
                        </button>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Day Description</h5>
                        {day.descriptions.map((desc, descIndex) => (
                          <div key={descIndex} className="mb-2 p-2 border border-gray-200 rounded-md">
                            <div className="flex gap-1 items-start mb-1">
                              <RichTextEditor
                                value={desc}
                                onChange={(value) => handleDayDescriptionChange(dayIndex, descIndex, value)}
                              />
                              {day.descriptions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTitle("descriptions", descIndex, dayIndex, "descriptions", dayIndex)
                                  }
                                  className="text-red-600 hover:text-red-800 text-xs mt-1"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* <button
                          type="button"
                          onClick={() => addTitle("descriptions", dayIndex, "descriptions", dayIndex)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          Add Description
                        </button> */}
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-gray-700">Locations</h5>
                        {day.locations.map((location, locationIndex) => (
                          <div key={locationIndex} className="flex gap-1 items-center mb-1">
                            <select
                              value={location}
                              onChange={(e) => handleDayChange(dayIndex, locationIndex, "locations", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                            >
                              <option value="">Select location</option>
                              {locations.map((loc) => (
                                <option key={loc._id} value={loc.name}>
                                  {loc.name}
                                </option>
                              ))}
                            </select>
                            {day.locations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTitle("locations", locationIndex, dayIndex, "day", dayIndex)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTitle("locations", dayIndex, "day", dayIndex)}
                          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                        >
                          Add Location
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Images</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleDayImageChange(dayIndex, e.target.files)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        />
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(dayImagePreviews[dayIndex] || []).map((preview, index) => (
                            <div key={index} className="relative inline-block">
                              <img
                                src={preview}
                                alt={`Day ${day.dayNumber} Preview ${index + 1}`}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeDayImage(dayIndex, index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>



              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  style={{ width: "fit-content", minWidth: "160px" }}
                  multiple
                  onChange={(e) => handleInputChange(e, null, "images")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative inline-block">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMainImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div> */}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !categoriesLoaded}
                  className="flex-1 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {editingItinerary ? "Update Itinerary" : "Add Itinerary"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-1 bg-gray-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Cancel
                </button>

              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="md:text-xl text-md text-center font-semibold text-gray-800">Manage Itinerary</h2>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 min-w-[200px]">
                  <label className="font-bold text-xs">Title:</label>
                  <input
                    type="text"
                    placeholder="Search Title"
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1 min-w-[200px]">
                  <label className="font-bold text-xs">TourCode:</label>
                  <input
                    type="text"
                    placeholder="Search tourCode"
                    value={tourcodesearch}
                    onChange={(e) => setTourcodesearch(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1 min-w-[200px]">
                  <label className="font-bold text-xs">Duration:</label>
                  <input
                    type="text"
                    placeholder="Search Duration"
                    value={durationSearch}
                    onChange={(e) => setDurationSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1 min-w-[200px]">
                  <label className="font-bold text-xs">Location:</label>
                  <input
                    type="text"
                    placeholder="Search Location"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.NO.
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TITLE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DURATION
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATIONS (COUNT)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour Code
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItineraries.length > 0 ? (
                  sortedItineraries.map((itinerary, index) => (

                    <tr key={itinerary._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{index + 1}.</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {itinerary.titles[0]?.length > 30
                          ? itinerary.titles[0].slice(0, 30) + "..."
                          : itinerary.titles[0]}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {itinerary.duration || "N/A"}
                      </td>
                      <td className="px-3 py-2 max-w-[200px] whitespace-normal break-words text-xs text-gray-900">
                        {getLocationCounts(itinerary.days) || "N/A"}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {itinerary.tourcode}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium flex gap-1">
                        <button
                          onClick={() => handleEdit(itinerary)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(itinerary._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-2 text-gray-500 text-xs">
                      No itineraries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedItineraryManager;