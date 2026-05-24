# AssessForge — System Architecture & Workflow

AssessForge is built on an asynchronous, queue-driven event-loop architecture. This document explains how the data pipelines, database models, background queues, and real-time WebSocket channels coordinate.

---

## 📡 End-to-End System Workflow

This diagram illustrates how a user request flows through the asynchronous queue to the database and streams progress updates back to the browser:

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Educator (Next.js)
    participant Gateway as Express API
    participant DB as MongoDB Atlas
    participant Queue as BullMQ (Redis)
    participant Worker as Background Worker
    participant LLM as Mistral AI
    participant WS as Socket.io Server

    Teacher->>Gateway: POST /api/assignments (Payload + Reference File)
    activate Gateway
    Gateway->>DB: Save Assignment (Status: "PENDING")
    Gateway->>Queue: Enqueue Generation Job
    Gateway-->>Teacher: Respond instantly { assignmentId, jobId }
    deactivate Gateway

    Teacher->>WS: Connect & Join Room (assignmentId)
    
    Queue->>Worker: Pick up Generation Job
    activate Worker
    Worker->>WS: Emit "status:update" (PROCESSING, 15%)
    WS-->>Teacher: Stream Progress Update
    
    Worker->>DB: Fetch reference Upload details
    DB-->>Worker: Return parsed document buffer
    
    Worker->>WS: Emit "status:update" (GENERATING_PAPER, 60%)
    WS-->>Teacher: Stream Progress Update
    
    Worker->>LLM: Send structured System/User Prompt with JSON Schema & tokens limit
    LLM-->>Worker: Return raw JSON completion string
    
    Worker->>DB: Update Assignment (Status: "COMPLETED", generatedPaper: parsed JSON)
    Worker->>WS: Emit "status:update" (COMPLETED, 100%, paper data)
    WS-->>Teacher: Transition UI & Render Question Sheet
    deactivate Worker
```

---

## 🛡️ Key Technical Design Patterns

### 1. Asynchronous Task Delegation
Generative requests can take several seconds. To prevent Express server blocks, incoming requests are queued immediately to **BullMQ** using **Upstash Redis** as the persistence layer. A background worker processes jobs sequentially, leaving the main HTTP thread free to handle lighter requests.

### 2. Live State Broadcasting (WebSockets)
Socket.io coordinates real-time status updates between the backend worker and the Next.js client. Rather than relying on heavy HTTP polling, the frontend subscribes to an isolated room (`assignmentId`) to receive progress percentage updates natively.

### 3. Fault-Tolerant JSON Parsing & Auto-Repair
LLMs on free tiers are prone to network timeouts or early truncation. We mitigate this on the backend by running raw completions through **`jsonrepair`** before parsing, enabling the system to reconstruct incomplete strings and brackets without crashing.

### 4. Dynamic CSS Print Compilation
To avoid rendering heavy canvas PDFs, we utilize standard browser rendering. By overriding structural layout elements (`html`, `body`, `main`, `div`) directly in the CSS print viewport, the browser's native `window.print()` engine can output clean, centered, and scaled A4 documents.