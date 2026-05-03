import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Edit, Trash2, Package, Search, RefreshCw } from "lucide-react";
import { Card, Button, Input, Select, Modal } from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
  fetchInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  syncInventoryQuantities,
  Inventory,
} from "../features/inventories/inventorySlice";
import type { AppDispatch, RootState } from "../app/store";
import {
  inventoryValidationSchema,
  InventoryFormData,
} from "../lib/validations/inventory";

// InventoryFormData is now imported from validations

const InventoryForm: React.FC<{
  inventory?: Inventory;
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => void;
}> = ({ inventory, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: yupResolver(inventoryValidationSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: inventory?.name || "",
      description: inventory?.description || "",
      quantity: inventory?.quantity || 0,
      unit: inventory?.unit || "pieces",
      isActive: inventory?.isActive ?? true,
    },
  });

  const watchedQuantity = watch("quantity");

  // Automatically disable inventory when quantity is 0
  useEffect(() => {
    if (watchedQuantity === 0) {
      setValue("isActive", false);
    }
  }, [watchedQuantity, setValue]);

  const onFormSubmit = (data: InventoryFormData) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={inventory ? "Edit Inventory" : "Add New Inventory"}
      size="md"
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
            form="inventory-form"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : inventory ? "Update" : "Create"}
          </Button>
        </div>
      }
    >
      <form
        id="inventory-form"
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
      >
            <Input
              label="Name *"
              placeholder="e.g., Uniform, Shoes, Wooden Rod"
              {...register("name")}
              error={errors.name?.message}
              aria-label="Inventory name"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
                rows={3}
                aria-label="Inventory description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Input
              label="Quantity *"
              type="number"
              min="0"
              {...register("quantity", { valueAsNumber: true })}
              error={errors.quantity?.message}
              aria-label="Inventory quantity"
            />

            <Select
              label="Unit *"
              placeholder="Select unit"
              options={[
                { value: "pieces", label: "Pieces" },
                { value: "pairs", label: "Pairs" },
                { value: "sets", label: "Sets" },
                { value: "units", label: "Units" },
                { value: "items", label: "Items" },
              ]}
              {...register("unit")}
              error={errors.unit?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        disabled={watchedQuantity === 0}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                        aria-label="Set inventory as active"
                      />
                      <span
                        className={`ml-2 text-sm text-gray-700 ${
                          watchedQuantity === 0 ? "opacity-50" : ""
                        }`}
                      >
                        Active
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        aria-label="Set inventory as disabled"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Disabled
                      </span>
                    </label>
                  </div>
                )}
              />
              {errors.isActive && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.isActive.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {watchedQuantity === 0
                  ? "Inventory will be automatically disabled when quantity is 0"
                  : "Disabled inventories cannot be assigned to guards"}
              </p>
            </div>
          </form>
    </Modal>
  );
};

export const InventoryManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { inventories, loading } = useSelector(
    (state: RootState) => state.inventories
  );
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchInventories());
  }, [dispatch]);

  const handleCreateInventory = async (data: InventoryFormData) => {
    try {
      await dispatch(createInventory(data)).unwrap();
      toast.success("Inventory created successfully!");
      setShowForm(false);
    } catch {
      // Error handled by Redux
    }
  };

  const handleUpdateInventory = async (data: InventoryFormData) => {
    if (!editingInventory) return;
    try {
      await dispatch(
        updateInventory({ id: editingInventory._id, inventoryData: data })
      ).unwrap();
      toast.success("Inventory updated successfully!");
      setEditingInventory(null);
    } catch {
      // Error handled by Redux
    }
  };

  const handleDeleteInventory = (inventory: Inventory) => {
    setInventoryToDelete(inventory);
    setShowDeleteModal(true);
  };

  const confirmDeleteInventory = async () => {
    if (!inventoryToDelete) return;

    try {
      await dispatch(deleteInventory(inventoryToDelete._id)).unwrap();
      toast.success("Inventory deleted successfully!");
      setShowDeleteModal(false);
      setInventoryToDelete(null);
    } catch (error: unknown) {
      // Show specific error message from backend
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete inventory";
      toast.error(errorMessage);
    }
  };

  const cancelDeleteInventory = () => {
    setShowDeleteModal(false);
    setInventoryToDelete(null);
  };

  const handleSyncQuantities = async () => {
    try {
      await dispatch(syncInventoryQuantities()).unwrap();
      await dispatch(fetchInventories()).unwrap();
      toast.success("Inventory quantities synchronized successfully!");
    } catch {
      toast.error("Failed to sync inventory quantities");
    }
  };

  const filteredInventories = inventories.filter((inventory) => {
    const matchesSearch = inventory.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && inventory.isActive) ||
      (statusFilter === "disabled" && !inventory.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600">
            Manage uniforms, equipment, and other inventory items
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleSyncQuantities}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Quantities
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventories..."
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
              { value: "disabled", label: "Disabled Only" },
            ]}
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "active" | "disabled")
            }
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Inventories
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventories.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventories.filter((inv) => inv.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Disabled</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventories.filter((inv) => !inv.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventories.map((inventory) => (
          <Card
            key={inventory._id}
            className={`p-6 ${
              !inventory.isActive ? "opacity-75 bg-gray-50" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    inventory.isActive ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Package
                    className={`h-6 w-6 ${
                      inventory.isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {inventory.name}
                  </h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      Total: {inventory.quantity} {inventory.unit}
                    </p>
                    <p>
                      Available:{" "}
                      {inventory.quantity - inventory.assignedQuantity}{" "}
                      {inventory.unit}
                    </p>
                    <p>
                      Assigned: {inventory.assignedQuantity} {inventory.unit}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        inventory.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      Status: {inventory.isActive ? "Active" : "Disabled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {inventory.description && (
              <p className="text-gray-600 text-sm mb-4">
                {inventory.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  inventory.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {inventory.isActive ? "Active" : "Inactive"}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingInventory(inventory)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteInventory(inventory)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredInventories.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No inventories found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "No inventories match your search criteria."
              : "Get started by adding your first inventory item."}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory
            </Button>
          )}
        </div>
      )}

      {/* Forms */}
      {showForm && (
        <InventoryForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateInventory}
        />
      )}

      {editingInventory && (
        <InventoryForm
          inventory={editingInventory}
          onClose={() => setEditingInventory(null)}
          onSubmit={handleUpdateInventory}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Inventory"
        message={`Are you sure you want to delete "${inventoryToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteInventory}
        onCancel={cancelDeleteInventory}
        confirmLoading={loading}
      />
    </div>
  );
};
