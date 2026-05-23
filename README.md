# AssessForge — AI Assessment Creator

AssessForge is an asynchronous AI assessment drafting system built for the VedaAI ecosystem. It allows educators to design, configure, generate, and print structured academic exam papers utilizing standard question-type matrices and file-reference ingestion.

---

## 🚀 Key Engineering & Technical Decisions

### 1. Persistent Node Backend vs Serverless Deployment (Vercel)
Vercel is ideal for serving static frontend next.js bundles but strictly limits persistent WebSocket connections and enforces execution timeouts on serverless routes. To ensure stable background workflows, AssessForge is architected with a decoupled model:
- **Frontend (Vercel):** Next.js App Router providing high-fidelity visual representations.
- **Backend (Persistent VM - Render/Railway):** Standard Express.js server holding persistent Socket.io channels and active background worker processing threads.

### 2. File Ingestion directly into MongoDB Binary Buffers
To prevent file-loss issues on container restarts, files are captured in memory via **Multer memory storage** on incoming POST API routes. The raw byte streams are then saved to a dedicated MongoDB collection as binary buffers before enqueuing background tasks to Redis. This keeps file ingestion robust, secure, and fully persistent across scale events.

### 3. Asynchronous Queue Processing (BullMQ + Redis)
AI generation can take up to 20 seconds depending on model latency. To protect the API event loop, incoming requests are queued immediately to **BullMQ** and backed by serverless Redis (**Upstash**). An isolated background worker processes document parsing and LLM calls sequentially, preventing API server freezes.

### 4. Tailwind CSS v4 CSS-First Configuration
This application utilizes **Tailwind CSS v4**'s configuration pattern. Instead of using a traditional `tailwind.config.js` file, all custom colors, typography tokens, fonts, and box shadows are defined directly inside `src/app/globals.css` using the `@theme` directive, keeping styling modular and highly aligned with your Figma values.

---

## 🛠️ Step-by-Step Local Setup Guide

### System Requirements
- Node.js (v18 or higher)
- Free MongoDB Atlas Cluster
- Free Upstash Redis Instance
- Mistral AI Console API Key

---

### Step A: Decoupled Server Setup (Backend)

1. Open your terminal, navigate inside the server directory, and install the required dependencies:
   ```bash
   cd vedaassess-server
   npm install