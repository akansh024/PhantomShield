from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/test")

@router.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {"message": f"Hello {user}, you are authenticated"}
