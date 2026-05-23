"use client"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Login from "./pages/Login"
import Register from "./pages/Register"
import RegisterAdmin from "./pages/RegisterAdmin"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/AdminDashboard"
import Profile from "./pages/Profile"
import AttendanceLogs from "./pages/AttendanceLogs"
import AttendanceReports from "./pages/AttendanceReports"
import AttendanceCalendar from "./pages/AttendanceCalendar"
import UserManagement from "./pages/UserManagement"
import LeaveManagement from "./pages/LeaveManagement"
import RegistrationRequests from "./pages/RegistrationRequests"
import Notifications from "./pages/Notifications"
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider, useAuth } from "./context/AuthContext"
import DocumentTitle from "./components/DocumentTitle"
function ReportsRoute() {
  const { user } = useAuth()

  if (user?.role === "admin" || user?.role === "manager" || user?.role === "hr") {
    return <AttendanceReports />
  }

  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            containerClassName="app-toast-container"
            toastClassName="app-toast"
            style={{ zIndex: 999999 }}
          />

          <Routes>
            <Route path="/login" element={<DocumentTitle title="Login"><Login /></DocumentTitle>} />
            <Route path="/register" element={<DocumentTitle title="Register"><Register /></DocumentTitle>} />
            <Route path="/register-admin" element={<DocumentTitle title="Register Admin"><RegisterAdmin /></DocumentTitle>} />
            <Route path="/forgot-password" element={<DocumentTitle title="Forgot Password"><ForgotPassword /></DocumentTitle>} />
            <Route path="/reset-password" element={<DocumentTitle title="Reset Password"><ResetPassword /></DocumentTitle>} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DocumentTitle title="Dashboard"><Dashboard /></DocumentTitle>} />
              <Route path="calendar" element={<DocumentTitle title="Calendar"><AttendanceCalendar /></DocumentTitle>} />
              <Route
                path="admin"
                element={
                  <DocumentTitle title="Admin Dashboard">
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </DocumentTitle>
                }
              />
              <Route path="profile" element={<DocumentTitle title="Profile"><Profile /></DocumentTitle>} />
              <Route path="attendance" element={<DocumentTitle title="Attendance Logs"><AttendanceLogs /></DocumentTitle>} />
              <Route path="leaves" element={<DocumentTitle title="Leave Management"><LeaveManagement /></DocumentTitle>} />
              <Route
                path="reports"
                element={
                  <DocumentTitle title="Reports">
                    <ProtectedRoute requiredRoles={["admin", "manager", "hr"]}>
                      <ReportsRoute />
                    </ProtectedRoute>
                  </DocumentTitle>
                }
              />
              <Route
                path="users"
                element={
                  <DocumentTitle title="User Management">
                    <ProtectedRoute requiredRoles={["admin", "hr"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  </DocumentTitle>
                }
              />
              <Route
                path="registration-requests"
                element={
                  <DocumentTitle title="Registration Requests">
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <RegistrationRequests />
                    </ProtectedRoute>
                  </DocumentTitle>
                }
              />
              <Route
                path="notifications"
                element={
                  <DocumentTitle title="Notifications">
                    <ProtectedRoute requiredRoles={["admin", "employee", "manager", "hr"]}>
                      <Notifications />
                    </ProtectedRoute>
                  </DocumentTitle>
                }
              />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
