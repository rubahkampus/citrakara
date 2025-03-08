// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/AuthSlice";
import { TypedUseSelectorHook, useSelector, useDispatch } from "react-redux";

export const store = configureStore({
  reducer: {
    auth: authReducer, // Combine your other slices here as well
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;