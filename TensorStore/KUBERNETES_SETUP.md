# Kubernetes Setup

This document describes the Kubernetes deployment for TensorStore with network policies for isolation.

## Architecture

The Kubernetes setup uses Network Policies to enforce network isolation:

1. **Backend Pods**: Can only access MongoDB and Milvus
2. **Frontend Pods**: Can only access Backend
3. **No Internet Access**: All pods are isolated from external networks (except database connections)

## Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- Network Policy support (Calico, Cilium, or similar)
- MongoDB and Milvus deployed (or use provided manifests)

## Deployment

### 1. Create Namespace

```bash
kubectl create namespace tensorstore
```

### 2. Create Secrets

Create a secrets file `secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tensorstore-secrets
  namespace: tensorstore
type: Opaque
stringData:
  mongodb-username: admin
  mongodb-password: your_secure_password
  milvus-token: your_milvus_token
  clerk-secret-key: sk_test_...
  mysql-password: your_mysql_password
```

Apply secrets:
```bash
kubectl apply -f secrets.yaml
```

### 3. Update Values

Edit `kubernetes/backend-chart/values.yaml`:

```yaml
# MongoDB Configuration
mongodb:
  uri: mongodb://mongodb-service:27017/tensorstore

# Milvus Configuration
milvus:
  uri: http://milvus-service:19530
  token: "your_token_here"
  user: ""

# Clerk Authentication
clerk:
  secretKey: "sk_test_..."
  publishableKey: "pk_test_..."
  frontendApi: "https://api.clerk.com"
```

### 4. Deploy with Helm

```bash
cd kubernetes/backend-chart
helm install tensorstore . -n tensorstore -f values.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n tensorstore

# Check services
kubectl get svc -n tensorstore

# Check network policies
kubectl get networkpolicies -n tensorstore
```

## Network Policies

### Backend Network Policy

The backend can:
- ✅ Receive traffic from frontend pods
- ✅ Access MongoDB (port 27017)
- ✅ Access Milvus (port 19530)
- ❌ No internet access
- ❌ Cannot access other services

### Frontend Network Policy

The frontend can:
- ✅ Receive traffic from ingress controller
- ✅ Access backend (port 5000)
- ❌ No internet access
- ❌ Cannot access databases directly

## Environment Variables

All environment variables are configured via ConfigMaps and Secrets:

### ConfigMap (`tensorstore-backend-config`)
- Application configuration
- Database URIs
- Clerk configuration (public keys)

### Secrets (`tensorstore-secrets`)
- Database passwords
- Clerk secret keys
- API tokens

## Services

### Backend Service
- **Type**: ClusterIP
- **Port**: 80 → 5000
- **Selector**: `app: tensorstore-backend`

### Frontend Service
- **Type**: ClusterIP
- **Port**: 80 → 3000
- **Selector**: `app: tensorstore-frontend`

## Ingress

Configure ingress for external access:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tensorstore-ingress
  namespace: tensorstore
spec:
  ingressClassName: nginx
  rules:
  - host: tensorstore.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tensorstore-frontend
            port:
              number: 80
      - path: /service/api
        pathType: Prefix
        backend:
          service:
            name: tensorstore-backend
            port:
              number: 80
```

## Scaling

Scale deployments:

```bash
# Scale backend
kubectl scale deployment tensorstore-backend -n tensorstore --replicas=3

# Scale frontend
kubectl scale deployment tensorstore-frontend -n tensorstore --replicas=3
```

## Monitoring

### Health Checks

Both deployments include:
- Readiness probes
- Liveness probes

### Metrics

Backend exposes Prometheus metrics at `/metrics`

## Troubleshooting

### Pods can't access databases
- Check Network Policies: `kubectl describe networkpolicy -n tensorstore`
- Verify service names match
- Check DNS resolution

### Frontend can't reach backend
- Verify both are in same namespace
- Check Network Policy allows frontend → backend
- Verify backend service is running

### No internet access
- This is by design (security)
- If needed, modify Network Policies
- Consider using a proxy service

### Database connection errors
- Check MongoDB/Milvus services are running
- Verify connection strings in ConfigMap
- Check credentials in Secrets

## Security Notes

- Network Policies enforce isolation
- Secrets should be encrypted at rest
- Use RBAC for access control
- Regularly rotate secrets
- Monitor for security vulnerabilities
- Use Pod Security Standards

## Updating

Update deployment:

```bash
# Update values
helm upgrade tensorstore . -n tensorstore -f values.yaml

# Rollback if needed
helm rollback tensorstore -n tensorstore
```

