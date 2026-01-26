// NotAuthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotAuthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
      <Link to="/" className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
        Return to Home
      </Link>
    </div>
  );
};

export default NotAuthorized;