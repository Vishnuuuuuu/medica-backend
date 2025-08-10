import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface Auth0Payload {
  sub: string; // Auth0 user ID
  email?: string;
  name?: string;
  email_verified?: boolean;
  exp: number;
  iat: number;
  aud: string | string[];
  iss: string;
  [key: string]: any;
}

class AuthMiddlewareAuth0 {
  public verifyToken = async (token: string): Promise<Auth0Payload | null> => {
    try {
      // For development, we'll decode the token without verification
      // In production, you should implement proper JWKS verification
      const decoded = jwt.decode(token) as Auth0Payload;
      
      if (!decoded) {
        console.error('Auth0 token decode failed');
        return null;
      }

      // Basic validation
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        console.error('Auth0 token expired');
        return null;
      }

      // Validate Auth0 specific claims
      if (!decoded.sub || !decoded.iss || !decoded.aud) {
        console.error('Auth0 token missing required claims');
        return null;
      }

      // Validate issuer (Auth0 domain)
      if (decoded.iss !== process.env.AUTH0_ISSUER) {
        console.error('Auth0 token issuer mismatch');
        return null;
      }

      // Validate audience
      const audience = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
      if (!audience.includes(process.env.AUTH0_AUDIENCE!)) {
        console.error('Auth0 token audience mismatch');
        return null;
      }

      console.log('✅ Auth0 token validated successfully for user:', decoded.sub);
      return decoded;
    } catch (error: any) {
      console.error('Auth0 token verification error:', error.message);
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

  public getOrCreateUser = async (auth0Id: string, tokenPayload: Auth0Payload) => {
    try {
      // First try to find user by auth0Id
      let user = await prisma.user.findUnique({
        where: { auth0Id },
        include: { shifts: true },
      });

      // If user doesn't exist, create one
      if (!user && tokenPayload.email) {
        // Check if user exists with this email but no auth0Id (legacy user)
        const existingUser = await prisma.user.findUnique({
          where: { email: tokenPayload.email },
        });

        if (existingUser) {
          // Update existing user with auth0Id
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: { auth0Id },
            include: { shifts: true },
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              auth0Id,
              email: tokenPayload.email,
              name: tokenPayload.name || tokenPayload.email,
              role: 'CAREWORKER', // Default role, can be changed by admin
            },
            include: { shifts: true },
          });
        }
      }

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

export default AuthMiddlewareAuth0;
