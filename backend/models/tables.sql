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

-- Create the visits table
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    visited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Trigger function to add a visit record when a hotel is inserted
CREATE OR REPLACE FUNCTION handle_hotel_insert_visit()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new visit record for the newly created hotel
    INSERT INTO visits (hotel_id, visited_by, visit_date)
    VALUES (NEW.id, NEW.created_by, NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for INSERT only
CREATE TRIGGER trg_hotel_insert_visit
AFTER INSERT ON hotels
FOR EACH ROW
EXECUTE FUNCTION handle_hotel_insert_visit();

-- Also create a standard updated_at trigger for visits table itself
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visits_updated_at();

-- Performance indexes
CREATE INDEX idx_visits_hotel_id ON visits(hotel_id);
CREATE INDEX idx_visits_visited_by ON visits(visited_by);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_visits_created_at ON visits(created_at);

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



--------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------ [ VIEWS ] ------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------------------


-- Create a comprehensive dashboard view
CREATE OR REPLACE VIEW dashboard_summary AS
WITH hotel_stats AS (
    SELECT 
        COUNT(*) as total_hotels,
        COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_hotels,
        COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_hotels,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as hotels_added_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as hotels_added_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as hotels_added_month
    FROM hotels
),
user_stats AS (
    SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as users_added_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as users_added_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as users_added_month
    FROM users
),
visit_stats AS (
    SELECT 
        COUNT(*) as total_visits,
        COUNT(CASE WHEN visit_date >= CURRENT_DATE THEN 1 END) as visits_today,
        COUNT(CASE WHEN visit_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as visits_week,
        COUNT(CASE WHEN visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as visits_month,
        COUNT(DISTINCT hotel_id) as hotels_with_visits,
        COUNT(DISTINCT visited_by) as active_visitors
    FROM visits
),
recent_activity AS (
    SELECT 
        MAX(h.created_at) as last_hotel_added,
        MAX(u.created_at) as last_user_registered,
        MAX(v.visit_date) as last_visit_date
    FROM hotels h
    CROSS JOIN users u
    CROSS JOIN visits v
    WHERE h.is_deleted = false
)
SELECT 
    -- Hotel Statistics
    hs.total_hotels,
    hs.active_hotels,
    hs.deleted_hotels,
    hs.hotels_added_today,
    hs.hotels_added_week,
    hs.hotels_added_month,
    
    -- User Statistics
    us.total_users,
    us.users_added_today,
    us.users_added_week,
    us.users_added_month,
    
    -- Visit Statistics
    vs.total_visits,
    vs.visits_today,
    vs.visits_week,
    vs.visits_month,
    vs.hotels_with_visits,
    vs.active_visitors,
    
    -- Activity Rates
    ROUND(
        CASE 
            WHEN hs.total_hotels > 0 THEN (vs.hotels_with_visits::decimal / hs.active_hotels * 100)
            ELSE 0 
        END, 2
    ) as hotel_visit_rate_percent,
    
    ROUND(
        CASE 
            WHEN us.total_users > 0 THEN (vs.active_visitors::decimal / us.total_users * 100)
            ELSE 0 
        END, 2
    ) as user_activity_rate_percent,
    
    -- Recent Activity
    ra.last_hotel_added,
    ra.last_user_registered,
    ra.last_visit_date,
    
    -- Current timestamp for dashboard refresh
    CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' as dashboard_generated_at
    
FROM hotel_stats hs
CROSS JOIN user_stats us
CROSS JOIN visit_stats vs
CROSS JOIN recent_activity ra;

-- Create a view for recent activities (last 7 days)
CREATE OR REPLACE VIEW recent_activities AS
(
    SELECT 
        'hotel_created' as activity_type,
        h.name as item_name,
        u.full_name as user_name,
        h.created_at as activity_date,
        CONCAT('Hotel "', h.name, '" was created') as description
    FROM hotels h
    LEFT JOIN users u ON h.created_by = u.id
    WHERE h.created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND h.is_deleted = false
)
UNION ALL
(
    SELECT 
        'hotel_visit' as activity_type,
        h.name as item_name,
        u.full_name as user_name,
        v.visit_date as activity_date,
        CONCAT(u.full_name, ' visited "', h.name, '"') as description
    FROM visits v
    JOIN hotels h ON v.hotel_id = h.id
    JOIN users u ON v.visited_by = u.id
    WHERE v.visit_date >= CURRENT_DATE - INTERVAL '7 days'
)
UNION ALL
(
    SELECT 
        'user_registered' as activity_type,
        u.full_name as item_name,
        u.full_name as user_name,
        u.created_at as activity_date,
        CONCAT('New user "', u.full_name, '" registered') as description
    FROM users u
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
)
ORDER BY activity_date DESC
LIMIT 20;