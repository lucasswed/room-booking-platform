import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import requests


def _get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def _wait_ready(url: str, timeout_s: float = 10.0) -> None:
    deadline = time.time() + timeout_s
    last_err: Exception | None = None
    while time.time() < deadline:
        try:
            r = requests.get(url, timeout=1)
            if r.status_code == 200:
                return
        except Exception as e:  # noqa: BLE001
            last_err = e
        time.sleep(0.2)
    raise RuntimeError(f"Server not ready at {url}: {last_err}")


def test_e2e_signup_login_and_access_protected(tmp_path: Path):
    db_path = tmp_path / "e2e.sqlite3"
    port = _get_free_port()

    env = os.environ.copy()
    env["ROOM_BOOKING_DB_PATH"] = str(db_path)
    env["SECRET_KEY"] = "dev-secret"
    env["ALGORITHM"] = "HS256"
    env["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

    # Ensure we can import `src` when running uvicorn as a module.
    repo_root = Path(__file__).resolve().parents[2]
    env["PYTHONPATH"] = str(repo_root)

    cmd = [sys.executable, "-m", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", str(port)]
    proc = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    base = f"http://127.0.0.1:{port}"
    try:
        _wait_ready(f"{base}/")

        signup = requests.post(
            f"{base}/users/",
            json={"name": "E2E", "email": "e2e@example.com", "phone": None, "password": "pw"},
            timeout=5,
        )
        assert signup.status_code == 200, signup.text

        login = requests.post(
            f"{base}/auth/login",
            data={"username": "e2e@example.com", "password": "pw"},
            timeout=5,
        )
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]

        rooms = requests.get(f"{base}/rooms/", headers={"Authorization": f"Bearer {token}"}, timeout=5)
        assert rooms.status_code == 200, rooms.text
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
