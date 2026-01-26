// Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Users, Car, Hotel, Map, Calendar, DollarSign,
    TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle,
    Filter, Download
} from 'lucide-react';
import { AuthContext } from "../context/AuthContext.jsx";

const API_BASE = 'https://apitour.rajasthantouring.in';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [allBookings, setAllBookings] = useState([]);
    const [allInquiries, setAllInquiries] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [allVehicles, setAllVehicles] = useState([]);
    const [allItineraries, setAllItineraries] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [dashboardData, setDashboardData] = useState({
        summary: {
            totalBookings: 0,
            totalBookingValue: 0,
            totalRevenue: 0,
            pendingBookings: 0,
            cancel: 0,
            completedBookings: 0,
            totalInquiries: 0,
            totalItineraries: 0,
            totalHotels: 0,
            totalVehicles: 0,
            totalTravelers: 0,
            totalStaff: 0,
            changes: {
                totalBookings: 0,
                totalBookingValue: 0,
                totalRevenue: 0,
                totalInquiries: 0,
                totalItineraries: 0,
                totalTravelers: 0,
                cancel: 0,
                totalStaff: 0
            }
        },
        bookings: {
            byStatus: [],
            byMonth: [],
            amountByStatus: {
                success: 0,
                pending: 0,
                failed: 0,
                refunded: 0
            }
        },
        inquiries: {
            byDate: [],
            recent: []
        },
        financials: {
            revenueByMonth: [],
            paymentMethods: []
        }
    });

    const [filters, setFilters] = useState({
        dateRange: {
            start: '',
            end: ''
        },
        status: 'all',
        month: 'all'
    });

    const [loading, setLoading] = useState(true);

    const calculateDashboardData = (bookings, inquiries, hotels, vehicles, itineraries, currentFilters, allUsers) => {
        // Filter bookings
        let filteredBookings = bookings.filter(b => {
            const created = new Date(b.createdAt?.$date || b.createdAt);
            if (currentFilters.dateRange.start && created < new Date(currentFilters.dateRange.start)) return false;
            if (currentFilters.dateRange.end) {
                const end = new Date(currentFilters.dateRange.end);
                end.setHours(23, 59, 59, 999);
                if (created > end) return false;
            }
            if (currentFilters.status !== 'all' && b.status?.toLowerCase() !== currentFilters.status.toLowerCase()) return false;
            if (currentFilters.month === 'current') {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (created < monthStart) return false;
            }
            return true;
        });

        // Filter inquiries
        let filteredInquiries = inquiries.filter(i => {
            const created = new Date(i.createdAt);
            if (currentFilters.dateRange.start && created < new Date(currentFilters.dateRange.start)) return false;
            if (currentFilters.dateRange.end) {
                const end = new Date(currentFilters.dateRange.end);
                end.setHours(23, 59, 59, 999);
                if (created > end) return false;
            }
            if (currentFilters.month === 'current') {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (created < monthStart) return false;
            }
            return true;
        });

        // Summary
        const totalBookings = filteredBookings.length;
        const totalBookingValue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalRevenue = filteredBookings.reduce((sum, b) => {
            const successPayments = (b.payments || []).filter(p => (p.status || '').toLowerCase() === 'success').reduce((s, p) => s + (p.amount || 0), 0);
            return sum + successPayments;
        }, 0);

        console.log(totalRevenue);


        const pendingBookings = filteredBookings.filter(b => b.status?.toLowerCase() === 'booked').length;
        const cancel = filteredBookings.filter(b => b.status?.toLowerCase() === 'cancel').length;
        const completedBookings = filteredBookings.filter(b => b.status?.toLowerCase() === 'complete' || b.status?.toLowerCase() === 'completed').length;
        const totalInquiries = filteredInquiries.length;
        const totalItineraries = itineraries.length;
        const totalHotels = hotels.length;
        const totalVehicles = vehicles.length;
        const totalTravelers = filteredBookings.reduce((sum, b) => {
            return sum + (b.clientDetails?.travelers || (parseInt(b.clientDetails?.adults || 0) + parseInt(b.clientDetails?.kids5to12 || 0) + parseInt(b.clientDetails?.kidsBelow5 || 0)));
        }, 0);
        const totalStaff = allUsers?.users?.otherRoles?.length || 0;


        // Bookings by status
        const statusCounts = {};
        filteredBookings.forEach(b => {
            const s = b.status || 'unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const byStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // Bookings by month with sortable keys
        const monthGroups = {};
        filteredBookings.forEach(b => {
            const created = new Date(b.createdAt?.$date || b.createdAt);
            const year = created.getFullYear();
            const monthNum = String(created.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${monthNum}`;
            const displayKey = created.toLocaleString('en-us', { month: 'short', year: 'numeric' });
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = {
                    month: displayKey,
                    monthKey,
                    bookings: 0,
                    revenue: 0,
                    totalValue: 0,
                    travelers: 0,
                    booked: 0
                };
            }
            monthGroups[monthKey].bookings += 1;
            monthGroups[monthKey].totalValue += (b.totalAmount || 0);
            const successPayments = (b.payments || []).filter(p => (p.status || '').toLowerCase() === 'success').reduce((s, p) => s + (p.amount || 0), 0);
            monthGroups[monthKey].revenue += successPayments;
            const travelers = b.clientDetails?.travelers || (parseInt(b.clientDetails?.adults || 0) + parseInt(b.clientDetails?.kids5to12 || 0) + parseInt(b.clientDetails?.kidsBelow5 || 0));
            monthGroups[monthKey].travelers += travelers;
            if (b.status?.toLowerCase() === 'booked') {
                monthGroups[monthKey].booked += 1;
            }
        });
        const byMonth = Object.values(monthGroups).sort((a, b) => {
            const dateA = new Date(a.monthKey + '-01');
            const dateB = new Date(b.monthKey + '-01');
            return dateA - dateB;
        });

        // Inquiries by month
        const inquiryMonthGroups = {};
        filteredInquiries.forEach(i => {
            const created = new Date(i.createdAt);
            const year = created.getFullYear();
            const monthNum = String(created.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${monthNum}`;
            const displayKey = created.toLocaleString('en-us', { month: 'short', year: 'numeric' });
            if (!inquiryMonthGroups[monthKey]) {
                inquiryMonthGroups[monthKey] = {
                    display: displayKey,
                    monthKey,
                    count: 0
                };
            }
            inquiryMonthGroups[monthKey].count += 1;
        });
        const inquiriesByMonth = Object.values(inquiryMonthGroups).sort((a, b) => {
            const dateA = new Date(a.monthKey + '-01');
            const dateB = new Date(b.monthKey + '-01');
            return dateA - dateB;
        });

        // Calculate percentage changes from last month
        const changes = {
            totalBookings: 0,
            totalBookingValue: 0,
            totalRevenue: 0,
            totalInquiries: 0,
            totalItineraries: 0,
            totalTravelers: 0,
            cancel: 0,
            totalStaff: 0
        };
        if (byMonth.length >= 2) {
            const currentIdx = byMonth.length - 1;
            const curr = byMonth[currentIdx];
            const prev = byMonth[currentIdx - 1];

            changes.totalBookings = prev.bookings > 0 ? Math.round(((curr.bookings - prev.bookings) / prev.bookings) * 100) : (curr.bookings > 0 ? 100 : 0);
            changes.totalBookingValue = prev.totalValue > 0 ? Math.round(((curr.totalValue - prev.totalValue) / prev.totalValue) * 100) : (curr.totalValue > 0 ? 100 : 0);
            changes.totalRevenue = prev.revenue > 0 ? Math.round(((curr.revenue - prev.revenue) / prev.revenue) * 100) : (curr.revenue > 0 ? 100 : 0);
            changes.totalTravelers = prev.travelers > 0 ? Math.round(((curr.travelers - prev.travelers) / prev.travelers) * 100) : (curr.travelers > 0 ? 100 : 0);
            changes.cancel = prev.cancel > 0 ? Math.round(((curr.cancel - prev.cancel) / prev.cancel) * 100) : (curr.cancel > 0 ? 100 : 0);
        }
        if (inquiriesByMonth.length >= 2) {
            const currentIdx = inquiriesByMonth.length - 1;
            const currI = inquiriesByMonth[currentIdx].count;
            const prevI = inquiriesByMonth[currentIdx - 1].count;
            changes.totalInquiries = prevI > 0 ? Math.round(((currI - prevI) / prevI) * 100) : (currI > 0 ? 100 : 0);
        }

        // Amount by payment status
        const paymentStatusSums = { success: 0, pending: 0, failed: 0, refunded: 0 };
        filteredBookings.forEach(b => {
            (b.payments || []).forEach(p => {
                const st = (p.status || '').toLowerCase();
                if (st in paymentStatusSums) {
                    paymentStatusSums[st] += p.amount || 0;
                }
            });
        });
        const amountByStatus = paymentStatusSums;

        // Inquiries by date (last 7 days)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const dateCounts = {};
        filteredInquiries.forEach(i => {
            const created = new Date(i.createdAt);
            if (created >= sevenDaysAgo) {
                const dateKey = created.toISOString().split('T')[0];
                dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
            }
        });
        const byDate = Object.entries(dateCounts).map(([date, count]) => ({ date, count }));

        // Recent inquiries
        const sortedInquiries = [...filteredInquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recent = sortedInquiries.slice(0, 3).map((i, idx) => ({
            id: idx + 1,
            name: i.name || 'N/A',
            package: i.packageTitle || 'N/A',
            date: new Date(i.createdAt).toISOString().split('T')[0]
        }));

        // Revenue by month
        const revenueByMonth = byMonth.map(m => ({ month: m.month, revenue: m.revenue }));

        // Payment methods
        const methodCounts = {};
        filteredBookings.forEach(b => {
            (b.payments || []).forEach(p => {
                const method = (p.method || 'unknown').toLowerCase();
                methodCounts[method] = (methodCounts[method] || 0) + 1;
            });
        });
        const totalPayments = Object.values(methodCounts).reduce((sum, v) => sum + v, 0);
        const paymentMethods = Object.entries(methodCounts)
            .filter(([_, count]) => count > 0)
            .map(([name, count]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace(/^\w/, c => c.toUpperCase()),
                value: totalPayments > 0 ? Math.round((count / totalPayments) * 100) : 0
            }));

        return {
            summary: {
                totalBookings,
                totalBookingValue,
                totalRevenue,
                pendingBookings,
                cancel,
                completedBookings,
                totalInquiries,
                totalItineraries,
                totalHotels,
                totalVehicles,
                totalTravelers,
                totalStaff,
                changes
            },
            bookings: {
                byStatus,
                byMonth,
                amountByStatus
            },
            inquiries: {
                byDate,
                recent
            },
            financials: {
                revenueByMonth,
                paymentMethods
            }
        };
    };

    const getFilteredData = (currentFilters) => {
        // Filter bookings (same logic as in calculateDashboardData)
        let filteredBookings = allBookings.filter(b => {
            const created = new Date(b.createdAt?.$date || b.createdAt);
            if (currentFilters.dateRange.start && created < new Date(currentFilters.dateRange.start)) return false;
            if (currentFilters.dateRange.end) {
                const end = new Date(currentFilters.dateRange.end);
                end.setHours(23, 59, 59, 999);
                if (created > end) return false;
            }
            if (currentFilters.status !== 'all' && b.status?.toLowerCase() !== currentFilters.status.toLowerCase()) return false;
            if (currentFilters.month === 'current') {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (created < monthStart) return false;
            }
            return true;
        });

        // Filter inquiries (same logic)
        let filteredInquiries = allInquiries.filter(i => {
            const created = new Date(i.createdAt);
            if (currentFilters.dateRange.start && created < new Date(currentFilters.dateRange.start)) return false;
            if (currentFilters.dateRange.end) {
                const end = new Date(currentFilters.dateRange.end);
                end.setHours(23, 59, 59, 999);
                if (created > end) return false;
            }
            if (currentFilters.month === 'current') {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (created < monthStart) return false;
            }
            return true;
        });

        // All others are not filtered
        const filteredHotels = allHotels;
        const filteredVehicles = allVehicles;
        const filteredItineraries = allItineraries;

        return {
            filteredBookings,
            filteredInquiries,
            filteredHotels,
            filteredVehicles,
            filteredItineraries
        };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                let url = `${API_BASE}/api/bookings`;

                if (user.role !== 'admin') {
                    url += `?createdBy=${user._id}`;
                }
                const results = await Promise.allSettled([
                    axios.get(url),
                    axios.get(`${API_BASE}/api/inquiries`, {
                        withCredentials: "true"
                    }),
                    axios.get(`${API_BASE}/api/hotels`),
                    axios.get(`${API_BASE}/api/vehicles`),
                    axios.get(`${API_BASE}/api/itineraries`),
                    axios.get(`${API_BASE}/api/categories`),
                    axios.get(`${API_BASE}/api/locations`),
                    axios.get(`${API_BASE}/api/admin/users`, {
                        withCredentials: true,
                    })
                ]);

                const bookings = results[0].status === 'fulfilled' ? results[0].value.data : [];
                const allInquiries = results[1].status === 'fulfilled' ? results[1].value.data?.data || [] : [];
                const hotels = results[2].status === 'fulfilled' ? results[2].value.data : [];
                const vehicles = results[3].status === 'fulfilled' ? results[3].value.data : [];
                const itineraries = results[4].status === 'fulfilled' ? results[4].value.data : [];
                const categories = results[5].status === 'fulfilled' ? results[5].value.data : [];
                const locations = results[6].status === 'fulfilled' ? results[6].value.data : [];
                const users = results[7].status === 'fulfilled' ? results[7].value.data : [];


                let displayInquiries = allInquiries;
                if (user && user.role !== "admin") {
                    displayInquiries = allInquiries.filter(
                        (inq) => inq.assignedTo?._id === user._id
                    );
                }
                console.log(allInquiries, user);



                setAllBookings(bookings);
                setAllInquiries(displayInquiries);
                setAllHotels(hotels);
                setAllVehicles(vehicles);
                setAllItineraries(itineraries);
                setAllCategories(categories);
                setAllLocations(locations);
                setAllUsers(users);

                const computedData = calculateDashboardData(bookings, allInquiries, hotels, vehicles, itineraries, filters, users);
                setDashboardData(computedData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);


    useEffect(() => {
        if (allBookings.length > 0 && allInquiries.length >= 0) {
            const computedData = calculateDashboardData(allBookings, allInquiries, allHotels, allVehicles, allItineraries, filters, allUsers);
            setDashboardData(computedData);
        }
    }, [filters, allBookings, allInquiries, allHotels, allVehicles, allItineraries, allUsers]);

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'dateRange') {
            setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, ...value }
            }));
        } else {
            setFilters(prev => ({
                ...prev,
                [filterType]: value
            }));
        }
    };

    const handleExport = () => {
        const { filteredBookings, filteredInquiries, filteredHotels, filteredVehicles, filteredItineraries } = getFilteredData(filters);

        let csvContent = '';

        // Summary Section
        csvContent += '=== DASHBOARD SUMMARY ===\n';
        csvContent += `Total Bookings,${dashboardData.summary.totalBookings}\n`;
        csvContent += `Total Booking Value,₹${dashboardData.summary.totalBookingValue}\n`;
        csvContent += `Total Revenue,₹${dashboardData.summary.totalRevenue}\n`;
        csvContent += `Confirmed Bookings,${dashboardData.summary.pendingBookings}\n`;
        csvContent += `Cancel Bookings,${dashboardData.summary.cancel}\n`;
        csvContent += `Completed Bookings,${dashboardData.summary.completedBookings}\n`;
        csvContent += `Total Inquiries,${dashboardData.summary.totalInquiries}\n`;
        csvContent += `Total Itineraries,${dashboardData.summary.totalItineraries}\n`;
        csvContent += `Total Hotels,${dashboardData.summary.totalHotels}\n`;
        csvContent += `Total Vehicles,${dashboardData.summary.totalVehicles}\n`;
        csvContent += `Total Travelers,${dashboardData.summary.totalTravelers}\n`;
        csvContent += `Total Staff,${dashboardData.summary.totalStaff}\n\n`;

        // Bookings Section
        csvContent += '=== BOOKINGS ===\n';
        const bookingHeaders = ['ID', 'Customer Name', 'Travel Date','Package', 'Status', 'Total Amount', 'Created At', 'Payments Summary'];
        csvContent += bookingHeaders.join(',') + '\n';
        filteredBookings.forEach(b => {
            const customerName = b.clientDetails?.name || b.guestDetails?.name || 'N/A';
            const traveldate = b.clientDetails?.traveldate || b.clientDetails?.travelDate || 'N/A';
            const packageName = b.itineraryData.titles[0] || 'N/A';
            // Assuming b.payments is an array of payment objects
            const paymentsSummary = (b.payments || [])
                .map(p => {
                    return `status: ${p.status || ''}, amount: ${p.amount || 0}, currency: ${p.currency || ''}, method: ${p.method || ''}, transactionId: ${p.transactionId || ''}, gateway: ${p.gateway || ''}, paymentDate: ${p.paymentDate ? new Date(p.paymentDate).toISOString() : ''}`;
                })
                .join(' | '); // Separate multiple payments with a pipe or comma

            csvContent += `"${b.bookingId || b._id || ''}","${customerName}"," ${traveldate}","${packageName}","${b.status || ''}",${b.totalAmount || 0},"${new Date(b.createdAt?.$date || b.createdAt).toISOString()}","${paymentsSummary}"\n`;
        });
        csvContent += '\n';
        // Inquiries Section
        csvContent += '=== INQUIRIES ===\n';
        const inquiryHeaders = ['Name', 'Email', 'Phone', 'Package Title', 'Created At'];
        csvContent += inquiryHeaders.join(',') + '\n';
        filteredInquiries.forEach(i => {
            csvContent += `"${i.name || ''}","${i.email || ''}","${i.phone || i.mobile || ''}","${i.packageTitle || ''}","${new Date(i.createdAt).toISOString()}"\n`;
        });
        csvContent += '\n';




        console.log(filteredHotels, allCategories);


        // Hotels Section
        csvContent += '=== HOTELS ===\n';
        const hotelHeaders = ['ID', 'Name', 'Location', 'Category', 'rating'];
        csvContent += hotelHeaders.join(',') + '\n';
        filteredHotels.forEach(h => {
            const catId = h.categoryId?.$oid || h.categoryId;
            const locId = h.locationId?.$oid || h.locationId;
            const category = allCategories.find(c => c._id === catId)?.name || 'N/A';
            const location = allLocations.find(l => l._id === locId)?.name || 'N/A';
            const price = h.price || h.roomPrice || 0;
            const availability = h.availableRooms || h.status || 'N/A';
            csvContent += `"${h._id || ''}","${h.name || ''}","${location}","${category}",${h.rating}\n`;
        });
        csvContent += '\n';

        // Vehicles Section
        csvContent += '=== VEHICLES ===\n';
        const vehicleHeaders = ['ID', 'Number', 'Name', 'Make', 'Model', 'Year', 'Color', 'Type', 'Price Per Day', 'Availability', 'Owner', 'Registration Expiry', 'Notes'];
        csvContent += vehicleHeaders.join(',') + '\n';

        filteredVehicles.forEach(v => {
            const type = v.type || v.vehicleType || 'N/A';
            const price = v.price || v.pricePerDay || 0;
            const availability = v.available || v.status || 'N/A';
            const owner = v.owner || 'N/A';
            const regExpiry = v.regExpiry ? new Date(v.regExpiry.$date || v.regExpiry).toISOString().split('T')[0] : 'N/A';

            csvContent += `"${v._id?.$oid || v._id || ''}","${v.number || ''}","${v.name || ''}","${v.make || ''}","${v.model || ''}","${v.year || ''}","${v.color || ''}","${type}",${price},"${availability}","${owner}","${regExpiry}","${v.notes || ''}"\n`;
        });

        csvContent += '\n';


        console.log(filteredItineraries);


        // Itineraries Section
        csvContent += '=== ITINERARIES ===\n';
        const itineraryHeaders = ['Tour Code', 'Title', 'Duration', 'Price', 'Created At'];
        csvContent += itineraryHeaders.join(',') + '\n';
        filteredItineraries.forEach(it => {
            const duration = it.duration || it.days?.length || 'N/A';
            // Choose price (standard as default)
            const price = it.packagePricing?.standard || 0;
            // Use title from `titles` array
            const title = it.titles?.[0] || '';
            const createdDate = it.createdAt?.$date || it.createdAt || it.updatedAt?.$date || it.updatedAt;
            csvContent += `"${it.tourcode || ''}","${title}","${duration}",${price},"${new Date(createdDate).toISOString()}"\n`;
        });


        const csvContentWithBOM = '\uFEFF' + csvContent;
        // Download the CSV
        const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `travel_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };




    // Colors for charts
    const COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#C9CBCF', '#FF6B6B', '#6BFFB8', '#FFD93D',
        '#845EC2', '#D65DB1', '#FF6F91', '#FF9671', '#FFC75F'
    ];

    const STATUS_COLORS = {
        pending: '#FFBB28',
        booked: '#0088FE',
        completed: '#00C49F',
        failed: '#FF8042',
        refunded: '#8884D8'
    };


    const paymentMethods = dashboardData.financials.paymentMethods || [];

    // Calculate percentages for the legend
    const totalValue = paymentMethods.reduce((sum, entry) => sum + entry.value, 0);
    const legendData = paymentMethods.map(entry => ({
        name: entry.name,
        value: entry.value,
        percent: totalValue > 0 ? (entry.value / totalValue * 100).toFixed(1) : 0,
        color: COLORS[paymentMethods.indexOf(entry) % COLORS.length]
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-600">Amount: {data.value}</p>
                    <p className="text-sm font-medium text-blue-600">
                        {((data.value / totalValue) * 100).toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // Helper function
    const formatAmount = (amount) => {
        if (amount >= 10000000) {
            // Crore
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            // Lakh
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            // Thousand
            return `₹${(amount / 1000).toFixed(1)}k`;
        } else {
            return `₹${amount}`;
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
            <div className="max-w-full mx-auto">
                {/* Header - Improved for small screens */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Main Dashboard</h1>
                            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Overview of your travel business performance</p>
                        </div>
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <input
                                    type="date"
                                    value={filters.dateRange.start}
                                    onChange={(e) => handleFilterChange('dateRange', { start: e.target.value })}
                                    className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                                />
                                <input
                                    type="date"
                                    value={filters.dateRange.end}
                                    onChange={(e) => handleFilterChange('dateRange', { end: e.target.value })}
                                    className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                                />
                            </div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="Booked">Booked</option>
                                <option value="complete">Completed</option>
                            </select>
                            <button
                                onClick={handleExport}
                                className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap"
                            >
                                <Download size={14} />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Adjusted breakpoints for better small screen stacking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <SummaryCard
                        title="Total Bookings"
                        value={dashboardData.summary.totalBookings}
                        icon={<Users className="text-blue-600" />}
                        changePct={dashboardData.summary.changes.totalBookings}
                    />
                    <SummaryCard
                        title="Total Booking Value"
                        value={formatAmount(dashboardData.summary.totalBookingValue)}
                        icon={<DollarSign className="text-yellow-600" />}
                        changePct={dashboardData.summary.changes.totalBookingValue}
                    />
                    <SummaryCard
                        title="Total Revenue"
                        value={formatAmount(dashboardData.summary.totalRevenue)}
                        icon={<DollarSign className="text-green-600" />}
                        changePct={dashboardData.summary.changes.totalRevenue}
                    />

                    <SummaryCard
                        title="Total Inquiries"
                        value={dashboardData.summary.totalInquiries}
                        icon={<Map className="text-purple-600" />}
                        changePct={dashboardData.summary.changes.totalInquiries}
                    />
                    <SummaryCard
                        title="Active Packages"
                        value={dashboardData.summary.totalItineraries}
                        icon={<Calendar className="text-orange-600" />}
                        changePct={dashboardData.summary.changes.totalItineraries}
                    />
                </div>

                {/* Second Row Cards - Reduced gap on small screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Hotels</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.summary.totalHotels}</p>
                            </div>
                            <Hotel className="text-blue-500" size={20} sm:size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Vehicles</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.summary.totalVehicles}</p>
                            </div>
                            <Car className="text-green-500" size={20} sm:size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Confirmed Bookings</p>
                                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{dashboardData.summary.pendingBookings}</p>
                            </div>
                            <Clock className="text-yellow-500" size={20} sm:size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{dashboardData.summary.completedBookings}</p>
                            </div>
                            <CheckCircle className="text-green-500" size={20} sm:size={24} />
                        </div>
                    </div>
                </div>

                {/* Additional Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <SummaryCard
                        title="Total Travelers"
                        value={dashboardData.summary.totalTravelers}
                        icon={<Users className="text-indigo-600" />}
                        changePct={dashboardData.summary.changes.totalTravelers}
                    />
                    <SummaryCard
                        title="Cancel Bookings"
                        value={dashboardData.summary.cancel}
                        icon={<XCircle className="text-red-600" />}
                        changePct={dashboardData.summary.changes.cancel}
                    />
                    <SummaryCard
                        title="Total Staff"
                        value={dashboardData.summary.totalStaff}
                        icon={<Users className="text-purple-600" />}
                        changePct={dashboardData.summary.changes.totalStaff}
                    />
                </div>

                {/* Charts Section - Adjusted heights for small screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Bookings by Status */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bookings by Status</h3>
                        <div className="h-64 sm:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dashboardData.bookings.byStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40} sm:innerRadius={60}
                                        outerRadius={60} sm:outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {dashboardData.bookings.byStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Revenue Trend</h3>
                        <div className="h-64 sm:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardData.financials.revenueByMonth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Additional Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Payment Methods */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Methods</h3>
                        <div className="flex flex-col gap-4 sm:gap-6">
                            {/* Chart */}
                            <div className="w-full h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={60} sm:outerRadius={80}
                                            dataKey="value"
                                        >
                                            {paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend Below */}
                            <div className="w-full">
                                <ul className="space-y-1 sm:space-y-2 flex gap-2 flex-wrap justify-center text-xs sm:text-sm">
                                    {legendData.map((entry, index) => (
                                        <li key={index} className="flex items-center justify-between min-w-0 flex-1 sm:flex-none">
                                            <div className="flex items-center truncate">
                                                <div
                                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-1 sm:mr-2 flex-shrink-0"
                                                    style={{ backgroundColor: entry.color }}
                                                ></div>
                                                <span className="text-gray-900 truncate">{entry.name}</span>
                                            </div>

                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bookings & Revenue */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bookings & Revenue</h3>
                        <div className="h-64 sm:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.bookings.byMonth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip formatter={(value, name) => {
                                        if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                                        return [value, 'Bookings'];
                                    }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="bookings" fill="#0088FE" name="Bookings" />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#00C49F" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Inquiries & Amount by Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Recent Inquiries */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Inquiries</h3>
                        <div className="space-y-3 sm:space-y-4">
                            {dashboardData.inquiries.recent.map((inquiry) => (
                                <div key={inquiry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg gap-2 sm:gap-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{inquiry.name}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">{inquiry.package}</p>
                                    </div>
                                    <div className="text-right sm:text-left">
                                        <p className="text-xs sm:text-sm text-gray-500">{new Date(inquiry.date).toLocaleDateString()}</p>
                                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            New
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Amount by Status */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Amount by Status</h3>
                        <div className="space-y-3 sm:space-y-4">
                            {Object.entries(dashboardData.bookings.amountByStatus).map(([status, amount]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div
                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                                            style={{ backgroundColor: STATUS_COLORS[status] || '#8884D8' }}
                                        ></div>
                                        <span className="capitalize text-gray-700 text-sm">{status}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 text-sm">₹{(amount / 1000).toFixed(1)}K</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Summary Card Component - Updated for dynamic change and responsive text
const SummaryCard = ({ title, value, icon, changePct = 0 }) => {
    const changeValue = Math.abs(changePct).toFixed(0);
    const isPositive = changePct >= 0;
    const changeType = isPositive ? 'positive' : 'negative';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <div className={`flex items-center mt-1 sm:mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        <Icon size={14} sm:size={16} className="mr-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{isPositive ? '+' : ''}{changeValue}% from last month</span>
                    </div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-100 rounded-lg ml-2 sm:ml-4 flex-shrink-0">
                    {React.cloneElement(icon, { size: 18, className: icon.props.className })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;