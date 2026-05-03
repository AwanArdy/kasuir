# Phase 1 Test Report: Central Foundation & Auth

This document records the testing process and results for Phase 1 of the Kasir Backend implementation.

## 1. Environment & Setup Verification
- **PostgreSQL**: Running and accepting connections on `localhost:5432`.
- **Database**: Created `kasir_central`.
- **Tooling**: Switched to `tsx` for better ESM/TypeScript support during execution.

## 2. Database Migration
Executed `npm run central:push` to synchronize the Drizzle schema with the PostgreSQL database.
- **Result**: `[✓] Changes applied`.
- **Tables Created**: `categories`, `units`, `products`, `roles`, `users`.

## 3. Data Seeding
Executed `npm run central:seed` to populate initial roles and a default admin user.
- **Command**: `tsx backend/central/seed.ts`
- **Result**:
    - Roles created: `admin`, `manager`, `cashier`.
    - Admin user created: `admin@kasir.com`.
    - Outlet ID generated: `5875bba0-c3d0-4832-acde-18799b5d9f22`.

## 4. Server Verification
Started the central backend server using `npm run central:dev`.

### A. Health Check
- **Endpoint**: `GET http://localhost:3001/health`
- **Result**:
```json
{
  "status": "ok",
  "server": "central"
}
```

### B. Authentication (Login)
Tested the login endpoint with the seeded credentials.
- **Endpoint**: `POST http://localhost:3001/auth/login`
- **Request Payload**:
```json
{
  "email": "admin@kasir.com",
  "password": "admin123"
}
```
- **Response**:
```json
{
   "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   "user" : {
      "id" : "67ac21d0-4d33-496c-8f2b-cea4b65454f5",
      "name" : "Main Admin",
      "outletId" : "5875bba0-c3d0-4832-acde-18799b5d9f22",
      "role" : "admin"
   }
}
```

## 5. Summary of Findings
- **Naming Consistency**: The API returns `camelCase` fields (`outletId`, `role`) despite the database using `snake_case`, satisfying Front-End requirements.
- **Security**: Password hashing via `bcryptjs` and token generation via `jsonwebtoken` are functioning correctly.
- **Schema**: All core tables for Phase 1 are correctly initialized and accessible.

**Conclusion**: Phase 1 is stable and ready for Phase 2 implementation. The results are fully aligned with the technical requirements in `BACKEND_DATA_SCHEMA.md`.
