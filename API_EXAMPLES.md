# GraphQL API Examples

This document provides example queries and mutations for the Healthcare Shift Logging API.

## Authentication

All requests require a valid JWT token from Auth0. Include it in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Queries

### Get Current User Profile

```graphql
query Me {
  me {
    id
    email
    name
    role
    createdAt
    shifts {
      id
      clockInAt
      clockOutAt
      clockInNote
      clockOutNote
    }
  }
}
```

### Get User's Shift History

```graphql
query MyShifts {
  shifts {
    id
    clockInAt
    clockOutAt
    clockInNote
    clockOutNote
    clockInLat
    clockInLng
    clockOutLat
    clockOutLng
    createdAt
    user {
      name
      email
    }
  }
}
```

### Get Currently Clocked-In Staff (Manager Only)

```graphql
query StaffClockedIn {
  staffClockedIn {
    id
    name
    email
    role
    shifts(where: { clockOutAt: null }) {
      id
      clockInAt
      clockInNote
      clockInLat
      clockInLng
    }
  }
}
```

### Get All Staff Shift Logs (Manager Only)

```graphql
query StaffShiftLogs {
  staffShiftLogs {
    id
    clockInAt
    clockOutAt
    clockInNote
    clockOutNote
    user {
      id
      name
      email
      role
    }
  }
}
```

### Get Dashboard Statistics (Manager Only)

```graphql
query DashboardStats {
  dashboardStats {
    userId
    userName
    avgHoursPerDay
    clockInsToday
    totalHoursThisWeek
  }
}
```

## Mutations

### Clock In

```graphql
mutation ClockIn($input: ClockInInput!) {
  clockIn(input: $input) {
    id
    clockInAt
    clockInNote
    clockInLat
    clockInLng
    user {
      name
      email
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "note": "Starting morning shift",
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### Clock Out

```graphql
mutation ClockOut($input: ClockOutInput!) {
  clockOut(input: $input) {
    id
    clockInAt
    clockOutAt
    clockInNote
    clockOutNote
    clockInLat
    clockInLng
    clockOutLat
    clockOutLng
    user {
      name
      email
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "note": "Completed all patient rounds",
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

## Error Handling

The API returns structured errors with helpful messages:

```json
{
  "errors": [
    {
      "message": "You are already clocked in. Please clock out first.",
      "path": ["clockIn"]
    }
  ]
}
```

Common error scenarios:
- **Not authenticated**: Missing or invalid JWT token
- **Access denied**: Insufficient permissions for manager-only queries
- **Already clocked in**: Trying to clock in when already active
- **No active shift**: Trying to clock out without being clocked in

## Sample Workflow

1. **Careworker starts shift:**
   ```graphql
   mutation {
     clockIn(input: { 
       note: "Starting morning shift", 
       lat: 40.7128, 
       lng: -74.0060 
     }) {
       id
       clockInAt
     }
   }
   ```

2. **Careworker checks their shifts:**
   ```graphql
   query {
     shifts {
       id
       clockInAt
       clockOutAt
       clockInNote
     }
   }
   ```

3. **Manager checks who's currently working:**
   ```graphql
   query {
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

4. **Careworker ends shift:**
   ```graphql
   mutation {
     clockOut(input: { 
       note: "Completed all tasks", 
       lat: 40.7128, 
       lng: -74.0060 
     }) {
       id
       clockOutAt
     }
   }
   ```

5. **Manager reviews dashboard stats:**
   ```graphql
   query {
     dashboardStats {
       userName
       avgHoursPerDay
       clockInsToday
       totalHoursThisWeek
     }
   }
   ```
