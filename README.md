# Business Management System

<div align="center">

![.NET](https://img.shields.io/badge/.NET%209.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Angular](https://img.shields.io/badge/Angular%2021-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A full-stack, cross-platform business management solution for repair shops and service businesses**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation)

</div>

---

## Overview

The **Business Management System (BMS)** is a comprehensive desktop application designed to streamline operations for repair shops and service-based businesses. Built with a modern technology stack, it provides an intuitive interface for managing products, tracking inventory, handling repair jobs, and analyzing business performance through real-time analytics.

This application demonstrates advanced software engineering principles including:
- **Full-Stack Development** with decoupled frontend and backend
- **Desktop Application Distribution** via Electron with auto-update capabilities
- **RESTful API Design** following industry best practices
- **Multi-Tenant Architecture** with user-level data isolation
- **Reactive State Management** using Angular Signals
- **Secure Authentication** with JWT tokens

---

## Features

### Product & Inventory Management
- Complete CRUD operations for products and categories
- Real-time stock level tracking with automatic deductions
- Price management with validation constraints
- Category-based organization with referential integrity

### Repair Job Tracking
- **Kanban-style workflow board** with drag-and-drop status transitions
- Job lifecycle management: `New` → `Waiting Parts` → `In Progress` → `Completed`
- Line-item support for parts used with quantity tracking
- Customer association for job history tracking
- Automatic profit calculation (Sale Price - Parts Cost)
- Return status tracking with timestamps

### Customer Management
- Customer profile storage with contact information
- Email and phone validation
- Job history linkage for repeat customer insights

### Business Analytics Dashboard
- **Revenue tracking** across multiple time windows (7-day, 30-day, yearly)
- Profit margin analysis and visualization
- Parts cost breakdown and trends
- Daily/monthly aggregated metrics
- Average transaction value calculations

### Cross-Platform Desktop Application
- Native Windows executable with Electron
- Auto-update functionality via GitHub releases
- Single-file SQLite database for portability
- Embedded backend server for offline capability

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ELECTRON SHELL                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     ANGULAR 21 FRONTEND                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │   Products   │  │    Jobs      │  │       Analytics          │ │ │
│  │  │   Component  │  │  Kanban      │  │       Dashboard          │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │              Services Layer (RxJS + Signals)               │   │ │
│  │  │   AuthService │ ProductsService │ RepairJobsService │ ... │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                              HTTP/REST                                   │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   ASP.NET CORE 9.0 BACKEND                         │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Controllers                              │   │ │
│  │  │  AuthController │ ProductsController │ RepairJobsController │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │                  Services + DTOs                            │   │ │
│  │  │   IProductService │ IRepairJobService │ Mappings            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │            Entity Framework Core 9.0 + Identity            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         SQLite Database                            │ │
│  │    Users │ Products │ Categories │ Customers │ RepairJobs          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Angular 21 | Component-based UI with reactive signals |
| **Desktop Shell** | Electron 33 | Cross-platform native application wrapper |
| **Backend** | ASP.NET Core 9.0 | RESTful API with dependency injection |
| **ORM** | Entity Framework Core 9.0 | Database abstraction and migrations |
| **Authentication** | ASP.NET Identity + JWT | Secure user management and token auth |
| **Database** | SQLite | Portable, serverless database |
| **Build** | Vite + Electron Builder | Modern bundling and app packaging |

---

## Database Schema

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    AppUser    │       │   Category    │       │   Customer    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ Id (PK)       │       │ Id (PK)       │       │ Id (PK)       │
│ UserName      │       │ Name (unique) │       │ FirstName     │
│ Email         │       └───────┬───────┘       │ LastName      │
│ PasswordHash  │               │               │ Email         │
└───────┬───────┘               │               │ PhoneNumber   │
        │                       │               └───────┬───────┘
        │ 1:N                   │ 1:N                   │ 1:N
        │                       │                       │
┌───────▼───────┐               │               ┌───────▼───────┐
│    Product    │◄──────────────┘               │   RepairJob   │
├───────────────┤                               ├───────────────┤
│ Id (PK)       │                               │ Id (PK)       │
│ OwnerId (FK)  │──────────────┐                │ CustomerId(FK)│
│ Name          │              │                │ SalePrice     │
│ Price         │              │                │ Status        │
│ Stock         │              │                │ Notes         │
│ CategoryId(FK)│              │                │ CreatedAt     │
└───────────────┘              │                │ CompletedAt   │
                               │                │ IsReturned    │
                               │                └───────┬───────┘
                               │                        │ 1:N
                               │                        │
                               │                ┌───────▼───────┐
                               │                │ RepairJobItem │
                               │                ├───────────────┤
                               │                │ Id (PK)       │
                               └───────────────►│ ProductId(FK) │
                                                │ RepairJobId   │
                                                │ Quantity      │
                                                │ UnitCost      │
                                                └───────────────┘
```

### Key Design Decisions

- **Multi-Tenancy**: Products are user-owned (`OwnerId`), enabling data isolation per user
- **Historical Cost Preservation**: `UnitCost` in `RepairJobItem` snapshots the price at job creation time
- **Soft References**: Customer association is optional, allowing anonymous repair jobs
- **Stock Transactions**: Inventory automatically decrements when jobs are created/modified

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18.0 or higher
- [.NET SDK 9.0](https://dotnet.microsoft.com/download)
- [Git](https://git-scm.com/)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/bwoodsy/Business-Management-System.git
cd Business-Management-System

# Install frontend dependencies
cd frontend/bms-web
npm install

# Start the development environment
npm run electron:dev
```

This command will:
1. Start the .NET backend API server
2. Launch the Angular development server with hot reload
3. Open the Electron application window

### Production Build

```bash
# Build the complete application
cd frontend/bms-web

# Publish the .NET API as self-contained executable
npm run api:publish:win

# Build the Angular frontend
npm run build

# Package as Windows executable
npm run electron:build
```

The packaged installer will be available in `frontend/bms-web/dist-electron/`.

---

## Usage

### Authentication

The system uses JWT-based authentication. Default credentials for first-time setup:

| Username | Password |
|----------|----------|
| `admin` | `ChangeMe123!` |

### Workflow Overview

1. **Setup Categories**: Create product categories (e.g., "Screens", "Batteries", "Tools")
2. **Add Products**: Register inventory items with prices and stock levels
3. **Register Customers**: (Optional) Add customer contact information
4. **Create Repair Jobs**: Select parts, enter sale price, and track through completion
5. **Monitor Analytics**: View revenue, profit margins, and business trends

### Job Status Flow

```
┌───────┐    ┌───────────────┐    ┌─────────────┐    ┌───────────┐
│  New  │───►│ Waiting Parts │───►│ In Progress │───►│ Completed │
└───────┘    └───────────────┘    └─────────────┘    └───────────┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │   Returned    │
                                                    │ to Customer   │
                                                    └───────────────┘
```

---

## API Documentation

### Base URL
```
http://localhost:5209/api
```

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Authentication** |||
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Create new user |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Get current user |
| **Products** |||
| GET | `/products` | List user's products |
| POST | `/products` | Create product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| **Categories** |||
| GET | `/categories` | List all categories |
| POST | `/categories` | Create category |
| PUT | `/categories/{id}` | Update category |
| DELETE | `/categories/{id}` | Delete category |
| **Customers** |||
| GET | `/customers` | List all customers |
| POST | `/customers` | Create customer |
| PUT | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Delete customer |
| **Repair Jobs** |||
| GET | `/repairjobs` | List all jobs |
| POST | `/repairjobs` | Create job |
| PUT | `/repairjobs/{id}` | Update job |
| PUT | `/repairjobs/{id}/status` | Update status |

### Sample Request: Create Repair Job

```json
POST /api/repairjobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "salePrice": 150.00,
  "notes": "Screen replacement - iPhone 13",
  "customerId": 1,
  "items": [
    {
      "productId": 5,
      "quantity": 1
    }
  ]
}
```

---

## Security Features

- **JWT Authentication**: Stateless token-based auth with 8-hour expiration
- **Password Hashing**: ASP.NET Identity with secure password storage
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Server-side validation on all endpoints
- **Context Isolation**: Electron preload scripts with sandboxed renderer
- **User Data Isolation**: Query-level filtering by user ownership

---

## Project Structure

```
Business-Management-System/
├── backend/
│   └── BusinessManagementSystem.Api/
│       ├── Controllers/          # API endpoint handlers
│       ├── Models/               # Domain entities
│       ├── Dtos/                 # Data transfer objects
│       ├── Services/             # Business logic layer
│       ├── Mappings/             # Entity-DTO conversions
│       ├── Data/                 # EF Core context
│       └── Migrations/           # Database migrations
│
├── frontend/
│   └── bms-web/
│       ├── src/app/
│       │   ├── pages/            # Route components
│       │   ├── services/         # HTTP services
│       │   ├── models/           # TypeScript interfaces
│       │   ├── guards/           # Route protection
│       │   └── layout/           # Shell components
│       │
│       └── electron/
│           ├── main.js           # Electron main process
│           ├── preload.js        # Context bridge
│           └── resources/        # Packaged binaries
│
└── README.md
```

---

## Design Patterns & Best Practices

| Pattern | Implementation |
|---------|----------------|
| **Repository Pattern** | Service layer abstracts data access |
| **DTO Pattern** | Clean separation between API contracts and domain models |
| **Dependency Injection** | Constructor injection throughout backend |
| **Standalone Components** | Angular components without NgModules |
| **Reactive Signals** | Angular 21 signal-based state management |
| **Interceptor Pattern** | HTTP interceptors for auth token injection |
| **Guard Pattern** | Route guards for authentication enforcement |
| **Transaction Pattern** | Atomic database operations for stock management |

---

## Future Enhancements

- [ ] Multi-platform builds (macOS, Linux)
- [ ] Cloud synchronization with Azure/AWS
- [ ] Barcode/QR code scanning for inventory
- [ ] Invoice generation and PDF export
- [ ] Email notifications for job status changes
- [ ] Role-based access control (Admin, Technician, Viewer)
- [ ] Offline-first PWA support
- [ ] Mobile companion app

---

## License

This project is developed as part of an internship program. All rights reserved.

---

<div align="center">

**Built with modern technologies for modern businesses**

*ASP.NET Core • Angular • Electron • SQLite*

</div>
