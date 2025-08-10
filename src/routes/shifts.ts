import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Round coordinates to 6 decimal places to avoid precision issues
  lat1 = Math.round(lat1 * 1000000) / 1000000;
  lon1 = Math.round(lon1 * 1000000) / 1000000;
  lat2 = Math.round(lat2 * 1000000) / 1000000;
  lon2 = Math.round(lon2 * 1000000) / 1000000;

  // Debug logging
  console.log('Distance calculation:', {
    user: { lat: lat1, lng: lon1 },
    location: { lat: lat2, lng: lon2 }
  });

  // Validate coordinates
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  // Check if coordinates are within valid ranges
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
    console.error('Coordinates out of valid range:', { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // Distance in meters
  console.log('Calculated distance:', Math.round(distance), 'meters');
  
  return distance;
}

// Global location configuration (mutable for updates)
let GLOBAL_LOCATION = {
  name: "Main Healthcare Center",
  latitude: 13.067014, // Rounded to 6 decimal places
  longitude: 77.466541, // Rounded to 6 decimal places
  radius: 2000 // 2km radius
};

// Get global location
router.get('/locations', async (req, res) => {
  try {
    res.json([GLOBAL_LOCATION]);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create/Update global location
router.post('/locations', async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius = 2000 } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Name, latitude, and longitude are required' 
      });
    }

    // Update the global location constant
    GLOBAL_LOCATION.name = name;
    GLOBAL_LOCATION.latitude = parseFloat(latitude);
    GLOBAL_LOCATION.longitude = parseFloat(longitude);
    GLOBAL_LOCATION.radius = parseFloat(radius);

    // For now, just return the updated location
    const location = {
      id: 'global-location',
      name,
      address: address || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
      isActive: true
    };

    res.json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update global location
router.patch('/locations/:id', async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius = 2000 } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Name, latitude, and longitude are required' 
      });
    }

      // Update the global location constant
      GLOBAL_LOCATION.name = name;
      GLOBAL_LOCATION.latitude = Math.round(parseFloat(latitude) * 1000000) / 1000000; // 6 decimal places
      GLOBAL_LOCATION.longitude = Math.round(parseFloat(longitude) * 1000000) / 1000000; // 6 decimal places
      GLOBAL_LOCATION.radius = parseFloat(radius);

      const location = {
        id: 'global-location',
        name,
        address: address || '',
        latitude: GLOBAL_LOCATION.latitude,
        longitude: GLOBAL_LOCATION.longitude,
        radius: GLOBAL_LOCATION.radius,
        isActive: true
      };    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Clock in with location validation
router.post('/shifts/clock-in', async (req, res) => {
  try {
    const { userId, latitude, longitude, note, userName, userEmail } = req.body;

    console.log('Clock-in request received:', { userId, latitude, longitude, note, userName, userEmail });

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'userId, latitude, and longitude are required' 
      });
    }

    // Check if user exists - user should already exist from AuthContext sync
    let user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      console.log('⚠️ User not found during clock-in, creating fallback user:', userId);
      
      // Fallback user creation (should rarely happen now with AuthContext sync)
      const finalUserName = userName || 'Care Worker';
      const finalUserEmail = userEmail || `${userId}@temp.com`;
      
      // Create user with real data from frontend
      user = await prisma.user.create({
        data: {
          auth0Id: userId,
          email: finalUserEmail,
          name: finalUserName,
          role: 'CAREWORKER'
        }
      });
      console.log('✅ Created fallback user:', { id: user.id, name: user.name, email: user.email });
    } else {
      console.log('✅ Found existing user:', { id: user.id, name: user.name, email: user.email });
      // Skip redundant updates since user data is now synced in AuthContext
    }

    // Check if user already has an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id, // Use the database user ID, not auth0Id
        clockOutAt: null
      }
    });

    if (activeShift) {
      return res.status(400).json({ 
        error: 'You already have an active shift. Please clock out first.' 
      });
    }

    // Always validate against the global location
    console.log('Global location for validation:', GLOBAL_LOCATION);

    // Calculate distance from the global location
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      GLOBAL_LOCATION.latitude,
      GLOBAL_LOCATION.longitude
    );

    if (distance > GLOBAL_LOCATION.radius) {
      return res.status(400).json({ 
        error: `You must be within ${GLOBAL_LOCATION.radius}m of ${GLOBAL_LOCATION.name} to clock in. You are ${Math.round(distance)}m away.`,
        distance: Math.round(distance),
        allowedRadius: GLOBAL_LOCATION.radius,
        locationName: GLOBAL_LOCATION.name
      });
    }

    // Create the shift
    const shift = await prisma.shift.create({
      data: {
        userId: user.id, // Use the database user ID
        clockInAt: new Date(),
        clockInLat: parseFloat(latitude),
        clockInLng: parseFloat(longitude),
        clockInNote: note
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log('Clock-in successful:', shift.id);
    res.json(shift);
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock out with location validation
router.post('/shifts/clock-out', async (req, res) => {
  try {
    const { userId, latitude, longitude, note, userName, userEmail } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'userId, latitude, and longitude are required' 
      });
    }

    // Find the user first
    let user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'User not found. Please clock in first.' 
      });
    }

    // Update user information if provided
    if (userName && userName !== user.name) {
      console.log('Updating user name from:', user.name, 'to:', userName);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: userName }
      });
    }
    if (userEmail && userEmail !== user.email && !userEmail.includes('@temp.com')) {
      console.log('Updating user email from:', user.email, 'to:', userEmail);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email: userEmail }
      });
    }

    // Find the active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id, // Use database user ID
        clockOutAt: null
      }
    });

    if (!activeShift) {
      return res.status(400).json({ 
        error: 'No active shift found. Please clock in first.' 
      });
    }

    // Calculate distance from the global location with proper coordinate precision
    const userLat = Math.round(parseFloat(latitude) * 1000000) / 1000000; // 6 decimal places
    const userLng = Math.round(parseFloat(longitude) * 1000000) / 1000000; // 6 decimal places
    
    console.log('Clock-out location validation:', {
      userLocation: { lat: userLat, lng: userLng },
      globalLocation: { lat: GLOBAL_LOCATION.latitude, lng: GLOBAL_LOCATION.longitude },
      radius: GLOBAL_LOCATION.radius
    });

    const distance = calculateDistance(
      userLat,
      userLng,
      GLOBAL_LOCATION.latitude,
      GLOBAL_LOCATION.longitude
    );

    console.log('Clock-out distance calculated:', distance, 'meters');

    if (distance > GLOBAL_LOCATION.radius) {
      return res.status(400).json({ 
        error: `You must be within ${GLOBAL_LOCATION.radius}m of ${GLOBAL_LOCATION.name} to clock out. You are ${Math.round(distance)}m away.`,
        distance: Math.round(distance),
        allowedRadius: GLOBAL_LOCATION.radius,
        locationName: GLOBAL_LOCATION.name
      });
    }

    // Update the shift with clock out information
    const updatedShift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        clockOutAt: new Date(),
        clockOutLat: userLat, // Use the rounded coordinates
        clockOutLng: userLng, // Use the rounded coordinates
        clockOutNote: note
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    res.json(updatedShift);
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Get user's current active shift
router.get('/shifts/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.json(null); // No user, no active shift
    }

    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id, // Use database user ID
        clockOutAt: null
      }
    });

    res.json(activeShift);
  } catch (error) {
    console.error('Error fetching active shift:', error);
    res.status(500).json({ error: 'Failed to fetch active shift' });
  }
});

// Get user's shift history
router.get('/shifts/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.json({
        shifts: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });
    }

    const shifts = await prisma.shift.findMany({
      where: { userId: user.id }, // Use database user ID
      orderBy: { clockInAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.shift.count({
      where: { userId: user.id } // Use database user ID
    });

    res.json({
      shifts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shift history:', error);
    res.status(500).json({ error: 'Failed to fetch shift history' });
  }
});

// Get all shifts for managers
router.get('/shifts', async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.clockInAt = {};
      if (startDate) where.clockInAt.gte = new Date(startDate as string);
      if (endDate) where.clockInAt.lte = new Date(endDate as string);
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { clockInAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.shift.count({ where });

    res.json({
      shifts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Update user information
router.patch('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ 
        error: 'At least name or email is required' 
      });
    }

    // Find user by auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Update user information
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      }
    });

    console.log('Updated user:', { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user information manually (for fixing existing data)
router.post('/users/fix-info', async (req, res) => {
  try {
    const { auth0Id, name, email } = req.body;

    if (!auth0Id) {
      return res.status(400).json({ 
        error: 'auth0Id is required' 
      });
    }

    // Find user by auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Update user information
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      }
    });

    console.log('Fixed user info:', { 
      id: updatedUser.id, 
      auth0Id: updatedUser.auth0Id,
      name: updatedUser.name, 
      email: updatedUser.email 
    });
    
    res.json({
      message: 'User information updated successfully',
      user: {
        id: updatedUser.id,
        auth0Id: updatedUser.auth0Id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error fixing user info:', error);
    res.status(500).json({ error: 'Failed to update user information' });
  }
});

// Sync user with database (create or update)
router.post('/users/sync', async (req, res) => {
  try {
    const { auth0Id, name, email, role } = req.body;

    console.log('Syncing user:', { auth0Id, name, email, role });

    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'Auth0 ID and email are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id }
    });

    let user;
    if (existingUser) {
      // Update existing user with latest info
      user = await prisma.user.update({
        where: { auth0Id },
        data: {
          name: name || existingUser.name,
          email: email || existingUser.email,
          role: role || existingUser.role,
          updatedAt: new Date()
        }
      });
      console.log('Updated existing user:', user);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          auth0Id,
          name: name || 'User',
          email,
          role: role || 'CAREWORKER'
        }
      });
      console.log('Created new user:', user);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user with database' });
  }
});

// Get all users (for manager dashboard)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        auth0Id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            shifts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get currently active staff (for manager dashboard)
router.get('/staff/active', async (req, res) => {
  try {
    const activeStaff = await prisma.shift.findMany({
      where: {
        clockOutAt: null // Only shifts that haven't clocked out
      },
      include: {
        user: {
          select: {
            id: true,
            auth0Id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        clockInAt: 'desc'
      }
    });

    // Transform the data to match what the frontend expects
    const transformedStaff = activeStaff.map(shift => ({
      id: shift.user.id,
      auth0Id: shift.user.auth0Id,
      name: shift.user.name,
      email: shift.user.email,
      role: shift.user.role,
      shiftId: shift.id,
      clockInAt: shift.clockInAt,
      clockInLocation: {
        latitude: shift.clockInLat,
        longitude: shift.clockInLng
      },
      note: shift.clockInNote,
      status: 'ACTIVE'
    }));

    res.json(transformedStaff);
  } catch (error) {
    console.error('Error fetching active staff:', error);
    res.status(500).json({ error: 'Failed to fetch active staff' });
  }
});

// Get all shift logs (for manager dashboard)
router.get('/shifts/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const shifts = await prisma.shift.findMany({
      include: {
        user: {
          select: {
            id: true,
            auth0Id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { clockInAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.shift.count();

    // Transform the data to match what the frontend expects
    const transformedShifts = shifts.map(shift => ({
      id: shift.id,
      user: shift.user,
      clockInAt: shift.clockInAt,
      clockOutAt: shift.clockOutAt,
      clockInLocation: {
        latitude: shift.clockInLat,
        longitude: shift.clockInLng
      },
      clockOutLocation: shift.clockOutLat && shift.clockOutLng ? {
        latitude: shift.clockOutLat,
        longitude: shift.clockOutLng
      } : null,
      clockInNote: shift.clockInNote,
      clockOutNote: shift.clockOutNote,
      duration: shift.clockOutAt ? 
        Math.round((new Date(shift.clockOutAt).getTime() - new Date(shift.clockInAt).getTime()) / (1000 * 60)) : // Duration in minutes
        null,
      status: shift.clockOutAt ? 'COMPLETED' : 'ACTIVE'
    }));

    res.json({
      shifts: transformedShifts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shift logs:', error);
    res.status(500).json({ error: 'Failed to fetch shift logs' });
  }
});

export default router;
