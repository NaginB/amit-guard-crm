import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "../../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

// Check if user is already authenticated from localStorage
const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  return {
    isAuthenticated,
    user: isAuthenticated
      ? {
        id: "1",
        name: "Admin User",
        email: "admin@gmail.com",
        role: localStorage.getItem("role") || "admin",
      }
      : null,
    loading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialAuthState();

// Async thunk for login
export const loginAsync = createAsyncThunk(
  "auth/loginAsync",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.login(
        credentials.email,
        credentials.password
      );

      // Store token and role in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role || "admin");

      const user: User = {
        id: "1",
        name: response.data.role === "admin" ? "Admin User" : "Employee User",
        email: credentials.email,
        role: response.data.role,
      };

      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

// Async thunk to fetch current user
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getMe();
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      // Clear token and role from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        // Optionally update role in localStorage if it changed
        if (action.payload.role) {
          localStorage.setItem("role", action.payload.role);
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        // If fetching user fails, it might mean the token is invalid
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } =
  authSlice.actions;
export default authSlice.reducer;
