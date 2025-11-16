# Checking Your Secrets Configuration

## Quick Check

Run this to see your current secrets status:

```bash
./scripts/show-secrets-status.sh
```

Or use Makefile:
```bash
make show-secrets
```

## How Secrets Work

### 1. Source: `.env` File
This is your **source of truth**. Edit this file with your actual secrets.

### 2. Docker Compose Variable Substitution
Docker Compose **automatically reads `.env` file** in the same directory for variable substitution like `${VAR}`.

So when docker-compose.yml has:
```yaml
MONGODB_URI: mongodb://${MONGODB_ROOT_USERNAME:-admin}:${MONGODB_ROOT_PASSWORD:-changeme}@mongodb:27017/...
```

It will:
- Read `MONGODB_ROOT_USERNAME` from `.env` file (or use default `admin`)
- Read `MONGODB_ROOT_PASSWORD` from `.env` file (or use default `changeme`)

### 3. Container Environment: `docker-secrets.env`
The `env_file: docker-secrets.env` loads secrets **into the container's environment**.

This file is **generated** from `.env` by `setup.sh`.

## Verification Steps

### Step 1: Check .env File
```bash
# View secrets status (masked for security)
./scripts/show-secrets-status.sh
```

### Step 2: Verify Secrets Are Set
```bash
# Full verification
./scripts/verify-secrets.sh
```

This checks:
- ✅ `.env` file exists
- ✅ Required secrets are set (not placeholders)
- ✅ `docker-secrets.env` is generated
- ✅ Secrets are valid format

### Step 3: Regenerate if Needed
If you edited `.env` but `docker-secrets.env` is outdated:

```bash
./scripts/fix-secrets.sh
```

## Required Secrets

### Must Set (No Defaults)
- `CLERK_SECRET_KEY` - Must start with `sk_test_` or `sk_live_`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Must start with `pk_test_` or `pk_live_`

### Should Change (Has Defaults)
- `MONGODB_ROOT_PASSWORD` - Default is `changeme` (not secure)

### Optional (Have Defaults)
- `MILVUS_TOKEN` - Optional (for cloud Milvus)
- `MILVUS_USER` - Optional
- `MINIO_ACCESS_KEY` - Default: `minioadmin`
- `MINIO_SECRET_KEY` - Default: `minioadmin`

## Current Configuration

Your secrets are configured in **two places**:

1. **`.env`** - Source file (edit this)
2. **`docker-secrets.env`** - Generated file (auto-created)

Both should have the same values. The setup script ensures they're in sync.

## Troubleshooting

### "Secrets not loading"
**Problem**: Variables showing as empty or defaults

**Solution**:
1. Check `.env` file has real values (not placeholders)
2. Run `./scripts/fix-secrets.sh` to regenerate `docker-secrets.env`
3. Verify with `./scripts/verify-secrets.sh`

### "Using placeholder values"
**Problem**: Still seeing `sk_test_...` or `pk_test_...`

**Solution**:
1. Edit `.env` file
2. Replace placeholders with actual keys from Clerk dashboard
3. Run `./scripts/fix-secrets.sh`

### "Docker Compose using defaults"
**Problem**: Services using default values like `changeme`

**Solution**:
- Docker Compose reads `.env` automatically
- Make sure `.env` is in the same directory as `docker-compose.yml`
- Check `.env` has the correct variable names (case-sensitive)

## Example .env File

```bash
# Required - Get these from Clerk dashboard
CLERK_SECRET_KEY=sk_test_abc123xyz...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_def456uvw...

# Required - Change from default
MONGODB_ROOT_PASSWORD=your_secure_password_here

# Optional
MILVUS_TOKEN=your_milvus_token
MILVUS_USER=your_milvus_user
```

## Verification Commands

```bash
# Show secrets status (safe - masks sensitive values)
make show-secrets

# Full verification
make verify-secrets

# Regenerate docker-secrets.env
make fix-secrets

# Or use scripts directly
./scripts/show-secrets-status.sh
./scripts/verify-secrets.sh
./scripts/fix-secrets.sh
```

## Next Steps

1. **Check current status**: `./scripts/show-secrets-status.sh`
2. **Edit `.env`** if needed with real values
3. **Regenerate**: `./scripts/fix-secrets.sh`
4. **Verify**: `./scripts/verify-secrets.sh`
5. **Start services**: `./scripts/start.sh`

