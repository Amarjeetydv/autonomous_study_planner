export enum AUTH_ROLES {
  STUDENT = 'Student',
  MENTOR = 'Mentor',
  ADMIN = 'Admin',
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale: string;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: Array<{ field?: string; message: string }>;
}
