# DeliveryRoute - Mobile Delivery Management App

## Overview

DeliveryRoute is a Progressive Web Application (PWA) designed for managing delivery routes and order fulfillment. The application provides mobile-first functionality for delivery drivers to manage orders, track inventory, navigate routes, and complete deliveries with offline capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router for client-side navigation
- **PWA Features**: Service Worker for offline functionality and caching

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Framework**: Hono for modern API routing with type safety
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Validation**: Zod schemas for runtime type checking

### Build System
- **Bundler**: Vite for fast development and optimized builds
- **Development**: Hot Module Replacement (HMR) for instant updates
- **TypeScript**: Full type safety across client and server
- **Path Aliases**: Configured for clean imports (@, @shared, @assets)

## Key Components

### Data Models
- **Users**: Driver profiles and authentication data
- **Customers**: Client information with geolocation and scheduling
- **Products**: Inventory items with pricing and categorization
- **Orders**: Delivery requests with items and status tracking
- **Inventory**: Real-time stock management per driver
- **Routes**: Optimized delivery paths with waypoints

### Frontend Pages
- **Dashboard**: Overview of daily statistics and upcoming deliveries
- **Orders**: List and detail views of pending/completed orders
- **Delivery**: Step-by-step delivery completion workflow
- **Route Map**: Visual route planning and navigation
- **Inventory**: Stock management and availability tracking

### UI Components
- **Mobile-First Design**: Optimized for touch interfaces
- **Status Bar**: Native mobile app simulation
- **App Bar**: Context-aware navigation with actions
- **Bottom Navigation**: Primary navigation tabs
- **Theme System**: Light/dark mode support

## Data Flow

1. **Order Creation**: Orders are created in the system with customer and product associations
2. **Route Planning**: Orders are organized into optimized delivery routes
3. **Inventory Sync**: Driver inventory is tracked and updated in real-time
4. **Delivery Process**: Step-by-step workflow for order completion
5. **Status Updates**: Real-time order status changes propagated through the system
6. **Offline Support**: Critical data cached for offline operation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **drizzle-orm**: Type-safe database operations
- **hono**: Modern web framework for APIs

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast JavaScript bundling

### PWA Features
- **Service Worker**: Custom caching strategy for offline functionality
- **Web App Manifest**: Native app-like experience
- **Geolocation API**: Driver location tracking
- **Push Notifications**: Order updates (configurable)

## Deployment Strategy

### Development
- Vite development server with HMR
- Express server with middleware integration
- Database migrations via Drizzle Kit
- Environment-based configuration

### Production
- Static client build served by Express
- Serverless-ready backend deployment
- PostgreSQL database with connection pooling
- Service Worker for offline capabilities

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

## Recent Changes

- July 04, 2025: Complete mobile delivery management app created with:
  - PostgreSQL database with 7 main tables (users, customers, products, orders, orderItems, inventory, routes)
  - Full Express.js REST API with comprehensive endpoints for all CRUD operations
  - Mobile-responsive React frontend with 5 main pages (Dashboard, Orders, Order Detail, Delivery Process, Route Map, Inventory)
  - PWA functionality with service worker for offline capabilities
  - Material Design UI with Spanish localization
  - Sample data populated for testing (3 customers, 5 products, 5 orders, driver inventory)

## Changelog

- July 04, 2025: Initial setup and complete application development