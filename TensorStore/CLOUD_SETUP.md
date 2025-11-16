# Cloud Services Configuration

Your TensorStore setup is configured to use **cloud services** instead of local Docker services:

## Current Configuration

### MongoDB Atlas (Cloud)
- **Connection**: `DATABASE_URL` is set to MongoDB Atlas
- **Local MongoDB**: Disabled (using profile `local-mongodb`)
- **Network**: Backend can access internet for MongoDB Atlas

### Milvus/Zilliz Cloud (Cloud)
- **Connection**: `MILVUS_URI` points to Zilliz Cloud instance
- **Local Milvus**: Disabled (using profile `local-milvus`)
- **Network**: Backend can access internet for Zilliz Cloud

### Clerk (Cloud)
- **Authentication**: Using Clerk cloud service
- **Network**: Frontend handles Clerk client-side, backend may need internet for verification

## Network Configuration

Since you're using cloud services, the network isolation has been adjusted:

- **Backend Network**: Internet access enabled (for cloud databases)
- **Frontend Network**: Internet access enabled (for Clerk)
- **Database Network**: Only used if running local MongoDB/Milvus

## Services That Won't Start

These services are configured but won't start by default (using profiles):

- `mongodb` - Only starts with `--profile local-mongodb`
- `milvus` - Only starts with `--profile local-milvus`
- `etcd` - Only needed for local Milvus
- `minio` - Only needed for local Milvus

## Starting Services

### Standard Start (Cloud Services)
```bash
# Start only frontend and backend (cloud databases)
docker-compose up -d frontend backend
```

### With Local MongoDB (if needed)
```bash
# Start with local MongoDB
docker-compose --profile local-mongodb up -d
```

### With Local Milvus (if needed)
```bash
# Start with local Milvus
docker-compose --profile local-milvus up -d
```

## Environment Variables

Your `.env` file is configured with:
- ✅ MongoDB Atlas connection string
- ✅ Zilliz Cloud Milvus credentials
- ✅ Clerk authentication keys
- ✅ All Clerk URL configurations

## Verification

Check your configuration:

```bash
# Verify secrets are loaded
./scripts/show-secrets-status.sh

# Check services
docker-compose config | grep -A 5 "backend:"
docker-compose config | grep -A 5 "frontend:"
```

## Important Notes

1. **Internet Access Required**: Backend needs internet to connect to:
   - MongoDB Atlas
   - Zilliz Cloud (Milvus)
   - Clerk API (for JWT verification)

2. **No Local Databases**: Local MongoDB and Milvus services are disabled by default

3. **Network Isolation**: Relaxed for cloud service access

4. **Secrets**: All secrets are loaded from `.env` → `docker-secrets.env`

## Troubleshooting

### Backend can't connect to MongoDB Atlas
- Check `DATABASE_URL` in `.env` is correct
- Verify MongoDB Atlas allows connections from your IP
- Check network allows outbound connections

### Backend can't connect to Milvus
- Check `MILVUS_URI`, `MILVUS_TOKEN`, `MILVUS_USER` in `.env`
- Verify Zilliz Cloud instance is running
- Check network allows outbound HTTPS connections

### Clerk authentication fails
- Verify `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are correct
- Check backend can reach `https://api.clerk.com`
- Consider using offline JWT verification

