"""InviteCraft v2 backend API tests.

Covers new v2 endpoints: uploads, files serving, guests CRUD, RSVP,
analytics, send-invites (graceful), video job creation, and the
extended invitation PATCH fields.
"""
import io
import os
import struct
import time
import uuid
import zlib
import pytest
import requests

# --- BASE URL ---
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')
    except Exception:
        pass
API = f"{BASE_URL}/api"


def _rand_email():
    return f"test.user+{uuid.uuid4().hex[:8]}@example.com"


def _make_png(w=8, h=8):
    """Create a valid tiny PNG image in memory."""
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b''.join(b'\x00' + b'\xff\x00\x00' * w for _ in range(h))
    idat = zlib.compress(raw)
    return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


def _make_wav():
    """Create a tiny valid RIFF/WAV blob."""
    # 44-byte header + a bit of silence
    data = b'\x00\x00' * 100
    hdr = (
        b'RIFF' + struct.pack('<I', 36 + len(data)) + b'WAVE'
        + b'fmt ' + struct.pack('<IHHIIHH', 16, 1, 1, 8000, 16000, 2, 16)
        + b'data' + struct.pack('<I', len(data))
    )
    return hdr + data


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def user_a():
    email = _rand_email()
    r = requests.post(f"{API}/auth/register",
                      json={"name": "V2 A", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200, r.text
    return {"email": email, **r.json()}


@pytest.fixture(scope="module")
def user_b():
    email = _rand_email()
    r = requests.post(f"{API}/auth/register",
                      json={"name": "V2 B", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200, r.text
    return {"email": email, **r.json()}


def auth_h(u):
    return {"Authorization": f"Bearer {u['token']}"}


@pytest.fixture(scope="module")
def uploaded_photo(user_a):
    png = _make_png()
    r = requests.post(f"{API}/upload/photo", headers=auth_h(user_a),
                      files={"file": ("t.png", png, "image/png")})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def invitation(user_a):
    r = requests.post(f"{API}/invitations", headers=auth_h(user_a),
                      json={"title": "V2 Test", "event_type": "wedding"})
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Auth regression ----------
class TestAuthRegression:
    def test_me(self, user_a):
        r = requests.get(f"{API}/auth/me", headers=auth_h(user_a))
        assert r.status_code == 200
        assert r.json()["email"] == user_a["email"]


# ---------- Uploads ----------
class TestPhotoUpload:
    def test_upload_valid_png(self, user_a):
        png = _make_png()
        r = requests.post(f"{API}/upload/photo", headers=auth_h(user_a),
                          files={"file": ("t.png", png, "image/png")})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["content_type"] == "image/png"
        assert d["size"] == len(png)
        assert d["path"] and "/photo/" in d["path"]
        pytest.photo_path = d["path"]

    def test_reject_non_image(self, user_a):
        r = requests.post(f"{API}/upload/photo", headers=auth_h(user_a),
                          files={"file": ("t.txt", b"hello", "text/plain")})
        assert r.status_code == 415, r.text

    def test_reject_too_large(self, user_a):
        big = b"\x00" * (6 * 1024 * 1024 + 100)
        r = requests.post(f"{API}/upload/photo", headers=auth_h(user_a),
                          files={"file": ("big.png", big, "image/png")})
        assert r.status_code == 413, r.text


class TestAudioUpload:
    def test_upload_valid_wav(self, user_a):
        wav = _make_wav()
        r = requests.post(f"{API}/upload/audio", headers=auth_h(user_a),
                          files={"file": ("s.wav", wav, "audio/wav")})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["content_type"] == "audio/wav"
        pytest.audio_path = d["path"]

    def test_reject_non_audio(self, user_a):
        r = requests.post(f"{API}/upload/audio", headers=auth_h(user_a),
                          files={"file": ("t.png", _make_png(), "image/png")})
        assert r.status_code == 415, r.text


# ---------- File download ----------
class TestFileServing:
    def test_owner_bearer(self, user_a, uploaded_photo):
        r = requests.get(f"{API}/files/{uploaded_photo['path']}", headers=auth_h(user_a))
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")

    def test_owner_query_token(self, user_a, uploaded_photo):
        r = requests.get(f"{API}/files/{uploaded_photo['path']}",
                         params={"auth": user_a["token"]})
        assert r.status_code == 200

    def test_non_owner_403(self, user_b, uploaded_photo):
        r = requests.get(f"{API}/files/{uploaded_photo['path']}", headers=auth_h(user_b))
        assert r.status_code == 403, r.text

    def test_referenced_file_is_public(self, user_a, uploaded_photo, invitation):
        # Attach the photo to invitation.photos, then a non-owner (no auth) should be able to fetch it.
        r = requests.patch(f"{API}/invitations/{invitation['id']}", headers=auth_h(user_a),
                           json={"photos": [{"url": f"/api/files/{uploaded_photo['path']}"}]})
        assert r.status_code == 200
        # No auth at all
        r2 = requests.get(f"{API}/files/{uploaded_photo['path']}")
        assert r2.status_code == 200


# ---------- PATCH new fields ----------
class TestInvitationV2Fields:
    def test_patch_new_fields(self, user_a, invitation):
        payload = {
            "envelope_style": "indian",
            "effects": ["petals", "confetti"],
            "music_url": "https://example.com/song.mp3",
            "music_label": "Song",
            "scratch_reveal": True,
            "video_url": "",
        }
        r = requests.patch(f"{API}/invitations/{invitation['id']}", headers=auth_h(user_a),
                           json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        for k, v in payload.items():
            assert d[k] == v, f"{k} mismatch: {d.get(k)} != {v}"


# ---------- Guests CRUD ----------
class TestGuests:
    def test_add_guests_bulk_dedupes(self, user_a, invitation):
        payload = {"guests": [
            {"name": "Alice", "email": "alice@example.com"},
            {"name": "Bob", "email": "bob@example.com"},
            {"name": "Alice Dup", "email": "ALICE@example.com"},  # dedupe
        ]}
        r = requests.post(f"{API}/invitations/{invitation['id']}/guests",
                          headers=auth_h(user_a), json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["total"] == 2, d
        pytest.guest_ids = [g["id"] for g in d["added"]]

    def test_list_guests_owner_only(self, user_a, invitation):
        r = requests.get(f"{API}/invitations/{invitation['id']}/guests",
                         headers=auth_h(user_a))
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_list_guests_non_owner_404(self, user_b, invitation):
        r = requests.get(f"{API}/invitations/{invitation['id']}/guests",
                         headers=auth_h(user_b))
        assert r.status_code == 404

    def test_delete_guest(self, user_a, invitation):
        gid = pytest.guest_ids[0]
        r = requests.delete(f"{API}/invitations/{invitation['id']}/guests/{gid}",
                            headers=auth_h(user_a))
        assert r.status_code == 200
        r2 = requests.get(f"{API}/invitations/{invitation['id']}/guests",
                          headers=auth_h(user_a))
        assert not any(g["id"] == gid for g in r2.json())


# ---------- Public RSVP ----------
class TestPublicRSVP:
    def test_rsvp_new_guest(self, invitation):
        r = requests.post(f"{API}/public/{invitation['share_id']}/rsvp",
                          json={"email": "new@example.com", "name": "New",
                                "status": "yes", "note": "See you!"})
        assert r.status_code == 200
        assert r.json()["status"] == "yes"

    def test_rsvp_existing_updates(self, user_a, invitation):
        # bob was added earlier, should update
        r = requests.post(f"{API}/public/{invitation['share_id']}/rsvp",
                          json={"email": "BOB@example.com", "status": "maybe"})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/invitations/{invitation['id']}/guests",
                          headers=auth_h(user_a))
        bob = next(g for g in r2.json() if g["email"] == "bob@example.com")
        assert bob["status"] == "maybe"

    def test_rsvp_invalid_status(self, invitation):
        r = requests.post(f"{API}/public/{invitation['share_id']}/rsvp",
                          json={"email": "x@example.com", "status": "banana"})
        assert r.status_code == 422

    def test_rsvp_404(self):
        r = requests.post(f"{API}/public/nope/rsvp",
                          json={"email": "x@example.com", "status": "yes"})
        assert r.status_code == 404


# ---------- Analytics ----------
class TestAnalytics:
    def test_public_view_increments_and_analytics(self, user_a, invitation):
        # Hit public a couple of times.
        for _ in range(2):
            requests.get(f"{API}/public/{invitation['share_id']}")
        time.sleep(0.5)
        r = requests.get(f"{API}/invitations/{invitation['id']}/analytics",
                         headers=auth_h(user_a))
        assert r.status_code == 200
        d = r.json()
        assert d["views_total"] >= 2
        assert "views_unique" in d
        assert d["guests_total"] >= 1
        assert "rsvp_counts" in d and "yes" in d["rsvp_counts"]
        assert isinstance(d["views_by_day"], list)

    def test_analytics_requires_auth(self, invitation):
        r = requests.get(f"{API}/invitations/{invitation['id']}/analytics")
        assert r.status_code in (401, 403)

    def test_analytics_non_owner_404(self, user_b, invitation):
        r = requests.get(f"{API}/invitations/{invitation['id']}/analytics",
                         headers=auth_h(user_b))
        assert r.status_code == 404


# ---------- Send invites (graceful w/o Resend) ----------
class TestSendInvites:
    def test_send_without_resend_key(self, user_a, invitation):
        r = requests.post(f"{API}/invitations/{invitation['id']}/send-invites",
                          headers=auth_h(user_a), json={})
        assert r.status_code == 400, r.text
        detail = r.json().get("detail", "")
        assert "configured" in detail.lower() or "resend" in detail.lower()


# ---------- Video (Sora 2) - just verify job creation ----------
class TestVideo:
    def test_generate_video_queued(self, user_a):
        r = requests.post(f"{API}/ai/generate-video", headers=auth_h(user_a),
                          json={"prompt": "candles glowing softly", "duration": 4, "size": "1024x1792"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "job_id" in d
        assert d["status"] == "queued"
        pytest.video_job_id = d["job_id"]

    def test_invalid_duration(self, user_a):
        r = requests.post(f"{API}/ai/generate-video", headers=auth_h(user_a),
                          json={"prompt": "x", "duration": 5, "size": "1024x1792"})
        assert r.status_code == 400

    def test_video_status(self, user_a):
        r = requests.get(f"{API}/ai/video-status/{pytest.video_job_id}",
                         headers=auth_h(user_a))
        assert r.status_code == 200
        d = r.json()
        assert d["status"] in ("queued", "running", "done", "failed")


# ---------- Cross-user isolation ----------
class TestIsolation:
    def test_non_owner_patch_404(self, user_b, invitation):
        r = requests.patch(f"{API}/invitations/{invitation['id']}",
                           headers=auth_h(user_b), json={"title": "hax"})
        assert r.status_code == 404

    def test_non_owner_add_guest_404(self, user_b, invitation):
        r = requests.post(f"{API}/invitations/{invitation['id']}/guests",
                          headers=auth_h(user_b),
                          json={"guests": [{"name": "x", "email": "x@example.com"}]})
        assert r.status_code == 404
