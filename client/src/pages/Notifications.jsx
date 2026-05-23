import { useState, useEffect } from "react"
import { Bell, CheckCircle, Info, XCircle } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedActions, setExpandedActions] = useState({})

  useEffect(() => {
    fetchNotificationHistory()
  }, [])

  const fetchNotificationHistory = async () => {
    try {
      setLoading(true)
      const res = await API.get("/auth/notifications/history")
      setNotifications(res.data)
    } catch (error) {
      console.error("Error fetching notification history:", error)
      toast.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const toggleAction = (id) => {
    setExpandedActions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const getIcon = (notification) => {
    // If an action has been taken, show the action icon (approved/rejected)
    if (notification?.isActioned) {
      if ((notification.actionTaken || "").toLowerCase() === "approved") {
        return <CheckCircle className="w-5 h-5 text-green-500" />
      }
      if ((notification.actionTaken || "").toLowerCase() === "rejected") {
        return <XCircle className="w-5 h-5 text-red-500" />
      }
    }

    // Fallback to message-based or type-based icons for pending/info notifications
    const msgLower = (notification?.message || "").toLowerCase()
    if (msgLower.includes("approved")) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (msgLower.includes("rejected")) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }

    if (notification?.type === "leave_request") {
      return <Info className="w-5 h-5 text-blue-500" />
    } else if (notification?.type === "registration_request") {
      return <Info className="w-5 h-5 text-purple-500" />
    }

    return <Bell className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
          <p className="text-gray-600">View all past notifications and actions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No notifications found in your history.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div key={notification._id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {notification.isActioned && (
                      <button
                        onClick={() => toggleAction(notification._id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap self-start"
                      >
                        {expandedActions[notification._id] ? "Hide Action" : "View Action"}
                      </button>
                    )}
                  </div>
                  
                  {notification.isActioned && expandedActions[notification._id] && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start space-x-2">
                      <div className="mt-0.5">
                        {notification.actionTaken === "Approved" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : notification.actionTaken === "Rejected" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{notification.actionTaken}</span> by {notification.actionBy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
