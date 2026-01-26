import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const CarDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    pendingPayments: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://apitour.rajasthantouring.in/api/carbookings/dashboard");
      setStats(res.data.stats);
      setRecentBookings(res.data.recentBookings);
      setRevenueData(res.data.revenueData);
      setVehicleStats(res.data.vehicleStats);

      console.log(res.data);
      
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your car rentals today.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Total Bookings</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Confirmed</h3>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.confirmedBookings}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Pending Payments</h3>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.pendingPayments}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vehicle Stats */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Vehicle Bookings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {vehicleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Bookings</h3>
            <p className="text-sm text-gray-600">Latest 5 bookings</p>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.user?.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.vehicle?.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.pickupDate).toLocaleDateString()} - {new Date(booking.dropDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">₹{booking.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-semibold text-gray-900 flex-1">
                    {booking.user?.name}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    booking.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.bookingStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">Vehicle: {booking.vehicle?.name}</div>
                <div className="text-xs text-gray-600 mb-2">
                  {new Date(booking.pickupDate).toLocaleDateString()} - {new Date(booking.dropDate).toLocaleDateString()}
                </div>
                <div className="text-sm font-medium text-green-600">₹{booking.totalAmount.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {recentBookings.length === 0 && (
            <div className="text-center py-12 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4m6 2h1m-1 0h-1m0 0v1m0-1v-1" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent bookings</h3>
              <p className="text-sm text-gray-500">Get started by creating your first booking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDashboard;