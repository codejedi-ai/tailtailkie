# TensorStore

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748.svg)

**Kaggle for Tensors - The Next Evolution of Programming**

*Pioneering Tensor-Oriented Programming: Where OOP meets the vector-first world of brain-inspired AI*

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 What is TensorStore?

**TensorStore** (Kaggle for Tensors) is more than a dataset platform - it's the foundation of a new programming paradigm.

### 🚀 The Next Evolution: Tensor-Oriented Programming

With the explosive growth of brain-inspired AI models, neural embeddings, and vector representations, we're witnessing a fundamental shift:

```
Object-Oriented Programming → Tensor-Oriented Programming
         (OOP)                           (TOP)
```

**Why this shift matters:**
- **Neural computation everywhere** - Brain-inspired models have made vector representations ubiquitous
- **Everything is encoded** - Text, images, audio, video - all represented as tensors
- **Vector databases** - The new standard for data storage and retrieval
- **Embeddings as APIs** - Neural networks consume and produce tensors, not strings

TensorStore is purpose-built for this tensor-first world. Unlike traditional platforms dealing with CSV files and unstructured data, **TensorStore only accepts pure tensor formats** that are ready for neural networks.

### Why TensorStore?

- **No Data Engineering Required** - Datasets are already in tensor format (.pt, .npy, .safetensors, .h5)
- **Semantic Dimension Annotations** - Each dimension is labeled (batch, channels, height, width, embeddings)
- **Training-Ready** - Load and start training immediately with PyTorch, TensorFlow, or NumPy
- **Vector-First** - Embeddings and encodings are first-class citizens, not afterthoughts
- **Paradigm Aligned** - Built for the age of brain-inspired AI and neural representation learning

## ✨ Features

### 🔹 Tensor-Only Platform
- Upload `.pt` / `.pth` (PyTorch)
- Upload `.npy` / `.npz` (NumPy)
- Upload `.safetensors` (Hugging Face)
- Upload `.h5` / `.hdf5` (HDF5)

### 🔹 Semantic Annotations
Every dimension in every tensor is annotated with:
- **Name** - What it represents (e.g., "batch", "channels", "height")
- **Size** - Dimension size (e.g., 128, 256, 3)
- **Description** - Detailed explanation of what the dimension contains

### 🔹 Dataset Management
- Create datasets with multiple tensor files
- Add descriptions and tags
- Public/private visibility
- Search and filter by format, tags, or keywords
- Download tracking and statistics

### 🔹 Modern Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma ORM** - Type-safe database queries
- **Clerk Auth** - User authentication and management
- **Tailwind CSS** - Cyberpunk-themed UI
- **SQLite** - Development database (production-ready for PostgreSQL/MySQL)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/codejedi-ai/Kaggle-For-Tensors.git
cd Kaggle-For-Tensors

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Clerk keys

# Initialize database
npx prisma db push

# Create uploads directory
mkdir uploads

# Start development server
pnpm dev
```

Visit http://localhost:3000

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## 📖 Usage

### Upload a Dataset

1. **Sign up** at http://localhost:3000
2. Click **"Upload Dataset"**
3. Fill in dataset information:
   - Name and description
   - Tags (optional)
   - Public/private visibility

4. **Upload tensor files**
5. For each tensor, specify:
   - **Shape**: Comma-separated dimensions (e.g., `60000, 28, 28`)
   - **Data type**: float32, int64, etc.
   - **Dimension annotations**:
     - Axis 0: "batch" - "Number of training samples"
     - Axis 1: "height" - "Image height in pixels"
     - Axis 2: "width" - "Image width in pixels"

6. Click **"Create Dataset"**

### Example: MNIST Dataset

```python
import torch

# Create MNIST-like tensor
data = torch.randn(60000, 28, 28)
torch.save(data, 'mnist_train.pt')
```

Upload with annotations:
- Shape: `60000, 28, 28`
- dtype: `float32`
- Dimensions:
  - **Axis 0** (60000): "samples" - "Training samples"
  - **Axis 1** (28): "height" - "Image height"
  - **Axis 2** (28): "width" - "Image width"

### Download a Dataset

Datasets can be downloaded in two ways:
- **Single tensor**: Direct file download
- **Multiple tensors**: ZIP archive with `metadata.json`

The metadata file includes:
```json
{
  "name": "MNIST Training Set",
  "description": "60,000 handwritten digit images",
  "format": "pt",
  "tensors": [
    {
      "fileName": "mnist_train.pt",
      "shape": [60000, 28, 28],
      "dtype": "float32"
    }
  ],
  "created": "2025-01-15T10:00:00Z"
}
```

## 🏗️ Architecture

### Project Structure

```
app/
├── api/
│   ├── datasets/          # Dataset CRUD operations
│   ├── upload/            # File upload endpoint
│   └── webhooks/          # Clerk user sync
├── datasets/
│   ├── page.tsx           # Browse datasets
│   └── [id]/
│       └── page.tsx       # Dataset detail page
├── upload/
│   └── page.tsx           # Upload form
├── sign-in/               # Authentication pages
├── sign-up/
└── page.tsx               # Homepage

lib/
├── prisma.ts              # Database client
├── types.ts               # Zod schemas
├── upload.ts              # File utilities
└── utils.ts               # Helper functions

prisma/
└── schema.prisma          # Database schema
```

### Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  username  String?
  datasets  Dataset[]
  downloads Download[]
}

model Dataset {
  id            String   @id @default(cuid())
  name          String
  description   String?
  fileFormat    String
  totalSize     Int
  isPublic      Boolean  @default(true)
  downloadCount Int      @default(0)
  viewCount     Int      @default(0)
  tensors       Tensor[]
  user          User     @relation(...)
}

model Tensor {
  id         String      @id @default(cuid())
  fileName   String
  shape      String      // JSON: [128, 256, 3]
  dtype      String      // "float32", "int64"
  dimensions Dimension[]
  dataset    Dataset     @relation(...)
}

model Dimension {
  index       Int
  size        Int
  name        String      // "batch", "channels", "height"
  description String?     // Detailed explanation
  tensor      Tensor      @relation(...)
}
```

## 🔌 API Reference

### Datasets

#### List Datasets
```http
GET /api/datasets?search=mnist&format=pt&limit=20&offset=0
```

#### Get Dataset
```http
GET /api/datasets/:id
```

#### Create Dataset
```http
POST /api/datasets
Content-Type: application/json

{
  "name": "MNIST Training",
  "description": "60k images",
  "tags": ["vision", "classification"],
  "isPublic": true,
  "tensors": [
    {
      "fileName": "1234-mnist.pt",
      "shape": [60000, 28, 28],
      "dtype": "float32",
      "dimensions": [
        {"index": 0, "size": 60000, "name": "batch", "description": "Training samples"},
        {"index": 1, "size": 28, "name": "height", "description": "Image height"},
        {"index": 2, "size": 28, "name": "width", "description": "Image width"}
      ]
    }
  ]
}
```

#### Update Dataset
```http
PUT /api/datasets/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "New description",
  "isPublic": false
}
```

#### Delete Dataset
```http
DELETE /api/datasets/:id
```

#### Download Dataset
```http
GET /api/datasets/:id/download
```

### File Upload

```http
POST /api/upload
Content-Type: multipart/form-data

files: [File, File, ...]
```

## 🎨 UI Components

### Cyberpunk Theme
The platform features a cyberpunk-inspired design with:
- Neon blue, pink, purple, and green accents
- Gradient text effects
- Glowing borders and shadows
- Dark mode optimized

### Custom Components
- Dataset cards with tensor metadata
- Dimension annotation interface
- Shape visualization
- File upload with drag & drop
- Search and filter controls

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Database
npx prisma studio     # Open database GUI
npx prisma db push    # Sync schema to database
npx prisma generate   # Generate Prisma client

# Linting
pnpm lint             # Run ESLint
```

### Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14.2 |
| Language | TypeScript 5.9 |
| Database | Prisma + SQLite |
| Auth | Clerk |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Forms | Zod validation |
| File Upload | FormData API |
| File Compression | archiver |

## 🧪 Testing

Create test tensors:

```python
import torch
import numpy as np

# PyTorch tensor
data = torch.randn(100, 224, 224, 3)
torch.save(data, 'test_images.pt')

# NumPy array
arr = np.random.rand(1000, 512).astype(np.float32)
np.save('test_embeddings.npy', arr)
```

Then upload via the UI or API.

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Update Clerk webhook URL to production domain
```

### Database Migration

For production, migrate from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in `.env`
2. Change `provider` in `schema.prisma` to `postgresql`
3. Run `npx prisma db push`

### File Storage

For production, replace local file storage with:
- **AWS S3** - Scalable object storage
- **Cloudflare R2** - S3-compatible, no egress fees
- **Vercel Blob** - Integrated with Vercel

Update `lib/upload.ts` to use cloud storage SDK.

## 📝 Contributing

Contributions are welcome! Areas for improvement:

1. **Tensor Parsing** - Auto-extract shape/dtype from uploaded files
2. **Visualization** - 2D heatmaps, 3D plots for tensors
3. **Validation** - Verify tensor integrity on upload
4. **Search** - Advanced filtering by shape, dtype, size
5. **API Client** - Python/JS libraries for programmatic access
6. **Competitions** - Kaggle-style challenges with tensors
7. **Leaderboards** - Track best models on datasets

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Authentication by [Clerk](https://clerk.com)
- Database ORM by [Prisma](https://prisma.io)
- UI components from [Radix UI](https://radix-ui.com)
- Inspired by [Kaggle](https://kaggle.com) and [Hugging Face Datasets](https://huggingface.co/datasets)

## 📞 Support

- **Documentation**: See `SETUP_GUIDE.md` and `QUICKSTART.md`
- **Issues**: [GitHub Issues](https://github.com/codejedi-ai/Kaggle-For-Tensors/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codejedi-ai/Kaggle-For-Tensors/discussions)

---

<div align="center">

**Made with ❤️ for the ML community**

[⬆ Back to Top](#kaggle-for-tensors)

</div>
