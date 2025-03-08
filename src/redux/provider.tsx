// src/redux/provider.tsx
"use client"

import { store } from "./store"
import { Provider } from "react-redux";
import { useEffect } from "react";
import { useAppDispatch } from "@/redux/store"; // ✅ Use Typed Dispatch
import { fetchUserThunk } from "@/redux/slices/AuthSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch(); // ✅ Typed Dispatch

  useEffect(() => {
    dispatch(fetchUserThunk()); // ✅ No TypeScript error
  }, [dispatch]);

  return <>{children}</>;
}


