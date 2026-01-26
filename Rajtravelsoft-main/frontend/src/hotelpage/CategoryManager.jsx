import React, { useState, useEffect } from "react";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false); // <-- New state
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("https://apitour.rajasthantouring.in/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (editId) {
        const response = await fetch(
          `https://apitour.rajasthantouring.in/api/categories/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName.trim() }),
          }
        );

        if (response.ok) {
          setCategoryName("");
          setEditId(null);
          setShowForm(false); // <-- Hide form after submit
          fetchCategories();
        } else {
          setError("Failed to update category");
        }
      } else {
        const response = await fetch("https://apitour.rajasthantouring.in/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName.trim() }),
        });

        if (response.ok) {
          setCategoryName("");
          setShowForm(false);
          fetchCategories();
        } else {
          setError("Failed to add category");
        }
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this category?");
      if (!confirmDelete) return;

      const response = await fetch(
        `https://apitour.rajasthantouring.in/api/categories/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchCategories();
      } else {
        setError("Failed to delete category");
      }
    } catch (err) {
      setError("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setCategoryName(category.name);
    setEditId(category._id);
       setShowForm(true); // <-- Hide form after submit
  };
    const handleCancelEdit = () => {

    setShowForm(false); // <-- Hide form
  };

  return (
    <div className="space-y-4 w-full mx-auto py-4 px-2 sm:px-4 ">
      {loading && (
        <div
          className="text-center text-sm font-medium text-gray-600 animate-pulse bg-gray-100 py-2 rounded"
          aria-busy="true"
        >
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Loading...
        </div>
      )}

      {error && (
        <div className="text-center text-sm font-medium text-red-500 bg-red-50 py-2 rounded animate-fade-in">
          {error}
        </div>
      )}
      {!showForm && (
        <div className="text-right">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm"
          >
            Add Category
          </button>
        </div>
      )}


      {/* Add/Edit Category Form */}
      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-lg sm:text-xl flex justify-between font-bold text-gray-800 mb-2 sm:mb-4">
            {editId ? "Edit  Category" : "Add  Category"}  <button className="bg-blue-600 px-2 py-1 text-xs rounded-lg text-white cursor-pointer" onClick={handleCancelEdit}> Cancel</button>
          </h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2 items-start sm:items-end"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                 Category
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-50 text-sm"
                placeholder="Enter category name"
                required
                aria-label="Hotel Category"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-md disabled:opacity-50 w-full sm:w-auto text-sm"
              >
                {editId ? "Update" : "Add"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setCategoryName("");
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all duration-300 shadow-md w-full sm:w-auto text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {/* Manage Categories Table */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-500">
            Manage  Categories
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                  S.NO.
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                   CATEGORY
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr
                    key={category._id}
                    className="hover:bg-blue-50 transition-all duration-200"
                  >
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900 hidden sm:table-cell">
                      {index + 1}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-medium flex flex-col sm:flex-row gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm w-full sm:w-auto text-xs"
                      >
                        Edit
                      </button>

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-3 text-gray-500 text-xs"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager; 