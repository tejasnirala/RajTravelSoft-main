import React, { useState, useEffect } from "react";
import axios from "axios";

const CarBookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filters, setFilters] = useState({
    bookingStatus: '',
    paymentStatus: '',
    startDate: '',
    endDate: ''
  });
  const [addingPayment, setAddingPayment] = useState({ show: false, bookingId: null });
  const [viewDetails, setViewDetails] = useState({ show: false, booking: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, bookingId: null });
  const [newPayment, setNewPayment] = useState({ title: '', amount: '', date: '' });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("https://apitour.rajasthantouring.in/api/carbookings/all");
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (filters.bookingStatus) {
      filtered = filtered.filter(b => b.bookingStatus === filters.bookingStatus);
    }
    if (filters.paymentStatus) {
      filtered = filtered.filter(b => b.paymentStatus === filters.paymentStatus);
    }
    if (filters.startDate) {
      filtered = filtered.filter(b => new Date(b.pickupDate) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(b => new Date(b.dropDate) <= new Date(filters.endDate));
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(`https://apitour.rajasthantouring.in/api/carbookings/${bookingId}/status`, {
        bookingStatus: newStatus
      });
      fetchBookings();
      alert('Status updated successfully');
    } catch (err) {
      console.error("Failed to update status", err);
      alert('Failed to update status');
    }
  };

  const updatePaymentStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(`https://apitour.rajasthantouring.in/api/carbookings/${bookingId}/payment`, {
        paymentStatus: newStatus
      });
      fetchBookings();
      alert('Payment status updated successfully');
    } catch (err) {
      console.error("Failed to update payment status", err);
      alert('Failed to update payment status');
    }
  };

  const addPayment = async (bookingId) => {
    if (!newPayment.title || !newPayment.amount || !newPayment.date) {
      alert('Please fill all payment fields');
      return;
    }
    try {
      await axios.post(`https://apitour.rajasthantouring.in/api/carbookings/${bookingId}/payment/add`, {
        title: newPayment.title,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date
      });
      fetchBookings();
      setAddingPayment({ show: false, bookingId: null });
      setNewPayment({ title: '', amount: '', date: '' });
      alert('Payment added successfully');
    } catch (err) {
      console.error("Failed to add payment", err);
      alert('Failed to add payment');
    }
  };

  const confirmDelete = async (bookingId) => {
    try {
      await axios.delete(`https://apitour.rajasthantouring.in/api/carbookings/${bookingId}`);
      fetchBookings();
      setDeleteModal({ show: false, bookingId: null });
      alert('Booking deleted successfully');
    } catch (err) {
      console.error("Failed to delete booking", err);
      alert('Failed to delete booking');
    }
  };

  const openDeleteModal = (bookingId) => {
    setDeleteModal({ show: true, bookingId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, bookingId: null });
  };

  const exportToExcel = async () => {
    try {
      const response = await axios.get("https://apitour.rajasthantouring.in/api/carbookings/export/excel", {
        responseType: 'blob',
        params: filters
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.log(err);
      
      console.error("Export failed", err);
      alert('Export failed: ' + err.message);
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await axios.get("https://apitour.rajasthantouring.in/api/carbookings/export/pdf", {
        responseType: 'blob',
        params: filters
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
      alert('Export failed: ' + err.message);
    }
  };

  const openAddPayment = (bookingId) => {
    setAddingPayment({ show: true, bookingId });
    setNewPayment({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const closeAddPayment = () => {
    setAddingPayment({ show: false, bookingId: null });
    setNewPayment({ title: '', amount: '', date: '' });
  };

  const openViewDetails = (booking) => {
    setViewDetails({ show: true, booking });
  };

  const closeViewDetails = () => {
    setViewDetails({ show: false, booking: null });
  };

  const getPaidAmount = (payments) => {
    return payments ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  };

  const formatIndianRupee = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const clearFilters = () => {
    setFilters({
      bookingStatus: '',
      paymentStatus: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Car Rental Bookings</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Manage and track all your car rental bookings</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm sm:text-base"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-red-700 transition-colors shadow-md text-sm sm:text-base"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Filters</h2>
            <button 
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Booking Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-2 py-2 sm:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                value={filters.bookingStatus}
                onChange={(e) => setFilters({...filters, bookingStatus: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-2 py-2 sm:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                value={filters.paymentStatus}
                onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
              >
                <option value="">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-2 py-2 sm:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-2 py-2 sm:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Bookings</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{filteredBookings.length}</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Revenue</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">
              {formatIndianRupee(filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0))}
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Paid</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">
              {formatIndianRupee(filteredBookings.reduce((sum, booking) => sum + getPaidAmount(booking.payments), 0))}
            </div>
          </div>
        </div>

        {/* Bookings List - Cards on Mobile, Table on Larger Screens */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vehicle & Locations
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dates & Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    {/* User Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {booking.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.user?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.user?.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle & Locations */}
                    <td className="px-6 py-4">
                      {/* <div className="text-sm font-medium text-gray-900">
                        {booking.vehicle?.type || 'N/A'}
                      </div> */}
                      <div className="text-sm text-gray-500">
                        {booking.vehicle?.type || 'N/A'} • {booking.vehicle?.model || 'N/A'}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Pickup:</span> {booking.pickupLocation}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Drop:</span> {booking.dropLocation}
                        </div>
                      </div>
                    </td>

                    {/* Dates & Amount */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{new Date(booking.pickupDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(booking.dropDate).toLocaleDateString()}</div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-medium text-green-600">
                          {formatIndianRupee(booking.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Paid: {formatIndianRupee(getPaidAmount(booking.payments))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.days} day{booking.days > 1 ? 's' : ''} • {booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <select
                          value={booking.bookingStatus}
                          onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                          className={`w-full text-sm rounded-lg px-3 py-1 font-medium border ${
                            booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                            booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                            booking.bookingStatus === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Completed">Completed</option>
                        </select>

                        <select
                          value={booking.paymentStatus}
                          onChange={(e) => updatePaymentStatus(booking._id, e.target.value)}
                          className={`w-full text-sm rounded-lg px-3 py-1 font-medium border ${
                            booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <button 
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm"
                          onClick={() => openAddPayment(booking._id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Payment
                        </button>
                        <button 
                          className="flex items-center gap-1 text-green-600 hover:text-green-900 text-sm"
                          onClick={() => openViewDetails(booking)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button 
                          className="flex items-center gap-1 text-red-600 hover:text-red-900 text-sm"
                          onClick={() => openDeleteModal(booking._id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* User Details */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <span className="text-blue-600 font-semibold text-sm">
                      {booking.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {booking.user?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {booking.user?.email || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.user?.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Vehicle & Locations */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {booking.vehicle?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {booking.vehicle?.type || 'N/A'} • {booking.vehicle?.model || 'N/A'}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div><span className="font-medium">Pickup:</span> {booking.pickupLocation}</div>
                    <div><span className="font-medium">Drop:</span> {booking.dropLocation}</div>
                  </div>
                </div>

                {/* Dates & Amount */}
                <div className="mb-3">
                  <div className="text-sm text-gray-900 mb-1">
                    <div className="font-medium">{new Date(booking.pickupDate).toLocaleDateString()} to {new Date(booking.dropDate).toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-600">
                      {formatIndianRupee(booking.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Paid: {formatIndianRupee(getPaidAmount(booking.payments))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.days} day{booking.days > 1 ? 's' : ''} • {booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Booking Status</label>
                      <select
                        value={booking.bookingStatus}
                        onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                        className={`w-full text-xs rounded-lg px-2 py-1 font-medium border ${
                          booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                          booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                          booking.bookingStatus === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Payment Status</label>
                      <select
                        value={booking.paymentStatus}
                        onChange={(e) => updatePaymentStatus(booking._id, e.target.value)}
                        className={`w-full text-xs rounded-lg px-2 py-1 font-medium border ${
                          booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 text-blue-600 hover:text-blue-900 text-xs py-1 px-2 border border-blue-200 rounded"
                    onClick={() => openAddPayment(booking._id)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Payment
                  </button>
                  <button 
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 text-green-600 hover:text-green-900 text-xs py-1 px-2 border border-green-200 rounded"
                    onClick={() => openViewDetails(booking)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                  <button 
                    className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-red-600 hover:text-red-900 text-xs py-1 px-2 border border-red-200 rounded"
                    onClick={() => openDeleteModal(booking._id)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(filteredBookings.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-gray-500 text-lg font-medium">No bookings found</div>
              <div className="text-gray-400 text-sm mt-2">
                {bookings.length === 0 ? 'No bookings in the system' : 'Try changing your filters'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      {addingPayment.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New Payment</h2>
                <button 
                  onClick={closeAddPayment}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Advance, Full Payment, Partial"
                    value={newPayment.title}
                    onChange={(e) => setNewPayment({...newPayment, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={closeAddPayment}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => addPayment(addingPayment.bookingId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetails.show && viewDetails.booking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button 
                  onClick={closeViewDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{viewDetails.booking.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{viewDetails.booking.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-gray-900">{viewDetails.booking.user?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="space-y-2">
                    {/* <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{viewDetails.booking.vehicle?.name || 'N/A'}</p>
                    </div> */}
                    <div>
                      <span className="text-sm font-medium text-gray-600">Type:</span>
                      <p className="text-gray-900">{viewDetails.booking.vehicle?.type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Model:</span>
                      <p className="text-gray-900">{viewDetails.booking.vehicle?.model || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Pickup Location:</span>
                      <p className="text-gray-900">{viewDetails.booking.pickupLocation}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Drop Location:</span>
                      <p className="text-gray-900">{viewDetails.booking.dropLocation}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">{viewDetails.booking.days} day{viewDetails.booking.days > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Passengers:</span>
                      <p className="text-gray-900">{viewDetails.booking.passengers}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                      <p className="text-green-600 font-semibold">{formatIndianRupee(viewDetails.booking.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Paid Amount:</span>
                      <p className="text-blue-600 font-semibold">{formatIndianRupee(getPaidAmount(viewDetails.booking.payments))}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Balance:</span>
                      <p className="text-orange-600 font-semibold">
                        {formatIndianRupee(viewDetails.booking.totalAmount - getPaidAmount(viewDetails.booking.payments))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Pickup Date:</span>
                      <p className="text-gray-900">{new Date(viewDetails.booking.pickupDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Drop Date:</span>
                      <p className="text-gray-900">{new Date(viewDetails.booking.dropDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Booking Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        viewDetails.booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        viewDetails.booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        viewDetails.booking.bookingStatus === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewDetails.booking.bookingStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        viewDetails.booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewDetails.booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewDetails.booking.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-gray-700">{viewDetails.booking.notes}</p>
                  </div>
                )}

                {/* Payment History */}
                {viewDetails.booking.payments && viewDetails.booking.payments.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h3>
                    <div className="space-y-2">
                      {viewDetails.booking.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                          <div>
                            <span className="font-medium text-gray-900">{payment.title}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({new Date(payment.date).toLocaleDateString()})
                            </span>
                          </div>
                          <span className="font-semibold text-green-600">{formatIndianRupee(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
                <button 
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center mb-6">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-lg">Are you sure you want to delete this booking?</p>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmDelete(deleteModal.bookingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarBookingList;