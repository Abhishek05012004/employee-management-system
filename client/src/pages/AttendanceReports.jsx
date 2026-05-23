"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import { Download, Users, Calendar, Filter, FileText } from "lucide-react"
import API from "../services/api"
import { formatDurationHours } from "../utils/timeFormatter"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

export default function AttendanceReports() {
  const { user, isAdmin } = useAuth()
  const [employees, setEmployees] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isAdmin || user?.role === "manager" || user?.role === "hr") {
      fetchEmployees()
    }

    // Set default date range to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDateRange({
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    })
  }, [isAdmin, user])

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/users?limit=1000")
      setEmployees(res.data.users)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Failed to fetch employees")
    }
  }

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error("Please select both start and end dates")
      return
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      toast.error("Start date cannot be after end date")
      return
    }

    setGenerating(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }

      if (selectedEmployees.length > 0 && selectedEmployees.length < employees.length) {
        params.userId = selectedEmployees.join(",")
      }

      const res = await API.get("/attendance/report", { params })
      setReportData(res.data.report)
      toast.success("Report generated successfully!")
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  // ENHANCED: Download function with better user feedback
  const downloadReport = async () => {
    if (reportData.length === 0) {
      toast.error("No data to download. Please generate a report first.")
      return
    }

    setDownloading(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }

      if (selectedEmployees.length > 0 && selectedEmployees.length < employees.length) {
        params.userId = selectedEmployees.join(",")
      }

      console.log("Downloading enhanced report with params:", params)

      const response = await API.get("/attendance/download-report", {
        params,
        responseType: "blob",
        timeout: 30000, // 30 second timeout
      })

      console.log("Download response received:", response.status)

      // Check if response is actually a blob
      if (response.data instanceof Blob) {
        // Create download link
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement("a")
        link.href = url

        const employeeName = (selectedEmployees.length > 0 && selectedEmployees.length < employees.length)
          ? "Selected_Employees"
          : "All_Employees"

        const fileName = `Attendance_Report_${employeeName}_${dateRange.startDate}_to_${dateRange.endDate}.csv`
        link.setAttribute("download", fileName)

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Cleanup
        link.remove()
        window.URL.revokeObjectURL(url)

        toast.success(
          "📊 Enhanced Excel report downloaded successfully! Features: Professional formatting and attendance breakdown.",
        )
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error downloading report:", error)

      if (error.code === "ECONNABORTED") {
        toast.error("Download timeout. Please try again with a smaller date range.")
      } else if (error.response?.status === 404) {
        toast.error("No attendance records found for the selected date range.")
      } else if (error.response?.status === 500) {
        toast.error("Server error while generating report. Please try again.")
      } else {
        toast.error("Failed to download report. Please check your connection and try again.")
      }
    } finally {
      setDownloading(false)
    }
  }

  const formatTime = (time) => {
    if (!time) return "--"
    return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const toYMD = (date) => {
    if (!date) return ""
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  const parseYMD = (str) => {
    if (!str) return null
    const [y, m, d] = str.split("-").map(Number)
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)
  }

  const getStatusBadge = (record) => {
    if (record.checkIn && record.checkOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Complete
        </span>
      )
    } else if (record.checkIn && !record.checkOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Incomplete
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Absent
        </span>
      )
    }
  }

  // ENHANCED: Calculate comprehensive report statistics
  const reportStats = {
    totalRecords: reportData.length,
    totalHours: reportData.reduce((sum, record) => sum + (record.workingHours || 0), 0),
    avgHours: reportData.length > 0 ? reportData.reduce((sum, record) => sum + (record.workingHours || 0), 0) / reportData.length : 0,
    completeRecords: reportData.filter((record) => record.checkIn && record.checkOut).length,
    incompleteRecords: reportData.filter((record) => record.checkIn && !record.checkOut).length,
    absentRecords: reportData.filter((record) => !record.checkIn).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600">Generate and download professionally formatted attendance reports</p>
        </div>
        <FileText className="w-8 h-8 text-blue-600" />
      </div>

      {/* Report Generation Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Employee Selection - For Admin, Manager, and HR */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <div 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg flex justify-between items-center cursor-pointer bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate">
                {selectedEmployees.length === 0 || selectedEmployees.length === employees.length 
                  ? "All Employees" 
                  : `${selectedEmployees.length} Employee(s) Selected`}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div 
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 border-b font-medium"
                  onClick={() => {
                    setSelectedEmployees([]) // clear selection implies all
                    setIsDropdownOpen(false)
                  }}
                >
                  All Employees
                </div>
                {employees.map((employee) => (
                  <label key={employee._id} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={selectedEmployees.includes(employee._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee._id])
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee._id))
                        }
                      }}
                    />
                    <span className="text-gray-900">{employee.name} ({employee.employeeId})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <div className="relative z-20">
              <label htmlFor="startDate" className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 cursor-pointer group">
                <Calendar className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </label>
              <DatePicker
                id="startDate"
                selected={parseYMD(dateRange.startDate)}
                onChange={(date) => {
                  if (!date) return
                  const startStr = toYMD(date)
                  setDateRange((prev) => {
                    const endObj = parseYMD(prev.endDate)
                    const adjustedEnd = endObj && endObj < date ? startStr : prev.endDate
                    return { ...prev, startDate: startStr, endDate: adjustedEnd }
                  })
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="yyyy-mm-dd"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white relative z-0"
                popperPlacement="bottom-start"
                popperClassName="z-50"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <div className="relative z-10">
              <label htmlFor="endDate" className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 cursor-pointer group">
                <Calendar className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </label>
              <DatePicker
                id="endDate"
                selected={parseYMD(dateRange.endDate)}
                onChange={(date) => {
                  if (!date) return
                  setDateRange((prev) => ({ ...prev, endDate: toYMD(date) }))
                }}
                minDate={parseYMD(dateRange.startDate)}
                dateFormat="yyyy-MM-dd"
                placeholderText="yyyy-mm-dd"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white relative z-0"
                popperPlacement="bottom-start"
                popperClassName="z-50"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* ENHANCED: Download Options & Statistics */}
        {reportData.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Enhanced Statistics */}
              <div className="lg:col-span-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">📊 Report Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportStats.totalRecords}</div>
                    <div className="text-gray-600">Total Records</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{reportStats.completeRecords}</div>
                    <div className="text-gray-600">Complete</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                    {formatDurationHours(reportStats.totalHours)}
                  </div>
                    <div className="text-gray-600">Total Hours</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Download */}
              <div className="flex flex-col justify-center items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <button
                  onClick={downloadReport}
                  disabled={downloading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
                <div className="text-xs text-gray-600 text-center">Professional Excel format with analytics</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
              <strong>✨ Enhanced Report Features:</strong> Professional header, attendance breakdown, and optimized Excel formatting. No notes column for cleaner presentation.
            </div>
          </div>
        )}
      </div>

      {/* Report Preview */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              <Users className="w-5 h-5 inline mr-2" />
              Report Preview
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {(selectedEmployees.length > 0 && selectedEmployees.length < employees.length)
                ? "Report for Selected Employees"
                : "Report for all employees"}{" "}
              from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
            </p>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">
                            {record.user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.user?.name}</div>
                          <div className="text-sm text-gray-500">{record.user?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(record.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatTime(record.checkIn)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatTime(record.checkOut)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {record.workingHours ? formatDurationHours(record.workingHours) : "--"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {reportData.length === 0 && !generating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No report data available. Please select date range and generate a report.</p>
          </div>
        </div>
      )}
    </div>
  )
}
