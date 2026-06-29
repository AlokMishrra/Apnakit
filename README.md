# Ecommerce Platform

A full-stack ecommerce platform built with Next.js, NestJS, PostgreSQL, and Redis.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16, Redis 7 |
| Payment | Stripe |
| Storage | AWS S3 |
| Deployment | Docker, GitHub Actions |

## Features

### Customer Features
- Product browsing with search and filters
- Shopping cart with persistent state
- Secure checkout with Stripe
- Order tracking and history
- User authentication (email/password, OAuth)
- Wishlist functionality
- Product reviews and ratings

### Admin Features
- Dashboard with analytics
- Product management (CRUD)
- Order management
- Customer management
- Inventory tracking
- Discount/coupon management

### Technical Features
- Server-side rendering (SSR)
- Real-time inventory updates
- Image optimization
- Rate limiting
- API documentation (Swagger)
- Database migrations
- Automated testing
- CI/CD pipeline

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Browser   │  │   Mobile    │  │     CLI     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx                                 │
│              (SSL, Rate Limiting, Load Balancing)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │   Backend    │  │     CDN      │
│   Next.js    │  │   NestJS     │  │   (S3)      │
│   Port 3000  │  │   Port 3001  │  │              │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       │                 │
       ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Services                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │    Redis    │  │    S3       │         │
│  │    Port     │  │    Port     │  │  Storage    │         │
│  │    5432     │  │    6379     │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Setup environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start database services
docker-compose up -d postgres redis

# Run migrations
cd backend
npx prisma generate
npx prisma migrate dev
npm run seed
cd ..

# Start development servers
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs

## API Documentation

The API documentation is automatically generated using Swagger and available at `/api/docs` when the backend server is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order by ID |

## Development

### Available Scripts

```bash
# Root
npm run dev          # Start all development servers
npm run build        # Build all applications
npm run lint         # Lint all code
npm run test         # Run all tests

# Backend (in /backend)
npm run start:dev    # Start backend in development
npm run build        # Build backend
npm run test         # Run backend tests
npm run test:cov     # Run tests with coverage
npm run lint         # Lint backend code
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database

# Frontend (in /frontend)
npm run dev          # Start frontend in development
npm run build        # Build frontend
npm run start        # Start frontend in production
npm run lint         # Lint frontend code
npm run test         # Run frontend tests
```

### Database Management

```bash
# Open Prisma Studio
cd backend && npx prisma studio

# Reset database
cd backend && npx prisma migrate reset

# Create new migration
cd backend && npx prisma migrate dev --name migration_name
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- Docker deployment
- AWS deployment (EC2, RDS, ElastiCache, S3)
- Vercel deployment
- Railway/Render deployment
- SSL certificate setup
- CI/CD pipeline configuration
- Monitoring and logging
- Security checklist

### Quick Deploy with Docker

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

## Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run specific test file
npm run test -- --testFile=path/to/test.spec.ts

# Watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write tests for new features
- Update documentation as needed

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` code style changes (formatting, etc.)
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation:** [docs.yourdomain.com](https://docs.yourdomain.com)
- **Issues:** [GitHub Issues](https://github.com/yourusername/ecommerce-platform/issues)
- **Discord:** [Join our community](https://discord.gg/your-invite)

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
