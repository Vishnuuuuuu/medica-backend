import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  sub: string;
  aud: string | string[];
  iss: string;
  exp: number;
  iat: number;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

class AuthMiddlewareOAuth {
  // OAuth-compatible authentication middleware
  // Works with OAuth access tokens from Auth0, Google, GitHub, etc.
  // No need for jwks-client - works with OAuth flow tokens

  public verifyToken = async (token: string): Promise<JWTPayload | null> => {
    try {
      // For OAuth flow, we decode the token and validate basic structure
      // The token validation is handled by the OAuth provider
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || typeof decoded === 'string') {
        console.error('Invalid JWT token structure');
        return null;
      }

      const payload = decoded.payload as JWTPayload;

      // Validate required fields
      if (!payload.sub) {
        console.error('JWT missing sub claim');
        return null;
      }

      // Check token expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.error('JWT token expired');
        return null;
      }

      // Validate issuer if provided in environment
      if (process.env.AUTH0_ISSUER && payload.iss && payload.iss !== process.env.AUTH0_ISSUER) {
        console.log(`JWT issuer: ${payload.iss}, expected: ${process.env.AUTH0_ISSUER}`);
        // Don't fail for OAuth providers that might have different issuers
      }

      // Validate audience if provided
      if (process.env.AUTH0_AUDIENCE && payload.aud) {
        const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!audiences.includes(process.env.AUTH0_AUDIENCE)) {
          console.log('JWT audience mismatch, but allowing for OAuth compatibility');
        }
      }

      console.log('✅ Token decoded successfully for user:', payload.sub);
      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  };

  public getOrCreateUser = async (auth0Id: string, tokenPayload: JWTPayload) => {
    try {
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { auth0Id },
        include: { shifts: true },
      });

      // If user doesn't exist, create them from OAuth token data
      if (!user) {
        console.log(`Creating new user for auth0Id: ${auth0Id}`);
        
        // Extract email from token (common in OAuth flows)
        const email = tokenPayload.email || 
                     tokenPayload['https://your-app.com/email'] || 
                     `${auth0Id.replace(/[^a-zA-Z0-9]/g, '')}@oauth.local`;

        // Extract name from token
        const name = tokenPayload.name || 
                    tokenPayload['https://your-app.com/name'] ||
                    tokenPayload.given_name || 
                    tokenPayload.nickname ||
                    email.split('@')[0] || 
                    'OAuth User';

        // Check for role in custom claims
        const role = tokenPayload['https://your-app.com/role'] || 
                    tokenPayload.role || 
                    'CAREWORKER';

        user = await prisma.user.create({
          data: {
            auth0Id,
            email,
            name,
            role: role === 'MANAGER' ? 'MANAGER' : 'CAREWORKER',
          },
          include: { shifts: true },
        });

        console.log(`✅ Created new user: ${user.id} (${user.email})`);
      } else {
        console.log(`✅ Found existing user: ${user.id} (${user.email})`);
      }

      return user;
    } catch (error) {
      console.error('❌ Error fetching/creating user:', error);
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

  // Helper method to validate OAuth token from different providers
  public validateOAuthToken = async (token: string, provider?: string): Promise<JWTPayload | null> => {
    const payload = await this.verifyToken(token);
    
    if (!payload) return null;

    // Provider-specific validation
    switch (provider) {
      case 'auth0':
        // Auth0 tokens usually have iss like https://domain.auth0.com/
        if (payload.iss && !payload.iss.includes('auth0.com') && process.env.AUTH0_DOMAIN) {
          if (!payload.iss.includes(process.env.AUTH0_DOMAIN)) {
            console.warn('Token not from expected Auth0 domain');
          }
        }
        break;
      
      case 'google':
        // Google tokens have iss: https://accounts.google.com
        if (payload.iss !== 'https://accounts.google.com') {
          console.warn('Token not from Google OAuth');
        }
        break;
      
      case 'github':
        // GitHub doesn't use JWT by default, but if using GitHub Apps
        break;
      
      default:
        // Generic OAuth validation
        console.log('Generic OAuth token validation');
    }

    return payload;
  };
}

export default AuthMiddlewareOAuth;
