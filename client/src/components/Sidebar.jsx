"use client"

import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LayoutDashboard, Clock, Users, User, BarChart3, Calendar, FileText, UserPlus, Bell } from "lucide-react"

export default function Sidebar({ onNavigate, mobile = false }) {
  const { user } = useAuth()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "employee", "manager", "hr"] },
    { name: "Attendance", href: "/attendance", icon: Clock, roles: ["admin", "employee", "manager", "hr"] },
    { name: "Calendar", href: "/calendar", icon: Calendar, roles: ["admin", "employee", "manager", "hr"] },
    { name: "Leave Management", href: "/leaves", icon: Calendar, roles: ["admin", "employee", "manager", "hr"] },
    { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "manager", "hr"] },
    { name: "Admin Dashboard", href: "/admin", icon: BarChart3, roles: ["admin"] },
    { name: "User Management", href: "/users", icon: Users, roles: ["admin", "hr"] },
    { name: "Registration Requests", href: "/registration-requests", icon: UserPlus, roles: ["admin"] },
    { name: "Notifications", href: "/notifications", icon: Bell, roles: ["admin", "employee", "manager", "hr"] },
    { name: "Profile", href: "/profile", icon: User, roles: ["admin", "employee", "manager", "hr"] },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role))

  const asideBase = "bg-white w-64 h-full flex flex-col"
  const chrome = mobile ? "" : "shadow-lg border-r border-gray-200"

  return (
    <aside className={`${asideBase} ${chrome}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">WorkFlow</h2>
            <p className="text-[11px] sm:text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      <nav className="mt-2 sm:mt-3 flex-1 overflow-y-auto">
        <div className="px-5 sm:px-6 mb-3">
          <h3 className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
        </div>

        <div className="space-y-1 px-3 pb-4">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className={`${mobile ? "border-t-0" : "border-t border-gray-200"} mt-auto px-5 sm:px-6 py-4`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {user?.employeeId} • {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
