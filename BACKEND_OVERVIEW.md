# 🏥 Healthcare Shift Logging Backend - Complete Overview

## 🎯 **What Our Backend Does**

This is a **complete GraphQL API** for healthcare shift management that allows:
- **Care workers** to clock in/out of shifts with location tracking
- **Managers** to monitor staff, view analytics, and manage shifts
- **OAuth authentication** for secure access
- **Real-time shift tracking** with optional GPS coordinates

---

## 🏗️ **Architecture & Tech Stack**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │────│                 │────│                 │
│ React/Next.js   │    │ Node.js + TS    │    │ PostgreSQL      │
│ GraphQL Client  │    │ Apollo Server   │    │ Prisma ORM      │
│ OAuth Login     │    │ JWT Middleware  │    │ 2 Tables        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Stack:**
- **Node.js** + **TypeScript** (Runtime & Language)
- **Apollo Server** (GraphQL API)
- **Prisma ORM** (Database Interface)
- **PostgreSQL** (Database)
- **OAuth/JWT** (Authentication)

---

## 📊 **Database Schema**

### **Users Table**
```sql
User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(CAREWORKER)  -- CAREWORKER | MANAGER
  auth0Id   String   @unique               -- OAuth provider ID
  createdAt DateTime @default(now())
  shifts    Shift[]                        -- One-to-many relation
}
```

### **Shifts Table**
```sql
Shift {
  id           String    @id @default(cuid())
  userId       String                      -- Foreign key to User
  clockInAt    DateTime                    -- Required: When shift started
  clockOutAt   DateTime?                   -- Optional: When shift ended
  clockInNote  String?                     -- Optional: Clock-in note
  clockOutNote String?                     -- Optional: Clock-out note
  clockInLat   Float?                      -- Optional: GPS latitude
  clockInLng   Float?                      -- Optional: GPS longitude
  clockOutLat  Float?                      -- Optional: GPS latitude
  clockOutLng  Float?                      -- Optional: GPS longitude
  createdAt    DateTime  @default(now())
  user         User      @relation(fields: [userId], references: [id])
}
```

---

## 🔐 **Authentication Flow**

```
1. User logs in via OAuth (Google/Auth0/GitHub)
2. Frontend receives JWT token
3. Frontend sends GraphQL requests with "Bearer <token>" header
4. Backend validates JWT and extracts user info
5. User context attached to all GraphQL resolvers
```

**Current Setup:**
- Development: JWT decode-only (no signature verification)
- Production: Full OAuth signature verification
- Supports multiple OAuth providers

---

## 📡 **GraphQL API Endpoints**

### **Queries (Read Data)**

```graphql
# Get current user info
me: User

# Get all shifts for logged-in user
shifts: [Shift!]!

# [MANAGER ONLY] Get list of currently clocked-in staff
staffClockedIn: [User!]!

# [MANAGER ONLY] Get all shifts from all users
staffShiftLogs: [Shift!]!

# [MANAGER ONLY] Get dashboard analytics
dashboardStats: [DashboardStats!]!
```

### **Mutations (Write Data)**

```graphql
# Clock into a shift
clockIn(input: ClockInInput!): Shift!

# Clock out of current shift
clockOut(input: ClockOutInput!): Shift!
```

### **Input Types**

```graphql
input ClockInInput {
  note: String
  lat: Float
  lng: Float
}

input ClockOutInput {
  note: String
  lat: Float
  lng: Float
}
```

### **Dashboard Stats Type**

```graphql
type DashboardStats {
  avgHoursPerDay: Float!
  clockInsToday: Int!
  totalHoursThisWeek: Float!
  userId: ID!
  userName: String!
}
```

---

## 🔄 **Complete User Flow**

### **Care Worker Journey:**
```
1. Login via OAuth → JWT token
2. Open app → GraphQL: me query → Get user profile
3. Start shift → GraphQL: clockIn mutation → Record start time + location
4. Work shift...
5. End shift → GraphQL: clockOut mutation → Record end time + location
6. View history → GraphQL: shifts query → See all past shifts
```

### **Manager Journey:**
```
1. Login via OAuth → JWT token (role: MANAGER)
2. Dashboard → GraphQL: dashboardStats → Analytics overview
3. Live monitoring → GraphQL: staffClockedIn → Who's currently working
4. Audit shifts → GraphQL: staffShiftLogs → All staff shift history
```

---

## 🏃‍♂️ **How to Run the Backend**

### **1. Setup Database**
```bash
# Create tables in PostgreSQL
npm run db:push

# Add sample data (multiple users + shifts)
npm run db:seed

# Verify everything works
npm run db:verify

# Complete setup (all in one)
npm run db:setup
```

### **2. Start Server**
```bash
# Development (auto-reload)
npm run dev

# Production
npm run build && npm start
```

### **3. Test API**
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health

---

## 📈 **What the Dashboard Stats Provide**

For each care worker, managers can see:

```typescript
DashboardStats {
  avgHoursPerDay: Float     // Average working hours per day (last 30 days)
  clockInsToday: Int        // Number of times clocked in today
  totalHoursThisWeek: Float // Total hours worked this week
  userId: String           // User identifier
  userName: String         // Display name
}
```

---

## 🔧 **Current Database State**

After running `npm run db:seed`, you'll have:

**Users:**
- **Dr. Sarah Wilson** (MANAGER) - `manager1@healthcare.com`
- **John Director** (MANAGER) - `manager2@healthcare.com`
- **Alice Johnson** (CAREWORKER) - `alice.nurse@healthcare.com`
- **Bob Martinez** (CAREWORKER) - `bob.caregiver@healthcare.com`
- **Carol Thompson** (CAREWORKER) - `carol.assistant@healthcare.com`
- **David Chen** (CAREWORKER) - `david.aide@healthcare.com`

**Shifts:**
- Comprehensive shift data for the past 7 days
- Various shift patterns (morning, evening, part-time, weekend)
- Some users currently clocked in
- Location data for all shifts
- Realistic shift notes and durations

---

## 🚀 **Deployment Ready**

**Environment Variables Required:**
```env
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api
AUTH0_ISSUER=https://your-domain.auth0.com/
JWT_SECRET=your-secret
PORT=4000
FRONTEND_URL=https://your-frontend.com
```

**Platform Support:**
- ✅ Railway (recommended)
- ✅ Heroku  
- ✅ Vercel
- ✅ DigitalOcean
- ✅ AWS/GCP

---

## 📝 **Available NPM Scripts**

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start               # Start production server

# Database Management
npm run db:push         # Create/update database schema
npm run db:seed         # Add sample data
npm run db:setup        # Complete database setup
npm run db:reset        # Reset database with fresh data
npm run db:studio       # Open Prisma Studio (database GUI)
npm run db:verify       # Check database status

# Utilities
npm run health          # Run health check
npm run generate        # Generate Prisma client
npm run setup          # Install dependencies + generate client
```

---

## 🎯 **Sample API Calls**

### **Authentication Header**
```
Authorization: Bearer <your-jwt-token>
```

### **Get Current User**
```graphql
query {
  me {
    id
    email
    name
    role
    shifts {
      id
      clockInAt
      clockOutAt
    }
  }
}
```

### **Clock In**
```graphql
mutation {
  clockIn(input: {
    note: "Starting morning shift"
    lat: 40.7128
    lng: -74.0060
  }) {
    id
    clockInAt
    clockInNote
    user {
      name
    }
  }
}
```

### **Manager Dashboard**
```graphql
query {
  dashboardStats {
    userId
    userName
    avgHoursPerDay
    clockInsToday
    totalHoursThisWeek
  }
  
  staffClockedIn {
    name
    email
    shifts(where: { clockOutAt: null }) {
      clockInAt
      clockInNote
    }
  }
}
```

---

## 🔐 **Security Features**

- ✅ JWT token validation
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Input validation via GraphQL schema
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Environment variable configuration
- ✅ Graceful error handling

---

## 🎯 **What You Can Do Next**

1. **Test the API** - Use GraphQL playground to try queries
2. **Connect Frontend** - Integrate with React/Next.js app
3. **Add OAuth Provider** - Configure Auth0/Google/GitHub
4. **Deploy** - Push to Railway/Heroku with environment variables
5. **Extend Features** - Add notifications, reports, etc.

The backend is **production-ready** and handles all the core healthcare shift logging requirements! 🏥✨

---

## 📁 **Project Structure**

```
backend/
├── src/
│   ├── index.ts              # Main Apollo Server setup
│   ├── schema.ts             # GraphQL type definitions
│   ├── types.ts              # TypeScript interfaces
│   ├── health-check.ts       # System health validation
│   ├── middleware/
│   │   ├── auth.ts           # Development auth middleware
│   │   ├── auth-oauth.ts     # Production OAuth middleware
│   │   └── auth-production.ts # Alternative production auth
│   └── resolvers/
│       └── index.ts          # GraphQL query/mutation handlers
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   └── seed.ts              # Comprehensive sample data
├── scripts/
│   ├── setup-db.ts          # Database setup script
│   └── verify-db.ts         # Database verification script
├── docs/
│   ├── API_EXAMPLES.md       # GraphQL query examples
│   ├── AUTH_SETUP.md         # OAuth setup guide
│   ├── PROJECT_OVERVIEW.md   # Comprehensive documentation
│   └── README.md            # Setup instructions
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── railway.json              # Railway deployment config
├── .env.example              # Environment template
└── .gitignore               # Git ignore rules
```

This backend provides a **complete, production-ready solution** for healthcare shift logging with modern technologies and best practices! 🚀
