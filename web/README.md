# TensorStore

A monorepo for TensorStore - a platform for managing and sharing tensor datasets with vector similarity search capabilities.

## Architecture

This is a monorepo containing:

- **Backend** (`db-flask-backend/`) - Flask REST API for managing datasets, MongoDB and Milvus integration
- **Frontend** (`Kaggle-For-Tensors/`) - Next.js frontend that acts as a proxy to the backend API

### Backend (Flask)

The Flask backend handles all database operations:
- MongoDB for metadata storage
- Milvus for vector storage and similarity search

**Important**: The backend does NOT use CORS. The frontend proxies all requests to the backend.

### Frontend (Next.js)

The Next.js frontend is strictly a proxy layer:
- All API routes (`/app/api/*`) forward requests to the Flask backend
- No direct database connections

## Project Structure

```
TensorStore/
├── db-flask-backend/          # Flask backend API
│   ├── src/
│   │   └── im_db_backend/     # Main application code
│   ├── requirements.in        # Python dependencies
│   └── ...
├── Kaggle-For-Tensors/        # Next.js frontend (proxy)
│   ├── app/
│   │   └── api/              # API routes (proxies to backend)
│   ├── lib/                   # Frontend utilities
│   └── ...
├── docker/                    # Docker configurations
│   ├── backend.Dockerfile
│   └── database.Dockerfile
├── kubernetes/                # Kubernetes configurations
│   ├── backend-chart/         # Helm chart for backend
│   └── kind/                  # Local Kubernetes configs
└── README.md                  # This file
```

## Quick Start

### Backend Setup

1. Navigate to backend:
   ```bash
   cd db-flask-backend
   ```

2. Create virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variables:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017/tensorstore"
   export MILVUS_URI="https://your-instance.milvus.io"
   export MILVUS_TOKEN="your-token"
   ```

5. Run the backend:
   ```bash
   python manage.py run
   # or
   gunicorn -c src/im_db_backend/app/gunicorn.conf.py src.im_db_backend.app.app:application
   ```

The backend will be available at `http://localhost:5000/service/api`

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd Kaggle-For-Tensors
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Set environment variables:
   ```bash
   export FLASK_API_URL="http://localhost:5000/service/api"
   # or for production
   export NEXT_PUBLIC_FLASK_API_URL="https://your-backend.com/service/api"
   ```

4. Run the frontend:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

All endpoints are prefixed with `/service/api`:

- `GET /service/api/datasets` - List datasets
- `POST /service/api/datasets` - Create dataset
- `GET /service/api/datasets/<id>` - Get dataset
- `PUT /service/api/datasets/<id>` - Update dataset
- `DELETE /service/api/datasets/<id>` - Delete dataset
- `POST /service/api/upload` - Upload tensor files

## Docker Compose

### Quick Start

```bash
# 1. Setup (builds images, loads secrets, validates config)
./scripts/setup.sh

# 2. Check environment
./scripts/check.sh

# 3. Start services (manual start)
./scripts/start.sh

# Or use Makefile:
make setup    # Initial setup
make check    # Check environment
make start    # Start services
make stop     # Stop services
make logs     # View logs
```

### Manual Setup

```bash
# Copy environment file
cp env.example .env
# Edit .env with your actual secrets

# Build images and prepare
./scripts/setup.sh

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed documentation.

**Network Isolation**: Containers are isolated with no internet access except for database connections:
- Frontend can only access Backend
- Backend can only access MongoDB and Milvus
- All database operations handled by Flask backend

## Kubernetes

Deploy to Kubernetes using the Helm chart:

```bash
# Create namespace
kubectl create namespace tensorstore

# Create secrets (see KUBERNETES_SETUP.md)
kubectl apply -f secrets.yaml

# Deploy
cd kubernetes/backend-chart
helm install tensorstore . -n tensorstore -f values.yaml
```

See [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) for detailed documentation.

**Network Policies**: Kubernetes Network Policies enforce the same isolation as Docker Compose.

## Environment Variables

### Backend

- `MONGODB_URI` - MongoDB connection string
- `MILVUS_URI` - Milvus instance URI
- `MILVUS_TOKEN` - Milvus authentication token
- `MILVUS_USER` - Milvus username (optional)

### Frontend

- `FLASK_API_URL` - Backend API URL (server-side)
- `NEXT_PUBLIC_FLASK_API_URL` - Backend API URL (client-side)

## Development

### Backend Development

```bash
cd db-flask-backend
source venv/bin/activate
python manage.py run
```

### Frontend Development

```bash
cd Kaggle-For-Tensors
pnpm dev
```

## Notes

- The backend does NOT use CORS - all requests come through the Next.js proxy
- The frontend is strictly a proxy - no direct database connections
- File uploads are temporarily stored in MongoDB (Milvus is for vectors)

## License

MIT

