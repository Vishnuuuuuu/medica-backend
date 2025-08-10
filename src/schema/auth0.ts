import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    auth0Id: String!
    email: String!
    name: String!
    role: UserRole!
    shifts: [Shift!]!
  }

  type Shift {
    id: ID!
    userId: String!
    user: User!
    clockInAt: String!
    clockOutAt: String
    clockInNote: String
    clockOutNote: String
    clockInLat: Float
    clockInLng: Float
    clockOutLat: Float
    clockOutLng: Float
  }

  type DashboardStats {
    totalStaff: Int!
    activeStaff: Int!
    todayShifts: Int!
    hoursWorked: Float!
  }

  enum UserRole {
    MANAGER
    CAREWORKER
  }

  input ClockInInput {
    note: String
    latitude: Float
    longitude: Float
  }

  input ClockOutInput {
    note: String
    latitude: Float
    longitude: Float
  }

  type Query {
    me: User
    shifts: [Shift!]!
    staffClockedIn: [User!]!
    staffShiftLogs: [Shift!]!
    dashboardStats: DashboardStats!
  }

  type Mutation {
    clockIn(input: ClockInInput!): Shift!
    clockOut(input: ClockOutInput!): Shift!
  }
`;
