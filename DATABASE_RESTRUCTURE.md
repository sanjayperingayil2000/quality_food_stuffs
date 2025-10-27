# Database Restructure Summary

## Overview
The database has been restructured from a single `calculations` collection approach to proper MongoDB collections for each entity type. This provides better performance, data integrity, and maintainability.

## New Database Structure

### 1. Users Collection (`users`)
**Purpose**: Store user login credentials and authentication data
**Model**: `src/models/User.ts`
**API**: `src/app/api/users/` (existing)

**Fields**:
- `name`: User's full name
- `email`: Unique email address
- `passwordHash`: Encrypted password
- `roles`: Array of roles ['super_admin', 'manager']
- `isActive`: Account status
- `settingsAccess`: Permission flag
- `resetPasswordOtp`: OTP for password reset
- `resetPasswordOtpExpiry`: OTP expiration
- `createdAt`, `updatedAt`: Timestamps

### 2. Employees Collection (`employees`)
**Purpose**: Store all employee data including drivers, staff, and CEO
**Model**: `src/models/Employee.ts`
**API**: `src/app/api/employees/`
**Service**: `src/services/employeeService.ts`

**Fields**:
- `id`: Unique employee ID (EMP-001, EMP-002, etc.)
- `name`: Employee's full name
- `designation`: Role ('driver', 'staff', 'ceo')
- `phoneNumber`: Contact number
- `email`: Email address
- `address`: Physical address
- `routeName`: Route assignment (for drivers)
- `location`: Work location (for drivers)
- `salary`: Monthly salary (for staff/CEO)
- `balance`: Current balance (for drivers)
- `balanceHistory`: Array of balance change records
- `hireDate`: Employment start date
- `isActive`: Employment status
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Key Features**:
- Balance tracking with history for drivers
- Route management for drivers
- Salary tracking for staff/CEO
- Full CRUD operations with audit logging

### 3. Products Collection (`products`)
**Purpose**: Store all product information including bakery and fresh products
**Model**: `src/models/Product.ts`
**API**: `src/app/api/products/`
**Service**: `src/services/productService.ts`

**Fields**:
- `id`: Unique product ID (PRD-001, PRD-002, etc.)
- `name`: Product name
- `category`: Product type ('bakery', 'fresh')
- `price`: Current price
- `description`: Product description
- `sku`: Stock keeping unit
- `unit`: Measurement unit (kg, piece, liter)
- `minimumQuantity`: Minimum stock level
- `maximumQuantity`: Maximum stock level
- `isActive`: Product availability
- `expiryDays`: Shelf life (for fresh products)
- `supplier`: Supplier information
- `priceHistory`: Array of price change records
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Key Features**:
- Price history tracking
- Category-based organization
- Stock level management
- Supplier tracking
- Full CRUD operations with audit logging

### 4. Daily Trips Collection (`dailyTrips`)
**Purpose**: Store daily trip data including products, transfers, and financial calculations
**Model**: `src/models/DailyTrip.ts`
**API**: `src/app/api/daily-trips/`
**Service**: `src/services/dailyTripService.ts`

**Fields**:
- `id`: Unique trip ID (TRP-001, TRP-002, etc.)
- `driverId`: Driver's employee ID
- `driverName`: Driver's name
- `date`: Trip date
- `products`: Array of products in trip
- `transfer`: Product transfer information
- `acceptedProducts`: Products received from other drivers
- `collectionAmount`: Amount collected
- `purchaseAmount`: Amount spent on purchases
- `expiry`: Expired product value
- `discount`: Discount amount
- `petrol`: Fuel cost
- `balance`: Driver balance
- `totalAmount`: Total trip value
- `netTotal`: Net amount
- `grandTotal`: Grand total
- `expiryAfterTax`: Calculated expiry after tax
- `amountToBe`: Amount to be collected
- `salesDifference`: Sales difference
- `profit`: Calculated profit
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Key Features**:
- Product transfer tracking between drivers
- Financial calculations and metrics
- Driver-specific trip history
- Date-based filtering and reporting
- Full CRUD operations with audit logging

### 5. Additional Expenses Collection (`additionalExpenses`)
**Purpose**: Store additional expenses like petrol, maintenance, variance, salary, etc.
**Model**: `src/models/AdditionalExpense.ts` (updated)
**API**: `src/app/api/additional-expenses/` (updated)
**Service**: `src/services/additionalExpenseService.ts`

**Fields**:
- `title`: Expense title
- `description`: Expense description
- `category`: Expense type ('petrol', 'maintenance', 'variance', 'salary', 'others')
- `amount`: Expense amount
- `currency`: Currency (default: AED)
- `date`: Expense date
- `driverId`: Related driver ID (optional)
- `driverName`: Driver name (optional)
- `designation`: Creator's role
- `receiptNumber`: Receipt reference
- `vendor`: Vendor/supplier
- `isReimbursable`: Reimbursement eligibility
- `status`: Approval status ('pending', 'approved', 'rejected')
- `approvedBy`: Approver ID
- `approvedAt`: Approval date
- `rejectedReason`: Rejection reason
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Key Features**:
- Approval workflow
- Category-based organization
- Driver-specific expenses
- Receipt tracking
- Full CRUD operations with audit logging

### 6. History Collection (`histories`)
**Purpose**: Track all changes to collections for audit purposes
**Model**: `src/models/History.ts` (existing)

**Fields**:
- `collectionName`: Name of the collection
- `documentId`: ID of the modified document
- `action`: Action type ('create', 'update', 'delete')
- `actor`: User who performed the action
- `before`: Document state before change
- `after`: Document state after change
- `timestamp`: When the change occurred

## API Endpoints

### Employees
- `GET /api/employees` - List employees with filters
- `GET /api/employees/[id]` - Get specific employee
- `POST /api/employees` - Create new employee
- `PATCH /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/[id]` - Get specific product
- `POST /api/products` - Create new product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Daily Trips
- `GET /api/daily-trips` - List trips with filters
- `GET /api/daily-trips/[id]` - Get specific trip
- `POST /api/daily-trips` - Create new trip
- `PATCH /api/daily-trips/[id]` - Update trip
- `DELETE /api/daily-trips/[id]` - Delete trip

### Additional Expenses
- `GET /api/additional-expenses` - List expenses with filters
- `GET /api/additional-expenses/[id]` - Get specific expense
- `POST /api/additional-expenses` - Create new expense
- `PATCH /api/additional-expenses/[id]` - Update expense
- `DELETE /api/additional-expenses/[id]` - Delete expense

## Service Layer

Each collection has a corresponding service layer that handles:
- Business logic
- Data validation
- Database operations
- History logging
- Error handling

## Migration from Calculation API

The old system used a single `calculations` collection with different `contextName` values:
- `contextName: 'employee'` → Now `employees` collection
- `contextName: 'product'` → Now `products` collection
- `contextName: 'dailyTrip'` → Now `dailyTrips` collection

## Benefits of New Structure

1. **Performance**: Proper indexing and collection-specific queries
2. **Data Integrity**: Schema validation and constraints
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Better query performance and data organization
5. **Audit Trail**: Complete history tracking for all changes
6. **Type Safety**: Strong typing with TypeScript interfaces
7. **API Consistency**: RESTful endpoints with proper HTTP methods

## Overview Page Integration

The overview page will now:
1. Fetch daily trip data from `dailyTrips` collection
2. Fetch employee balance data from `employees` collection
3. Calculate metrics using the service layer
4. Display real-time data from proper collections

This structure provides a solid foundation for the transport company management system with proper data organization, performance optimization, and maintainability.
