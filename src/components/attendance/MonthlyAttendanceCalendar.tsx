import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Calendar as CalendarIcon,
  UserX,
  X,
  Eye,
  MoreVertical,
  CalendarOff,
  FileText,
  Briefcase,
} from "lucide-react";
import { Card, Button, Modal } from "../common";
import apiService from "../../services/api";
import toast from "react-hot-toast";

interface MonthlyAttendanceData {
  guardId: string;
  guardName: string;
  siteId: string;
  siteName: string;
  month: string;
  year: number;
  calendar: Array<{
    date: string;
    day: number;
    status: "present" | "absent" | "not_applicable";
    photoUrl?: string;
    checkInTime?: string;
    notes?: string;
  }>;
  summary: {
    totalDays: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
}

interface MonthlyAttendanceCalendarProps {
  guardId: string;
  siteId: string;
  onBack: () => void;
}

export const MonthlyAttendanceCalendar: React.FC<
  MonthlyAttendanceCalendarProps
> = ({ guardId, siteId, onBack }) => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] =
    useState<MonthlyAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [actionMenuDay, setActionMenuDay] = useState<string | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);
  const [showWeeklyOffModal, setShowWeeklyOffModal] = useState(false);
  const [loadingWeeklyOff, setLoadingWeeklyOff] = useState(false);
  const [dayOfWeekMenu, setDayOfWeekMenu] = useState<number | null>(null);
  const [markingDayOfWeek, setMarkingDayOfWeek] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dayOfWeekMenuRef = useRef<HTMLDivElement>(null);

  const loadMonthlyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await apiService.getMonthlyAttendanceCalendar(
        guardId,
        siteId,
        { year, month }
      );

      if (response.status === "success") {
        setCalendarData(response.data);
      } else {
        throw new Error(response.message || "Failed to load calendar data");
      }
    } catch (error: unknown) {
      console.error("Error loading monthly attendance:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load monthly attendance";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [guardId, siteId, currentMonth]);

  useEffect(() => {
    loadMonthlyAttendance();
  }, [loadMonthlyAttendance]);

  // Load projectId and weekly off configuration when component mounts
  useEffect(() => {
    const loadProjectId = async () => {
      try {
        const response = await apiService.getProjectsBySite(siteId, {
          status: "Active",
        });
        const projects = response.data?.projects || [];
        // Find project with this guard assigned
        const project = projects.find((p: any) =>
          p.guardAssignments?.some(
            (a: any) => a.guardId === guardId && a.isActive
          )
        );
        if (project) {
          setProjectId(project._id);
          // Load weekly off configuration
          try {
            const weeklyOffResponse = await apiService.getWeeklyOff(
              guardId,
              project._id
            );
            if (weeklyOffResponse.status === "success") {
              setWeeklyOffDays(weeklyOffResponse.data?.weeklyOffDays || []);
            }
          } catch (error) {
            console.error("Failed to load weekly off configuration:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load project ID:", error);
      }
    };
    loadProjectId();
  }, [guardId, siteId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuDay(null);
      }
      if (
        dayOfWeekMenuRef.current &&
        !dayOfWeekMenuRef.current.contains(event.target as Node)
      ) {
        setDayOfWeekMenu(null);
      }
    };

    if (actionMenuDay || dayOfWeekMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionMenuDay, dayOfWeekMenu]);

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generateCalendarDays = () => {
    if (!calendarData) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Create dates in UTC to match backend format
    const firstDay = new Date(Date.UTC(year, month, 1));
    const startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getUTCDay();
    startDate.setUTCDate(startDate.getUTCDate() - firstDayOfWeek);

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      // Use UTC methods to match backend date format (YYYY-MM-DD in UTC)
      const yearUTC = currentDate.getUTCFullYear();
      const monthUTC = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
      const dayUTC = String(currentDate.getUTCDate()).padStart(2, "0");
      const dateString = `${yearUTC}-${monthUTC}-${dayUTC}`;

      const attendanceRecord = calendarData.calendar.find(
        (a) => a.date === dateString
      );

      // Get today's date in local timezone for comparison (for highlighting today)
      const today = new Date();
      const todayString = getLocalDateString(today);
      const currentDateString = getLocalDateString(currentDate);

      days.push({
        date: new Date(currentDate),
        dateString,
        attendance: attendanceRecord,
        isCurrentMonth: currentDate.getUTCMonth() === month,
        isToday: currentDateString === todayString,
      });

      // Move to next day in UTC
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

  const handleDayClick = (
    day: {
      date: Date;
      dateString: string;
      attendance?: {
        status: "present" | "absent" | "not_applicable";
        photoUrl?: string;
        checkInTime?: string;
        notes?: string;
      };
      isCurrentMonth: boolean;
      isToday: boolean;
    },
    event: React.MouseEvent
  ) => {
    // If clicking on action menu button, don't do anything
    if ((event.target as HTMLElement).closest(".action-menu-button")) {
      return;
    }

    // If present, show photo modal
    if (day.attendance && day.attendance.status === "present") {
      setSelectedDay(day.dateString);
    } else {
      // Otherwise, show action menu
      setActionMenuDay(day.dateString);
    }
  };

  const handleMarkAttendance = async (
    dateString: string,
    status: "present" | "absent"
  ) => {
    if (!projectId) {
      toast.error("Project not found. Please try again.");
      return;
    }

    try {
      setMarkingAttendance(true);
      const date = new Date(dateString);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      // Check if attendance record exists
      const existingAttendance = calendarData?.calendar.find(
        (d) => d.date === dateString
      );

      if (existingAttendance && existingAttendance.status === status) {
        toast.success(`Already marked as ${status}`);
        setActionMenuDay(null);
        return;
      }

      // Try to find existing attendance record by date
      const attendanceList = await apiService.getAttendance({
        guardId,
        projectId,
        startDate: date.toISOString(),
        endDate: date.toISOString(),
      });

      let attendanceId: string | null = null;
      if (
        attendanceList.status === "success" &&
        attendanceList.data?.attendance?.length > 0
      ) {
        attendanceId = attendanceList.data.attendance[0]._id;
      }

      if (attendanceId) {
        // Update existing attendance
        await apiService.updateAttendance(attendanceId, {
          status,
          date: date.toISOString(),
          checkInTime:
            status === "present" ? new Date().toISOString() : undefined,
        });
        toast.success(`Marked as ${status} successfully`);
      } else {
        // Create new attendance
        await apiService.createAttendance({
          guardId,
          projectId,
          siteId,
          date: date.toISOString(),
          status,
          photoUrl: "manual-marking", // Placeholder for manual marking
          checkInTime:
            status === "present" ? new Date().toISOString() : undefined,
        });
        toast.success(`Marked as ${status} successfully`);
      }

      // Reload calendar
      await loadMonthlyAttendance();
      setActionMenuDay(null);
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleSaveWeeklyOff = async () => {
    if (!projectId) {
      toast.error("Project not found. Please try again.");
      return;
    }

    try {
      setLoadingWeeklyOff(true);
      await apiService.upsertWeeklyOff({
        guardId,
        projectId,
        siteId,
        weeklyOffDays,
      });
      toast.success("Weekly off configuration saved successfully");
      setShowWeeklyOffModal(false);
      // Reload calendar to reflect changes
      await loadMonthlyAttendance();
    } catch (error: any) {
      console.error("Error saving weekly off:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to save weekly off configuration"
      );
    } finally {
      setLoadingWeeklyOff(false);
    }
  };

  const toggleWeeklyOffDay = (dayOfWeek: number) => {
    setWeeklyOffDays((prev) => {
      if (prev.includes(dayOfWeek)) {
        return prev.filter((d) => d !== dayOfWeek);
      } else {
        return [...prev, dayOfWeek];
      }
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  };

  const getDayShortName = (dayOfWeek: number) => {
    // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayOfWeek] || days[0];
  };

  const handleMarkDayOfWeek = async (
    dayOfWeek: number,
    status: "present" | "absent"
  ) => {
    if (!projectId) {
      toast.error("Project not found. Please try again.");
      return;
    }

    // Validate dayOfWeek
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      toast.error("Invalid day of week");
      return;
    }

    try {
      setMarkingDayOfWeek(true);

      // Get all dates in the current month that match this day of week
      // Use UTC to avoid timezone shifts
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const datesToMark: Date[] = [];
      const currentDate = new Date(firstDay);

      // Find all occurrences of this day of week in the month
      // JavaScript getUTCDay(): 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
      // dayOfWeek parameter: 0=Sunday (header column 0), 1=Monday (header column 1), etc.
      // Header uses [0,1,2,3,4,5,6] mapped to ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      while (currentDate <= lastDay) {
        // Only process dates in the current month (using UTC)
        if (currentDate.getUTCMonth() === month) {
          const dateDayOfWeek = currentDate.getUTCDay();
          // Match the day of week: 0=Sunday, 1=Monday, etc.
          if (dateDayOfWeek === dayOfWeek) {
            // Skip weekly off days
            if (!weeklyOffDays.includes(dateDayOfWeek)) {
              datesToMark.push(new Date(currentDate));
            }
          }
        }
        // Move to next day in UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
      }

      if (datesToMark.length === 0) {
        toast.error(
          `No ${getDayName(
            dayOfWeek
          )}s found in this month (excluding weekly off days)`
        );
        setDayOfWeekMenu(null);
        return;
      }

      // Since the backend now supports upsert (update if exists, create if not),
      // we can simply call createAttendance for all dates
      // The backend will automatically update existing records or create new ones
      const checkInTime =
        status === "present" ? new Date().toISOString() : undefined;

      // Process all dates in parallel for better performance
      const promises = datesToMark.map(async (date) => {
        // Normalize date to start of day in UTC (backend expects this)
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        try {
          await apiService.createAttendance({
            guardId,
            projectId,
            siteId,
            date: normalizedDate.toISOString(),
            status,
            photoUrl: "manual-marking",
            checkInTime,
          });
          // Get date string in YYYY-MM-DD format using UTC
          const year = normalizedDate.getUTCFullYear();
          const month = String(normalizedDate.getUTCMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(normalizedDate.getUTCDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          return {
            success: true,
            date: dateStr,
          };
        } catch (error: any) {
          // Get date string for error logging
          const year = normalizedDate.getUTCFullYear();
          const month = String(normalizedDate.getUTCMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(normalizedDate.getUTCDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          console.error(`Error marking attendance for ${dateStr}:`, error);
          return {
            success: false,
            date: dateStr,
            error: error.response?.data?.message || error.message,
          };
        }
      });

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        console.error("Failed to mark some dates:", failed);
        toast.error(
          `Marked ${successful} of ${datesToMark.length} ${getDayName(
            dayOfWeek
          )}s as ${status}. ${failed.length} failed.`
        );
      } else {
        toast.success(
          `Marked all ${getDayName(
            dayOfWeek
          )}s (${successful} days) as ${status} successfully`
        );
      }

      // Reload calendar
      await loadMonthlyAttendance();
      setDayOfWeekMenu(null);
    } catch (error: any) {
      console.error("Error marking day of week:", error);
      toast.error(
        error.response?.data?.message || "Failed to mark day of week"
      );
    } finally {
      setMarkingDayOfWeek(false);
    }
  };

  const closePhotoModal = () => {
    setSelectedDay(null);
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

  const selectedDayData = selectedDay
    ? calendarData.calendar.find((d) => d.date === selectedDay)
    : null;

  const handleDayColor = (day: {
    date: Date;
    dateString: string;
    attendance?: {
      status: "present" | "absent" | "not_applicable";
      photoUrl?: string;
      checkInTime?: string;
      notes?: string;
    };
    isCurrentMonth: boolean;
    isToday: boolean;
  }) => {
    if (!day.isCurrentMonth) {
      return "#f9fafb";
    }

    if (day.attendance) {
      if (day.attendance.status === "absent") {
        return "#f34040"; // Red for absent
      } else if (day.attendance.status === "present") {
        return "#10b981"; // Green for present
      } else if (day.attendance.status === "not_applicable") {
        return "#3b82f6"; // Blue for weekly off/not applicable
      }
    }

    return "#ffffff"; // Default white for no attendance data
  };

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
              {calendarData.siteName} • {calendarData.month} {calendarData.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const year = currentMonth.getFullYear();
              const month = currentMonth.getMonth() + 1;
              navigate(
                `/salary-slip/${guardId}/${siteId}?year=${year}&month=${month}`
              );
            }}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Salary Slip
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWeeklyOffModal(true)}
            className="flex items-center gap-2"
          >
            <CalendarOff className="h-4 w-4" />
            Configure Weekly Off
          </Button>
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
            <div className="p-2 bg-orange-100 rounded-full">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Working Days</p>
              <p className="text-xl font-bold text-gray-900">
                {calendarData.summary.workingDays}
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
              <UserX className="h-5 w-5 text-red-600" />
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
            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
              <div
                key={dayOfWeek}
                className="p-2 text-center text-sm font-medium text-gray-500 relative"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{getDayShortName(dayOfWeek)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDayOfWeekMenu(
                        dayOfWeekMenu === dayOfWeek ? null : dayOfWeek
                      );
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    title={`Mark all ${getDayName(dayOfWeek)}s`}
                  >
                    <MoreVertical className="h-3 w-3 text-gray-400" />
                  </button>
                </div>

                {/* Day of Week Menu */}
                {dayOfWeekMenu === dayOfWeek && (
                  <div
                    ref={dayOfWeekMenuRef}
                    className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[160px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                        Mark all {getDayName(dayOfWeek)}s
                      </div>
                      <button
                        onClick={() =>
                          handleMarkDayOfWeek(dayOfWeek, "present")
                        }
                        disabled={markingDayOfWeek}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Mark as Present
                      </button>
                      <button
                        onClick={() => handleMarkDayOfWeek(dayOfWeek, "absent")}
                        disabled={markingDayOfWeek}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                      >
                        <X className="h-4 w-4 text-red-600" />
                        Mark as Absent
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                style={{ background: handleDayColor(day) }}
                className={`p-2 aspect-square border rounded-lg cursor-pointer relative ${
                  day.isToday ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={(e) => handleDayClick(day, e)}
                title={
                  day.attendance?.status === "present"
                    ? "Click to view uploaded site photo"
                    : day.attendance?.status === "absent"
                    ? "Click to mark attendance"
                    : "Click to mark attendance"
                }
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <div
                      className={`text-sm font-medium ${
                        day.isCurrentMonth
                          ? day.attendance?.status === "absent" ||
                            day.attendance?.status === "present"
                            ? "text-white"
                            : day.attendance?.status === "not_applicable"
                            ? "text-gray-600"
                            : "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                    {day.isCurrentMonth && (
                      <button
                        className="action-menu-button p-0.5 hover:bg-black/10 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuDay(
                            actionMenuDay === day.dateString
                              ? null
                              : day.dateString
                          );
                        }}
                        title="Mark attendance"
                      >
                        <MoreVertical
                          className={`h-3 w-3 ${
                            day.attendance?.status === "present" ||
                            day.attendance?.status === "absent"
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {day.attendance && day.attendance.checkInTime && (
                    <div className="mt-1 text-xs text-white text-center">
                      {formatTime(day.attendance.checkInTime)}
                    </div>
                  )}

                  {/* Action Menu */}
                  {actionMenuDay === day.dateString && day.isCurrentMonth && (
                    <div
                      ref={menuRef}
                      className="absolute top-[1.5rem] left-[-4rem] mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        {day.attendance?.status === "present" &&
                          day.attendance?.photoUrl &&
                          day.attendance.photoUrl !== "manual-marking" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (day.attendance?.photoUrl) {
                                    window.open(
                                      day.attendance.photoUrl,
                                      "_blank"
                                    );
                                  }
                                  setActionMenuDay(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                View Image
                              </button>
                              <div className="border-t my-1"></div>
                            </>
                          )}
                        <button
                          onClick={() =>
                            handleMarkAttendance(day.dateString, "present")
                          }
                          disabled={markingAttendance}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Mark as Present
                        </button>
                        <button
                          onClick={() =>
                            handleMarkAttendance(day.dateString, "absent")
                          }
                          disabled={markingAttendance}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          <X className="h-4 w-4 text-red-600" />
                          Mark as Absent
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center shadow-md">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-gray-600">
                Present (photo uploaded)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded shadow-md"
                style={{ backgroundColor: "#f34040" }}
              ></div>
              <span className="text-sm text-gray-600">Absent (no photo)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#3b82f6" }}
              ></div>
              <span className="text-sm text-gray-600">
                Weekly Off / Not applicable
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Photo Modal */}
      {selectedDay && selectedDayData && (
        <Modal
          isOpen={!!selectedDay && !!selectedDayData}
          onClose={closePhotoModal}
          title={`Attendance Photo - ${new Date(
            selectedDay
          ).toLocaleDateString()}`}
          size="md"
        >
          {selectedDayData.photoUrl &&
          selectedDayData.photoUrl !== "manual-marking" ? (
            <div className="space-y-4">
              <img
                src={selectedDayData.photoUrl}
                alt="Attendance site photo"
                className="w-full h-64 object-contain rounded-lg"
              />
              {selectedDayData.checkInTime && (
                <div className="text-sm text-gray-600">
                  <strong>Check-in time:</strong>{" "}
                  {formatTime(selectedDayData.checkInTime)}
                </div>
              )}
              {selectedDayData.notes && (
                <div className="text-sm text-gray-600">
                  <strong>Notes:</strong> {selectedDayData.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No photo available</p>
            </div>
          )}
        </Modal>
      )}

      {/* Weekly Off Configuration Modal */}
      <Modal
        isOpen={showWeeklyOffModal}
        onClose={() => setShowWeeklyOffModal(false)}
        title="Configure Weekly Off Days"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowWeeklyOffModal(false)}
              disabled={loadingWeeklyOff}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWeeklyOff}
              disabled={loadingWeeklyOff}
              className="flex items-center gap-2"
            >
              {loadingWeeklyOff && (
                <span className="inline-block h-4 w-4 border-2 border-white/70 border-b-transparent rounded-full animate-spin" />
              )}
              Save Configuration
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Select the days of the week that should be marked as weekly off. All
            occurrences of the selected days will be marked as weekly off.
          </p>
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
            <label
              key={dayOfWeek}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={weeklyOffDays.includes(dayOfWeek)}
                onChange={() => toggleWeeklyOffDay(dayOfWeek)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {getDayName(dayOfWeek)}
              </span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};
