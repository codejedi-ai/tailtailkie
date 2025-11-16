# Kaggle for Tensors - Quick Start Guide

## 🎉 Your Platform is Ready!

All core features have been implemented. Here's how to get started:

## ✅ What's Completed

1. **Database Schema** - SQLite with Prisma ORM
2. **Authentication** - Clerk integration (keys already configured)
3. **File Upload System** - Supports .pt, .npy, .safetensors, .h5
4. **Dataset Management** - Full CRUD operations
5. **Upload Form** - With tensor shape and dimension annotation
6. **Dataset Detail Page** - With visualization and download
7. **Browse Page** - Search and filter datasets
8. **Download System** - Single file or ZIP with metadata

## 🚀 Start the Application

```bash
# Make sure you're in the project directory
cd C:\Users\darcy\repos\Kaggle-For-Tensors

# Start the development server
pnpm dev
```

Then open your browser to: http://localhost:3000

## 🔐 Clerk Setup (Final Step)

Your Clerk keys are already in `.env`. You need to set up the webhook:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "Webhooks" in the left sidebar
4. Click "Add Endpoint"
5. For local development:
   - Use ngrok: `ngrok http 3000`
   - Or use Clerk's test mode (users won't persist between restarts)
6. Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
7. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
8. Copy the Signing Secret
9. Add to `.env`: `CLERK_WEBHOOK_SECRET=whsec_...`

**For quick testing without webhook:**
- You can skip the webhook for now
- Sign up will work, but users won't sync to the database
- Upload/download features require webhook to be set up

## 📝 User Flow

### 1. Sign Up
1. Visit http://localhost:3000
2. Click "Get Started"
3. Create an account

### 2. Upload a Dataset
1. Click "Upload Dataset"
2. Fill in dataset name and description
3. Add tags (optional)
4. Upload tensor files (.pt, .npy, .safetensors, .h5)
5. For each file:
   - Enter shape: `60000, 28, 28`
   - Select data type: `float32`
   - Annotate dimensions:
     - Axis 0: "batch" - "Number of samples"
     - Axis 1: "height" - "Image height in pixels"
     - Axis 2: "width" - "Image width in pixels"
6. Click "Create Dataset"

### 3. Browse Datasets
1. Click "Browse Datasets" from homepage
2. Search by name or description
3. Filter by file format (.pt, .npy, etc.)
4. Click on any dataset to view details

### 4. Download a Dataset
1. Open any dataset detail page
2. Click "Download Dataset"
3. Single file: direct download
4. Multiple files: downloads as ZIP with metadata.json

## 📁 Project Structure

```
app/
├── page.tsx                  # Homepage with recent datasets
├── upload/
│   └── page.tsx              # Upload form with dimension annotation
├── datasets/
│   ├── page.tsx              # Browse all datasets
│   └── [id]/
│       └── page.tsx          # Dataset detail page
├── sign-in/                  # Clerk sign-in
├── sign-up/                  # Clerk sign-up
└── api/
    ├── datasets/
    │   ├── route.ts          # List & create datasets
    │   └── [id]/
    │       ├── route.ts      # Get, update, delete
    │       └── download/     # Download dataset
    ├── upload/               # Upload tensor files
    └── webhooks/clerk/       # User sync
```

## 🗄️ Database Management

View and edit your database:

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555

## 🧪 Testing the Platform

### Test Case 1: Upload a PyTorch Tensor

Create a sample tensor file:

```python
import torch
import numpy as np

# Create sample MNIST-like data
data = torch.randn(60000, 28, 28)
torch.save(data, 'mnist_train.pt')

print(f"Created tensor with shape: {data.shape}")
print(f"Data type: {data.dtype}")
```

Then upload via the UI with annotations:
- Shape: `60000, 28, 28`
- dtype: `float32`
- Dimensions:
  - 0: batch (60,000 training samples)
  - 1: height (28 pixels)
  - 2: width (28 pixels)

### Test Case 2: Upload NumPy Array

```python
import numpy as np

# Create RGB image batch
images = np.random.rand(100, 224, 224, 3).astype(np.float32)
np.save('imagenet_batch.npy', images)

print(f"Shape: {images.shape}")
print(f"dtype: {images.dtype}")
```

Upload with:
- Shape: `100, 224, 224, 3`
- dtype: `float32`
- Dimensions:
  - 0: batch (100 images)
  - 1: height (224 pixels)
  - 2: width (224 pixels)
  - 3: channels (RGB)

## 🎨 Key Features

### Semantic Dimension Annotation
Unlike traditional dataset platforms, every tensor dimension has:
- **Name**: What the dimension represents (batch, channels, height, etc.)
- **Description**: Detailed explanation
- **Size**: Actual dimension size

### Supported Formats
- `.pt`, `.pth` - PyTorch tensors
- `.npy`, `.npz` - NumPy arrays
- `.safetensors` - Hugging Face SafeTensors
- `.h5`, `.hdf5` - HDF5 format

### Download with Metadata
Downloads include a `metadata.json` file:

```json
{
  "name": "MNIST Training Set",
  "description": "60,000 training images",
  "format": "pt",
  "tensors": [
    {
      "fileName": "mnist_train.pt",
      "shape": [60000, 28, 28],
      "dtype": "float32"
    }
  ],
  "created": "2025-01-15T12:00:00Z"
}
```

## 🐛 Troubleshooting

### "Database not found"
```bash
npx prisma db push
```

### "Clerk keys not found"
Check `.env` has:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### "Upload directory not found"
```bash
mkdir uploads
```

### "Cannot create dataset - user not found"
This means the Clerk webhook isn't working. Either:
1. Set up the webhook (see above)
2. Or manually add user to database via Prisma Studio

### TypeScript errors
```bash
pnpm install
npx prisma generate
```

## 🚀 Production Deployment

### 1. Update Environment Variables

```env
DATABASE_URL="postgresql://..." # Use PostgreSQL/MySQL
CLERK_WEBHOOK_SECRET="whsec_..." # Production webhook secret
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 3. Configure Storage

Replace local file storage with S3/R2:
- Update `lib/upload.ts`
- Use AWS SDK or Cloudflare R2
- Update file paths in database

### 4. Set up Webhooks

Update Clerk webhook URL to production domain:
- `https://yourdomain.com/api/webhooks/clerk`

## 📊 Database Schema

### User
- Synced from Clerk
- Has many: datasets, downloads

### Dataset
- name, description, tags
- totalSize, fileFormat, isPublic
- Has many: tensors

### Tensor
- fileName, filePath, fileSize
- shape (JSON array), dtype
- Has many: dimensions

### Dimension
- index, size, name, description
- Belongs to: tensor

## 🎯 Next Steps

1. **Start the dev server**: `pnpm dev`
2. **Sign up** at http://localhost:3000
3. **Upload a test dataset**
4. **Browse and download** datasets

## 💡 Tips

- Use descriptive dimension names (batch, channels, height, width, etc.)
- Add detailed descriptions to help users understand your data
- Tag datasets with relevant keywords (vision, nlp, audio, etc.)
- Keep tensor files under 10GB for best performance

## 📚 Documentation

- Full setup guide: `SETUP_GUIDE.md`
- Prisma docs: https://prisma.io/docs
- Clerk docs: https://clerk.com/docs
- Next.js docs: https://nextjs.org/docs

## 🤝 Support

If you encounter issues:
1. Check `SETUP_GUIDE.md` for detailed troubleshooting
2. View database in Prisma Studio: `npx prisma studio`
3. Check server logs in terminal
4. Verify all environment variables are set

---

**You're all set! Start uploading tensor datasets!** 🚀
