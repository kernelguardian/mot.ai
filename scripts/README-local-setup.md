# Local Database Setup Instructions

## Prerequisites
1. PostgreSQL installed and running locally
2. Database `motaidb` created
3. User `motaiuser` with password `motaipw` created with database access

## Quick Setup Commands

### 1. Create Database and User (if not already done)
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE motaidb;
CREATE USER motaiuser WITH PASSWORD 'motaipw';
GRANT ALL PRIVILEGES ON DATABASE motaidb TO motaiuser;
\q
```

### 2. Set up Tables
```bash
# Run the setup script
psql -U motaiuser -d motaidb -f scripts/setup-local-db.sql
```

### 3. Environment Variables
Create a `.env` file in your project root:
```
DATABASE_URL="postgresql://motaiuser:motaipw@localhost:5432/motaidb"
NODE_ENV=development

# Add your DVSA API credentials if you have them
DVSA_CLIENT_ID=your_client_id_here
DVSA_CLIENT_SECRET=your_client_secret_here
DVSA_TOKEN_URL=your_token_url_here
DVSA_API_KEY=your_api_key_here
```

### 4. Push Schema with Drizzle
```bash
# This will sync your schema with the database
npm run db:push
```

### 5. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check if database exists: `psql -U motaiuser -d motaidb -c "\l"`
- Verify user permissions: `psql -U motaiuser -d motaidb -c "\dt"`

### Schema Issues
- If tables aren't created properly, run: `npm run db:push`
- To reset everything: `DROP DATABASE motaidb; CREATE DATABASE motaidb;`

The application now automatically detects whether you're using Neon (cloud) or local PostgreSQL and configures the connection accordingly.