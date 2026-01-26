import React, { useState, useEffect } from 'react';
import  FastLazyImage  from "../LazyImage"
const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [locationName, setLocationName] = useState('');
  const [locationImages, setLocationImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showForm, setShowForm] = useState(false); // <-- New state
  const [warning, setWarning] = useState(""); // warning state
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('https://apitour.rajasthantouring.in/api/locations');
      const data = await response.json();

      console.log(data);

      setLocations(data);
    } catch (err) {
      setError('Failed to fetch locations');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setLocationImages((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    const previewToRemove = imagePreviews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setLocationImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', locationName.trim());
      // Append kept existing images paths (strings) as JSON
      formData.append("existingImages", JSON.stringify(locationImages.filter((img) => typeof img === "string")));
      // Append only new images (Files)
      locationImages.filter((img) => img instanceof File).forEach((image) => {
        formData.append('images', image);
      });

      const url = editingLocation
        ? `https://apitour.rajasthantouring.in/api/locations/${editingLocation._id}`
        : 'https://apitour.rajasthantouring.in/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';
      console.log(method);

      const response = await fetch(url, {
        method,
        body: formData,
      });
      console.log(response);

      if (response.ok) {
        setLocationName('');
        setLocationImages([]);
        setImagePreviews([]);
        setEditingLocation(null);
        setShowForm(false); // <-- Hide form after submit
        fetchLocations();
      } else {
        setError(editingLocation ? 'Failed to update location' : 'Failed to add location');
      }
    } catch (err) {
      console.log(err);

      setError(editingLocation ? 'Failed to update location' : 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setShowForm(true); // <-- Show form for edit
    setLocationImages(location.images || []); // Preserve existing main image paths (strings)
    setImagePreviews(location.images?.map((img) => `https://apitour.rajasthantouring.in${img}`) || []);
  };

  const handleCancelEdit = () => {
    // Revoke blob URLs
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    });
    setEditingLocation(null);
    setLocationName('');
    setLocationImages([]);
    setShowForm(false); // <-- Hide form
    setImagePreviews([]);
  };


  const handleDelete = async (id) => {
    // Show warning first
    setWarning({ message: "Are you sure you want to delete this location?", id });

    // Stop if user doesn't confirm via page UI (you can add Yes/No buttons)
  };


  const confirmDelete = async (id) => {
    setWarning(""); // remove warning
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLocations();
      } else {
        setError('Failed to delete location');
      }
    } catch (err) {
      setError('Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  {
    loading && (
      <div
        className="text-center text-sm font-medium text-gray-600 animate-pulse bg-gray-100 py-2 rounded"
        aria-busy="true"
      >
        <svg
          className="animate-spin h-4 w-4 mx-auto text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        Loading...
      </div>
    )
  }

  {
    error && (
      <div className="text-center text-sm font-medium text-red-500 bg-red-50 py-2 rounded animate-fade-in">
        {error}
      </div>
    )
  }


  return (
    <div className="space-y-4 w-full mx-auto py-4 px-2 sm:px-4">


      {warning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className=" bg-white text-yellow-800 p-4 rounded-lg shadow-lg max-w-sm w-full text-center">
            {/* Message */}
            <p className="mb-2 text-sm">Are you sure you want to delete this location?</p>

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



      {!showForm && (
        <div className="text-right">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm"
          >
            Add Location
          </button>
        </div>
      )}


      {/* Add/Edit Location Form */}

      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
            {editingLocation ? 'Edit Location' : 'Add Location'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  placeholder="Enter location name"
                  required
                  aria-label="Location Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                  aria-label="Location Images"
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <FastLazyImage
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          loading="lazy"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-md disabled:opacity-50 text-sm"
              >
                {editingLocation ? 'Update Location' : 'Add Location'}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all duration-300 shadow-md text-sm"
              >
                Cancel
              </button>

            </div>
          </form>
        </div>)}

      {/* Manage Locations Table */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-500">
            Manage Locations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                  S.NO.
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IMAGES
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  LOCATION NAME
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.length > 0 ? (
                locations.map((location, index) => (
                  <tr key={location._id} className="hover:bg-blue-50 transition-all duration-200">
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900 hidden sm:table-cell">
                      {index + 1}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      {location.images && location.images.length > 0 ? (
                        <div className="flex gap-1 w-[100px] sm:w-[300px] overflow-x-auto scrollbar-hide">
                          {location.images.map((image, imgIndex) => (
                            <FastLazyImage
                              key={imgIndex}
                              loading="lazy"
                              src={image ? `https://apitour.rajasthantouring.in${image}` : "/placeholder.svg"}
                              alt={`${location.name} image ${imgIndex + 1}`}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Images</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {location.name}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium flex flex-col sm:flex-row gap-1">
                      <button
                        onClick={() => handleEdit(location)}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm w-full sm:w-auto text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-sm w-full sm:w-auto text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-gray-500 text-xs">
                    No locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocationManager; 