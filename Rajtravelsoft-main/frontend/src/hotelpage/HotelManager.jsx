import React, { useState, useEffect, useMemo } from 'react';

const HotelManager = () => {
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hotelData, setHotelData] = useState({
    name: '',
    categoryId: '',
    locationId: '',
    rating: 0,
    reviews: 0,
    googleReviewLink: '',
    image: null,
    price: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(""); // warning state
  const [showForm, setShowForm] = useState(false);

  // --- New Filter States ---
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  // -------------------------

  useEffect(() => {
    fetchHotels();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/hotels');
      const data = await response.json();
      setHotels(data);
    } catch (err) {
      setError('Failed to fetch hotels');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/locations');
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError('Failed to fetch locations');
    }
  };

  // --- Derived state for filtered hotels ---
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const nameMatch = hotel.name.toLowerCase().includes(filterName.toLowerCase());
      // Ensure hotel.categoryId and hotel.locationId exist before accessing _id
      const categoryMatch = !filterCategory || hotel.categoryId?._id === filterCategory;
      const locationMatch = !filterLocation || hotel.locationId?._id === filterLocation;

      return nameMatch && categoryMatch && locationMatch;
    });
  }, [hotels, filterName, filterCategory, filterLocation]);
  // -----------------------------------------

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files[0]) {
      setHotelData((prev) => ({ ...prev, image: files[0] }));
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setHotelData((prev) => ({
        ...prev,
        [name]: name === 'rating' || name === 'reviews'
          ? Number(value) || 0
          : value, // ← price ab string rahega
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hotelData.name.trim() || !hotelData.categoryId || !hotelData.locationId) {
      setError('Please fill all required fields (Name, Category, Location)');
      return;
    }
    if (hotelData.rating < 0 || hotelData.rating > 5) {
      setError('Rating must be between 0 and 5');
      return;
    }
    if (hotelData.reviews < 0) {
      setError('Reviews cannot be negative');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', hotelData.name.trim());
      formData.append('categoryId', hotelData.categoryId);
      formData.append('locationId', hotelData.locationId);
      formData.append('rating', hotelData.rating);
      formData.append('reviews', hotelData.reviews);
      formData.append('price', hotelData.price);
      formData.append('googleReviewLink', hotelData.googleReviewLink.trim());
      if (hotelData.image) {
        formData.append('image', hotelData.image);
      }

      const url = editingHotel
        ? `https://apitour.rajasthantouring.in/api/hotels/${editingHotel._id}`
        : 'https://apitour.rajasthantouring.in/api/hotels';
      const method = editingHotel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        setHotelData({ name: '', categoryId: '', locationId: '', rating: 0, reviews: 0, googleReviewLink: '', image: null });
        setImagePreview(null);
        setEditingHotel(null);
        setShowForm(false); // <-- Hide form after submit
        fetchHotels();
      } else {
        setError(editingHotel ? 'Failed to update hotel' : 'Failed to add hotel');
      }
    } catch (err) {
      setError(editingHotel ? 'Failed to update hotel' : 'Failed to add hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setHotelData({
      name: hotel.name,
      categoryId: hotel.categoryId._id,
      locationId: hotel.locationId._id,
      rating: hotel.rating,
      reviews: hotel.reviews,
      price: hotel.price,
      googleReviewLink: hotel.googleReviewLink || '',
      image: null,
    });
    setImagePreview(hotel.image ? `https://apitour.rajasthantouring.in${hotel.image}` : null);
    setShowForm(true); // <-- Show form when editing
  };

  const handleCancelEdit = () => {
    setEditingHotel(null);
    setHotelData({ name: '', categoryId: '', locationId: '', rating: 0, reviews: 0, googleReviewLink: '', image: null });
    setImagePreview(null);
    setShowForm(false); // <-- Hide form
  };

  const handleDelete = async (id) => {
    // Show warning first
    setWarning({ message: "Are you sure you want to delete this hotel?", id });

    // Stop if user doesn't confirm via page UI (you can add Yes/No buttons)
  };

  const confirmDelete = async (id) => {
    setWarning(""); // remove warning
    setLoading(true);
    setError(null);

    console.log(id);


    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/hotels/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchHotels();
      } else {
        setError("Failed to delete hotel");
      }
    } catch (err) {
      setError("Failed to delete hotel");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4 w-full mx-auto py-4">
      {loading && (
        <div className="text-center text-sm font-medium text-gray-600 animate-pulse">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-center text-sm font-medium text-red-500">
          {error}
        </div>
      )}

      {warning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className=" bg-white text-yellow-800 p-4 rounded-lg shadow-lg max-w-sm w-full text-center">
            {/* Message */}
            <p className="mb-2 text-sm">Are you sure you want to delete this hotel?</p>

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


      {/* Add Hotel Button */}
      {!showForm && (
        <div className="text-right">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 mr-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm"
          >
            Add Hotel
          </button>
        </div>
      )}

      {/* Add/Edit Hotel Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {editingHotel ? 'Edit Hotel' : 'Add Hotel'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields (same as your original) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hotel Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hotel Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={hotelData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  placeholder="Enter hotel name"
                  required
                />
              </div>



              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hotel Category
                </label>
                <select
                  name="categoryId"
                  value={hotelData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Description (Ab Textarea hai) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Price Description <span className="text-gray-500">(You can write full details)</span>
                </label>
                <textarea
                  name="price"
                  value={hotelData.price || ''}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm resize-none"
                  placeholder="e.g. Starting from ₹2,999 per night | Includes breakfast & WiFi | Seasonal rates apply | Deluxe Room: ₹4,500 | Suite: ₹8,000"
                />
                <p className="text-xs text-gray-500 mt-1">You can write full pricing details here</p>
              </div>
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hotel Location
                </label>
                <select
                  name="locationId"
                  value={hotelData.locationId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={hotelData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  placeholder="Enter rating (0-5)"
                />
              </div>

              {/* Reviews */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Number of Reviews
                </label>
                <input
                  type="number"
                  name="reviews"
                  value={hotelData.reviews}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  placeholder="Enter number of reviews"
                />
              </div>

              {/* Google Review Link */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Google Review Link
                </label>
                <input
                  type="url"
                  name="googleReviewLink"
                  value={hotelData.googleReviewLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  placeholder="Enter Google review link (optional)"
                />
              </div>

              {/* Image */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hotel Image
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Hotel preview"
                    className="mt-2 h-16 w-16 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-md disabled:opacity-50 text-sm"
              >
                {editingHotel ? 'Update Hotel' : 'Add Hotel'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- New Filter Section --- */}
      {!showForm && (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Filter Hotels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hotel Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                placeholder="Search by name..."
              />
            </div>

            {/* Filter by Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Location */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------- */}


      {/* Manage Hotels Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-blue-500">Manage Hotels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  S.NO.
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IMAGE
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  HOTEL NAME
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PRICE/NIGHT
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  LOCATION
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  RATING
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  REVIEWS
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  GOOGLE REVIEWS
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            {/* --- Updated table body to use filteredHotels --- */}
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHotels.length > 0 ? (
                filteredHotels.map((hotel, index) => (
                  <tr key={hotel._id} className="hover:bg-blue-50 transition-all duration-200">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {hotel.image ? (
                        <img
                          src={`https://apitour.rajasthantouring.in${hotel.image}`}
                          alt={hotel.name}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {hotel.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {hotel.categoryId?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 max-w-xs">
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {hotel.price || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {hotel.locationId?.name || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {hotel.rating.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {hotel.reviews}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {hotel.googleReviewLink ? (
                        <a
                          href={hotel.googleReviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          View on Google
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium flex gap-1">
                      <button
                        onClick={() => handleEdit(hotel)}
                        className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hotel._id)}
                        className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-sm text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-3 text-gray-500 text-sm">
                    {/* Updated message based on filters */}
                    {hotels.length > 0 ? 'No hotels match your filters.' : 'No hotels found.'}
                  </td>
                </tr>
              )}
            </tbody>
            {/* ----------------------------------------------- */}
          </table>
        </div>
      </div>
    </div>
  );
};

export default HotelManager;