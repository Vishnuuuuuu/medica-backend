import { PrismaClient, UserRole } from '@prisma/client';
import { Context, DashboardStats } from '../types';

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
        take: 100, // Limit to last 100 shifts
      });
    },

    dashboardStats: async (_: any, __: any, context: Context): Promise<DashboardStats> => {
      if (!context.user || context.user.role !== UserRole.MANAGER) {
        throw new Error('Access denied. Manager role required.');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalStaff, activeStaff, todayShifts, totalHoursToday] = await Promise.all([
        // Total staff count
        prisma.user.count({
          where: { role: UserRole.CAREWORKER },
        }),

        // Currently clocked in staff
        prisma.shift.count({
          where: {
            clockOutAt: null,
          },
        }),

        // Today's shifts count
        prisma.shift.count({
          where: {
            clockInAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),

        // Total hours worked today
        prisma.shift.aggregate({
          where: {
            clockInAt: {
              gte: today,
              lt: tomorrow,
            },
            clockOutAt: {
              not: null,
            },
          },
          _sum: {
            // This would need a computed field for hours worked
            // For now, we'll calculate it differently
          },
        }),
      ]);

      // Calculate total hours worked today (simplified)
      const completedShiftsToday = await prisma.shift.findMany({
        where: {
          clockInAt: {
            gte: today,
            lt: tomorrow,
          },
          clockOutAt: {
            not: null,
          },
        },
        select: {
          clockInAt: true,
          clockOutAt: true,
        },
      });

      const totalMinutes = completedShiftsToday.reduce((total, shift) => {
        if (shift.clockOutAt) {
          const duration = shift.clockOutAt.getTime() - shift.clockInAt.getTime();
          return total + duration / (1000 * 60); // Convert to minutes
        }
        return total;
      }, 0);

      const hoursWorked = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

      return {
        totalStaff,
        activeStaff,
        todayShifts,
        hoursWorked,
      };
    },
  },

  Mutation: {
    // Auth0 will handle authentication, so we remove signUp, login, googleAuth
    
    clockIn: async (_: any, { input }: { input: any }, context: Context) => {
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
        throw new Error('You are already clocked in');
      }

      const shift = await prisma.shift.create({
        data: {
          userId: context.user.id,
          clockInAt: new Date(),
          clockInNote: input.note,
          clockInLat: input.latitude,
          clockInLng: input.longitude,
        },
        include: { user: true },
      });

      return shift;
    },

    clockOut: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Find the active shift
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: context.user.id,
          clockOutAt: null,
        },
      });

      if (!activeShift) {
        throw new Error('You are not currently clocked in');
      }

      const shift = await prisma.shift.update({
        where: { id: activeShift.id },
        data: {
          clockOutAt: new Date(),
          clockOutNote: input.note,
          clockOutLat: input.latitude,
          clockOutLng: input.longitude,
        },
        include: { user: true },
      });

      return shift;
    },
  },
};
