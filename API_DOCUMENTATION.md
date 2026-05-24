# AssessForge — REST API Documentation

This document outlines the API contracts for the AssessForge backend, including paths, payloads, and response structures.

---

## 1. Assignments Resource (`/api/assignments`)

### POST `/api/assignments`
Ingests dynamic paper configurations, saves uploaded reference materials to MongoDB as binary buffers, and enqueues the generation job.

- **Request Type:** `multipart/form-data`
- **Body Parameters:**
  - `assignmentType`: `"ASSIGNMENT"` | `"EXAM"`
  - `academicYear`: String (e.g. `"2026-2027"`)
  - `classLevel`: String (e.g. `"Class 12th"`)
  - `subjectName`: String (e.g. `"Computer Science"`)
  - `totalQuestions`: Number (e.g. `10`)
  - `totalMarks`: Number (e.g. `50`)
  - `configs`: Stringified JSON Array of question types
  - `additionalInstructions`: String (Optional)
  - `file`: Binary file upload (Optional, `.pdf` or `.txt` limits: 10MB)
  - **If Assignment Type is ASSIGNMENT:**
    - `assignmentTitle`: String (e.g. `"Worksheet on OOP"`)
    - `dueDate`: Date (e.g. `"2026-06-25"`)
  - **If Assignment Type is EXAM:**
    - `examDate`: Date (e.g. `"2026-06-30"`)
    - `examTiming`: String (e.g. `"09:00 AM - 12:00 PM"`)

- **Response (201 Created):**
  ```json
  {
    "success": true,
    "assignmentId": "6a11e83a4afd9d14bc2dda1a",
    "jobId": "14"
  }
  ```

---

### POST `/api/assignments/parse-preview`
Ingests a file in-memory and immediately returns the extracted raw text.

- **Request Type:** `multipart/form-data`
- **Body Parameters:**
  - `file`: Binary file upload
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "filename": "syllabus.txt",
    "extractedText": "Extracted text content from the file..."
  }
  ```

---

### GET `/api/assignments/dashboard-metrics`
Aggregates and returns active system statistics from MongoDB.

- **Response (200 OK):**
  ```json
  {
    "totalCreated": 3,
    "assignmentsCount": 2,
    "examsCount": 1,
    "totalStudents": 25,
    "totalGroups": 1,
    "recentActivity": [
      {
        "_id": "6a11e83a4afd9d14bc2dda1a",
        "assignmentType": "EXAM",
        "subjectName": "Computer Science",
        "classLevel": "Class 12th",
        "totalQuestions": 10,
        "totalMarks": 50,
        "createdAt": "2026-05-24T12:00:00.000Z"
      }
    ]
  }
  ```

---

## 2. Classroom Groups Resource (`/api/class-groups`)

### GET `/api/class-groups`
Lists all active classroom groups, populating details from assigned papers.

- **Response (200 OK):**
  ```json
  [
    {
      "_id": "6a11e83a4afd9d14bc2dda1b",
      "name": "Class 12 - Section A",
      "grade": "Grade 12",
      "subject": "Computer Science",
      "students": [
        { "rollNo": "01", "name": "Alice Smith", "email": "alice@school.edu" }
      ],
      "dispatches": []
    }
  ]
  ```

---

### POST `/api/class-groups/:id/students`
Appends student profiles directly to a classroom group.

- **Request Type:** `application/json`
- **Body Parameters:**
  ```json
  {
    "studentsList": [
      { "rollNo": "02", "name": "Bob Jones", "email": "bob@school.edu" }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "group": {
      "_id": "6a11e83a4afd9d14bc2dda1b",
      "name": "Class 12 - Section A",
      "students": [
        { "rollNo": "01", "name": "Alice Smith", "email": "alice@school.edu" },
        { "rollNo": "02", "name": "Bob Jones", "email": "bob@school.edu" }
      ]
    }
  }
  ```