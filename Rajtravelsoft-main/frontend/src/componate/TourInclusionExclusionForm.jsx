"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const TourInclusionExclusionForm = () => {
    const [inclusions, setInclusions] = useState([]);
    const [exclusions, setExclusions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [cancellationAndRefundPolicy, setCancellationAndRefundPolicy] = useState([]);
    const [travelRequirements, setTravelRequirements] = useState([]);
    const [loading, setLoading] = useState(false);
    const BASE_URL = "https://apitour.rajasthantouring.in";

    const getArrayAndSetter = (type) => {
        switch (type) {
            case "inclusion":
                return { arr: inclusions, set: setInclusions };
            case "exclusion":
                return { arr: exclusions, set: setExclusions };
            case "term":
                return { arr: terms, set: setTerms };
            case "cancellation":
                return { arr: cancellationAndRefundPolicy, set: setCancellationAndRefundPolicy };
            case "travel":
                return { arr: travelRequirements, set: setTravelRequirements };
            default:
                return null;
        }
    };

    // Fetch single global document
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get("token") || Cookies.get("admin_token");
                const res = await axios.get(`${BASE_URL}/api/tour-inclusion-exclusion`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.data) {
                    setInclusions(
                        (res.data.data.inclusions || []).map((item) => ({
                            ...item,
                            preview: item.image ? `${BASE_URL}/${item.image}` : "",
                            imageFile: null,
                            isEditing: false,
                        }))
                    );
                    setExclusions(
                        (res.data.data.exclusions || []).map((item) => ({
                            ...item,
                            preview: item.image ? `${BASE_URL}/${item.image}` : "",
                            imageFile: null,
                            isEditing: false,
                        }))
                    );
                    setTerms(
                        (res.data.data.termsAndConditions || []).map((item) => ({
                            ...item,
                            preview: item.image ? `${BASE_URL}/${item.image}` : "",
                            imageFile: null,
                            isEditing: false,
                        }))
                    );
                    setCancellationAndRefundPolicy(
                        (res.data.data.cancellationAndRefundPolicy || []).map((item) => ({
                            ...item,
                            preview: item.image ? `${BASE_URL}/${item.image}` : "",
                            imageFile: null,
                            isEditing: false,
                        }))
                    );
                    setTravelRequirements(
                        (res.data.data.travelRequirements || []).map((item) => ({
                            ...item,
                            preview: item.image ? `${BASE_URL}/${item.image}` : "",
                            imageFile: null,
                            isEditing: false,
                        }))
                    );
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [BASE_URL]);

    // Add / Remove dynamically
    const handleAdd = (type) => {
        const newItem = {
            title: "",
            description: "",
            image: "",
            preview: "",
            imageFile: null,
            isEditing: true,
        };
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        set([...arr, newItem]);
    };

    const handleRemove = (type, index) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = arr.filter((_, i) => i !== index);
        set(newArr);
    };

    const handleChange = (type, index, field, value) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        newArr[index][field] = value;
        set(newArr);
    };

    const handleImageChange = (type, index, file) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        const item = newArr[index];
        if (item.preview && item.preview.startsWith("blob:")) {
            URL.revokeObjectURL(item.preview);
        }
        item.imageFile = file;
        item.preview = file ? URL.createObjectURL(file) : "";
        set(newArr);
    };

    const handleRemoveImage = (type, index) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        const item = newArr[index];
        if (item.preview && item.preview.startsWith("blob:")) {
            URL.revokeObjectURL(item.preview);
        }
        item.imageFile = null;
        item.image = "";
        item.preview = "";
        set(newArr);
    };

    const handleEdit = (type, index) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        const item = newArr[index];
        if (!item.isEditing) {
            item.original = {
                title: item.title,
                description: item.description,
                image: item.image,
                preview: item.preview,
            };
            item.isEditing = true;
        }
        set(newArr);
    };

    const handleSave = (type, index) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        const item = newArr[index];
        if (item.isEditing) {
            item.isEditing = false;
            if (item.original) {
                delete item.original;
            }
        }
        set(newArr);
    };

    const handleCancel = (type, index) => {
        const { arr, set } = getArrayAndSetter(type);
        if (!arr) return;
        const newArr = [...arr];
        const item = newArr[index];
        if (item.isEditing) {
            if (item.original) {
                item.title = item.original.title;
                item.description = item.original.description;
                item.image = item.original.image;
                item.imageFile = null;
                if (item.preview && item.preview.startsWith("blob:")) {
                    URL.revokeObjectURL(item.preview);
                }
                item.preview = item.original.preview;
                delete item.original;
            } else {
                newArr.splice(index, 1);
                set(newArr);
                return;
            }
            item.isEditing = false;
        }
        set(newArr);
    };

    // Submit single document
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = Cookies.get("token") || Cookies.get("admin_token");
            const formData = new FormData();

            const addToFormData = (prefix, arr) => {
                arr.forEach((item, index) => {
                    formData.append(`${prefix}title_${index}`, item.title || "");
                    formData.append(`${prefix}description_${index}`, item.description || "");
                    formData.append(`${prefix}image_path_${index}`, item.image || "");
                    if (item.imageFile) {
                        formData.append(`${prefix}image_${index}`, item.imageFile);
                    }
                });
            };

            addToFormData("inclusions_", inclusions);
            addToFormData("exclusions_", exclusions);
            addToFormData("termsAndConditions_", terms);
            addToFormData("cancellationAndRefundPolicy_", cancellationAndRefundPolicy);
            addToFormData("travelRequirements_", travelRequirements);

            await axios.post(`${BASE_URL}/api/tour-inclusion-exclusion`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Error saving data");
        }
        setLoading(false);
    };

    const renderSection = (items, type, title, fullWidth = false) => (
        <div className={`bg-gray-50 p-4 rounded-lg shadow-sm ${fullWidth ? "md:col-span-2" : ""}`}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
            {items.map((item, index) => (
                <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                    {item.isEditing ? (
                        <>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => handleChange(type, index, "title", e.target.value)}
                                    className="border border-gray-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder={`Title ${index + 1}`}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleChange(type, index, "description", e.target.value)}
                                    className="border border-gray-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder={`Description ${index + 1}`}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Image (optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(type, index, e.target.files?.[0] || null)}
                                    className="border border-gray-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                {item.preview && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img
                                            src={item.preview}
                                            alt={`${title} image ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(type, index)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSave(type, index)}
                                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCancel(type, index)}
                                    className="bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(type, index)}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {item.title && (
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
                            )}
                            {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                            )}
                            {item.preview && (
                                <div className="mb-3">
                                    <img
                                        src={item.preview}
                                        alt={`${title} image ${index + 1}`}
                                        className="w-40 h-40 object-cover rounded-lg border"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(type, index)}
                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(type, index)}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={() => handleAdd(type)}
                className="text-blue-600 hover:text-blue-800 font-medium transition"
            >
                + Add {title.split(" ")[0]}
            </button>
        </div>
    );

    return (
        <div className="w-full mx-auto p-6 bg-white border-t-4 border-black shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-blue-600 underline mb-6 text-center">
                Manage Tour Inclusions, Exclusions & Terms
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSection(inclusions, "inclusion", "Inclusions")}
                {renderSection(exclusions, "exclusion", "Exclusions")}
                {renderSection(terms, "term", "Terms & Conditions", true)}
                {renderSection(cancellationAndRefundPolicy, "cancellation", "Cancellation & Refund Policy", true)}
                {renderSection(travelRequirements, "travel", "Payment Policy", true)}
                {/* Submit Button */}
                <div className="md:col-span-2 text-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TourInclusionExclusionForm;