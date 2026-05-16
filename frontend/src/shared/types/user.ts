export type UserRole = 'student' | 'teacher' | 'admin';
export type AuthProvider = 'email' | 'google' | 'github';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  role: UserRole;
  auth_provider: AuthProvider;
  email_verified: boolean;
}
