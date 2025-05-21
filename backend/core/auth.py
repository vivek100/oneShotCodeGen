import os
from fastapi import Depends, HTTPException, Header
from typing import Optional, Any
from supabase import create_client, Client
import jwt
from jwt.exceptions import InvalidTokenError

# Initialize Supabase client only in cloud mode
supabase: Optional[Client] = None
print("CLOUD_MODE", os.environ.get("CLOUD_MODE"))
if os.environ.get("CLOUD_MODE") == "true":
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)

async def get_authenticated_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Verify authentication token and return user info if valid.
    In open source mode, authentication is skipped.
    """
    # Skip authentication in open source mode
    if os.environ.get("CLOUD_MODE") != "true":
        return None

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401, detail="Invalid authentication scheme"
            )
            
        # Verify token using your JWT secret or Supabase
        # This is a simplified version - actual implementation depends on Supabase
        # JWT verification details
        try:
            # Replace with actual JWT verification using the Supabase JWT secret
            payload = jwt.decode(token, options={"verify_signature": False})
            return {"id": payload.get("sub")}
        except InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
