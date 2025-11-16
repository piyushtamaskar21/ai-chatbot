# Add these to your existing chat routes
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ChatSession as ChatSessionModel, User as UserModel
from schemas import ChatSession
from auth import get_current_user_optional

router = APIRouter(prefix="/chats", tags=["chats"])

@router.get("/history", response_model=list[ChatSession])
async def get_chat_history(
    current_user: Optional[TokenData] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if current_user is None:
        # Guest user - return empty
        return []
    
    # Get user's chats
    chats = db.query(ChatSessionModel).filter(
        ChatSessionModel.user_id == current_user.user_id
    ).all()
    
    return chats

@router.post("/save", response_model=ChatSession)
async def save_chat(
    chat: ChatSessionCreate,
    current_user: Optional[TokenData] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if current_user is None:
        # Guest user - return error
        raise HTTPException(status_code=401, detail="Login required to save chats")
    
    new_chat = ChatSessionModel(
        user_id=current_user.user_id,
        title=chat.title,
        messages=chat.messages
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return new_chat

@router.get("/{chat_id}", response_model=ChatSession)
async def get_chat(
    chat_id: int,
    current_user: Optional[TokenData] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    chat = db.query(ChatSessionModel).filter(ChatSessionModel.id == chat_id).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Verify ownership
    if chat.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return chat