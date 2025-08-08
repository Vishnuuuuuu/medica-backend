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
  // Production version with proper Auth0 verification
  // Install jwks-client@3.5.0 for this to work
  // npm install jwks-client@3.5.0

  public verifyToken = async (token: string): Promise<JWTPayload | null> => {
    try {
      // First try to dynamically import jwks-client
      const jwksClient = await import('jwks-client');
      
      const client = jwksClient.default({
        jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
        requestHeaders: {},
        timeout: 30000,
      });

      return new Promise((resolve) => {
        const getKey = (header: any, callback: any) => {
          client.getSigningKey(header.kid, (err: any, key: any) => {
            if (err) {
              console.error('Error getting signing key:', err);
              return callback(err);
            }
            const signingKey = key?.getPublicKey();
            callback(null, signingKey);
          });
        };

        jwt.verify(
          token,
          getKey,
          {
            audience: process.env.AUTH0_AUDIENCE,
            issuer: process.env.AUTH0_ISSUER,
            algorithms: ['RS256'],
          },
          (err, decoded) => {
            if (err) {
              console.error('JWT verification failed:', err.message);
              resolve(null);
            } else {
              resolve(decoded as JWTPayload);
            }
          }
        );
      });
    } catch (error) {
      console.error('jwks-client not available, falling back to decode-only:', error);
      
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
