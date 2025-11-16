# Kaggle for Tensors - Setup Guide

## Overview

Your application has been transformed into **Kaggle for Tensors** - a platform for sharing structured tensor datasets. Unlike traditional Kaggle with CSVs and unstructured data, this platform only handles pure tensors (.pt, .npy, .safetensors, .h5) where each dimension is semantically annotated.

## What's Been Built

### Database Schema
- **User**: Clerk-synced users with datasets and downloads
- **Dataset**: Container for tensor files with metadata
- **Tensor**: Individual tensor files with shape and dtype info
- **Dimension**: Semantic annotations for each dimension (e.g., "batch", "channels", "height")
- **Download**: Track who downloaded which datasets

### API Routes

#### Authentication
- `POST /api/webhooks/clerk` - Sync Clerk users to database
- `/sign-in/[[...sign-in]]` - Sign in page
- `/sign-up/[[...sign-up]]` - Sign up page

#### Datasets
- `GET /api/datasets` - List datasets with search/filter
  - Query params: `search`, `userId`, `format`, `limit`, `offset`
- `POST /api/datasets` - Create new dataset
- `GET /api/datasets/[id]` - Get single dataset
- `PUT /api/datasets/[id]` - Update dataset metadata
- `DELETE /api/datasets/[id]` - Delete dataset and files

#### File Operations
- `POST /api/upload` - Upload tensor files
- `GET /api/datasets/[id]/download` - Download dataset as zip

### Pages
- `/` - Homepage with recent datasets and search
- `/datasets` - Browse all datasets (TO BE CREATED)
- `/datasets/[id]` - Dataset detail page (TO BE CREATED)
- `/upload` - Upload new dataset (TO BE CREATED)

## Setup Instructions

### 1. Configure Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Get your API keys from the dashboard
4. Update `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

5. Set up Clerk webhook:
   - Go to Clerk Dashboard → Webhooks
   - Create endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret to `CLERK_WEBHOOK_SECRET`

### 2. Initialize Database

The SQLite database is already configured. To create the tables:

```bash
npx prisma db push
```

To view/edit data:

```bash
npx prisma studio
```

### 3. Create Upload Directory

```bash
mkdir uploads
```

Add to `.gitignore`:

```
uploads/
*.db
*.db-shm
*.db-wal
```

### 4. Install Dependencies

Already done, but if you need to reinstall:

```bash
pnpm install
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## File Structure

```
app/
├── api/
│   ├── datasets/
│   │   ├── route.ts              # List & create datasets
│   │   └── [id]/
│   │       ├── route.ts          # Get, update, delete dataset
│   │       └── download/
│   │           └── route.ts      # Download dataset
│   ├── upload/
│   │   └── route.ts              # Upload tensor files
│   └── webhooks/
│       └── clerk/
│           └── route.ts          # Clerk user sync
├── sign-in/[[...sign-in]]/
│   └── page.tsx                  # Sign in page
├── sign-up/[[...sign-up]]/
│   └── page.tsx                  # Sign up page
├── layout.tsx                    # Root layout with ClerkProvider
└── page.tsx                      # Homepage

lib/
├── prisma.ts                     # Prisma client singleton
├── types.ts                      # Zod schemas & TypeScript types
├── upload.ts                     # File upload utilities
└── utils.ts                      # General utilities

prisma/
├── schema.prisma                 # Database schema
└── dev.db                        # SQLite database file

middleware.ts                     # Clerk authentication middleware
```

## Supported File Formats

- `.pt`, `.pth` - PyTorch tensors
- `.npy`, `.npz` - NumPy arrays
- `.safetensors` - Hugging Face SafeTensors
- `.h5`, `.hdf5` - HDF5 format

## Key Features

### 1. Tensor Upload
Users upload tensor files and provide:
- Dataset name and description
- For each tensor:
  - Shape (auto-detected or manual)
  - Data type (float32, int64, etc.)
  - Dimension annotations (name + description for each axis)

### 2. Semantic Dimensions
Each dimension in a tensor is annotated:
- **Index**: 0, 1, 2, 3...
- **Size**: 128, 256, 3...
- **Name**: "batch", "channels", "height", "width"
- **Description**: "Number of samples in the batch", "RGB channels", etc.

### 3. Dataset Discovery
- Search by name or description
- Filter by file format
- Filter by user
- View tensor shapes and metadata

### 4. Download System
- Single file: Direct download
- Multiple files: Zip with metadata.json
- Tracks downloads and increments count

## Database Schema Details

### User Table
- Synced from Clerk via webhooks
- Stores clerkId, email, username
- One-to-many: datasets, downloads

### Dataset Table
- name, description, tags (JSON array)
- totalSize (bytes), fileFormat, isPublic
- downloadCount, viewCount stats
- One-to-many: tensors

### Tensor Table
- fileName, filePath, fileSize
- shape (JSON array: [128, 256, 3])
- dtype (string: "float32", "int64")
- One-to-many: dimensions

### Dimension Table
- index (0, 1, 2...), size (128, 256...)
- name ("batch", "channels"...)
- description (optional explanation)

## Next Steps

### Required Pages to Build:

1. **Upload Page** (`/upload`)
   - File upload with drag & drop
   - Tensor metadata form
   - Dimension annotation interface

2. **Dataset Detail Page** (`/datasets/[id]`)
   - Display tensor metadata
   - Show dimension annotations
   - Download button
   - Visualize tensor shapes

3. **Browse Page** (`/datasets`)
   - Grid of all datasets
   - Advanced filters
   - Pagination

### Optional Enhancements:

1. **Tensor Visualization**
   - 2D heatmaps for matrices
   - 3D visualizations
   - Sample data preview

2. **Validation**
   - Parse uploaded files to extract actual shape/dtype
   - Verify tensor integrity

3. **API for ML Libraries**
   - Python client library
   - Direct PyTorch/TensorFlow integration

4. **Competitions**
   - Create challenges with specific tensor formats
   - Leaderboards

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Development Commands

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Prisma commands
npx prisma studio          # Open database GUI
npx prisma db push         # Sync schema to database
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create migration

# Format code
pnpm format
```

## Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Clerk Webhooks Not Working
1. Use ngrok/localtunnel for local development
2. Check webhook signing secret matches `.env`
3. Verify events are subscribed in Clerk dashboard

### File Upload Fails
1. Ensure `uploads/` directory exists
2. Check file size limits (10GB max)
3. Verify file extension is in allowed list

### Database Locked
```bash
# Stop all dev servers
# Delete lock files
rm prisma/dev.db-shm prisma/dev.db-wal
```

## Production Deployment

### Recommended Stack:
- **Hosting**: Vercel / Railway / Fly.io
- **Database**: PlanetScale (MySQL) or Neon (PostgreSQL)
- **File Storage**: AWS S3 / Cloudflare R2
- **Auth**: Clerk (already configured)

### Environment Setup:
1. Update `DATABASE_URL` to production database
2. Add Clerk production keys
3. Configure file storage (replace local filesystem)
4. Set up webhook endpoint

## API Example Usage

### List Datasets
```bash
curl http://localhost:3000/api/datasets?limit=10&search=mnist
```

### Upload File
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -F "files=@model_weights.pt"
```

### Create Dataset
```bash
curl -X POST http://localhost:3000/api/datasets \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MNIST Training Data",
    "description": "60k training images",
    "tensors": [{
      "fileName": "1234567-abc-train.pt",
      "shape": [60000, 28, 28],
      "dtype": "float32",
      "dimensions": [
        {"index": 0, "size": 60000, "name": "samples", "description": "Training samples"},
        {"index": 1, "size": 28, "name": "height", "description": "Image height"},
        {"index": 2, "size": 28, "name": "width", "description": "Image width"}
      ]
    }]
  }'
```

## Contributing

This is a proof-of-concept. To contribute:
1. Complete the upload and detail pages
2. Add tensor parsing/validation
3. Implement visualization components
4. Add tests

## License

MIT
