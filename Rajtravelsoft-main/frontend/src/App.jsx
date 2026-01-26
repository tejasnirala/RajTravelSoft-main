// Modified App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import MainPage from "./hotelpage/MainPage";
import Header from "./componate/Header";
import Sidebar from "./Sidebar"; // Assuming Sidebar is in root or adjust path
import CategoryManager from "./hotelpage/CategoryManager";
import LocationManager from "./hotelpage/LocationManager";
import HotelManager from "./hotelpage/HotelManager";
import Itinerary from "./itenery/ItineraryManager";
import BookingPage from "./createpackage/Page";
import BookingViewPage from "./hotelpage/ViewData";
import ViewDataadmin from "./hotelpage/ViewDataadmin";
import BookingsList from "./createpackage/BookingsList";
import Editpackage from "./createpackage/Editpackage";
import EmailManagement from "./componate/EmailManagement";
import Paymentdetailsfull from "./createpackage/Paymentdetailsfull";
import VehicleManager from "./hotelpage/VehicleApp";
import Payment from "./createpackage/Payment";
import Login from "./user/Login";
import AdminDashboard from "./componate/AdminDashboard";
import Profile from "./user/Profile";
import ProtectedRoute from "./ProtectedRoute";
import NotAuthorized from "./componate/NotAuthorized";
import Structure from "./user/Structure";
import ManagementDashboard from "./componate/ManagementDashboard";
import Viewdata2 from "./itenery/Viewdata2";
import TourInclusionExclusionForm from "./componate/TourInclusionExclusionForm";
import Viewdata3 from "./itenery/Viewdata3";
import UserBookNow from "./componate/UserBookNow";
import ThankYou from "./componate/ThankYou";
import HomePage from "./HomePage";
import Viewdata4 from "./itenery/ViewData4";
import Viewdata2admin from "./itenery/Viewdata2admin";
import Viewdata3admin from "./itenery/Viewdata3admin";
import ViewData4admin from "./itenery/ViewData4admin";
import AllCustomersList from "./componate/CustomerDetails";
import PaymentsManager from "./componate/FetchAllPayments";
import Viewdata6 from "./itenery/Viewdata6";
import ViewData6admin from "./itenery/ViewData6admin";
import Dashboard from "./componate/Deshboard";
import useDisableInspect from "./UseDisableInspect";
import 'react-toastify/dist/ReactToastify.css';
import NotificationHandler from "./componate/NotificationHandler";
import InvoiceGenerator from "./invoice/InvoiceGenerator";
import PendingBookingCreate from "./pending/PendingBookingCreate";
import SendUser from "./pending/SendUser";
import CarBooking from "./car/CarBooking";
import CarBookingList from "./car/CarBookingList";
import CarDeshboard from "./car/CarDeshboard";
import ViewPending from "./pending/ViewPending";
import DashboardBookings from "./pending/DashboardBookings";
import 'react-quill/dist/quill.snow.css';
import Reports from "./componate/Reports";
import SenduserViewdata from "./pending/SenduserViewdata";
import SenduserViewdata2 from "./pending/SenduserViewdata2";
import SenduserViewdata3 from "./pending/SenduserViewdata3";
import Senduserviewdata4 from "./pending/Senduserviewdata4";
import Senduserviewdata5 from "./pending/Senduserviewdata5";
import PdfViewer from "./pending/Pdf";
import BookedBookings from "./componate/BookedBookingsloss";
import AllbookingsheetCreate from "./componate/AllbookingsheetCreate";
import ItinerarySuggestions from "./itenery/ItinerarySuggestions";


const App = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hideHeaderRoutes = ["/viewData/:id", "/userpayment/:id", "/viewData2/:id", "/viewData3/:id", "/thank-you", "/SenduserviewData/:id", "/SenduserviewData2/:id", "/SenduserviewData3/:id", "/SenduserviewData4/:id", "/SenduserviewData5/:id"];
  // Current route ke liye check
  const shouldShowHeader = !hideHeaderRoutes.some(path =>
    location.pathname.startsWith(path.split("/:")[0])
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [location]);

  const fetchUser = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };



  // useDisableInspect();

  // Check if a path is active
  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  if (loading) return null;

  const hasUserAccess = user && user.status === "active";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen flex flex-col bg-none">
      {shouldShowHeader && <Header toggleSidebar={toggleSidebar} />}
      <div className={` "flex flex-1 bg-none"`}>
        {shouldShowHeader && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        <main
          className={shouldShowHeader
            ? `flex-1 flex flex-col overflow-auto bg-transparent ${hasUserAccess ? "lg:ml-64" : ""}`
            : "w-full"}
        >

          <NotificationHandler />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pdf" element={<PdfViewer />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/viewData/:id" element={<BookingViewPage />} />
            <Route path="/SenduserviewData/:id" element={<SenduserViewdata />} />
            <Route path="/admin/viewData/:id" element={<ViewDataadmin />} />
            <Route path="/viewData2/:id" element={<Viewdata2 />} />
            <Route path="/SenduserviewData2/:id" element={<SenduserViewdata2 />} />

            <Route path="/admin/viewData2/:id" element={<Viewdata2admin />} />
            <Route path="/viewData3/:id" element={<Viewdata3 />} />
            <Route path="/SenduserviewData3/:id" element={<SenduserViewdata3 />} />

            <Route path="/admin/viewData3/:id" element={<Viewdata3admin />} />
            <Route path="/viewData4/:id" element={<Viewdata4 />} />
            <Route path="/SenduserviewData4/:id" element={<Senduserviewdata4 />} />

            <Route path="/SendUser/:id" element={<SendUser />} />
            <Route path="/admin/viewData4/:id" element={<ViewData4admin />} />
            <Route path="/viewData5/:id" element={<Viewdata6 />} />
            <Route path="/SenduserviewData5/:id" element={<Senduserviewdata5 />} />

            <Route path="/admin/viewData5/:id" element={<ViewData6admin />} />
            <Route path="/userpayment/:id" element={<UserBookNow />} />
            <Route path="/thank-you" element={<ThankYou />} />

            <Route element={<ProtectedRoute permission="Invoice" />}>
              <Route path="/invoice" element={<InvoiceGenerator />} />
            </Route>
            <Route element={<ProtectedRoute permission="Customers" />}>
              <Route path="/customers" element={<AllCustomersList />} />
            </Route>
            <Route element={<ProtectedRoute permission="Car-Rental" />}>
              <Route path="/Carrental" element={<CarBooking />} />
              <Route path="/carbooking-list" element={<CarBookingList />} />
              <Route path="/car-deshboard" element={<CarDeshboard />} />
            </Route>
            {/* Protected Routes */}
            <Route element={<ProtectedRoute permission="manage_categories" />}>
              <Route path="/categories" element={<CategoryManager />} />
            </Route>
            <Route element={<ProtectedRoute permission="dashboard" />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<ProtectedRoute permission="manage_locations" />}>
              <Route path="/locations" element={<LocationManager />} />
            </Route>
            <Route element={<ProtectedRoute permission="view_hotels" />}>
              <Route path="/hotels" element={<HotelManager />} />
            </Route>
            <Route element={<ProtectedRoute permission="view_itinerary" />}>
              <Route path="/itinerary" element={<Itinerary />} />
              <Route path="/ItinerarySuggestion" element={<ItinerarySuggestions />} />
            </Route>
            <Route element={<ProtectedRoute permission="reports" />}>
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route element={<ProtectedRoute permission="manage_vehicles" />}>
              <Route path="/vehicleManager" element={<VehicleManager />} />
            </Route>
            <Route element={<ProtectedRoute permission="prop&loss" />}>
              <Route path="/prop&loss" element={<BookedBookings />} />
            </Route>
            <Route element={<ProtectedRoute permission="Operation-Sheet" />}>
              <Route path="/transportbooking" element={<AllbookingsheetCreate />} />
            </Route>
            <Route element={<ProtectedRoute permission="manage_bookings" />}>
              <Route path="/page" element={<BookingPage />} />
              <Route path="/Pending" element={<PendingBookingCreate />} />
              <Route path="/PendingBooking" element={<ViewPending />} />

              <Route path="/list" element={<BookingsList />} />
              <Route path="/update/:id" element={<Editpackage />} />
            </Route>
            <Route element={<ProtectedRoute permission="view_payments" />}>
              <Route path="/paymentDetails" element={<Payment />} />
              <Route path="/PaymentsManager" element={<PaymentsManager />} />
              <Route path="/Paymentdetailsfull/:id" element={<Paymentdetailsfull />} />
            </Route>
            <Route element={<ProtectedRoute permission="manage_emails" />}>
              <Route path="/bookings/emails" element={<ManagementDashboard />} />
            </Route>
vandana.rajasthantouring@gmail.com
            <Route element={<ProtectedRoute permission="transportsheet" />}>
              <Route path="/Allbooking" element={<DashboardBookings />} />
            </Route>

            <Route element={<ProtectedRoute permission="Structure" />}>
              <Route path="/Structure" element={<Structure />} />
            </Route>
            <Route element={<ProtectedRoute permission="StaffManagement" />}>
              <Route path="/StaffManagement" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;