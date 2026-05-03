import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  DollarSign,
  Users,
  MapPin,
  Clock,
  User,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, Button, LoadingSpinner } from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
import toast from "react-hot-toast";
import apiService from "../services/api";

// Types
type ProjectStatus = "Active" | "Closed" | "On Hold";
type ShiftType = "Full Day" | "Full Night" | "Half Day" | "Half Night";

interface GuardAssignment {
  guardId: string;
  guardName: string;
  startDate: string;
  endDate?: string | null;
  shiftType: ShiftType;
  monthlyRate: number;
  assignedDate: string;
  assignedBy: string;
  isActive: boolean;
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
  status: ProjectStatus;
  guardAssignments: GuardAssignment[];
  totalMonthlyCost: number;
  totalProjectCost?: number;
  description?: string;
  specialInstructions?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiService.getProject(id);
        setProject(response.data.project);
      } catch (error) {
        toast.error("Failed to load project details");
        console.error("Error fetching project:", error);
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!project) return;

    try {
      await apiService.deleteProject(project._id);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error("Error deleting project:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Closed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getShiftTypeColor = (shiftType: ShiftType): string => {
    switch (shiftType) {
      case "Full Day":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Full Night":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Half Day":
        return "bg-green-100 text-green-800 border-green-200";
      case "Half Night":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading project details..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The project you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/projects")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {project.projectName}
            </h1>
            <p className="text-gray-600">
              Project ID: {project.projectId} • Created{" "}
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${project._id}/edit`)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Project Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Project Name
                  </p>
                  <p className="text-sm text-gray-900 capitalize">
                    {project.projectName}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </Card>

          {/* Site Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Site Information
            </h2>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {project.siteId.name}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {project.siteId.city}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {project.siteId.address}
                </p>
              </div>
            </div>
          </Card>

          {/* Guard Assignments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Guard Assignments ({project.guardAssignments.length})
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-1" />
                Total: ₹
                {project.guardAssignments
                  .filter((a) => a.isActive !== false)
                  .reduce((s, a) => s + (a.monthlyRate || 0), 0)
                  .toLocaleString()}
                /month
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.guardAssignments.map((assignment, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {assignment.guardName}
                      </span>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getShiftTypeColor(
                        assignment.shiftType
                      )}`}
                    >
                      {assignment.shiftType}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Rate:</span>
                      <span className="font-medium">
                        ₹{assignment.monthlyRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Start Date:</span>
                      <span>
                        {assignment.startDate
                          ? new Date(assignment.startDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">End Date:</span>
                      <span>
                        {assignment.endDate
                          ? new Date(assignment.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assigned:</span>
                      <span>
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          assignment.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {assignment.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Project Details */}
          {(project.description || project.specialInstructions) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Project Details
              </h2>
              <div className="space-y-4">
                {project.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {project.description}
                    </p>
                  </div>
                )}
                {project.specialInstructions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {project.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-600">Total Guards</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {project.guardAssignments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-600">Monthly Cost</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  ₹
                  {project.guardAssignments
                    .filter((a) => a.isActive !== false)
                    .reduce((s, a) => s + (a.monthlyRate || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm text-gray-600">Duration</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Ongoing
                </span>
              </div>
            </div>
          </Card>

          {/* Project Timeline removed since dates are per assignment */}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${project.projectName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
