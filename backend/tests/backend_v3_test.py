"""InviteCraft v3 tests: music presets + public preset serving."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')
API = f"{BASE_URL}/api"


def _wait_for_presets(min_count=7, timeout=30):
    deadline = time.time() + timeout
    last = []
    while time.time() < deadline:
        r = requests.get(f"{API}/music-presets", timeout=10)
        if r.status_code == 200:
            last = r.json()
            if len(last) >= min_count:
                return last
        time.sleep(2)
    return last


class TestMusicPresets:
    def test_list_has_7_presets(self):
        presets = _wait_for_presets(7, timeout=40)
        assert len(presets) >= 7, f"Only {len(presets)} presets seeded: {[p.get('label') for p in presets]}"
        # Required fields
        for p in presets:
            for k in ("id", "label", "category", "storage_path", "content_type", "size", "created_at"):
                assert k in p, f"missing {k} in {p}"
            assert p["category"] in ("generic", "indian")
        labels = {p["label"] for p in presets}
        expected_indian = {"Sitar (Raga Yaman)", "Ceremonial Bell", "Temple Bell"}
        assert expected_indian.issubset(labels), f"Missing Indian labels; have {labels}"
        expected_generic = {"Ambient Piano", "Elegant Strings", "Cinematic", "Uplifting"}
        assert expected_generic.issubset(labels), f"Missing generic labels; have {labels}"
        pytest.presets = presets

    def test_indian_preset_public_serving(self):
        presets = _wait_for_presets(7, timeout=5)
        indian = [p for p in presets if p["category"] == "indian"]
        assert indian, "no indian presets"
        for p in indian:
            assert p["storage_path"].startswith("invitecraft/presets/audio/"), p
            r = requests.get(f"{API}/files/{p['storage_path']}", timeout=30)
            assert r.status_code == 200, f"{p['label']} -> {r.status_code} {r.text[:200]}"
            ct = r.headers.get("content-type", "")
            assert ct.startswith("audio/") or ct in ("application/ogg", "audio/ogg", "audio/mpeg"), ct
            assert len(r.content) > 100, f"empty body for {p['label']}"

    def test_generic_preset_public_serving(self):
        presets = _wait_for_presets(7, timeout=5)
        generic = [p for p in presets if p["category"] == "generic"]
        assert generic
        p = generic[0]
        r = requests.get(f"{API}/files/{p['storage_path']}", timeout=30)
        assert r.status_code == 200
        assert len(r.content) > 100

    def test_preset_no_auth_required(self):
        presets = _wait_for_presets(7, timeout=5)
        p = presets[0]
        # Explicitly no headers, no ?auth=
        r = requests.get(f"{API}/files/{p['storage_path']}")
        assert r.status_code == 200
