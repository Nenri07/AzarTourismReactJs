// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";  // ← import default (the reducer)

const store = configureStore({
  reducer: {
    auth: authReducer,  // ← use the imported 
  },
});

export default store;