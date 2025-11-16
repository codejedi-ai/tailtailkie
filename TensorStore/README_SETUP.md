# Setup Instructions

Complete setup guide for TensorStore Docker environment.

## Prerequisites

- Docker Desktop (or Docker Engine 20.10+ with Docker Compose)
- At least 4GB RAM available for Docker
- Ports available: 3000, 5000, 27017, 19530

## Step-by-Step Setup

### 1. Initial Setup

Run the setup script to prepare everything:

```bash
./scripts/setup.sh
```

This will:
- ✅ Create `.env` file from `env.example` (if it doesn't exist)
- ✅ Validate environment variables
- ✅ Build Docker images for frontend and backend
- ✅ Create necessary directories
- ✅ Generate `docker-secrets.env` file
- ✅ Validate docker-compose configuration

**Important**: After running setup, you MUST edit `.env` file with your actual secrets:
- `CLERK_SECRET_KEY` - Your Clerk secret key (starts with `sk_`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (starts with `pk_`)
- `MONGODB_ROOT_PASSWORD` - Strong password for MongoDB

### 2. Configure Secrets

Edit `.env` file:

```bash
nano .env
# or
vim .env
# or use your preferred editor
```

Required values:
```bash
CLERK_SECRET_KEY=sk_test_your_actual_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
MONGODB_ROOT_PASSWORD=your_secure_password_here
```

### 3. Verify Setup

Check that everything is ready:

```bash
./scripts/check.sh
```

This validates:
- ✅ Environment variables are set correctly
- ✅ Docker is running
- ✅ Images are built
- ✅ Configuration is valid

### 4. Start Services (Manual)

Once setup is complete, start services manually:

```bash
./scripts/start.sh
```

Or use docker-compose directly:
```bash
docker-compose up -d
```

### 5. Verify Services

Check that services are running:

```bash
docker-compose ps
```

Access services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/service/api/status

## Quick Reference

```bash
# Setup (first time only)
./scripts/setup.sh

# Check environment
./scripts/check.sh

# Start services
./scripts/start.sh
# or
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
./scripts/stop.sh
# or
docker-compose down

# Clean everything
./scripts/clean.sh
```

## Using Makefile

```bash
make setup    # Initial setup
make check    # Check environment
make start    # Start services
make stop     # Stop services
make logs     # View logs
make clean    # Clean everything
```

## Troubleshooting

### Setup fails
- Check Docker is running: `docker info`
- Check you have enough disk space
- Review error messages in setup output

### Images don't build
- Ensure Docker has 4GB+ RAM allocated
- Check internet connection (for base images)
- Review build logs: `docker-compose build --no-cache`

### Services won't start
- Run `./scripts/check.sh` to validate
- Check ports are available: `lsof -i :3000 -i :5000`
- Review logs: `docker-compose logs`

### Environment variables not loading
- Verify `.env` file exists and has correct values
- Check `docker-secrets.env` was generated
- Ensure no placeholder values remain

## What Gets Created

After setup, you'll have:
- `.env` - Your environment variables (edit with your secrets)
- `docker-secrets.env` - Generated secrets file for Docker Compose
- Docker images: `tensorstore-backend:latest`, `tensorstore-frontend:latest`
- Directories: `logs/`, `data/` (for volumes)

## Security Notes

- `.env` file contains sensitive data - never commit it
- `docker-secrets.env` is generated from `.env` - also sensitive
- Both files are in `.gitignore`
- Use strong passwords in production
- Rotate secrets regularly

## Next Steps

After successful setup:
1. Services are ready but NOT started (manual start only)
2. Run `./scripts/start.sh` when ready to start
3. Access frontend at http://localhost:3000
4. Monitor logs with `docker-compose logs -f`

