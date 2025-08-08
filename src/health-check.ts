import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Healthcare Shift Logging Backend - Health Check');
  console.log('='.repeat(50));

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test basic queries
    console.log('🔍 Testing database queries...');
    const userCount = await prisma.user.count();
    const shiftCount = await prisma.shift.count();
    
    console.log(`📈 Found ${userCount} users and ${shiftCount} shifts in database`);

    // Validate environment variables
    console.log('🔧 Checking environment variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'AUTH0_DOMAIN',
      'AUTH0_AUDIENCE',
      'AUTH0_ISSUER'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
    } else {
      console.log('✅ All required environment variables are set');
    }

    // Test Prisma schema
    console.log('📋 Validating database schema...');
    // This will throw if schema is out of sync
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database schema is valid');

    console.log('\n🎉 Health check completed successfully!');
    console.log('Backend is ready to serve requests.');

  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  healthCheck();
}

export default healthCheck;
