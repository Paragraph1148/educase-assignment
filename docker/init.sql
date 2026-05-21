-- ─────────────────────────────────────────────────────────────────────────────
-- School Management API — Database Bootstrap
-- Runs automatically when the MySQL container starts for the first time.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS school_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_management;

CREATE TABLE IF NOT EXISTS schools (
  id        INT          NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100) NOT NULL,
  address   VARCHAR(255) NOT NULL,
  latitude  FLOAT        NOT NULL,
  longitude FLOAT        NOT NULL,

  PRIMARY KEY (id),

  -- Prevent exact duplicate school entries
  UNIQUE KEY uq_school_location (name, latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed Data (optional — handy for local dev / Postman testing) ─────────────
INSERT IGNORE INTO schools (name, address, latitude, longitude) VALUES
  ('Delhi Public School',     'Sector 45, Noida, Uttar Pradesh',        28.5706,  77.3261),
  ('Kendriya Vidyalaya',      'Shankar Nagar, Raipur, Chhattisgarh',    21.2514,  81.6296),
  ('St. Xavier High School',  'Park Street, Kolkata, West Bengal',      22.5519,  88.3527),
  ('Ryan International',      'Malad West, Mumbai, Maharashtra',         19.1887,  72.8483),
  ('DAV Public School',       'Sector 14, Gurugram, Haryana',           28.4699,  77.0266);
