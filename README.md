# AssessForge — AI Assessment Creator

AssessForge is a decoupled, asynchronous, full-stack academic evaluation builder. It allows educators to design, configure, generate, and print CBSE/NCERT-aligned examination papers and suggested solutions on-the-fly, backed by a persistent student classroom dispatcher and live progress feeds.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js (App Router), Tailwind CSS v4 (CSS-first configuration engine), Zustand (fluid global client-state manager), Socket.io-client.
- **Backend:** Node.js, Express, Socket.io, BullMQ (Redis-backed asynchronous queue manager), Mongoose/MongoDB, Multer (in-memory file-buffer ingestion).
- **AI Completion:** Mistral AI (using `mistral-large-latest` with native JSON mode and self-repair parsing pipelines).

---

## 🚀 Core Features

1. **State-Driven Exam Templating:** Toggle dynamically between "Assignments" (worksheets) and "Exam Papers," updating database payloads and printed headers on-the-fly.
2. **Dynamic MCQ & Inline SVG Generators:** Structured options are parsed cleanly. Visual question types include responsive vector SVG diagrams generated dynamically by the AI.
3. **Resilient Asynchronous Pipeline:** Heavy generative tasks are offloaded to background threads. Socket.io streams live progress updates (e.g., `PARSING_FILE`, `GENERATING_PAPER`) back to the frontend.
4. **Self-Repairing JSON Parsers:** Integrates `jsonrepair` on the backend to reconstruct unclosed brackets or strings if free-tier limits cause early truncation.
5. **Classroom Group Management:** Manage student rosters, import student profiles from CSV files, and dispatch completed exam sheets to specific sections.
6. **Pixel-Perfect Media-Print Rules:** Implements custom print stylesheet rules to cleanly hide UI chrome and output styled, A4-scaled examination PDF papers.

---

## ⚙️ Step-by-Step Local Setup Guide

### 1. Backend Server Setup
Navigate into the server workspace, install dependencies, and define configurations:
```bash
cd vedaassess-server
npm install
```

Create a `.env` file inside `vedaassess-server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/assessforge?retryWrites=true&w=majority
REDIS_URL=rediss://default:yourpassword@your-endpoint.upstash.io:6379
MISTRAL_API_KEY=your_actual_mistral_api_key
MISTRAL_MODEL=mistral-large-latest
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Client Setup
Navigate into the client workspace, install dependencies, and define endpoints:
```bash
cd vedaassess-client
npm install
```

Create a `.env.local` file inside `vedaassess-client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser to evaluate the application.