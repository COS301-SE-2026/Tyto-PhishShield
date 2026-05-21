export type UserRole = 'admin' | 'analyst' | 'user';

export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  createdAt: string;
  updatedAt: string;
  xp: number;
  rank: number;
  // Extended profile fields below (future backend fields), not sure if it will be ready for Demo 1
  //streak?: number;
  //reportsField?: number;
  //securityScore?: number;
  //avatarInitials?: string;
}

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export type CampaignStatus = 'draft' | 'active' | 'complete' | 'scheduled';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  sentCount: number;
  clickedCount: number;
  reportedCount: number;
  targetDepartments: string[];
  startDate: string;
  endDate: string | null;
  createdBy: string;
  emailSubject?: string;
  emailBody?: string;
}

// Below is for Training; currently stubbed; future microservice; not sure if it will be ready for Demo 1

export type TrainingStatus = 'not_started' | 'in_progress' | 'completed';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  status: TrainingStatus;
  score?: number;
  dueDate?: string;
  completedDate?: string;
  estimatedMinutes: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
  icon: string;
}

export interface ActivityItem {
  id: string;
  type: 'report' | 'training' | 'click' | 'badge' | 'login';
  title: string;
  timestamp: string;
  xpDelta?: number;
}

export type Theme = 'light' | 'dark';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface ErrorResponse {
  message?: string;
  statusCode?: number;
}

export interface SendEmailResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

export interface XPResponse {
  userId: string;
  xp: number;
  status?: "Success" | "Error";
  message?: string;
}