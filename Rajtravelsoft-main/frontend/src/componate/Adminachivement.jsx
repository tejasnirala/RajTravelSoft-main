import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminAchievement() {
  const [packages, setPackages] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState([""]);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalName, setOriginalName] = useState("");
  const [originalDescription, setOriginalDescription] = useState([""]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Fetch the single package
  const fetchPackage = async () => {
    try {
      const res = await axios.get("https://apitour.rajasthantouring.in/api/achivement");
      const data = res.data;
      setPackages(data);
      console.log(data);

      if (data) {
        setName(data.name || "");
        setDescription(Array.isArray(data.description) ? data.description : (data.description ? JSON.parse(data.description) : [""]));
        setExistingImages(data.achievements || []);
        setIsEditing(false);
      } else {
        setIsEditing(false); // Will show create button
      }
    } catch (error) {
      console.error("Error fetching package:", error);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchPackage();
  }, []);

  const handleEdit = () => {
    setOriginalName(name);
    setOriginalDescription([...description]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(originalName);
    setDescription([...originalDescription]);
    setImages([]);
    setPreviewUrls([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setIsEditing(false);
  };

  // Add Description Field
  const addDescriptionField = () => {
    setDescription([...description, ""]);
  };

  // Remove Description Field
  const removeDescriptionField = (index) => {
    const newDesc = description.filter((_, i) => i !== index);
    setDescription(newDesc.length > 0 ? newDesc : [""]);
  };

  // Update Description Field
  const updateDescriptionField = (index, value) => {
    const newDesc = [...description];
    newDesc[index] = value;
    setDescription(newDesc);
  };

  // Handle File Upload with Preview
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setImages((prev) => [...prev, ...selectedFiles]);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // Remove New Image
  const handleRemoveNewImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    const removedUrl = previewUrls[index];
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newPreviews);

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }
  };

  // Delete an existing image (only in edit mode)
  const handleDeleteImage = async (imageId) => {
    try {
      await axios.delete(`https://apitour.rajasthantouring.in/api/achivement/image/${imageId}`);
      // Just update local state, no full reload to avoid data loss
      setExistingImages(existingImages.filter((img) => img._id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image");
    }
  };

  // Save Package (Update or create)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", JSON.stringify(description.filter((d) => d.trim() !== "")));

    for (let i = 0; i < images.length; i++) {
      formData.append("achievements", images[i]);
    }

    try {
      await axios.post("https://apitour.rajasthantouring.in/api/achivement", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset new images and previews
      setImages([]);
      setPreviewUrls([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      await fetchPackage(); // Reload after full save
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete Entire Package
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete the package?")) {
      try {
        await axios.delete("https://apitour.rajasthantouring.in/api/achivement");
        await fetchPackage();
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Error deleting package");
      }
    }
  };

  if (isEditing) {
    return (
      <div className="md:p-6 w-full mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Company - Achievements</h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4 border p-4 rounded shadow mb-8">
          <h2 className="text-lg font-semibold">{packages ? "Edit" : "Create"} Achievements</h2>

          <input
            type="text"
            placeholder="Package Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
            required
          />

          <div>
            <label className="block font-semibold">Descriptions:</label>
            {description?.map((desc, i) => (
              <div key={i} className="mt-1 space-y-1 flex gap-2">
                <textarea
                  value={desc}
                  onChange={(e) => updateDescriptionField(i, e.target.value)}
                  className="border p-2 w-full h-20 resize-vertical flex-1"
                  placeholder={`Description ${i + 1}`}
                  required
                />
                {description.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDescriptionField(i)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm w-min self-start"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDescriptionField} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded">
              + Add Description
            </button>
          </div>

          <div>
            <label className="block font-semibold">Achievements Images (Up to 10):</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 w-full"
            />
            {(existingImages.length > 0 || previewUrls.length > 0) && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                {/* Existing Images from DB - with delete in edit mode */}
                {existingImages?.map((img, i) => (
                  <div key={img._id} className="relative">
                    <img
                      src={`https://apitour.rajasthantouring.in${img.imageUrl}`}
                      alt={`Achievement ${i + 1}`}
                      className="w-full h-24 object-cover rounded border"
                      
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img._id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
                {/* New Image Previews - with remove in edit mode */}
                {previewUrls?.map((url, i) => (
                  <div key={`preview-${i}`} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex-1"
            >
              {loading ? "Saving..." : "Save "}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            {packages && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="md:p-6 w-full mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Company - Achievements</h1>

      {packages ? (
        <div className="w-full space-y-4 border p-4 rounded shadow mb-8">
          <h2 className="text-lg font-semibold">Achievements</h2>

          <div className="mb-4">
            <h3 className="font-semibold">Name:</h3>
            <p className="text-gray-700">{name}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold">Descriptions:</h3>
            {description.map((desc, i) => (
              <p key={i} className="mt-2 text-gray-700">{desc}</p>
            ))}
          </div>

          <div className="mb-4">
            <h3 className="font-semibold">Achievements Images:</h3>
            {existingImages.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                {existingImages.map((img, i) => (
                  <div key={img._id} className="relative">
                    <img
                      src={`https://apitour.rajasthantouring.in${img.imageUrl}`}
                      alt={`Achievement ${i + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    
                    />
                    {/* No delete button in view mode */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images added yet.</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No achievements found.
          <br />
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Achievements
          </button>
        </div>
      )}
    </div>
  );
}