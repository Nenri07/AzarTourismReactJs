// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";  
const isDevelopment = import.meta.env.VITE_ENV !== 'production';

const store = configureStore({
  reducer: {
    auth: authReducer,  
  },
  devTools: isDevelopment,
});

export default store;