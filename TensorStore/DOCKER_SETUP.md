# Docker Compose Setup

This document describes the Docker Compose setup for TensorStore with network isolation.

## Architecture

The Docker Compose setup creates isolated network bubbles:

1. **Database Network** (`database-network`): Internal network with no internet access
   - MongoDB
   - Milvus (with etcd and MinIO)
   - Only accessible from backend

2. **Backend Network** (`backend-network`): Internal network with no internet access
   - Backend (Flask)
   - Frontend (Next.js)
   - Frontend can only access backend

3. **Network Isolation**:
   - Backend can only access databases (MongoDB, Milvus)
   - Frontend can only access backend
   - No internet access from containers (except for database connections)

## Quick Start

1. Copy environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   # MongoDB
   MONGODB_ROOT_USERNAME=admin
   MONGODB_ROOT_PASSWORD=your_secure_password
   
   # Milvus
   MILVUS_URI=http://milvus:19530
   MILVUS_TOKEN=your_milvus_token
   
   # Clerk
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Check logs:
   ```bash
   docker-compose logs -f
   ```

5. Access services:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/service/api
   - MongoDB: localhost:27017 (from host only)

## Services

### Frontend (Next.js)
- **Port**: 3000
- **Network**: `backend-network` (internal, no internet)
- **Access**: Only to backend service
- **Environment**: See `.env.example`

### Backend (Flask)
- **Port**: 5000
- **Networks**: 
  - `database-network` (for MongoDB, Milvus)
  - `backend-network` (for frontend communication)
- **Access**: Only to databases, no internet
- **Environment**: See `.env.example`

### MongoDB
- **Port**: 27017 (host only)
- **Network**: `database-network` (internal)
- **Data**: Persisted in `mongodb_data` volume

### Milvus
- **Port**: 19530 (host only)
- **Network**: `database-network` (internal)
- **Dependencies**: etcd, MinIO
- **Data**: Persisted in `milvus_data` volume

## Network Policies

### Backend Container
- ✅ Can access: MongoDB (port 27017), Milvus (port 19530)
- ❌ Cannot access: Internet, external services
- ✅ Can receive: Requests from frontend

### Frontend Container
- ✅ Can access: Backend (port 5000)
- ❌ Cannot access: Internet, databases, external services
- ✅ Can receive: Requests from host/ingress

## Environment Variables

All environment variables are configured in `.env` file. See `.env.example` for reference.

### Required Variables
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key for frontend
- `MONGODB_ROOT_PASSWORD` - MongoDB root password

### Optional Variables
- `MILVUS_TOKEN` - Milvus authentication token
- `MILVUS_USER` - Milvus username
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key

## Development

For local development with hot reload:

1. Use override file:
   ```bash
   cp docker-compose.override.example.yml docker-compose.override.yml
   ```

2. Mount source code (add to override):
   ```yaml
   services:
     backend:
       volumes:
         - ./db-flask-backend:/app
     frontend:
       volumes:
         - ./Kaggle-For-Tensors:/app
         - /app/node_modules
         - /app/.next
   ```

3. Run with override:
   ```bash
   docker-compose up
   ```

## Production

For production deployment:

1. Use environment-specific `.env` file
2. Set strong passwords
3. Use secrets management (Docker secrets, Kubernetes secrets, etc.)
4. Enable SSL/TLS
5. Configure proper resource limits
6. Set up monitoring and logging

## Troubleshooting

### Containers can't access databases
- Check network configuration
- Verify service names match
- Check health checks

### Frontend can't reach backend
- Verify both are on `backend-network`
- Check backend health status
- Verify environment variables

### No internet access
- This is by design (security)
- If you need internet access, remove `internal: true` from networks
- Consider using a proxy service for external API calls

### Database connection errors
- Check MongoDB/Milvus are healthy
- Verify connection strings
- Check credentials in `.env`

## Security Notes

- All networks are internal (no internet access)
- Database ports only exposed to localhost
- Environment variables should be kept secret
- Use strong passwords in production
- Regularly update images
- Monitor for security vulnerabilities

