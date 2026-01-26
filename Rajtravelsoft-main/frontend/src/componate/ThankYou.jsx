import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const ThankYou = () => {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [structure, setStructure] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        console.log('No ID provided');
        return;
      }

      try {
        // ✅ Try to fetch from BOOKING API first
        let bookingData = null;

        try {
          console.log('Trying to fetch from Booking API...');
          const bookingRes = await axios.get(
            `https://apitour.rajasthantouring.in/api/bookings/${id}`,
            { withCredentials: true }
          );
          bookingData = bookingRes.data;
          console.log('✅ Found in Booking API:', bookingData);
        } catch (bookingErr) {
          console.log('❌ Not found in Booking API, trying Pending API...');
          
          // ✅ If not found in booking, try PENDING API
          try {
            const pendingRes = await axios.get(
              `https://apitour.rajasthantouring.in/api/pending/${id}`,
              { withCredentials: true }
            );
            bookingData = pendingRes.data;
            console.log('✅ Found in Pending API:', bookingData);
          } catch (pendingErr) {
            console.log('❌ Not found in Pending API either');
          }
        }

        // ✅ Fetch Structure Data (Logo) - Always fetch
        const structureRes = await axios.get(
          "https://apitour.rajasthantouring.in/api/structure",
          { withCredentials: true }
        );

        setBooking(bookingData);
        setStructure(structureRes.data);

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [id]);

  console.log(structure);

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center justify-center bg-gray-100 p-4">

      {structure?.logo && (
        <img
          src={`https://apitour.rajasthantouring.in${structure.logo}`}
          alt="Company Logo"
          className="w-32 h-32 mb-6 object-contain"
        />
      )}
      <h1 className="text-5xl font-bold text-green-700 mb-4">Thank You!</h1>
      <p className="text-lg text-gray-800 text-center max-w-2xl">
        We have received your payment. We will check the details and get back to you very soon.
      </p>

      {/* -------------------- BOOKING CONTACTS ---------------------- */}
      {booking?.contact && (
        <div className="mt-6 text-center text-gray-700">
          <h2 className="text-lg font-semibold">Booking Contact Details</h2>

          {/* Mobiles (Array) */}
          {booking.contact.mobiles?.length > 0 && (
            <p className="mt-2">
              Mobile:{" "}
              {booking.contact.mobiles.map((mobile, index) => (
                <span key={index}>
                  <a
                    href={`tel:${mobile}`}
                    className="text-blue-600 underline"
                  >
                    {mobile}
                  </a>
                  {index < booking.contact.mobiles.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}

          {/* Emails (Array) */}
          {booking.contact.emails?.length > 0 && (
            <p className="mt-1">
              Email:{" "}
              {booking.contact.emails.map((email, index) => (
                <span key={index}>
                  <a
                    href={`mailto:${email}`}
                    className="text-blue-600 underline"
                  >
                    {email}
                  </a>
                  {index < booking.contact.emails.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default ThankYou;