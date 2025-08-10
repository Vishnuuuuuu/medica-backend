import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';

import AuthMiddleware from './middleware/auth-production';
import { resolvers } from './resolvers/auth0';
import authRoutes from './routes/auth';
import shiftsRoutes from './routes/shifts';
import { typeDefs } from './schema/auth0';
import { Context } from './types';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const authMiddleware = new AuthMiddleware();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
      };
    },
  });

  await server.start();

  // Global middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://medica-frontend.vercel.app', process.env.FRONTEND_URL].filter((url): url is string => Boolean(url))
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        let user = null;

        // Extract and verify Auth0 JWT token
        const token = authMiddleware.extractTokenFromHeader(req.headers.authorization);
        
        if (token) {
          try {
            const decodedToken = await authMiddleware.verifyToken(token);
            if (decodedToken && decodedToken.sub) {
              // Get or create user by Auth0 ID  
              user = await authMiddleware.getOrCreateUser(decodedToken.sub, decodedToken);
            }
          } catch (error) {
            console.error('Token verification error:', error);
          }
        }

        return {
          user,
          prisma,
        };
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Add CORS for all API routes
  app.use('/api', cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://medica-frontend.vercel.app', process.env.FRONTEND_URL].filter((url): url is string => Boolean(url))
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api', shiftsRoutes);

  // Start the server
  const PORT = process.env.PORT || 4000;
  
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: PORT }, resolve);
  });

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 Health check at http://localhost:${PORT}/health`);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('📴 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📴 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
