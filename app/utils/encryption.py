from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings


def _derive_fernet_key() -> bytes:
    key = settings.DB_ENCRYPTION_KEY.encode("utf-8")
    digest = hashlib.sha256(key).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_fernet_key())


def encrypt_password(plain_password: str) -> str:
    return _fernet.encrypt(plain_password.encode("utf-8")).decode("utf-8")


def decrypt_password(encrypted_password: str) -> str:
    return _fernet.decrypt(encrypted_password.encode("utf-8")).decode("utf-8")
