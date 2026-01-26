// InvoiceGenerator.jsx (Updated: Add new tab for "car-rental")
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import SalesInvoice from "./SalesInvoice"
import QuotationInvoiceForm from "./QuotationInvoice"
import CarRentalInvoiceForm from "./CarRentalInvoiceForm" // New import
import Dashboardbills from "../componate/Dashboardbills"

const InvoiceGenerator = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("sales")

  // Sync activeTab with URL query params on mount/change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['sales', 'car-rental', 'quotation', 'allbills'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (key) => {
    setActiveTab(key)
    // Update URL query params without full reload
    navigate(`?tab=${key}`, { replace: true })
  }

  const renderInvoiceComponent = () => {
    const editId = searchParams.get('edit')
    switch (activeTab) {
      case "sales":
        return <SalesInvoice editId={editId} />
      case "car-rental":
        return <CarRentalInvoiceForm editId={editId} />
      case "quotation":
        return <QuotationInvoiceForm />
      case "allbills":
        return <Dashboardbills />
      default:
        return <SalesInvoice editId={editId} />
    }
  }

  return (
    <div className="min-h-screen  py-4 p-2 bg-gray-100 text-gray-900">
      <div className=" mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 mb-6 sm:mb-8">
          Invoice Generator
        </h1>

        {/* Tabs */}
        <div className="rounded-t-lg shadow-md overflow-x-auto bg-white">
          <div className="flex overflow-x-auto w-full">
            {[
              { key: "sales", label: "Sales Invoice (Travel)" },
              { key: "car-rental", label: "Car Rental Invoice" }, // New tab
              { key: "quotation", label: "Quotation Invoice" },
              { key: "allbills", label: "All Bills" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`flex-1 text-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleTabChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-md p-4 sm:p-6 rounded-b-lg">
          {renderInvoiceComponent()}
        </div>
      </div>
    </div>
  )
}

export default InvoiceGenerator