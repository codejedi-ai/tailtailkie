# Quick Start Guide

Get TensorStore running in minutes with Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB RAM available
- Ports 3000, 5000, 27017, 19530 available

## Step 1: Clone and Setup

```bash
# Navigate to project directory
cd TensorStore

# Run setup script (builds images, loads secrets)
./scripts/setup.sh
```

The setup script will:
- Create `.env` file from `env.example` if it doesn't exist
- Validate required environment variables
- Build Docker images for frontend and backend
- Create necessary directories
- Prepare Docker secrets

**Important**: After setup, edit `.env` file with your actual secrets:
- `MONGODB_ROOT_PASSWORD` - Strong password for MongoDB

## Step 2: Check Environment

```bash
# Verify everything is ready
./scripts/check.sh
```

This will check:
- Environment variables are set
- Docker is running
- Images are built
- Services status

## Step 3: Start Services

```bash
# Start all services
./scripts/start.sh
```

Or manually:
```bash
docker-compose up -d
```

## Step 4: Verify

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/service/api/status

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View service status
docker-compose ps

# Or use Makefile
make start    # Start services
make stop     # Stop services
make logs     # View logs
make check    # Check status
```

## Troubleshooting

### Services won't start
1. Check Docker is running: `docker info`
2. Check ports are available: `lsof -i :3000 -i :5000`
3. Check logs: `docker-compose logs`

### Environment variables not loading
1. Verify `.env` file exists
2. Check variables are not using placeholder values
3. Run `./scripts/check.sh` to validate

### Images not building
1. Check Docker has enough resources (4GB+ RAM)
2. Check internet connection (for pulling base images)
3. Review build logs: `docker-compose build --no-cache`

### Database connection errors
1. Wait for MongoDB to be ready (can take 30-60 seconds)
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify connection string in `.env`

## Next Steps

- Read [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed documentation
- Read [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) for Kubernetes deployment
- Check [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for architecture details

