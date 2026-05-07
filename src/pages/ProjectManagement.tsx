import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Building,
  DollarSign,
  Users,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
} from "lucide-react";
import {
  Card,
  Button,
  Select,
  Input,
  Textarea,
  LoadingSpinner,
  Modal,
} from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
import toast from "react-hot-toast";
import apiService from "../services/api";
import {
  projectValidationSchema,
  ProjectFormData,
} from "../lib/validations/project";

// Types and Interfaces
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

interface Site {
  _id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
}

interface Guard {
  _id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  isDeleted: boolean;
}

interface ProjectFilters {
  status: string;
  siteId: string;
  guardId: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  closedProjects: number;
  onHoldProjects: number;
  totalMonthlyCost: number;
  totalGuardsAssigned: number;
}

interface SalarySlipFormData {
  year: number;
  month: number;
}

type OverviewCardConfig = {
  id: string;
  label: string;
  value: number | string;
  subText?: string;
  icon: typeof Building;
  iconWrapper: string;
  iconColor: string;
  statusBreakdown?: { label: string; value: number; color: string }[];
};

const salarySlipSchema = yup.object().shape({
  year: yup
    .number()
    .required("Year is required")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  month: yup
    .number()
    .required("Month is required")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
});

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

// Project Form Component
interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onClose,
  onSubmit,
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(
    new Set([0])
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectValidationSchema) as any,
    mode: "onChange",
    defaultValues: {
      projectName: project?.projectName || "",
      siteId: project?.siteId?._id || "",
      status: project?.status || "Active",
      guardAssignments: project?.guardAssignments?.map((assignment) => ({
        guardId: assignment.guardId,
        startDate: assignment.startDate
          ? assignment.startDate.split("T")[0]
          : "",
        endDate: assignment.endDate ? assignment.endDate.split("T")[0] : null,
        shiftType: assignment.shiftType,
        monthlyRate: assignment.monthlyRate,
      })) || [
        {
          guardId: "",
          startDate: "",
          endDate: null,
          shiftType: "Full Day" as const,
          monthlyRate: 0,
        },
      ],
      description: project?.description || "",
      specialInstructions: project?.specialInstructions || "",
    },
  });

  const watchedAssignments = watch("guardAssignments");

  const toggleAssignmentExpand = (index: number) => {
    const copy = new Set(expandedAssignments);
    if (copy.has(index)) {
      copy.delete(index);
    } else {
      copy.add(index);
    }
    setExpandedAssignments(copy);
  };

  // Memoized options for better performance
  const siteOptions = useMemo(
    () =>
      sites.map((site) => ({
        value: site._id,
        label: `${site.name} - ${site.city}`,
      })),
    [sites]
  );

  const guardOptions = useMemo(
    () =>
      guards.map((guard) => ({
        value: guard._id,
        label: `${guard.firstName} ${guard.lastName} - ${guard.contactNumber}`,
      })),
    [guards]
  );

  const statusOptions = useMemo(
    () => [
      { value: "Active", label: "Active" },
      { value: "On Hold", label: "On Hold" },
      { value: "Closed", label: "Closed" },
    ],
    []
  );

  const shiftTypeOptions = useMemo(
    () => [
      { value: "Full Day", label: "Full Day" },
      { value: "Full Night", label: "Full Night" },
      { value: "Half Day", label: "Half Day" },
      { value: "Half Night", label: "Half Night" },
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sitesResponse, guardsResponse] = await Promise.all([
          apiService.getActiveSites(),
          apiService.getGuards(),
        ]);

        setSites(sitesResponse.data || []);
        setGuards(guardsResponse.data.guards || []);
      } catch (error) {
        toast.error("Failed to load data. Please try again.");
        console.error("Error fetching form data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addGuardAssignment = () => {
    const currentAssignments = watchedAssignments || [];
    setValue("guardAssignments", [
      ...currentAssignments,
      {
        guardId: "",
        startDate: "",
        endDate: null,
        shiftType: "Full Day",
        monthlyRate: 0,
      },
    ]);
  };

  const removeGuardAssignment = (index: number) => {
    const currentAssignments = watchedAssignments || [];
    if (currentAssignments.length > 1) {
      setValue(
        "guardAssignments",
        currentAssignments.filter((_, i) => i !== index)
      );
    }
  };

  const updateGuardAssignment = (
    index: number,
    field: keyof ProjectFormData["guardAssignments"][number],
    value: string | number | null
  ) => {
    const currentAssignments = watchedAssignments || [];
    const updatedAssignments = [...currentAssignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value,
    };
    setValue("guardAssignments", updatedAssignments);
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up the data before sending to API
      const cleanedData = {
        ...data,
        // Ensure description and specialInstructions are null if empty
        description:
          data.description && data.description.trim() !== ""
            ? data.description
            : null,
        specialInstructions:
          data.specialInstructions && data.specialInstructions.trim() !== ""
            ? data.specialInstructions
            : null,
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} size="md" showCloseButton={false}>
        <LoadingSpinner size="lg" message="Loading form data..." />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={project ? "Edit Project" : "Create New Project"}
      size="5xl"
      contentClassName="p-0"
    >
      <div className="p-6">

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Project Name"
                {...register("projectName")}
                placeholder="Enter project name"
                error={errors.projectName?.message}
                required
              />

              <Select
                label="Site"
                options={siteOptions}
                value={watch("siteId")}
                onValueChange={(value) => setValue("siteId", value)}
                placeholder="Select a site"
                error={errors.siteId?.message}
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as ProjectStatus)
                }
                error={errors.status?.message}
              />
            </div>

            {/* Guard Assignments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Guard Assignments *
                </label>
                <Button
                  type="button"
                  onClick={addGuardAssignment}
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  Add Guard
                </Button>
              </div>

              {watchedAssignments?.map((assignment, index) => {
                const guardLabel =
                  guardOptions.find((g) => g.value === assignment.guardId)
                    ?.label || "Select guard";
                const dateRange = `${assignment.startDate || "--/--/----"} - ${
                  assignment.endDate || "Ongoing"
                }`;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg mb-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Guard Assignment {index + 1}
                        </h4>
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="mr-2">{guardLabel}</span>
                          <span className="mx-2">•</span>
                          <span className="mr-2">{assignment.shiftType}</span>
                          <span className="mx-2">•</span>
                          <span>{dateRange}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {watchedAssignments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGuardAssignment(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            disabled={isSubmitting}
                            title="Remove assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleAssignmentExpand(index)}
                          className="text-gray-500 hover:text-gray-700"
                          title={
                            expandedAssignments.has(index)
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          {expandedAssignments.has(index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedAssignments.has(index) && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Select
                            wrapperClassName="bg-transparent"
                            label="Guard"
                            options={guardOptions}
                            value={assignment.guardId}
                            onValueChange={(value) =>
                              updateGuardAssignment(index, "guardId", value)
                            }
                            placeholder="Select a guard"
                            disabled={isSubmitting}
                          />

                          <Select
                            wrapperClassName="bg-transparent"
                            label="Shift Type"
                            options={shiftTypeOptions}
                            value={assignment.shiftType}
                            onValueChange={(value) =>
                              updateGuardAssignment(
                                index,
                                "shiftType",
                                value as ShiftType
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Start Date"
                            type="date"
                            value={assignment.startDate || ""}
                            onChange={(e) =>
                              updateGuardAssignment(
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            disabled={isSubmitting}
                          />

                          <Input
                            label="End Date"
                            type="date"
                            value={assignment.endDate || ""}
                            onChange={(e) =>
                              updateGuardAssignment(
                                index,
                                "endDate",
                                e.target.value || null
                              )
                            }
                            disabled={isSubmitting}
                          />

                          <Input
                            label="Monthly Rate (₹)"
                            type="number"
                            value={assignment.monthlyRate}
                            onChange={(e) =>
                              updateGuardAssignment(
                                index,
                                "monthlyRate",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            min="0"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {errors.guardAssignments && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600">
                    {errors.guardAssignments.message}
                  </p>
                </div>
              )}
            </div>

            {/* Description and Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Description"
                {...register("description")}
                rows={3}
                placeholder="Project description..."
                error={errors.description?.message}
                disabled={isSubmitting}
              />

              <Textarea
                label="Special Instructions"
                {...register("specialInstructions")}
                rows={3}
                placeholder="Special instructions for guards..."
                error={errors.specialInstructions?.message}
                disabled={isSubmitting}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : project ? (
                  "Update Project"
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </div>
    </Modal>
  );
};

// Main Project Management Component
const ProjectManagement: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);
  const [selectedSalaryProject, setSelectedSalaryProject] =
    useState<Project | null>(null);
  const [selectedSalaryGuard, setSelectedSalaryGuard] =
    useState<GuardAssignment | null>(null);
  const [generatingSalarySlip, setGeneratingSalarySlip] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>({
    status: "",
    siteId: "",
    guardId: "",
  });
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    closedProjects: 0,
    onHoldProjects: 0,
    totalMonthlyCost: 0,
    totalGuardsAssigned: 0,
  });

  const {
    register: salarySlipRegister,
    handleSubmit: handleSalarySlipSubmit,
    reset: resetSalarySlipForm,
    formState: { errors: salarySlipErrors },
  } = useForm<SalarySlipFormData>({
    resolver: yupResolver(salarySlipSchema) as any,
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });

  // Memoized options for filters
  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: "All Statuses" },
      { value: "Active", label: "Active" },
      { value: "On Hold", label: "On Hold" },
      { value: "Closed", label: "Closed" },
    ],
    []
  );

  const siteFilterOptions = useMemo(
    () => [
      { value: "", label: "All Sites" },
      ...sites.map((site) => ({
        value: site._id,
        label: site.name,
      })),
    ],
    [sites]
  );

  const guardFilterOptions = useMemo(
    () => [
      { value: "", label: "All Guards" },
      ...guards.map((guard) => ({
        value: guard._id,
        label: `${guard.firstName} ${guard.lastName}`,
      })),
    ],
    [guards]
  );

  const activeAssignmentsCount = useMemo(
    () =>
      projects.reduce((sum, project) => {
        const activeAssignments = (project.guardAssignments || []).filter(
          (assignment) => assignment.isActive !== false
        );
        return sum + activeAssignments.length;
      }, 0),
    [projects]
  );

  const currentMonthName = useMemo(() => monthNames[new Date().getMonth()], []);

  const overviewCards = useMemo<OverviewCardConfig[]>(
    () => [
      {
        id: "total-projects",
        label: "Total Projects",
        value: stats.totalProjects,
        subText: `${stats.activeProjects} active across all sites`,
        icon: Building,
        iconWrapper: "bg-blue-50",
        iconColor: "text-blue-600",
        statusBreakdown: [
          {
            label: "Active",
            value: stats.activeProjects,
            color: "bg-green-500",
          },
          {
            label: "On Hold",
            value: stats.onHoldProjects,
            color: "bg-yellow-500",
          },
          {
            label: "Closed",
            value: stats.closedProjects,
            color: "bg-gray-400",
          },
        ],
      },
      {
        id: "monthly-cost",
        label: "Monthly Cost",
        value: `₹${stats.totalMonthlyCost.toLocaleString()}`,
        subText: "Projected monthly billing",
        icon: DollarSign,
        iconWrapper: "bg-green-50",
        iconColor: "text-green-600",
      },
      {
        id: "guards-assigned",
        label: "Guards Assigned",
        value: stats.totalGuardsAssigned,
        subText: "Across every project",
        icon: Users,
        iconWrapper: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        id: "salary-slips",
        label: `${currentMonthName} Salary Slips`,
        value: activeAssignmentsCount,
        subText: "Guards needing slips this month",
        icon: FileText,
        iconWrapper: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
    ],
    [
      activeAssignmentsCount,
      currentMonthName,
      stats.totalGuardsAssigned,
      stats.totalMonthlyCost,
      stats.totalProjects,
      stats.activeProjects,
      stats.closedProjects,
      stats.onHoldProjects,
    ]
  );

  const salarySlipYearOptions = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i),
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsResponse, sitesResponse, guardsResponse, statsResponse] =
        await Promise.all([
          apiService.getProjects(filters),
          apiService.getActiveSites(),
          apiService.getGuards(),
          apiService.getProjectStats(),
        ]);

      const fetchedProjects = projectsResponse.data.projects || [];
      setProjects(fetchedProjects);
      setSites(sitesResponse.data || []);
      setGuards(guardsResponse.data.guards || []);
      const serverStats = statsResponse.data.stats || {
        totalProjects: 0,
        activeProjects: 0,
        closedProjects: 0,
        onHoldProjects: 0,
        totalMonthlyCost: 0,
        totalGuardsAssigned: 0,
      };

      // Recompute monthly cost on the client to ensure correctness
      const computedMonthlyCost = fetchedProjects.reduce(
        (sum: number, p: Project) => {
          const projectTotal = (p.guardAssignments || [])
            .filter((a) => a.isActive !== false)
            .reduce((s, a) => s + (a.monthlyRate || 0), 0);
          return sum + projectTotal;
        },
        0
      );

      setStats({ ...serverStats, totalMonthlyCost: computedMonthlyCost });
    } catch (error) {
      toast.error("Failed to load projects. Please try again.");
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      await apiService.createProject(data);
      toast.success("Project created successfully");
      setShowForm(false);
      await fetchData();
    } catch (error) {
      toast.error("Failed to create project. Please try again.");
      console.error("Error creating project:", error);
      throw error; // Re-throw to handle in form
    }
  };

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!editingProject) return;

    try {
      await apiService.updateProject(editingProject._id, data);
      toast.success("Project updated successfully");
      setShowForm(false);
      setEditingProject(undefined);
      await fetchData();
    } catch (error) {
      toast.error("Failed to update project. Please try again.");
      console.error("Error updating project:", error);
      throw error; // Re-throw to handle in form
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    try {
      await apiService.deleteProject(deletingProject._id);
      toast.success("Project deleted successfully");
      setShowDeleteModal(false);
      setDeletingProject(undefined);
      await fetchData();
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error("Error deleting project:", error);
    }
  };

  const toggleRowExpansion = (projectId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(projectId)) {
      newExpandedRows.delete(projectId);
    } else {
      newExpandedRows.add(projectId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleOpenSalarySlipModal = (
    project: Project,
    assignment: GuardAssignment
  ) => {
    setSelectedSalaryProject(project);
    setSelectedSalaryGuard(assignment);
    resetSalarySlipForm({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    setShowSalarySlipModal(true);
  };

  const handleCloseSalarySlipModal = () => {
    setShowSalarySlipModal(false);
    setSelectedSalaryGuard(null);
    setSelectedSalaryProject(null);
  };

  const onSalarySlipSubmit = async (data: SalarySlipFormData) => {
    if (!selectedSalaryProject || !selectedSalaryGuard) {
      toast.error("Select a guard to generate salary slip");
      return;
    }

    const siteId = selectedSalaryProject.siteId?._id;
    if (!siteId) {
      toast.error("Site information is missing for this project");
      return;
    }

    try {
      setGeneratingSalarySlip(true);
      await apiService.getSalarySlip(
        selectedSalaryGuard.guardId,
        siteId,
        data.year,
        data.month
      );
      toast.success("Salary slip generated successfully");
      setShowSalarySlipModal(false);
      navigate(
        `/salary-slip/${selectedSalaryGuard.guardId}/${siteId}?year=${data.year}&month=${data.month}`
      );
    } catch (error: any) {
      console.error("Error generating salary slip:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate salary slip";
      toast.error(errorMessage);
    } finally {
      setGeneratingSalarySlip(false);
    }
  };

  // Utility functions for styling
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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Project Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage guard assignments and project schedules
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                    {card.subText && (
                      <p className="text-xs text-gray-500 mt-2">
                        {card.subText}
                      </p>
                    )}
                    {card.statusBreakdown && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {card.statusBreakdown.map((status) => (
                          <div
                            key={`${card.id}-${status.label}`}
                            className="rounded-md flex items-center justify-center gap-2"
                          >
                            <span className="sr-only">{status.label}</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${status.color}`}
                              aria-hidden="true"
                            ></span>
                            <span className="text-sm font-semibold text-gray-500">
                              {status.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${card.iconWrapper}`}
                  >
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            options={statusFilterOptions}
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
            placeholder="Filter by status"
          />

          <Select
            label="Site"
            options={siteFilterOptions}
            value={filters.siteId}
            onValueChange={(value) => setFilters({ ...filters, siteId: value })}
            placeholder="Filter by site"
          />

          <Select
            label="Guard"
            options={guardFilterOptions}
            value={filters.guardId}
            onValueChange={(value) =>
              setFilters({ ...filters, guardId: value })
            }
            placeholder="Filter by guard"
          />
        </div>
      </Card>

      {/* Projects Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guards
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <React.Fragment key={project._id}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleRowExpansion(project._id)}
                          className="mr-2 text-gray-400 hover:text-gray-600"
                        >
                          {expandedRows.has(project._id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {project.projectName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {project.projectId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {project.siteId.name}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {project.siteId.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {project.guardAssignments.length} guard
                          {project.guardAssignments.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />₹
                        {(project.guardAssignments || [])
                          .filter((a) => a.isActive !== false)
                          .reduce((s, a) => s + (a.monthlyRate || 0), 0)
                          .toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/bills/generate/${project._id}`)
                          }
                          className="text-purple-600 hover:text-purple-900"
                          title="Generate Bill"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingProject(project);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Guard Details */}
                  {expandedRows.has(project._id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Guard Assignments ({project.guardAssignments.length}
                            )
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {project.guardAssignments.map(
                              (assignment, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                          {assignment.guardName}
                                        </span>
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getShiftTypeColor(
                                            assignment.shiftType
                                          )}`}
                                        >
                                          {assignment.shiftType}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span className="mr-2">
                                          Date Range:
                                        </span>
                                        <span className="font-medium">
                                          {new Date(
                                            assignment.startDate
                                          ).toLocaleDateString()}{" "}
                                          -{" "}
                                          {assignment.endDate
                                            ? new Date(
                                                assignment.endDate
                                              ).toLocaleDateString()
                                            : "Ongoing"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">
                                        Monthly Rate
                                      </div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        ₹
                                        {assignment.monthlyRate.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleOpenSalarySlipModal(
                                          project,
                                          assignment
                                        )
                                      }
                                    >
                                      <FileText className="h-3.5 w-3.5 mr-1" />
                                      Salary Slip
                                    </Button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                          {(project.description ||
                            project.specialInstructions) && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Project Details
                              </h4>
                              {project.description && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Description:
                                  </span>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {project.description}
                                  </p>
                                </div>
                              )}
                              {project.specialInstructions && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Special Instructions:
                                  </span>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {project.specialInstructions}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No projects found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some((filter) => filter !== "")
                ? "Try adjusting your filters to see more results."
                : "Get started by creating a new project."}
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(undefined);
          }}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        />
      )}

      {showSalarySlipModal && selectedSalaryProject && selectedSalaryGuard && (
        <Modal
          isOpen={true}
          onClose={handleCloseSalarySlipModal}
          title="Salary Slip"
          subtitle={`${selectedSalaryGuard.guardName} • ${selectedSalaryProject.projectName}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseSalarySlipModal}
                disabled={generatingSalarySlip}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="salary-slip-form"
                disabled={generatingSalarySlip}
              >
                {generatingSalarySlip ? "Generating..." : "Generate & View"}
              </Button>
            </div>
          }
        >
          <form
            id="salary-slip-form"
            onSubmit={handleSalarySlipSubmit(onSalarySlipSubmit)}
            className="space-y-4"
          >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...salarySlipRegister("year", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={generatingSalarySlip}
                  >
                    {salarySlipYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {salarySlipErrors.year && (
                    <p className="text-sm text-red-500 mt-1">
                      {salarySlipErrors.year.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...salarySlipRegister("month", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={generatingSalarySlip}
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  {salarySlipErrors.month && (
                    <p className="text-sm text-red-500 mt-1">
                      {salarySlipErrors.month.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Ensure attendance is updated for the selected period before
                generating slips. Each guard receives one slip per project per
                month.
              </div>
            </form>
        </Modal>
      )}

      {showDeleteModal && deletingProject && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingProject(undefined);
          }}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          message={`Are you sure you want to delete the project "${deletingProject.projectName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default ProjectManagement;
