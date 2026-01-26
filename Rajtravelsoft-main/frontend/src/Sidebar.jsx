// Sidebar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// Define navigation items with required role and permission
const navItems = [
  { path: "/", label: "Home", permission: null },
  { path: "/dashboard", label: "Dashboard", permission: "dashboard" },
  { path: "/hotels", label: "Hotels", permission: "view_hotels" },
  { path: "/itinerary", label: "Itinerary", permission: "view_itinerary" },
  {
    label: "Services",
    permission: ["manage_categories", "manage_locations", "manage_vehicles"],
    roles: ["admin", "manager", "staff"],
    subItems: [
      { path: "/categories", label: "Categories", permission: "manage_categories" },
      { path: "/locations", label: "Locations", permission: "manage_locations" },
      { path: "/vehicleManager", label: "Vehicle", permission: "manage_vehicles" },
      { path: "/Structure", label: "Structure", permission: "Structure" },
      { path: "/ItinerarySuggestion", label: "ItinerarySuggestion", permission: "ItinerarySuggestion" },
    ],
  },
  {
    label: "Booking",
    permission: ["manage_bookings ,transportsheet"],
    subItems: [
      { path: "/Pending", label: "Regular  Itinerary", permission: "manage_bookings" },
      { path: "/PendingBooking", label: "Regular Itinerary List ", permission: "manage_bookings" },
      // { path: "/page", label: "Create Final Itinearay ", permission: "manage_bookings" },
      { path: "/list", label: "All Confirm Booking", permission: "manage_bookings" },

      { path: "/Allbooking", label: "Transport Sheets", permission: "transportsheet" },

    ],
  },
  {
    label: "CRM",
    permission: ["Customers", "manage_emails"],
    subItems: [
      { path: "/customers", label: "Customer", permission: "Customers" },
      { path: "/bookings/emails", label: "Email Details", permission: "manage_emails" },
    ],
  },
  { path: "/transportbooking", label: "Operation Sheet", permission: "Operation-Sheet" },

  // {
  //   label: "Car Rental",
  //   permission: ["Car-Rental"],
  //   subItems: [
  //     { path: "/Carrental", label: "Car rentel", permission: "Car-Rental" },
  //     { path: "/carbooking-list", label: "Car Booking List", permission: "Car-Rental" },
  //     { path: "/car-deshboard", label: "Car Cardeshboard", permission: "Car-Rental" },
  //   ],
  // },
  { path: "/prop&loss", label: "Profit & Loss", permission: "prop&loss" },
  { path: "/invoice", label: "Invoice Bill", permission: "Invoice" },



  // { path: "/PaymentsManager", label: "Payment Manager", permission: "view_payments" },
  { path: "/paymentDetails", label: "Payment Manager", permission: "view_payments" },

  { path: "/StaffManagement", label: "Staff Management", permission: "StaffManagement" },
  { path: "/reports", label: "All Reports", permission: "reports" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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

  const handleLogout = async () => {
    try {
      await fetch("https://apitour.rajasthantouring.in/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      if (onClose) onClose();
      window.location.href = "/login"; // Simple redirect for sidebar context
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const handleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Check if user has access based on role, status, and permission
  const hasAccess = (item) => {
    if (!user || user.status !== "active") return false;
    const hasPermission = user.permissions.includes("all") || !item.permission || user.permissions.includes(item.permission);
    return hasPermission;
  };

  // Check if user has access to dropdown (at least one sub-item)
  const hasDropdownAccess = (item) => {
    if (!user || user.status !== "active") return false;
    const hasAnySubItemAccess = item.subItems.some((subItem) =>
      user.permissions.includes("all") || user.permissions.includes(subItem.permission)
    );
    return hasAnySubItemAccess;
  };

  // Check if a path is active
  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  if (loading) return null;

  const hasUserAccess = user && user.status === "active";

  return (
    <>
      {/* Desktop Sidebar */}
      {hasUserAccess && (
        <aside className="hidden lg:block fixed left-0 top-20 pb-22 scrollbar-hide h-full  w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl z-40 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map((item, index) => {
              if (!item.subItems && !hasAccess(item)) return null;
              if (item.subItems && !hasDropdownAccess(item)) return null;

              return item.subItems ? (
                <div key={index}>
                  <button
                    onClick={() => handleDropdown(item.label.toLowerCase())}
                    className={`w-full text-left text-white px-4 py-3 text-base font-medium flex justify-between items-center rounded-lg transition-colors duration-200 ${item.subItems.some((subItem) => isActive(subItem.path))
                      ? "bg-gradient-to-l from-blue-700 to-blue-500 text-blue-100"
                      : "hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                      }`}
                  >
                    {item.label}
                    <svg
                      className={`h-5 w-5 transition-transform duration-200 ${openDropdown === item.label.toLowerCase() ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.label.toLowerCase() ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="pl-6 py-2 space-y-1">
                      {item.subItems.map((subItem, subIndex) => {
                        if (!hasAccess(subItem)) return null;
                        return (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive(subItem.path)
                              ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100 font-semibold"
                              : "text-blue-200 hover:bg-gradient-to-r from-blue-700 to-blue-500/20 hover:text-blue-100"
                              }`}
                            onClick={handleLinkClick}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={index}
                  to={item.path}
                  className={`block px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg ${isActive(item.path)
                    ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100"
                    : "text-white hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                    }`}
                  onClick={handleLinkClick}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-gradient-to-r from-blue-900 to-blue-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-end">
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
            {hasUserAccess ? (
              navItems.map((item, index) => {
                if (!item.subItems && !hasAccess(item)) return null;
                if (item.subItems && !hasDropdownAccess(item)) return null;

                return item.subItems ? (
                  <div key={index} className="mx-2">
                    <button
                      onClick={() => handleDropdown(item.label.toLowerCase())}
                      className={`w-full text-left text-white px-4 py-3 text-base font-medium flex justify-between items-center rounded-lg transition-colors duration-200 ${item.subItems.some((subItem) => isActive(subItem.path))
                        ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100"
                        : "hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                        }`}
                    >
                      {item.label}
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${openDropdown === item.label.toLowerCase() ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.label.toLowerCase() ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="pl-4 py-2 space-y-1">
                        {item.subItems.map((subItem, subIndex) => {
                          if (!hasAccess(subItem)) return null;
                          return (
                            <Link
                              key={subIndex}
                              to={subItem.path}
                              className={`block px-4 py-2 text-sm transition-colors duration-200 ${isActive(subItem.path)
                                ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100 font-semibold"
                                : "text-blue-100 hover:text-white hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                                } rounded-lg`}
                              onClick={handleLinkClick}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={index}
                    to={item.path}
                    className={`block px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg mx-2 ${isActive(item.path)
                      ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100"
                      : "text-white hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                      }`}
                    onClick={handleLinkClick}
                  >
                    {item.label}
                  </Link>
                );
              })
            ) : null}

            {/* Mobile Profile/Login */}
            {!loading && (
              <div className="mx-2 mt-4 pt-4 border-t border-blue-500/30">
                {user ? (
                  <>
                    <button
                      onClick={() => handleDropdown("profile")}
                      className={`w-full text-left px-4 py-3 text-base font-medium flex justify-between items-center rounded-lg transition-colors duration-200 ${isActive("/profile")
                        ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100"
                        : "text-white hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {user.profilePhoto ? (
                          <img
                            src={`https://apitour.rajasthantouring.in${user.profilePhoto}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-contain border-2 border-white"
                          />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{user.name} ({user.role})</span>
                      </div>
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${openDropdown === "profile" ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === "profile" ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="pl-4 py-2 space-y-1">
                        <Link
                          to="/profile"
                          className={`block px-4 py-2 text-sm transition-colors duration-200 ${isActive("/profile")
                            ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100 font-semibold"
                            : "text-blue-100 hover:text-white hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                            } rounded-lg`}
                          onClick={handleLinkClick}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-100 hover:text-white hover:bg-gradient-to-r from-blue-700 to-blue-500/20 rounded-lg transition-colors duration-200"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={`block px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg mx-2 ${isActive("/login")
                      ? "bg-gradient-to-r from-blue-700 to-blue-500/80 text-blue-100"
                      : "text-white hover:text-blue-100 hover:bg-gradient-to-r from-blue-700 to-blue-500/20"
                      }`}
                    onClick={handleLinkClick}
                  >
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;