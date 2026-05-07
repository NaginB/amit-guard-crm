import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "../../services/api";
import { Designation } from "../../constants/designation.constants";

export interface Guard {
  _id?: string;
  guardId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  presentAddress?: string;
  permanentAddress?: string;
  bankName?: string;
  designation: Designation;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  salary?: number;
  aadharNumber?: string;
  panNumber?: string;
  photo?: string;
  photoPublicId?: string;
  aadharCardFront?: string;
  aadharCardFrontPublicId?: string;
  aadharCardBack?: string;
  aadharCardBackPublicId?: string;
  panCardFront?: string;
  panCardFrontPublicId?: string;
  panCardBack?: string;
  panCardBackPublicId?: string;
  bankProof?: string;
  bankProofPublicId?: string;
  fatherName?: string;
  motherName?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  joiningDate: string;
  expiryDate?: string;
  password?: string;
  children?: Array<{
    name: string;
    age: number;
    phoneNumber?: string;
    gender?: "Male" | "Female" | "Other";
  }>;
  assignedInventories?: Array<{
    inventoryId: string;
    inventoryName: string;
    assignedQuantity: number;
    assignedDate: string;
    assignedBy: string;
  }>;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GuardState {
  guards: Guard[];
  currentGuard: Guard | null;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

const initialState: GuardState = {
  guards: [],
  currentGuard: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

// Async thunks
export const fetchGuards = createAsyncThunk(
  "guards/fetchGuards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getGuards();
      return response.data.guards;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch guards");
    }
  }
);

export const fetchGuardById = createAsyncThunk(
  "guards/fetchGuardById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getGuard(id);
      return response.data.guard;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch guard");
    }
  }
);

export const createGuard = createAsyncThunk(
  "guards/createGuard",
  async (guardData: Partial<Guard>, { rejectWithValue }) => {
    try {
      const response = await apiService.createGuard(guardData);
      return { guard: response.data.guard, password: response.data.password };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create guard");
    }
  }
);

export const updateGuard = createAsyncThunk(
  "guards/updateGuard",
  async (
    { id, guardData }: { id: string; guardData: Partial<Guard> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.updateGuard(id, guardData);
      return response.data.guard;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update guard");
    }
  }
);

export const deleteGuard = createAsyncThunk(
  "guards/deleteGuard",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteGuard(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete guard");
    }
  }
);

const guardSlice = createSlice({
  name: "guards",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentGuard: (state) => {
      state.currentGuard = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch guards
      .addCase(fetchGuards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuards.fulfilled, (state, action) => {
        state.loading = false;
        state.guards = action.payload;
        state.error = null;
      })
      .addCase(fetchGuards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch guard by ID
      .addCase(fetchGuardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuardById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGuard = action.payload;
        state.error = null;
      })
      .addCase(fetchGuardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create guard
      .addCase(createGuard.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createGuard.fulfilled, (state, action) => {
        state.createLoading = false;
        state.guards.push(action.payload.guard);
        state.error = null;
      })
      .addCase(createGuard.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      // Update guard
      .addCase(updateGuard.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateGuard.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.guards.findIndex(
          (guard) => guard._id === action.payload._id
        );
        if (index !== -1) {
          state.guards[index] = action.payload;
        }
        if (state.currentGuard?._id === action.payload._id) {
          state.currentGuard = action.payload;
        }
        state.error = null;
      })
      .addCase(updateGuard.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })
      // Delete guard
      .addCase(deleteGuard.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteGuard.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.guards = state.guards.filter(
          (guard) => guard._id !== action.payload
        );
        if (state.currentGuard?._id === action.payload) {
          state.currentGuard = null;
        }
        state.error = null;
      })
      .addCase(deleteGuard.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentGuard } = guardSlice.actions;
export default guardSlice.reducer;
