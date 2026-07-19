import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isChecking: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isChecking: true,
  isLoading: false,
  error: null,
};

export const checkAuth = createAsyncThunk('auth/check', async (_, thunkAPI) => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.data.user;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to authenticate';
    return thunkAPI.rejectWithValue(message);
  }
});

export const login = createAsyncThunk('auth/login', async (credentials: any, thunkAPI) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const { user, accessToken } = response.data.data;
    localStorage.setItem('asp_access_token', accessToken);
    return user;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData: any, thunkAPI) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data.message;
  } catch (error: any) {
    const message = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Registration failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Fail silently to clear local storage anyway
  } finally {
    localStorage.removeItem('asp_access_token');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isChecking = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isChecking = false;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isChecking = false;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
