"""Cloudinary-backed object storage for InviteCraft."""
from __future__ import annotations
import os
import logging
import requests
import cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)

_state = {"configured": False}


def init_storage() -> bool:
    """Call once at startup (and lazily before each op). Returns True if configured."""
    if _state["configured"]:
        return True
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not (cloud_name and api_key and api_secret):
        logger.warning("Cloudinary credentials missing; storage not initialized")
        return False
    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
    _state["configured"] = True
    logger.info("Cloudinary storage initialized")
    return True


def _resource_type(content_type: str) -> str:
    if content_type.startswith("image/"):
        return "image"
    if content_type.startswith("audio/") or content_type.startswith("video/"):
        return "video"
    return "raw"


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Uploads to Cloudinary. Returns {"path": <public delivery URL>, "size": int}."""
    if not init_storage():
        raise RuntimeError("Storage not initialized")
    public_id = path.rsplit(".", 1)[0]
    result = cloudinary.uploader.upload(
        data,
        public_id=public_id,
        resource_type=_resource_type(content_type),
        overwrite=True,
    )
    return {"path": result["secure_url"], "size": result.get("bytes", len(data))}


def get_object(path: str) -> tuple[bytes, str]:
    """Fetches bytes from a stored file's public delivery URL."""
    resp = requests.get(path, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
