#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EC2 Bootstrap Script
# Paste this into EC2 "User Data" when launching the instance.
# Runs as root on first boot — installs Docker, pulls the image, starts the API.
# ─────────────────────────────────────────────────────────────────────────────

set -e  # exit immediately on any error

echo "──────────────────────────────────────────"
echo "  School Management API — EC2 Bootstrap"
echo "──────────────────────────────────────────"

# ── 1. System update ──────────────────────────────────────────────────────────
yum update -y

# ── 2. Install Docker ─────────────────────────────────────────────────────────
yum install -y docker
systemctl start docker
systemctl enable docker          # auto-start Docker on reboot
usermod -aG docker ec2-user      # allow ec2-user to run docker without sudo

# ── 3. Install Docker Compose v2 ─────────────────────────────────────────────
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ── 4. Create app directory ───────────────────────────────────────────────────
mkdir -p /home/ec2-user/school-api
chown ec2-user:ec2-user /home/ec2-user/school-api

# ── 5. Write docker-compose.prod.yml ─────────────────────────────────────────
# NOTE: Replace YOUR_DOCKERHUB_USERNAME and the DB_* values before pasting.
cat > /home/ec2-user/school-api/docker-compose.prod.yml << 'EOF'
version: "3.9"

services:
  api:
    image: YOUR_DOCKERHUB_USERNAME/school-management-api:latest
    container_name: school_api_prod
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: YOUR_RDS_ENDPOINT
      DB_PORT: 3306
      DB_USER: admin
      DB_PASSWORD: YOUR_RDS_PASSWORD
      DB_NAME: school_management
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

chown ec2-user:ec2-user /home/ec2-user/school-api/docker-compose.prod.yml

# ── 6. Pull image and start ───────────────────────────────────────────────────
# Run as ec2-user so docker group membership applies
sudo -u ec2-user bash -c '
  docker pull YOUR_DOCKERHUB_USERNAME/school-management-api:latest
  cd /home/ec2-user/school-api
  docker-compose -f docker-compose.prod.yml up -d
'

echo "✅ Bootstrap complete — API starting on port 3000"
