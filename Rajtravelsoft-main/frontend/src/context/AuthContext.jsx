import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

// Direct localhost base URL
const API = axios.create({
    baseURL: "https://apitour.rajasthantouring.in", // yahan apna backend URL
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
      const location = useLocation(); // ✅ yahan add karein


    const fetchUser = async () => {
        try {
            const res = await axios.get("https://apitour.rajasthantouring.in/api/auth/me", {
                withCredentials: true,
            });
            console.log(res);

            if (res.data) setUser(res.data.user);
        } catch (err) {
            console.log(err,"sdtat");

            console.error("Failed to fetch user:", err);
            setUser(null);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [location]);

    return (
        <AuthContext.Provider value={{ user, setUser, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
