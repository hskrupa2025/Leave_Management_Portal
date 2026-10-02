# Leave Management Portal

A web application for Exelon employees to request and track leave, and for administrators to review requests and manage employee records. Leave data and account records are stored in MongoDB through the Express API.

## Project Status

- **Live deployment:** Not deployed yet. No production frontend or API URL is configured in this repository.
- **Local frontend:** `http://localhost:5173`
- **Local API:** `http://localhost:5000/api`
- **Health check:** `http://localhost:5000/api/health`

## Features

- Employee registration with an `@exelon.com` email and role-based login.
- Admin login and tools for viewing employee balances and reviewing leave requests.
- Leave types: Casual Leave, Sick Leave, and Earned Leave.
- Employee leave application, status tracking, and follow-up history.
- Year calendar for the current and following year, including pending/approved leave.
- Annual limit of 30 requested or approved working days per employee.
- Admin approval/rejection of leave requests; approved leave is deducted from the matching balance.

## Architecture

React + Vite frontend
| Axios requests with JWT
v
Express REST API
| Mongoose
v
MongoDB Atlas

The frontend handles login, employee leave workflows, admin dashboards, and the leave calendar. The API validates authentication, leave dates, balances, and yearly limits. MongoDB stores users, leave requests, and company holidays.

## Tech Stack

- **Frontend:** React 19, Vite 8, React Router, Axios, Bootstrap 5
- **Backend:** Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcryptjs
- **Database:** MongoDB Atlas
- **Tests:** Node.js built-in test runner

Use Node.js 20.19+ or 22.12+ and npm.

## Local Setup

### 1. Configure and start the backend

Open a terminal in `backend` and install dependencies:

// powershell
npm install

Create `backend/.env`:

```dotenv
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>

# Optional DNS resolver list, comma-separated:
# MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

Start the API:

```powershell
npm run dev
```

The server connects to MongoDB, seeds its development admin account, and inserts the configured 2026/2027 holidays if that year's holiday collection is empty.

### 2. Configure and start the frontend

In a second terminal, open `frontend` and install dependencies:

```powershell
npm install
```

Create `frontend/.env` if the API is not at the default local address:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

### Production build

From `frontend`:

```powershell
npm run build
npm run preview
```

## Environment Variables

| Variable            | Application | Required      | Description                                                    |
| ------------------- | ----------- | ------------- | -------------------------------------------------------------- |
| `MONGO_URI`         | Backend     | Yes           | MongoDB Atlas connection string.                               |
| `JWT_SECRET`        | Backend     | Yes for login | Secret used to sign and verify JWTs.                           |
| `PORT`              | Backend     | No            | API port; defaults to `5000`.                                  |
| `MONGO_DNS_SERVERS` | Backend     | No            | Comma-separated DNS server addresses for Atlas SRV resolution. |
| `VITE_API_URL`      | Frontend    | No            | API base URL; defaults to `http://localhost:5000/api`.         |

Keep `.env` files out of source control. Do not use development credentials or weak JWT secrets in production.

## Development Login

On backend startup, the current seed logic creates or resets this administrator account:

- Email: `admin@exelongmail.com`
- Password: `Admin@123`

The password is reset by the seed logic each time the backend starts. This credential is for local development only. Change the seed behavior and use a secure administrator provisioning process before deployment.

Employee accounts can be created from the login page with an `@exelon.com` address and a password of at least 8 characters. Registration creates employee accounts only.

## API

All API routes use the `/api` prefix. Protected routes require `Authorization: Bearer <token>`.

### Health and authentication

| Method | Path                 | Access        | Purpose                                              |
| ------ | -------------------- | ------------- | ---------------------------------------------------- |
| `GET`  | `/api/health`        | Public        | API health check.                                    |
| `POST` | `/api/auth/register` | Public        | Register an employee (`name`, `email`, `password`).  |
| `POST` | `/api/auth/login`    | Public        | Sign in and receive a JWT and user role.             |
| `GET`  | `/api/auth/me`       | Authenticated | Get the signed-in user's profile and leave balances. |

### Employee leave routes

| Method | Path                             | Access                        | Purpose                                                                 |
| ------ | -------------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `POST` | `/api/leaves`                    | Authenticated                 | Submit a leave request (`leaveType`, `startDate`, `endDate`, `reason`). |
| `GET`  | `/api/leaves/my`                 | Authenticated                 | List the signed-in user's leave history.                                |
| `GET`  | `/api/leaves/holidays?year=2026` | Authenticated                 | List company holidays for a year.                                       |
| `GET`  | `/api/leaves/:id`                | Authenticated, owner or admin | Get one leave request.                                                  |

### Admin routes

All `/api/admin` routes require an authenticated administrator.

| Method   | Path                            | Purpose                                           |
| -------- | ------------------------------- | ------------------------------------------------- |
| `GET`    | `/api/admin/dashboard`          | Dashboard totals and recent requests.             |
| `GET`    | `/api/admin/leaves`             | List all leave requests.                          |
| `PUT`    | `/api/admin/leaves/:id/approve` | Approve a pending request and deduct its balance. |
| `PUT`    | `/api/admin/leaves/:id/reject`  | Reject a pending request.                         |
| `GET`    | `/api/admin/employees`          | List employees and leave balances.                |
| `GET`    | `/api/admin/holidays?year=2026` | List company holidays for a year.                 |
| `POST`   | `/api/admin/holidays`           | Add a company holiday (`date`, `name`).           |
| `DELETE` | `/api/admin/holidays/:id`       | Remove a company holiday.                         |

## Tests

From `backend`, run the current regression suites directly:

```powershell
node --test test/authCompatibility.test.js test/leaveType.test.js
```

The tests cover authentication compatibility, allowed leave types, weekend-excluding calculations, and annual leave usage.
