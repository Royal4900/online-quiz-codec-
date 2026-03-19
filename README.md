# Online Quiz System

A backend-intensive online quiz application built with **Node.js**, **Express.js**, **MySQL**, and vanilla **HTML/CSS/JavaScript**.

## Features

- **Server-controlled timed quizzes** – Time limits enforced on the server; late submissions are rejected
- **Secure question & answer storage** – Correct answers never exposed to the client until results
- **Score calculation & result persistence** – Scores stored in the database with full attempt history
- **Normalized database** – Relational design with proper constraints and foreign keys
- **Admin quiz management** – Create, edit, delete quizzes and add questions via Basic Auth
- **Error handling & validation** – Input validation and clear error responses

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your MySQL credentials:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_quiz_db
```

### 3. Initialize the database

Ensure MySQL is running, then:

```bash
npm run init-db
```

This creates the database, tables, and a default admin user:
- **Username:** `admin`
- **Password:** `admin123`

### 4. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Home** – View active quizzes and start one
- **Take Quiz** – Timer runs from server start; submit before time expires
- **Admin Panel** – Login and manage quizzes, add questions, toggle active status

## API

- `GET /api/quizzes` – List active quizzes
- `GET /api/quizzes/:id` – Get quiz with questions (answers without `is_correct`)
- `POST /api/quizzes/:id/start` – Start attempt, returns `attempt_id` and server time
- `POST /api/quizzes/:id/submit` – Submit answers; server validates time and calculates score

Admin endpoints require Basic Auth (`Authorization: Basic <base64(user:pass)>`):

- `GET/POST/PUT/DELETE /api/admin/quizzes`
- `POST /api/admin/quizzes/:quizId/questions`
- `GET /api/admin/quizzes/:id/results`
