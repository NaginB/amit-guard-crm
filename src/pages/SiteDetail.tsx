import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Building,
  Shield,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Users,
  Calendar,
} from "lucide-react";
import { Card, Button, LoadingSpinner } from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { fetchSiteById, deleteSite, Site } from "../features/sites/siteSlice";
import type { AppDispatch, RootState } from "../app/store";
import apiService from "../services/api";

export const SiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSite, loading } = useSelector(
    (state: RootState) => state.sites
  );
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<
    Array<{
      _id: string;
      projectName: string;
      startDate: string;
      endDate?: string;
      status: "Active" | "Closed" | "On Hold";
      guardAssignments: Array<{
        guardId: string;
        guardName: string;
        shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
        monthlyRate: number;
        isActive: boolean;
        assignedDate: string;
      }>;
    }>
  >([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchSiteById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!id) return;
      try {
        setProjectsLoading(true);
        const res = await apiService.getProjectsBySite(id, {
          status: "Active",
        });
        setProjects(res.data.projects || []);
      } catch (e) {
        console.error("Failed to load site projects", e);
      } finally {
        setProjectsLoading(false);
      }
    };
    loadProjects();
  }, [id]);

  const activeGuards = useMemo(() => {
    const map = new Map<string, { guardId: string; guardName: string }>();
    for (const p of projects) {
      for (const a of p.guardAssignments) {
        if (a.isActive && a.guardId && a.guardName && !map.has(a.guardId)) {
          map.set(a.guardId, { guardId: a.guardId, guardName: a.guardName });
        }
      }
    }
    return Array.from(map.values());
  }, [projects]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "projects" | "guards"
  >("overview");

  const handleEdit = () => {
    navigate(`/sites/${id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentSite) return;
    try {
      await dispatch(deleteSite(currentSite._id)).unwrap();
      toast.success("Site deleted successfully!");
      navigate("/sites");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete site";
      toast.error(errorMessage);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading site details..." />
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Site Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The site you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/sites")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sites
          </Button>
        </div>
      </div>
    );
  }

  const site: Site = currentSite;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/sites")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {site.name}
            </h1>
            <p className="text-gray-600">Site Details and Information</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Site
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            site.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {site.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {[
            { id: "overview", label: "Overview" },
            { id: "projects", label: "Active Projects" },
            { id: "guards", label: "Active Guards" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Site Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Site details and specifications
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Site Name
                    </p>
                    <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                      {site.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Site Type
                    </p>
                    <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                      {site.siteType}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Location Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium text-gray-900">{site.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-medium text-gray-900">
                        {site.state || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-medium text-gray-900">
                        {site.country}
                      </p>
                    </div>
                  </div>
                  {site.postalCode && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Postal Code</p>
                      <p className="font-medium text-gray-900">
                        {site.postalCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Contact Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Primary contact details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {site.contactPersonName && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Contact Person
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {site.contactPersonName}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {site.contactPhoneNumber && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Phone
                      </p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {site.contactPhoneNumber}
                      </p>
                    </div>
                  )}
                  {site.contactEmail && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
                        {site.contactEmail}
                      </p>
                    </div>
                  )}
                </div>

                {!site.contactPersonName &&
                  !site.contactPhoneNumber &&
                  !site.contactEmail && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        No contact information available
                      </p>
                    </div>
                  )}
              </div>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Address */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Address
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {site.address}
                </p>
              </div>
            </Card>

            {/* Security Requirements */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Security Requirements
                </h3>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {site.securityRequirements ||
                    "No specific security requirements specified"}
                </p>
              </div>
            </Card>

            {/* Special Instructions */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Special Instructions
                </h3>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {site.specialInstructions ||
                    "No special instructions provided"}
                </p>
              </div>
            </Card>
          </div>

          {/* Site Status & Timestamps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site Status */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Site Status
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Current Status
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      site.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {site.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Site Type
                    </p>
                    <p className="text-sm font-semibold text-gray-900 capitalize mt-1">
                      {site.siteType}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {site.city}, {site.country}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timestamps */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Timestamps
                </h3>
              </div>
              <div className="space-y-4">
                {site.createdAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Created
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(site.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                {site.updatedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Last Updated
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {new Date(site.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(site.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <Card className="p-0">
          <div className="px-6 pt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" /> Active
              Projects
            </h2>
            {projectsLoading && (
              <span className="text-sm text-gray-500 pr-6">Loading...</span>
            )}
          </div>
          <div className="max-h-[70vh] overflow-auto px-6 pb-6 space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-600">
                No active projects for this site.
              </p>
            ) : null}
            {projects.map((p) => (
              <div key={p._id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p._id}`)}
                      className="text-base font-semibold text-gray-900 hover:underline capitalize"
                    >
                      {p.projectName}
                    </button>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(p.startDate).toLocaleDateString()}
                      {p.endDate && (
                        <>
                          <span className="mx-1">to</span>
                          {new Date(p.endDate).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${
                      p.status === "Active"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : p.status === "On Hold"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Guard breakdown table */}
                <div className="mt-4 overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guard
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shift
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Rate
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {p.guardAssignments
                        .filter((a) => a.isActive)
                        .map((a, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <button
                                type="button"
                                onClick={() => navigate(`/guards/${a.guardId}`)}
                                className="text-blue-700 hover:underline"
                              >
                                {a.guardName}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {a.shiftType}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              ₹{a.monthlyRate.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {new Date(a.assignedDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-gray-700">
                              <button
                                type="button"
                                onClick={() => navigate(`/guards/${a.guardId}`)}
                                className="text-blue-700 hover:underline"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          className="px-4 py-2 text-sm font-medium text-gray-900"
                          colSpan={2}
                        >
                          Project Monthly Total
                        </td>
                        <td
                          className="px-4 py-2 text-sm font-semibold text-gray-900"
                          colSpan={4}
                        >
                          ₹
                          {p.guardAssignments
                            .filter((a) => a.isActive)
                            .reduce((s, a) => s + (a.monthlyRate || 0), 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "guards" && (
        <div className="space-y-6">
          <Card className="p-0">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      Active Guards
                    </h2>
                    <p className="text-sm text-gray-600">
                      Currently assigned guards at this site
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {activeGuards.length}
                  </div>
                  <div className="text-sm text-gray-500">Total Guards</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {activeGuards.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Guards
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No guards are currently assigned to this site.
                  </p>
                  <Button
                    onClick={() => navigate("/projects")}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    View Projects
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guard Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shift Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) =>
                        project.guardAssignments
                          .filter((assignment) => assignment.isActive)
                          .map((assignment, index) => (
                            <tr
                              key={`${project._id}-${assignment.guardId}-${index}`}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <Users className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {assignment.guardName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ID: {assignment.guardId}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/projects/${project._id}`)
                                  }
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline capitalize"
                                >
                                  {project.projectName}
                                </button>
                                <div className="text-xs text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {new Date(
                                    project.startDate
                                  ).toLocaleDateString()}
                                  {project.endDate && (
                                    <>
                                      <span className="mx-1">to</span>
                                      {new Date(
                                        project.endDate
                                      ).toLocaleDateString()}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {assignment.shiftType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  ₹{assignment.monthlyRate.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  per month
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  assignment.assignedDate
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/guards/${assignment.guardId}`)
                                    }
                                    className="hover:bg-purple-50 hover:border-purple-300"
                                  >
                                    <Users className="h-4 w-4 mr-1" />
                                    View Guard
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/projects/${project._id}`)
                                    }
                                    className="hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    <Building className="h-4 w-4 mr-1" />
                                    View Project
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          className="px-6 py-3 text-sm font-medium text-gray-900"
                          colSpan={3}
                        >
                          Total Monthly Cost
                        </td>
                        <td
                          className="px-6 py-3 text-sm font-bold text-gray-900"
                          colSpan={4}
                        >
                          ₹
                          {projects
                            .flatMap((p) =>
                              p.guardAssignments.filter((a) => a.isActive)
                            )
                            .reduce((sum, a) => sum + (a.monthlyRate || 0), 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Site"
        message={`Are you sure you want to delete "${site.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
