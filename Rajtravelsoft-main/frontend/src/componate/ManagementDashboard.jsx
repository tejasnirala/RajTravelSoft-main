"use client"

import { useState } from "react"
import EmailManagement from "./EmailManagement"
import InquiryManagement from "./InquiryManagement"
import Itinerarysoftmails from "./Itinerarysoftmails"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("email-management")

  const tabs = [
    {
      id: "email-management",
      label: "Email Management",
      component: <EmailManagement />,
    },
    {
      id: "inquiry-management",
      label: "Inquiry Management",
      component: <InquiryManagement />,
    },
    {
      id: "inquiry-software",
      label: "Itinerary Mails",
      component: <Itinerarysoftmails />,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">{tabs.find((tab) => tab.id === activeTab)?.component}</div>

      {/* Global Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick className="mt-16" />
    </div>
  )
}

export default ManagementDashboard
