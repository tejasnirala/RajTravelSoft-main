import axios from 'axios';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const BOOKING_API_BASE_URL = 'https://apitour.rajasthantouring.in/api/bookings';
const PENDING_API_BASE_URL = 'https://apitour.rajasthantouring.in/api/pending';

// Function to fetch all payments from all bookings (dynamic base URL)
const fetchAllPayments = async (apiBase) => {
    try {
        const url = `${apiBase}/all-payments-admin`;
        console.log('Fetching payments from URL:', url);
        const response = await axios.get(url, {
            withCredentials: true
        });
        console.log('Response data length:', response.data.length || 0);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching all payments:', error);
        throw error.response?.data || { message: 'Failed to load payments' };
    }
};

// Function to update a payment's view status (dynamic base URL)
const updatePaymentView = async (apiBase, bookingId, paymentId, view) => {
    try {
        const url = `${apiBase}/${bookingId}/payments/${paymentId}/view`;
        console.log('Updating view at URL:', url, 'with view:', view);
        const response = await axios.put(url, { view });
        console.log('Update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating payment view:', error);
        throw error.response?.data || { message: 'Failed to update payment view' };
    }
};

const PaymentsManager = () => {
    const [bookingPayments, setBookingPayments] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [filterView, setFilterView] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeTab, setActiveTab] = useState('booking');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);
    const socketRef = useRef(null);

    // Fetch user data
    const fetchUser = async () => {
        try {
            console.log('Fetching user data...');
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
                credentials: "include",
            });
            const data = await response.json();
            console.log('User data response:', data);
            if (data.ok) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Check permission
    const hasViewPaymentsPermission = user && (user.role !== "user" || (user.permissions && user.permissions.includes("view_payments")));

    // Load booking payments
    const loadBookingPayments = useCallback(async () => {
        console.log('loadBookingPayments called');
        if (!hasViewPaymentsPermission) {
            return;
        }
        try {
            const payments = await fetchAllPayments(BOOKING_API_BASE_URL);
            console.log('Setting bookingPayments with', payments.length, 'items');
            setBookingPayments(payments);
        } catch (error) {
            console.error('loadBookingPayments error:', error);
            toast.error(error.message || 'Failed to load booking payments');
            setBookingPayments([]);
        }
    }, [hasViewPaymentsPermission]);

    // Load pending payments
    const loadPendingPayments = useCallback(async () => {
        console.log('loadPendingPayments called');
        if (!hasViewPaymentsPermission) {
            return;
        }
        try {
            const payments = await fetchAllPayments(PENDING_API_BASE_URL);
            console.log('Setting pendingPayments with', payments.length, 'items');
            setPendingPayments(payments);
        } catch (error) {
            console.error('loadPendingPayments error:', error);
            toast.error(error.message || 'Failed to load pending payments');
            setPendingPayments([]);
        }
    }, [hasViewPaymentsPermission]);

    // Fetch user on mount
    useEffect(() => {
        console.log('fetchUser useEffect running');
        fetchUser();
    }, []);

    // Socket connection (connect once)
    useEffect(() => {
        console.log('Socket connection useEffect running');
        socketRef.current = io('https://apitour.rajasthantouring.in');
        return () => {
            if (socketRef.current) {
                console.log('Disconnecting socket');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Load both tabs data when user is ready
    useEffect(() => {
        console.log('Initial data load useEffect, loading:', loading, 'hasPermission:', hasViewPaymentsPermission);
        if (loading || !hasViewPaymentsPermission) {
            return;
        }

        // Load both tabs data initially
        loadBookingPayments();
        loadPendingPayments();
    }, [loading, hasViewPaymentsPermission, loadBookingPayments, loadPendingPayments]);

    // Socket listener for new_payment
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || loading || !hasViewPaymentsPermission) {
            return;
        }

        const handleNewPayment = (data) => {
            console.log('New payment event received:', data);
            toast.info(`New payment added! Amount: ₹${data.payment?.amount || 'Unknown'} ${data.payment?.currency || ''} by ${data.user?.name || data.user?.email || 'a user'}`);

            // Refresh both tabs (since we don't know which tab the payment belongs to)
            loadBookingPayments();
            loadPendingPayments();
        };

        socket.on('new_payment', handleNewPayment);
        console.log('Attached new_payment listener');

        return () => {
            socket.off('new_payment', handleNewPayment);
            console.log('Detached new_payment listener');
        };
    }, [loading, hasViewPaymentsPermission, loadBookingPayments, loadPendingPayments]);

    const handleUpdateView = async (bookingId, paymentId, newView) => {
        console.log('handleUpdateView called:', { bookingId, paymentId, newView, activeTab });
        if (!hasViewPaymentsPermission) {
            toast.error('No permission to update payment view');
            return;
        }
        try {
            const apiBase = activeTab === 'booking' ? BOOKING_API_BASE_URL : PENDING_API_BASE_URL;
            await updatePaymentView(apiBase, bookingId, paymentId, newView);

            // Reload current tab's payments
            if (activeTab === 'booking') {
                await loadBookingPayments();
            } else {
                await loadPendingPayments();
            }

            toast.success('Payment view updated successfully!');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to update payment view');
        }
    };

    const handleTabChange = (tab) => {
        console.log('Tab changing to:', tab);
        setActiveTab(tab);
    };

    // Get current payments based on active tab
    const allPayments = activeTab === 'booking' ? bookingPayments : pendingPayments;

    console.log('Current allPayments length:', allPayments.length, 'for tab:', activeTab);

    // Filter payments based on view status and date range
    const filteredPayments = allPayments.filter(payment => {
        if (!payment || !payment.paymentDate) return false;

        const paymentDate = new Date(payment.paymentDate);
        let dateMatch = true;

        if (fromDate) {
            const fromDateObj = new Date(fromDate);
            dateMatch = dateMatch && paymentDate >= fromDateObj;
        }

        if (toDate) {
            const toDateObj = new Date(toDate);
            toDateObj.setHours(23, 59, 59, 999);
            dateMatch = dateMatch && paymentDate <= toDateObj;
        }

        const viewMatch = filterView === 'all' || payment.view === filterView;

        return dateMatch && viewMatch;
    });

    console.log('Filtered payments length:', filteredPayments.length);

    const getViewDisplay = (view) => {
        switch (view) {
            case 'true': return 'Received';
            case 'view': return 'Pending';
            case 'false': return 'Not Received';
            default: return 'Unknown';
        }
    };

    if (loading) {
        return <div className="p-5">Loading...</div>;
    }

    if (!hasViewPaymentsPermission) {
        return (
            <div className="p-5 max-w-full mx-auto bg-white min-h-screen flex items-center justify-center">
                <div className="text-center text-red-500">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p>You do not have permission to view payments. Contact admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 max-w-full mx-auto bg-white min-h-screen">
            <h2 className="text-blue-500 text-3xl text-center underline font-bold mb-4">
                All {activeTab === 'booking' ? 'Booked' : 'Regular'} Payments
            </h2>

            {/* Tabs */}
            <div className="mb-4 flex justify-center gap-4">
                <button
                    onClick={() => handleTabChange('booking')}
                    className={`px-4 py-2 rounded border ${activeTab === 'booking' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Booking Payments ({bookingPayments.length})
                </button>
                <button
                    onClick={() => handleTabChange('pending')}
                    className={`px-4 py-2 rounded border ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Regular Payments ({pendingPayments.length})
                </button>
            </div>

            {/* Filter Section */}
            <div className="mb-8 text-center">
                <div className="mb-4">
                    <label htmlFor="filterView" className="font-bold mr-2 text-gray-800">Filter by View Status: </label>
                    <select
                        id="filterView"
                        value={filterView}
                        onChange={(e) => setFilterView(e.target.value)}
                        className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-800"
                    >
                        <option value="all">All</option>
                        <option value="true">Received</option>
                        <option value="view">Pending</option>
                        <option value="false">Not Received</option>
                    </select>
                </div>

                <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center">
                        <label htmlFor="fromDate" className="font-bold text-gray-800 mb-1">From Date:</label>
                        <input
                            type="date"
                            id="fromDate"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-800"
                        />
                    </div>

                    <div className="flex flex-col items-center">
                        <label htmlFor="toDate" className="font-bold text-gray-800 mb-1">To Date:</label>
                        <input
                            type="date"
                            id="toDate"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-800"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="flex flex-wrap gap-4  ">
                {filteredPayments.map((payment, index) => {
                    // Generate unique key using multiple fields
                    const uniqueKey = `${activeTab}-${payment._id}-${payment.bookingId}-${index}`;

                    return (
                        <div
                            key={uniqueKey}
                            className="border min-w-[320px] sm:min-w-[370px] border-gray-300 rounded-lg p-5 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full"
                        >
                            <div>
                                <h3 className="mb-4 text-blue-500 text-lg font-bold break-all">
                                    {payment.clientName || 'N/A'}
                                </h3>

                                <div className="mb-2.5">
                                    <strong className="text-gray-700">Amount:</strong> ₹{payment.amount} {payment.currency}
                                </div>

                                <div className="mb-2.5">
                                    <strong className="text-gray-700">Method:</strong> {payment.method || 'N/A'}
                                </div>

                                <div className="mb-2.5">
                                    <strong className="text-gray-700">Transaction ID:</strong> {payment.transactionId || 'N/A'}
                                </div>

                                <div className="mb-2.5">
                                    <strong className="text-gray-700">Gateway:</strong> {payment.gateway || 'N/A'}
                                </div>

                                <div className="mb-2.5">
                                    <strong className="text-gray-700">Payment Date:</strong> {new Date(payment.paymentDate).toLocaleString()}
                                </div>

                                {payment.receiptUrl && (
                                    <div className="mb-2.5">
                                        <strong className="text-gray-700">Receipt:</strong>
                                        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 ml-1 no-underline">View</a>
                                    </div>
                                )}

                                {payment.screenshot && (
                                    <div className="mb-2.5">
                                        <strong className="text-gray-700">Screenshot:</strong>
                                        <a href={payment.screenshot} target="_blank" rel="noopener noreferrer" className="text-green-500 ml-1 no-underline">View</a>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <strong className="text-gray-700">Received Status:</strong>
                                    <span className={`${payment.view === 'true' ? 'text-green-500' : payment.view === 'view' ? 'text-amber-500' : payment.view === 'false' ? 'text-red-500' : 'text-gray-500'} font-bold ml-1`}>
                                        {getViewDisplay(payment.view)}
                                    </span>
                                </div>
                            </div>

                            {/* Toggle Buttons */}
                            <div className="flex justify-center gap-2 mt-auto">
                                <button
                                    onClick={() => handleUpdateView(payment.bookingId || payment._id, payment._id, 'true')}
                                    className={`px-3 py-1 rounded transition-colors flex items-center justify-center border-none cursor-pointer ${payment.view === 'true'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    <CheckCircleIcon className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={() => handleUpdateView(payment.bookingId || payment._id, payment._id, 'false')}
                                    className={`px-3 py-1 rounded transition-colors flex items-center justify-center border-none cursor-pointer ${payment.view === 'false'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredPayments.length === 0 && (
                <div className="text-center mt-10 text-gray-500">
                    No payments match the selected filter.
                </div>
            )}
        </div>
    );
};

export default PaymentsManager;