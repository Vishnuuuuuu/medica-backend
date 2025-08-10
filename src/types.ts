import { Shift, User } from '@prisma/client';

export interface Context {
  user?: (User & { shifts: Shift[] }) | null;
  prisma: any;
}

export interface ClockInInput {
  note?: string;
  lat?: number;
  lng?: number;
}

export interface ClockOutInput {
  note?: string;
  lat?: number;
  lng?: number;
}

export interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  todayShifts: number;
  hoursWorked: number;
}
