from datetime import datetime, timedelta, timezone

from conftest import auth_headers


def test_root_is_public(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_signup_and_login_returns_token(client):
    resp = client.post(
        "/users/",
        json={"name": "Alice", "email": "alice@example.com", "phone": None, "password": "pw123"},
    )
    assert resp.status_code == 200, resp.text

    resp = client.post("/auth/login", data={"username": "alice@example.com", "password": "pw123"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_protected_rooms_requires_auth(client):
    resp = client.get("/rooms/")
    assert resp.status_code in (401, 403)


def test_rooms_crud_authorized(client):
    headers = auth_headers(client)

    payload = {
        "name": "Room A",
        "capacity": 4,
        "opening_hours": "09:00:00",
        "closing_hours": "18:00:00",
    }
    resp = client.post("/rooms/", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    room = resp.json()
    assert room["name"] == "Room A"

    resp = client.get("/rooms/", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_bookings_flow_authorized(client):
    headers = auth_headers(client)

    room_resp = client.post(
        "/rooms/",
        json={"name": "Room B", "capacity": 2, "opening_hours": None, "closing_hours": None},
        headers=headers,
    )
    assert room_resp.status_code == 200, room_resp.text
    room_id = room_resp.json()["id"]

    users_resp = client.get("/users/", headers=headers)
    assert users_resp.status_code == 200
    user_id = users_resp.json()[0]["id"]

    start = datetime.now(timezone.utc)
    end = start + timedelta(hours=1)

    booking_payload = {
        "room_id": room_id,
        "user_id": user_id,
        "title": "Standup",
        "amount_of_people": 2,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }
    create_resp = client.post("/bookings/", json=booking_payload, headers=headers)
    assert create_resp.status_code == 200, create_resp.text
    booking_id = create_resp.json()["id"]

    get_resp = client.get(f"/bookings/{booking_id}", headers=headers)
    assert get_resp.status_code == 200


def test_users_list_requires_auth(client):
    resp = client.post(
        "/users/",
        json={"name": "Bob", "email": "bob@example.com", "phone": None, "password": "pw"},
    )
    assert resp.status_code == 200

    resp = client.get("/users/")
    assert resp.status_code in (401, 403)
