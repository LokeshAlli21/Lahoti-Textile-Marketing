-- First, update the schema to use Indian timezone for default timestamps

-- Users table with Indian timezone
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Hotels table with Indian timezone
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(9,6) NOT NULL,  -- e.g., 17.123456
    longitude DECIMAL(9,6) NOT NULL,
    location_fetched_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    hotel_email VARCHAR(255),
    owner_name VARCHAR(150),
    owner_phone VARCHAR(20),
    owner_alt_phone VARCHAR(20),
    contact_person_name VARCHAR(150),
    contact_person_phone VARCHAR(20),
    contact_person_alt_phone VARCHAR(20),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP NULL
);

-- Visits table with Indian timezone
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    visited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Function to update the updated_at column with Indian timezone
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set deleted_at timestamp when soft deleting
CREATE OR REPLACE FUNCTION set_deleted_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_deleted is being set to true and deleted_at is not already set
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
        NEW.deleted_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
    END IF;
    
    -- If is_deleted is being set to false (restore), clear deleted_at
    IF NEW.is_deleted = false AND OLD.is_deleted = true THEN
        NEW.deleted_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set location_fetched_at when lat/lng changes
CREATE OR REPLACE FUNCTION update_location_fetched_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If latitude or longitude has changed, update location_fetched_at
    IF (OLD.latitude IS DISTINCT FROM NEW.latitude) OR 
       (OLD.longitude IS DISTINCT FROM NEW.longitude) THEN
        NEW.location_fetched_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for hotels table
CREATE TRIGGER trigger_hotels_updated_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_hotels_deleted_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW
    WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
    EXECUTE FUNCTION set_deleted_at_column();

CREATE TRIGGER trigger_hotels_location_fetched_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_location_fetched_at();

-- Create triggers for visits table
CREATE TRIGGER trigger_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create indexes for better performance
CREATE INDEX idx_hotels_created_at ON hotels(created_at);
CREATE INDEX idx_hotels_is_deleted ON hotels(is_deleted);
CREATE INDEX idx_hotels_location ON hotels(latitude, longitude);
CREATE INDEX idx_visits_hotel_id ON visits(hotel_id);
CREATE INDEX idx_visits_visited_by ON visits(visited_by);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);

-- Insert some sample data to test (optional)
-- INSERT INTO users (full_name, email, password_hash, phone) 
-- VALUES ('Admin User', 'admin@example.com', 'hashed_password', '+91-9876543210');