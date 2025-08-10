import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ClockInInput, ClockOutInput, Context, DashboardStats } from '../types';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },

    shifts: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return await prisma.shift.findMany({
        where: { userId: context.user.id },
        include: { user: true },
        orderBy: { clockInAt: 'desc' },
      });
    },

    staffClockedIn: async (_: any, __: any, context: Context) => {
      if (!context.user || context.user.role !== UserRole.MANAGER) {
        throw new Error('Access denied. Manager role required.');
      }

      // Find users who have clocked in but not clocked out
      const clockedInShifts = await prisma.shift.findMany({
        where: {
          clockOutAt: null,
        },
        include: { user: true },
        orderBy: { clockInAt: 'desc' },
      });

      return clockedInShifts.map(shift => shift.user);
    },

    staffShiftLogs: async (_: any, __: any, context: Context) => {
      if (!context.user || context.user.role !== UserRole.MANAGER) {
        throw new Error('Access denied. Manager role required.');
      }

      return await prisma.shift.findMany({
        include: { user: true },
        orderBy: { clockInAt: 'desc' },
      });
    },

    dashboardStats: async (_: any, __: any, context: Context): Promise<DashboardStats[]> => {
      if (!context.user || context.user.role !== UserRole.MANAGER) {
        throw new Error('Access denied. Manager role required.');
      }

      const users = await prisma.user.findMany({
        where: { role: UserRole.CAREWORKER },
        include: { shifts: true },
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: DashboardStats[] = [];

      for (const user of users) {
        // Calculate average hours per day (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentShifts = user.shifts.filter(
          shift => shift.clockInAt >= thirtyDaysAgo && shift.clockOutAt
        );

        const totalHours = recentShifts.reduce((sum, shift) => {
          if (shift.clockOutAt) {
            const hours = (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

        const avgHoursPerDay = recentShifts.length > 0 ? totalHours / Math.min(30, recentShifts.length) : 0;

        // Count clock-ins today
        const clockInsToday = user.shifts.filter(
          shift => shift.clockInAt >= today
        ).length;

        // Calculate total hours this week
        const weeklyShifts = user.shifts.filter(
          shift => shift.clockInAt >= weekAgo && shift.clockOutAt
        );

        const totalHoursThisWeek = weeklyShifts.reduce((sum, shift) => {
          if (shift.clockOutAt) {
            const hours = (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

        stats.push({
          userName: user.name || user.email,
          avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
          clockInsToday,
          totalHoursThisWeek: Math.round(totalHoursThisWeek * 100) / 100,
        });
      }

      return stats;
    },
  },

  Mutation: {
    signUp: async (_: any, { input }: { input: { name: string; email: string; password: string; role: UserRole } }) => {
      const { name, email, password, role } = input;

      // Only allow CAREWORKER signups for now
      if (role !== UserRole.CAREWORKER) {
        throw new Error('Only care worker signup is currently allowed');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with email-based auth0Id for compatibility
      const user = await prisma.user.create({
        data: {
          auth0Id: `email|${email}`,
          email,
          name,
          password: hashedPassword,
          role,
        },
        include: { shifts: true },
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.auth0Id, 
          email: user.email,
          name: user.name,
          role: user.role,
          userId: user.id 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        token,
        user,
      };
    },

    login: async (_: any, { input }: { input: { email: string; password: string } }) => {
      const { email, password } = input;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { shifts: true },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      if (user.password) {
        // User has a password stored (email-based auth)
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }
      } else {
        // User doesn't have a password (OAuth-based auth)
        // For migration purposes, allow login but should set password later
        console.log(`User ${email} logging in without password (OAuth migration)`);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.auth0Id, 
          email: user.email,
          name: user.name,
          role: user.role,
          userId: user.id 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        token,
        user,
      };
    },

    clockIn: async (_: any, { input }: { input: ClockInInput }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if user is already clocked in
      const existingShift = await prisma.shift.findFirst({
        where: {
          userId: context.user.id,
          clockOutAt: null,
        },
      });

      if (existingShift) {
        throw new Error('You are already clocked in. Please clock out first.');
      }

      const shift = await prisma.shift.create({
        data: {
          userId: context.user.id,
          clockInAt: new Date(),
          clockInNote: input.note,
          clockInLat: input.lat,
          clockInLng: input.lng,
        },
        include: { user: true },
      });

      return shift;
    },

    clockOut: async (_: any, { input }: { input: ClockOutInput }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Find the active shift (clocked in but not clocked out)
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: context.user.id,
          clockOutAt: null,
        },
        orderBy: { clockInAt: 'desc' },
      });

      if (!activeShift) {
        throw new Error('No active shift found. Please clock in first.');
      }

      const updatedShift = await prisma.shift.update({
        where: { id: activeShift.id },
        data: {
          clockOutAt: new Date(),
          clockOutNote: input.note,
          clockOutLat: input.lat,
          clockOutLng: input.lng,
        },
        include: { user: true },
      });

      return updatedShift;
    },
  },
};
