# TensorStore Backend

A Python Flask-based REST API backend for managing tensor datasets with MongoDB and Milvus integration. This service provides a centralized backend for the TensorStore platform, handling all database operations and authentication.

## Overview

This application serves as the backend API for TensorStore, providing:

- **Dataset Management**: CRUD operations for tensor datasets
- **MongoDB Integration**: Metadata storage for datasets, users, and tensors
- **Milvus Integration**: Vector storage and similarity search for tensor embeddings
- **REST API**: Well-documented API endpoints with Swagger/OpenAPI documentation
- **Authentication**: Clerk JWT token-based authentication
- **Metrics**: Prometheus metrics for monitoring and observability

**Important**: This backend does NOT use CORS. All requests come through the Next.js frontend proxy.

## Technology Stack

- **Framework**: Flask 2.0.2 with Flask-SQLAlchemy
- **Databases**: 
  - MongoDB for metadata storage
  - Milvus for vector storage and similarity search
- **API Documentation**: Flasgger (Swagger/OpenAPI)
- **Migrations**: Alembic via Flask-Migrate
- **Dependency Injection**: dependency-injector
- **Authentication**: Clerk JWT tokens
- **Monitoring**: Prometheus client with Flask exporter
- **Deployment**: Docker, Kubernetes (Helm charts)

## API Endpoints

The API is available at `/service/api` with the following endpoints:

- `GET /service/api/` - Root endpoint
- `GET /service/api/datasets` - List datasets with filtering
- `POST /service/api/datasets` - Create a new dataset
- `GET /service/api/datasets/<id>` - Get a single dataset
- `PUT /service/api/datasets/<id>` - Update a dataset
- `DELETE /service/api/datasets/<id>` - Delete a dataset
- `POST /service/api/upload` - Upload tensor files
- `GET /service/api/status` - Health check endpoint
- `GET /service/api/version` - Build version information

Swagger documentation is available in development mode at `/apidocs/`.

## Architecture

```
src/im_db_backend/
├── app/              # Flask application factory and routing
├── clients/          # External service clients (Jira, etc.)
├── common/           # Shared utilities and helpers
├── configuration/    # Configuration management and DI containers
├── DAL/              # Data Access Layer (database models)
├── resources/        # API endpoint resources/controllers
└── swagger/          # API documentation templates
```

## Prerequisites

### Required
1. [Python](https://www.python.org/downloads/) 3.8.1+
2. [Docker](https://docs.docker.com/get-docker/) (Engine 18.06.0+)

### For Kubernetes Deployment
3. [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) - Kubernetes in Docker
4. [Helm](https://helm.sh/docs/intro/install/) v3.1.2+
5. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) v1.18.0+
6. [gcloud](https://cloud.google.com/sdk/docs/downloads-interactive#linux) - For GCP deployment

## Setup

All commands should be executed from the root of the project.

### 1. Environment Configuration

```bash
cp .env.example .env
```

Copy `.env.example` and configure your environment variables. This file contains sensitive information and should **never** be committed to version control.

Required environment variables:
- Database credentials (host, username, password, database name)
- Google OAuth credentials
- Jira API credentials
- SSL certificate paths

### 2. Development Environment

```bash
source scripts/dev.sh
```

This script will:
- Create and activate a Python virtual environment
- Install all project dependencies
- Set up development tools (pytest, mypy, etc.)

## Running the Application

### Option 1: Docker (Recommended for Local Development)

Fastest way to run the application locally:

```bash
./scripts/start.sh
```

This spins up the application and database in Docker containers with proper networking and SSL configuration.

**Accessing the API:**
- API: `http://localhost:<port>/service/api/`
- Swagger Docs: `http://localhost:<port>/apidocs/`

To stop the application:
```bash
./scripts/stop.sh
```

### Option 2: Kubernetes (KinD)

For testing deployment configurations locally before pushing to GCP:

#### 1. Initialize KinD Cluster
```bash
./scripts/init.sh
```

Creates a local Kubernetes cluster using KinD.

#### 2. Deploy Application
```bash
./scripts/deploy.sh
```

Deploys the application, database, and all configurations to the KinD cluster using Helm charts.

#### 3. Teardown
```bash
./scripts/teardown.sh
```

Removes the KinD cluster and all resources.

## Database Migrations

Migrations are managed using Alembic via Flask-Migrate.

### Local Development

#### 1. Start Database
```bash
./scripts/database.sh
```

Spins up a local MySQL database with SSL certificates configured.

#### 2. Create Migration
```bash
./scripts/migrate.sh
```

Generates a new migration file in `database/migration/versions/` based on model changes.

#### 3. Apply Migrations
```bash
./scripts/migrate.sh upgrade
```

Applies pending migrations to the local database.

#### 4. Rollback Migration
```bash
./scripts/migrate.sh downgrade
```

### Production Deployments

During Kubernetes deployments, migrations are executed automatically via init containers before the application starts.

## Development Workflow

1. Make changes to SQLAlchemy models in `src/im_db_backend/DAL/`
2. Generate migration: `./scripts/migrate.sh`
3. Review the generated migration file
4. Test migration locally: `./scripts/migrate.sh upgrade`
5. Commit migration file to version control

## Available Scripts

- `./scripts/dev.sh` - Set up development environment
- `./scripts/start.sh` - Start application in Docker
- `./scripts/stop.sh` - Stop Docker containers
- `./scripts/database.sh` - Start local database
- `./scripts/migrate.sh` - Database migration commands
- `./scripts/init.sh` - Initialize KinD cluster
- `./scripts/deploy.sh` - Deploy to KinD
- `./scripts/teardown.sh` - Destroy KinD cluster
- `./scripts/requirements.sh` - Update Python dependencies

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=im_db_backend

# Type checking
mypy src/
```

## Monitoring

The application exposes Prometheus metrics at the `/metrics` endpoint for monitoring:
- Request counts and latencies
- Database connection pool metrics
- Custom application metrics

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass and type checking succeeds
4. Update CHANGELOG.md following conventional commits
5. Submit a pull request

## Version

Current version: **1.1.0**

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License
