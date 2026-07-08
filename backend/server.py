"""InviteCraft backend — FastAPI app.

Sections:
  1. Setup & config
  2. Models
  3. Auth helpers
  4. Auth routes
  5. Invitations CRUD + public share
  6. Guests + RSVP + analytics
  7. Email delivery (Resend)
  8. File uploads (photos, audio)
  9. AI: text (Claude), image (Gemini Nano Banana), video (Sora 2)
 10. App wiring
"""
from __future__ import annotations

import asyncio
import base64
import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

from storage import get_object, init_storage, put_object

# --------------------------------------------------------------------------
# 1. Setup
# --------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_NAME = os.environ.get("APP_NAME", "invitecraft")
APP_PUBLIC_BASE = os.environ.get("APP_PUBLIC_BASE", "").rstrip("/")

app = FastAPI(title="InviteCraft API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# --------------------------------------------------------------------------
# 2. Models
# --------------------------------------------------------------------------
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


class Photo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    url: str = ""
    x_pct: float = 50.0
    y_pct: float = 30.0
    w_pct: float = 30.0
    shape: str = "circle"  # circle | rect | rounded
    rotation: float = 0.0
    z_index: int = 1


class InvitationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = "Untitled Invitation"
    event_type: str = "wedding"
    subtitle: str = ""
    hosts: str = ""
    date_text: str = ""
    time_text: str = ""
    venue: str = ""
    rsvp: str = ""
    message: str = ""
    background_url: str = ""
    background_data: str = ""
    accent_color: str = "#D97757"
    text_color: str = "#1A1A1A"
    heading_font: str = "'Cormorant Garamond', serif"
    body_font: str = "'Outfit', sans-serif"
    overlay_opacity: float = 0.35
    # New in v2
    photos: List[Photo] = []
    envelope_style: str = "none"  # none | classic | indian | modern
    effects: List[str] = []  # petals | flowers | confetti | sparkles | bells
    music_url: str = ""
    music_label: str = ""
    scratch_reveal: bool = False
    video_url: str = ""


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
    photos: Optional[List[Photo]] = None
    envelope_style: Optional[str] = None
    effects: Optional[List[str]] = None
    music_url: Optional[str] = None
    music_label: Optional[str] = None
    scratch_reveal: Optional[bool] = None
    video_url: Optional[str] = None


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


class AIVideoRequest(BaseModel):
    prompt: str
    duration: int = 4  # 4 | 8 | 12
    size: str = "1024x1792"  # portrait for invite


class GuestIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr


class GuestBulkIn(BaseModel):
    guests: List[GuestIn]


class RSVPIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    status: str = Field(pattern="^(yes|no|maybe)$")
    note: Optional[str] = None


class SendInvitesRequest(BaseModel):
    subject: Optional[str] = None
    message: Optional[str] = None
    guest_ids: Optional[List[str]] = None  # None = send to all


# --------------------------------------------------------------------------
# 3. Auth helpers
# --------------------------------------------------------------------------
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


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    payload = _decode_token(creds.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def _get_user_from_query_or_header(
    authorization: Optional[str] = Header(None),
    auth: Optional[str] = Query(None),
) -> dict:
    """Auth accepting Bearer header OR ?auth= query param (for <img src=...>)."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(None, 1)[1]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = _decode_token(token)
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# --------------------------------------------------------------------------
# 4. Auth routes
# --------------------------------------------------------------------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if await db.users.find_one({"email": req.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password_hash": hash_password(req.password),
        "created_at": _now_iso(),
    })
    return AuthResponse(
        token=create_token(user_id, req.email.lower()),
        user={"id": user_id, "email": req.email.lower(), "name": req.name},
    )


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(
        token=create_token(user["id"], user["email"]),
        user={"id": user["id"], "email": user["email"], "name": user["name"]},
    )


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# --------------------------------------------------------------------------
# 5. Invitations
# --------------------------------------------------------------------------
@api_router.get("/invitations", response_model=List[Invitation])
async def list_invitations(user: dict = Depends(get_current_user)):
    cursor = db.invitations.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1)
    items = await cursor.to_list(500)
    for it in items:
        it.setdefault("photos", [])
        it.setdefault("effects", [])
        it.setdefault("envelope_style", "none")
        it.setdefault("music_url", "")
        it.setdefault("music_label", "")
        it.setdefault("scratch_reveal", False)
        it.setdefault("video_url", "")
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
        "guests": [],
        "views": [],
    })
    await db.invitations.insert_one(doc)
    return _clean(doc)


@api_router.get("/invitations/{inv_id}", response_model=Invitation)
async def get_invitation(inv_id: str, user: dict = Depends(get_current_user)):
    doc = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitation not found")
    doc.setdefault("photos", [])
    doc.setdefault("effects", [])
    return doc


@api_router.patch("/invitations/{inv_id}", response_model=Invitation)
async def update_invitation(
    inv_id: str, body: InvitationUpdate, user: dict = Depends(get_current_user)
):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = _now_iso()
    result = await db.invitations.update_one(
        {"id": inv_id, "user_id": user["id"]}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    doc.setdefault("photos", [])
    doc.setdefault("effects", [])
    return doc


@api_router.delete("/invitations/{inv_id}")
async def delete_invitation(inv_id: str, user: dict = Depends(get_current_user)):
    result = await db.invitations.delete_one({"id": inv_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"success": True}


# --------------------------------------------------------------------------
# 6. Public + Guests + Analytics
# --------------------------------------------------------------------------
def _hash_ip(ip: str) -> str:
    return hashlib.sha256((ip or "unknown").encode()).hexdigest()[:16]


@api_router.get("/public/{share_id}")
async def public_invite(share_id: str, request: Request):
    doc = await db.invitations.find_one(
        {"share_id": share_id},
        {"_id": 0, "user_id": 0, "guests": 0, "views": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Invitation not found")
    doc.setdefault("photos", [])
    doc.setdefault("effects", [])
    # Track view (fire and forget)
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")[:200]
    try:
        await db.invitations.update_one(
            {"share_id": share_id},
            {
                "$push": {
                    "views": {
                        "at": _now_iso(),
                        "ip_hash": _hash_ip(ip),
                        "user_agent": ua,
                    }
                }
            },
        )
    except Exception as e:
        logger.warning("view tracking failed: %s", e)
    return doc


@api_router.post("/public/{share_id}/rsvp")
async def public_rsvp(share_id: str, body: RSVPIn):
    inv = await db.invitations.find_one({"share_id": share_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    guests = inv.get("guests", [])
    email = body.email.lower()
    now = _now_iso()
    for g in guests:
        if g.get("email", "").lower() == email:
            g["status"] = body.status
            g["responded_at"] = now
            if body.note:
                g["note"] = body.note
            if body.name:
                g["name"] = body.name
            break
    else:
        guests.append({
            "id": uuid.uuid4().hex[:8],
            "name": body.name or email.split("@")[0],
            "email": email,
            "status": body.status,
            "note": body.note or "",
            "invited_at": None,
            "responded_at": now,
            "source": "public",
        })
    await db.invitations.update_one(
        {"share_id": share_id},
        {"$set": {"guests": guests, "updated_at": now}},
    )
    return {"success": True, "status": body.status}


@api_router.get("/invitations/{inv_id}/guests")
async def list_guests(inv_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0, "guests": 1})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return inv.get("guests", [])


@api_router.post("/invitations/{inv_id}/guests")
async def add_guests(inv_id: str, body: GuestBulkIn, user: dict = Depends(get_current_user)):
    inv = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    guests = inv.get("guests", [])
    existing = {g["email"].lower() for g in guests}
    added = []
    for g in body.guests:
        em = g.email.lower()
        if em in existing:
            continue
        record = {
            "id": uuid.uuid4().hex[:8],
            "name": g.name,
            "email": em,
            "status": "pending",
            "invited_at": None,
            "responded_at": None,
            "source": "manual",
        }
        guests.append(record)
        added.append(record)
        existing.add(em)
    await db.invitations.update_one(
        {"id": inv_id}, {"$set": {"guests": guests, "updated_at": _now_iso()}}
    )
    return {"added": added, "total": len(guests)}


@api_router.delete("/invitations/{inv_id}/guests/{guest_id}")
async def remove_guest(inv_id: str, guest_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    guests = [g for g in inv.get("guests", []) if g.get("id") != guest_id]
    await db.invitations.update_one(
        {"id": inv_id}, {"$set": {"guests": guests, "updated_at": _now_iso()}}
    )
    return {"success": True}


@api_router.get("/invitations/{inv_id}/analytics")
async def analytics(inv_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    views = inv.get("views", [])
    unique = len({v.get("ip_hash") for v in views if v.get("ip_hash")})
    guests = inv.get("guests", [])
    counts = {"yes": 0, "no": 0, "maybe": 0, "pending": 0}
    for g in guests:
        counts[g.get("status", "pending")] = counts.get(g.get("status", "pending"), 0) + 1
    # Last 30 days by day
    from collections import Counter
    by_day = Counter()
    for v in views:
        try:
            d = v.get("at", "")[:10]
            if d:
                by_day[d] += 1
        except Exception:
            pass
    return {
        "views_total": len(views),
        "views_unique": unique,
        "views_by_day": sorted([{"day": d, "count": c} for d, c in by_day.items()], key=lambda x: x["day"]),
        "guests_total": len(guests),
        "rsvp_counts": counts,
    }


# --------------------------------------------------------------------------
# 7. Email (Resend)
# --------------------------------------------------------------------------
def _render_email_html(inv: dict, invite_url: str, custom_message: str = "") -> str:
    title = inv.get("title", "You're invited")
    subtitle = inv.get("subtitle", "")
    date_text = inv.get("date_text", "")
    venue = inv.get("venue", "")
    message = custom_message or inv.get("message", "You are cordially invited to our celebration.")
    accent = inv.get("accent_color", "#D97757")
    hero = inv.get("background_data") or inv.get("background_url") or ""
    hero_html = (
        f'<img src="{hero}" width="600" style="width:100%;max-width:600px;display:block;border:0;" />'
        if hero and hero.startswith("http") else ""
    )
    return f"""<!doctype html><html><body style="margin:0;background:#FAF9F6;font-family:Georgia,serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E5E0;border-radius:16px;overflow:hidden;max-width:600px;">
      {'<tr><td>' + hero_html + '</td></tr>' if hero_html else ''}
      <tr><td style="padding:40px 40px 32px;text-align:center;">
        <div style="letter-spacing:0.32em;text-transform:uppercase;font-size:11px;color:{accent};">You're invited</div>
        <h1 style="font-family:Georgia,serif;font-size:42px;margin:16px 0 8px;font-weight:400;">{title}</h1>
        {f'<p style="font-style:italic;color:#5C5C5C;margin:0 0 24px;">{subtitle}</p>' if subtitle else ''}
        <div style="height:1px;background:{accent};width:60px;margin:24px auto;"></div>
        <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 24px;">{message}</p>
        {f'<div style="letter-spacing:0.15em;font-size:13px;color:#1A1A1A;margin:16px 0;">{date_text.upper()}</div>' if date_text else ''}
        {f'<div style="font-size:14px;color:#5C5C5C;margin:0 0 24px;">{venue}</div>' if venue else ''}
        <a href="{invite_url}" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;margin-top:16px;">Open your invitation</a>
        <p style="color:#8b8b8b;font-size:12px;margin-top:32px;">Or copy this link: <br/><span style="color:{accent};">{invite_url}</span></p>
      </td></tr>
    </table>
    <p style="color:#8b8b8b;font-size:11px;margin-top:24px;">Sent with love via InviteCraft</p>
  </td></tr>
</table></body></html>"""


def _send_via_resend(to: str, subject: str, html: str) -> tuple[bool, str]:
    if not RESEND_API_KEY:
        return False, "RESEND_API_KEY not configured"
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        result = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True, str(result.get("id", ""))
    except Exception as e:
        logger.error("Resend send failed: %s", e)
        return False, str(e)


@api_router.post("/invitations/{inv_id}/send-invites")
async def send_invites(
    inv_id: str, body: SendInvitesRequest, user: dict = Depends(get_current_user)
):
    inv = await db.invitations.find_one({"id": inv_id, "user_id": user["id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if not RESEND_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="Email sending isn't configured yet. Add RESEND_API_KEY in backend/.env and restart.",
        )
    guests = inv.get("guests", [])
    targets = guests
    if body.guest_ids:
        wanted = set(body.guest_ids)
        targets = [g for g in guests if g.get("id") in wanted]
    if not targets:
        raise HTTPException(status_code=400, detail="No guests to send to")

    base = APP_PUBLIC_BASE or ""
    invite_url = f"{base}/i/{inv['share_id']}"
    subject = body.subject or f"You're invited: {inv.get('title', 'Our celebration')}"
    html = _render_email_html(inv, invite_url, body.message or "")

    sent = 0
    failed = []
    for g in targets:
        ok, info = await asyncio.to_thread(_send_via_resend, g["email"], subject, html)
        if ok:
            g["invited_at"] = _now_iso()
            g["last_send_id"] = info
            sent += 1
        else:
            failed.append({"email": g["email"], "error": info})

    await db.invitations.update_one(
        {"id": inv_id}, {"$set": {"guests": guests, "updated_at": _now_iso()}}
    )
    return {"sent": sent, "failed": failed, "total_targets": len(targets)}


# --------------------------------------------------------------------------
# 8. File uploads (photos + audio)
# --------------------------------------------------------------------------
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"}
MAX_IMAGE = 6 * 1024 * 1024  # 6MB
MAX_AUDIO = 12 * 1024 * 1024  # 12MB


async def _do_upload(
    file: UploadFile, user: dict, kind: str, allowed: set[str], max_size: int
) -> dict:
    data = await file.read()
    if len(data) > max_size:
        raise HTTPException(status_code=413, detail=f"File too large (max {max_size // 1024 // 1024}MB)")
    ct = file.content_type or "application/octet-stream"
    if ct not in allowed:
        raise HTTPException(status_code=415, detail=f"Unsupported content type: {ct}")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['id']}/{kind}/{uuid.uuid4().hex}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, ct)
    except Exception as e:
        logger.exception("Upload failed")
        raise HTTPException(status_code=502, detail=f"Storage error: {e}")
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "kind": kind,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": ct,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": _now_iso(),
    }
    await db.files.insert_one(record)
    return {"id": record["id"], "path": record["storage_path"], "content_type": ct, "size": record["size"]}


@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    return await _do_upload(file, user, "photo", ALLOWED_IMAGE, MAX_IMAGE)


@api_router.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    return await _do_upload(file, user, "audio", ALLOWED_AUDIO, MAX_AUDIO)


@api_router.get("/files/{path:path}")
async def download_file(
    path: str,
    authorization: Optional[str] = Header(None),
    auth: Optional[str] = Query(None),
):
    """Files are user-scoped. Owner needs a valid token (via header or ?auth=)."""
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    # If the file is referenced by any published invitation of any kind, it's public-readable
    # (invitation photos + audio must be reachable from a public share link too).
    referenced = await db.invitations.find_one({
        "$or": [
            {"photos.url": {"$regex": path}},
            {"music_url": {"$regex": path}},
        ]
    }, {"_id": 0, "id": 1})
    if not referenced:
        # Otherwise require auth (owner only)
        user = await _get_user_from_query_or_header(authorization, auth)
        if user["id"] != record["user_id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
    try:
        data, ct = await asyncio.to_thread(get_object, path)
    except Exception as e:
        logger.exception("File download failed")
        raise HTTPException(status_code=502, detail=f"Storage error: {e}")
    return Response(content=data, media_type=record.get("content_type") or ct or "application/octet-stream")


# --------------------------------------------------------------------------
# 9. AI: text (Claude), image (Gemini), video (Sora 2)
# --------------------------------------------------------------------------
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
        raise HTTPException(status_code=502, detail=f"AI text generation failed: {e}")


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
        raise HTTPException(status_code=502, detail=f"AI image generation failed: {e}")


# ---- Video generation (Sora 2) -- background job pattern -----------------
def _sora_worker(job_id: str, prompt: str, size: str, duration: int, user_id: str):
    """Run in a thread — Sora blocks until done."""
    try:
        video_gen = OpenAIVideoGeneration(api_key=EMERGENT_LLM_KEY)
        video_bytes = video_gen.text_to_video(
            prompt=prompt,
            model="sora-2",
            size=size,
            duration=duration,
            max_wait_time=600,
        )
        if not video_bytes:
            raise RuntimeError("Sora returned empty video")
        path = f"{APP_NAME}/uploads/{user_id}/video/{job_id}.mp4"
        put_object(path, video_bytes, "video/mp4")
        return path, len(video_bytes), None
    except Exception as e:
        logger.exception("Sora worker failed")
        return None, 0, str(e)


async def _run_video_job(job_id: str, prompt: str, size: str, duration: int, user_id: str):
    await db.video_jobs.update_one({"id": job_id}, {"$set": {"status": "running"}})
    path, size_bytes, err = await asyncio.to_thread(_sora_worker, job_id, prompt, size, duration, user_id)
    if err:
        await db.video_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "failed", "error": err, "finished_at": _now_iso()}},
        )
        return
    # Register the video file so /api/files can serve it
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id,
        "user_id": user_id,
        "kind": "video",
        "storage_path": path,
        "original_filename": f"{job_id}.mp4",
        "content_type": "video/mp4",
        "size": size_bytes,
        "is_deleted": False,
        "created_at": _now_iso(),
    })
    await db.video_jobs.update_one(
        {"id": job_id},
        {"$set": {"status": "done", "storage_path": path, "finished_at": _now_iso()}},
    )


@api_router.post("/ai/generate-video")
async def ai_generate_video(
    req: AIVideoRequest,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    if req.duration not in (4, 8, 12):
        raise HTTPException(status_code=400, detail="duration must be 4, 8 or 12")
    if req.size not in {"1280x720", "1792x1024", "1024x1792", "1024x1024"}:
        raise HTTPException(status_code=400, detail="unsupported size")
    job_id = uuid.uuid4().hex[:16]
    await db.video_jobs.insert_one({
        "id": job_id,
        "user_id": user["id"],
        "prompt": req.prompt,
        "duration": req.duration,
        "size": req.size,
        "status": "queued",
        "created_at": _now_iso(),
    })
    background.add_task(_run_video_job, job_id, req.prompt, req.size, req.duration, user["id"])
    return {"job_id": job_id, "status": "queued"}


@api_router.get("/ai/video-status/{job_id}")
async def video_status(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.video_jobs.find_one({"id": job_id, "user_id": user["id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# --------------------------------------------------------------------------
# 10. App wiring
# --------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "InviteCraft API", "status": "ok", "resend_configured": bool(RESEND_API_KEY)}


@app.on_event("startup")
async def _startup():
    try:
        init_storage()
    except Exception as e:
        logger.warning("Storage init failed at startup: %s", e)


@app.on_event("shutdown")
async def _shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
