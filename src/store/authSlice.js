// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userData: null,
  accessToken: "",
  authStatus: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.userData = action.payload.userData;
      state.accessToken = action.payload.accessToken;
      state.authStatus = true;
      
      // CRITICAL: Save to localStorage
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('userData', JSON.stringify(action.payload.userData));
      
      console.log('✅ LOGIN: Saved to localStorage');
    },
    logout: (state) => {
      state.userData = null;
      state.accessToken = "";
      state.authStatus = false;
      
      // Clear everything
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('lastActivity');
      
      console.log('🚪 LOGOUT: Cleared localStorage');
    },
    refreshData: (state, action) => {
      state.userData = action.payload.userData;
      state.accessToken = action.payload.accessToken;
      state.authStatus = true;
      
      // Update localStorage too
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('userData', JSON.stringify(action.payload.userData));
    },
  },
});

export const { login, logout, refreshData } = authSlice.actions;
export default authSlice.reducer;
