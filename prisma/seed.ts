import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'loc-1' },
      update: {},
      create: {
        id: 'loc-1',
        name: 'Healthcare Center Downtown',
        address: '123 Main Street, Downtown, CA 90210',
        latitude: 34.0522,
        longitude: -118.2437,
        radius: 2000, // 2km radius
        isActive: true,
      },
    }),
    prisma.location.upsert({
      where: { id: 'loc-2' },
      update: {},
      create: {
        id: 'loc-2',
        name: 'Westside Medical Facility',
        address: '456 Oak Avenue, Westside, CA 90211',
        latitude: 34.0736,
        longitude: -118.4004,
        radius: 1500, // 1.5km radius
        isActive: true,
      },
    }),
    prisma.location.upsert({
      where: { id: 'loc-3' },
      update: {},
      create: {
        id: 'loc-3',
        name: 'Emergency Care Unit North',
        address: '789 Pine Street, North Valley, CA 90212',
        latitude: 34.1681,
        longitude: -118.2437,
        radius: 2500, // 2.5km radius
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created sample locations:', locations.length);

  // Create a sample user (optional - for testing)
  const sampleUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      auth0Id: 'test-auth0-id',
      email: 'test@example.com',
      name: 'Test Care Worker',
      role: 'CAREWORKER',
    },
  });

  console.log('✅ Created sample user:', sampleUser.email);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
