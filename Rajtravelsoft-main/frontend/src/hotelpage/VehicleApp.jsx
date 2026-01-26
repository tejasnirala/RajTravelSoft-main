"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaCar, FaPlus, FaEdit, FaTrash, FaTimes, FaExclamationTriangle } from "react-icons/fa";

const VehicleManager = () => {
  const [form, setForm] = useState({
    model: "",
    capacity: "",
    type: "",
    image: null,
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://apitour.rajasthantouring.in/api/vehicles");
      setVehicles(res.data);
    } catch (err) {
      setError("Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });
      setPreviewImage(file ? URL.createObjectURL(file) : (editingVehicleId && currentImage ? `https://apitour.rajasthantouring.in${currentImage}` : null));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.model.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key !== "image" || form[key]) {
          formData.append(key, form[key]);
        }
      });

      if (editingVehicleId && form.image === null && currentImage) {
        formData.append("image", currentImage);
      }

      if (editingVehicleId) {
        await axios.put(`https://apitour.rajasthantouring.in/api/vehicles/${editingVehicleId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("https://apitour.rajasthantouring.in/api/vehicles", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setShowForm(false);

      setForm({
        model: "",
        capacity: "",
        type: "",
        image: null,
      });
      setPreviewImage(null);
      setCurrentImage(null);
      setEditingVehicleId(null);
      fetchVehicles();
    } catch (err) {
      setError(editingVehicleId ? "Failed to update vehicle" : "Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setForm({
      model: vehicle.model || "",
      capacity: vehicle.capacity || "",
      type: vehicle.type || "",
      image: null,
    });
    setCurrentImage(vehicle.image || null);
    setShowForm(true);
    setPreviewImage(vehicle.image ? `https://apitour.rajasthantouring.in${vehicle.image}` : null);
    setEditingVehicleId(vehicle._id);
  };

  const handleCancelEdit = () => {
    setForm({
      model: "",
      capacity: "",
      type: "",
      image: null,
    });
    setCurrentImage(null);
    setShowForm(false);
    setPreviewImage(null);
    setEditingVehicleId(null);
  };

  const handleDelete = (id) => {
    setWarning({ message: "Are you sure you want to delete this vehicle?", id });
  };

  const confirmDelete = async (id) => {
    setWarning(null);
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`https://apitour.rajasthantouring.in/api/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      setError("Failed to delete vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full mx-auto py-4 px-2 sm:px-4">
      {loading && (
        <div className="text-center text-sm font-medium text-gray-600 animate-pulse bg-gray-100 py-2 rounded shadow-sm">
          <svg
            className="animate-spin h-4 w-4 mx-auto text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8a7.962 7.962 0 014-1.09V12c0 4.411-3.589 8-8 8-1.323 0-2.59-.343-3.709-.991z"
            />
          </svg>
          Loading...
        </div>
      )}

      {error && (
        <div className="text-center text-sm font-medium text-red-500 bg-red-50 py-2 rounded shadow-sm border border-red-200 animate-fade-in">
          {error}
        </div>
      )}

      {warning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-2">
          <div className="bg-white text-yellow-800 p-4 rounded-lg shadow-lg max-w-sm w-full text-center border border-yellow-200">
            <FaExclamationTriangle className="mx-auto mb-2 text-2xl text-yellow-500" />
            <p className="mb-4 text-sm font-medium">{warning.message}</p>
            <div className="flex justify-center gap-2">
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-300 shadow-sm flex items-center gap-1 text-sm"
                onClick={() => confirmDelete(warning.id)}
              >
                <FaTrash className="text-xs" />
                Yes
              </button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-all duration-300 shadow-sm flex items-center gap-1 text-sm"
                onClick={() => setWarning(null)}
              >
                <FaTimes className="text-xs" />
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="text-right">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-sm text-xs font-medium"
          >
            <FaPlus />
            Add Vehicle
          </button>
        </div>
      )}

      {/* Vehicle Form */}
      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start">
            <FaCar className="mr-1 text-xl text-blue-500" />
            {editingVehicleId ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "model", label: "Model", type: "text", placeholder: "e.g., Corolla", icon: null },
              { name: "type", label: "Type", type: "text", placeholder: "e.g., Sedan", icon: null },
              { name: "capacity", label: "Capacity", type: "number", placeholder: "e.g., 5", icon: null },
            ].map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  {field.icon && <field.icon className="text-gray-400 text-xs" />}
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.name === "model"}
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 text-sm placeholder-gray-500"
                  aria-label={field.label}
                />
              </div>
            ))}
            <div className="md:col-span-2 flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1">Vehicle Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                aria-label="Vehicle Image"
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="mt-2 h-16 w-16 rounded-lg object-cover border border-gray-200 shadow-sm mx-auto sm:mx-0"
                />
              )}
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {editingVehicleId ? "Update Vehicle" : "Add Vehicle"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 shadow-sm font-medium text-sm"
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Vehicle List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center">
            <FaCar className="mr-1 text-xl" />
            Manage Vehicles
          </h2>
        </div>
        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <FaCar className="mx-auto mb-2 text-4xl text-gray-300" />
            <p className="text-gray-500 text-sm font-medium">No vehicles added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Capacity
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      {v.image ? (
                        <img
                          src={`https://apitour.rajasthantouring.in${v.image}`}
                          alt={v.model}
                          className="h-8 w-8 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {v.model || "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900 hidden sm:table-cell">
                      {v.type || "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900 hidden md:table-cell">
                      {v.capacity || "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex flex-col sm:flex-row gap-1">
                        <button
                          onClick={() => handleEdit(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm text-xs"
                        >
                          <FaEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-sm text-xs"
                        >
                          <FaTrash className="text-xs" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManager;