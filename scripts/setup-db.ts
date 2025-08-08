import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test the connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      const shiftCount = await prisma.shift.count();
      
      console.log(`📊 Current database state:`);
      console.log(`   Users: ${userCount}`);
      console.log(`   Shifts: ${shiftCount}`);
      
      if (userCount === 0) {
        console.log('📝 Database is empty, running seed...');
        await seedDatabase();
      } else {
        console.log('✅ Database already has data!');
      }
      
    } catch (error) {
      console.log('❌ Tables not found, they need to be created first.');
      console.log('Please run: npx prisma db push');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        auth0Id: 'auth0|manager1_12345',
        email: 'manager@healthcare.com',
        name: 'Dr. Sarah Wilson',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        auth0Id: 'auth0|careworker1_11111',
        email: 'alice@healthcare.com',
        name: 'Alice Johnson',
        role: 'CAREWORKER',
      },
    }),
    prisma.user.create({
      data: {
        auth0Id: 'auth0|careworker2_22222',
        email: 'bob@healthcare.com',
        name: 'Bob Martinez',
        role: 'CAREWORKER',
      },
    }),
    prisma.user.create({
      data: {
        auth0Id: 'auth0|careworker3_33333',
        email: 'carol@healthcare.com',
        name: 'Carol Thompson',
        role: 'CAREWORKER',
      },
    }),
  ]);

  console.log('✅ Created users:', users.map(u => u.name));

  // Create some sample shifts
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const shifts = await Promise.all([
    // Completed shift yesterday
    prisma.shift.create({
      data: {
        userId: users[1].id, // Alice
        clockInAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 8 AM yesterday
        clockOutAt: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000), // 4 PM yesterday
        clockInNote: 'Morning shift - yesterday',
        clockOutNote: 'Completed all patient rounds',
        clockInLat: 40.7128,
        clockInLng: -74.0060,
        clockOutLat: 40.7128,
        clockOutLng: -74.0060,
      },
    }),
    // Currently active shift (clocked in, not clocked out)
    prisma.shift.create({
      data: {
        userId: users[2].id, // Bob
        clockInAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        clockInNote: 'Started morning shift',
        clockInLat: 40.7589,
        clockInLng: -73.9851,
      },
    }),
    // Another completed shift
    prisma.shift.create({
      data: {
        userId: users[3].id, // Carol
        clockInAt: twoHoursAgo,
        clockOutAt: oneHourAgo,
        clockInNote: 'Short shift',
        clockOutNote: 'Emergency coverage complete',
        clockInLat: 40.7282,
        clockInLng: -73.9942,
        clockOutLat: 40.7282,
        clockOutLng: -73.9942,
      },
    }),
  ]);

  console.log(`✅ Created ${shifts.length} shifts`);
  console.log('🎉 Database seed completed!');
}

// Run the setup
setupDatabase().catch(console.error);
