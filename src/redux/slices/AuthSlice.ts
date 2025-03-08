import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "@/lib/utils/axiosClient";

// Login Thunk
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.post("/api/auth/login", {
        username,
        password,
      });
      return response.data; // expected shape: { message, user }
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || "Login failed");
    }
  }
);

// Register Thunk (Now logs in after successful registration)
export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    {
      email,
      username,
      password,
    }: { email: string; username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Register the user
      const registerResponse = await axiosClient.post("/api/user/register", {
        email,
        username,
        password,
      });

      // After successful registration, automatically login the user
      const loginResponse = await axiosClient.post("/api/auth/login", {
        username,
        password,
      });

      // Return the login response (so Redux gets user info immediately)
      return loginResponse.data; // Expected shape: { message, user }
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.error || "Registration failed"
      );
    }
  }
);

// Fetch User Thunk for Persistent Login
// Fetch User Thunk for Persistent Login
export const fetchUserThunk = createAsyncThunk(
  "auth/fetchUser",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state: any = getState();

    // ✅ Skip fetch if user is already null (not logged in)
    if (!state.auth.user) {
      return rejectWithValue("User not logged in, skipping fetch.");
    }

    try {
      console.log('fetching user...')
      // ✅ Fetch user data
      const response = await axiosClient.get("/api/user/me");

      return response.data;
    } catch (error) {
      if ((error as any).response?.status === 401) {
        // ❌ If unauthorized, log out the user
        dispatch(logoutThunk());
      }

      return rejectWithValue((error as any)?.response?.data?.error || "Something went wrong");
    }
  }
);

// Logout Thunk
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/api/auth/logout");
      return response.data; // { message: "Logged out successfully" }
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || "Logout failed");
    }
  }
);

// ------------------ Auth State ---------------------
interface AuthState {
  user: {
    id?: string;
    username?: string;
    email?: string;
  } | null;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  dialogMode: "login" | "register" | null;
}

const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;

const initialState: AuthState = {
  user: storedUser ? JSON.parse(atob(storedUser)) : null, // ✅ Decode user data
  loading: false,
  error: null,
  dialogOpen: false,
  dialogMode: "login",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openAuthDialog: (state, action) => {
      console.log(state.dialogMode)
      state.dialogOpen = true;
      state.dialogMode = action.payload; // "login" or "register"
      state.error = null;
    },
    closeAuthDialog: (state) => {
      state.dialogOpen = false;
      state.dialogMode = "login";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    
      // ✅ Encode and store user data
      localStorage.setItem("user", btoa(JSON.stringify(action.payload.user)));
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    
      // ✅ Encode and store user data
      localStorage.setItem("user", btoa(JSON.stringify(action.payload.user)));
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch User on Reload
    builder.addCase(fetchUserThunk.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    });
    builder.addCase(fetchUserThunk.rejected, (state) => {
      state.loading = false;
      state.user = null;
    });

    // Logout
    builder.addCase(logoutThunk.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.error = null;
    
      // ✅ Clear localStorage on logout
      localStorage.removeItem("user");
    });    
    builder.addCase(logoutThunk.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { openAuthDialog, closeAuthDialog } = authSlice.actions;
export default authSlice.reducer;
