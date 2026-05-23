"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { User, LogOut, Bell, Menu, CheckCircle2 } from "lucide-react" // Added Menu icon
import { clearAuthToken, API_BASE_URL } from "../services/api"
import API from "../services/api"
import { useNavigate } from "react-router-dom"

export default function Navbar({ onOpenSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState([])
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)

  const handleLogout = () => {
    clearAuthToken()
    logout()
    setShowDropdown(false)
  }

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!user) return

    try {
      const res = await API.get("/auth/notifications")
      setUnreadNotifications(res.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  // Function to mark notification as read and navigate
  const handleNotificationClick = async (notification) => {
    try {
      await API.put(`/auth/notifications/${notification._id}/read`)
      setUnreadNotifications((prev) => prev.filter((n) => n._id !== notification._id))
      setShowNotificationsDropdown(false)
      const targetLink = notification.link || "/notifications"
      navigate(targetLink, { state: { refreshKey: Date.now() } })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await API.put("/auth/notifications/mark-all-read")
      setUnreadNotifications([])
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Effect to handle clicks outside the user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  // Effect to handle clicks outside the notifications dropdown
  useEffect(() => {
    function handleClickOutsideNotifications(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false)
      }
    }

    if (showNotificationsDropdown) {
      document.addEventListener("mousedown", handleClickOutsideNotifications)
    } else {
      document.removeEventListener("mousedown", handleClickOutsideNotifications)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideNotifications)
    }
  }, [showNotificationsDropdown])

  useEffect(() => {
    // Only for roles that receive notifications
    if (!(user && (user.role === "admin" || user.role === "employee" || user.role === "manager" || user.role === "hr"))) return

    let es
    let fallbackTimer

    // Always fetch initial list
    fetchNotifications()

    try {
      const token = sessionStorage.getItem("jwtToken")
      if (!token) return

      const streamUrl = `${API_BASE_URL}/auth/notifications/stream?token=${encodeURIComponent(token)}`
      console.log("[v0] Opening SSE notifications stream:", streamUrl)

      es = new EventSource(streamUrl, { withCredentials: false })

      es.addEventListener("hello", (e) => {
        console.log("[v0] SSE hello:", e.data)
      })

      es.addEventListener("ping", () => {
        // heartbeat, optional log
      })

      es.addEventListener("notification", (e) => {
        try {
          const payload = JSON.parse(e.data)
          console.log("[v0] Realtime notification received:", payload)
          setUnreadNotifications((prev) => [payload, ...prev])
        } catch (err) {
          console.error("[v0] Failed to parse SSE notification:", err)
        }
      })

      es.onerror = (err) => {
        console.error("[v0] SSE error, falling back to polling:", err)
        // Fallback to faster polling if SSE errors out
        if (!fallbackTimer) {
          fallbackTimer = setInterval(fetchNotifications, 5000)
        }
      }
    } catch (err) {
      console.error("[v0] SSE setup error:", err)
      fallbackTimer = setInterval(fetchNotifications, 5000)
    }

    return () => {
      if (es) {
        console.log("[v0] Closing SSE notifications stream")
        es.close()
      }
      if (fallbackTimer) clearInterval(fallbackTimer)
    }
  }, [user])

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu */}
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open sidebar"
            onClick={onOpenSidebar}
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain" />
          <h1 className="hidden md:block text-base sm:text-lg md:text-xl font-semibold text-gray-800">Employee Management System</h1>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notifications Icon */}
          {(user?.role === "admin" || user?.role === "employee" || user?.role === "manager" || user?.role === "hr") && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              {showNotificationsDropdown && (
                <div className="absolute right-2 sm:right-0 mt-2 w-[92vw] sm:w-80 mx-2 sm:mx-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-800 border-b border-gray-200 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center font-normal"
                        title="Mark all as read"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  {unreadNotifications.length > 0 ? (
                    unreadNotifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className="flex flex-col items-start w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">No new notifications</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </a>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
