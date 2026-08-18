-- Drop tables if they exist to apply clean updates
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS incident CASCADE;
DROP TABLE IF EXISTS manualoverride CASCADE;
DROP TABLE IF EXISTS adaptivecontroller CASCADE;
DROP TABLE IF EXISTS trafficsignal CASCADE;
DROP TABLE IF EXISTS trafficdata CASCADE;
DROP TABLE IF EXISTS operatorassignment CASCADE;
DROP TABLE IF EXISTS intersections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Create USERS table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    city VARCHAR(15),
    role VARCHAR(20) DEFAULT 'PUBLIC',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    security_question VARCHAR(255),
    security_answer VARCHAR(255),
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create INTERSECTIONS table
CREATE TABLE intersections (
    intersection_id SERIAL PRIMARY KEY,
    intersection_name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    status VARCHAR(30) DEFAULT 'Active'
);

-- 3. Create OPERATORASSIGNMENT table
CREATE TABLE operatorassignment (
    assignment_id SERIAL PRIMARY KEY,
    operator_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    intersection_id INT REFERENCES intersections(intersection_id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE
);

-- 4. Create TRAFFICDATA table
CREATE TABLE trafficdata (
    traffic_id SERIAL PRIMARY KEY,
    intersection_id INT REFERENCES intersections(intersection_id) ON DELETE CASCADE,
    vehicle_count INT,
    queue_length INT,
    waiting_time FLOAT,
    congestion_level VARCHAR(20),
    density FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create TRAFFICSIGNAL table
CREATE TABLE trafficsignal (
    signal_id SERIAL PRIMARY KEY,
    intersection_id INT REFERENCES intersections(intersection_id) ON DELETE CASCADE,
    current_state VARCHAR(20),
    green_time INT,
    yellow_time INT,
    red_time INT,
    mode VARCHAR(20) DEFAULT 'AUTO',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create ADAPTIVECONTROLLER table
CREATE TABLE adaptivecontroller (
    controller_id SERIAL PRIMARY KEY,
    intersection_id INT REFERENCES intersections(intersection_id) ON DELETE CASCADE,
    density_threshold FLOAT,
    queue_threshold INT,
    recommended_green INT,
    recommendation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create MANUALOVERRIDE table
CREATE TABLE manualoverride (
    override_id SERIAL PRIMARY KEY,
    operator_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    signal_id INT REFERENCES trafficsignal(signal_id) ON DELETE CASCADE,
    reason TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 8. Create INCIDENT table
CREATE TABLE incident (
    incident_id SERIAL PRIMARY KEY,
    reported_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    intersection_id INT REFERENCES intersections(intersection_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

-- 9. Create REPORT table
CREATE TABLE report (
    report_id SERIAL PRIMARY KEY,
    generated_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    report_type VARCHAR(50),
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255)
);

-- ─── SEED INITIAL DATA ───

-- Add Default Users
-- Admin (password: admin123)
INSERT INTO users (user_id, name, email, password, role, status, is_first_login, security_question, security_answer)
VALUES (1, 'System Administrator', 'admin@gmail.com', '$2b$12$dB3g7qWJ264B44rM/R355OHZt5lB8Bf.gS95.u3mNf/wJ3GleE5t2', 'ADMIN', 'ACTIVE', FALSE, 'What is your favorite city?', 'Kochi');

-- Traffic Controller Operator (password: operator123, first login = true)
INSERT INTO users (user_id, name, email, password, role, status, is_first_login, security_question, security_answer)
VALUES (2, 'Traffic Controller', 'operator@gmail.com', '$2b$12$W9mX0LsnYI/lE.vQ72f0G.r3uKq9f2/HlK2Nq0s7mDqg5Jc.E93fK', 'OPERATOR', 'ACTIVE', TRUE, 'What is your favorite city?', 'Kochi');

-- Citizen Public User (password: citizen123)
INSERT INTO users (user_id, name, email, password, role, status, is_first_login, security_question, security_answer)
VALUES (3, 'Citizen User', 'citizen@gmail.com', '$2b$12$dB3g7qWJ264B44rM/R355OHZt5lB8Bf.gS95.u3mNf/wJ3GleE5t2', 'PUBLIC', 'ACTIVE', FALSE, 'What is your favorite city?', 'Kochi');

-- Add Initial Intersections (Baker Jn at ID 1 for simulation sync)
INSERT INTO intersections (intersection_id, intersection_name, location, latitude, longitude, status) VALUES
(1, 'Baker Jn', 'Baker Junction Center', 9.93123, 76.26730, 'Active'),
(2, 'Main St & 1st Ave', 'Downtown Center', 9.93512, 76.27110, 'Active'),
(3, 'Park Rd & Central', 'North Loop', 9.92811, 76.26250, 'Active'),
(4, 'Harbor Blvd & 5th', 'Harbor District', 9.94025, 76.27890, 'Active'),
(5, 'Airport Rd & Ring Rd', 'Bypass Loop', 9.94890, 76.29210, 'Active');

-- Assign Traffic Controller to Baker Jn
INSERT INTO operatorassignment (operator_id, intersection_id) VALUES
(2, 1);

-- Add Default Traffic Signals
INSERT INTO trafficsignal (intersection_id, current_state, green_time, yellow_time, red_time, mode) VALUES
(1, 'north_green', 12, 3, 12, 'AUTO'),
(2, 'green', 35, 5, 40, 'AUTO'),
(3, 'red', 45, 5, 50, 'AUTO'),
(4, 'yellow', 40, 5, 45, 'AUTO'),
(5, 'green', 30, 5, 35, 'AUTO');

-- Add Initial Traffic Data
INSERT INTO trafficdata (intersection_id, vehicle_count, queue_length, waiting_time, congestion_level, density) VALUES
(1, 15, 2, 8.0, 'Low', 0.22),
(2, 24, 8, 35.0, 'Moderate', 0.45),
(3, 47, 18, 85.0, 'High', 0.78),
(4, 31, 10, 42.0, 'Moderate', 0.52),
(5, 9, 2, 14.0, 'Low', 0.18);

-- Add Initial Incidents
INSERT INTO incident (reported_by, intersection_id, type, description, location, status) VALUES
(3, 1, 'Accident', 'Minor two-car collision blocking the left turning lane from North.', 'Baker Jn - North Leg', 'PENDING'),
(3, 5, 'Roadblock', 'Construction barricades blocking traffic near bypass loop.', 'Airport Rd & Ring Rd', 'RESOLVED');
