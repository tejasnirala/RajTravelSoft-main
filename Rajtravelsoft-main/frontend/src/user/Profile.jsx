"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User } from "lucide-react";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [photo, setPhoto] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch user data
    const fetchUser = async () => {
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.ok) {
                setUser(data.user);
                setName(data.user.name);
            } else {
                setUser(null);
                navigate("/login");
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setUser(null);
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // Auto-clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Auto-clear error message after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Calculate profile strength
    const calculateProfileStrength = () => {
        let strength = 0;
        if (user?.name) strength += 30;
        if (user?.email) strength += 30;
        if (user?.profilePhoto) strength += 29;
        if (user?.role) strength += 10;
        return strength;
    };

    // Handle profile update
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password }),
                credentials: "include",
            });
            const data = await response.json();
            if (data.ok) {
                setUser(data.user);
                setSuccess("Profile updated successfully");
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Server error");
        }
    };

    // Handle photo upload
    const handlePhotoUpload = async () => {
        if (!photo) {
            setError("Please select a photo");
            return;
        }
        const formData = new FormData();
        formData.append("photo", photo);
        try {
            const response = await fetch("https://apitour.rajasthantouring.in/api/auth/profile/photo", {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            const data = await response.json();
            if (data.ok) {
                setUser({ ...user, profilePhoto: data.profilePhoto });
                setSuccess("Photo uploaded successfully");
                setPhoto(null);
                fileInputRef.current.value = null;
            } else {
                setError(data.message || "Failed to upload photo");
            }
        } catch (err) {
            console.error("Photo upload error:", err);
            setError("Server error: Unable to upload photo");
        }
    };

    // Trigger file input click
    const handleAddPhotoClick = () => {
        fileInputRef.current.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center text-gray-800 dark:text-gray-200 text-xl font-medium">
                    Loading Profile...
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Redirect handled in useEffect
    }

    const profileStrength = calculateProfileStrength();
    const strengthLabel = profileStrength >= 80 ? "Strong" : profileStrength >= 50 ? "Moderate" : "Weak";
    const strengthColor = profileStrength >= 80 ? "bg-blue-500" : profileStrength >= 50 ? "bg-yellow-500" : "bg-red-500";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center mb-6">
                    <User className="h-7 w-7 text-blue-600 mr-2" />
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        Your Profile
                    </h2>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-4 rounded-r-md">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-3 mb-4 rounded-r-md">
                        {success}
                    </div>
                )}

                {/* Profile Card */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-24 h-24 mb-4">
                        <img
                            src={
                                photo
                                    ? URL.createObjectURL(photo)
                                    : user?.profilePhoto
                                    ? user.profilePhoto.startsWith("http")
                                        ? user.profilePhoto
                                        : `https://apitour.rajasthantouring.in${user.profilePhoto}`
                                    : "https://via.placeholder.com/150"
                            }
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                            onClick={handleAddPhotoClick}
                            className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full"
                            aria-label="Add photo"
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            ref={fileInputRef}
                            onChange={(e) => setPhoto(e.target.files[0])}
                            className="hidden"
                        />
                    </div>
                    {photo && (
                        <button
                            onClick={handlePhotoUpload}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium"
                        >
                            Upload Photo
                        </button>
                    )}
                    <div className="w-full mt-4">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
                            Profile Strength: <span className="font-semibold">{strengthLabel}</span> ({profileStrength}%)
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                            <div
                                className={`${strengthColor} h-3 rounded-full`}
                                style={{ width: `${profileStrength}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                            Role
                        </label>
                        <input
                            type="text"
                            value={user.role}
                            disabled
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-100"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium"
                    >
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;