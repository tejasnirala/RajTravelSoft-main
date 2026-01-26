// Modified Header.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const [softwares, setSoftwares] = useState([]);
  const location = useLocation();
  console.log(softwares);

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

  const fetchStructure = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/structure", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data) {
        setStructure(data);
      } else {
        setStructure(null);
      }
    } catch (err) {
      console.error("Error fetching structure:", err);
      setStructure(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructure();
  }, []);

  // Fetch all softwares
  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const response = await fetch(`https://apitour.rajasthantouring.in/api/toursoftware`);
      const data = await response.json();
      setSoftwares(data);
    } catch (err) {
      setError('Failed to fetch softwares');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("https://apitour.rajasthantouring.in/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const handleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleMouseEnter = (dropdown) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  // Check if a path is active
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gradient-to-b from-gray-900 to-gray-800  sticky top-0 z-50 backdrop-blur-sm">
      <div className="w-full mx-auto  relative"> {/* Offset for sidebar on lg */}
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 sm:h-18 lg:h-20">
          <div className="flex items-center flex-shrink-0">
            <Link
              to="/"
              className={`flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight transition-colors duration-200 
                }`}
            >
              {softwares[0]?.headerLogo ? (
                <img
                  src={`https://apitour.rajasthantouring.in${softwares[0].headerLogo}`}
                  alt="Tour Package Logo"
                  className="w-full h-16 object-contain"
                />
              ) : (
                <span>Travel Software</span>
              )}
            </Link>
          </div>

          {/* Right side: Desktop Profile/Login + Mobile Hamburger */}
          <div className="flex items-center space-x-4">
            {/* Desktop Profile/Login */}
            {!loading && (
              <div
                className="hidden lg:block relative"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                {user ? (
                  <>
                    <button
                      onClick={() => handleDropdown("profile")}
                      className={`text-white hover:text-blue-100 hover:bg-blue-500/20 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/profile") ? "bg-blue-500/80 text-blue-100" : ""
                        }`}
                    >
                      {user.profilePhoto ? (
                        <img
                          src={`/logo.png`}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-contain border-2 border-white"
                        />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{user.name} ({user.role})</span>
                      <svg
                        className={`h-4 w-4 transition-transform duration-200 ${openDropdown === "profile" ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDropdown === "profile" && (
                      <div
                        className="absolute top-full right-0 mt-2 w-56 bg-white shadow-xl rounded-xl py-2 border border-gray-100 z-20"
                        onMouseEnter={() => clearTimeout(timeoutRef.current)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <Link
                          to="/profile"
                          className={`block px-4 py-3 text-sm font-medium transition-colors duration-200 ${isActive("/profile")
                            ? "bg-blue-100 text-blue-900 font-semibold"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                            }`}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 font-medium transition-colors duration-200"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={`text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/login") ? "bg-blue-500/80 text-blue-100" : "hover:text-blue-100 hover:bg-blue-500/20"
                      }`}
                  >
                    Login
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleSidebar}
                className="text-white hover:text-blue-100 hover:bg-blue-500/20 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;