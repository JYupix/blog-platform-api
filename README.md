# Blog Platform API

🚀 Modern REST API for a blog platform with complete authentication system.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** JWT + HTTP-only Cookies
- **Email:** Resend
- **Validation:** Zod

## Features

### ✅ Authentication System (Complete)
- User registration with email verification
- Login with JWT
- Password reset flow
- Session management with token versioning
- Protected routes with middleware

### 🚧 Coming Soon
- Posts CRUD
- Comments
- Likes
- User profiles
- Roles & permissions

## Installation
```bash
# Clone repository
git clone git@github.com:JYupix/blog-platform-api.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables
```env
DATABASE_URL=
JWT_SECRET=
RESEND_API_KEY=
FRONTEND_URL=
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (protected)

## Author

**JYupix**

## License

MIT