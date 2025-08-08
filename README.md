# Healthcare Shift Logging Backend

A GraphQL backend for healthcare shift logging built with Node.js, TypeScript, Apollo Server, Prisma, and PostgreSQL.

## Features

- JWT authentication with Auth0
- Role-based access control (CAREWORKER, MANAGER)
- GraphQL API for shift management
- Location tracking for clock-in/out
- Dashboard statistics for managers
- Real-time shift monitoring

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **GraphQL**: Apollo Server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0 with JWT validation
- **Development**: Hot reload with nodemon

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Auth0 account and application

## Setup

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_shifts?schema=public"
   AUTH0_DOMAIN=your-auth0-domain.auth0.com
   AUTH0_AUDIENCE=your-api-identifier
   AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
   ```

3. **Authentication Setup**:
   - For development: Current setup works out of the box
   - For production: See `AUTH_SETUP.md` for detailed instructions

4. **Database Setup**:
   ```bash
   npm run db:push
   npm run generate
   npm run db:seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## GraphQL Schema

### Queries
- `me`: Get current user profile
- `shifts`: Get user's shift history
- `staffClockedIn`: List currently clocked-in staff (Manager only)
- `staffShiftLogs`: All shift logs (Manager only)
- `dashboardStats`: Staff statistics (Manager only)

### Mutations
- `clockIn(input: { note?, lat?, lng? })`: Start a shift
- `clockOut(input: { note?, lat?, lng? })`: End a shift

## Authentication

Include JWT token in requests:
```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### User
- `id`, `auth0Id`, `email`, `name`, `role`, `createdAt`, `updatedAt`

### Shift
- `id`, `clockInAt`, `clockOutAt`, `clockInNote`, `clockOutNote`
- `clockInLat`, `clockInLng`, `clockOutLat`, `clockOutLng`
- `userId`, `createdAt`, `updatedAt`

## Scripts

- `npm run dev`: Development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run db:push`: Push schema to database
- `npm run db:studio`: Open Prisma Studio
- `npm run db:seed`: Seed database with sample data
- `npm run generate`: Generate Prisma client

## Deployment

Ready for deployment to Railway, Heroku, or similar platforms. Ensure environment variables are properly configured in your deployment environment.

## Project Structure

```
src/
├── index.ts              # Main server file
├── schema.ts             # GraphQL schema definitions
├── types.ts              # TypeScript type definitions
├── middleware/
│   └── auth.ts           # Auth0 JWT middleware
└── resolvers/
    └── index.ts          # GraphQL resolvers
prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding script
```
