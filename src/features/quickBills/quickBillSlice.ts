import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "../../services/api";

export interface QuickBill {
  _id: string;
  address: string;
  amountPerDay: number;
  totalDays: number;
  totalAmount: number;
  billNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface QuickBillState {
  quickBills: QuickBill[];
  loading: boolean;
  error: string | null;
  currentQuickBill: QuickBill | null;
}

const initialState: QuickBillState = {
  quickBills: [],
  loading: false,
  error: null,
  currentQuickBill: null,
};

export const fetchQuickBills = createAsyncThunk(
  "quickBills/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getQuickBills();
      return response.data.quickBills;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quick bills");
    }
  }
);

export const createQuickBill = createAsyncThunk(
  "quickBills/create",
  async (data: { address: string; amountPerDay: number; totalDays: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.createQuickBill(data);
      return response.data.quickBill;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create quick bill");
    }
  }
);

export const deleteQuickBill = createAsyncThunk(
  "quickBills/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteQuickBill(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete quick bill");
    }
  }
);

const quickBillSlice = createSlice({
  name: "quickBills",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuickBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuickBills.fulfilled, (state, action) => {
        state.loading = false;
        state.quickBills = action.payload;
      })
      .addCase(fetchQuickBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createQuickBill.fulfilled, (state, action) => {
        state.quickBills.unshift(action.payload);
      })
      .addCase(deleteQuickBill.fulfilled, (state, action) => {
        state.quickBills = state.quickBills.filter((b) => b._id !== action.payload);
      });
  },
});

export default quickBillSlice.reducer;
