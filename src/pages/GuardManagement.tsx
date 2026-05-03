import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  User,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  List,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, Button, Dropdown, ConfirmModal } from "../components/common";
import { fetchGuards, deleteGuard } from "../features/guards/guardSlice";
import type { AppDispatch, RootState } from "../app/store";
import type { Guard } from "../features/guards/guardSlice";
import { useDispatch, useSelector } from "react-redux";

const GuardCard: React.FC<{
  guard: Guard;
  onClick: (guard: Guard) => void;
  onEdit: (guard: Guard, e: React.MouseEvent) => void;
  onDelete: (guard: Guard, e: React.MouseEvent) => void;
}> = ({ guard, onClick, onEdit, onDelete }) => {
  const guardStatus =
    new Date(guard.joiningDate) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ? "active"
      : "inactive";

  return (
    <div
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(guard)}
    >
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              {guard.photo ? (
                <img
                  src={guard.photo}
                  alt={`${guard.firstName} ${guard.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-blue-600" />
              )}
            </div>

            {/* Guard Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ID: #{guard.guardId || "N/A"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {guard.firstName} {guard.lastName}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${guardStatus === "active"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                    }`}
                >
                  {guardStatus === "active" ? (
                    <Shield className="h-3 w-3 mr-1" />
                  ) : (
                    <User className="h-3 w-3 mr-1" />
                  )}
                  <span className="capitalize">{guardStatus}</span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">{guard.email || "No email"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{guard.contactNumber}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">
                    {guard.presentAddress || "No address"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    Joined: {new Date(guard.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick(guard);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onEdit(guard, e)}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Edit Guard"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onDelete(guard, e)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Guard"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const GuardManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { guards, loading } = useSelector((state: RootState) => state.guards);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortField, setSortField] = useState<string>("guardId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guardToDelete, setGuardToDelete] = useState<Guard | null>(null);

  useEffect(() => {
    dispatch(fetchGuards());
  }, [dispatch]);

  const handleGuardClick = (guard: Guard) => {
    navigate(`/guards/${guard._id}`);
  };

  const handleEditGuard = (guard: Guard, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/guards/${guard._id}/edit`);
  };

  const handleDeleteGuard = (guard: Guard, e: React.MouseEvent) => {
    e.stopPropagation();
    setGuardToDelete(guard);
    setDeleteModalOpen(true);
  };

  const confirmDeleteGuard = async () => {
    if (!guardToDelete) return;

    try {
      await dispatch(deleteGuard(guardToDelete._id!)).unwrap();
      setDeleteModalOpen(false);
      setGuardToDelete(null);
    } catch {
      // Error is handled by the slice
    }
  };

  const cancelDeleteGuard = () => {
    setDeleteModalOpen(false);
    setGuardToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortField("guardId");
    setSortDirection("asc");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredGuards = guards
    .filter((guard) => {
      const matchesSearch =
        `${guard.firstName} ${guard.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        guard.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guard.presentAddress
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        guard.guardId?.toString().includes(searchTerm);

      // For now, we'll use a simple status based on joining date
      const guardStatus =
        new Date(guard.joiningDate) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ? "active"
          : "inactive";
      const matchesStatus =
        statusFilter === "all" || guardStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortField as keyof Guard] as
        | string
        | number;
      let bValue: string | number = b[sortField as keyof Guard] as
        | string
        | number;

      if (sortField === "joiningDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === "salary") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortField === "guardId") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const statusCounts = {
    all: guards.length,
    active: guards.filter(
      (g) =>
        new Date(g.joiningDate) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    inactive: guards.filter(
      (g) =>
        new Date(g.joiningDate) <=
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Guard Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage your security personnel and track their information
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {Object.entries(statusCounts).map(([status, count]) => {
          const getStatusInfo = (status: string) => {
            switch (status) {
              case "all":
                return {
                  title: "Total Guards",
                  change: "+8 new this month",
                  changeType: "positive" as const,
                  icon: Shield,
                };
              case "active":
                return {
                  title: "Active Guards",
                  change: "+2 new assignments",
                  changeType: "positive" as const,
                  icon: UserCheck,
                };
              case "inactive":
                return {
                  title: "Inactive Guards",
                  change: "-1 this week",
                  changeType: "negative" as const,
                  icon: User,
                };
              default:
                return {
                  title: status,
                  change: "No change",
                  changeType: "neutral" as const,
                  icon: Shield,
                };
            }
          };

          const statusInfo = getStatusInfo(status);
          const Icon = statusInfo.icon;
          const changeColor = {
            positive: "text-green-600",
            negative: "text-red-600",
            neutral: "text-gray-600",
          };

          return (
            <Card key={status} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {statusInfo.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {count}
                  </p>
                  <p
                    className={`text-xs sm:text-sm ${changeColor[statusInfo.changeType]
                      } truncate`}
                  >
                    {statusInfo.change}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add New Guard Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate("/guards/new")} className="inline-flex">
          <Plus className="h-4 w-4 mr-2" />
          Add New Guard
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-6">
          {/* Search Row */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search guards by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-6">
            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <Dropdown
                options={[
                  {
                    value: "all",
                    label: `All Guards (${statusCounts.all})`,
                  },
                  {
                    value: "active",
                    label: `Active (${statusCounts.active})`,
                  },
                  {
                    value: "inactive",
                    label: `Inactive (${statusCounts.inactive})`,
                  },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Select status..."
                className="min-w-[160px]"
              />
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                Sort by:
              </span>
              <Dropdown
                options={[
                  { value: "guardId", label: "Guard ID" },
                  { value: "firstName", label: "Name" },
                  { value: "contactNumber", label: "Contact" },
                  { value: "email", label: "Email" },
                  { value: "joiningDate", label: "Join Date" },
                  { value: "salary", label: "Salary" },
                ]}
                value={sortField}
                onChange={setSortField}
                placeholder="Select field..."
                className="min-w-[120px]"
              />
              <Dropdown
                options={[
                  { value: "asc", label: "Ascending" },
                  { value: "desc", label: "Descending" },
                ]}
                value={sortDirection}
                onChange={(value) => setSortDirection(value as "asc" | "desc")}
                placeholder="Select order..."
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 rounded-md transition-all duration-200 ${viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-2 rounded-md transition-all duration-200 ${viewMode === "cards"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  title="Card View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-sm px-4 py-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredGuards.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">{guards.length}</span>{" "}
          guards
        </p>
      </div>

      {/* Guards List */}
      {filteredGuards.length > 0 ? (
        viewMode === "table" ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("guardId")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>ID</span>
                        {sortField === "guardId" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("firstName")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Name</span>
                        {sortField === "firstName" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("contactNumber")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Contact</span>
                        {sortField === "contactNumber" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("email")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Email</span>
                        {sortField === "email" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("joiningDate")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Join Date</span>
                        {sortField === "joiningDate" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort("salary")}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <span>Salary</span>
                        {sortField === "salary" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuards.map((guard) => {
                    return (
                      <tr
                        key={guard._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleGuardClick(guard)}
                      >
                        <td className="py-4 px-4">
                          <div className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            #{guard.guardId || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center">
                              {guard.photo ? (
                                <img
                                  src={guard.photo}
                                  alt={`${guard.firstName} ${guard.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {guard.firstName} {guard.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {guard.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {guard.contactNumber}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {guard.email || "No email"}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {new Date(guard.joiningDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {guard.salary
                            ? `₹${guard.salary.toLocaleString()}`
                            : "Not set"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGuardClick(guard);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleEditGuard(guard, e)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Edit Guard"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteGuard(guard, e)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Guard"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGuards.map((guard) => (
              <GuardCard
                key={guard._id}
                guard={guard}
                onClick={handleGuardClick}
                onEdit={handleEditGuard}
                onDelete={handleDeleteGuard}
              />
            ))}
          </div>
        )
      ) : (
        <Card>
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No guards found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first guard"}
            </p>
            <Button onClick={() => navigate("/guards/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Guard
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        title="Delete Guard"
        message={`Are you sure you want to delete ${guardToDelete?.firstName} ${guardToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isOpen={deleteModalOpen}
        onConfirm={confirmDeleteGuard}
        onCancel={cancelDeleteGuard}
        confirmLoading={false}
      />
    </div>
  );
};
