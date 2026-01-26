"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

export default function PaymentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`https://apitour.rajasthantouring.in/api/bookings/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch booking data")
        }
        const bookingData = await response.json()
        setData(bookingData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBookingData()
    }
  }, [id])

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "refunded":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "pending":
        return "bg-yellow-50 border-yellow-200"
      case "failed":
        return "bg-red-50 border-red-200"
      case "refunded":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 transition-all duration-300 p-4">
        <div className="text-center space-y-4" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto sm:h-16 sm:w-16"></div>
          <p className="text-base sm:text-lg font-medium text-gray-700">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 transition-all duration-300">
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-4 sm:px-6 sm:py-4 rounded-lg max-w-md w-full text-center shadow-lg">
          <p className="font-semibold text-sm sm:text-base" role="alert">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 transition-all duration-300">
        <p className="text-lg font-medium text-gray-700">No booking data found</p>
      </div>
    )
  }

  const Payments = data.payments
  const successfulPayments = data.payments.filter((p) => p.status === "success")
  const totalPaidAmount = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = data.totalAmount - totalPaidAmount

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="text-center border-b border-gray-200 pb-4 sm:pb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-600 tracking-tight">
            Payment Details
          </h1>
        
        </header>

        {/* Payment Details */}
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 transition-shadow hover:shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-3">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full"></span>
            Payment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                ₹{data.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">Amount Paid</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                ₹{totalPaidAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">Remaining</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                ₹{remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">All Payment History</h3>
            {Payments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {Payments.map((payment, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 sm:p-4 lg:p-6 ${getStatusBgColor(payment.status)} transition-shadow hover:shadow-sm`}
                  >
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <span
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(payment.status)}`}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 bg-white px-1 sm:px-2 py-1 rounded">
                            {payment.currency}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          {payment.method && (
                            <div>
                              <span className="font-medium text-gray-700">Payment Method:</span>
                              <p className="text-gray-900">{payment.method}</p>
                            </div>
                          )}
                          {payment.transactionId && (
                            <div>
                              <span className="font-medium text-gray-700">Transaction ID:</span>
                              <p className="text-gray-900 font-mono text-xs sm:text-sm break-all">
                                {payment.transactionId}
                              </p>
                            </div>
                          )}
                          {payment.gateway && (
                            <div>
                              <span className="font-medium text-gray-700">Gateway:</span>
                              <p className="text-gray-900">{payment.gateway}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Payment Date:</span>
                            <p className="text-gray-900 text-sm">
                              {new Date(payment.paymentDate.$date || payment.paymentDate).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          {payment.receiptUrl && (
                            <div>
                              <span className="font-medium text-gray-700">Receipt:</span>
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {payment.screenshot && (
                        <div className="w-full lg:w-1/3 mt-3 lg:mt-0">
                          <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Payment Screenshot</h4>
                            <img
                              src={payment.screenshot || "/placeholder.svg?height=200&width=300"}
                              alt="Payment Screenshot"
                              className="w-full h-32 sm:h-40 lg:h-48 object-cover rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.open(payment.screenshot, "_blank")}
                            />
                            <p className="text-xs text-gray-500 mt-1 sm:mt-2 text-center">Click to view full size</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm sm:text-base text-gray-500">No payments recorded yet</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Payment history will appear here once transactions are made</p>
              </div>
            )}
          </div>
        </section>

        {/* Client Details */}
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 transition-shadow hover:shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-3">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full"></span>
            Client Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Name:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.name}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Email:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-all">{data.clientDetails.email}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Phone:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.phone}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Travel Date:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">
                  {new Date(data.clientDetails.travelDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Adults:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.adults}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Kids (5-12):</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.kids5to12}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Kids (Below 5):</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.kidsBelow5}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">Rooms:</span>
                <p className="text-sm sm:text-base lg:text-lg text-gray-900">{data.clientDetails.rooms}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Itinerary Details */}
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 transition-shadow hover:shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-3">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded-full"></span>
            Itinerary Details
          </h2>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
              {data.itineraryData.titles?.[0]}
            </h3>
            <button
              onClick={() => navigate(`/admin/${data.theme.link}/${id}`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.577-3.007-9.964-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              View
            </button>
          </div>
        </section>

        {/* Booking Status */}
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 transition-shadow hover:shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">Booking Status</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Created: {new Date(data.createdAt.$date || data.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Updated: {new Date(data.updatedAt.$date || data.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center ${
                data.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : data.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {data.status?.toUpperCase()}
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}