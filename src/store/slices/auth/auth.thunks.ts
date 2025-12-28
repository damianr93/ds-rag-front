import { apiFetch } from "../../../shared/utils/api";
import type { AppDispatch } from "../../store";
import { fetchStart, fetchSuccess, fetchFailure } from "./authSlice";

export const fetchMe = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchStart());
    const res = await apiFetch<{ success: boolean; data: any; message?: string; timestamp?: string }>(
      "/api/auth/fetchme",
      { method: "GET", auth: true }
    );
    dispatch(fetchSuccess(res));
    return res;
  } catch (e: any) {
    const msg = e?.message || "Failed to fetch user data";
    dispatch(fetchFailure(msg));
    throw e;
  }
};

