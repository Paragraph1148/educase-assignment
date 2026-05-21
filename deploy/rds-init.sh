#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# RDS Schema Bootstrap
# Run this ONCE from your local machine (or EC2) after RDS is up.
# Make sure your machine's IP is in the RDS security group inbound rules.
# ─────────────────────────────────────────────────────────────────────────────
#
# Usage:
#   chmod +x deploy/rds-init.sh
#   RDS_HOST=your-endpoint.rds.amazonaws.com \
#   RDS_USER=admin \
#   RDS_PASSWORD=yourpassword \
#   ./deploy/rds-init.sh
#

set -e

RDS_HOST="${RDS_HOST:?RDS_HOST env var is required}"
RDS_USER="${RDS_USER:?RDS_USER env var is required}"
RDS_PASSWORD="${RDS_PASSWORD:?RDS_PASSWORD env var is required}"

echo "Connecting to RDS at $RDS_HOST..."

mysql -h "$RDS_HOST" -u "$RDS_USER" -p"$RDS_PASSWORD" << 'SQL'

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
  UNIQUE KEY uq_school_location (name, latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify
SHOW TABLES;
DESCRIBE schools;

SQL

echo "✅ RDS schema ready"
