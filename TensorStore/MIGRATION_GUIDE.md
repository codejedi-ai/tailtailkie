# Migration Guide: Moving MongoDB and Milvus to Flask Backend

This guide documents the migration of MongoDB and Milvus database connections from the Next.js frontend to the Flask backend.

## Overview

All database operations (MongoDB and Milvus) have been moved from the Next.js application to the Flask backend. The Next.js frontend now acts as a proxy, forwarding API requests to the Flask backend.

## Architecture Changes

### Before
- Next.js app directly connected to MongoDB (via Prisma)
- Next.js app directly connected to Milvus
- Database credentials stored in Next.js environment variables

### After
- Flask backend handles all MongoDB operations
- Flask backend handles all Milvus operations
- Next.js app proxies requests to Flask backend
- Database credentials stored in Flask backend environment variables

## Flask Backend Setup

### New Dependencies

Add to `requirements.in`:
- `pymongo==4.6.0` - MongoDB client
- `pymilvus==2.3.4` - Milvus client
- `PyJWT==2.8.0` - JWT token decoding for Clerk auth

### Environment Variables

Add to Flask backend `.env` or configuration:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/tensorstore
# or
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/tensorstore

# Milvus
MILVUS_URI=https://your-instance.milvus.io
MILVUS_TOKEN=your-token
MILVUS_USER=your-user  # optional

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_FRONTEND_API=https://api.clerk.com  # optional, defaults to this
```

### New Flask Endpoints

1. **GET /service/api/datasets** - List datasets with filtering
2. **POST /service/api/datasets** - Create a new dataset
3. **GET /service/api/datasets/<id>** - Get a single dataset
4. **PUT /service/api/datasets/<id>** - Update a dataset
5. **DELETE /service/api/datasets/<id>** - Delete a dataset
6. **POST /service/api/upload** - Upload tensor files

### Authentication

The Flask backend uses Clerk JWT tokens for authentication. Tokens are passed in the `Authorization: Bearer <token>` header.

## Next.js Frontend Changes

### Environment Variables

Add to Next.js `.env.local`:

```bash
FLASK_API_URL=http://localhost:5000/service/api
# or for production
NEXT_PUBLIC_FLASK_API_URL=https://your-flask-backend.com/service/api
```

### API Routes

All Next.js API routes (`/app/api/*`) now proxy requests to the Flask backend:

- `/api/datasets` → `/service/api/datasets`
- `/api/datasets/[id]` → `/service/api/datasets/<id>`
- `/api/upload` → `/service/api/upload`

### Removed Dependencies

You can remove these from Next.js `package.json` (if not used elsewhere):
- `@zilliz/milvus2-sdk-node`
- `mongodb` (if Prisma is still used for other purposes, keep it)

## CORS Configuration

**Important**: The Flask backend does NOT use CORS. All requests come through the Next.js frontend proxy, so CORS is not needed.

## Testing

1. Start Flask backend:
   ```bash
   cd db-flask-backend
   python -m flask run --port 5000
   ```

2. Start Next.js frontend:
   ```bash
   cd Kaggle-For-Tensors
   npm run dev
   ```

3. Test endpoints:
   - Frontend: `http://localhost:3000/api/datasets`
   - Backend: `http://localhost:5000/service/api/datasets`

## Migration Checklist

- [x] Add MongoDB client to Flask backend
- [x] Add Milvus client to Flask backend
- [x] Create Clerk authentication service
- [x] Create dataset endpoints in Flask
- [x] Create upload endpoint in Flask
- [x] Update Next.js API routes to proxy to Flask
- [x] Remove CORS (not needed - frontend is proxy)
- [ ] Update production environment variables
- [ ] Test all endpoints
- [ ] Update deployment configurations

## Notes

- File uploads are temporarily stored in MongoDB instead of Milvus (Milvus is better suited for vector data)
- Clerk token verification is simplified - in production, you should verify JWT signatures using Clerk's public keys
- The Flask backend uses the same MongoDB database schema as before (Prisma schema)

## Troubleshooting

### Authentication Errors
- Verify `CLERK_SECRET_KEY` is set in Flask backend
- Check token is being passed in Authorization header
- Verify token format is correct

### Database Connection Errors
- Verify MongoDB URI is correct
- Check network connectivity
- Verify database credentials

### Milvus Connection Errors
- Verify Milvus URI and token
- Check Milvus service is running
- Verify network connectivity to Milvus instance

