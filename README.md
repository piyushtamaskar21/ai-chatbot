# ChatGPT-Style Fullstack Chatbot with JWT Auth & Multi-OAuth

A modern, production-ready fullstack chatbot web app inspired by ChatGPT. Features include multi-provider authentication (manual, Google, Microsoft, Apple), JWT-secured backend, chat history, user profiles, and beautiful UI matching OpenAI’s signature style.

---

## 🏗️ Architecture Overview

- **Frontend:** React + TypeScript  
  - Responsive ChatGPT-style UI (chat view, sidebar, login/signup pages)
  - Manual login/signup and OAuth (Google, Microsoft, Apple)
  - Session persistence using JWT in localStorage

- **Backend:** FastAPI (Python)  
  - RESTful API
  - JWT-based auth, full user/session management
  - OpenAI integration (GPT API)
  - OAuth login endpoints for Google, Microsoft, Apple
  - SQLite database via SQLAlchemy ORM

- **Modules:**
  - `/frontend` — All React code: components, pages, styles
  - `/backend` — FastAPI app, models, database, auth, routes

---

## 🚀 Features

- **Chat:** 
  - Modern chat UI, new conversation, history, streaming responses

- **Authentication:**
  - Manual signup/login (with name & email)
  - Social login: Google, Microsoft, Apple (web)
  - Secure JWT tokens for session management

- **Sidebar:** 
  - History navigation, new chat, user profile (avatar, name/email), settings/logout

---

## 📂 File/Module Structure

### `/frontend`
- `src/`
  - `components/`
    - `Sidebar.tsx`, `Sidebar.css` — ChatGPT-style left sidebar
    - `AuthPage.tsx`, `AuthPage.css` — Custom login/signup page with OAuth logic
    - `ChatWindow.tsx`, `InputArea.tsx` — Main chat input & display
  - `App.tsx` — Root app logic/state
  - `styles/` — Central or component CSS

### `/backend`
- `main.py` — FastAPI app definition, routes, logic
- `models.py` — SQLAlchemy ORM models (User, ChatSession)
- `database.py` — DB connection setup
- `auth.py` — Password hashing, JWT creation, verification
- `schemas.py` — Pydantic request/response schemas
- `.env` — Environment variables (OpenAI key, secrets, OAuth client IDs)

---

## 🔐 Authentication Providers

- **Manual:**  
  - Email + password, user name
  - `/auth/signup`, `/auth/login`
- **Google:**  
  - Uses `@react-oauth/google` on frontend
  - Backend verifies token with Google
- **Microsoft:**  
  - Uses `react-microsoft-login`
  - Backend uses Microsoft Graph API with access token
- **Apple:**  
  - [Requires Apple JS SDK, Service ID configuration, and backend JWT validation.](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms)

**All flows result in standard JWT-based user session and seamless integration with chat and history.**

---

## ⚙️ Backend API Endpoints

- `POST /auth/signup` — Manual user account creation
- `POST /auth/login` — Manual user login
- `POST /auth/social-login` — Universal OAuth provider endpoint
- `POST /chat` — Generate chat response (integrates with OpenAI)
- `POST /chats/save` — Save current chat session/history for user
- `GET /chats/history` — Get list of user’s chat sessions
- `GET /` — Health check/info

---

## 🧩 Key Component Documentation

### Sidebar.tsx

- Renders chat navigation/history
- Shows user avatar (name initials or email)
- Settings and logout button
- Responsive: always visible, never overlaps content

### AuthPage.tsx

- Welcome, login, signup, and OAuth
- Three social buttons: Google, Microsoft, Apple
- Manual login/signup
- On success: updates JWT/token state, loads user profile and history

### App.tsx

- Global state: user, token, chat history, messages
- Handles login/signup/session logic
- Renders either AuthPage or full chat UI

---

## 📝 Setup & Installation

1. **Clone repo**
2. **Backend:**
   - Install Python deps:
     ```
     pip install fastapi uvicorn sqlalchemy python-jose passlib openai
     ```
   - Set up `.env`:
     ```
     OPENAI_API_KEY=sk-...
     GOOGLE_CLIENT_ID=...
     MICROSOFT_CLIENT_ID=...
     APPLE_SERVICE_ID=...
     APPLE_TEAM_ID=...
     APPLE_KEY_ID=...
     APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
     ```
   - Launch backend:
     ```
     uvicorn main:app --reload
     ```
3. **Frontend:**
   - Install Node deps:
     ```
     npm install
     npm install @react-oauth/google react-microsoft-login
     ```
   - Configure OAuth keys
   - Start frontend:
     ```
     npm start
     ```

---

## ⚡ Usage

- Create account or sign in via Google, Microsoft, Apple or manual email
- New chat, view history, continue conversation
- Profile and settings in sidebar
- Works on mobile/desktop, fully responsive

---

## 🎨 Screenshots

- ![ChatGPT Login](screenshots/login.png)
- ![Sidebar + Chat](screenshots/sidebar.png)
- ![Chat in action](screenshots/chat.png)

---

## 💯 Extending

- Add more OAuth providers with similar backend validation logic
- Enhance profile UI, history search, chat export
- Customize OpenAI model selection, streaming, formats

---

## 🔒 Security

- All tokens verified server-side
- No passwords exposed to frontend/OAuth providers
- JWT invalidation/expiration supported

---

## 📄 License

MIT — free for commercial/personal use, attribution appreciated.

---
# AI Chatbot

A full-stack ChatGPT-like assistant built with a FastAPI backend and a React + TypeScript frontend. It supports JWT-based authentication, OpenAI-powered conversations, persistent chat history, and a polished chat experience with markdown rendering, prompt cards, and copy-to-clipboard utilities.

## Table of Contents
1. [Solution Overview](#solution-overview)
2. [System Architecture](#system-architecture)
3. [Backend (FastAPI) Guide](#backend-fastapi-guide)
4. [Frontend (React + TypeScript) Guide](#frontend-react--typescript-guide)
5. [Authentication & Session Flow](#authentication--session-flow)
6. [Environment Variables](#environment-variables)
7. [Local Development](#local-development)
8. [Design System & UI Components](#design-system--ui-components)
9. [Testing Hooks](#testing-hooks)
10. [Deployment Notes](#deployment-notes)
11. [Troubleshooting](#troubleshooting)

## Solution Overview
- **Conversational AI:** User prompts are proxied to OpenAI's `gpt-3.5-turbo` chat completion API with configurable temperature and token limits exposed by the backend schema.【F:backend/main.py†L57-L97】
- **Persistent history:** Authenticated users can save or retrieve conversations. Sessions are stored in SQLite through SQLAlchemy models (`User`, `ChatSession`).【F:backend/models.py†L8-L23】【F:backend/main.py†L101-L147】
- **Polished UI:** The React app orchestrates authentication, session management, and streaming-like UI updates while rendering markdown/code blocks with copy buttons, empty-state prompt cards, and a responsive layout (sidebar + chat window + composer).【F:frontend/src/App.tsx†L21-L291】【F:frontend/src/components/ChatWindow.tsx†L24-L419】

## System Architecture
```
┌─────────────────────────┐           ┌────────────────────────────┐
│ React SPA (CRA + TS)    │  HTTPS    │ FastAPI service            │
│ - Sidebar (history)     │──────────▶│ - Auth, Chat, History APIs │
│ - ChatWindow (markdown) │           │ - JWT auth, OpenAI proxy   │
│ - InputArea (composer)  │◀──────────│ - SQLite via SQLAlchemy    │
└─────────┬───────────────┘  JSON     └─────────┬──────────────────┘
          │                                      │
          │                                      ▼
          │                            SQLite `chat_app.db`
          │                                      │
          │                                      ▼
          │                            OpenAI Chat Completions
          ▼
LocalStorage (tokens, sessions)
```

**Key flows**
1. React issues auth or chat requests via Axios to `${REACT_APP_API_URL}`.
2. FastAPI validates JWTs, talks to SQLite for user/sessions, and forwards chat messages to OpenAI.
3. The backend response updates local UI state; for authenticated first-time conversations the session metadata is persisted and shown in the sidebar.

## Backend (FastAPI) Guide
### Tech Stack
- FastAPI + Uvicorn for HTTP layer and CORS middleware.
- SQLAlchemy ORM on top of SQLite for persistence (can be swapped with Postgres/MySQL by editing `DATABASE_URL`).【F:backend/database.py†L1-L8】
- Passlib + python-jose for password hashing and JWT signing.【F:backend/auth.py†L1-L26】
- OpenAI Python SDK for completions.【F:backend/main.py†L32-L97】

### Directory Layout
```
backend/
├── main.py          # FastAPI app & route handlers
├── models.py        # SQLAlchemy models (User, ChatSession)
├── database.py      # Engine & Session factory
├── auth.py          # Hashing + JWT helpers
├── routes/          # (Optional) future route modules
├── schemas.py       # Pydantic schema stubs
├── utils/           # Shared helpers
└── tests/           # FastAPI test entry points
```

### Database Schema
| Table        | Fields (type) | Notes |
|--------------|---------------|-------|
| `users`      | `id` (PK), `email`, `password_hash`, `name`, `created_at` | Unique email, bcrypt-hashed credentials.【F:backend/models.py†L8-L15】 |
| `chat_sessions` | `id` (PK), `user_id` (FK), `title`, `messages` (JSON), `created_at`, `updated_at` | Stores rendered chat history per user with automatic timestamps.【F:backend/models.py†L16-L23】 |

### REST API Surface
| Method & Path        | Description |
|----------------------|-------------|
| `POST /auth/signup`  | Create account, return JWT access token + user id.【F:backend/main.py†L64-L75】 |
| `POST /auth/login`   | Authenticate user credentials and mint JWT.【F:backend/main.py†L76-L83】 |
| `POST /chat`         | Proxy chat messages to OpenAI and return assistant text.【F:backend/main.py†L86-L97】 |
| `POST /chats/save`   | Persist a new chat session for the authenticated user.【F:backend/main.py†L101-L125】 |
| `GET /chats/history` | List saved sessions ordered by creation date.【F:backend/main.py†L126-L147】 |
| `GET /`              | Health check with docs link.【F:backend/main.py†L148-L151】 |

### Running the Backend Locally
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # or create a new .env (see Environment Variables)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The SQLite database `chat_app.db` is created automatically in `backend/` the first time `Base.metadata.create_all` executes.【F:backend/main.py†L19-L21】

## Frontend (React + TypeScript) Guide
### Tech Stack & Build
- Create React App + TypeScript with `react-scripts`.
- Axios for HTTP requests, Lucide icons, React Markdown renderer for rich assistant responses.

### Data & UI Flow
- `App.tsx` is the orchestrator: manages auth state, session history, message list, and user input while persisting JWT + user info in `localStorage`.【F:frontend/src/App.tsx†L21-L215】
- Initial login view displays a form, guest mode button, and still renders the chat area for exploration without persistence.【F:frontend/src/App.tsx†L218-L264】
- Authenticated layout includes the sidebar history, chat window, and composer stacked vertically in the main pane.【F:frontend/src/App.tsx†L266-L291】
- When a response arrives, the UI simulates streaming by progressively appending words and toggling the `isStreaming` flag so the cursor animation can display in the chat bubble.【F:frontend/src/App.tsx†L129-L205】

### Core Components
| Component | Responsibility |
|-----------|----------------|
| `Sidebar` | Shows new-chat action, saved sessions, placeholder settings, and user profile/logout area; gracefully degrades to guest info when no auth is present.【F:frontend/src/components/Sidebar.tsx†L25-L101】 |
| `ChatWindow` | Renders empty-state prompt cards, message bubbles, markdown headings/lists/tables/code blocks, and typing indicators. Includes copy buttons and auto-scroll behavior.【F:frontend/src/components/ChatWindow.tsx†L24-L419】 |
| `InputArea` | Message composer with send button (disabled during loading or when input is blank).【F:frontend/src/components/InputArea.tsx†L12-L39】 |

### Running the Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```
During development ensure the backend is running with matching host/port so CORS and cookies align with the `allow_origins` list.【F:backend/main.py†L22-L30】

## Authentication & Session Flow
1. User submits credentials via the login form. `handleLogin` posts to `/auth/login`, stores the returned JWT + user id in localStorage, and preloads chat history.【F:frontend/src/App.tsx†L62-L90】
2. Protected requests include `Authorization: Bearer <token>` headers (history fetch, save).【F:frontend/src/App.tsx†L47-L60】【F:frontend/src/App.tsx†L177-L199】
3. `handleLogout` clears state and localStorage, returning the UI to guest mode.【F:frontend/src/App.tsx†L87-L96】
4. New chats trigger an OpenAI call; if the user is logged in and it's a brand-new session, a title is generated and the transcript is saved through `/chats/save`.【F:frontend/src/App.tsx†L98-L205】

## Environment Variables
Create `.env` files in both `backend/` and `frontend/` directories (never commit secrets).

**Backend `.env`**
```
OPENAI_API_KEY=sk-...
DATABASE_URL=sqlite:///./chat_app.db  # optional override
SECRET_KEY=...                        # optional override matching auth.py
ACCESS_TOKEN_EXPIRE_MINUTES=10080     # optional override
```

**Frontend `.env`**
```
REACT_APP_API_URL=http://localhost:8000
```

## Local Development
1. **Install dependencies** for both backend (`pip install -r requirements.txt`) and frontend (`npm install`).
2. **Run backend** with `uvicorn main:app --reload --host 0.0.0.0 --port 8000` from `backend/`.
3. **Run frontend** with `npm start` from `frontend/` (CRA dev server on port 3000).
4. **Login or guest mode:** If no credentials exist yet, hit `/auth/signup` through the built-in Swagger docs (`http://localhost:8000/docs`) to create the first user, then log in from the React UI.
5. **Iterate:** CRA hot reload handles UI changes; FastAPI reload handles backend edits.

## Design System & UI Components
- **Layout:** Flexbox layout with persistent sidebar + scrollable chat pane defined in `App.css`, keeping typography consistent via system fonts and neutral background.【F:frontend/src/App.tsx†L218-L291】
- **Empty state prompts:** Four clickable cards encourage users to start a conversation when no messages exist.【F:frontend/src/components/ChatWindow.tsx†L350-L385】
- **Markdown renderer:** Custom parser supports headings, tables with copy buttons, fenced code blocks with auto language detection, lists, quotes, inline formatting, and inline code styling.【F:frontend/src/components/ChatWindow.tsx†L112-L336】
- **Copy UX:** Code/table sections expose `CopyButton`/`CopyTableButton` with optimistic feedback for quick sharing of assistant responses.【F:frontend/src/components/ChatWindow.tsx†L58-L109】
- **Composer:** Minimal input row with disabled states and Lucide `Send` icon, matching the chat aesthetic.【F:frontend/src/components/InputArea.tsx†L12-L39】
- **Sidebar profile:** Displays initials avatar, status, and logout action for authenticated users while falling back to guest messaging when not logged in.【F:frontend/src/components/Sidebar.tsx†L71-L101】

## Testing Hooks
- Backend tests can be added under `backend/tests/` using `pytest` + `httpx`. To start, configure a temporary SQLite DB and exercise FastAPI routes with dependency overrides.
- Frontend tests can be added via `npm test` (React Testing Library). Create fixtures for ChatWindow markdown rendering, sidebar interactions, and authentication form flows.

## Deployment Notes
- Replace SQLite with a managed database for production by updating `DATABASE_URL` and running migrations (e.g., Alembic).
- Set stricter CORS lists and rotate the JWT secret (`SECRET_KEY`) per environment.【F:backend/main.py†L22-L34】【F:backend/auth.py†L1-L26】
- Use build artifacts: `npm run build` (frontend) and a production ASGI server (e.g., `uvicorn --workers 4 main:app` or Gunicorn with Uvicorn workers) behind a reverse proxy.
- Configure secrets through the hosting platform (Docker secrets, Kubernetes, etc.) instead of `.env` files.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `401 Unauthorized` on history/save | Missing/expired JWT in `Authorization` header. | Ensure login succeeded and localStorage contains `authToken`; reauthenticate if needed.【F:frontend/src/App.tsx†L36-L96】 |
| Chat responses return `Error: ...` | Missing `OPENAI_API_KEY` or network issue when FastAPI hits OpenAI. | Verify `.env` and that the backend container can reach OpenAI.【F:backend/main.py†L32-L97】 |
| No chat history after login | No saved sessions yet or `/chats/history` request failed. | Inspect backend logs; ensure token header is sent when `loadChatHistory` runs.【F:frontend/src/App.tsx†L36-L60】 |
| UI stuck in loading state | Network call unresolved. | Check browser dev tools for failed requests and backend console for stack traces.

- Major contributors: [Your Name Here]

---
