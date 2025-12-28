import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  success: boolean;
  data: any;
  message: string;
  timestamp: string;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  success: false,
  data: {},
  message: "",
  timestamp: "",
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    fetchStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess(state, action: PayloadAction<{ success: boolean; data: any; message?: string; timestamp?: string }>) {
      state.loading = false;
      state.success = action.payload.success;
      state.data = action.payload.data ?? {};
      state.message = action.payload.message ?? "";
      state.timestamp = action.payload.timestamp ?? "";
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.success = false;
      state.error = action.payload;
    },
    clearAuth(state) {
      state.success = false;
      state.data = {};
      state.message = "";
      state.timestamp = "";
      state.error = null;
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure, clearAuth } = authSlice.actions;
export default authSlice.reducer;

