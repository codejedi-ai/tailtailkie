# 🚀 Start Here - TensorStore Setup

## Quick Start (3 Steps)

### 1. Run Setup Script
```bash
./scripts/setup.sh
```

This will:
- ✅ Create `.env` file (if needed)
- ✅ Build Docker images
- ✅ Load all secrets
- ✅ Validate configuration

### 2. Edit Secrets
```bash
# Edit .env file with your actual secrets
nano .env
```

**Required:**
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key  
- `MONGODB_ROOT_PASSWORD` - Strong password

### 3. Start Services (Manual)
```bash
./scripts/start.sh
```

Or:
```bash
docker-compose up -d
```

## What's Ready

After setup, everything is prepared:
- ✅ Docker images built
- ✅ Secrets loaded
- ✅ Configuration validated
- ✅ Services ready (but NOT started)

**Services will NOT auto-start** - you control when to start them.

## Access Services

Once started:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000/service/api

## Useful Commands

```bash
# Check status
./scripts/check.sh

# View logs
docker-compose logs -f

# Stop services
./scripts/stop.sh

# Or use Makefile
make setup    # Setup
make check    # Check
make start    # Start
make stop     # Stop
make logs     # Logs
```

## Need Help?

- See [README_SETUP.md](README_SETUP.md) for detailed setup
- See [QUICKSTART.md](QUICKSTART.md) for quick reference
- See [DOCKER_SETUP.md](DOCKER_SETUP.md) for Docker details

