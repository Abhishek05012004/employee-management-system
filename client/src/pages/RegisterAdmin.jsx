"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  Briefcase,
  Phone,
  MapPin,
  Shield,
  Key,
  CheckCircle,
  ChevronDown,
  Info,
  LogIn,
} from "lucide-react"
import API from "../services/api"
import FaceModal from "../components/face-modal"

export default function RegisterAdmin() {
  const [step, setStep] = useState(1) // 1: Email/Name for OTP, 2: Full details & Face
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    adminCode: "",
    otp: "",
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFace, setShowFace] = useState(false)
  const [faceEmbedding, setFaceEmbedding] = useState(null)
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!form.email || !form.name) {
      toast.error("Name and Email are required.")
      return
    }
    
    setLoading(true)
    try {
      await API.post("/auth/register-admin-otp", { email: form.email, name: form.name })
      toast.success("OTP sent to your email!")
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!Array.isArray(faceEmbedding) || faceEmbedding.length < 64) {
      toast.error("Face enrollment is required for admins.")
      setLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const requiredFields = ["name", "email", "password", "phone", "address", "adminCode", "otp"]
    const missingFields = requiredFields.filter((field) => !form[field] || form[field].trim() === "")

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`)
      setLoading(false)
      return
    }

    try {
      await API.post("/auth/register-admin", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        adminCode: form.adminCode,
        otp: form.otp,
        faceEmbedding,
        faceModelVersion: "face-api-0.22.2",
      })

      toast.success("Admin registered successfully! You can now log in.")
      navigate("/login")
    } catch (err) {
      toast.error(err.response?.data?.error || "Admin registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(219, 234, 254, 0.7)",
      }}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-indigo-600" />
              Create Organization Admin
            </h2>
            <p className="text-gray-600 mt-2">Set up a new workspace for your organization</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6 max-w-md mx-auto">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Your Full Name
                </label>
                <div className="relative">
                  
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Organization Email
                </label>
                <div className="relative">
                  
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    placeholder="admin@yourcompany.com"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Mail className="w-5 h-5" />
                  {loading ? "Sending..." : "Send Verification OTP"}
                </button>
              </div>
              <div className="mt-4">
                <Link to="/login" className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-indigo-600 text-sm font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <LogIn className="w-5 h-5" />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  We sent a code to <strong>{form.email}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Code - Unique identifier for their org */}
                <div>
                  <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Create Your Unique Admin Code *
                  </label>
                  <div className="relative">
                    
                    <input
                      id="adminCode"
                      name="adminCode"
                      type="text"
                      required
                      className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="e.g., MYCOMPANY2026"
                      value={form.adminCode}
                      onChange={(e) => handleInputChange("adminCode", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This code will be shared with your employees so they can register under your organization.</p>
                </div>

                {/* OTP */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    Email OTP *
                  </label>
                  <div className="relative">
                    
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="Enter 6-digit OTP"
                      value={form.otp}
                      onChange={(e) => handleInputChange("otp", e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Password *
                  </label>
                  <div className="relative">
                    
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      className="appearance-none relative block w-full pl-4 pr-12 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Confirm Password *
                  </label>
                  <div className="relative">
                    
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="appearance-none relative block w-full pl-4 pr-12 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

              {/* Address */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </label>
                  <div className="relative">
                    
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      minLength={10}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Phone number must be exactly 10 digits"
                      className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address *
                </label>
                <div className="relative">
                  
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    className="appearance-none relative block w-full pl-4 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    placeholder="Enter your complete address"
                    value={form.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
              </div>

              {/* Face Enrollment */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin Face Enrollment (Required)</p>
                  <p className="text-xs text-gray-600">
                    Capture your face for secure check-in.
                  </p>
                  {Array.isArray(faceEmbedding) && (
                    <p className="text-xs text-green-600 mt-1">Face captured successfully.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFace(true)}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {Array.isArray(faceEmbedding) ? "Retake Face" : "Enroll Face"}
                </button>
              </div>

              {showFace && (
                <FaceModal
                  open={showFace}
                  mode="enroll"
                  enrollViaApi={false}
                  onClose={() => setShowFace(false)}
                  onEnrolled={(embeddingOrUser) => {
                    if (Array.isArray(embeddingOrUser)) {
                      setFaceEmbedding(embeddingOrUser)
                    }
                  }}
                  onVerified={null}
                />
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Registering Admin..." : "Complete Admin Registration"}
                </button>
              </div>

              <div className="mt-4">
                <button type="button" onClick={() => setStep(1)} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-indigo-600 text-sm font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <LogIn className="w-5 h-5" />
                  Go back to Email Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
