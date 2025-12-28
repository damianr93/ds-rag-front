import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

export interface UserData {
  id: number;
  name: string;
  lastName: string;
  division: string;
  email: string;
  disclaimerChecked: boolean;
  role: 'USER' | 'ADMIN';
}

interface DisclaimerState {
  userData: UserData | null;
  loadingUserData: boolean;
  updatingDisclaimer: boolean;
  error: string | null;
  showPopup: boolean;
}

const initialState: DisclaimerState = {
  userData: null,
  loadingUserData: false,
  updatingDisclaimer: false,
  error: null,
  showPopup: false,
};

export const disclaimerSlice = createSlice({
  name: "disclaimer",
  initialState,
  reducers: {
    fetchUserDataStart(state) {
      state.loadingUserData = true;
      state.error = null;
    },
    fetchUserDataSuccess(state, action: PayloadAction<UserData>) {
      state.loadingUserData = false;
      state.userData = action.payload;
      state.error = null;
      
      if (!action.payload.disclaimerChecked) {
        state.showPopup = true;
      }
    },
    fetchUserDataFailure(state, action: PayloadAction<string>) {
      state.loadingUserData = false;
      state.error = action.payload;
    },

    updateDisclaimerStart(state) {
      state.updatingDisclaimer = true;
      state.error = null;
    },
    updateDisclaimerSuccess(state, action: PayloadAction<boolean>) {
      state.updatingDisclaimer = false;
      if (state.userData) {
        state.userData.disclaimerChecked = action.payload;
      }
      state.error = null;
    },
    updateDisclaimerFailure(state, action: PayloadAction<string>) {
      state.updatingDisclaimer = false;
      state.error = action.payload;
    },

    showDisclaimerPopup(state) {
      state.showPopup = true;
    },
    hideDisclaimerPopup(state) {
      state.showPopup = false;
    },
    clearDisclaimerError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchUserDataStart,
  fetchUserDataSuccess,
  fetchUserDataFailure,
  updateDisclaimerStart,
  updateDisclaimerSuccess,
  updateDisclaimerFailure,
  showDisclaimerPopup,
  hideDisclaimerPopup,
  clearDisclaimerError,
} = disclaimerSlice.actions;

export default disclaimerSlice.reducer;

export const selectUserData = (state: RootState) => state.disclaimer.userData;
export const selectLoadingUserData = (state: RootState) => state.disclaimer.loadingUserData;
export const selectUpdatingDisclaimer = (state: RootState) => state.disclaimer.updatingDisclaimer;
export const selectDisclaimerError = (state: RootState) => state.disclaimer.error;
export const selectDisclaimerPopupVisible = (state: RootState) => state.disclaimer.showPopup;
export const selectIsFirstTime = (state: RootState) => 
  state.disclaimer.userData ? !state.disclaimer.userData.disclaimerChecked : false;
export const selectIsAdmin = (state: RootState) => 
  state.disclaimer.userData?.role === 'ADMIN';
