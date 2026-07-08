from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import base64
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRES_HOURS = int(os.environ.get('JWT_EXPIRES_HOURS', '168'))
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI(title="InviteCraft API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------------- Models ----------------------
def _now_iso():
    return datetime.now(timezone.utc).isoformat()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class InvitationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = "Untitled Invitation"
    event_type: str = "wedding"  # wedding|birthday|baby_shower|anniversary|corporate
    subtitle: str = ""
    hosts: str = ""
    date_text: str = ""
    time_text: str = ""
    venue: str = ""
    rsvp: str = ""
    message: str = ""
    background_url: str = ""
    background_data: str = ""  # data URL for AI-generated
    accent_color: str = "#D97757"
    text_color: str = "#1A1A1A"
    heading_font: str = "'Cormorant Garamond', serif"
    body_font: str = "'Outfit', sans-serif"
    overlay_opacity: float = 0.35


class InvitationCreate(InvitationBase):
    pass


class InvitationUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    event_type: Optional[str] = None
    subtitle: Optional[str] = None
    hosts: Optional[str] = None
    date_text: Optional[str] = None
    time_text: Optional[str] = None
    venue: Optional[str] = None
    rsvp: Optional[str] = None
    message: Optional[str] = None
    background_url: Optional[str] = None
    background_data: Optional[str] = None
    accent_color: Optional[str] = None
    text_color: Optional[str] = None
    heading_font: Optional[str] = None
    body_font: Optional[str] = None
    overlay_opacity: Optional[float] = None


class Invitation(InvitationBase):
    id: str
    user_id: str
    share_id: str
    created_at: str
    updated_at: str


class AITextRequest(BaseModel):
    event_type: str
    vibe: str = "elegant"
    details: str = ""


class AIImageRequest(BaseModel):
    prompt: str
    event_type: str = "wedding"


# ---------------------- Helpers ----------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _clean(doc: dict) -> dict:
    doc.pop('_id', None)
    return doc


# ---------------------- Routes: Auth ----------------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password_hash": hash_password(req.password),
        "created_at": _now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, doc["email"])
    return AuthResponse(token=token, user={"id": user_id, "email": doc["email"], "name": doc["name"]})


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return AuthResponse(token=token, user={"id": user["id"], "email": user["email"], "name": user["name"]})


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------------- Routes: Invitations ----------------------
@api_router.get("/invitations", response_model=List[Invitation])
async def list_invitations(user: dict = Depends(get_current_user)):
    cursor = db.invitations.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1)
    items = await cursor.to_list(500)
    return items


@api_router.post("/invitations", response_model=Invitation)
async def create_invitation(body: InvitationCreate, user: dict = Depends(get_current_user)):
    now = _now_iso()
    doc = body.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "share_id": uuid.uuid4().hex[:12],
        "created_at": now,
        "updated_at": now,
    })
    await db.invitations.insert_one(doc)
    return _clean(doc)


@api_router.get("/invitations/{inv_id}", response_model=Invitation)
async def get_invitation(inv_id: str, user: dict = Depends(get_current_user)):
    doc = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return doc


@api_router.patch("/invitations/{inv_id}", response_model=Invitation)
async def update_invitation(inv_id: str, body: InvitationUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = _now_iso()
    result = await db.invitations.update_one({"id": inv_id, "user_id": user["id"]}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    return doc


@api_router.delete("/invitations/{inv_id}")
async def delete_invitation(inv_id: str, user: dict = Depends(get_current_user)):
    result = await db.invitations.delete_one({"id": inv_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"success": True}


@api_router.get("/public/{share_id}")
async def public_invite(share_id: str):
    doc = await db.invitations.find_one({"share_id": share_id}, {"_id": 0, "user_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return doc


# ---------------------- Routes: AI ----------------------
_AI_SYSTEM = (
    "You are InviteCraft's copywriter. You write short, elegant invitation copy. "
    "Return only the requested block, no preamble. Keep tone matched to the event and vibe. "
    "Be warm, concise, and free of clichés."
)


@api_router.post("/ai/generate-text")
async def ai_generate_text(req: AITextRequest, user: dict = Depends(get_current_user)):
    prompt = (
        f"Write an invitation message for a {req.event_type.replace('_', ' ')} event.\n"
        f"Vibe: {req.vibe}.\n"
        f"Additional context: {req.details or 'none'}.\n\n"
        "Provide THREE parts, each on its own line prefixed exactly as:\n"
        "TITLE: <2-4 words hero title>\n"
        "SUBTITLE: <one-line elegant subtitle>\n"
        "MESSAGE: <2-3 sentences invitation body>\n"
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"invite-text-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message=_AI_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-6")
        response = await chat.send_message(UserMessage(text=prompt))
        text = response if isinstance(response, str) else str(response)
        result = {"title": "", "subtitle": "", "message": ""}
        for line in text.splitlines():
            line = line.strip()
            if line.upper().startswith("TITLE:"):
                result["title"] = line.split(":", 1)[1].strip().strip('"')
            elif line.upper().startswith("SUBTITLE:"):
                result["subtitle"] = line.split(":", 1)[1].strip().strip('"')
            elif line.upper().startswith("MESSAGE:"):
                result["message"] = line.split(":", 1)[1].strip().strip('"')
        if not any(result.values()):
            result["message"] = text.strip()
        return result
    except Exception as e:
        logger.exception("AI text generation failed")
        raise HTTPException(status_code=502, detail=f"AI text generation failed: {str(e)}")


@api_router.post("/ai/generate-image")
async def ai_generate_image(req: AIImageRequest, user: dict = Depends(get_current_user)):
    full_prompt = (
        f"A high-quality, photographic background for a {req.event_type.replace('_', ' ')} invitation card. "
        f"Style: {req.prompt}. "
        "Composition: leave the center relatively clean for text overlay. "
        "Soft lighting, elegant, no text, no watermark, vertical portrait 3:4 composition. "
        "Rich but not busy."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"invite-img-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at composing beautiful invitation card backgrounds.",
        ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _text, images = await chat.send_message_multimodal_response(UserMessage(text=full_prompt))
        if not images:
            raise HTTPException(status_code=502, detail="No image returned by AI")
        img = images[0]
        data_url = f"data:{img['mime_type']};base64,{img['data']}"
        return {"data_url": data_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AI image generation failed")
        raise HTTPException(status_code=502, detail=f"AI image generation failed: {str(e)}")


# ---------------------- Health ----------------------
@api_router.get("/")
async def root():
    return {"message": "InviteCraft API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
