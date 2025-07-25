-- MOT.AI Local Database Setup
-- Run this script to set up your local PostgreSQL database

-- Create the database (run this first if database doesn't exist)
-- CREATE DATABASE motaidb;

-- Connect to the database and create tables
-- \c motaidb;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    registration VARCHAR(10) NOT NULL UNIQUE,
    make VARCHAR(100),
    model VARCHAR(100),
    year VARCHAR(4),
    colour VARCHAR(50),
    fuel_type VARCHAR(50),
    engine_size VARCHAR(10),
    mot_expiry_date VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mot_tests table
CREATE TABLE IF NOT EXISTS mot_tests (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    test_number VARCHAR(50),
    test_date TIMESTAMP,
    test_result VARCHAR(10),
    odometer_value INTEGER,
    expiry_date VARCHAR(20),
    failures JSONB DEFAULT '[]',
    advisories JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    category VARCHAR(100),
    issue TEXT,
    risk_level VARCHAR(10),
    confidence INTEGER,
    pattern TEXT,
    last_failure_date VARCHAR(20),
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);
CREATE INDEX IF NOT EXISTS idx_vehicles_uuid ON vehicles(uuid);
CREATE INDEX IF NOT EXISTS idx_mot_tests_vehicle_id ON mot_tests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_predictions_vehicle_id ON predictions(vehicle_id);

-- Grant permissions (adjust username as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO motaiuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO motaiuser;

-- Show created tables
\dt