// Dashboardbills.jsx (Updated: Added 'car-rental' tab; Dynamic titles and filters for invoice-like tabs; Edit navigation to respective forms)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboardbills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices');  // 'invoices', 'quotations', 'car-rental'
    const [statusFilter, setStatusFilter] = useState('all');  // 'all', 'paid', 'unpaid'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [showFilters, setShowFilters] = useState(false);  // New state to toggle filters visibility
    const navigate = useNavigate()
    useEffect(() => {
        fetchBills();
    }, [activeTab, statusFilter, dateFrom, dateTo, clientName, clientAddress]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            let params = new URLSearchParams();
            params.append('type', activeTab);
            if ((activeTab === 'invoices' || activeTab === 'car-rental') && statusFilter !== 'all') params.append('status', statusFilter);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (clientName) params.append('clientName', clientName);
            if (clientAddress) params.append('clientAddress', clientAddress);
            params.append('limit', '50');  // Increased limit for better UX, adjust as needed
            const url = `https://apitour.rajasthantouring.in/api/bills?${params.toString()}`;
            const res = await axios.get(url);
            setBills(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadBill = async (id, billType, number) => {
        try {
            const response = await axios.get(`https://apitour.rajasthantouring.in/api/bills/${id}/download`, {
                responseType: 'blob'  // Important for binary data
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${billType}_${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);  // Clean up
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(`https://apitour.rajasthantouring.in/api/bills/${id}/download`, '_blank');
        }
    };

    // Updated: Edit bill (for invoices and car-rentals) - Navigate to respective form
    const editBill = (id) => {
        if (activeTab !== 'invoices' && activeTab !== 'car-rental') {
            alert('Only invoices and car-rentals can be edited');
            return;
        }

        // decide tab based on activeTab
        const tabParam = activeTab === 'car-rental' ? 'car-rental' : 'sales';

        // navigate with proper tab and edit id
        navigate(`?tab=${tabParam}&edit=${id}`, { replace: true });
    };

    const getStatus = (bill) => {
        if (activeTab === 'quotations') return 'N/A';
        if (bill.pendingAmount > 0) return 'Unpaid';
        return 'Paid';
    };

    // Calculate totals based on active tab
    let summaryCards = [];
    const isInvoiceLikeTab = activeTab === 'invoices' || activeTab === 'car-rental';
    const tabTitle = activeTab === 'invoices' ? 'Invoices' : activeTab === 'car-rental' ? 'Car Rentals' : 'Quotations';
    const valueTitle = activeTab === 'invoices' ? 'Invoices' : activeTab === 'car-rental' ? 'Car Rentals' : 'Quotations';

    if (isInvoiceLikeTab) {
        const totalBills = bills.length;
        const totalPaidAmount = bills.reduce((sum, bill) => sum + (bill.totalPaid || 0), 0);
        const totalPendingAmount = bills.reduce((sum, bill) => sum + (bill.pendingAmount || 0), 0);
        const paidBills = bills.filter(bill => bill.pendingAmount <= 0).length;
        const pendingBills = bills.filter(bill => bill.pendingAmount > 0).length;

        summaryCards = [
            { title: `Total ${tabTitle}`, value: totalBills, color: 'blue-600' },
            { title: `Paid ${valueTitle}`, value: paidBills, color: 'green-600' },
            { title: `Pending ${valueTitle}`, value: pendingBills, color: 'red-600' },
            { title: 'Total Paid Amount', value: `₹${totalPaidAmount.toFixed(2)}`, color: 'green-600' },
            { title: 'Total Pending Amount', value: `₹${totalPendingAmount.toFixed(2)}`, color: 'red-600' }
        ];
    } else {
        const totalBills = bills.length;
        const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);

        summaryCards = [
            { title: `Total ${tabTitle}`, value: totalBills, color: 'blue-600' },
            { title: 'Total Value', value: `₹${totalAmount.toFixed(2)}`, color: 'green-600' },
            { title: '', value: '', color: '' },
            { title: '', value: '', color: '' },
            { title: '', value: '', color: '' }
        ];
    }

    if (loading) return <div className="p-4 sm:p-6 text-center">Loading...</div>;

    return (
        <div className="p-4 sm:p-6  mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">All Bills Dashboard</h1>

            {/* Tabs - Mobile friendly with flex; Added car-rental tab */}
            <div className="flex flex-col sm:flex-row mb-4 sm:mb-6 border-b border-gray-200">
                <button
                    onClick={() => {
                        setActiveTab('invoices');
                        setStatusFilter('all');
                    }}
                    className={`py-2 px-4 font-semibold border-b-2 w-full sm:w-auto ${activeTab === 'invoices' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Invoices
                </button>
                <button
                    onClick={() => {
                        setActiveTab('quotations');
                        setStatusFilter('all');
                    }}
                    className={`py-2 px-4 font-semibold border-b-2 w-full sm:w-auto ${activeTab === 'quotations' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Quotations
                </button>
                <button
                    onClick={() => {
                        setActiveTab('car-rental');
                        setStatusFilter('all');
                    }}
                    className={`py-2 px-4 font-semibold border-b-2 w-full sm:w-auto ${activeTab === 'car-rental' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Car Rentals
                </button>
            </div>

            {/* Summary Cards - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {summaryCards.map((card, index) => (
                    card.title ? (
                        <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-700">{card.title}</h3>
                            <p className={`text-xl sm:text-2xl font-bold text-${card.color}`}>{card.value}</p>
                        </div>
                    ) : (
                        <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow border hidden lg:block"></div>
                    )
                ))}
            </div>

            {/* Filter Toggle Button */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4 sm:mb-6 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filters - Conditionally rendered */}
            {showFilters && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 items-start sm:items-end">
                    {isInvoiceLikeTab && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
                            />
                        </div>
                    </div>

                    <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Client Name"
                        className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
                    />

                    <input
                        type="text"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Client Address"
                        className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
                    />
                </div>
            )}

            {/* Responsive Table Container - Enhanced for mobile with scroll and better padding */}
            <div className="overflow-x-auto rounded-lg border border-gray-300">
                <table className="w-full border-collapse min-w-full">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Number</th>
                            <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Client</th>
                            <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Address</th>
                            <th className="border p-2 sm:p-3 text-right text-sm sm:text-base">Total</th>
                            {isInvoiceLikeTab && (
                                <>
                                    <th className="border p-2 sm:p-3 text-right text-sm sm:text-base">Paid</th>
                                    <th className="border p-2 sm:p-3 text-right text-sm sm:text-base">Pending</th>
                                    <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Status</th>
                                </>
                            )}
                            <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Date</th>
                            <th className="border p-2 sm:p-3 text-left text-sm sm:text-base">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map((bill) => (
                            <tr key={bill._id} className="hover:bg-gray-50">
                                <td className="border p-2 sm:p-3 text-sm">{bill.number}</td>
                                <td className="border p-2 sm:p-3 text-sm">{bill.client.name}</td>
                                <td className="border p-2 sm:p-3 text-sm">{bill.client.address}</td>
                                <td className="border p-2 sm:p-3 text-right text-sm">₹{bill.total.toFixed(2)}</td>
                                {isInvoiceLikeTab && (
                                    <>
                                        <td className="border p-2 sm:p-3 text-right text-green-600 text-sm">₹{bill.totalPaid.toFixed(2)}</td>
                                        <td className="border p-2 sm:p-3 text-right text-red-600 text-sm">₹{bill.pendingAmount.toFixed(2)}</td>
                                        <td className="border p-2 sm:p-3">
                                            <span className={`px-2 py-1 rounded text-xs sm:text-sm ${getStatus(bill) === 'Paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                {getStatus(bill)}
                                            </span>
                                        </td>
                                    </>
                                )}
                                <td className="border p-2 sm:p-3 text-sm">
                                    {new Date(bill.date).toLocaleDateString()} {bill.type === 'quotation' &&
                                        ` (Valid: ${new Date(bill.validUntil).toLocaleDateString()})`}
                                </td>
                                <td className="border p-2 sm:p-3">
                                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                        {isInvoiceLikeTab && (
                                            <button
                                                onClick={() => editBill(bill._id)}
                                                className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-yellow-600 w-full sm:w-auto"
                                            >
                                                Edit Payment/Date
                                            </button>
                                        )}
                                        <button
                                            onClick={() => downloadBill(bill._id, bill.type, bill.number)}
                                            className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-600 w-full sm:w-auto"
                                        >
                                            Download PDF
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {bills.length === 0 && <p className="text-center mt-4 text-sm sm:text-base">No bills found.</p>}
        </div>
    );
};

export default Dashboardbills;