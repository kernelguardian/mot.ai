# MOT.AI - UK Vehicle MOT Intelligence Platform

MOT.AI is a premium-styled web application that provides UK vehicle MOT (Ministry of Transport) history lookup and AI-powered failure predictions. Built with modern web technologies, it offers comprehensive vehicle analysis with government-style UI design.

## Features

- 🚗 **Vehicle Registration Lookup** - Search any UK vehicle by registration number
- 🧠 **AI-Powered Predictions** - Machine learning predictions for potential MOT failures
- 📊 **MOT History Analysis** - Complete test history with visual timeline
- 🎨 **DVSA-Style Design** - Government-themed UI with official color schemes
- 📱 **Mobile Responsive** - Optimized for all device sizes
- 🔒 **Unique Shareable Links** - UUID-based URLs for privacy
- 💾 **PostgreSQL Database** - Persistent data storage with Drizzle ORM

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** with custom DVSA styling
- **Wouter** for lightweight routing
- **TanStack React Query** for server state management
- **Shadcn/UI** components built on Radix UI

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** database with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **Mock DVSA API** integration

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** database (local or cloud)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mot-ai.git
cd mot-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file from the provided template:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/motai"
PGHOST="localhost"
PGPORT="5432"
PGDATABASE="motai"
PGUSER="your_username"
PGPASSWORD="your_password"

# Official DVSA MOT API Credentials (Optional)
DVSA_CLIENT_ID="your_client_id_here"
DVSA_CLIENT_SECRET="your_client_secret_here"
DVSA_TOKEN_URL="your_full_token_url_here"
DVSA_API_KEY="your_api_key_here"

# Development
NODE_ENV="development"
```

#### DVSA MOT API Integration

For authentic UK MOT data, register for the official DVSA MOT History API:

1. **Register for API Access**: Visit https://documentation.history.mot.api.gov.uk/
2. **Complete the registration process** - You'll receive credentials via email
3. **Add all four credentials** to your `.env` file as shown above

**Important Notes:**
- If DVSA credentials are not configured, the app uses realistic mock data
- Client Secret expires every 2 years (you'll receive email reminders)
- API Key is revoked if unused for 90 days
- All features work identically with both real and mock data

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database named `motai`
3. Update the `.env` file with your local credentials

#### Option B: Cloud Database (Recommended)

1. Sign up for a free PostgreSQL database at:
   - [Neon](https://neon.tech) (Recommended)
   - [Supabase](https://supabase.com)
   - [Railway](https://railway.app)

2. Copy the connection string to your `.env` file

### 5. Initialize Database Schema

Push the database schema to create all necessary tables:

```bash
npm run db:push
```

This will create:
- `vehicles` table - Vehicle information and MOT status
- `motTests` table - Historical MOT test results
- `predictions` table - AI-generated failure predictions

### 6. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utility functions and API calls
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   └── db.ts             # Database configuration
├── shared/               # Shared code between frontend and backend
│   └── schema.ts         # Database schema and types
├── components.json       # Shadcn/UI configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── drizzle.config.ts     # Drizzle ORM configuration
└── vite.config.ts        # Vite build configuration
```

## Deployment to GitHub

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: MOT.AI application"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `mot-ai` or your preferred name
3. Don't initialize with README (we already have one)

### 3. Connect and Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/yourusername/mot-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Environment Variables for Production

Create a `.env.example` file for others to reference:

```env
# Database Configuration
DATABASE_URL="your_postgresql_connection_string"
PGHOST="your_database_host"
PGPORT="5432"
PGDATABASE="your_database_name"
PGUSER="your_database_user"
PGPASSWORD="your_database_password"

# Environment
NODE_ENV="production"
```

**Important:** Never commit your actual `.env` file with real credentials to GitHub.

## Deployment Platforms

### Replit (Recommended)

1. Import your GitHub repository to Replit
2. Set environment variables in Replit Secrets
3. Click "Run" - Replit will automatically install dependencies and start the app

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with one click

### Railway

1. Connect GitHub repository to Railway
2. Add PostgreSQL database service
3. Set environment variables and deploy

### Heroku

```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production
git push heroku main
```

## API Endpoints

- `GET /api/vehicle/registration/:registration` - Create vehicle record and return UUID
- `GET /api/vehicle/:uuid` - Get vehicle data by UUID
- All responses include vehicle details, MOT history, and AI predictions

## Database Schema

### Vehicles Table
- ID, UUID, registration, make, model, year
- Fuel type, engine size, color
- MOT status and expiry date

### MOT Tests Table
- Vehicle ID reference, test date, result
- Odometer reading, test center
- Failures and advisories (JSON)

### Predictions Table
- Vehicle ID reference, category, description
- Risk level (HIGH/MEDIUM/LOW), confidence percentage
- Failure patterns and recommendations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or questions, please open an issue on GitHub or contact the development team.

## Disclaimer

This application uses mock DVSA data for demonstration purposes. For production use with real DVSA data, proper API authentication and licensing would be required from the UK government.