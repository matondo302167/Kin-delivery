# KOLISA - Urban Logistics Platform

## Overview

KOLISA is a last-mile delivery logistics platform designed specifically for Kinshasa, DRC. It connects sellers (primarily social commerce vendors from platforms like TikTok) with motorcycle couriers to deliver packages to customers. The platform features three distinct portals:

1. **Seller Portal** - Dashboard for merchants to create delivery orders, track packages, and manage their wallet/earnings
2. **Courier Portal** - Mobile-first interface for delivery drivers to accept missions, navigate to pickup/delivery locations, and confirm deliveries with PIN codes
3. **Customer Tracking** - Zero-account tracking experience where customers receive SMS links to track their packages in real-time

Key features include Cash on Delivery (COD) support, SMS-based PIN validation for secure delivery confirmation, real-time GPS tracking with Leaflet maps, and Mobile Money integration for payments.

## Recent Changes (Feb 4, 2026)

- **Frontend-Backend Integration Complete**: All pages now fetch data from REST API instead of Zustand mock data
- **Automatic Profile Creation**: WelcomePage creates temporary profiles when users select their role (seller/courier)
- **Layout Bug Fix**: Added null-safe checks for profile access in Layout component
- **Order Form Enhancement**: Set default pickup address to avoid validation errors during order creation
- **Data Fetching**: Implemented React Query for efficient server state management with automatic polling
- **API Error Handling**: Improved error messages and toast notifications across all pages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: Zustand with persistence middleware for user session/role management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme (Kinshasa-inspired yellow/gold and deep green color palette)
- **Maps**: Leaflet with react-leaflet for interactive delivery tracking and address selection
- **Animations**: Framer Motion for page transitions and UI effects
- **File Uploads**: Uppy with AWS S3 presigned URL flow

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API under `/api/*` routes
- **Build System**: Vite for frontend, esbuild for server bundling
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization
- **Object Storage**: Google Cloud Storage via Replit's object storage integration for photo proof uploads

### Authentication & Security
- **Current State**: Simplified prototype authentication using phone numbers
- **Session**: Client-side role persistence via Zustand with localStorage
- **Delivery Validation**: 4-digit PIN codes sent via SMS, required for delivery confirmation
- **Photo Proof**: Required photo upload before completing deliveries

### Key Design Patterns
- **Shared Schema**: Database schemas defined once in `shared/schema.ts`, used by both frontend (types) and backend (queries)
- **API Client**: Centralized API functions in `client/src/lib/api.ts`
- **Role-Based Routing**: Protected routes redirect to welcome page if no user role is set
- **Polling for Updates**: Orders refresh every 10-15 seconds for real-time updates

## External Dependencies

### Third-Party Services
- **Twilio**: SMS service for sending PIN codes and delivery notifications (configured via Replit Connectors)
- **Google Cloud Storage**: Object storage for photo proof uploads (accessed via Replit sidecar at `127.0.0.1:1106`)
- **OpenStreetMap/Nominatim**: Reverse geocoding for location names
- **Leaflet Tiles**: Map tiles for tracking visualization

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migration tooling
- `@tanstack/react-query`: Server state management
- `zustand`: Client state management
- `wouter`: Lightweight routing
- `react-leaflet` / `leaflet`: Interactive maps
- `twilio`: SMS messaging
- `@google-cloud/storage`: Object storage client
- `@uppy/core` / `@uppy/aws-s3`: File upload handling
- `zod` / `drizzle-zod`: Schema validation