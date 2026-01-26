import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Check, Clock, AlertCircle, XCircle, CheckCircle, FileText, Edit as EditIcon, CreditCard, User, Calendar, X } from 'lucide-react';
import { FaRupeeSign } from 'react-icons/fa';
import { Table } from 'antd';

const ViewPending = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPending, setSelectedPending] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "INR",
    mobileNumber: "",
    method: "",
    transactionId: "",
    gateway: "",
    status: "pending",
    receiptUrl: "",
    screenshot: "",
    index: null,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState('pending');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchAllBookings();
  }, [user]);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const query = user
        ? user.role !== 'admin'
          ? `mode=${viewMode}&&role=admin`
          : `mode=${viewMode}&role=admin`
        : `mode=${viewMode}`;
      const response = await fetch(`https://apitour.rajasthantouring.in/api/pending?mode=pending?${query}`, {
        credentials: "include"
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');
      let data = await response.json();
      console.log(data, "sdatata");

      data = data.filter((booking) => booking.isDeleted !== true);
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


      setAllBookings(data);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings: only those with at least one payment and status not confirmed
  const getFilteredBookings = () => {
    return allBookings.filter((booking) =>
      booking.payments && booking.payments.length > 0 && booking.status !== 'confirmed'
    );
  };

  console.log(allBookings);


  const filteredBookings = getFilteredBookings();

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredBookings.length]);

  const tablePagination = {
    current: currentPage,
    total: filteredBookings.length,
    pageSize: itemsPerPage,
    onChange: (page) => setCurrentPage(page),
    showSizeChanger: false,
    showQuickJumper: false,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  };

  const [loadings, setLoadings] = useState(true);
  const fetchUser = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoadings(false);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  const calculateBalanceAmount = (pendingItem) => {
    const totalAmount =
      typeof pendingItem.totalAmount === "number"
        ? pendingItem.totalAmount
        : Object.values(pendingItem.totalAmount || {}).reduce(
          (sum, val) => sum + Number(val),
          0
        );
    const paidAmount =
      pendingItem.payments
        ?.filter((p) => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return { totalAmount, paidAmount, balance: totalAmount - paidAmount };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const formData = new FormData();
    formData.append("screenshot", file);
    try {
      const response = await axios.post("https://apitour.rajasthantouring.in/api/pending/upload-screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setPaymentData({ ...paymentData, screenshot: response.data.screenshotUrl });
    } catch (err) {
      console.error("Error uploading screenshot:", err);
      toast.error("Failed to upload screenshot. Please try again.");
    }
  };

  const handleAddPayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!paymentData.method || paymentData.method.trim() === "") {
      toast.error("Please enter a payment method");
      return;
    }
    try {
      setPaymentLoading(true);
      const response = await axios.post(
        `https://apitour.rajasthantouring.in/api/pendingPayments/${selectedPending._id}`,
        paymentData,
        { withCredentials: true }
      );
      setSelectedPending(response.data);
      setAllBookings(allBookings.map((b) => (b._id === response.data._id ? response.data : b)));
      setPaymentData({
        amount: "",
        currency: "INR",
        method: "",
        transactionId: "",
        mobileNumber: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
      });
      toast.success("Payment added successfully");
      fetchAllBookings(); // Refresh to show if first payment
    } catch (err) {
      console.error("Error adding payment:", err);
      toast.error("Failed to add payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!paymentData.method || paymentData.method.trim() === "") {
      toast.error("Please enter a payment method");
      return;
    }
    try {
      setPaymentLoading(true);
      const paymentId = selectedPending.payments[paymentData.index]._id;
      const response = await axios.put(
        `https://apitour.rajasthantouring.in/api/pendingPayments/${selectedPending._id}/${paymentId}`,
        paymentData,
        { withCredentials: true }
      );
      setSelectedPending(response.data);
      setAllBookings(allBookings.map((b) => (b._id === response.data._id ? response.data : b)));
      setPaymentData({
        amount: "",
        currency: "INR",
        method: "",
        mobileNumber: "",
        transactionId: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
      });
      toast.success("Payment updated successfully");
    } catch (err) {
      console.error("Error updating payment:", err);
      toast.error("Failed to update payment. Please check your connection and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleEditPayment = (payment, index) => {
    setPaymentData({ ...payment, index });
  };

  const handleOpenPaymentModal = (pendingItem) => {
    setSelectedPending(pendingItem);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPending(null);
    setPaymentData({
      amount: "",
      currency: "INR",
      method: "",
      transactionId: "",
      mobileNumber: "",
      gateway: "",
      status: "pending",
      receiptUrl: "",
      screenshot: "",
      index: null,
    });
  };

  // StatusBadge Component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: Clock, dot: "bg-blue-400" },
      created: { color: "bg-green-50 text-green-700 border border-green-200", icon: Check, dot: "bg-green-400" },
      cancelled: { color: "bg-red-50 text-red-700 border border-red-200", icon: XCircle, dot: "bg-red-400" },
      completed: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: CheckCircle, dot: "bg-blue-400" },
      confirmed: { color: "bg-purple-50 text-purple-700 border border-purple-200", icon: Check, dot: "bg-purple-400" },
      success: { color: "bg-green-50 text-green-700 border border-green-200", icon: FaRupeeSign, dot: "bg-green-500" },
      failed: { color: "bg-red-50 text-red-700 border border-red-200", icon: XCircle, dot: "bg-red-500" },
    };
    const normalizedStatus = status?.toLowerCase?.() || "pending";
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        <Icon size={12} />
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  // PaymentStatusBadge Component
  const PaymentStatusBadge = ({ pendingItem }) => {
    const { totalAmount, paidAmount, balance } = calculateBalanceAmount(pendingItem);
    let status, color, icon, dot;
    if (paidAmount === 0) {
      status = "Unpaid";
      color = "bg-red-50 text-red-700 border border-red-200";
      icon = XCircle;
      dot = "bg-red-400";
    } else if (balance === 0) {
      status = "Fully Paid";
      color = "bg-blue-50 text-blue-700 border border-blue-200";
      icon = Check;
      dot = "bg-blue-400";
    } else {
      status = "Partial";
      color = "bg-orange-50 text-orange-700 border border-orange-200";
      icon = AlertCircle;
      dot = "bg-orange-400";
    }
    const Icon = icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
        <div className={`w-2 h-2 rounded-full ${dot}`}></div>
        <Icon size={12} />
        <span>{status}</span>
      </div>
    );
  };

  // Table Columns: Only payment-related
  const tableColumns = [
    {
      title: 'ID',
      dataIndex: 'bookingId',
      key: 'id',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          {record.bookingId || record._id?.slice(-5) || 'N/A'}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Client Name',
      dataIndex: ['clientDetails', 'name'],
      key: 'clientName',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          {record.clientDetails?.name || 'N/A'}
        </div>
      ),
      width: 150,
    },
    {
      title: 'Travel Date',
      dataIndex: ['clientDetails', 'travelDate'],
      key: 'travelDate',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {record.clientDetails?.travelDate || 'N/A'}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => <StatusBadge status={record.status} />,
      width: 120,
    },
    {
      title: 'Grand Total',
      key: 'total',
      render: (text, record) => {
        const { totalAmount, balance } = calculateBalanceAmount(record);
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">₹{totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Balance: ₹{balance.toLocaleString()}</div>
            <div className="mt-1">
              <PaymentStatusBadge pendingItem={record} />
            </div>
          </div>
        );
      },
      width: 150,
    },
    {
      title: 'Payments',
      key: 'payments',
      render: (text, record) => (
        <div className="space-y-1">
          {record.payments?.slice(0, 2).map((payment, index) => (
            <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
              ₹{payment.amount} ({payment.status})
            </div>
          ))}
          {record.payments?.length > 2 && (
            <div className="text-xs text-gray-500">+{record.payments.length - 2} more</div>
          )}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenPaymentModal(record)}
            className="bg-indigo-600 !hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
            title="Manage Payments"
            style={{ display: "flex ", justifyContent: "center", background: "blue", padding: "2px 5px", color: "white", borderRadius: "20px", alignItems: "center" }}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </button>
        </div>
      ),
      width: 150,
    },
  ];

  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className=''>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl text-blue-600 underline font-bold mb-6">Regular Payments Management</h2>
        <Table
          dataSource={currentBookings.map((booking, index) => ({ ...booking, key: booking._id || index }))}
          columns={tableColumns}
          pagination={tablePagination}
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'No pending payments found.' }}
          className="custom-antd-table"
        />
      </div>
      {/* Payment Management Modal */}
      {showPaymentModal && selectedPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Payments for Pending</h2>
                <p className="text-sm text-gray-500">
                  Pending ID #{selectedPending.bookingId || selectedPending._id.slice(-5)} - {selectedPending.clientDetails.name}
                </p>
              </div>
              <button onClick={closePaymentModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter amount"
                      required
                      readOnly={paymentData.index !== null}
                    />
                    {paymentData.index !== null && (
                      <p className="text-xs text-gray-500 mt-1">Amount cannot be edited for existing payments</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <input
                      type="text"
                      name="method"
                      value={paymentData.method}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Credit Card, UPI, Bank Transfer"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number (UPI)</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={paymentData.mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setPaymentData({ ...paymentData, mobileNumber: value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      name="transactionId"
                      value={paymentData.transactionId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Transaction reference number"
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                    <input
                      type="text"
                      name="gateway"
                      value={paymentData.gateway}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Razorpay, Stripe, PayPal"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={paymentData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                    <input
                      type="url"
                      name="receiptUrl"
                      value={paymentData.receiptUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/receipt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Choose file</span>
                        </div>
                        <input
                          type="file"
                          name="screenshot"
                          accept="image/jpeg,image/png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {paymentData.screenshot && (
                        <img
                          src={paymentData.screenshot || "/placeholder.svg"}
                          alt="Screenshot Preview"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={paymentData.index !== null ? handleUpdatePayment : handleAddPayment}
                      disabled={paymentLoading}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                    >
                      {paymentLoading
                        ? paymentData.index !== null
                          ? "Updating..."
                          : "Processing..."
                        : paymentData.index !== null
                          ? "Update Payment"
                          : "Add Payment"}
                    </button>
                  </div>
                </div>
              </div>
              {/* Payment History Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screenshot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[...selectedPending.payments]
                        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                        .map((payment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.method || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={payment.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment.receiptUrl ? (
                                <a
                                  href={payment.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  <FileText size={14} className="inline mr-1" />
                                  View Receipt
                                </a>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment.screenshot ? (
                                <img
                                  src={payment.screenshot || "/placeholder.svg"}
                                  alt="Payment screenshot"
                                  className="w-12 h-12 object-cover rounded cursor-pointer"
                                  onClick={() => setPreviewImage(payment.screenshot)}
                                />
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditPayment(payment, index)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  <EditIcon size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) || <tr><td colSpan="9" className="px-6 py-4 text-center text-gray-500">No payments yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <img
              src={previewImage}
              alt="Payment screenshot preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPending;