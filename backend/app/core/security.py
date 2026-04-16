import io
from cryptography.fernet import Fernet
from app.core.config import settings

def get_cipher():
    # Load from centralized settings
    key = settings.encryption_key_clean
    if not key:
        return None
    try:
        # Check if the key is valid base64
        return Fernet(key.encode())
    except Exception as e:
        print(f"Error initializing cipher: {e}")
        return None

def encrypt_key(plain_key: str) -> str:
    """Encrypts a plaintext API key."""
    if not plain_key:
        return plain_key
    cipher = get_cipher()
    if not cipher:
        print("⚠️ Warning: ENCRYPTION_KEY not set. Storing API key in plain text.")
        return plain_key 
    try:
        encrypted = cipher.encrypt(plain_key.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Encryption failed: {e}")
        return plain_key

def decrypt_key(encrypted_key: str) -> str:
    """Decrypts an encrypted API key."""
    if not encrypted_key:
        return encrypted_key
    cipher = get_cipher()
    if not cipher:
        return encrypted_key
    
    # Check if it looks like a Fernet token (starts with gAAAA...)
    if not encrypted_key.startswith("gAAAA"):
        # Likely plain text from before encryption was added
        return encrypted_key
        
    try:
        decrypted = cipher.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"Decryption failed: {e}")
        return encrypted_key
