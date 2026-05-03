import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "../../services/api";

interface User {
  id: string;
  name: string;
  email: string;
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
          email: "admin@gmail.com", // This could be retrieved from token or separate API call
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

      // Store token in localStorage - the token is nested in the data object
      localStorage.setItem("token", response.data.token);

      // For now, we'll create a mock user object since the API doesn't return user data
      // In a real app, you'd typically get user data from a separate endpoint or include it in the login response
      const user: User = {
        id: "1",
        name: "Admin User",
        email: credentials.email,
      };

      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
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
      // Clear token from localStorage
      localStorage.removeItem("token");
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
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } =
  authSlice.actions;
export default authSlice.reducer;
