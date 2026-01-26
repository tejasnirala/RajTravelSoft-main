import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaYoutube, FaGlobe } from 'react-icons/fa';

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

const SendUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [policies, setPolicies] = useState({
        inclusions: [],
        exclusions: [],
        termsAndConditions: [],
        cancellationAndRefundPolicy: [],
        travelRequirements: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [userHotelSelections, setUserHotelSelections] = useState({});
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const getNumericValue = (field, category) => {
        const val = field?.[category];
        if (typeof val === 'number') return val;
        return val?.value || 0;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch booking data
                const bookingResponse = await axios.get(`https://apitour.rajasthantouring.in/api/pending/${id}`);
                setBooking(bookingResponse.data);
                if (bookingResponse.data && Object.keys(bookingResponse.data.hotelSelections || {}).length > 0) {
                    const categories = Object.keys(bookingResponse.data.hotelSelections);
                    setSelectedCategory(bookingResponse.data.selectedCategory || categories[0]);
                }

                // Fetch tour inclusion/exclusion data
                const token = Cookies.get('token') || Cookies.get('admin_token');
                const policiesResponse = await axios.get('https://apitour.rajasthantouring.in/api/tour-inclusion-exclusion', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (policiesResponse.data.data) {
                    setPolicies({
                        inclusions: policiesResponse.data.data.inclusions || [],
                        exclusions: policiesResponse.data.data.exclusions || [],
                        termsAndConditions: policiesResponse.data.data.termsAndConditions || [],
                        cancellationAndRefundPolicy: policiesResponse.data.data.cancellationAndRefundPolicy || [],
                        travelRequirements: policiesResponse.data.data.travelRequirements || [],
                    });
                }
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (booking) {
            setIsVehicleConfirmed(booking.vehicleConfirmed || booking.status === 'confirmed' || false);
            if (booking.itineraryData?.vehicle) {
                const vehicles = Array.isArray(booking.itineraryData.vehicle) ? booking.itineraryData.vehicle : [booking.itineraryData.vehicle];
                const preSelected = vehicles.find(v => v.selected === true);
                if (preSelected) {
                    setSelectedVehicleId(getVehicleId(preSelected));
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
                            ['breakfast', 'lunch', 'dinner'].forEach(meal => {
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

            await axios.put(`https://apitour.rajasthantouring.in/api/pending/${id}`, {
                userSelectedHotels: categoriesToUpdate,
                selectedCategory,
                status: "confirmed",
                totalAmout:getCategoryTotals()
            });
            const response = await axios.get(`https://apitour.rajasthantouring.in/api/pending/${id}`);
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

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50">Loading...</div>;
    if (error) return <div className="flex justify-center items-center min-h-screen text-red-500 bg-gray-50">{error}</div>;
    if (!booking) return <div className="flex justify-center items-center min-h-screen bg-gray-50">Booking not found</div>;

    const calculateDuration = (itinerary) => {
        const totalDays = itinerary.days?.length || 0;
        const nights = Math.max(0, totalDays - 1);
        return `${totalDays} Days ${nights} Nights`;
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



    const categories = Object.keys(booking.hotelSelections || {});
    const festivalValue = booking.itineraryData.festivalOffer?.value || 0;
    const festivalName = booking.itineraryData.festivalOffer?.name || booking.itineraryData.festivalOffer?.title || '';

    let vehicles = booking.itineraryData.vehicle;
    if (!Array.isArray(vehicles)) vehicles = [vehicles].filter(Boolean);
    const vehicleOptions = vehicles || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
            <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-blue-600 text-center">Your Booking Details</h1>

                {/* Client Details */}
                {booking.clientDetails && Object.keys(booking.clientDetails).length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            {booking.clientDetails.name && (
                                <p className="text-base"><strong>Name:</strong> {booking.clientDetails.name}</p>
                            )}
                            {booking.clientDetails.email && (
                                <p className="text-base"><strong>Email:</strong> {booking.clientDetails.email}</p>
                            )}
                            {booking.clientDetails.phone && (
                                <p className="text-base"><strong>Phone:</strong> {booking.clientDetails.phone}</p>
                            )}
                            {booking.clientDetails.travelDate && (
                                <p className="text-base"><strong>Travel Date:</strong> {booking.clientDetails.travelDate}</p>
                            )}
                            {booking.clientDetails.travelers && (
                                <p className="text-base"><strong>Travelers:</strong> {booking.clientDetails.travelers}</p>
                            )}
                            {(booking.clientDetails.adults || booking.clientDetails.adults === 0) && (
                                <p className="text-base"><strong>Adults:</strong> {booking.clientDetails.adults || 0}</p>
                            )}
                            {(booking.clientDetails.kids5to12 || booking.clientDetails.kids5to12 === 0) && (
                                <p className="text-base"><strong>Kids (5-12 Years):</strong> {booking.clientDetails.kids5to12 || 0}</p>
                            )}
                            {(booking.clientDetails.kidsBelow5 || booking.clientDetails.kidsBelow5 === 0) && (
                                <p className="text-base"><strong>Kids (Below 5 Years):</strong> {booking.clientDetails.kidsBelow5 || 0}</p>
                            )}
                            {(booking.clientDetails.rooms || booking.clientDetails.rooms === 0) && (
                                <p className="text-base"><strong>Rooms:</strong> {booking.clientDetails.rooms || 0}</p>
                            )}
                            {(booking.clientDetails.extraBeds || booking.clientDetails.extraBeds === 0) && (
                                <p className="text-base"><strong>Extra mattress:</strong> {booking.clientDetails.extraBeds || 0}</p>
                            )}
                        </div>
                    </section>
                )}


                {/* Package Summary */}
                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Package Summary</h2>
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        {calculateDuration(booking.itineraryData) && (
                            <p className="text-base">
                                <strong>Duration:</strong> {(booking.selectedItinerary.duration)}
                            </p>
                        )}
                        {booking.itineraryData?.titles?.[0] && (
                            <p className="text-base">
                                <strong>Package Title:</strong> {booking.itineraryData.titles[0]}
                            </p>
                        )}
                        {booking.itineraryData?.tourcode && (
                            <p className="text-base">
                                <strong>Tour Code:</strong> {booking.itineraryData.tourcode}
                            </p>
                        )}
                        {booking.itineraryData?.priceType && (
                            <p className="text-base">
                                <strong>Price Type:</strong> {booking.itineraryData.priceType}
                            </p>
                        )}
                        {festivalValue > 0 && (
                            <p className="text-base text-yellow-600">
                                <strong>{festivalName}: {festivalValue}% OFF</strong>
                            </p>
                        )}
                    </div>
                    {/* Per-Category Pricing Details in Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map(category => {
                            const isSelected = category === selectedCategory;
                            const price = getNumericValue(booking.itineraryData.pricing, category);
                            const offer = getNumericValue(booking.itineraryData.offers, category);
                            const festivalDiscount = Math.round(price * (festivalValue / 100));

                            return (
                                <div
                                    key={category}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 
          ${isSelected
                                            ? 'bg-green-50 border-green-400 shadow-md opacity-100'
                                            : 'bg-gray-50 hover:shadow-md opacity-35'
                                        }`}
                                    onClick={() => handleCategorySelect(category)}
                                >
                                    <h3
                                        className={`font-bold text-lg capitalize ${isSelected ? 'text-green-600' : 'text-gray-700'
                                            }`}
                                    >
                                        {category} Package {isSelected ? '(Selected)' : ''}
                                    </h3>

                                    <p className="text-base">
                                        <strong>Base Price:</strong> ₹{price}
                                    </p>

                                    {offer > 0 && (
                                        <p className="text-base">
                                            <strong>Discount:</strong> ₹{offer}
                                        </p>
                                    )}

                                    {festivalValue > 0 && (
                                        <p className="text-base text-yellow-600">
                                            <strong>{festivalName} ({festivalValue}%):</strong> ₹{festivalDiscount}
                                        </p>
                                    )}

                                    <p className="font-semibold text-base text-green-600">
                                        <strong>Total ({category}):</strong> ₹{getCategoryTotals()[category]}/-
                                    </p>

                                    <p className="text-base">
                                        <strong>Booking Amount ({category}):</strong> ₹{getNumericValue(booking.itineraryData.bookingAmount, category)}/-
                                    </p>

                                    {isEditMode && isSelected && (
                                        <p className="text-sm text-blue-600 mt-2">✓ Click on hotels below to select</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </section>

                {/* Single Edit Button at the top */}
                <div className="flex justify-end mb-6">
                    {!categories.every(cat => isCategoryConfirmed(cat)) && !isVehicleConfirmed && (
                        <button
                            onClick={toggleEditMode}
                            className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 shadow-md ${isEditMode
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {isEditMode ? 'Cancel Edit' : 'Edit Selections'}
                        </button>
                    )}
                </div>

                {/* Vehicle Details */}

                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                        Vehicle  {isVehicleConfirmed ? '(Confirmed)' : ''}
                    </h2>
                    {vehicleOptions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vehicleOptions.map((vehicle) => {
                                const vehicleId = getVehicleId(vehicle);
                                const isSelected = vehicle.selected || vehicleId === selectedVehicleId;
                                const isConfirmed = isVehicleConfirmed && isSelected;
                                return (
                                    <div
                                        key={vehicleId}
                                        className={`relative flex items-center p-4 border-2 rounded-lg transition-all duration-200
                            ${isConfirmed
                                                ? 'bg-green-50 border-green-400 shadow-md opacity-100'
                                                : isEditMode && !isVehicleConfirmed
                                                    ? 'bg-white border-gray-200 hover:bg-gray-50 opacity-100 cursor-pointer'
                                                    : 'bg-white border-gray-200 opacity-35 cursor-default'
                                            }`}
                                        onClick={() => !isVehicleConfirmed && isEditMode && handleVehicleSelect(vehicleId)}
                                    >
                                        {/* ✅ Confirmed Badge */}
                                        {isConfirmed && (
                                            <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                                                Confirmed
                                            </span>
                                        )}

                                        <input
                                            type="radio"
                                            name="vehicle"
                                            checked={isSelected}
                                            onChange={() => handleVehicleSelect(vehicleId)}
                                            className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                                            disabled={isVehicleConfirmed || !isEditMode}
                                        />

                                        <div className="flex items-center gap-3 flex-1">
                                            {vehicle.image ? (
                                                <img
                                                    src={`https://apitour.rajasthantouring.in${vehicle.image}`}
                                                    alt={`${vehicle.make} ${vehicle.model}`}
                                                    className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : null}
                                            <div className="flex-1 min-w-0">
                                                <span className={`font-medium block text-base ${isConfirmed ? 'text-green-700' : 'text-gray-800'}`}>
                                                   {vehicle.model} 
                                                </span>
                                                <span className="text-sm text-gray-500 block">
                                                    Color: {vehicle.color} | Type: {vehicle.type}
                                                </span>
                                                <span className="text-sm text-gray-500 block">
                                                    Price per KM: ₹{vehicle.price}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-base text-gray-500">No vehicles available</p>
                    )}
                    {!isVehicleConfirmed && isEditMode && vehicleOptions.length === 1 && selectedVehicleId === null && (
                        <p className="text-yellow-600 text-sm mt-2 italic">
                            Only one vehicle available. Select to confirm.
                        </p>
                    )}
                </section>


                {/* Hotels - Both categories always visible in grid */}
                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                        Hotel Selections
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map(category => (
                            <div key={category} className={`${category === selectedCategory ? "" : "opacity-35"} border rounded-lg bg-white p-4 shadow-sm`}>
                                <div className="flex justify-between items-center mb-3 border-b pb-2">
                                    <h3 className="font-bold text-lg text-gray-800 capitalize">
                                        {category} Package {category === selectedCategory ? '(Selected)' : ''}
                                    </h3>

                                </div>
                                {booking.itineraryData.hotels?.[category] ? (
                                    Object.keys(booking.itineraryData.hotels[category])
                                        .filter(key => !['selected', 'category'].includes(key))
                                        .map(dayId => (
                                            <div key={dayId} className="mb-4 p-3 border rounded bg-gray-50">
                                                <h4 className="font-bold text-md mb-2 text-gray-700">Day {dayId}</h4>
                                                {Object.keys(booking.itineraryData.hotels[category][dayId]).map(location => {
                                                    if (['selected', 'category'].includes(location)) return null;
                                                    const locationHotels = booking.itineraryData.hotels[category][dayId][location];
                                                    const userSelectedForLocation = userHotelSelections[category]?.[dayId]?.[location];
                                                    return (
                                                        <div key={location} className="mb-3">
                                                            <h5 className="font-semibold text-sm mb-1 text-gray-600">📍 {location}</h5>
                                                            {['breakfast', 'lunch', 'dinner'].map(meal => {
                                                                const mealStruct = locationHotels[meal] || {};
                                                                const options = mealStruct.options || [];
                                                                const mealOptions = options.filter(h => h && getHotelId(h));
                                                                const userSelectedId = getHotelId(userSelectedForLocation?.[meal]);
                                                                const defaultSelectedId = mealOptions.length > 0 ? getHotelId(mealOptions[0]) : null;
                                                                const mealSelectedId = userSelectedId || defaultSelectedId;
                                                                if (mealOptions.length === 0) return null;
                                                                return (
                                                                    <div key={meal} className="mb-2">
                                                                        <strong className="capitalize block mb-1 text-sm text-gray-700">{meal}:</strong>
                                                                        <div className="space-y-2">
                                                                            {mealOptions.map((hotel) => {
                                                                                const hotelId = getHotelId(hotel);
                                                                                const isUserSelected = hotelId === userSelectedId;
                                                                                const isDefaultSelected = !userSelectedId && hotelId === defaultSelectedId;
                                                                                const isSelected = isUserSelected || isDefaultSelected;
                                                                                const showSelection = isEditMode && category === selectedCategory && !isCategoryConfirmed(category);

                                                                                return (
                                                                                    <div
                                                                                        key={hotelId}
                                                                                        className={`flex items-center p-2 border rounded transition-all ${isSelected
                                                                                            ? 'bg-green-50 border-green-400'
                                                                                            : 'bg-white border-gray-200'
                                                                                            } ${showSelection ? 'cursor-pointer hover:shadow' : 'cursor-default'}`}
                                                                                        onClick={() => showSelection && handleHotelSelect(category, dayId, location, meal, hotelId)}
                                                                                    >
                                                                                        {showSelection && (
                                                                                            <div className="mr-2 h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center">
                                                                                                {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600"></div>}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex items-center gap-2 flex-1">
                                                                                            {hotel.image && (
                                                                                                <img
                                                                                                    src={`https://apitour.rajasthantouring.in${hotel.image}`}
                                                                                                    alt={hotel.name}
                                                                                                    className="w-12 h-10 object-cover rounded flex-shrink-0"
                                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                                />
                                                                                            )}
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <span className={`font-medium block text-sm ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                                                                                                    {hotel.name}
                                                                                                </span>
                                                                                                <span className="text-xs text-yellow-500">{hotel.rating}★ ({hotel.reviews} reviews)</span>
                                                                                                <span className="text-xs text-gray-500 block">
                                                                                                    Check-in: {safeDateString(hotel.checkIn)} | Check-out: {safeDateString(hotel.checkOut)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        {!userSelectedForLocation?.[meal] && mealOptions.length > 0 && mealSelectedId === defaultSelectedId && (
                                                                            <p className="text-yellow-600 text-xs ml-6 mt-1 italic">
                                                                                {mealOptions.length === 1 ? 'Auto-selected' : 'Default selected - Click to change'}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                ) : (
                                    <div className="p-3 border rounded bg-yellow-50 text-center">
                                        <p className="text-sm text-yellow-700">No hotels available for this category.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Confirm Button */}
                    {isEditMode && !categories.every(cat => isCategoryConfirmed(cat)) && (
                        <button
                            onClick={confirmSelections}
                            className="mt-6 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md text-base font-medium w-full"
                        >
                            Confirm All Selections
                        </button>
                    )}
                </section>

                {/* Itinerary Overview */}
                {/* Itinerary Overview */}
                {booking.itineraryData?.days?.length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Itinerary Overview</h2>
                        <div className="space-y-4">
                            {booking.itineraryData.days.map((day, index) => (
                                <div
                                    key={day._id || index}
                                    className="p-4 border rounded-lg bg-blue-50 hover:shadow-md transition-shadow"
                                >
                                    {/* Day Title */}
                                    <h3 className="font-bold text-lg mb-2 text-gray-800">
                                        Day {day.id}: {day.titles?.[0] || `Day ${day.id}`}
                                    </h3>

                                    {/* Locations */}
                                    <p className="mb-2 text-base text-gray-700">
                                        <strong>Locations:</strong> {day.locations?.join(", ") || "N/A"}
                                    </p>

                                    {/* Description */}
                                    <div
                                        className="prose max-w-none text-base text-gray-600 mb-4"
                                        dangerouslySetInnerHTML={{
                                            __html: day.descriptions?.[0] || "No description available",
                                        }}
                                    />

                                    {/* Day-wise Images */}
                                    {day.images && day.images.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                            {day.images.map((img, imgIndex) => (
                                                <img
                                                    key={imgIndex}
                                                    src={img.startsWith("/uploads") ? `https://apitour.rajasthantouring.in${img}` : img}
                                                    alt={`Day ${day.id} image ${imgIndex + 1}`}
                                                    className="rounded-lg shadow-sm hover:shadow-md transition-all object-cover w-full h-48"
                                                    loading="lazy"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* Tour Policies */}
                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Tour Policies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inclusions */}
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Inclusions</h3>
                            {policies.inclusions.length > 0 ? (
                                <ul className="list-disc pl-5 text-base text-gray-600">
                                    {policies.inclusions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-base text-gray-500">No inclusions available</p>
                            )}
                        </div>

                        {/* Exclusions */}
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Exclusions</h3>
                            {policies.exclusions.length > 0 ? (
                                <ul className="list-disc pl-5 text-base text-gray-600">
                                    {policies.exclusions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-base text-gray-500">No exclusions available</p>
                            )}
                        </div>

                        {/* Terms & Conditions */}
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Terms & Conditions</h3>
                            {policies.termsAndConditions.length > 0 ? (
                                <ul className="list-disc pl-5 text-base text-gray-600">
                                    {policies.termsAndConditions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-base text-gray-500">No terms and conditions available</p>
                            )}
                        </div>

                        {/* Cancellation & Refund Policy */}
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Cancellation & Refund Policy</h3>
                            {policies.cancellationAndRefundPolicy.length > 0 ? (
                                <ul className="list-disc pl-5 text-base text-gray-600">
                                    {policies.cancellationAndRefundPolicy.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-base text-gray-500">No cancellation and refund policies available</p>
                            )}
                        </div>

                        {/* Payment Policy */}
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Payment Policy</h3>
                            {policies.travelRequirements.length > 0 ? (
                                <ul className="list-disc pl-5 text-base text-gray-600">
                                    {policies.travelRequirements.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-base text-gray-500">No Payment Policy available</p>
                            )}
                        </div>
                    </div>
                </section>



                {booking.contact && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                            Contact Information
                        </h2>

                        <div className="bg-white shadow-md rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            {booking.contact?.name && (
                                <div className="flex flex-col">
                                    <span className="text-gray-500 font-semibold text-sm">Name</span>
                                    <span className="text-gray-800 font-medium text-base">{booking.contact.name}</span>
                                </div>
                            )}

                            {/* Emails */}
                            {Array.isArray(booking.contact?.emails) && booking.contact.emails.length > 0 && (
                                <div className="flex flex-col">
                                    <span className="text-gray-500 font-semibold text-sm">Emails</span>
                                    <span className="text-gray-800 text-base">{booking.contact.emails.join(", ")}</span>
                                </div>
                            )}

                            {/* Mobiles */}
                            {Array.isArray(booking.contact?.mobiles) && booking.contact.mobiles.length > 0 && (
                                <div className="flex flex-col">
                                    <span className="text-gray-500 font-semibold text-sm">Mobiles</span>
                                    <span className="text-gray-800 text-base">{booking.contact.mobiles.join(", ")}</span>
                                </div>
                            )}

                            {/* Addresses */}
                            {Array.isArray(booking.contact?.addresses) && booking.contact.addresses.length > 0 && (
                                <div className="col-span-full">
                                    <span className="text-gray-500 font-semibold text-sm">Addresses</span>
                                    <div className="mt-2 space-y-2 text-gray-700 text-sm ml-2">
                                        {booking.contact.addresses.map((addr, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-md shadow-sm">
                                                {addr.street && <p>{addr.street}</p>}
                                                {addr.city && <p>{addr.city}</p>}
                                                {addr.state && <p>{addr.state}</p>}
                                                {addr.pincode && <p>{addr.pincode}</p>}
                                                {addr.country && <p>{addr.country}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            {booking.contact?.socialLinks && (
                                <div className="col-span-full mt-4">
                                    <span className="text-gray-500 font-semibold text-sm">Social Links</span>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        {booking.contact.socialLinks.facebook && (
                                            <a
                                                href={booking.contact.socialLinks.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                            >
                                                <FaFacebook /> Facebook
                                            </a>
                                        )}
                                        {booking.contact.socialLinks.instagram && (
                                            <a
                                                href={booking.contact.socialLinks.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition"
                                            >
                                                <FaInstagram /> Instagram
                                            </a>
                                        )}
                                        {booking.contact.socialLinks.linkedin && (
                                            <a
                                                href={booking.contact.socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                                            >
                                                <FaLinkedin /> LinkedIn
                                            </a>
                                        )}
                                        {booking.contact.socialLinks.twitter && (
                                            <a
                                                href={booking.contact.socialLinks.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-400 hover:bg-blue-100 transition"
                                            >
                                                <FaTwitter /> Twitter
                                            </a>
                                        )}
                                        {booking.contact.socialLinks.youtube && (
                                            <a
                                                href={booking.contact.socialLinks.youtube}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                                            >
                                                <FaYoutube /> YouTube
                                            </a>
                                        )}
                                        {booking.contact.socialLinks.website && (
                                            <a
                                                href={booking.contact.socialLinks.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                                            >
                                                <FaGlobe /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}


                {/* <button
                    onClick={() => navigate('/')}
                    className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md text-base font-medium"
                >
                    Back to Home
                </button> */}


            </div>
        </div>
    );
};

export default SendUser;