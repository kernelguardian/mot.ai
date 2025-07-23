# MOT.AI - UK Vehicle MOT History & Prediction System

## Overview

MOT.AI is a full-stack web application that provides UK vehicle MOT (Ministry of Transport) history lookup and AI-powered failure predictions. The system allows users to search for vehicle information by registration number and provides detailed MOT test history, failure patterns, and predictive analytics to help vehicle owners anticipate potential issues.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom DVSA/Government branding colors
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON responses
- **Database**: PostgreSQL with Drizzle ORM (migrated from in-memory storage)
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Database Schema
- **Vehicles Table**: Stores vehicle information (registration, make, model, year, fuel type, etc.)
- **MOT Tests Table**: Historical MOT test results with pass/fail status and defects
- **Predictions Table**: AI-generated predictions about potential failures and maintenance needs

#### API Endpoints
- `GET /api/vehicle/registration/:registration` - Creates new vehicle record and returns UUID for unique access
- `GET /api/vehicle/:uuid` - Fetches complete vehicle data including MOT history and predictions by UUID
- Mock DVSA integration for demonstration (real DVSA API would require authentication)

#### Frontend Pages
- **Home Page**: Vehicle registration search with validation
- **Vehicle Details Page**: Comprehensive vehicle information display with MOT history and predictions
- **404 Page**: Error handling for invalid routes

#### Data Flow
1. User enters UK vehicle registration on home page
2. Client validates registration format using regex patterns
3. API fetches vehicle data from database or creates new record with unique UUID
4. Client receives UUID and redirects to unique vehicle page (/vehicle/{uuid})
5. Mock DVSA data is processed and stored
6. AI predictions are generated based on MOT history patterns
7. Vehicle details page displays comprehensive information via UUID lookup

## Data Flow

The application follows a typical client-server data flow:

1. **Input Validation**: Client-side validation ensures proper UK registration format
2. **API Request**: Frontend makes HTTP request to Express backend
3. **Data Processing**: Backend processes request, interacts with database
4. **Mock Integration**: Simulates DVSA API calls with realistic test data
5. **AI Analysis**: Generates predictions based on historical MOT patterns
6. **Response**: Structured JSON response with vehicle data, MOT history, and predictions
7. **UI Rendering**: React components render data with loading states and error handling

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack React Query for server state caching and synchronization

### Development Tools
- **Build Tool**: Vite with React plugin
- **TypeScript**: Full TypeScript support across frontend and backend
- **Linting**: ESBuild for fast bundling and transpilation
- **Development**: TSX for TypeScript execution in development

### Mock Integrations
- Currently uses mock DVSA API data for demonstration
- Real implementation would integrate with official DVSA MOT History API
- Mock data includes realistic MOT test results, failure patterns, and vehicle information

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- Database URL configuration through environment variables
- Support for both development and production environments
- Replit-specific optimizations for cloud deployment

### Development Workflow
- `npm run dev` - Starts development server with hot reloading
- `npm run build` - Creates production builds for both frontend and backend
- `npm run start` - Runs production server
- `npm run db:push` - Applies database schema changes

## Documentation
- **README.md** - Comprehensive setup guide for local development and GitHub deployment
- **LICENSE** - MIT License for open source distribution
- **.env.example** - Template for environment variable configuration
- **.gitignore** - Proper Git ignore rules for Node.js and database files

The application is designed for deployment on cloud platforms like Replit, Vercel, or traditional VPS hosting, with PostgreSQL database connectivity and environment-based configuration management.