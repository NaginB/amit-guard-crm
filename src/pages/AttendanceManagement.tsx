import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw,
  MapPin,
  User,
} from "lucide-react";
import { Card, Button, Select } from "../components/common";
import { MonthlyAttendanceCalendar } from "../components/attendance/MonthlyAttendanceCalendar";
import apiService from "../services/api";
import toast from "react-hot-toast";

interface Guard {
  _id: string;
  firstName: string;
  lastName: string;
  guardId: string;
}

interface Project {
  _id: string;
  projectId: number;
  projectName: string;
  siteId: {
    _id: string;
    name: string;
    address: string;
    city: string;
  };
  status: "Active" | "Closed" | "On Hold";
}

interface AttendanceAnalytics {
  totalGuards: number;
  totalProjects: number;
  totalSites: number;
  overallAttendancePercentage: number;
  projectAttendance: Array<{
    projectId: string;
    projectName: string;
    siteName: string;
    guardCount: number;
    averageAttendance: number;
  }>;
  guardAttendance: Array<{
    guardId: string;
    guardName: string;
    totalProjects: number;
    averageAttendance: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    averageAttendance: number;
    presentDays: number;
    absentDays: number;
  }>;
}

export const AttendanceManagement: React.FC = () => {
  const { projectId: urlProjectId, guardId: urlGuardId } = useParams<{
    projectId?: string;
    guardId?: string;
  }>();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectGuards, setProjectGuards] = useState<Guard[]>([]);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics>({
    totalGuards: 0,
    totalProjects: 0,
    totalSites: 0,
    overallAttendancePercentage: 0,
    projectAttendance: [],
    guardAttendance: [],
    monthlyTrends: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedGuardId, setSelectedGuardId] = useState<string>(
    urlGuardId || ""
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    urlProjectId || ""
  );
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      setLoadingProjects(true);
      await loadProjects();
      setLoadingProjects(false);
      loadAnalytics();
    };
    initializeData();
  }, []);

  // Load data from URL params after projects are loaded
  useEffect(() => {
    if (!loadingProjects && urlProjectId && urlGuardId && projects.length > 0) {
      const project = projects.find((p) => p._id === urlProjectId);
      if (project) {
        setSelectedSiteId(project.siteId._id);
        setSelectedProjectId(urlProjectId);
        setSelectedGuardId(urlGuardId);
        loadProjectGuards(urlProjectId);
      }
    }
  }, [urlProjectId, urlGuardId, projects, loadingProjects]);

  // Automatically show calendar when both guard, project, and site are selected
  useEffect(() => {
    if (selectedGuardId && selectedProjectId && selectedSiteId) {
      setShowCalendar(true);
      // Update URL when both are selected
      navigate(`/attendance/${selectedProjectId}/${selectedGuardId}`, {
        replace: true,
      });
    } else {
      setShowCalendar(false);
      // Navigate back to base attendance page if selections are cleared
      if (!selectedGuardId && !selectedProjectId) {
        navigate("/attendance", { replace: true });
      }
    }
  }, [selectedGuardId, selectedProjectId, selectedSiteId, navigate]);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects({ status: "Active" });
      if (response.status === "success") {
        setProjects(response.data.projects || []);
        return true;
      } else {
        throw new Error("Failed to load projects");
      }
    } catch (error: unknown) {
      console.error("Error loading projects:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load projects";
      toast.error(errorMessage);
      return false;
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getAttendanceAnalytics();
      if (response.status === "success") {
        setAnalytics(response.data);
      } else {
        throw new Error("Failed to load analytics");
      }
    } catch (error: unknown) {
      console.error("Error loading analytics:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load analytics";
      toast.error(errorMessage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
    loadAnalytics();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const loadProjectGuards = async (projectId: string) => {
    try {
      const response = await apiService.getGuardsByProject(projectId);
      if (response.status === "success") {
        setProjectGuards(response.data.guards || []);
      }
    } catch (error: unknown) {
      console.error("Error loading project guards:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load project guards";
      toast.error(errorMessage);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p._id === projectId);
    if (project) {
      setSelectedSiteId(project.siteId._id);
    }

    setSelectedProjectId(projectId);
    setSelectedGuardId(""); // Reset guard selection
    setShowCalendar(false); // Hide calendar

    // Navigate back to base attendance page when project changes
    // URL will be updated when guard is also selected
    navigate("/attendance", { replace: true });

    if (projectId) {
      loadProjectGuards(projectId);
    } else {
      setProjectGuards([]);
    }
  };

  const handleGuardChange = (guardId: string) => {
    setSelectedGuardId(guardId);
    // URL will be updated by the useEffect that watches selectedGuardId and selectedProjectId
  };

  const handleBackToSelection = () => {
    setShowCalendar(false);
    setSelectedGuardId("");
    setSelectedProjectId("");
    navigate("/attendance", { replace: true });
  };

  // Show loading state while projects are loading
  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Only show calendar if we have all required data
  if (showCalendar && selectedGuardId && selectedSiteId) {
    return (
      <MonthlyAttendanceCalendar
        guardId={selectedGuardId}
        siteId={selectedSiteId}
        onBack={handleBackToSelection}
      />
    );
  }

  const selectedGuard = projectGuards.find((g) => g._id === selectedGuardId);
  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track guard attendance automatically based on site photo uploads
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Guards */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Guards</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalGuards}
              </p>
              <p className="text-sm text-gray-500">
                Across {analytics.totalProjects} projects
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Sites */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalProjects}
              </p>
              <p className="text-sm text-gray-500">Active projects</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Overall Attendance */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Overall Attendance
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overallAttendancePercentage}%
              </p>
              <p className="text-sm text-gray-500">Average across all guards</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Active Projects */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
              <p className="text-sm text-gray-500">Available projects</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Project and Guard Selection */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Project and Guard
            </h3>
            <p className="text-sm text-gray-500">
              Choose a project and guard to automatically view monthly
              attendance calendar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 inline mr-2" />
                Select Project
              </label>
              <Select
                value={selectedProjectId}
                onValueChange={handleProjectChange}
                placeholder="Choose a project..."
                options={projects.map((project) => ({
                  value: project._id,
                  label: `${project.projectName} - ${project.siteId.name}`,
                }))}
              />
              {selectedProject && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">
                    {selectedProject.projectName}
                  </p>
                  <p className="text-xs text-green-700">
                    {selectedProject.siteId.name}, {selectedProject.siteId.city}
                  </p>
                </div>
              )}
            </div>

            {/* Guard Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-2" />
                Select Guard
              </label>
              <Select
                value={selectedGuardId}
                onValueChange={handleGuardChange}
                placeholder={
                  selectedProjectId
                    ? "Choose a guard..."
                    : "Select a project first"
                }
                disabled={!selectedProjectId}
                options={projectGuards.map((guard) => ({
                  value: guard._id,
                  label: `${guard.firstName} ${guard.lastName} (${guard.guardId})`,
                }))}
              />
              {selectedGuard && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedGuard.firstName} {selectedGuard.lastName}
                  </p>
                  <p className="text-xs text-blue-700">
                    Guard ID: {selectedGuard.guardId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              How Photo-Based Attendance Works:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • First select a project, then choose a guard working on that
                project
              </li>
              <li>
                • Calendar automatically appears when both project and guard are
                selected
              </li>
              <li>
                • Guards upload photos of the site to automatically mark
                attendance
              </li>
              <li>
                • Green boxes indicate present days (photo uploaded for that
                date)
              </li>
              <li>• Red boxes indicate absent days (no photo uploaded)</li>
              <li>• Click on green boxes to view the uploaded site photos</li>
              <li>
                • No manual entry required - attendance is tracked automatically
              </li>
              <li>
                • If no photo is uploaded for a day, guard is marked as absent
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
