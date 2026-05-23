"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"
import { formatDurationHours } from "../utils/timeFormatter"

export default function AttendanceCalendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    fetchCalendarData()
  }, [currentMonth, currentYear])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/attendance/calendar/${currentMonth}/${currentYear}`)
      setCalendarData(res.data.calendarData || {})
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast.error("Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getLocalDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getStatusColor = (date) => {
    const dateStr = getLocalDateString(date)
    const dayOfWeek = date.getDay()
    const record = calendarData[dateStr]
    const today = new Date()
    const isFutureDate = date > today

    // Future dates - light gray
    if (isFutureDate) {
      return "bg-gray-100 text-gray-400 border border-gray-200"
    }

    // Working days with records (including weekends if they worked)
    if (record && record.isPresent) {
      if (record.workingHours >= 6) {
        return "bg-green-50 text-green-700 border border-green-200"
      }
      return "bg-amber-50 text-amber-700 border border-amber-200"
    }

    // Weekends with no record
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "bg-gray-100 text-gray-500 border border-gray-200"
    }

    // No record or absent on a weekday
    return "bg-red-50 text-red-700 border border-red-200"
  }

  const getDayContent = (date) => {
    const dateStr = getLocalDateString(date)
    const dayOfWeek = date.getDay()
    const record = calendarData[dateStr]
    const today = new Date()
    const isFutureDate = date > today

    if (isFutureDate) {
      return ""
    }

    if (record && record.isPresent) {
      return formatDurationHours(record.workingHours)
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "Holiday"
    }

    return "Absent"
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth - 1, i))
  }

  const selectedDateRecord = selectedDate ? calendarData[getLocalDateString(selectedDate)] : null
  const today = new Date()
  const isSelectedDateFuture = selectedDate && selectedDate > today

  // Calculate summary statistics
  const fullDays = Object.values(calendarData).filter((r) => r.isPresent && r.workingHours >= 6).length
  const partialDays = Object.values(calendarData).filter((r) => r.isPresent && r.workingHours < 6).length
  const absentDays = days.filter((date) => {
    if (!date) return false
    if (date > today) return false
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    const dateStr = getLocalDateString(date)
    const record = calendarData[dateStr]
    if (record) {
      return !record.isPresent
    }
    return true
  }).length
  const totalHours = Object.values(calendarData).reduce((sum, r) => sum + (r.workingHours || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3 sm:mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Attendance Calendar</h1>
                    <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                      View your working hours and attendance history
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="text-blue-100 text-xs mt-1">{user?.employeeId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar Container */}
          <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Month Navigation */}
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex-shrink-0"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                  
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center flex-1 min-w-0">
                    <span className="truncate block">{monthName}</span>
                  </h2>
                  
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex-shrink-0"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleToday}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-200 active:scale-95 text-xs sm:text-sm shadow-sm flex-shrink-0"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16 sm:py-20">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-3 sm:p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                      <div
                        key={`day-${index}`}
                      className={`text-center font-semibold py-2 text-xs sm:text-sm ${
                        index === 0 || index === 6 ? "text-gray-500" : "text-gray-600"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {days.map((date, index) => {
                    const isToday = date && date.toDateString() === today.toDateString()
                    const isSelected = selectedDate && date && selectedDate.toDateString() === date.toDateString()
                    const isFutureDate = date && date > today
                    
                    return (
                      <div
                        key={index}
                        onClick={() => date && !isFutureDate && setSelectedDate(date)}
                        className={`
                          aspect-square flex flex-col items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 text-xs
                          ${date ? getStatusColor(date) : "bg-transparent"}
                          ${date && !isFutureDate ? "hover:scale-105 hover:shadow-md cursor-pointer" : "cursor-default"}
                          ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 scale-105 shadow-md" : ""}
                          ${isToday ? "ring-2 ring-blue-300 ring-offset-1" : ""}
                        `}
                      >
                        {date && (
                          <div className="flex flex-col items-center justify-center w-full h-full p-1">
                            <div className={`text-sm sm:text-base font-semibold mb-1 ${
                              isToday && !isSelected ? "text-blue-600" : ""
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className="hidden sm:block text-xs font-medium text-center leading-tight px-1">
                              {getDayContent(date)}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Selected Date Details */}
            {selectedDate && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>Date Details</span>
                </h3>

                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {isSelectedDateFuture ? (
                  <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 rounded-lg sm:rounded-xl p-4 border border-gray-200">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Future Date</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Attendance data not available for future dates
                      </p>
                    </div>
                  </div>
                ) : selectedDateRecord ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Check In</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedDateRecord.checkIn || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Check Out</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedDateRecord.checkOut || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Working Hours</p>
                      <p className={`text-lg sm:text-xl font-bold ${
                        selectedDateRecord.workingHours >= 6 ? "text-green-600" : "text-amber-600"
                      }`}>
                        {formatDurationHours(selectedDateRecord.workingHours)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <p className="font-semibold text-gray-900 capitalize text-sm">
                        {selectedDateRecord.status}
                      </p>
                    </div>
                  </div>
                ) : selectedDate && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) ? (
                  <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 rounded-lg sm:rounded-xl p-4 border border-gray-200">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Weekend Holiday</p>
                      <p className="text-xs text-gray-500 mt-1">
                        This date is a weekend and is treated as a holiday.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-red-600 bg-red-50 rounded-lg sm:rounded-xl p-4 border border-red-200">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">No attendance record</p>
                      <p className="text-xs text-red-500 mt-1">
                        Marked as absent for this date
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Month Summary</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Full Days (≥6h)</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">{fullDays}</p>
                </div>
                <div className="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Partial Days ({'<6h'})</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700">{partialDays}</p>
                </div>
                <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
                  <p className="text-xs text-red-700 mb-1">Absent Days</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-700">{absentDays}</p>
                </div>
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Total Hours</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">
                    {formatDurationHours(totalHours)}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Key */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Key</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-50 border border-green-200 rounded-lg flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Full Day (≥6 hours)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Partial Day ({'<6 hours'})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-50 border border-red-200 rounded-lg flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Absent</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded-lg flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Weekend/Holiday</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded-lg flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Future Date</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
