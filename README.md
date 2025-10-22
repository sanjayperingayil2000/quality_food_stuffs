# Quality Food Stuffs - Food Delivery Management System

![license](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

> A comprehensive food delivery management system built with Next.js, React, MongoDB, and Material-UI. Manage drivers, products, daily trips, expenses, and track business operations with real-time notifications and audit logging.

## 🚀 Features

### Core Modules
- **Dashboard Overview** - Real-time business metrics and analytics
- **Driver Management** - Complete driver profiles, routes, and performance tracking
- **Product Catalog** - Bakery and fresh product management with pricing
- **Daily Trip Management** - Route planning, product delivery tracking, and calculations
- **Additional Expenses** - Petrol, maintenance, salary, and other expense tracking
- **Employee Management** - Staff profiles, roles, and permissions
- **Activity Logging** - Comprehensive audit trail for all operations
- **Settings Management** - System configuration and user preferences

### Technical Features
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Real-time Notifications** - Toast notifications for all CRUD operations
- **Data Export** - PDF and Excel export functionality
- **Responsive Design** - Mobile-first approach with Material-UI components
- **Type Safety** - Full TypeScript implementation
- **API Documentation** - RESTful API with comprehensive endpoints
- **Database Integration** - MongoDB with Mongoose ODM
- **Audit Logging** - Complete history tracking for data changes

## 📱 Pages

### Authentication
- **Sign In** - Secure login with JWT tokens
- **Reset Password** - Password recovery with email verification

### Dashboard
- **Overview** - Business metrics and key performance indicators
- **Drivers** - Driver management and route assignments
- **Products** - Product catalog management (Bakery & Fresh)
- **Daily Trips** - Trip planning and delivery tracking
- **Additional Expenses** - Expense management and approval workflow
- **Employees** - Staff management and role assignments
- **Activity** - System activity and audit logs
- **Settings** - System configuration and user management
- **Account** - User profile and preferences

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 19.1.0** - UI library
- **Material-UI 7.1.1** - Component library
- **TypeScript 5.8.3** - Type safety
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Day.js** - Date manipulation
- **ApexCharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB 8.19.1** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- MongoDB database
- SMTP email service (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quality_food_stuffs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Environment Variables**
   ```env
   # Database
   MONGO_URL=mongodb://localhost:27017/quality_food_stuffs
   
   # API Configuration
   NEXT_PUBLIC_API_BASE=/api
   
   # JWT Secrets
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   
   # Token Expiration
   ACCESS_TOKEN_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=2h
   RESET_PASSWORD_TOKEN_EXPIRES_IN=1h
   
   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM_NAME=Quality Food Stuffs
   SMTP_FROM_EMAIL=noreply@qualityfoodstuffs.com
   
   # CORS Configuration
   CORS_ORIGIN=*
   
   # Application URLs
   APP_URL=http://localhost:3000
   RESET_PASSWORD_URL=http://localhost:3000/auth/reset-password
   
   # Seed Data
   SEED_SUPER_ADMIN_EMAIL=admin@qualityfoodstuffs.com
   SEED_SUPER_ADMIN_PASSWORD=AdminPass123!
   SEED_SUPER_ADMIN_NAME=Super Admin
   ```

5. **Seed the Database**
   ```bash
   npm run seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open in Browser**
   ```
   http://localhost:3000
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth?action=login` - User login
- `POST /api/auth?action=refresh` - Refresh access token
- `POST /api/auth?action=logout` - User logout
- `POST /api/auth?action=forgot-password` - Password reset request
- `POST /api/auth?action=reset-password` - Password reset confirmation

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `PATCH /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Product Management
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Daily Trip Management
- `GET /api/daily-trips` - Get all daily trips
- `POST /api/daily-trips` - Create new daily trip
- `GET /api/daily-trips/:id` - Get daily trip by ID
- `PATCH /api/daily-trips/:id` - Update daily trip
- `DELETE /api/daily-trips/:id` - Delete daily trip

### Additional Expenses
- `GET /api/additional-expenses` - Get all expenses
- `POST /api/additional-expenses` - Create new expense
- `GET /api/additional-expenses/:id` - Get expense by ID
- `PATCH /api/additional-expenses/:id` - Update expense
- `DELETE /api/additional-expenses/:id` - Delete expense

### Settings & History
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Create new setting
- `PATCH /api/settings/:key` - Update setting
- `GET /api/histories` - Get audit history
- `GET /api/me` - Get current user profile

### Authentication
All protected routes require `Authorization: Bearer <accessToken>` header.

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run typecheck    # Run TypeScript type checking
npm run format:write # Format code with Prettier
npm run format:check # Check code formatting

# Database
npm run seed         # Seed database with initial data

# Testing
npm run test         # Run test suite
```

## 📁 Project Structure

```
quality_food_stuffs/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── core/          # Core components
│   │   ├── dashboard/     # Dashboard components
│   │   └── notifications/ # Notification components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── middleware/        # API middleware
│   ├── models/            # Database models
│   ├── services/          # Business logic services
│   ├── styles/            # Global styles and themes
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files
├── seed_data.json         # Database seed data
├── seed.ts               # Database seeding script
└── package.json          # Dependencies and scripts
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permissions system
- **Password Hashing** - bcryptjs for secure password storage
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Zod schema validation for all inputs
- **Audit Logging** - Complete history tracking for compliance
- **Environment Variables** - Secure configuration management

## 📈 Business Features

### Driver Management
- Driver profiles with contact information
- Route assignments and performance tracking
- Salary and balance management
- Designation-based access control

### Product Management
- Bakery and fresh product categories
- Dynamic pricing with history tracking
- SKU management and inventory tracking
- Supplier information management

### Daily Operations
- Trip planning and route optimization
- Product delivery tracking
- Collection and payment management
- Profit/loss calculations
- Variance tracking and reporting

### Expense Management
- Multiple expense categories (petrol, maintenance, salary, etc.)
- Approval workflow with status tracking
- Receipt management and vendor tracking
- Reimbursable expense tracking

## 🚀 Deployment

### Production Environment Variables
```env
CORS_ORIGIN=https://yourdomain.com
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/quality_food_stuffs
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
```

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@qualityfoodstuffs.com

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Icons from [Phosphor Icons](https://phosphoricons.com/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Charts by [ApexCharts](https://apexcharts.com/)

---

**Quality Food Stuffs** - Streamlining food delivery operations with modern technology.