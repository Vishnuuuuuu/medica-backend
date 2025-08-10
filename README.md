# Medical Care Worker Management System - Backend

A robust Node.js/Express backend API for managing care worker shifts, locations, and user data with Auth0 integration, GPS-based tracking, and real-time data processing.

## 🚀 Features

### Authentication & User Management
- **Auth0 Integration** - Secure JWT token validation and user authentication
- **Automatic User Creation** - Users created in database upon first Auth0 login
- **Role-Based Access** - Support for CAREWORKER and MANAGER roles
- **User Synchronization** - Automatic sync of Auth0 user data with local database
- **Real User Data Extraction** - Pulls actual names and emails from Auth0 profiles
- **Optimized User Sync** - Session-based caching prevents redundant database operations

### Core Functionality

#### Shift Management
- **GPS-Based Clock In/Out** - Location-verified time tracking with configurable radius
- **Active Shift Tracking** - Real-time monitoring of currently active shifts
- **Shift History** - Comprehensive logging of all shift activities
- **Duration Calculation** - Automatic calculation of shift durations in minutes
- **Coordinate Precision** - 6-decimal GPS precision for accurate distance validation

#### Location Management
- **Dynamic Location Configuration** - Configurable facility locations with GPS coordinates
- **Radius Validation** - Customizable check-in radius (default: 100 meters)
- **Distance Calculation** - Haversine formula implementation for precise GPS distance
- **Location Updates** - Real-time location updates via RESTful endpoints

#### Data & Analytics
- **Real-Time Staff Monitoring** - Live tracking of active staff members
- **User Statistics** - Comprehensive user and shift analytics
- **Shift Logs** - Detailed shift reporting with user relationships
- **Performance Metrics** - Aggregated data for management dashboards

## 🏗️ Architecture

### Tech Stack
- **Node.js** with TypeScript for type safety
- **Express.js** for RESTful API framework
- **Prisma ORM** for database management and migrations
- **PostgreSQL** for data persistence
- **JWT Authentication** for secure API access
- **CORS** for cross-origin resource sharing

## 🚦 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Auth0 account for JWT validation

### Environment Setup

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/care_worker_db"

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Origins
FRONTEND_URL=http://localhost:5173
```

### Installation & Running

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev --name init
npx prisma generate

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev

# Start production server
npm start
```

## 🚀 API Endpoints

### Authentication & Users
```
POST   /api/users/sync           # Sync user with Auth0 data
GET    /api/users               # Get all users
POST   /api/users/fix-info      # Update user information
```

### Shift Management
```
POST   /api/shifts/clock-in     # Clock in with GPS coordinates
POST   /api/shifts/clock-out    # Clock out and calculate duration
GET    /api/shifts/active       # Get active shift for user
GET    /api/shifts/logs         # Get all shift logs
```

### Staff & Analytics
```
GET    /api/staff/active        # Get currently active staff
GET    /api/location            # Get location configuration
POST   /api/location            # Update location settings
```

### Health & Status
```
GET    /health                  # Health check endpoint
GET    /graphql                 # GraphQL endpoint (if enabled)
```

## 📊 Database Schema

### User Model
```typescript
model User {
  id        String   @id @default(cuid())
  auth0Id   String   @unique
  email     String   @unique
  name      String
  role      Role     @default(CAREWORKER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  shifts    Shift[]
}
```

### Shift Model
```typescript
model Shift {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  clockInAt  DateTime  @default(now())
  clockOutAt DateTime?
  latitude   Float
  longitude  Float
  duration   Int?      // Duration in minutes
  note       String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## 🔧 Recent Optimizations & Improvements

### Performance Enhancements
- **Optimized User Sync** - Users only synced once per session to prevent redundancy
- **Reduced Database Calls** - Eliminated duplicate user creation and updates
- **Enhanced Coordinate Precision** - 6-decimal GPS precision for accurate distance calculations
- **Streamlined Clock Operations** - Simplified clock-in/out processes without redundant updates

### API Improvements
- **RESTful Endpoints** - Comprehensive REST API replacing GraphQL for better performance
- **Real-Time Data** - Live data integration for manager dashboards and staff monitoring
- **Error Handling** - Improved error logging and user feedback
- **Response Optimization** - Optimized API responses with relevant data only

### Location & GPS Features
- **Haversine Distance Calculation** - Precise GPS distance validation
- **Configurable Location Settings** - Dynamic location configuration via API
- **Coordinate Validation** - Input validation for realistic GPS coordinates
- **Distance Logging** - Detailed logging for GPS-based operations

## 🔐 Security & Authentication

### JWT Validation
- **Auth0 Integration** - Seamless JWT token validation
- **Role-Based Access** - API endpoints respect user roles
- **Token Verification** - All protected endpoints validate JWT tokens

### Data Security
- **Input Sanitization** - All input data validated and sanitized
- **SQL Injection Prevention** - Prisma ORM provides built-in protection
- **CORS Configuration** - Proper cross-origin resource sharing setup

## 📝 Scripts & Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript for production
npm start              # Start production server

# Database Management
npx prisma migrate dev  # Run database migrations
npx prisma generate    # Generate Prisma client
npx prisma db seed     # Seed database with sample data
npx prisma studio      # Open Prisma Studio database browser

# Testing & Quality
npm test               # Run tests
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

### Development Workflow
1. **Database Changes** - Use Prisma migrations for schema updates
2. **API Development** - Add new endpoints in `src/routes/`
3. **Testing** - Test endpoints using provided API examples
4. **Type Safety** - Maintain TypeScript throughout the application

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
AUTH0_DOMAIN=your-production-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-production-client-id
AUTH0_CLIENT_SECRET=your-production-client-secret
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Health Monitoring
```bash
# Check API health
curl http://localhost:4000/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-08-10T14:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── schema.ts             # GraphQL schema (legacy)
│   ├── types.ts              # TypeScript type definitions
│   ├── health-check.ts       # Health check endpoint
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── auth-auth0.ts     # Auth0 integration
│   │   └── auth-production.ts # Production auth setup
│   ├── routes/
│   │   ├── shifts.ts         # Main API routes
│   │   └── auth.ts           # Authentication routes
│   └── resolvers/            # GraphQL resolvers (legacy)
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeding
├── scripts/
│   ├── setup-db.ts          # Database setup utilities
│   └── verify-db.ts         # Database verification
└── package.json             # Dependencies and scripts
```

## 📚 Additional Documentation

- [`API_EXAMPLES.md`](./API_EXAMPLES.md) - Complete API usage examples
- [`AUTH_SETUP.md`](./AUTH_SETUP.md) - Auth0 configuration guide
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Production deployment instructions
- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) - High-level project overview

---

Built with ❤️ for modern healthcare management
