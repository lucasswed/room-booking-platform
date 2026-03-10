from src.security.passwords import hash_password, verify_password


def test_hash_and_verify_roundtrip():
    hashed = hash_password("secret")
    assert hashed
    assert hashed != "secret"
    assert verify_password("secret", hashed) is True
    assert verify_password("wrong", hashed) is False
