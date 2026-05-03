import React, { useState, useEffect } from "react";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, Button } from "../../components/common";
import apiService from "../../services/api";
import toast from "react-hot-toast";

interface AttendanceCalendarData {
  guardId: string;
  guardName: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  startDate: string;
  endDate: string;
  attendance: Array<{
    date: string;
    status: "present" | "absent" | "late" | "half_day";
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }>;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    attendancePercentage: number;
  };
}

interface AttendanceCalendarProps {
  guardId: string;
  projectId: string;
  onBack: () => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  guardId,
  projectId,
  onBack,
}) => {
  const [calendarData, setCalendarData] =
    useState<AttendanceCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadAttendanceCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardId, projectId, currentMonth]);

  const loadAttendanceCalendar = async () => {
    try {
      setLoading(true);
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      const response = await apiService.getAttendanceCalendar(
        guardId,
        projectId,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
      );

      if (response.status === "success") {
        setCalendarData(response.data);
      } else {
        throw new Error(response.message || "Failed to load calendar data");
      }
    } catch (error: any) {
      console.error("Error loading attendance calendar:", error);
      toast.error(
        error.response?.data?.message || "Failed to load attendance calendar"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "absent":
        return <X className="h-4 w-4 text-red-500" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "half_day":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200";
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "half_day":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "late":
        return "Late";
      case "half_day":
        return "Half Day";
      default:
        return "Unknown";
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    return timeString;
  };

  const generateCalendarDays = () => {
    if (!calendarData) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateString = currentDate.toISOString().split("T")[0];
      const attendanceRecord = calendarData.attendance.find(
        (a) => a.date === dateString
      );

      days.push({
        date: new Date(currentDate),
        dateString,
        attendance: attendanceRecord,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateString === new Date().toISOString().split("T")[0],
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance calendar...</p>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No attendance data found</p>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {calendarData.guardName}
            </h1>
            <p className="text-gray-600 mt-1">
              {calendarData.projectName} • {calendarData.siteName}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Days</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.totalDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.presentDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.absentDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.lateDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance %</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.attendancePercentage}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 min-h-[80px] border rounded-lg ${
                  day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${day.isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`text-sm font-medium ${
                      day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>

                  {day.attendance && (
                    <div className="mt-1 flex-1 flex flex-col justify-center">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          day.attendance.status
                        )}`}
                      >
                        {getStatusIcon(day.attendance.status)}
                        <span className="ml-1">
                          {getStatusLabel(day.attendance.status)}
                        </span>
                      </div>

                      {day.attendance.checkInTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          In: {formatTime(day.attendance.checkInTime)}
                        </div>
                      )}

                      {day.attendance.checkOutTime && (
                        <div className="text-xs text-gray-500">
                          Out: {formatTime(day.attendance.checkOutTime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-600">Half Day</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
