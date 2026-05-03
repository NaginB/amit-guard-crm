import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "../../services/api";

export interface Inventory {
  _id: string;
  name: string;
  description?: string;
  quantity: number; // Total quantity
  assignedQuantity: number; // Assigned quantity
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryState {
  inventories: Inventory[];
  currentInventory: Inventory | null;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventories: [],
  currentInventory: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchInventories = createAsyncThunk(
  "inventories/fetchInventories",
  async () => {
    const response = await apiService.getInventories();
    return response.data;
  }
);

export const fetchActiveInventories = createAsyncThunk(
  "inventories/fetchActiveInventories",
  async () => {
    const response = await apiService.getActiveInventories();
    return response.data;
  }
);

export const fetchInventoryById = createAsyncThunk(
  "inventories/fetchInventoryById",
  async (id: string) => {
    const response = await apiService.getInventory(id);
    return response.data;
  }
);

export const createInventory = createAsyncThunk(
  "inventories/createInventory",
  async (inventoryData: Partial<Inventory>) => {
    const response = await apiService.createInventory(inventoryData);
    return response.data;
  }
);

export const updateInventory = createAsyncThunk(
  "inventories/updateInventory",
  async ({
    id,
    inventoryData,
  }: {
    id: string;
    inventoryData: Partial<Inventory>;
  }) => {
    const response = await apiService.updateInventory(id, inventoryData);
    return response.data;
  }
);

export const deleteInventory = createAsyncThunk(
  "inventories/deleteInventory",
  async (id: string) => {
    await apiService.deleteInventory(id);
    return id;
  }
);

export const syncInventoryQuantities = createAsyncThunk(
  "inventories/syncQuantities",
  async () => {
    await apiService.syncInventoryQuantities();
    return null;
  }
);

const inventorySlice = createSlice({
  name: "inventories",
  initialState,
  reducers: {
    clearCurrentInventory: (state) => {
      state.currentInventory = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventories
      .addCase(fetchInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventories.fulfilled, (state, action) => {
        state.loading = false;
        state.inventories = action.payload;
      })
      .addCase(fetchInventories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch inventories";
      })
      // Fetch active inventories
      .addCase(fetchActiveInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveInventories.fulfilled, (state, action) => {
        state.loading = false;
        state.inventories = action.payload;
      })
      .addCase(fetchActiveInventories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch active inventories";
      })
      // Fetch inventory by ID
      .addCase(fetchInventoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInventory = action.payload;
      })
      .addCase(fetchInventoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch inventory";
      })
      // Create inventory
      .addCase(createInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventories.push(action.payload);
      })
      .addCase(createInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create inventory";
      })
      // Update inventory
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.inventories.findIndex(
          (inventory) => inventory._id === action.payload._id
        );
        if (index !== -1) {
          state.inventories[index] = action.payload;
        }
        if (state.currentInventory?._id === action.payload._id) {
          state.currentInventory = action.payload;
        }
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update inventory";
      })
      // Delete inventory
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventories = state.inventories.filter(
          (inventory) => inventory._id !== action.payload
        );
        if (state.currentInventory?._id === action.payload) {
          state.currentInventory = null;
        }
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete inventory";
      })
      // Sync inventory quantities
      .addCase(syncInventoryQuantities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncInventoryQuantities.fulfilled, (state) => {
        state.loading = false;
        // Refresh inventories after sync
      })
      .addCase(syncInventoryQuantities.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to sync inventory quantities";
      });
  },
});

export const { clearCurrentInventory, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
