from datetime import datetime, timedelta, timezone

from jose import JWTError

from src.security.tokens import create_access_token, decode_access_token


def test_create_and_decode_access_token_contains_sub():
    token = create_access_token(subject="user-123")
    payload = decode_access_token(token)
    assert payload.get("sub") == "user-123"


def test_decode_expired_token_raises():
    # tokens.create_access_token supports minutes, not timedelta
    token = create_access_token(subject="user-123", expires_minutes=-1)

    try:
        decode_access_token(token)
        assert False, "Expected JWTError for expired token"
    except JWTError:
        assert True
