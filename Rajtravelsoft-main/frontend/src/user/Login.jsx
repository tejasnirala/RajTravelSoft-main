"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { User, Shield, UserPlus, Mail, Lock, Eye, EyeOff, Key, Check } from "lucide-react"

export default function EnhancedLogin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode = searchParams.get("mode") || "login"
  const initialEmailParam = searchParams.get("email")
  const initialEmail = initialMode === "forgot-password" && initialEmailParam
    ? decodeURIComponent(initialEmailParam)
    : ""
  const initialStepStr = searchParams.get("step") || "0"
  const initialStepNum = parseInt(initialStepStr)
  const initialForgotStep = (initialMode === "forgot-password" && !isNaN(initialStepNum) && initialStepNum >= 0 && initialStepNum <= 2)
    ? initialStepNum
    : 0
  const initialAdminStepStr = searchParams.get("adminStep") || "0"
  const initialAdminStepNum = parseInt(initialAdminStepStr)
  const initialAdminStep = (initialMode === "admin" && !isNaN(initialAdminStepNum) && initialAdminStepNum >= 0 && initialAdminStepNum <= 1)
    ? initialAdminStepNum
    : 0
  const [mode, setMode] = useState(initialMode)
  const [forgotStep, setForgotStep] = useState(initialForgotStep)
  const [adminStep, setAdminStep] = useState(initialAdminStep)
  const [form, setForm] = useState({ name: "", email: initialEmail, password: "", otp: "", newPassword: "" })
  const [msg, setMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccessNavigating, setIsSuccessNavigating] = useState(false)  // 👈 New: Flag to prevent conflicts during navigation
  const navigate = useNavigate()

  const BASE_URL = "https://apitour.rajasthantouring.in"

  // Sync URL params to state (runs when searchParams change, e.g., browser back/forward)
  useEffect(() => {
    const paramMode = searchParams.get("mode") || "login"
    if (paramMode !== mode) {
      setMode(paramMode)
    }
    if (paramMode === "forgot-password") {
      const paramStepStr = searchParams.get("step") || "0"
      const paramStep = parseInt(paramStepStr)
      if (!isNaN(paramStep) && paramStep !== forgotStep) {
        setForgotStep(paramStep)
      }
      // Sync email if present and form.email is empty (e.g., if somehow cleared)
      const paramEmail = searchParams.get("email")
      if (paramEmail && form.email === "") {
        setForm(prev => ({ ...prev, email: decodeURIComponent(paramEmail) }))
      }
    } else if (paramMode === "admin") {
      const paramAdminStepStr = searchParams.get("adminStep") || "0"
      const paramAdminStep = parseInt(paramAdminStepStr)
      if (!isNaN(paramAdminStep) && paramAdminStep !== adminStep) {
        setAdminStep(paramAdminStep)
      }
      // Sync email if present and form.email is empty
      const paramEmail = searchParams.get("email")
      if (paramEmail && form.email === "") {
        setForm(prev => ({ ...prev, email: decodeURIComponent(paramEmail) }))
      }
    } else {
      if (forgotStep !== 0) {
        setForgotStep(0)
      }
      if (adminStep !== 0) {
        setAdminStep(0)
      }
    }
  }, [searchParams])

  // Sync state to URL params (runs when mode or steps change)
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString())
    let shouldUpdate = false

    if (newParams.get("mode") !== mode) {
      newParams.set("mode", mode)
      shouldUpdate = true
    }

    if (mode === "forgot-password") {
      if (newParams.get("step") !== forgotStep.toString()) {
        newParams.set("step", forgotStep.toString())
        shouldUpdate = true
      }
      // Sync email
      if (form.email) {
        const encodedEmail = encodeURIComponent(form.email)
        if (newParams.get("email") !== encodedEmail) {
          newParams.set("email", encodedEmail)
          shouldUpdate = true
        }
      } else {
        if (newParams.has("email")) {
          newParams.delete("email")
          shouldUpdate = true
        }
      }
    } else if (mode === "admin") {
      if (newParams.get("adminStep") !== adminStep.toString()) {
        newParams.set("adminStep", adminStep.toString())
        shouldUpdate = true
      }
      // Sync email
      if (form.email) {
        const encodedEmail = encodeURIComponent(form.email)
        if (newParams.get("email") !== encodedEmail) {
          newParams.set("email", encodedEmail)
          shouldUpdate = true
        }
      } else {
        if (newParams.has("email")) {
          newParams.delete("email")
          shouldUpdate = true
        }
      }
    } else {
      if (newParams.has("step")) {
        newParams.delete("step")
        shouldUpdate = true
      }
      if (newParams.has("adminStep")) {
        newParams.delete("adminStep")
        shouldUpdate = true
      }
      if (newParams.has("email")) {
        newParams.delete("email")
        shouldUpdate = true
      }
    }

    if (shouldUpdate) {
      setSearchParams(newParams)
    }
  }, [mode, forgotStep, adminStep, form.email, searchParams, setSearchParams])

  // ✅ agar already login hai to / ya /dashboard bhej do (Skip during success navigation)
  useEffect(() => {
    if (isSuccessNavigating) return;  // 👈 Prevent auth check during manual navigation

    const checkAuth = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/me`, {
          withCredentials: true,
        })
        if (res.data.ok) {
          console.log("Auth check: User role", res.data.user.role) // Debug log
          if (res.data.user.role === "admin") {
            console.log("Redirecting to /dashboard") // Debug
            navigate("/dashboard")
          } else {
            console.log("Redirecting to /") // Debug
            navigate("/")
          }
        }
      } catch (err) {
        console.log("Not logged in", err.response?.data) // Debug
      }
    }
    checkAuth()
  }, [navigate, isSuccessNavigating])  // 👈 Added flag to dep

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Clear message when user starts typing
    if (msg) setMsg("")
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Handle Admin Login steps
    if (mode === "admin") {
      setIsLoading(true)
      setMsg("")

      try {
        let url, body;
        if (adminStep === 0) {
          // Send OTP (requires email & password)
          if (!form.email || !form.password) {
            setMsg("Email and password are required")
            setIsLoading(false)
            return
          }

          url = `${BASE_URL}/api/auth/admin/login`
          body = { email: form.email, password: form.password }
        } else {
          // Verify OTP
          if (!form.otp) {
            setMsg("OTP is required")
            setIsLoading(false)
            return
          }
          url = `${BASE_URL}/api/auth/admin/verify-otp`
          body = { email: form.email, otp: form.otp }
        }

        const res = await axios.post(url, body, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,  // 👈 Added for cookies
        })

        if (res.status === 200 && res.data.ok) {
          if (adminStep === 0) {

            if (res.data.superAdmin) {
              setMsg("Super Admin logged in!")
              setIsSuccessNavigating(true)
              navigate("/dashboard", { replace: true })
              return
            }
            setMsg("OTP sent to your email! Check your inbox.")
            setAdminStep(1)
          } else {
            setMsg("Admin login successful!")
            console.log("Admin login success - navigating to dashboard") // Debug log
            setIsSuccessNavigating(true);  // 👈 Set flag to block auth check
            // Navigate FIRST (immediate)
            navigate("/dashboard", { replace: true });  // 👈 Use replace to avoid history push
            // Then reset state (async, won't block nav)
            setTimeout(() => {  // 👈 Small delay to ensure nav happens
              setMode("login")
              setAdminStep(0)
              setForm({ name: "", email: form.email, password: "", otp: "", newPassword: "" })
              setIsSuccessNavigating(false);  // 👈 Reset flag
            }, 100);
          }
        }
      } catch (err) {
        console.error("Admin login error:", err) // Debug
        setMsg(err.response?.data?.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Handle Forgot Password steps
    if (mode === "forgot-password") {
      setIsLoading(true)
      setMsg("")

      try {
        let url, body;
        if (forgotStep === 0) {
          // Send OTP
          if (!form.email) {
            setMsg("Email is required")
            setIsLoading(false)
            return
          }
          url = `${BASE_URL}/api/auth/forgot-password/send-otp`
          body = { email: form.email }
        } else if (forgotStep === 2) {
          // Reset Password
          if (!form.otp || !form.newPassword) {
            setMsg("OTP and new password are required")
            setIsLoading(false)
            return
          }
          if (form.newPassword.length < 6) {
            setMsg("Password must be at least 6 characters")
            setIsLoading(false)
            return
          }
          url = `${BASE_URL}/api/auth/forgot-password/reset`
          body = { email: form.email, otp: form.otp, newPassword: form.newPassword }
        } else {
          // For step 1 (OTP), just advance if OTP entered, but submit will be handled on step 2
          if (!form.otp) {
            setMsg("OTP is required")
            setIsLoading(false)
            return
          }
          setForgotStep(2)
          setIsLoading(false)
          return
        }

        const res = await axios.post(url, body, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,  // 👈 Added for consistency (though not strictly needed for forgot-password)
        })

        if (res.status === 200 && res.data.ok) {
          if (forgotStep === 0) {
            setMsg("OTP sent to your email! Check your inbox.")
            setForgotStep(1)
          } else {
            setMsg("Password reset successful! You can now login.")
            setTimeout(() => {
              setMode("login")
              setForgotStep(0)
              setForm({ name: "", email: form.email, password: "", otp: "", newPassword: "" })
            }, 2000)
          }
        }
      } catch (err) {
        console.error(err)
        setMsg(err.response?.data?.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Existing login/register logic
    if (!form.email || !form.password) {
      setMsg("Email and password are required")
      return
    }
    if (mode === "register" && !form.name) {
      setMsg("Name is required for registration")
      return
    }

    setIsLoading(true)
    setMsg("")

    try {
      const url =
        mode === "register"
          ? `${BASE_URL}/api/auth/register`
          : `${BASE_URL}/api/auth/login`

      const res = await axios.post(url, form, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })

      if (res.status === 200) {
        if (mode === "register") {
          setMsg("Registration successful! Please login")
          setMode("login")
          setForm({ name: "", email: form.email, password: "" })
        } else {
          setMsg("Login successful!")
          navigate("/")
        }
      }
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back to login from forgot
  const handleBackToLogin = () => {
    setMode("login")
    setForgotStep(0)
    setAdminStep(0)
    setForm({ name: "", email: "", password: "", otp: "", newPassword: "" })
    setMsg("")
  }

  const getModeConfig = () => {
    if (mode === "admin") {
      return {
        title: "Admin Access",
        description: `Step ${adminStep + 1}/2: ${adminStep === 0 ? "Enter credentials to receive OTP" : "Enter the 6-digit OTP"}`,
        icon: Shield,
        buttonText: adminStep === 0 ? "Send OTP" : "Verify & Login",
        color: "bg-blue-500 hover:bg-blue-600 text-white",
      }
    }
    if (mode === "forgot-password") {
      return {
        title: "Reset Password",
        description: `Step ${forgotStep + 1}/3: ${forgotStep === 0 ? "Enter your email to receive OTP" : forgotStep === 1 ? "Enter the 6-digit OTP" : "Enter your new password"}`,
        icon: Key,
        buttonText: forgotStep === 0 ? "Send OTP" : forgotStep === 1 ? "Verify OTP" : "Reset Password",
        color: "bg-yellow-500 hover:bg-yellow-600 text-white",
      }
    }
    switch (mode) {
      case "register":
        return {
          title: "Create Account",
          description: "Join us today and get started",
          icon: UserPlus,
          buttonText: "Create Account",
          color: "bg-blue-500 hover:bg-blue-700 text-white",
        }
      default:
        return {
          title: "Welcome Back",
          description: "Sign in to your account",
          icon: User,
          buttonText: "Sign In",
          color: "bg-blue-500 hover:bg-blue-700 text-white",
        }
    }
  }

  const config = getModeConfig()
  const IconComponent = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mode Toggle - Hide for forgot-password and admin */}
        {(mode !== "forgot-password" && mode !== "admin") && (
          <div className="flex justify-center mb-8">
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setMode("login")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "login"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                <User className="w-4 h-4" />
                Login
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "register"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                Register
              </button>
              <button
                onClick={() => setMode("admin")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "admin"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4 pb-8 p-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{config.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{config.description}</p>
            </div>
          </div>

          <div className="space-y-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-900 dark:text-white">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                    required
                  />
                </div>
              )}

              {/* Email Field - Always shown except for forgot/admin step 1 */}
              {((mode !== "forgot-password" && mode !== "admin") || (mode === "forgot-password" && forgotStep === 0) || (mode === "admin" && adminStep === 0)) && (
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-white">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full h-12 pl-10 pr-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field - Shown for non-forgot/admin-step1, and for admin-step0 */}
              {((mode !== "forgot-password" && mode !== "admin") || (mode === "admin" && adminStep === 0)) && (
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full h-12 pl-10 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin OTP Field */}
              {mode === "admin" && adminStep === 1 && (
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-900 dark:text-white">
                    OTP (sent to {form.email})
                  </label>
                  <div className="relative">
                    <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      value={form.otp}
                      onChange={handleChange}
                      placeholder="Enter 6-digit OTP"
                      className="w-full h-12 pl-10 pr-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Forgot Password Fields */}
              {mode === "forgot-password" && (
                <>
                  {forgotStep === 1 && (
                    <div className="space-y-2">
                      <label htmlFor="otp" className="block text-sm font-medium text-slate-900 dark:text-white">
                        OTP (sent to {form.email})
                      </label>
                      <div className="relative">
                        <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          maxLength={6}
                          value={form.otp}
                          onChange={handleChange}
                          placeholder="Enter 6-digit OTP"
                          className="w-full h-12 pl-10 pr-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {forgotStep === 2 && (
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-slate-900 dark:text-white">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={form.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password (min 6 chars)"
                          className="w-full h-12 pl-10 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                className={`w-full h-12 text-base font-semibold ${config.color} transition-all shadow-lg rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  config.buttonText
                )}
              </button>
            </form>

            {msg && (
              <div
                className={`p-4 rounded-md border ${msg.includes("successful") || msg.includes("sent")
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  }`}
              >
                <p
                  className={`text-sm ${msg.includes("successful") || msg.includes("sent") ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                    }`}
                >
                  {msg}
                </p>
              </div>
            )}

            {/* Back Button for Forgot Password or Admin */}
            {(mode === "forgot-password" || mode === "admin") && (
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 underline font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Mode Switch Links - Only for non-forgot/admin modes */}
            {mode !== "forgot-password" && mode !== "admin" && (
              <div className="text-center space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                {mode === "login" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Don't have an account?{" "}
                      <button
                        className="text-blue-800 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline font-medium"
                        onClick={() => setMode("register")}
                      >
                        Create one here
                      </button>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Forgot your password?{" "}
                      <button
                        className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline font-medium"
                        onClick={() => {
                          setMode("forgot-password")
                          setForgotStep(0)
                          setAdminStep(0)
                          setForm({ name: "", email: "", password: "", otp: "", newPassword: "" })
                          setMsg("")
                        }}
                      >
                        Reset it here
                      </button>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Need admin access?{" "}
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline font-medium"
                        onClick={() => setMode("admin")}
                      >
                        Admin login
                      </button>
                    </p>
                  </div>
                ) : mode === "register" ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{" "}
                    <button
                      className="text-blue-800 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline font-medium"
                      onClick={() => setMode("login")}
                    >
                      Sign in here
                    </button>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex justify-center mt-6">
          <span className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
            🔒 Secure Authentication
          </span>
        </div>
      </div>
    </div>
  )
}