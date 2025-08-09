import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define the shift data type
interface ShiftData {
  userId: string;
  clockInAt: Date;
  clockOutAt?: Date;
  clockInNote?: string;
  clockOutNote?: string;
  clockInLat?: number;
  clockInLng?: number;
  clockOutLat?: number;
  clockOutLng?: number;
}

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Clear existing data (optional - remove in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log('👥 Creating users...');
  
  // Create admin manager (your account)
  console.log('🔑 Creating admin manager account...');
  const hashedPassword = await bcrypt.hash('Vishnu@123', 12);
  const adminManager = await prisma.user.create({
    data: {
      auth0Id: 'email|itsvishnups@admin.com',
      email: 'itsvishnups@admin.com',
      name: 'Vishnu PS (Admin)',
      password: hashedPassword,
      role: UserRole.MANAGER,
    },
  });
  console.log('✅ Created admin manager:', adminManager.name);
  
  // Create managers
  const manager1 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|manager1_12345',
      email: 'manager1@healthcare.com',
      name: 'Dr. Sarah Wilson',
      role: UserRole.MANAGER,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|manager2_67890',
      email: 'manager2@healthcare.com',
      name: 'John Director',
      role: UserRole.MANAGER,
    },
  });

  // Create careworkers
  const careworker1 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|careworker1_11111',
      email: 'alice.nurse@healthcare.com',
      name: 'Alice Johnson',
      role: UserRole.CAREWORKER,
    },
  });

  const careworker2 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|careworker2_22222',
      email: 'bob.caregiver@healthcare.com',
      name: 'Bob Martinez',
      role: UserRole.CAREWORKER,
    },
  });

  const careworker3 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|careworker3_33333',
      email: 'carol.assistant@healthcare.com',
      name: 'Carol Thompson',
      role: UserRole.CAREWORKER,
    },
  });

  const careworker4 = await prisma.user.create({
    data: {
      auth0Id: 'auth0|careworker4_44444',
      email: 'david.aide@healthcare.com',
      name: 'David Chen',
      role: UserRole.CAREWORKER,
    },
  });

  console.log('✅ Created users:', {
    admin: adminManager.name,
    managers: [manager1.name, manager2.name],
    careworkers: [careworker1.name, careworker2.name, careworker3.name, careworker4.name],
  });

  // Create comprehensive shifts for the past week
  console.log('⏰ Creating shifts for the past 7 days...');
  
  const now = new Date();
  const shifts: ShiftData[] = [];

  // Helper function to create dates
  const createDate = (daysAgo: number, hour: number, minute: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // Create realistic shifts for the past 7 days
  for (let day = 0; day < 7; day++) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(now.getTime() - day * 24 * 60 * 60 * 1000).getDay()];
    
    // Morning shift - Alice (careworker1) - Every day except Sunday
    if (day < 6 && day !== 0) { // Complete shifts for past 6 days, skip today
      shifts.push({
        userId: careworker1.id,
        clockInAt: createDate(day, 7, 30), // 7:30 AM
        clockOutAt: createDate(day, 15, 45), // 3:45 PM
        clockInNote: `Morning shift start - ${dayName}`,
        clockOutNote: `Morning shift complete - All patients visited`,
        clockInLat: 40.7128 + (Math.random() - 0.5) * 0.001,
        clockInLng: -74.0060 + (Math.random() - 0.5) * 0.001,
        clockOutLat: 40.7128 + (Math.random() - 0.5) * 0.001,
        clockOutLng: -74.0060 + (Math.random() - 0.5) * 0.001,
      });
    } else if (day === 0) { // Today - currently clocked in
      shifts.push({
        userId: careworker1.id,
        clockInAt: createDate(day, 7, 45), // 7:45 AM today
        clockInNote: 'Started morning shift - ready for patient rounds',
        clockInLat: 40.7128,
        clockInLng: -74.0060,
      });
    }

    // Evening shift - Bob (careworker2) - 5 days a week
    if (day < 5 && day !== 0) {
      shifts.push({
        userId: careworker2.id,
        clockInAt: createDate(day, 15, 30), // 3:30 PM
        clockOutAt: createDate(day, 23, 15), // 11:15 PM
        clockInNote: `Evening shift - ${dayName}`,
        clockOutNote: `Evening shift complete - Night preparations done`,
        clockInLat: 40.7589 + (Math.random() - 0.5) * 0.001,
        clockInLng: -73.9851 + (Math.random() - 0.5) * 0.001,
        clockOutLat: 40.7589 + (Math.random() - 0.5) * 0.001,
        clockOutLng: -73.9851 + (Math.random() - 0.5) * 0.001,
      });
    } else if (day === 0) { // Today - currently clocked in
      shifts.push({
        userId: careworker2.id,
        clockInAt: createDate(day, 15, 30), // 3:30 PM today
        clockInNote: 'Started evening shift - taking over from morning team',
        clockInLat: 40.7589,
        clockInLng: -73.9851,
      });
    }

    // Part-time shifts - Carol (careworker3) - 3 days a week
    if (day >= 2 && day <= 4) {
      shifts.push({
        userId: careworker3.id,
        clockInAt: createDate(day, 9, 0), // 9:00 AM
        clockOutAt: createDate(day, 14, 0), // 2:00 PM
        clockInNote: `Part-time shift - ${dayName}`,
        clockOutNote: `Part-time shift complete - Medication rounds done`,
        clockInLat: 40.7282 + (Math.random() - 0.5) * 0.001,
        clockInLng: -73.9942 + (Math.random() - 0.5) * 0.001,
        clockOutLat: 40.7282 + (Math.random() - 0.5) * 0.001,
        clockOutLng: -73.9942 + (Math.random() - 0.5) * 0.001,
      });
    }

    // Weekend shifts - David (careworker4) - Weekends only
    if (day === 1 || day === 2) { // Saturday and Sunday
      shifts.push({
        userId: careworker4.id,
        clockInAt: createDate(day, 8, 0), // 8:00 AM
        clockOutAt: createDate(day, 20, 0), // 8:00 PM
        clockInNote: `Weekend shift - ${dayName}`,
        clockOutNote: `Weekend shift complete - Full coverage provided`,
        clockInLat: 40.7505 + (Math.random() - 0.5) * 0.001,
        clockInLng: -73.9934 + (Math.random() - 0.5) * 0.001,
        clockOutLat: 40.7505 + (Math.random() - 0.5) * 0.001,
        clockOutLng: -73.9934 + (Math.random() - 0.5) * 0.001,
      });
    }
  }

  // Add some overtime shifts
  shifts.push({
    userId: careworker1.id,
    clockInAt: createDate(3, 23, 30), // Late night emergency
    clockOutAt: createDate(2, 2, 15), // Early morning
    clockInNote: 'Emergency call - patient needs immediate attention',
    clockOutNote: 'Emergency handled - patient stable',
    clockInLat: 40.7128,
    clockInLng: -74.0060,
    clockOutLat: 40.7128,
    clockOutLng: -74.0060,
  });

  // Create all shifts
  for (const shiftData of shifts) {
    await prisma.shift.create({
      data: shiftData,
    });
  }

  console.log(`✅ Created ${shifts.length} shifts`);
  console.log('📊 Shift summary:');
  
  // Count shifts per user
  const shiftCounts = await prisma.shift.groupBy({
    by: ['userId'],
    _count: {
      id: true,
    },
  });

  for (const count of shiftCounts) {
    const user = await prisma.user.findUnique({
      where: { id: count.userId },
    });
    console.log(`   ${user?.name}: ${count._count.id} shifts`);
  }

  // Count currently clocked in users
  const clockedInCount = await prisma.shift.count({
    where: {
      clockOutAt: null,
    },
  });

  console.log(`👥 Currently clocked in: ${clockedInCount} users`);
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
