# AWS Deployment Guide — School Management API

Complete walkthrough: Docker Hub → RDS → EC2 → Live URL → GitHub Secrets.

---

## Overview

```
Your machine
    │
    ├── git push main
    │       │
    │       └── GitHub Actions CI/CD
    │               ├── lint + test
    │               ├── docker build → push → DockerHub
    │               └── SSH into EC2 → docker pull → restart
    │
    └── AWS
            ├── RDS MySQL  (managed DB, private subnet)
            └── EC2 t2.micro  (API container, public IP)
```

---

## Part 1 — Docker Hub (push your image)

### 1.1 Create a Docker Hub account
Go to https://hub.docker.com and create a free account.
Note your **username** — used everywhere below.

### 1.2 Create an access token
Docker Hub → Account Settings → Security → **New Access Token**
- Description: `github-actions`
- Permissions: Read & Write
- **Copy the token** — you won't see it again

### 1.3 Build and push your image locally (first time)
```bash
cd school-management-api

# Login
docker login -u YOUR_DOCKERHUB_USERNAME

# Build
docker build -t YOUR_DOCKERHUB_USERNAME/school-management-api:latest .

# Push
docker push YOUR_DOCKERHUB_USERNAME/school-management-api:latest
```

---

## Part 2 — AWS RDS (managed MySQL)

### 2.1 Launch RDS instance
1. AWS Console → **RDS** → Create database
2. Settings:
   - Engine: **MySQL 8.0**
   - Template: **Free tier**
   - DB instance identifier: `school-management-db`
   - Master username: `admin`
   - Master password: choose a strong password, **save it**
   - Instance class: `db.t3.micro`
   - Storage: 20 GB gp2
   - Public access: **No** (EC2 connects privately)
3. VPC security group: create new → name it `rds-sg`
4. Click **Create database** — takes ~5 minutes

### 2.2 Note your RDS endpoint
RDS → Databases → school-management-db → **Connectivity & security**
Copy the endpoint — looks like:
```
school-management-db.xxxxxxxxxx.ap-south-1.rds.amazonaws.com
```

### 2.3 Configure RDS Security Group
RDS → school-management-db → Security groups → `rds-sg` → **Edit inbound rules**

Add rule:
| Type | Port | Source |
|------|------|--------|
| MySQL/Aurora | 3306 | Security group of your EC2 (add after EC2 is created) |

> You'll come back here after Part 3 to add the EC2 security group as source.

### 2.4 Bootstrap the schema
From your local machine (temporarily allow your IP in rds-sg):
```bash
chmod +x deploy/rds-init.sh

RDS_HOST=your-endpoint.rds.amazonaws.com \
RDS_USER=admin \
RDS_PASSWORD=yourpassword \
./deploy/rds-init.sh
```

Expected output:
```
Tables_in_school_management
schools

Field       Type
id          int
name        varchar(100)
address     varchar(255)
latitude    float
longitude   float

✅ RDS schema ready
```

---

## Part 3 — AWS EC2 (API server)

### 3.1 Launch EC2 instance
1. AWS Console → **EC2** → Launch instance
2. Settings:
   - Name: `school-api-server`
   - AMI: **Amazon Linux 2023** (free tier eligible)
   - Instance type: `t2.micro`
   - Key pair: create new → name `school-api-key` → **download .pem file**, keep it safe
   - Network: default VPC, **same VPC as RDS**
   - Auto-assign public IP: **Enable**
3. Security group (create new → `ec2-sg`):

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | My IP |
| Custom TCP | TCP | 3000 | Anywhere (0.0.0.0/0) |

4. Click **Launch instance**

### 3.2 Allow EC2 → RDS traffic
Go back to your RDS security group (`rds-sg`) → Edit inbound rules:
- Change the MySQL rule source from your IP to the **EC2 security group** (`ec2-sg`)

### 3.3 SSH into EC2 and bootstrap
```bash
# Fix key permissions
chmod 400 school-api-key.pem

# SSH in
ssh -i school-api-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

Once inside, run the bootstrap script manually (edit the placeholder values first):
```bash
# On EC2 — install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for docker group to take effect
exit
ssh -i school-api-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 3.4 Create the app directory and compose file on EC2
```bash
mkdir -p ~/school-api
cat > ~/school-api/docker-compose.prod.yml << 'EOF'
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
```

### 3.5 Pull image and start
```bash
docker pull YOUR_DOCKERHUB_USERNAME/school-management-api:latest
cd ~/school-api
docker-compose -f docker-compose.prod.yml up -d
```

### 3.6 Verify it's running
```bash
# Container status
docker ps

# Tail logs
docker-compose -f ~/school-api/docker-compose.prod.yml logs -f

# Hit the health endpoint
curl http://localhost:3000/health
# Expected: {"success":true,"message":"Server is running","uptime":...}
```

Your live URL is now:
```
http://YOUR_EC2_PUBLIC_IP:3000
```

---

## Part 4 — GitHub Actions Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add all five:

| Secret name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The access token from Part 1.2 |
| `EC2_HOST` | EC2 public IP (e.g. `13.234.56.78`) |
| `EC2_SSH_KEY` | Full contents of `school-api-key.pem` (include `-----BEGIN RSA PRIVATE KEY-----`) |

### 4.1 Test the pipeline
```bash
git add .
git commit -m "feat: complete school management API"
git push origin main
```

Go to GitHub → **Actions** tab — you should see 3 jobs run green:
```
✅ Lint & Test
✅ Build Docker Image
✅ Deploy to AWS EC2
```

---

## Part 5 — Postman Collection

### 5.1 Import the collection
1. Open Postman
2. Click **Import** → select `deploy/school-management-api.postman_collection.json`

### 5.2 Set the environment variable
In the collection, the `baseUrl` variable defaults to `http://localhost:3000`.

To test against live AWS:
1. Postman → **Environments** → Create new environment: `Production`
2. Add variable: `baseUrl` = `http://YOUR_EC2_PUBLIC_IP:3000`
3. Select the `Production` environment in the top-right dropdown

### 5.3 Share the collection
Postman → Collection → **...** → Share → Copy link
Share this link with stakeholders (requires free Postman account to view).

---

## Useful Commands (EC2 operations)

```bash
# SSH in
ssh -i school-api-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# View running containers
docker ps

# View API logs (live)
docker logs -f school_api_prod

# Restart API
docker-compose -f ~/school-api/docker-compose.prod.yml restart

# Pull latest image manually + restart (what CI does automatically)
docker pull YOUR_DOCKERHUB_USERNAME/school-management-api:latest
docker-compose -f ~/school-api/docker-compose.prod.yml up -d

# Stop everything
docker-compose -f ~/school-api/docker-compose.prod.yml down
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl: connection refused` on port 3000 | Check EC2 security group allows port 3000 inbound |
| `Access denied for user 'admin'@...` | Check DB_PASSWORD in docker-compose.prod.yml matches RDS password |
| `connect ETIMEDOUT` to RDS | Check RDS security group allows port 3306 from EC2 security group |
| Container exits immediately | Run `docker logs school_api_prod` to see the error |
| GitHub Actions deploy fails on SSH | Check EC2_HOST and EC2_SSH_KEY secrets are correct |
