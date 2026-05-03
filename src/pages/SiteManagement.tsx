import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Search,
  Building,
  Eye,
} from "lucide-react";
import { Card, Button, Select, Modal } from "../components/common";
import { SiteFormFields } from "../components/forms/SiteFormFields";
import ConfirmModal from "../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
  fetchSites,
  createSite,
  updateSite,
  deleteSite,
  Site,
} from "../features/sites/siteSlice";
import type { AppDispatch, RootState } from "../app/store";
import { siteValidationSchema, SiteFormData } from "../lib/validations/site";

const SiteForm: React.FC<{
  site?: Site;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => void;
}> = ({ site, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormData>({
    resolver: yupResolver(siteValidationSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: site?.name || "",
      address: site?.address || "",
      city: site?.city || "",
      state: site?.state || "",
      postalCode: site?.postalCode || "",
      country: site?.country || "India",
      contactPersonName: site?.contactPersonName || "",
      contactPhoneNumber: site?.contactPhoneNumber || "",
      contactEmail: site?.contactEmail || "",
      siteType: site?.siteType || "Office",
      description: site?.description || "",
      securityRequirements: site?.securityRequirements || "",
      specialInstructions: site?.specialInstructions || "",
      isActive: site?.isActive ?? true,
    },
  });

  const onFormSubmit = (data: SiteFormData) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={site ? "Edit Site" : "Add New Site"}
      size="2xl"
      footer={
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="site-form"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : site ? "Update" : "Create"}
          </Button>
        </div>
      }
    >
      <form id="site-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <SiteFormFields
          register={register}
          control={control}
          errors={errors}
          isModal={true}
        />
      </form>
    </Modal>
  );
};

export const SiteManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sites, loading } = useSelector((state: RootState) => state.sites);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

  useEffect(() => {
    dispatch(fetchSites());
  }, [dispatch]);

  const handleCreateSite = async (data: SiteFormData) => {
    try {
      await dispatch(createSite(data)).unwrap();
      toast.success("Site created successfully!");
      setShowForm(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create site";
      toast.error(errorMessage);
    }
  };

  const handleUpdateSite = async (data: SiteFormData) => {
    if (!editingSite) return;
    try {
      await dispatch(
        updateSite({ id: editingSite._id, siteData: data })
      ).unwrap();
      toast.success("Site updated successfully!");
      setEditingSite(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update site";
      toast.error(errorMessage);
    }
  };

  const handleDeleteSite = (site: Site) => {
    setSiteToDelete(site);
    setShowDeleteModal(true);
  };

  const confirmDeleteSite = async () => {
    if (!siteToDelete) return;

    try {
      await dispatch(deleteSite(siteToDelete._id)).unwrap();
      toast.success("Site deleted successfully!");
      setShowDeleteModal(false);
      setSiteToDelete(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete site";
      toast.error(errorMessage);
    }
  };

  const cancelDeleteSite = () => {
    setShowDeleteModal(false);
    setSiteToDelete(null);
  };

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.siteType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && site.isActive) ||
      (statusFilter === "inactive" && !site.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Management</h1>
          <p className="text-gray-600">
            Manage client locations and site information
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => navigate("/sites/new")}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select
            placeholder="Filter by status"
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
            ]}
            value={statusFilter}
            onValueChange={(value: string) =>
              setStatusFilter(value as "all" | "active" | "inactive")
            }
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Site Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Sites</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sites.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sites.filter((site) => site.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Building className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sites.filter((site) => !site.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Site Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <Card
            key={site._id}
            className={`p-6 ${!site.isActive ? "opacity-75 bg-gray-50" : ""}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    site.isActive ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Building
                    className={`h-6 w-6 ${
                      site.isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {site.name}
                  </h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {site.city}, {site.state || site.country || "India"}
                    </p>
                    <p className="capitalize">{site.siteType}</p>
                    {site.contactPersonName && (
                      <p>Contact: {site.contactPersonName}</p>
                    )}
                    <p
                      className={`text-xs font-medium ${
                        site.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      Status: {site.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              {site.description && (
                <p className="text-gray-600 text-sm">{site.description}</p>
              )}
              {site.securityRequirements && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Security Requirements:
                  </p>
                  <p className="text-gray-600 text-sm">
                    {site.securityRequirements}
                  </p>
                </div>
              )}
              {site.specialInstructions && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Special Instructions:
                  </p>
                  <p className="text-gray-600 text-sm">
                    {site.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  site.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {site.isActive ? "Active" : "Inactive"}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/sites/${site._id}`)}
                  title="View Details"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSite(site)}
                  title="Edit Site"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSite(site)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete Site"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No sites found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "No sites match your search criteria."
              : "Get started by adding your first site."}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          )}
        </div>
      )}

      {/* Forms */}
      {showForm && (
        <SiteForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateSite}
        />
      )}

      {editingSite && (
        <SiteForm
          site={editingSite}
          onClose={() => setEditingSite(null)}
          onSubmit={handleUpdateSite}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Site"
        message={`Are you sure you want to delete "${siteToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteSite}
        onCancel={cancelDeleteSite}
        confirmLoading={loading}
      />
    </div>
  );
};
