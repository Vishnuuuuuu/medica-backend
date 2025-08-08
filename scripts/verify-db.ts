import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying Healthcare Shift Database Setup...');
    console.log('=' .repeat(50));

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection: SUCCESS');

    // Check tables and data
    const userCount = await prisma.user.count();
    const shiftCount = await prisma.shift.count();
    const activeShifts = await prisma.shift.count({
      where: { clockOutAt: null }
    });

    console.log('\n📊 Database Statistics:');
    console.log(`   👥 Total Users: ${userCount}`);
    console.log(`   ⏰ Total Shifts: ${shiftCount}`);
    console.log(`   🔄 Active Shifts: ${activeShifts}`);

    // Show users by role
    const managerCount = await prisma.user.count({
      where: { role: 'MANAGER' }
    });
    const careworkerCount = await prisma.user.count({
      where: { role: 'CAREWORKER' }
    });

    console.log('\n👤 Users by Role:');
    console.log(`   🏥 Managers: ${managerCount}`);
    console.log(`   👨‍⚕️ Careworkers: ${careworkerCount}`);

    // Show recent shifts
    console.log('\n📋 Recent Shifts:');
    const recentShifts = await prisma.shift.findMany({
      take: 5,
      orderBy: { clockInAt: 'desc' },
      include: { user: true }
    });

    recentShifts.forEach((shift, index) => {
      const status = shift.clockOutAt ? '✅ Completed' : '🔄 Active';
      const duration = shift.clockOutAt 
        ? `${Math.round((shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / (1000 * 60 * 60) * 10) / 10}h`
        : 'Ongoing';
      
      console.log(`   ${index + 1}. ${shift.user.name} - ${status} (${duration})`);
      console.log(`      Clock In: ${shift.clockInAt.toLocaleString()}`);
      if (shift.clockOutAt) {
        console.log(`      Clock Out: ${shift.clockOutAt.toLocaleString()}`);
      }
      console.log(`      Note: ${shift.clockInNote || 'No note'}`);
      console.log('');
    });

    // Show currently clocked in users
    console.log('🔄 Currently Clocked In:');
    const activeUsers = await prisma.user.findMany({
      where: {
        shifts: {
          some: {
            clockOutAt: null
          }
        }
      },
      include: {
        shifts: {
          where: {
            clockOutAt: null
          }
        }
      }
    });

    if (activeUsers.length === 0) {
      console.log('   No users currently clocked in');
    } else {
      activeUsers.forEach(user => {
        const activeShift = user.shifts[0];
        const hoursWorked = Math.round((Date.now() - activeShift.clockInAt.getTime()) / (1000 * 60 * 60) * 10) / 10;
        console.log(`   👤 ${user.name} (${user.role})`);
        console.log(`      Started: ${activeShift.clockInAt.toLocaleString()}`);
        console.log(`      Working for: ${hoursWorked} hours`);
        console.log('');
      });
    }

    console.log('🎉 Database verification completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Visit GraphQL Playground: http://localhost:4000/graphql');
    console.log('   3. Test API with authentication headers');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check DATABASE_URL in .env file');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Run: npm run db:setup');
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if this file is executed directly
if (require.main === module) {
  verifyDatabase();
}

export default verifyDatabase;
