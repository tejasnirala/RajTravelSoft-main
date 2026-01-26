import React, { useState, useEffect } from 'react';

const CompanyInfoManager = () => {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyLogo: null, // File object or null
    companyAddress: '',
    companyGST: '',
    companyEmail: '',
    companyPhone: '',
    notes: '',
    billStartText: '',
    billStartNumber: '',
    reviewLink: ''
  });
  const [currentCompany, setCurrentCompany] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const API_BASE = 'https://apitour.rajasthantouring.in/api/billcontact';

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        setCurrentCompany(data);
        if (data) {
          setCompanyData({
            companyName: data.companyName || '',
            companyLogo: null, // Keep as null; display existing via currentCompany
            companyAddress: data.companyAddress || '',
            companyGST: data.companyGST || '',
            companyEmail: data.companyEmail || '',
            companyPhone: data.companyPhone || '',
            notes: data.notes || '',
            billStartText: data.billStartText || '',
            billStartNumber: data.billStartNumber || '',
            reviewLink: data.reviewLink || ''
          });
          setIsEditing(false); // Default to view mode
        }
      } else {
        console.warn('No company data found');
        setCurrentCompany(null);
        setMessage('No existing company data. Create a new one!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading company:', error);
      setMessage('Error loading company info. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('companyName', companyData.companyName);
    formData.append('companyAddress', companyData.companyAddress);
    formData.append('companyGST', companyData.companyGST);
    formData.append('companyEmail', companyData.companyEmail);
    formData.append('companyPhone', companyData.companyPhone);
    formData.append('notes', companyData.notes);
    formData.append('billStartText', companyData.billStartText);
    formData.append('billStartNumber', companyData.billStartNumber);
    formData.append('reviewLink', companyData.reviewLink);
    if (companyData.companyLogo) {
      formData.append('companyLogo', companyData.companyLogo);
    }
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        setMessage('Company info saved/updated successfully!');
        setCurrentCompany(result.data || result);
        setCompanyData(prev => ({ ...prev, companyLogo: null }));
        setIsEditing(false); // Switch back to view mode after save
        loadCompany(); // Reload to ensure fresh data
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        setMessage(`Error saving: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving company:', error);
      setMessage('Network/Server error. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'companyLogo') {
      setCompanyData(prev => ({
        ...prev,
        [name]: e.target.files[0] || null
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogoRemove = () => {
    setCompanyData(prev => ({ ...prev, companyLogo: null }));
    setMessage('Logo removal: Submit form to update backend.');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(''); // Clear any messages
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload data to discard changes
    loadCompany();
  };

  if (loading && !currentCompany) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // View Mode: Display data in a single card
  if (!isEditing) {
    return (
      <div className="font-sans w-full border-4 max-w-none mx-0 p-4 sm:p-5 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center underline text-blue-600 flex-1">Bill Information</h1>
          {currentCompany && (
            <button
              onClick={handleEdit}
              className="px-6 py-2 text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {!currentCompany ? (
          <div className="text-center py-8">
            <p>No company data available. Use the form below to create one.</p>
            <button
              onClick={handleEdit}
              className="mt-4 px-6 py-2 text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Create New
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md border w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company Name:</label>
                <p className="text-base text-gray-900 font-semibold">{currentCompany.companyName || 'N/A'}</p>
              </div>

              {/* Company Address */}
              <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company Address:</label>
                <p className="text-base text-gray-900">{currentCompany.companyAddress || 'N/A'}</p>
              </div>

              {/* Company GST */}
              <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company GST:</label>
                <p className="text-base text-gray-900">{currentCompany.companyGST || 'N/A'}</p>
              </div>

              {/* Company Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company Email:</label>
                <p className="text-base text-gray-900">{currentCompany.companyEmail || 'N/A'}</p>
              </div>

              {/* Company Phone */}
              <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company Phone:</label>
                <p className="text-base text-gray-900">{currentCompany.companyPhone || 'N/A'}</p>
              </div>

              {/* Bill Start Text */}
              {/* <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Bill Start Text:</label>
                <p className="text-base text-gray-900">{currentCompany.billStartText || 'N/A'}</p>
              </div> */}

              {/* Bill Start Number */}
              {/* <div className="space-y-1">
                <label className="text-sm font-medium block text-gray-700">Bill Start Number:</label>
                <p className="text-base text-gray-900">{currentCompany.billStartNumber || 'N/A'}</p>
              </div> */}

              {/* Company Logo - Spans full width */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium block text-gray-700">Company Logo:</label>
                {currentCompany.companyLogo ? (
                  <img
                    src={`https://apitour.rajasthantouring.in/uploads/${currentCompany.companyLogo}`}
                    alt="Current Logo"
                    className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-cover rounded border"
                    onError={(e) => { e.target.style.display = 'none'; console.warn('Logo image failed to load'); }}
                  />
                ) : (
                  <p className="text-sm text-gray-600">No logo uploaded</p>
                )}
              </div>

              {/* Notes - Spans full width */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium block text-gray-700">Notes:</label>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{currentCompany.notes || 'N/A'}</p>
              </div>

              {/* Review Link - Spans full width */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium block text-gray-700">Review Link:</label>
                {currentCompany.reviewLink ? (
                  <a
                    href={currentCompany.reviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:underline"
                  >
                    {currentCompany.reviewLink}
                  </a>
                ) : (
                  <p className="text-base text-gray-900">N/A</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode: Show the form
  return (
    <div className="font-sans w-full border-4 max-w-none mx-0 p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center underline text-blue-600 flex-1">Edit Bill Information</h1>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2 text-base bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6 w-full">
        {/* Company Name */}
        <div className="space-y-1">
          <label htmlFor="companyName" className="text-sm font-medium block text-gray-700">Company Name:</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={companyData.companyName}
            onChange={handleChange}
            required
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Company Logo */}
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="companyLogo" className="text-sm font-medium block text-gray-700">Company Logo:</label>
          <input
            type="file"
            id="companyLogo"
            name="companyLogo"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
          />
          {currentCompany?.companyLogo && !companyData.companyLogo && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
              <img
                src={`https://apitour.rajasthantouring.in/uploads/${currentCompany.companyLogo}`}
                alt="Current Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-cover rounded border"
                onError={(e) => { e.target.style.display = 'none'; console.warn('Logo image failed to load'); }}
              />
              <button
                type="button"
                onClick={handleLogoRemove}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
          {companyData.companyLogo && (
            <p className="text-sm text-gray-600 mt-1">Selected: {companyData.companyLogo.name}</p>
          )}
        </div>

        {/* Company Address */}
        <div className="space-y-1">
          <label htmlFor="companyAddress" className="text-sm font-medium block text-gray-700">Company Address:</label>
          <input
            type="text"
            id="companyAddress"
            name="companyAddress"
            value={companyData.companyAddress}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Company GST */}
        <div className="space-y-1">
          <label htmlFor="companyGST" className="text-sm font-medium block text-gray-700">Company GST:</label>
          <input
            type="text"
            id="companyGST"
            name="companyGST"
            value={companyData.companyGST}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Company Email */}
        <div className="space-y-1">
          <label htmlFor="companyEmail" className="text-sm font-medium block text-gray-700">Company Email:</label>
          <input
            type="email"
            id="companyEmail"
            name="companyEmail"
            value={companyData.companyEmail}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Company Phone */}
        <div className="space-y-1">
          <label htmlFor="companyPhone" className="text-sm font-medium block text-gray-700">Company Phone:</label>
          <input
            type="tel"
            id="companyPhone"
            name="companyPhone"
            value={companyData.companyPhone}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium block text-gray-700">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={companyData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
            disabled={loading}
          />
        </div>

        {/* Bill Start Text */}
        <div className="space-y-1">
          <label htmlFor="billStartText" className="text-sm font-medium block text-gray-700">Bill Start Text:</label>
          <input
            type="text"
            id="billStartText"
            name="billStartText"
            value={companyData.billStartText}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Bill Start Number */}
        <div className="space-y-1">
          <label htmlFor="billStartNumber" className="text-sm font-medium block text-gray-700">Bill Start Number:</label>
          <input
            type="text"
            id="billStartNumber"
            name="billStartNumber"
            value={companyData.billStartNumber}
            onChange={handleChange}
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Review Link */}
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="reviewLink" className="text-sm font-medium block text-gray-700">Review Link:</label>
          <input
            type="url"
            id="reviewLink"
            name="reviewLink"
            value={companyData.reviewLink}
            onChange={handleChange}
            placeholder="https://example.com/review"
            className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none px-6 py-2 text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save/Update Company Info'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 md:flex-none px-6 py-2 text-base bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyInfoManager;