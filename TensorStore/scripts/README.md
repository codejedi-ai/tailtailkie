# TensorStore Scripts

Helper scripts for managing the TensorStore Docker environment.

## Available Scripts

### `setup.sh`
Initial setup script that prepares everything before running:
- Creates `.env` file from `env.example` if it doesn't exist
- Validates required environment variables
- Builds Docker images (backend and frontend)
- Creates necessary directories
- Generates `docker-secrets.env` file
- Validates docker-compose configuration

**Usage:**
```bash
./scripts/setup.sh
```

### `check.sh`
Environment validation script:
- Checks if `.env` file exists
- Validates required environment variables are set
- Checks Docker installation and daemon status
- Verifies Docker images are built
- Shows running services status

**Usage:**
```bash
./scripts/check.sh
```

### `start.sh`
Starts all services:
- Checks if setup has been run
- Verifies images are built
- Starts all Docker Compose services
- Waits for services to be healthy
- Shows service status

**Usage:**
```bash
./scripts/start.sh
```

### `stop.sh`
Stops all services gracefully.

**Usage:**
```bash
./scripts/stop.sh
```

### `clean.sh`
Complete cleanup (removes containers, volumes, images):
- Stops and removes all containers
- Removes volumes
- Removes Docker images
- Cleans up generated files

**Usage:**
```bash
./scripts/clean.sh
```

## Workflow

1. **First Time Setup:**
   ```bash
   ./scripts/setup.sh
   # Edit .env with your actual secrets
   ./scripts/check.sh
   ```

2. **Start Services:**
   ```bash
   ./scripts/start.sh
   ```

3. **Check Status:**
   ```bash
   ./scripts/check.sh
   ```

4. **Stop Services:**
   ```bash
   ./scripts/stop.sh
   ```

5. **Clean Everything:**
   ```bash
   ./scripts/clean.sh
   ```

## Using Makefile

Alternatively, use the Makefile:

```bash
make setup    # Run setup
make check    # Check environment
make start    # Start services
make stop     # Stop services
make logs     # View logs
make clean    # Clean everything
```

## Notes

- All scripts require executable permissions (already set)
- Scripts use colored output for better readability
- Scripts validate prerequisites before running
- All secrets are loaded from `.env` file
- Docker secrets are generated in `docker-secrets.env`

