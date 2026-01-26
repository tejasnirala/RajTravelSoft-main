"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"

export default function AdminDashboard() {
  const [users, setUsers] = useState({ regularUsers: [], otherRoles: [] })
  const [msg, setMsg] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [editingPassword, setEditingPassword] = useState(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState({})
  const [isAdminTokenPresent, setIsAdminTokenPresent] = useState(false)

  const allPermissions = [
    "manage_categories",
    "manage_locations",
    "view_hotels",
    "view_itinerary",
    "manage_vehicles",
    "manage_bookings",
    "view_payments",
    "manage_emails",
    "Structure",
    "all",
    "dashboard",
    "Invoice",
    "Customers",
    // "Car-Rental",
    "reports",
    "StaffManagement",
    "Operation-Sheet",
    "prop&loss",
    "transportsheet",
    "ItinerarySuggestion",
    "PaymentManager",
  ]







  useEffect(() => {
    async function checkAdminStatus() {
      const res = await fetch("https://apitour.rajasthantouring.in/api/admin/check-admin", {
        credentials: "include"
      });

      const data = await res.json();
      setIsAdminTokenPresent(data.isAdmin);
    }

    checkAdminStatus();
    fetchUsers();
  }, []);

  const filterUsers = (userList) => {
    return userList.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === "" || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }

  async function fetchUsers(status = "") {
    try {
      const res = await fetch(`https://apitour.rajasthantouring.in/api/admin/users${status ? `?status=${status}` : ""}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
        // setMsg("Users fetched successfully")
      } else {
        toast.error(data.message || "Error fetching users")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  async function updateUser(id, updates) {
    try {
      const res = await fetch(`https://apitour.rajasthantouring.in/api/admin/update-user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("User updated successfully")
        fetchUsers(statusFilter)
      } else {
        toast.error(data.message || "Error updating user")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  async function updatePassword(id) {
    if (!newPassword || newPassword.length < 6) {
      toast.info("Password must be at least 6 characters")
      return
    }

    try {
      const res = await fetch(`https://apitour.rajasthantouring.in/api/admin/update-password/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Password updated successfully")
        setEditingPassword(null)
        setNewPassword("")
        fetchUsers(statusFilter)
      } else {
        toast.error(data.message || "Error updating password")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  function togglePermission(user, perm) {
    const perms = user.permissions || []
    const updatedPermissions = perms.includes(perm) ? perms.filter((p) => p !== perm) : [...perms, perm]
    updateUser(user._id, { permissions: updatedPermissions })
  }

  function handleStatusFilter(e) {
    const status = e.target.value
    setStatusFilter(status)
    fetchUsers(status)
  }

  function toggleShowPassword(userId) {
    if (!isAdminTokenPresent) {
      toast.error("You are not authorized to view passwords.")
      return
    }

    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }


  useEffect(() => {
    fetchUsers()
  }, [])

  const renderUserTable = (userList, title) => (
    <div className="mb-8">
      <h3 className="text-base md:text-lg font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-xs md:text-sm">Name</th>
              <th className="border p-2 text-xs md:text-sm">Email</th>
              <th className="border p-2 text-xs md:text-sm">Role</th>
              <th className="border p-2 text-xs md:text-sm">Password</th>
              <th className="border p-2 text-xs md:text-sm">Permissions</th>
              <th className="border p-2 text-xs md:text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {filterUsers(userList).map((user) => (
              <tr key={user._id}>
                <td className="border p-2 text-xs md:text-sm">{user.name}</td>
                <td className="border p-2 text-xs md:text-sm break-all">{user.email}</td>
                <td className="border p-2">
                  <select
                    onChange={(e) => updateUser(user._id, { role: e.target.value })}
                    value={user.role}
                    className="p-1 border rounded text-xs md:text-sm w-full"
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="border p-2">
                  {editingPassword === user._id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="p-1 border rounded text-xs md:text-sm w-full"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => updatePassword(user._id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPassword(null)
                            setNewPassword("")
                          }}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm">
                          {showPassword[user._id] ? user.plainPassword || "******" : "******"}
                        </span>
                        {isAdminTokenPresent && (
                          <button
                            onClick={() => toggleShowPassword(user._id)}
                            className="text-blue-500 text-xs hover:underline"
                          >
                            {showPassword[user._id] ? "Hide" : "Show"}
                          </button>
                        )}

                      </div>
                      <button
                        onClick={() => setEditingPassword(user._id)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </td>
                <td className="border p-2">
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1 md:gap-2 max-w-xs">
                    {allPermissions.map((perm) => (
                      <label key={perm} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={user.permissions?.includes(perm) || false}
                          onChange={() => togglePermission(user, perm)}
                          className="scale-75 md:scale-100"
                        />
                        <span className="truncate">{perm.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="border p-2">
                  <select
                    onChange={(e) => updateUser(user._id, { status: e.target.value })}
                    value={user.status}
                    className="p-1 border rounded text-xs md:text-sm w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="w-full mx-auto mt-4 md:mt-8 p-4 md:p-6 border rounded-lg shadow">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center text-blue-500 underline my-4">
        Staff Management
      </h2>

      {msg && (
        <div className={`text-center p-2 mb-4 rounded ${msg.includes('Error') || msg.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {msg}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-auto">
            <label className="block font-medium mb-2">Search by Name or Email:</label>
            <input
              type="text"
              placeholder="Enter name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="block font-medium mb-2">Filter by Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full md:w-auto p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block font-medium mb-2">Filter by Status:</label>
            <select
              onChange={handleStatusFilter}
              value={statusFilter}
              className="w-full md:w-auto p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              setSearchTerm("")
              setRoleFilter("")
              setStatusFilter("")
              fetchUsers()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {renderUserTable(users.otherRoles, "Other Roles (Admin, Manager, Staff)")}
      {renderUserTable(users.regularUsers, "Regular Users")}
    </div>
  )
}