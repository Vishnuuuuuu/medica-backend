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

class AuthMiddleware {
  public verifyToken = async (token: string): Promise<JWTPayload | null> => {
    try {
      // NOTE: This is a simplified version for development
      // In production, you should verify with Auth0's public key using jwks-client
      // For now, we're just decoding the token without signature verification
      
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

      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
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

export default AuthMiddleware;
