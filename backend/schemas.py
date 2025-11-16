from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    messages: List[Message] = []

class ChatSession(BaseModel):
    id: int
    user_id: Optional[int]
    title: Optional[str]
    messages: List[Message]
    created_at: datetime

    class Config:
        from_attributes = True

class User(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True