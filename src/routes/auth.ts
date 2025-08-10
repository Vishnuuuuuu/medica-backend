import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify Auth0 JWT token
const verifyAuth0Token = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In a real app, you'd verify the Auth0 JWT properly
    // For now, we'll decode without verification (NOT for production)
    const decoded = jwt.decode(token) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get or create user with role information
router.post('/user', async (req, res) => {
  try {
    const { auth0Id, email, name } = req.body;

    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'auth0Id and email are required' });
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    // If user doesn't exist, create them with default CAREWORKER role
    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id,
          email,
          name: name || email.split('@')[0],
          role: 'CAREWORKER' // Default role
        }
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      auth0Id: user.auth0Id
    });
  } catch (error) {
    console.error('Error creating/fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (Admin only - you can add admin middleware later)
router.patch('/user/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['CAREWORKER', 'MANAGER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be CAREWORKER or MANAGER' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for admin role management)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
