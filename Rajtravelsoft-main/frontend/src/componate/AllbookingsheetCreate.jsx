import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Calendar, User, Edit3, Search } from 'lucide-react';
import BookingSheetViewer from '../componate/BookingItinerarySheet';

const AllBookingSheetCreate = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [showSheetViewer, setShowSheetViewer] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const fetchAllBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://apitour.rajasthantouring.in/api/bookings?includeSheetStatus=true', {
                credentials: 'include',
            });
            const data = await res.json();
            setBookings(data);
        } catch (err) {
            alert('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const openSheet = (id) => {
        setSelectedBookingId(id);
        setShowSheetViewer(true);
    };

    const closeSheet = () => {
        setShowSheetViewer(false);
        setSelectedBookingId(null);
        fetchAllBookings();
    };

    const parseDMY = (d) => {
        if (!d || d === 'N/A') return null;
        const [day, month, year] = d.split('-');
        return new Date(`${year}-${month}-${day}`);
    };

    const createdByOptions = useMemo(() => {
        return [...new Set(bookings.map(b => b.createby?.name).filter(Boolean))].sort();
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        return bookings
            .filter(b => b.status === 'Booked')
            .filter(b => {
                const s = searchTerm.toLowerCase();
                const matchSearch =
                    b.bookingId?.toLowerCase().includes(s) ||
                    b.clientDetails?.name?.toLowerCase().includes(s) ||
                    b.clientDetails?.phone?.includes(s);

                const matchAgent = createdByFilter === 'all' || b.createby?.name === createdByFilter;

                const travelDate = parseDMY(b.tripDates?.pickupDate || b.clientDetails?.travelDate || '');
                const from = dateFrom ? new Date(dateFrom) : null;
                const to = dateTo ? new Date(dateTo) : null;
                const matchDate = (!from || (travelDate && travelDate >= from)) && (!to || (travelDate && travelDate <= to));

                return matchSearch && matchAgent && matchDate;
            });
    }, [bookings, searchTerm, createdByFilter, dateFrom, dateTo]);

    const formatDate = (d) => d && d !== 'N/A' ? d : 'N/A';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-3 text-gray-600 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-4">
            <div className="max-w-full mx-auto space-y-4">

                {/* Compact Header */}
                <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Booked Trips - Cost Sheets</h1>
                            <p className="text-xs text-gray-500">Manage confirmed bookings</p>
                        </div>
                    </div>
                    <div className="text-sm">
                        Total: <span className="font-bold text-lg text-green-600">{filteredBookings.length}</span>
                    </div>
                </div>

                {/* Super Compact Filters */}
                <div className="bg-white rounded-lg shadow p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={createdByFilter}
                            onChange={(e) => setCreatedByFilter(e.target.value)}
                            className="px-3 py-2 text-sm border rounded-md"
                        >
                            <option value="all">All Agents</option>
                            {createdByOptions.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>

                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm border rounded-md" />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm border rounded-md" />

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setCreatedByFilter('all');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Compact Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-blue-600 text-white text-left text-xs font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-2.5">ID</th>
                                    <th className="px-4 py-2.5">Customer</th>
                                    <th className="px-4 py-2.5">Travel Date</th>
                                    <th className="px-4 py-2.5">Agent</th>
                                    <th className="px-4 py-2.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm">
                                {filteredBookings.map((b) => {
                                    const date = b.tripDates?.pickupDate || b.clientDetails?.travelDate || 'N/A';
                                    return (
                                        <tr key={b._id} className="hover:bg-gray-50 text-sm">
                                            <td className="px-4 py-3 font-bold text-blue-600">#{b.bookingId}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{b.clientDetails?.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{b.clientDetails?.phone}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{formatDate(date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="truncate max-w-32">{b.createby?.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => openSheet(b._id)}
                                                    className={`px-4 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 mx-auto transition ${b.sheetExists
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                        }`}
                                                >
                                                    {b.sheetExists ? (
                                                        <>Edit <Edit3 className="w-3.5 h-3.5" /></>
                                                    ) : (
                                                        <>Create <FileSpreadsheet className="w-3.5 h-3.5" /></>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredBookings.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <FileSpreadsheet className="w-16 h-16 mx-auto mb-3 opacity-30" />
                                <p>No booked trips found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSheetViewer && selectedBookingId && (
                <BookingSheetViewer
                    bookingId={selectedBookingId}
                    onClose={closeSheet}
                    isEditable={true}
                />
            )}
        </div>
    );
};

export default AllBookingSheetCreate;