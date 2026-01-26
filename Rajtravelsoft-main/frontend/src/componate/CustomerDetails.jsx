// AllCustomersList.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AllCustomersList = () => {
  const [customers, setCustomers] = useState({ pending: [], bookings: [] });
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        setLoading(true);

        let pendingCustomers = [];
        let bookingsCustomers = [];

        const query = user
          ? user.role !== 'admin'
            ? `createdBy=${user._id}&role=${user.role}`
            : `role=${user.role}`
          : ``;

        // -----------------------------
        // ⭐ 1) FETCH PENDING
        // -----------------------------
        try {
          const pendingResponse = await axios.get(
            `https://apitour.rajasthantouring.in/api/pending?${query}`, {
             credentials: "include"
          }
          );

          const pendingMap = new Map();
          const allowedPendingStatuses = ['pending', 'cancel', 'cancelled', 'confirmed'];

          pendingResponse.data.forEach((booking) => {
            const client = booking.clientDetails || {};

            // 🚫 Skip if status = created
            if (!allowedPendingStatuses.includes(booking.status?.toLowerCase())) return;

            if (client.email) {
              pendingMap.set(client.email, {
                name: client.name || 'N/A',
                email: client.email,
                phone: client.phone || 'N/A',
                profilePhoto: client.profilePhoto || null,
                createdAt: booking.createdAt || new Date(),
              });
            }
          });


          pendingCustomers = Array.from(pendingMap.values()).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        } catch (err) {
          console.warn('Failed to fetch pending:', err);
        }

        // -------------------------------------
        // ⭐ 2) FETCH BOOKINGS + STATUS FILTER
        // -------------------------------------
        try {
          const bookingsResponse = await axios.get(
            `https://apitour.rajasthantouring.in/api/bookings?${query}`
          );

          const allowedStatuses = ['confirmed', 'booked', 'completed', 'complete'];

          const bookingsMap = new Map();
          bookingsResponse.data.forEach((booking) => {
            const client = booking.clientDetails || {};

            if (
              client.email &&
              allowedStatuses.includes(booking.status?.toLowerCase())
            ) {
              bookingsMap.set(client.email, {
                name: client.name || 'N/A',
                email: client.email,
                phone: client.phone || 'N/A',
                profilePhoto: client.profilePhoto || null,
                createdAt: booking.createdAt || new Date(),
              });
            }
          });

          bookingsCustomers = Array.from(bookingsMap.values()).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        } catch (err) {
          console.warn('Failed to fetch bookings:', err);
        }

        setCustomers({ pending: pendingCustomers, bookings: bookingsCustomers });
      } catch (err) {
        setError('Failed to fetch customers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCustomers();
  }, [user]);

  const totalCustomers = [...customers.pending, ...customers.bookings].length;
  const pendingCount = customers.pending.length;
  const bookingsCount = customers.bookings.length;

  if (loading)
    return <div className="text-center p-6 text-lg text-gray-600">Loading customers...</div>;

  if (error)
    return <div className="text-center p-6 text-lg text-red-500">{error}</div>;

  if (totalCustomers === 0)
    return <div className="text-center p-6 text-lg text-gray-600">No customers found.</div>;

  const tabs = [
    { id: 'pending', label: `Pending Customers (${pendingCount})` },
    { id: 'bookings', label: `Bookings Customers (${bookingsCount})` },
  ];

  const currentCustomers = customers[activeTab];

  const filteredCustomers = currentCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCustomerCards = (customerList) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customerList.map((customer) => (
        <div key={customer.email} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg">
          <div className="flex justify-center mb-3">
            {customer.profilePhoto ? (
              <img
                src={`https://apitour.rajasthantouring.in${customer.profilePhoto}`}
                alt={`${customer.name} profile`}
                className="w-24 h-24 object-cover rounded-full"
              />
            ) : (
              <img
                src="/logo.png"
                className="w-24 h-24 object-cover rounded-full"
                alt="default"
              />
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-800 text-center">{customer.name}</h3>
          <p className="text-sm text-gray-600"><strong>Email:</strong> {customer.email}</p>
          <p className="text-sm text-gray-600"><strong>Phone:</strong> {customer.phone}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-5 text-center">
        <h1 className="text-blue-600 underline text-2xl font-bold">All Customers (Latest First)</h1>
        <p className="text-lg text-gray-600 mt-1">Total Customers: {totalCustomers}</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md mx-auto p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-center mb-6 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 mx-1 rounded-t-lg text-sm font-medium transition ${activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:bg-gray-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {filteredCustomers.length === 0 ? (
          <div className="text-center text-gray-500 p-6">
            {searchTerm
              ? `No ${activeTab} customers match "${searchTerm}".`
              : `No ${activeTab} customers found.`}
          </div>
        ) : (
          renderCustomerCards(filteredCustomers)
        )}
      </div>
    </div>
  );
};

export default AllCustomersList;
