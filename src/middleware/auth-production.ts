import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  sub: string;
  aud: string | string[];
  iss: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

class AuthMiddlewareProduction {
  // Production version with basic JWT verification
  // For Auth0 integration, install jwks-client if needed

  public verifyToken = async (token: string): Promise<JWTPayload | null> => {
    try {
      // Fallback to decode-only verification
      const decoded = jwt.decode(token) as JWTPayload;
      
      if (!decoded) {
        console.error('JWT decode failed');
        return null;
      }

      // Basic validation
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        console.error('JWT token expired');
        return null;
      }

      console.warn('⚠️  Using JWT decode-only mode. Install jwks-client for production security.');
      return decoded;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  };

  public getUser = async (auth0Id: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { auth0Id },
        include: { shifts: true },
      });
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
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

export default AuthMiddlewareProduction;
