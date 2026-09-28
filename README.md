# SHADDAD Logistics Backend

Production-ready backend API service for SHADDAD logistics marketplace (Saudi Arabia).

## Tech Stack
- Node.js & TypeScript
- Express
- PostgreSQL & Prisma ORM
- Redis (GEO & Caching)
- Socket.IO (Real-time tracking)
- Firebase (Notifications & Storage)

## Architecture
- `controllers/`: HTTP parsing, validation, DTO mapping
- `services/`: Business logic & domain rules (depends on `IRepository`)
- `repositories/`: Database persistence via Prisma (implements `IRepository`)
- `app.ts` / `server.ts` separation with Dependency Injection
