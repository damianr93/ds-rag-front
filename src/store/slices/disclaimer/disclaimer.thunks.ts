import type { AppDispatch } from "../../store";
import { apiFetch } from "../../../shared/utils/api";
import {
  fetchUserDataStart,
  fetchUserDataSuccess,
  fetchUserDataFailure,
  updateDisclaimerStart,
  updateDisclaimerSuccess,
  updateDisclaimerFailure,
  type UserData,
} from "./disclaimerSlice";

interface FetchUserResponse {
  success: boolean;
  data: { user: UserData };
  message: string;
  timestamp: string;
}

interface UpdateDisclaimerResponse {
  success: boolean;
  data: { disclaimerChecked: boolean };
  message: string;
  timestamp: string;
}

export const fetchUserData = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchUserDataStart());

    const response = await apiFetch<FetchUserResponse>("/api/auth/fetchme", {
      method: "GET",
      auth: true,
    });

    dispatch(fetchUserDataSuccess(response.data.user));
    return response.data.user;
  } catch (error: any) {
    const message = error?.message || "Error al cargar datos del usuario";
    dispatch(fetchUserDataFailure(message));
    throw error;
  }
};

export const updateDisclaimerChecked = (checked: boolean) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateDisclaimerStart());

    const response = await apiFetch<UpdateDisclaimerResponse>("/api/auth/disclaimer", {
      method: "POST",
      auth: true,
      body: { checked },
    });

    dispatch(updateDisclaimerSuccess(response.data.disclaimerChecked));
    return response.data.disclaimerChecked;
  } catch (error: any) {
    const message = error?.message || "Error al actualizar el disclaimer";
    dispatch(updateDisclaimerFailure(message));
    throw error;
  }
};
