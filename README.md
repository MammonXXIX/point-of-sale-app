# Simple Point of Sale System

## 🛠 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Zustand (State Management)

### Backend & API

- tRPC
- Prisma

### Third-Party Services

- **Clerk** – Authentication
- **Supabase** – PostgreSQL Database & Storage
- **Xendit** – Payment Processing (QRIS)

### Others

- ESLint & Prettier
- Ngrok – for local webhook testing

## 🚀 Features

- Clerk Authentication
- Management Category & Product (CRUD)
- Upload Image (Pre-signed URL)
- Add To Cart using Zustand (Management State)
- Generate QRIS using Xendit
- Webhook for Xendit

## 📦 Installation

Follow these steps to get started:

### 1. Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) (LTS version recommended) and npm or Yarn installed.
- Clone this repository:

```bash
git clone https://github.com/MammonXXIX/Nextjs-Blog-App.git

cd FOLDER_NAME

npm install
```

### 2. Configure Environment Variables

This project requires several API credentials stored in a `.env` file.

1. Copy the `.env.example` file and rename it to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Fill in the `.env` variables with your own credentials:

    - **Clerk:**

        - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
        - `CLERK_SECRET_KEY`

    - **Supabase Database (Prisma):**

        - `DATABASE_URL` (connection pooler URL)
        - `DIRECT_URL` (direct connection URL)

    - **Supabase JS Client:**

        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `SUPABASE_ROLE_KEY` (service_role key — **KEEP THIS SECRET!**)

    - **Xendit:**

        - `XENDIT_MONEY_IN_KEY` (API Key from your Xendit dashboard under “Money In”)

    - **Supabase Storage:**
        - Create a public bucket named `product-images` (or match the bucket name used in `src/server/bucket.ts`) in the Supabase Storage dashboard

### 3. Sync the Database

After setting up your `.env` file, run the following command to push the schema to your Supabase database:

```bash
npm run db:push
```
