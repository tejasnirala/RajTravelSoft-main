import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { FaCar, FaCalendarAlt, FaUsers, FaComment, FaMoneyBillWave, FaExclamationTriangle } from "react-icons/fa";
import { MdLocationOn, MdLocationPin } from "react-icons/md";

const CarBooking = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({
    pickupLocation: "",
    dropLocation: "",
    pickupDate: "",
    dropDate: "",
    passengers: 1,
    notes: "",
  });

  // Fetch all vehicles and active bookings to determine currently available vehicles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, bookingsRes] = await Promise.all([
          axios.get("https://apitour.rajasthantouring.in/api/vehicles"),
          axios.get("https://apitour.rajasthantouring.in/api/carbookings/all")
        ]);
        setVehicles(vehiclesRes.data);
        setAllBookings(bookingsRes.data);
        
        // Filter currently available vehicles (no active ongoing bookings)
        const now = new Date();
        const unavailableVehicleIds = new Set();
        bookingsRes.data.forEach(booking => {
          const status = booking.bookingStatus;
          if (status === 'Cancelled' || status === 'Completed') return;
          const pickup = new Date(booking.pickupDate);
          const drop = new Date(booking.dropDate);
          if (pickup <= now && drop > now) {
            unavailableVehicleIds.add(booking.vehicle._id);
          }
        });
        const currentlyAvailable = vehiclesRes.data.filter(v => !unavailableVehicleIds.has(v._id));
        setAvailableVehicles(currentlyAvailable);
        if (currentlyAvailable.length > 0) {
          setSelectedVehicle(currentlyAvailable[0]);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  // Check vehicle availability when dates change
  useEffect(() => {
    if (form.pickupDate && form.dropDate) {
      checkAvailability(vehicles);
    }
  }, [form.pickupDate, form.dropDate]);

  const checkAvailability = async (vehiclesList) => {
    try {
      const res = await axios.post("https://apitour.rajasthantouring.in/api/carbookings/check-availability", {
        pickupDate: form.pickupDate,
        dropDate: form.dropDate
      });

      const availableVehicleIds = res.data.availableVehicles;
      const available = vehiclesList.filter(vehicle => 
        availableVehicleIds.includes(vehicle._id)
      );
      
      setAvailableVehicles(available);
      if (available.length > 0) {
        setSelectedVehicle(available[0]);
      } else {
        setSelectedVehicle(null);
      }
    } catch (err) {
      console.error("Availability check failed", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return alert("Please select a vehicle!");

    try {
      const res = await axios.post("https://apitour.rajasthantouring.in/api/carbookings/carBook", {
        userId: user._id,
        vehicleId: selectedVehicle._id,
        ...form,
      });

      if (res.data.success) {
        alert("Booking successful!");
        navigate("/carbooking-list");
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Booking failed");
    }
  };

  const totalDays = form.pickupDate && form.dropDate 
    ? Math.ceil((new Date(form.dropDate) - new Date(form.pickupDate)) / (1000 * 60 * 60 * 24))
    : 0;
  const totalAmount = selectedVehicle ? totalDays * selectedVehicle.price : 0;

  const noVehiclesMessage = form.pickupDate && form.dropDate 
    ? "No vehicles available for selected dates" 
    : "No vehicles currently available";

  return (
    <div className="min-h-screen py-2 px-1 sm:px-2 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full ">
        <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 border border-gray-200/60 shadow-sm rounded-xl">
          <div className="text-center mb-4 sm:mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">Book Your Ride</h2>
            <p className="text-gray-600 text-xs sm:text-sm">Choose vehicle and details for a seamless journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Vehicle Select */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <FaCar className="mr-1.5 text-blue-500" />
                Select Vehicle
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                value={selectedVehicle?._id || ""}
                onChange={(e) =>
                  setSelectedVehicle(
                    availableVehicles.find((v) => v._id === e.target.value)
                  )
                }
                disabled={availableVehicles.length === 0}
              >
                {availableVehicles.length === 0 ? (
                  <option value="">{noVehiclesMessage}</option>
                ) : (
                  availableVehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.model} - {vehicle.make} ({vehicle.type})
                    </option>
                  ))
                )}
              </select>
              {availableVehicles.length === 0 && form.pickupDate && form.dropDate && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1.5 text-red-400" />
                  No vehicles available for the selected dates. Please try different dates.
                </p>
              )}
              {availableVehicles.length === 0 && !form.pickupDate && !form.dropDate && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1.5 text-red-400" />
                  No vehicles currently available.
                </p>
              )}
            </div>

            {/* Locations Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full">
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                  <MdLocationOn className="mr-1.5 text-green-500" />
                  Pickup Location
                </label>
                <input
                  type="text"
                  placeholder="Enter pickup city/address"
                  className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 text-gray-700 transition-all duration-150 shadow-sm"
                  value={form.pickupLocation}
                  onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                  required
                />
              </div>
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                  <MdLocationPin className="mr-1.5 text-red-500" />
                  Drop Location
                </label>
                <input
                  type="text"
                  placeholder="Enter drop city/address"
                  className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/50 text-gray-700 transition-all duration-150 shadow-sm"
                  value={form.dropLocation}
                  onChange={(e) => setForm({ ...form, dropLocation: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full">
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                  <FaCalendarAlt className="mr-1.5 text-blue-500" />
                  Pickup Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-gray-700 transition-all duration-150 shadow-sm"
                  value={form.pickupDate}
                  onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                  <FaCalendarAlt className="mr-1.5 text-purple-500" />
                  Drop Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 text-gray-700 transition-all duration-150 shadow-sm"
                  value={form.dropDate}
                  onChange={(e) => setForm({ ...form, dropDate: e.target.value })}
                  min={form.pickupDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Passengers */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <FaUsers className="mr-1.5 text-indigo-500" />
                Number of Passengers
              </label>
              <input
                type="number"
                placeholder="e.g., 4"
                className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 text-gray-700 transition-all duration-150 shadow-sm"
                min="1"
                value={form.passengers}
                onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Notes */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                <FaComment className="mr-1.5 text-gray-500" />
                Additional Notes (Optional)
              </label>
              <textarea
                placeholder="Any special requirements?"
                className="w-full border border-gray-300 p-2 sm:p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white/50 text-gray-700 resize-none transition-all duration-150 shadow-sm"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {/* Booking Summary */}
            {selectedVehicle && form.pickupDate && form.dropDate && totalDays > 0 && (
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200/50 shadow-sm w-full">
                <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-2.5 flex items-center">
                  <FaMoneyBillWave className="mr-1.5 text-green-600" />
                  Booking Summary
                </h3>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <p className="text-gray-700"><span className="font-semibold">Vehicle:</span> {selectedVehicle.model} - {selectedVehicle.make}</p>
                  <p className="text-gray-700"><span className="font-semibold">Total Days:</span> <span className="font-bold text-green-600">{totalDays}</span></p>
                                 </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
              disabled={!selectedVehicle || totalDays === 0}
            >
              Confirm & Book Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarBooking;