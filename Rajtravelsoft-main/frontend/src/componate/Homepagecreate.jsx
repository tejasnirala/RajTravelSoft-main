import React, { useState, useEffect } from 'react';

const API_BASE = 'https://apitour.rajasthantouring.in/api'; // Adjust to your backend URL

const Homepagecreate = () => {
  const [softwares, setSoftwares] = useState([]);
  const [formData, setFormData] = useState({
    softwareName: '',
    description: '',
    companyName: '',
    year: '',
    rating: '',
    reviews: '',
    g2ReviewLink: '', // New field for G2 review link
    tripadviserlink: '',
     tripadvisorRating: '',     // ⭐ NEW
  tripadvisorReviews: ''  
  });
  const [editingId, setEditingId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [headerLogoFile, setHeaderLogoFile] = useState(null); // New state for header logo file
  const [currentLogo, setCurrentLogo] = useState(null); // Current logo URL during edit
  const [currentHeaderLogo, setCurrentHeaderLogo] = useState(null); // New state for current header logo URL
  const [showForm, setShowForm] = useState(false); // New state to control form visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all softwares
  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const response = await fetch(`${API_BASE}/toursoftware`);
      const data = await response.json();
      setSoftwares(data);
    } catch (err) {
      setError('Failed to fetch softwares');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'logo') {
      setLogoFile(files[0]);
    } else if (name === 'headerLogo') {
      setHeaderLogoFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('softwareName', formData.softwareName);
      submitData.append('description', formData.description);
      submitData.append('companyName', formData.companyName);
      submitData.append('year', formData.year);
      submitData.append('rating', formData.rating);
      submitData.append('reviews', formData.reviews);
      submitData.append('g2ReviewLink', formData.g2ReviewLink); // New field
      submitData.append("tripadviserlink", formData.tripadviserlink);
      submitData.append('tripadvisorRating', formData.tripadvisorRating);
submitData.append('tripadvisorReviews', formData.tripadvisorReviews);


      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      if (headerLogoFile) {
        submitData.append('headerLogo', headerLogoFile);
      }

      const url = editingId
        ? `${API_BASE}/toursoftware/${editingId}`
        : `${API_BASE}/toursoftware`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      await fetchSoftwares();
      resetForm();
      setShowForm(false); // Hide form after successful submit
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (software) => {
    setEditingId(software._id);
    setFormData({
      softwareName: software.softwareName,
      description: software.description,
      companyName: software.companyName,
      year: software.year,
      rating: software.rating || '',
      reviews: software.reviews || '',
      g2ReviewLink: software.g2ReviewLink || '', // New field
      tripadviserlink: software.tripadviserlink || '',
      tripadvisorRating: software.tripadvisorRating || '',
tripadvisorReviews: software.tripadvisorReviews || '',

      

    });
    setLogoFile(null);
    setHeaderLogoFile(null);
    setCurrentLogo(software.logo); // Set current logo URL
    setCurrentHeaderLogo(software.headerLogo); // Set current header logo URL
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await fetch(`${API_BASE}/toursoftware/${id}`, { method: 'DELETE' });
      await fetchSoftwares();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      softwareName: '',
      description: '',
      companyName: '',
      year: '',
      rating: '',
      reviews: '',
      g2ReviewLink: '', // New field
      tripadviserlink:'',
      tripadvisorRating: '',
tripadvisorReviews: '',

    });
    setEditingId(null);
    setLogoFile(null);
    setHeaderLogoFile(null);
    setCurrentLogo(null);
    setCurrentHeaderLogo(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="min-h-auto bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">Home Page</h1>

        {/* Add New Button - Shown when form is hidden */}
        {!showForm && !softwares.length > 0 && (
          <div className="mb-8">
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Software
            </button>
          </div>
        )}


        {/* Form - Shown only when showForm is true */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Software' : 'Add Software'}
            </h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <input type="hidden" value={editingId || ''} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Software Name</label>
                <input
                  type="text"
                  name="softwareName"
                  value={formData.softwareName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max="2025"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reviews Count</label>
                <input
                  type="number"
                  name="reviews"
                  value={formData.reviews}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">G2 Review Link</label>
                <input
                  type="url"
                  name="g2ReviewLink"
                  value={formData.g2ReviewLink}
                  onChange={handleInputChange}
                  placeholder="https://www.g2.com/products/example/reviews"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TripAdvisor Link</label>
                <input
                  type="url"
                  name="tripadviserlink"
                  value={formData.tripadviserlink}
                  onChange={handleInputChange}
                  placeholder="https://www.tripadvisor.com/your-page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">TripAdvisor Rating (0–5)</label>
  <input
    type="number"
    name="tripadvisorRating"
    value={formData.tripadvisorRating}
    onChange={handleInputChange}
    min="0"
    max="5"
    step="0.1"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">TripAdvisor Reviews</label>
  <input
    type="number"
    name="tripadvisorReviews"
    value={formData.tripadvisorReviews}
    onChange={handleInputChange}
    min="0"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo </label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Logo Preview during Edit */}
                {editingId && currentLogo && !logoFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Current Logo:</p>
                    <img
                      src={`https://apitour.rajasthantouring.in${currentLogo}`}
                      alt="Current Logo"
                      className="h-20 w-auto object-cover rounded border"
                    />
                  </div>
                )}
                {logoFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Selected New Logo:</p>
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="New Logo Preview"
                      className="h-20 w-auto object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Header Logo</label>
                <input
                  type="file"
                  name="headerLogo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Header Logo Preview during Edit */}
                {editingId && currentHeaderLogo && !headerLogoFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Current Header Logo:</p>
                    <img
                      src={`https://apitour.rajasthantouring.in${currentHeaderLogo}`}
                      alt="Current Header Logo"
                      className="h-20 w-auto object-cover rounded border"
                    />
                  </div>
                )}
                {headerLogoFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Selected New Header Logo:</p>
                    <img
                      src={URL.createObjectURL(headerLogoFile)}
                      alt="New Header Logo Preview"
                      className="h-20 w-auto object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>



            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Software' : 'Add Software')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Software Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G2 Review Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TripAdvisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TA Rating</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TA Reviews</th>


                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Headerlogo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {softwares.map((software) => (
                <tr key={software._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{software.softwareName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{software.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{software.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{software.rating}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{software.reviews}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {software.g2ReviewLink ? (
                      <a
                        href={software.g2ReviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View on G2
                      </a>
                    ) : (
                      'No Link'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {software.tripadviserlink ? (
                      <a
                        href={software.tripadviserlink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        TripAdvisor
                      </a>
                    ) : (
                      "No Link"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {software.tripadvisorRating || "-"}
</td>

<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {software.tripadvisorReviews || "-"}
</td>


                  <td className="px-6 py-4 whitespace-nowrap">
                    {software.logo ? (
                      <img src={`https://apitour.rajasthantouring.in${software.logo}`} alt="Logo" className="h-10 w-auto object-cover rounded" />
                    ) : (
                      'No Logo'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {software.headerLogo ? (
                      <img src={`https://apitour.rajasthantouring.in${software.headerLogo}`} alt="Header Logo" className="h-10 w-auto object-cover rounded" />
                    ) : (
                      'No Header Logo'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        handleEdit(software);
                        setShowForm(true);
                      }}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(software._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {softwares.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500">No softwares found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepagecreate;