import gql from 'graphql-tag';

export const typeDefs = gql`
  enum UserRole {
    CAREWORKER
    MANAGER
  }

  type User {
    id: ID!
    auth0Id: String!
    email: String!
    name: String
    role: UserRole!
    createdAt: String!
    updatedAt: String!
    shifts: [Shift!]!
  }

  type Shift {
    id: ID!
    clockInAt: String!
    clockOutAt: String
    clockInNote: String
    clockOutNote: String
    clockInLat: Float
    clockInLng: Float
    clockOutLat: Float
    clockOutLng: Float
    createdAt: String!
    updatedAt: String!
    user: User!
  }

  type DashboardStats {
    avgHoursPerDay: Float!
    clockInsToday: Int!
    totalHoursThisWeek: Float!
    userId: ID!
    userName: String!
  }

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

  type AuthPayload {
    token: String!
    user: User!
  }

  input SignUpInput {
    name: String!
    email: String!
    password: String!
    role: UserRole!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    me: User
    shifts: [Shift!]!
    staffClockedIn: [User!]!
    staffShiftLogs: [Shift!]!
    dashboardStats: [DashboardStats!]!
  }

  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    clockIn(input: ClockInInput!): Shift!
    clockOut(input: ClockOutInput!): Shift!
  }
`;
