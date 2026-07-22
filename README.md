# BCS Tournament App

A team-shuffling app for tournaments, backed by **MongoDB Atlas** via a local **Express** API.

---

## Architecture

```
project 2/
├── src/                  # Vite + React + TypeScript frontend (port 5173)
│   ├── db.ts             # All API calls → Express backend
│   ├── shuffle.ts        # Star-balancing + special assignment logic
│   └── components/       # UI tabs: ManagePlayers, TeamSetup, Shuffle, FinalTeams
└── server/               # Node/Express backend (port 5000)
    ├── index.js          # Entry point, MongoDB connection
    ├── models/           # Mongoose schemas
    └── routes/           # REST endpoints under /api
```

---

## Local Setup

### Prerequisites
- Node 18+
- A MongoDB Atlas cluster (free tier is fine)

### 1. Create the server environment file

```bash
# Create server/.env — do NOT commit this file
cat > server/.env << 'EOF'
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
EOF
```

Replace the URI with your actual Atlas connection string.

### 2. Install dependencies

```bash
# Root (frontend + concurrently)
npm install

# Server (express, mongoose, cors, dotenv)
cd server && npm install && cd ..
```

### 3. Run both servers together

```bash
npm run dev
```

This starts:
- **Frontend** at `http://localhost:5173` (Vite)
- **Backend** at `http://localhost:5000` (Express + MongoDB)

You can also run them separately:
```bash
npm run dev:frontend   # Vite only
npm run dev:server     # Express only
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/players` | All players |
| `POST` | `/api/players` | Add player |
| `PUT` | `/api/players/:id` | Update player |
| `DELETE` | `/api/players/:id` | Delete player |
| `DELETE` | `/api/players` | Clear all players |
| `GET` | `/api/teams` | All teams (null if none) |
| `POST` | `/api/teams` | Replace all teams |
| `GET` | `/api/config` | Tournament config |
| `POST` | `/api/config` | Save tournament config |
| `GET` | `/api/special-assignment` | Special assignment state |
| `POST` | `/api/special-assignment` | Update special assignment |
| `GET` | `/api/health` | Health check |

---

## Environment Variables

### Root `.env` (Vite, committed)
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:5000` | Express backend base URL |

### `server/.env` (**not** committed)
| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |

---

## Login Credentials

| Role | Password |
|------|----------|
| Alpha Warriors | *(see Login screen)* |
| Super Admin | *(see Login screen)* |
