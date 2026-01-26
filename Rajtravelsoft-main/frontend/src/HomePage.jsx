// HomePage.jsx
import React, { useEffect, useState } from "react";
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const HomePage = () => {
  const [softwareData, setSoftwareData] = useState(null);

  useEffect(() => {
    const fetchSoftwareData = async () => {
      try {
        const response = await fetch("https://apitour.rajasthantouring.in/api/toursoftware");
        const data = await response.json();

        // Assuming we only show the first (latest) record
        if (data && data.length > 0) {
          setSoftwareData(data[0]);
        }
      } catch (error) {
        console.error("Error fetching software data:", error);
      }
    };

    fetchSoftwareData();
  }, []);

  const navigate = useNavigate()

  return (
    <div className="font-sans  flex flex-col justify-between  bg-white">


      <div>
        {/* Logo Section */}
        <div className="flex h-[50vh] justify-center items-end">
          {softwareData?.logo ? (
            <img
              src={
                softwareData.logo.startsWith("/uploads")
                  ? `https://apitour.rajasthantouring.in${softwareData.logo}`
                  : softwareData.logo
              }
              alt="Logo"
              className="w-[300px] h-[300px] object-contain"
            />
          ) : (
            <>
            </>)}
        </div>

        {/* Hero Section */}
        <section className="bg-white text-gray-900 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {softwareData?.softwareName || "Tour Software"}
            </h1>

            <p className="text-lg sm:text-xl mb-8">
              {softwareData?.description || "Custom Software for Travel Agency"}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate("/pending")}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <Plus />
                Regular Itinerary
              </button>

              <button
                onClick={() => navigate("/page")}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <Plus />
                Final Itinerary
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-8 text-center border-t border-gray-200">
        <p>
          © {softwareData?.year || "2025"}{" "}
          {softwareData?.companyName || "Jasper Software Solutions"}. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
