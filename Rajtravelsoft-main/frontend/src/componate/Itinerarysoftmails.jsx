"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faTrash, faTimes, faFilter, faPlus } from "@fortawesome/free-solid-svg-icons"
const API_BASE = import.meta.env.VITE_SERVER_BASE_URL || "https://apitour.rajasthantouring.in"

const Itinerarysoftmails = () => {
  const [inquiries, setInquiries] = useState([])
  const [filteredInquiries, setFilteredInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [users, setUsers] = useState([])
  const [userLoading, setUserLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    mobile: "",
    packageTitle: "",
    startDate: "",
    endDate: "",
    message: "",
    assignedTo: "",
    status: "",
  })

  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  })

  // Filter visibility state
  const [showFilters, setShowFilters] = useState(false)

  // Multi-select state
  const [selectedInquiries, setSelectedInquiries] = useState([])
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [bulkAssignedTo, setBulkAssignedTo] = useState("")
  const [isAdding, setIsAdding] = useState(false);

  // New Inquiry Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newInquiryData, setNewInquiryData] = useState({
    name: "",
    email: "",
    mobile: "",
    packageTitle: "",
    message: "",
  })

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelInquiryId, setCancelInquiryId] = useState(null)
  const [cancelReason, setCancelReason] = useState("")

  // Fetch current user from /me endpoint
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/auth/me`, {
          withCredentials: "true"
        })
        setCurrentUser(response.data.user)
      } catch (err) {
        console.error('Failed to fetch current user')
      }
    }

    fetchCurrentUser()
  }, [])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/api/softmails`, {
        withCredentials: "true"
      })
      const allInquiries = response.data.data || []

      const isAdminRole = currentUser?.role === 'admin'
      let displayInquiries = allInquiries

      if (!isAdminRole && currentUser) {
        displayInquiries = allInquiries.filter((inquiry) => inquiry.assignedTo?._id === currentUser._id)
      }

      setInquiries(displayInquiries)
      setFilteredInquiries(displayInquiries)

      // Calculate summary
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      setSummary({
        total: displayInquiries.length,
        today: displayInquiries.filter((inquiry) => new Date(inquiry.createdAt) >= today).length,
        thisWeek: displayInquiries.filter((inquiry) => new Date(inquiry.createdAt) >= weekAgo).length,
        thisMonth: displayInquiries.filter((inquiry) => new Date(inquiry.createdAt) >= monthAgo).length,
      })

      // Clear selections on refresh
      setSelectedInquiries([])

      setLoading(false)
      setError(null)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch inquiries"
      setError(errorMessage)
      setLoading(false)
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  const loadUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') return
    try {
      setUserLoading(true)
      const response = await axios.get(`${API_BASE}/api/admin/users`, {
        withCredentials: "true"
      })
      // Load all regular users for assignment
      setUsers(response.data.users.otherRoles || [])

      console.log(response);

      setUserLoading(false)
    } catch (err) {
      console.error('Failed to load users')
      setUserLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
    if (currentUser) {
      loadUsers()
    }
  }, [currentUser])

  // getStatus now uses inquiry.status
  const getStatus = (inquiry) => {
    return inquiry.status || 'pending' // Fallback for old data
  }

  // Status badge color based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const applyFilters = () => {
    let result = [...inquiries]

    if (filters.name) {
      result = result.filter((inquiry) => inquiry.name?.toLowerCase().includes(filters.name.toLowerCase()))
    }

    if (filters.email) {
      result = result.filter((inquiry) => inquiry.email?.toLowerCase().includes(filters.email.toLowerCase()))
    }

    if (filters.mobile) {
      result = result.filter((inquiry) => inquiry.mobile?.includes(filters.mobile))
    }

    if (filters.packageTitle) {
      result = result.filter(
        (inquiry) =>
          inquiry.packageTitle?.toLowerCase().includes(filters.packageTitle.toLowerCase()),
      )
    }

    if (filters.message) {
      result = result.filter((inquiry) => inquiry.message?.toLowerCase().includes(filters.message.toLowerCase()))
    }

    if (filters.startDate) {
      result = result.filter((inquiry) => new Date(inquiry.createdAt) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      result = result.filter(
        (inquiry) => new Date(inquiry.createdAt) <= new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)),
      )
    }

    // Admin user-wise filter
    if (filters.assignedTo) {
      result = result.filter((inquiry) => inquiry.assignedTo?._id === filters.assignedTo)
    }

    // Status filter using new statuses
    if (filters.status) {
      result = result.filter((inquiry) => getStatus(inquiry) === filters.status)
    }

    setFilteredInquiries(result)
    toast.info(`Filters applied. Found ${result.length} inquiries.`, { autoClose: 2000 })
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplyFilters = () => {
    applyFilters()
  }

  const handleClearFilters = () => {
    setFilters({
      name: "",
      email: "",
      mobile: "",
      packageTitle: "",
      startDate: "",
      endDate: "",
      message: "",
      assignedTo: "",
      status: "",
    })
    setFilteredInquiries(inquiries)
    toast.info("Filters cleared!", { autoClose: 2000 })
  }

  const handleRefresh = () => {
    loadInquiries()
    toast.info("Refreshing inquiry data...", { autoClose: 2000 })
  }

  // Multi-select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInquiries(filteredInquiries.map(inq => inq._id))
    } else {
      setSelectedInquiries([])
    }
  }

  const handleSelectOne = (inquiryId) => {
    setSelectedInquiries(prev =>
      prev.includes(inquiryId)
        ? prev.filter(id => id !== inquiryId)
        : [...prev, inquiryId]
    )
  }

  const isSelected = (inquiryId) => selectedInquiries.includes(inquiryId)

  const handleBulkAssign = async () => {
    if (selectedInquiries.length === 0 || !bulkAssignedTo) return
    if (!window.confirm(`Assign ${selectedInquiries.length} selected inquiries to the user?`)) return

    try {
      // Bulk assign via multiple API calls (or implement bulk endpoint if needed)
      const assignPromises = selectedInquiries.map(id =>
        axios.put(`${API_BASE}/api/softmails/${id}/assign`, { assignedTo: bulkAssignedTo }, { withCredentials: true })
      )
      await Promise.all(assignPromises)
      toast.success(`${selectedInquiries.length} inquiries assigned successfully!`, { autoClose: 3000 })
      setSelectedInquiries([])
      setBulkAssignedTo("")
      setBulkAssigning(false)
      await loadInquiries()
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to assign inquiries"
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  // Handle status update - for cancel, open modal
  const handleUpdateStatus = async (inquiryId, newStatus) => {
    if (newStatus === 'cancelled') {
      setCancelInquiryId(inquiryId)
      setCancelReason('')
      setShowCancelModal(true)
      return
    }

    if (!window.confirm(`Mark this inquiry as "${newStatus}"?`)) return

    try {
      await axios.put(`${API_BASE}/api/softmails/${inquiryId}/status`, { status: newStatus }, { withCredentials: true })
      toast.success(`Status updated to "${newStatus}"!`, { autoClose: 3000 })
      await loadInquiries()
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update status"
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  // Handle cancel with reason
  const handleCancelInquiry = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancel reason!", { autoClose: 3000 })
      return
    }

    try {
      await axios.put(`${API_BASE}/api/softmails/${cancelInquiryId}/status`, {
        status: 'cancelled',
        cancelReason: cancelReason
      }, { withCredentials: true })
      toast.success("Inquiry cancelled successfully!", { autoClose: 3000 })
      setShowCancelModal(false)
      setCancelInquiryId(null)
      setCancelReason('')
      await loadInquiries()
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to cancel inquiry"
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancelInquiryId(null)
    setCancelReason('')
  }

  const handleDelete = async (inquiryId) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) return

    try {
      await axios.delete(`${API_BASE}/api/softmails/${inquiryId}`, {
        withCredentials: "true"
      })
      toast.success("Inquiry deleted successfully!", { autoClose: 3000 })
      await loadInquiries()
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete inquiry"
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  const handleAssign = async (inquiryId, assignedTo) => {
    if (!assignedTo) return
    try {
      await axios.put(`${API_BASE}/api/softmails/${inquiryId}/assign`, { assignedTo },
        { withCredentials: true })
      toast.success("Inquiry assigned successfully!", { autoClose: 3000 })
      await loadInquiries()
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to assign inquiry"
      toast.error(errorMessage, { autoClose: 3000 })
    }
  }

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry)
  }

  const closeModal = () => {
    setSelectedInquiry(null)
  }

  // New Inquiry Handlers - simplified without car and other
  const handleNewInquiryChange = (e) => {
    const { name, value } = e.target
    setNewInquiryData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddNewInquiry = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await axios.post(`${API_BASE}/api/softmails`, newInquiryData, {
        withCredentials: true
      });
      toast.success("New inquiry added successfully!", { autoClose: 3000 });
      setShowAddModal(false);
      setNewInquiryData({
        name: "",
        email: "",
        mobile: "",
        packageTitle: "",
        message: "",
      });
      await loadInquiries();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to add new inquiry";
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setIsAdding(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewInquiryData({
      name: "",
      email: "",
      mobile: "",
      packageTitle: "",
      message: "",
    })
  }

  const isNonUserRole = currentUser && currentUser.role !== 'user'

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-600 text-lg font-medium">Error: {error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const isAdminRole = currentUser?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-[100%] mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Itinerary Mails Management</h2>
          <div className="flex items-center gap-2">
            {isNonUserRole && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add New Soft Mail
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faFilter} />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h5m11 6v5h-5m-7-7h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Form */}
        {showFilters && (
          <div className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Name", name: "name", type: "text", placeholder: "Enter name" },
                { label: "Email", name: "email", type: "text", placeholder: "Enter email" },
                { label: "Mobile", name: "mobile", type: "text", placeholder: "Enter mobile" },
                { label: "Package Title", name: "packageTitle", type: "text", placeholder: "Enter package title" },
                { label: "Start Date", name: "startDate", type: "date" },
                { label: "End Date", name: "endDate", type: "date" },
                { label: "Message", name: "message", type: "text", placeholder: "Search in message" },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={filters[name]}
                    onChange={handleFilterChange}
                    placeholder={placeholder}
                    className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2"
                  />
                </div>
              ))}
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="booked">Booked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {/* Assigned To Filter for Admin */}
              {isAdminRole && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <select
                    name="assignedTo"
                    value={filters.assignedTo}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Inquiries", value: summary.total },
            { label: "Today", value: summary.today },
            { label: "This Week", value: summary.thisWeek },
            { label: "This Month", value: summary.thisMonth },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="text-lg font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Bulk Actions for Admin */}
        {isAdminRole && selectedInquiries.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <span className="text-sm text-gray-700">{selectedInquiries.length} inquiries selected</span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkAssignedTo}
                  onChange={(e) => setBulkAssignedTo(e.target.value)}
                  className="p-2 rounded-md border-gray-300"
                >
                  <option value="">Select user to assign</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignedTo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  Bulk Assign
                </button>
              </div>
              <button
                onClick={() => setSelectedInquiries([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Inquiry Table - without car/other references */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
            <span className="ml-2">Loading inquiries...</span>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <p className="text-gray-600 text-center py-8 text-lg">No inquiries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdminRole && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedInquiries.length === filteredInquiries.length && filteredInquiries.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {["Date", "Status", "Name", "Email", "Mobile", "Package Title", "Message", ...(isAdminRole ? ["Assigned To"] : []), "Actions"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => {
                  const status = getStatus(inquiry);
                  return (
                    <tr key={inquiry._id} className="hover:bg-gray-50 transition-colors">
                      {isAdminRole && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected(inquiry._id)}
                            onChange={() => handleSelectOne(inquiry._id)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(inquiry.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inquiry.name || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inquiry.email || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inquiry.mobile || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inquiry.packageTitle || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{inquiry.message || "N/A"}</td>
                      {isAdminRole && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inquiry.assignedTo ? inquiry.assignedTo.name : 'Unassigned'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        {/* View button */}
                        <button
                          onClick={() => handleViewInquiry(inquiry)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200 cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faEye} size="sm" />
                        </button>

                        {/* Status select dropdown - only for non-user roles */}
                        {isNonUserRole && (
                          <select
                            value={status}
                            onChange={(e) => handleUpdateStatus(inquiry._id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="booked">Booked</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(inquiry._id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-200 cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faTrash} size="sm" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for viewing inquiry details - without car/other */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Inquiry Details</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                </div>
                <div className="space-y-3">
                  <p><strong>Date:</strong> {new Date(selectedInquiry.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(getStatus(selectedInquiry))}`}>
                    {getStatus(selectedInquiry).charAt(0).toUpperCase() + getStatus(selectedInquiry).slice(1)}
                  </span></p>
                  {selectedInquiry.status === 'cancelled' && selectedInquiry.cancelReason && (
                    <div>
                      <p><strong>Cancel Reason:</strong></p>
                      <p className="whitespace-pre-wrap text-gray-700 mt-1 p-3 bg-gray-50 rounded">{selectedInquiry.cancelReason}</p>
                    </div>
                  )}
                  <p><strong>Name:</strong> {selectedInquiry.name || "N/A"}</p>
                  <p><strong>Email:</strong> {selectedInquiry.email || "N/A"}</p>
                  <p><strong>Mobile:</strong> {selectedInquiry.mobile || "N/A"}</p>
                  <p><strong>Package Title:</strong> {selectedInquiry.packageTitle || "N/A"}</p>
                  <div>
                    <p><strong>Message:</strong></p>
                    <p className="whitespace-pre-wrap text-gray-700 mt-1 p-3 bg-gray-50 rounded">{selectedInquiry.message || "No message"}</p>
                  </div>
                  {selectedInquiry.assignedTo && (
                    <p><strong>Assigned To:</strong> {selectedInquiry.assignedTo.name}</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Inquiry</h3>
                  <button
                    onClick={closeCancelModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Please provide a reason for cancellation:</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter cancel reason..."
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelInquiry}
                    disabled={!cancelReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Inquiry Modal - simplified without car and other */}
        {showAddModal && isNonUserRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Soft Mail</h3>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                </div>
                <form onSubmit={handleAddNewInquiry} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newInquiryData.name}
                      onChange={handleNewInquiryChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAdding}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newInquiryData.email}
                      onChange={handleNewInquiryChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAdding}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={newInquiryData.mobile}
                      onChange={handleNewInquiryChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAdding}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Title</label>
                    <input
                      type="text"
                      name="packageTitle"
                      value={newInquiryData.packageTitle}
                      onChange={handleNewInquiryChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAdding}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      value={newInquiryData.message}
                      onChange={handleNewInquiryChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAdding}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeAddModal}
                      disabled={isAdding}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isAdding ? "Adding..." : "Add Soft Mail"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Itinerarysoftmails