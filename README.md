
# mern-task-distribution


This repository implements a MERN-stack assignment: an admin-authenticated app where an admin can create agents, upload CSV/XLSX contact lists, and distribute those items equally among exactly 5 agents (floor split + sequential remainder). Assignments are stored in MongoDB and shown in the frontend.

## Quick overview
- Backend: Node.js + Express + Mongoose
- Frontend: React (single-page app)
- Auth: JWT (bcrypt for password hashing)
- Upload/parsing: multer + csv-parser + xlsx
- Distribution rule: use exactly 5 agents; compute base = floor(total/5) and distribute the remainder (+1) to the first (remainder) agents in order.

## Prerequisites
- Node.js (v16+ recommended) and npm
- MongoDB (local or remote)
- Windows commands below assume `cmd.exe`. For PowerShell, adapt the `set` syntax accordingly.

## Project structure (important paths)
- `backend/` — Express server, controllers, models, routes, helper scripts
  - `controllers/taskController.js` — upload & distribution logic
  - `controllers/authController.js` — login and token generation
  - `models/Agent.js`, `models/User.js`, `models/Task.js`
  - `scripts/` — helper scripts (clear_tasks.js, check_distribution.js, migrateAgentPhoneToMobile.js, smoke_test_distribution.js, clear_specific_tasks.js)
- `frontend/` — React app (Login, Agents, Upload, TaskList)
- `sample-tasks.csv` — example CSV (root)

## Backend configuration
Create a `.env` file in `backend/` with at least:

```
MONGO_URI=mongodb://127.0.0.1:27017/mern-assignment
JWT_SECRET=change_this_dev_secret
PORT=5000
NODE_ENV=development
```

Use a secure `JWT_SECRET` in production.

## Install and run — Backend
Open a cmd terminal and run (from your project folder). Example using the current folder name on this machine:

```cmd
cd C:\Users\hp\Desktop\MERN-Agent-Task-Distributor-\backend
npm install
npm start
```

Notes:
- The server will log the port it is listening on. If port 5000 is busy it will try the next free port (5001, 5002, ...).
- In development, the server may seed a default admin and dummy agents to ensure you have at least 5 agents for testing.

## Install and run — Frontend
Open another cmd terminal and run (from your project folder). Example:

```cmd
cd C:\Users\hp\Desktop\MERN-Agent-Task-Distributor-\frontend
npm install
npm start
```

If your backend runs on a non-default port (for example `5001`), start the frontend with an explicit API base URL:

```cmd
set "REACT_APP_API_BASE=http://localhost:5001/api" && npm start
```

## Default development admin (if seeded)
- Email: `admin@example.com`
- Password: `123456`

If an admin is missing, create one via the included CLI helper (example path below):

```cmd
cd C:\Users\hp\Desktop\MERN-Agent-Task-Distributor-\backend
node create_admin_cli.js admin@example.com 123456 "Admin Name"
```

Or use the dev-only HTTP endpoint (only available in development mode):
POST `/api/debug/create-admin` with JSON body `{ email, password, name }`.

## Upload endpoint & expected input
- Endpoint: `POST /api/tasks/upload` (admin only — include Authorization: Bearer <token>)
- Form field: `file` (multipart/form-data)
- Accepted file types: `.csv`, `.xls`, `.xlsx`
- Required CSV columns: `FirstName` and `Phone` (case-insensitive). Additional columns are allowed and stored in `notes` when present.

Behavior:
- The server requires that at least 5 agents exist in the database. If fewer exist, uploads are rejected with a 400 error.
- Exactly 5 agents are used for distribution (the server selects the first 5 agents, ordered by `_id`).
- Distribution algorithm:
  - Let N = total rows.
  - base = Math.floor(N / 5).
  - remainder = N % 5.
  - Each of the 5 agents receives `base` items, and the first `remainder` agents receive one additional item each (sequentially).
- Each assigned item is saved as a `Task` document with an `agent` reference.

## Viewing distribution
- Endpoint: `GET /api/tasks/distributed` — returns an array of 5 groups: `{ agent: { _id, name, email, mobile }, tasks: [ ... ] }`.
- Frontend TaskList consumes that response to show each agent and their assigned tasks.

## Helpful scripts (in `backend/scripts`)
- `clear_tasks.js` — delete ALL Task documents (use with caution)
- `clear_specific_tasks.js` — delete specific matching tasks (script contains examples)
- `migrateAgentPhoneToMobile.js` — copy legacy `phone` → `mobile` on Agent documents
- `check_distribution.js` — print counts and a sample task for the first 5 agents (handy to verify distribution after upload)
- `smoke_test_distribution.js` — programmatically logs in as admin, uploads `sample-tasks.csv`, and prints distribution summaries

Example: run the distribution check

```cmd
cd C:\Users\hp\Desktop\MERN-Agent-Task-Distributor-\backend
node scripts/check_distribution.js
```

## Manual verification example (25 items)
1. Ensure 5 agents exist (create via frontend or via CLI).
2. Upload a CSV with 25 rows (use `sample-tasks.csv` or your CSV).
3. Check results in frontend Tasks page, or run the check script. Expected: each of the 5 agents gets 5 tasks.

## Troubleshooting
- "Invalid Credentials": ensure the admin account exists, the email is lowercased, and the password is correct. Use `create_admin_cli.js` to create or reset an admin.
- "No file uploaded" / "Unexpected end of form": ensure the request is multipart/form-data and the field name is `file`.
- "Less than 5 agents": create agents before uploading.
- If you see `Cannot read properties of undefined` errors in file processing, double-check the CSV column names and that `FirstName` and `Phone` exist.

- Folder rename note: If you renamed the project folder (for example from `mern-assignment` to another name), update any terminal examples in this README and when starting the frontend, ensure the frontend knows the backend API base URL. You can set it when starting the frontend:

```cmd
set "REACT_APP_API_BASE=http://localhost:5000/api" && npm start
```

Replace the URL/port if your backend runs elsewhere.

## Production checklist
- Remove dev-only routes and seeding before production builds
- Use a strong `JWT_SECRET` and HTTPS
- Add rate-limiting and input validation for production readiness

## Extras — options I can implement next
- Add a dev endpoint that generates N sample tasks and automatically distributes them for easier testing
- Add an `npm` script that runs the smoke test end-to-end
- Harden error messages and add more unit tests

Tell me which extra you'd like and I will implement it next.
