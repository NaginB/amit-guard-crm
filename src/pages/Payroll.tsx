import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Select,
  Input,
  LoadingSpinner,
} from "../components/common";
import apiService from "../services/api";
import { Users, FileText, Calendar, AlertCircle } from "lucide-react";

type ShiftType = "Full Day" | "Full Night" | "Half Day" | "Half Night";

interface GuardAssignment {
  guardId: string;
  guardName: string;
  shiftType: ShiftType;
  monthlyRate: number;
  isActive?: boolean;
}

interface ProjectListItem {
  _id: string;
  projectName: string;
  siteId:
    | string
    | {
        _id: string;
        name: string;
        address: string;
        city: string;
      };
  guardAssignments: GuardAssignment[];
}

interface PayrollFormData {
  projectId: string;
  guardId: string;
  year: number;
  month: number;
}

const payrollFormSchema = yup.object().shape({
  projectId: yup.string().required("Project is required"),
  guardId: yup.string().required("Guard is required"),
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

const shiftTimingMap: Record<ShiftType, string> = {
  "Full Day": "06:00 AM - 06:00 PM",
  "Full Night": "06:00 PM - 06:00 AM",
  "Half Day": "06:00 AM - 12:00 PM",
  "Half Night": "06:00 PM - 12:00 AM",
};

export const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedSlips, setGeneratedSlips] = useState<Set<string>>(
    () => new Set()
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PayrollFormData>({
    resolver: yupResolver(payrollFormSchema) as any,
    defaultValues: {
      projectId: "",
      guardId: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });

  const selectedProjectId = watch("projectId");
  const selectedGuardId = watch("guardId");
  const selectedYear = watch("year");
  const selectedMonth = watch("month");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProjects();
        const fetchedProjects = response.data.projects || [];
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0) {
          setValue("projectId", fetchedProjects[0]._id);
          const firstGuard = fetchedProjects[0].guardAssignments?.find(
            (assignment: GuardAssignment) => assignment?.guardId
          );
          if (firstGuard?.guardId) {
            setValue("guardId", firstGuard.guardId);
          }
        }
      } catch (err: any) {
        console.error("Error loading projects:", err);
        setError(
          err.response?.data?.message || "Failed to load payroll overview"
        );
        toast.error("Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [setValue]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const guardOptions = useMemo(() => {
    const assignments = selectedProject?.guardAssignments || [];
    return assignments
      .filter((assignment) => assignment.guardId)
      .map((assignment) => ({
        value: assignment.guardId,
        label: assignment.guardName,
      }));
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && guardOptions.length > 0) {
      const guardExists = guardOptions.some(
        (option) => option.value === selectedGuardId
      );
      if (!guardExists) {
        setValue("guardId", guardOptions[0]?.value || "");
      }
    } else {
      setValue("guardId", "");
    }
  }, [selectedProject, guardOptions, selectedGuardId, setValue]);

  const guardAssignments = useMemo(() => {
    return (selectedProject?.guardAssignments || []).filter(
      (assignment) => assignment.guardId && assignment.isActive !== false
    );
  }, [selectedProject]);

  const totalActiveGuards = useMemo(
    () =>
      projects.reduce((sum, project) => {
        const activeAssignments = (project.guardAssignments || []).filter(
          (assignment) => assignment.guardId && assignment.isActive !== false
        );
        return sum + activeAssignments.length;
      }, 0),
    [projects]
  );

  const getSiteIdFromProject = (project: ProjectListItem): string | null => {
    const site = project.siteId as
      | string
      | { _id: string; name: string; address: string; city: string };
    if (!site) return null;
    return typeof site === "string" ? site : site._id;
  };

  const handleGenerateSalarySlip = async (
    guardId: string,
    project: ProjectListItem
  ) => {
    const siteId = getSiteIdFromProject(project);
    if (!siteId) {
      toast.error("Site information is missing for this project");
      return;
    }

    const slipKey = `${guardId}-${siteId}-${selectedYear}-${selectedMonth}`;
    const navigateToSlip = () =>
      navigate(
        `/salary-slip/${guardId}/${siteId}?year=${selectedYear}&month=${selectedMonth}`
      );

    if (generatedSlips.has(slipKey)) {
      navigateToSlip();
      return;
    }

    try {
      await apiService.getSalarySlip(
        guardId,
        siteId,
        selectedYear,
        selectedMonth
      );
      setGeneratedSlips((prev) => new Set(prev).add(slipKey));
      navigateToSlip();
    } catch (err: any) {
      console.error("Error generating salary slip:", err);
      toast.error(
        err.response?.data?.message || "Failed to generate salary slip"
      );
    }
  };

  const onSubmit = async (data: PayrollFormData) => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    await handleGenerateSalarySlip(data.guardId, selectedProject);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="Loading payroll data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payroll Overview</h1>
        <p className="text-gray-600 mt-1">
          Generate and view salary slips for guards across projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Active Guards</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalActiveGuards}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Salary Slip
        </h2>
        {projects.length === 0 ? (
          <div className="text-gray-600">No projects available.</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Project"
                placeholder="Select project"
                options={projects.map((project) => ({
                  value: project._id,
                  label: project.projectName,
                }))}
                value={selectedProjectId}
                onValueChange={(value) => setValue("projectId", value)}
              />
              <Select
                label="Guard"
                placeholder="Select guard"
                options={guardOptions}
                value={selectedGuardId}
                onValueChange={(value) => setValue("guardId", value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Year"
                  type="number"
                  min={2000}
                  max={2100}
                  {...register("year", { valueAsNumber: true })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("month", { valueAsNumber: true })}
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {(errors.projectId ||
              errors.guardId ||
              errors.year ||
              errors.month) && (
              <div className="text-sm text-red-600">
                {errors.projectId?.message ||
                  errors.guardId?.message ||
                  errors.year?.message ||
                  errors.month?.message}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="submit">Generate & View Salary Slip</Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Guard Assignments
            </h2>
            <p className="text-sm text-gray-500">
              Active guards for{" "}
              {selectedProject?.projectName || "selected project"}
            </p>
          </div>
        </div>

        {selectedProject ? (
          guardAssignments.length > 0 ? (
            <div className="overflow-x-auto -mx-6 mt-4">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guard
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Rate
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guardAssignments.map((assignment) => (
                      <tr key={assignment.guardId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.guardName}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {assignment.guardId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {assignment.shiftType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {shiftTimingMap[assignment.shiftType] ||
                              "As assigned"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {monthNames[selectedMonth - 1]} {selectedYear}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹{assignment.monthlyRate.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleGenerateSalarySlip(
                                assignment.guardId,
                                selectedProject
                              )
                            }
                          >
                            View Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              No active guard assignments for this project.
            </div>
          )
        ) : (
          <div className="text-sm text-gray-500">
            Select a project to view assignments.
          </div>
        )}
      </Card>
    </div>
  );
};
