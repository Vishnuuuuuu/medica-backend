import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  userId: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

class AuthMiddlewareJWT {
  // JWT authentication middleware for our app's own tokens
  // Handles both email/password and Google OAuth generated tokens

  public verifyToken = async (token: string): Promise<JWTPayload | null> => {
    try {
      // Verify our own JWT tokens
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JWTPayload;

      if (!decoded) {
        console.error('JWT verification failed');
        return null;
      }

      // Validate required fields
      if (!decoded.sub || !decoded.userId) {
        console.error('JWT missing required claims');
        return null;
      }

      return decoded;
    } catch (error: any) {
      console.error('JWT verification error:', error.message);
      return null;
    }
  };

  public getUser = async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { shifts: true },
      });
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  public getOrCreateUser = async (auth0Id: string, tokenPayload: JWTPayload) => {
    try {
      // Use userId from token if available, otherwise fall back to auth0Id lookup
      if (tokenPayload.userId) {
        const user = await this.getUser(tokenPayload.userId);
        if (user) return user;
      }

      // Fallback to auth0Id lookup (for legacy compatibility)
      const user = await prisma.user.findUnique({
        where: { auth0Id },
        include: { shifts: true },
      });

      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  };

  public extractTokenFromHeader = (authorization?: string): string | null => {
    if (!authorization) return null;
    
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  };
}

export default AuthMiddlewareJWT;
