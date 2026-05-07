import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Receipt,
  Eye,
  Filter,
  Search,
  Plus,
  X,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Card,
  Button,
  Select,
  Input,
  LoadingSpinner,
  Textarea,
  ConfirmModal,
  Modal,
} from "../components/common";
import apiService from "../services/api";
import toast from "react-hot-toast";

interface Bill {
  _id: string;
  billNumber: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  month: number;
  year: number;
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  guardAssignments?: Array<{
    guardId: string;
    guardName: string;
    shiftType: string;
  }>;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "Pending" | "Overdue" | "Hold" | "Paid";
  generatedDate: string;
}

interface Project {
  _id: string;
  projectName: string;
}

interface BillingFilters {
  projectId: string;
  status: string;
  year: string;
  month: string;
}

interface BillingStats {
  totalBills: number;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  pendingBills: number;
  holdBills: number;
  paidBills: number;
  overdueBills: number;
}

interface CreateBillFormData {
  projectId: string;
  guardId?: string;
  year: number;
  month: number;
  tax?: number;
  notes?: string;
}

const billCreationSchema = yup.object().shape({
  projectId: yup.string().required("Project is required"),
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
  tax: yup
    .number()
    .min(0, "Tax must be 0 or greater")
    .max(100, "Tax cannot exceed 100%"),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters"),
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

export const BillingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats>({
    totalBills: 0,
    totalAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    pendingBills: 0,
    holdBills: 0,
    paidBills: 0,
    overdueBills: 0,
  });
  const [filters, setFilters] = useState<BillingFilters>({
    projectId: "",
    status: "",
    year: "",
    month: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editTax, setEditTax] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");
  const [updatingBill, setUpdatingBill] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingBill, setCreatingBill] = useState(false);
  const [selectedProjectGuards, setSelectedProjectGuards] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const {
    register: createBillRegister,
    handleSubmit: handleCreateBillSubmit,
    reset: resetCreateBillForm,
    watch: watchCreateBill,
    formState: { errors: createBillErrors },
  } = useForm<CreateBillFormData>({
    resolver: yupResolver(billCreationSchema) as any,
    defaultValues: {
      projectId: "",
      guardId: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      tax: 0,
      notes: "",
    },
  });

  const selectedProjectId = watchCreateBill("projectId");

  // Load guards when project is selected
  useEffect(() => {
    const loadGuardsForProject = async () => {
      if (!selectedProjectId) {
        setSelectedProjectGuards([]);
        return;
      }

      try {
        const project = projects.find((p) => p._id === selectedProjectId);
        if (project && (project as any).guardAssignments) {
          const guards = (project as any).guardAssignments
            .filter((assignment: any) => assignment.isActive)
            .map((assignment: any) => ({
              value: assignment.guardId,
              label: assignment.guardName || `Guard ${assignment.guardId}`,
            }));
          setSelectedProjectGuards(guards);
        } else {
          // Try to fetch project details if not in list
          const response = await apiService.getProject(selectedProjectId);
          if (response.status === "success" && response.data.project) {
            const project = response.data.project;
            const guards = (project.guardAssignments || [])
              .filter((assignment: any) => assignment.isActive)
              .map((assignment: any) => ({
                value: assignment.guardId,
                label: assignment.guardName || `Guard ${assignment.guardId}`,
              }));
            setSelectedProjectGuards(guards);
          } else {
            setSelectedProjectGuards([]);
          }
        }
      } catch (error) {
        console.error("Error loading guards for project:", error);
        setSelectedProjectGuards([]);
      }
    };

    loadGuardsForProject();
  }, [selectedProjectId, projects]);

  // Fetch all projects for filter
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiService.getProjects();
        if (response.status === "success") {
          setProjects(response.data.projects || []);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch bills
  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      // Get all projects first, then get bills for each
      const projectsResponse = await apiService.getProjects();
      if (projectsResponse.status === "success") {
        const allProjects = projectsResponse.data.projects || [];
        const allBills: Bill[] = [];

        // Fetch bills for each project
        for (const project of allProjects) {
          try {
            const billsResponse = await apiService.getBillsByProject(
              project._id
            );
            if (billsResponse.status === "success") {
              allBills.push(...(billsResponse.data || []));
            }
          } catch (error) {
            // Continue if one project fails
            console.error(
              `Error fetching bills for project ${project._id}:`,
              error
            );
          }
        }

        // Sort by date (newest first)
        allBills.sort((a, b) => {
          const dateA = new Date(a.generatedDate).getTime();
          const dateB = new Date(b.generatedDate).getTime();
          return dateB - dateA;
        });

        setBills(allBills);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // Project filter - compare as strings to handle ObjectId conversion
      if (filters.projectId) {
        const billProjectId = String(bill.projectId);
        const filterProjectId = String(filters.projectId);
        if (billProjectId !== filterProjectId) {
          return false;
        }
      }

      // Status filter
      if (filters.status && bill.status !== filters.status) {
        return false;
      }

      // Year filter
      if (filters.year && bill.year.toString() !== filters.year) {
        return false;
      }

      // Month filter
      if (filters.month && bill.month.toString() !== filters.month) {
        return false;
      }

      // Search query - case insensitive
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const billNumber = (bill.billNumber || "").toLowerCase();
        const projectName = (bill.projectName || "").toLowerCase();
        const siteName = (bill.siteName || "").toLowerCase();

        return (
          billNumber.includes(query) ||
          projectName.includes(query) ||
          siteName.includes(query)
        );
      }

      return true;
    });
  }, [bills, filters, searchQuery]);

  const calculateStats = useCallback((billsData: Bill[]) => {
    const stats: BillingStats = {
      totalBills: billsData.length,
      totalAmount: 0,
      receivedAmount: 0,
      pendingAmount: 0,
      pendingBills: 0,
      holdBills: 0,
      paidBills: 0,
      overdueBills: 0,
    };

    billsData.forEach((bill) => {
      stats.totalAmount += bill.totalAmount;
      if (bill.status === "Paid") {
        stats.receivedAmount += bill.totalAmount;
        stats.paidBills++;
      } else {
        // Pending, Overdue, and Hold all count as pending amount
        stats.pendingAmount += bill.totalAmount;
      }

      if (bill.status === "Pending") stats.pendingBills++;
      else if (bill.status === "Hold") stats.holdBills++;
      else if (bill.status === "Overdue") stats.overdueBills++;
    });

    setStats(stats);
  }, []);

  // Calculate stats based on filtered bills
  useEffect(() => {
    calculateStats(filteredBills);
  }, [filteredBills, calculateStats]);

  const handleViewBill = (billId: string) => {
    navigate(`/bills/${billId}`);
  };

  const handleStatusUpdate = async (
    billId: string,
    newStatus: "Pending" | "Overdue" | "Hold" | "Paid"
  ) => {
    try {
      setUpdatingStatus(billId);
      await apiService.updateBillStatus(billId, newStatus);
      toast.success("Bill status updated successfully");
      // Refresh bills list
      await fetchBills();
    } catch (error: any) {
      console.error("Error updating bill status:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update bill status";
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setEditTax(bill.tax || 0);
    setEditNotes("");
  };

  const handleCloseEditModal = () => {
    setEditingBill(null);
    setEditTax(0);
    setEditNotes("");
  };

  const handleSaveBill = async () => {
    if (!editingBill) return;

    try {
      setUpdatingBill(true);
      await apiService.updateBillDetails(editingBill._id, {
        tax: editTax,
        notes: editNotes || undefined,
      });
      toast.success("Bill updated successfully");
      handleCloseEditModal();
      // Refresh bills list
      await fetchBills();
    } catch (error: any) {
      console.error("Error updating bill:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update bill";
      toast.error(errorMessage);
    } finally {
      setUpdatingBill(false);
    }
  };

  const handleOpenCreateModal = () => {
    resetCreateBillForm({
      projectId: projects[0]?._id || "",
      guardId: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      tax: 0,
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const onCreateBillSubmit = async (data: CreateBillFormData) => {
    if (!data.projectId) {
      toast.error("Please select a project");
      return;
    }

    try {
      setCreatingBill(true);
      const payload: {
        year: number;
        month: number;
        guardId?: string;
        tax?: number;
        notes?: string;
      } = {
        year: data.year,
        month: data.month,
      };
      if (data.guardId) {
        payload.guardId = data.guardId;
      }
      if (data.tax !== undefined && data.tax > 0) {
        payload.tax = data.tax;
      }
      if (data.notes) {
        payload.notes = data.notes;
      }
      await apiService.generateBill(data.projectId, payload);
      toast.success("Bill generated successfully");
      setShowCreateModal(false);
      await fetchBills();
    } catch (error: any) {
      console.error("Error creating bill:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate bill";
      toast.error(errorMessage);
    } finally {
      setCreatingBill(false);
    }
  };

  const handleDeleteBill = (bill: Bill) => {
    setBillToDelete(bill);
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    try {
      setDeletingBill(true);
      await apiService.deleteBill(billToDelete._id);
      toast.success("Bill deleted successfully");
      setBillToDelete(null);
      await fetchBills();
    } catch (error: any) {
      console.error("Error deleting bill:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete bill";
      toast.error(errorMessage);
    } finally {
      setDeletingBill(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      projectId: "",
      status: "",
      year: "",
      month: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters = () => {
    return (
      filters.projectId !== "" ||
      filters.status !== "" ||
      filters.year !== "" ||
      filters.month !== "" ||
      searchQuery !== ""
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const projectOptions = useMemo(
    () => [
      { value: "", label: "All Projects" },
      ...projects.map((project) => ({
        value: project._id,
        label: project.projectName,
      })),
    ],
    [projects]
  );

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Overdue", label: "Overdue" },
    { value: "Hold", label: "Hold" },
    { value: "Paid", label: "Paid" },
  ];

  const monthOptions = [
    { value: "", label: "All Months" },
    ...monthNames.map((month, index) => ({
      value: (index + 1).toString(),
      label: month,
    })),
  ];

  const yearOptions = [
    { value: "", label: "All Years" },
    ...years.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Billing Management
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Manage and track all bills across projects
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto"
          disabled={projects.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate New Bill
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 mb-1">
                Total Bills
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {stats.totalBills}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Paid: {stats.paidBills} • Pending: {stats.pendingBills} •
                Overdue: {stats.overdueBills} • Hold: {stats.holdBills}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 mb-1">
                Total Amount
              </p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(stats.totalAmount)}
              </p>
              <p className="text-xs text-green-600 mt-1">All bills combined</p>
            </div>
            <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700 mb-1">
                Received Amount
              </p>
              <p className="text-3xl font-bold text-emerald-900">
                {formatCurrency(stats.receivedAmount)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                From {stats.paidBills} paid bill
                {stats.paidBills !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-700 mb-1">
                Pending Amount
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {formatCurrency(stats.pendingAmount)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                From {stats.pendingBills + stats.overdueBills + stats.holdBills}{" "}
                unpaid bill
                {stats.pendingBills + stats.overdueBills + stats.holdBills !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-2 border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <p className="text-xs text-gray-500">
                {hasActiveFilters()
                  ? `${filteredBills.length} bill${
                      filteredBills.length !== 1 ? "s" : ""
                    } found`
                  : "Filter bills by project, status, or date"}
              </p>
            </div>
          </div>
          {hasActiveFilters() && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-[3.5px]">
              Search Bills
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                placeholder="Search by bill number, project, or site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            label="Project"
            value={filters.projectId}
            onValueChange={(value) =>
              setFilters({ ...filters, projectId: value })
            }
            options={projectOptions}
            placeholder="All Projects"
          />
          <Select
            label="Status"
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
            options={statusOptions}
            placeholder="All Statuses"
          />
          <Select
            label="Month"
            value={filters.month}
            onValueChange={(value) => setFilters({ ...filters, month: value })}
            options={monthOptions}
            placeholder="All Months"
          />
          <Select
            label="Year"
            value={filters.year}
            onValueChange={(value) => setFilters({ ...filters, year: value })}
            options={yearOptions}
            placeholder="All Years"
          />
        </div>
      </Card>

      {/* Create Bill Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Generate New Bill"
        size="lg"
        footer={
          projects.length > 0 ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateModal}
                disabled={creatingBill}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-bill-form"
                disabled={creatingBill}
              >
                {creatingBill ? "Generating..." : "Generate Bill"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {projects.length === 0 ? (
          <p className="text-sm text-gray-600">
            No projects available. Please create a project first.
          </p>
        ) : (
          <form
            id="create-bill-form"
            onSubmit={handleCreateBillSubmit(onCreateBillSubmit)}
            className="space-y-4"
          >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...createBillRegister("projectId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={creatingBill}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.projectName}
                      </option>
                    ))}
                  </select>
                  {createBillErrors.projectId && (
                    <p className="text-sm text-red-500 mt-1">
                      {createBillErrors.projectId.message}
                    </p>
                  )}
                </div>
                {selectedProjectId && selectedProjectGuards.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guard (Optional)
                    </label>
                    <select
                      {...createBillRegister("guardId")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={creatingBill}
                    >
                      <option value="">All Guards</option>
                      {selectedProjectGuards.map((guard) => (
                        <option key={guard.value} value={guard.value}>
                          {guard.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to generate bill for all guards in the project
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...createBillRegister("year", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={creatingBill}
                    >
                      {Array.from(
                        { length: 11 },
                        (_, i) => new Date().getFullYear() - 5 + i
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {createBillErrors.year && (
                      <p className="text-sm text-red-500 mt-1">
                        {createBillErrors.year.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...createBillRegister("month", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={creatingBill}
                    >
                      {monthNames.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    {createBillErrors.month && (
                      <p className="text-sm text-red-500 mt-1">
                        {createBillErrors.month.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={creatingBill}
                    {...createBillRegister("tax", { valueAsNumber: true })}
                  />
                  {createBillErrors.tax && (
                    <p className="text-sm text-red-500 mt-1">
                      {createBillErrors.tax.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical"
                    disabled={creatingBill}
                    {...createBillRegister("notes")}
                  />
                  {createBillErrors.notes && (
                    <p className="text-sm text-red-500 mt-1">
                      {createBillErrors.notes.message}
                    </p>
                  )}
                </div>
              </form>
            )}
      </Modal>
      {/* Bills Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bills</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredBills.length}{" "}
                {filteredBills.length === 1 ? "bill" : "bills"} found
              </p>
            </div>
            {filteredBills.length > 0 && (
              <div className="text-sm text-gray-600">
                Total:{" "}
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    filteredBills.reduce(
                      (sum, bill) => sum + bill.totalAmount,
                      0
                    )
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No bills found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some((filter) => filter !== "") ||
              searchQuery
                ? "Try adjusting your filters to see more results."
                : "Get started by generating a new bill from a project."}
            </p>
            <div className="mt-6">
              <Button onClick={handleOpenCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Bill
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bill Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Guards
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <React.Fragment key={bill._id}>
                    <tr className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {bill.billNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(bill.generatedDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bill.projectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {bill.siteName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="text-sm text-gray-700 max-w-[200px] truncate"
                          title={(bill.guardAssignments || [])
                            .map((assignment) => assignment.guardName)
                            .filter(Boolean)
                            .join(", ")}
                        >
                          {(bill.guardAssignments || [])
                            .map((assignment) => assignment.guardName)
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-700">
                            {monthNames[bill.month - 1]} {bill.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(bill.totalAmount)}
                        </div>
                        {bill.tax && bill.tax > 0 && (
                          <div className="text-xs text-gray-500">
                            Tax: {bill.tax}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {updatingStatus === bill._id ? (
                          <div className="flex items-center">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2 text-xs text-gray-500">
                              Updating...
                            </span>
                          </div>
                        ) : (
                          <select
                            value={bill.status}
                            onChange={(e) =>
                              handleStatusUpdate(
                                bill._id,
                                e.target.value as
                                  | "Pending"
                                  | "Overdue"
                                  | "Hold"
                                  | "Paid"
                              )
                            }
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                              bill.status === "Paid"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : bill.status === "Overdue"
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : bill.status === "Hold"
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                            title="Click to update status"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Hold">Hold</option>
                            <option value="Paid">Paid</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewBill(bill._id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Bill"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Edit Bill"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Bill"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={!!editingBill}
        onClose={handleCloseEditModal}
        title={`Edit Bill - ${editingBill?.billNumber || ""}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={updatingBill}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBill}
              disabled={updatingBill}
              className="flex items-center gap-2"
            >
              {updatingBill ? (
                <>
                  <LoadingSpinner size="sm" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        }
      >
        {editingBill && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editTax}
                onChange={(e) => setEditTax(parseFloat(e.target.value) || 0)}
                placeholder="Enter tax percentage"
                disabled={updatingBill}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current subtotal: {formatCurrency(editingBill.subtotal)}
                {editTax > 0 && (
                  <span className="ml-2">
                    • Tax amount:{" "}
                    {formatCurrency((editingBill.subtotal * editTax) / 100)} •
                    New total:{" "}
                    {formatCurrency(
                      editingBill.subtotal +
                        (editingBill.subtotal * editTax) / 100
                    )}
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this bill..."
                rows={4}
                disabled={updatingBill}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!billToDelete}
        title="Delete Bill"
        message={`Are you sure you want to delete bill ${
          billToDelete?.billNumber || ""
        }? This action cannot be undone.`}
        confirmText="Delete Bill"
        confirmLoading={deletingBill}
        onConfirm={confirmDeleteBill}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
};
