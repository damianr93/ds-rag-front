import { configureStore, type Action, type ThunkAction } from "@reduxjs/toolkit";
import ragReducer from "./slices/rag/ragSlice";
import authReducer from "./slices/auth/authSlice";
import disclaimerReducer from "./slices/disclaimer/disclaimerSlice";

export const store = configureStore({
  reducer: {
    rag: ragReducer,
    auth: authReducer,
    disclaimer: disclaimerReducer,
  },
});

// Types de conveniencia
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
