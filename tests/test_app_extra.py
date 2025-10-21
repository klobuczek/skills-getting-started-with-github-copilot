from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_root_redirects_to_index():
    resp = client.get("/", follow_redirects=False)
    # Should redirect to /static/index.html
    assert resp.status_code in (301, 307, 302)
    assert resp.headers["location"].endswith("/static/index.html")


def test_duplicate_signup_returns_400():
    activity = "Programming Class"
    email = "duplicate.test@example.com"

    # Ensure clean state
    try:
        client.post(f"/activities/{activity}/unregister?email={email}")
    except Exception:
        pass

    # First signup should succeed
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200

    # Second signup should fail with 400
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400
    assert "already signed up" in r2.json().get("detail", "").lower()

    # Cleanup
    client.post(f"/activities/{activity}/unregister?email={email}")


def test_unregister_non_registered_email_returns_400():
    activity = "Gym Class"
    email = "not.registered@example.com"

    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 400
    assert "not signed up" in resp.json().get("detail", "").lower()


def test_non_existent_activity_returns_404():
    resp = client.post("/activities/NoSuchActivity/signup?email=test@example.com")
    assert resp.status_code == 404
    resp2 = client.post("/activities/NoSuchActivity/unregister?email=test@example.com")
    assert resp2.status_code == 404
