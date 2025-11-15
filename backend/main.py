import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from pydantic import BaseModel, Field, validator
from openai import AsyncOpenAI, RateLimitError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

client = AsyncOpenAI(api_key=api_key)

# Constants
MAX_MESSAGE_LENGTH = 4000
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60  # seconds
DEFAULT_MODEL = "gpt-4.1-mini"

# ============================================================================
# Pydantic Models for Request/Response Validation
# ============================================================================

class Message(BaseModel):
    """Represents a single message in conversation history."""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    
    @validator("content")
    def validate_content(cls, v):
        """Sanitize content to prevent prompt injection."""
        # Remove null bytes and control characters
        v = v.replace("\x00", "").strip()
        if not v:
            raise ValueError("Message content cannot be empty")
        return v


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    messages: list[Message] = Field(
        ..., min_items=1, max_items=50,
        description="Conversation history (minimum 1, maximum 50 messages)"
    )
    temperature: float = Field(
        default=0.7, ge=0.0, le=2.0,
        description="Sampling temperature (0-2)"
    )
    max_tokens: int = Field(
        default=500, ge=1, le=4000,
        description="Maximum tokens in response"
    )
    model: str = Field(default=DEFAULT_MODEL)
    stream: bool = Field(default=False, description="Enable streaming responses")


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    model: str
    usage: dict = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ============================================================================
# Lifespan Context Manager (FastAPI 0.93+)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown.
    Useful for initializing resources like connection pools.
    """
    logger.info("Application starting up...")
    yield
    logger.info("Application shutting down...")


# ============================================================================
# FastAPI Application Setup
# ============================================================================

app = FastAPI(
    title="AI Chatbot API",
    description="Production-grade chatbot powered by OpenAI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (restrict to your frontend domain in production)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory rate limiting (use Redis for production)
request_counts: dict[str, list[float]] = {}


# ============================================================================
# Utility Functions
# ============================================================================

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    if x_forwarded_for := request.headers.get("X-Forwarded-For"):
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(client_ip: str) -> bool:
    """
    Simple in-memory rate limiting (use Redis for production).
    Returns True if request should be allowed, False otherwise.
    """
    current_time = datetime.now().timestamp()
    
    if client_ip not in request_counts:
        request_counts[client_ip] = []
    
    # Remove old requests outside the window
    request_counts[client_ip] = [
        req_time for req_time in request_counts[client_ip]
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if limit exceeded
    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Record this request
    request_counts[client_ip].append(current_time)
    return True


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - returns API information."""
    return {
        "name": "AI Chatbot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "model": DEFAULT_MODEL
    }


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request_body: ChatRequest, request: Request):
    """
    Main chat endpoint - sends messages to OpenAI and returns responses.
    
    **Rate Limited**: 100 requests per minute per IP
    **Streaming**: Use `stream=true` for real-time token delivery
    """
    client_ip = get_client_ip(request)
    
    # Rate limiting check
    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 100 requests per minute."
        )
    
    logger.info(f"Chat request from {client_ip}: {len(request_body.messages)} messages")
    
    try:
        # Prepare messages for API call
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request_body.messages
        ]
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model=request_body.model,
            messages=messages,
            temperature=request_body.temperature,
            max_tokens=request_body.max_tokens,
            stream=False  # Set to True for streaming in separate endpoint
        )
        
        # Extract response
        bot_response = response.choices[0].message.content
        
        logger.info(f"Successful response to {client_ip}")
        
        return ChatResponse(
            response=bot_response,
            model=response.model,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        )
    
    except RateLimitError as e:
        logger.error(f"OpenAI rate limit hit: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="OpenAI API rate limit exceeded. Please try again later."
        )
    
    except ValueError as e:
        logger.error(f"Invalid request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error. Please try again later."
        )


@app.post("/chat/stream", tags=["Chat"])
async def chat_stream(request_body: ChatRequest, request: Request):
    """
    Streaming chat endpoint - returns real-time tokens via Server-Sent Events.
    
    **Usage**: Set `stream=true` in request body
    **Performance**: Reduces perceived latency for long responses
    """
    client_ip = get_client_ip(request)
    
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded."
        )
    
    logger.info(f"Streaming request from {client_ip}")
    
    async def generate() -> AsyncGenerator[str, None]:
        """Stream response tokens in real-time."""
        try:
            messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request_body.messages
            ]
            
            stream = await client.chat.completions.create(
                model=request_body.model,
                messages=messages,
                temperature=request_body.temperature,
                max_tokens=request_body.max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {chunk.choices[0].delta.content}\n\n"
            
            yield "data: [DONE]\n\n"
        
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: Error: {str(e)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler."""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler."""
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}")
    return {
        "error": "Internal server error",
        "status_code": 500,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )
