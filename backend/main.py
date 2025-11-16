from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from openai import OpenAI
import os

from models import Base, User, ChatSession
from database import engine, SessionLocal
from auth import hash_password, verify_password, create_access_token, verify_token
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# 1. Create all DB Tables
Base.metadata.create_all(bind=engine)

# 2. FastAPI app and CORS
app = FastAPI(title="ChatGPT-like Chatbot", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. OpenAI SDK setup via env variable
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 4. Dependency for DB access
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Schemas for requests & responses
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ChatSessionCreate(BaseModel):
    title: str
    messages: list

class ChatRequest(BaseModel):
    messages: list
    temperature: float = 0.7
    max_tokens: int = 2000

# 6. Auth endpoints

@app.post("/auth/signup")
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, password_hash=hashed_password, name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token({"sub": new_user.email, "user_id": new_user.id})
    return {"access_token": token, "token_type": "bearer", "user_id": new_user.id}

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": db_user.email, "user_id": db_user.id})
    return {"access_token": token, "token_type": "bearer", "user_id": db_user.id}

# 7. OpenAI chat endpoint

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

# 8. Chat history endpoints (save/list)

@app.post("/chats/save")
async def save_chat(
    chat: ChatSessionCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Login required to save chats")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    new_chat = ChatSession(
        user_id=user_id,
        title=chat.title,
        messages=chat.messages,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return {"id": new_chat.id, "title": new_chat.title, "messages": new_chat.messages, "created_at": str(new_chat.created_at)}

@app.get("/chats/history")
async def get_chat_history(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return []
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("user_id")
    chats = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).all()
    # Serialize properly for React frontend
    return [
        {
            "id": c.id,
            "title": c.title,
            "messages": c.messages,
            "created_at": str(c.created_at)
        }
        for c in chats
    ]

# (Optional) Health check
@app.get("/")
async def root():
    return {"message": "ChatGPT-like Chatbot API is running!", "docs": "/docs"}
