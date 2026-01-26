import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';


const ThemeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        link: "",
        isActive: true,
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [themes, setThemes] = useState([]);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [editId, setEditId] = useState(id || null); // Track the theme being edited
 const [warning, setWarning] = useState(""); // warning state   
    // Fetch single theme for editing when id is present in URL
    useEffect(() => {
        if (id) {
            const fetchTheme = async () => {
                try {
                    const res = await axios.get(`https://apitour.rajasthantouring.in/api/themes/${id}`, {
                        withCredentials: true,
                    });
                    setFormData({
                        name: res.data.name,
                        link: res.data.link || "",
                        isActive: res.data.isActive,
                    });
                    if (res.data.imageUrl) {
                        setImagePreview(`https://apitour.rajasthantouring.in${res.data.imageUrl}`);
                    }
                    setShowForm(true);
                    setEditId(id); // Set editId to the theme id from URL
                } catch (err) {
                    console.error(err);
                    if (err.response?.status === 401) {
                        navigate("/login");
                    } else {
                        setErrorMessage("Failed to fetch theme data");
                    }
                }
            };
            fetchTheme();
        }
    }, [id, navigate]);

    // Fetch all themes
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const res = await axios.get("https://apitour.rajasthantouring.in/api/themes", {
                    withCredentials: true,
                });
                setThemes(res.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    navigate("/login");
                } else {
                    setErrorMessage("Failed to fetch themes");
                }
            }
        };
        fetchThemes();
    }, [navigate, fetchTrigger]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            return () => URL.revokeObjectURL(previewUrl);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        const data = new FormData();
        data.append("name", formData.name);
        data.append("link", formData.link);
        data.append("isActive", formData.isActive);
        if (image) data.append("image", image);

        try {
            let response;
            if (editId) {
                // Update existing theme
                response = await axios.put(
                    `https://apitour.rajasthantouring.in/api/themes/${editId}`,
                    data,
                    {
                        withCredentials: true,
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
            } else {
                // Create new theme
                response = await axios.post(
                    "https://apitour.rajasthantouring.in/api/themes",
                    data,
                    {
                        withCredentials: true,
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
            }

            const themeData = response.data.theme || {
                name: formData.name,
                link: formData.link || "N/A",
                isActive: formData.isActive,
                imageUrl: response.data.theme?.imageUrl || imagePreview || "No image",
            };

            setSuccessMessage({
                name: themeData.name,
                link: themeData.link,
                isActive: themeData.isActive ? "Yes" : "No",
                imageUrl: themeData.imageUrl.startsWith("/uploads")
                    ? `https://apitour.rajasthantouring.in${themeData.imageUrl}`
                    : themeData.imageUrl,
            });

            // Reset form and states
            setShowForm(false);
            setFormData({ name: "", link: "", isActive: true });
            setImage(null);
            setImagePreview(null);
            setEditId(null);
            setFetchTrigger((prev) => prev + 1); // Refresh theme list

            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                navigate("/login");
            } else {
                setErrorMessage(err.response?.data?.message || "Failed to save theme");
            }
        }
    };

    const handleEdit = (theme) => {
        // Populate form with theme data for editing
        setFormData({
            name: theme.name,
            link: theme.link || "",
            isActive: theme.isActive,
        });
        setImage(null);
        setImagePreview(theme.imageUrl ? `https://apitour.rajasthantouring.in${theme.imageUrl}` : null);
        setEditId(theme._id); // Set the theme ID for editing
        setShowForm(true); // Show the form
        setErrorMessage(null);
        setSuccessMessage(null);
    };


    const handleDelete = async (id) => {
        // Show warning first
        setWarning({ message: "Are you sure you want to delete this hotel?", id });

        // Stop if user doesn't confirm via page UI (you can add Yes/No buttons)
    };


    const confirmDelete = async (themeId) => {
        setWarning(""); // remove warning
        try {
            await axios.delete(`https://apitour.rajasthantouring.in/api/themes/${themeId}`, {
                withCredentials: true,
            });
            setFetchTrigger((prev) => prev + 1); // Refresh theme list
            setSuccessMessage({ message: "Theme deleted successfully" });
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            // If the deleted theme was being edited, reset the form
            if (editId === themeId) {
                setFormData({ name: "", link: "", isActive: true });
                setImage(null);
                setImagePreview(null);
                setEditId(null);
                setShowForm(false);
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to delete theme");
        }
    };


    const toggleForm = () => {
        setShowForm(!showForm);
        setErrorMessage(null);
        setSuccessMessage(null);
        setEditId(null); // Clear editId when toggling form
        setFormData({ name: "", link: "", isActive: true });
        setImage(null);
        setImagePreview(null);
    };

    console.log("Rendering ThemeForm component", themes);


    return (
        <div className="w-full p-4  mx-auto sm:p-6 lg:p-8">

            {warning && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className=" bg-white text-blue-800 p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                        {/* Message */}
                        <p className="mb-4">Are you sure you want to delete this Theme?</p>

                        {/* Yes / No buttons */}
                        <div className="flex justify-center gap-4">
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                onClick={() => confirmDelete(warning.id)}
                            >
                                Yes
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                                onClick={() => setWarning(null)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Form */}
            {showForm && (
                <>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 ">
                        {editId ? "Edit Theme" : "Add Theme"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                placeholder="Enter theme name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Link</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter theme link (optional)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Active</label>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Image</label>
                            <input
                                type="file"
                                onChange={handleImageChange}
                                className="mt-1 w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept="image/*"
                            />
                        </div>
                        {imagePreview && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Image Preview</label>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="mt-2 w-full max-w-md h-auto rounded-md object-cover shadow-sm"
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                        >
                            {editId ? "Update" : "Create"}
                        </button>
                    </form>
                </>
            )}
            {/* Toggle Button */}
            {!successMessage && (
                <button
                    onClick={toggleForm}
                    className="mb-4 w-full mt-4 sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                >
                    {showForm ? "Cancel" : "Add Theme"}
                </button>
            )}


            {/* Theme List */}
            <div className="mb-8">

                <h2 className="text-2xl font-bold mb-4 text-gray-800">All Themes</h2>


                {themes.length === 0 ? (
                    <p className="text-gray-600">No themes available</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {themes.map((theme) => (
                            <div
                                key={theme._id}
                                className="bg-white p-4 flex flex-col sm:flex-row gap-4 rounded-md shadow-md hover:shadow-lg transition duration-200 relative"
                            >
                                {theme.imageUrl && (
                                    <img
                                        src={
                                            theme.imageUrl.startsWith("/uploads")
                                                ? `https://apitour.rajasthantouring.in${theme.imageUrl}`
                                                : theme.imageUrl
                                        }
                                        alt={theme.name}
                                        className="w-full sm:w-[150px] h-40 object-cover rounded-md"
                                    />
                                )}

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{theme.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            <strong>Link:</strong>{" "}
                                            {theme.link ? (
                                                <a
                                                    href={theme.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-words"
                                                >
                                                    {theme.link}
                                                </a>
                                            ) : (
                                                "N/A"
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Active:</strong> {theme.isActive ? "Yes" : "No"}
                                        </p>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(theme)}
                                            className="flex items-center justify-center bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
                                        >
                                            <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px" }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(theme._id)}
                                            className="flex items-center justify-center bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                                        >
                                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        ))}
                    </div>
                )}
            </div>


            {/* Success Message */}
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-2 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md shadow-md">
                    <h3 className="text-sm font-semibold">
                        {successMessage.message || `Theme ${editId ? "Updated" : "Added"} Successfully!`}
                    </h3>
                </div>
            )}


            {/* Error Message */}
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
                    <h3 className="text-lg font-semibold">Error</h3>
                    <p className="text-[10px]">{errorMessage}</p>
                </div>
            )}


        </div>
    );
};

export default ThemeForm;