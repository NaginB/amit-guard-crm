import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "../../services/api";

export interface Site {
  _id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  contactPersonName?: string;
  contactPhoneNumber?: string;
  contactEmail?: string;
  siteType: string;
  description?: string;
  securityRequirements?: string;
  operatingHours?: string;
  specialInstructions?: string;
  emergencyContact?: string;
  siteCapacity?: string;
  entryExitPoints?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SiteState {
  sites: Site[];
  currentSite: Site | null;
  loading: boolean;
  error: string | null;
}

const initialState: SiteState = {
  sites: [],
  currentSite: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSites = createAsyncThunk("sites/fetchSites", async () => {
  const response = await apiService.getSites();
  return response.data;
});

export const fetchActiveSites = createAsyncThunk(
  "sites/fetchActiveSites",
  async () => {
    const response = await apiService.getActiveSites();
    return response.data;
  }
);

export const fetchSiteById = createAsyncThunk(
  "sites/fetchSiteById",
  async (id: string) => {
    const response = await apiService.getSite(id);
    return response.data;
  }
);

export const createSite = createAsyncThunk(
  "sites/createSite",
  async (siteData: any) => {
    const response = await apiService.createSite(siteData);
    return response.data;
  }
);

export const updateSite = createAsyncThunk(
  "sites/updateSite",
  async ({ id, siteData }: { id: string; siteData: any }) => {
    const response = await apiService.updateSite(id, siteData);
    return response.data;
  }
);

export const deleteSite = createAsyncThunk(
  "sites/deleteSite",
  async (id: string) => {
    const response = await apiService.deleteSite(id);
    return response.data;
  }
);

export const searchSites = createAsyncThunk(
  "sites/searchSites",
  async (query: string) => {
    const response = await apiService.searchSites(query);
    return response.data;
  }
);

export const filterSitesByType = createAsyncThunk(
  "sites/filterSitesByType",
  async (type: string) => {
    const response = await apiService.filterSitesByType(type);
    return response.data;
  }
);

export const filterSitesByCity = createAsyncThunk(
  "sites/filterSitesByCity",
  async (city: string) => {
    const response = await apiService.filterSitesByCity(city);
    return response.data;
  }
);

const siteSlice = createSlice({
  name: "sites",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSite: (state) => {
      state.currentSite = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sites
      .addCase(fetchSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch sites";
      })
      // Fetch active sites
      .addCase(fetchActiveSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(fetchActiveSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch active sites";
      })
      // Fetch site by ID
      .addCase(fetchSiteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSite = action.payload;
      })
      .addCase(fetchSiteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch site";
      })
      // Create site
      .addCase(createSite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSite.fulfilled, (state, action) => {
        state.loading = false;
        state.sites.push(action.payload);
      })
      .addCase(createSite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create site";
      })
      // Update site
      .addCase(updateSite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSite.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sites.findIndex(
          (site) => site._id === action.payload._id
        );
        if (index !== -1) {
          state.sites[index] = action.payload;
        }
        if (state.currentSite?._id === action.payload._id) {
          state.currentSite = action.payload;
        }
      })
      .addCase(updateSite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update site";
      })
      // Delete site
      .addCase(deleteSite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSite.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = state.sites.filter(
          (site) => site._id !== action.payload._id
        );
        if (state.currentSite?._id === action.payload._id) {
          state.currentSite = null;
        }
      })
      .addCase(deleteSite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete site";
      })
      // Search sites
      .addCase(searchSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(searchSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to search sites";
      })
      // Filter sites by type
      .addCase(filterSitesByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSitesByType.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(filterSitesByType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to filter sites by type";
      })
      // Filter sites by city
      .addCase(filterSitesByCity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSitesByCity.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(filterSitesByCity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to filter sites by city";
      });
  },
});

export const { clearError, clearCurrentSite } = siteSlice.actions;
export default siteSlice.reducer;
