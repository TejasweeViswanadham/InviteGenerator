"""Backend API tests for InviteCraft."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invite-generator-9.preview.emergentagent.com').rstrip('/')
# Fallback: also try to read from frontend/.env directly
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


@pytest.fixture(scope="module")
def user_a():
    email = _rand_email()
    r = requests.post(f"{API}/auth/register", json={"name": "User A", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"], "password": "TestPass123!"}


@pytest.fixture(scope="module")
def user_b():
    email = _rand_email()
    r = requests.post(f"{API}/auth/register", json={"name": "User B", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"], "password": "TestPass123!"}


def auth_h(u):
    return {"Authorization": f"Bearer {u['token']}"}


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_user(self, user_a):
        assert user_a["token"]
        assert user_a["user"]["email"] == user_a["email"]
        assert "id" in user_a["user"]

    def test_register_duplicate_400(self, user_a):
        r = requests.post(f"{API}/auth/register", json={"name": "Dup", "email": user_a["email"], "password": "TestPass123!"})
        assert r.status_code == 400

    def test_login_success(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": user_a["password"]})
        assert r.status_code == 200
        d = r.json()
        assert d["token"] and d["user"]["email"] == user_a["email"]

    def test_login_invalid(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_me_returns_user(self, user_a):
        r = requests.get(f"{API}/auth/me", headers=auth_h(user_a))
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == user_a["email"]
        assert "password_hash" not in d

    def test_me_no_token_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)


# ---------- Invitations ----------
class TestInvitations:
    def test_initial_list_empty(self, user_a):
        r = requests.get(f"{API}/invitations", headers=auth_h(user_a))
        assert r.status_code == 200
        assert r.json() == []

    def test_create_invitation(self, user_a):
        payload = {
            "title": "Anna & Ethan",
            "event_type": "wedding",
            "hosts": "Anna & Ethan",
            "date_text": "June 12, 2026",
            "message": "Join us for our special day.",
            "background_url": "https://example.com/bg.jpg",
            "accent_color": "#D97757",
            "heading_font": "'Cormorant Garamond', serif",
            "body_font": "'Outfit', sans-serif",
            "overlay_opacity": 0.4,
        }
        r = requests.post(f"{API}/invitations", headers=auth_h(user_a), json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["id", "share_id", "user_id", "created_at", "updated_at"]:
            assert k in d
        assert d["title"] == payload["title"]
        assert d["user_id"] == user_a["user"]["id"]
        pytest.inv_id = d["id"]
        pytest.share_id = d["share_id"]

    def test_get_invitation(self, user_a):
        r = requests.get(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_a))
        assert r.status_code == 200
        assert r.json()["id"] == pytest.inv_id

    def test_patch_invitation_partial(self, user_a):
        # small sleep to ensure updated_at differs
        time.sleep(1)
        r0 = requests.get(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_a))
        old = r0.json()
        r = requests.patch(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_a),
                           json={"title": "New Title"})
        assert r.status_code == 200
        d = r.json()
        assert d["title"] == "New Title"
        assert d["hosts"] == old["hosts"]  # preserved
        assert d["updated_at"] != old["updated_at"]

    def test_public_view_no_auth(self):
        r = requests.get(f"{API}/public/{pytest.share_id}")
        assert r.status_code == 200
        d = r.json()
        assert "user_id" not in d
        assert d["share_id"] == pytest.share_id

    def test_public_view_404(self):
        r = requests.get(f"{API}/public/nonexistent123")
        assert r.status_code == 404

    def test_cross_user_isolation_get(self, user_b):
        r = requests.get(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_b))
        assert r.status_code == 404

    def test_cross_user_isolation_patch(self, user_b):
        r = requests.patch(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_b),
                           json={"title": "Hacked"})
        assert r.status_code == 404

    def test_cross_user_isolation_delete(self, user_b):
        r = requests.delete(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_b))
        assert r.status_code == 404

    def test_delete_and_verify(self, user_a):
        r = requests.delete(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_a))
        assert r.status_code == 200
        r2 = requests.get(f"{API}/invitations/{pytest.inv_id}", headers=auth_h(user_a))
        assert r2.status_code == 404


# ---------- AI ----------
class TestAI:
    def test_generate_text(self, user_a):
        r = requests.post(f"{API}/ai/generate-text", headers=auth_h(user_a),
                          json={"event_type": "wedding", "vibe": "elegant",
                                "details": "Anna and Ethan, June 2026"},
                          timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert any(d.get(k) for k in ["title", "subtitle", "message"])

    def test_generate_image(self, user_a):
        r = requests.post(f"{API}/ai/generate-image", headers=auth_h(user_a),
                          json={"prompt": "soft cream florals", "event_type": "wedding"},
                          timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["data_url"].startswith("data:image/")
        assert ";base64," in d["data_url"]
