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

## 🙏 Credits

- OpenAI for design inspiration and API
- FastAPI Team
- Major contributors: [Your Name Here]

---
