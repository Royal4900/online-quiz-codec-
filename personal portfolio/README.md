# Personal Portfolio Website (Full-Stack)

A responsive, mobile-first portfolio built with **HTML**, **CSS**, **JavaScript**, **Node.js (Express)**, and **MongoDB**.

## Features

- ✅ Fully responsive, mobile-first UI
- ✅ Backend-driven dynamic content (profile, projects, skills)
- ✅ RESTful APIs for portfolio data
- ✅ Contact form with backend validation and database storage
- ✅ Email integration (Nodemailer)
- ✅ Secure environment variable configuration
- ✅ Layered/MVC architecture
- ✅ Production-ready deployment setup

## Tech Stack

| Layer    | Technology     |
|----------|----------------|
| Frontend | HTML, CSS, JS  |
| Backend  | Node.js, Express.js |
| Database | MongoDB        |

## Project Structure

```
├── public/           # Static frontend
│   ├── css/
│   ├── js/
│   └── index.html
├── server/
│   ├── config/       # DB connection
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Validation
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   ├── scripts/      # Seed script
│   ├── services/     # Email service
│   └── index.js      # Entry point
├── .env.example
└── package.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable       | Description                          |
|----------------|--------------------------------------|
| PORT           | Server port (default: 5000)          |
| MONGODB_URI    | MongoDB connection string            |
| EMAIL_HOST     | SMTP host (e.g. smtp.gmail.com)      |
| EMAIL_PORT     | SMTP port (587 for TLS)              |
| EMAIL_USER     | SMTP username                        |
| EMAIL_PASS     | SMTP password or app password        |
| CONTACT_EMAIL  | Where to receive contact form emails |

### 3. Run MongoDB

Ensure MongoDB is running locally or use a cloud URI (e.g. MongoDB Atlas).

### 4. Seed the database (optional)

```bash
npm run seed
```

### 5. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open [http://localhost:5000](http://localhost:5000).

## API Endpoints

| Method | Endpoint     | Description        |
|--------|--------------|--------------------|
| GET    | /api/profile | Get profile data   |
| GET    | /api/projects| Get projects       |
| GET    | /api/skills  | Get skills         |
| POST   | /api/contact | Submit contact form|

## Production Deployment

1. Set `NODE_ENV=production` in `.env`.
2. Use a process manager (e.g. PM2):
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name portfolio
   pm2 save && pm2 startup
   ```
3. Use a reverse proxy (Nginx/Apache) for SSL and static caching.
4. Keep `.env` secure and never commit it.

## License

MIT
