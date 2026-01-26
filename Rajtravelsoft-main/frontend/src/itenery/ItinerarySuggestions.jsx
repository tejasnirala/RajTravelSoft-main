import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://apitour.rajasthantouring.in/api/suggestions";

export default function Suggestions() {
    const [suggestions, setSuggestions] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false); // ← Yeh naya state

    // Fetch suggestions
    const fetchSuggestions = async () => {
        try {
            const res = await axios.get(API);
            setSuggestions(res.data.data?.suggestions || []);
        } catch (err) {
            console.error("Failed to load suggestions", err);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    // Show form for add new
    const showAddForm = () => {
        setIsFormVisible(true);
        setEditIndex(null);
        setTitle("");
        setDescription("");
    };

    // Hide form
    const hideForm = () => {
        setIsFormVisible(false);
        setEditIndex(null);
        setTitle("");
        setDescription("");
    };

    // Submit (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        try {
            if (editIndex !== null) {
                await axios.put(`${API}/update/${editIndex}`, { title, description });
            } else {
                await axios.post(`${API}/add`, { title, description });
            }
            hideForm(); // Form hide kar do success ke baad
            fetchSuggestions();
        } catch (err) {
            alert("Error saving suggestion. Please try again.");
        }
    };

    // Edit
    const handleEdit = (index) => {
        const item = suggestions[index];
        setTitle(item.title);
        setDescription(item.description);
        setEditIndex(index);
        setIsFormVisible(true); // Form dikhao edit ke liye
    };

    // Delete
    const handleDelete = async (index) => {
        if (!window.confirm("Delete this suggestion?")) return;
        try {
            await axios.delete(`${API}/delete/${index}`);
            fetchSuggestions();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header + Add Button */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
                        AI Suggestions Manager
                    </h2>

                    {!isFormVisible && (
                        <button
                            onClick={showAddForm}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition transform hover:scale-105"
                        >
                            + Add New Suggestion
                        </button>
                    )}
                </div>

                {/* Form - Sirf tab dikhe jab isFormVisible true ho */}
                {isFormVisible && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-xl font-bold text-gray-800 mb-5">
                            {editIndex !== null ? "Edit Suggestion" : "Add New Suggestion"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <input
                                type="text"
                                placeholder="Suggestion Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                                autoFocus
                            />

                            <textarea
                                rows="4"
                                placeholder="Describe what the AI should do..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                                required
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
                                >
                                    {editIndex !== null ? "Update" : "Save"} Suggestion
                                </button>

                                <button
                                    type="button"
                                    onClick={hideForm}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Suggestions List */}
                {/* Suggestions List - Fixed Buttons */}
                <div className="space-y-6">
                    {suggestions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl shadow">
                            <p className="text-gray-500 text-lg">No suggestions yet.</p>
                            <p className="text-gray-400 mt-2">
                                Click the button above to add your first suggestion!
                            </p>
                        </div>
                    ) : (
                        suggestions.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                                    {/* Content */}
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-gray-600 mt-3 leading-relaxed">{item.description}</p>
                                    </div>

                                    {/* Buttons - Ab hamesha compact rahenge */}
                                    <div className="flex gap-3 shrink-0">
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full shadow-md transition transform hover:scale-105"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-md transition transform hover:scale-105"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}