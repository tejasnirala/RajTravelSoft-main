import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ permission, roles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Added useNavigate

  useEffect(() => {
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
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (user.status !== "active") {
        navigate("/not-authorized", { replace: true });
      } else if (roles.length > 0 && !roles.includes(user.role)) {
        navigate("/not-authorized", { replace: true });
      } else if (
        permission &&
        !user.permissions.includes("all") &&
        !user.permissions.includes(permission)
      ) {
        navigate("/not-authorized", { replace: true });
      }
    }
  }, [loading, user, roles, permission, navigate]);

  if (loading) return <div>Loading...</div>;

  return <Outlet />;
};

export default ProtectedRoute;