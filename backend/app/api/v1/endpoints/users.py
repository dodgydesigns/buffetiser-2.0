from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user import UserCreate, UserRead
from app.crud.user import get_user_by_email, create_user

router = APIRouter(prefix="", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users", response_model=UserRead)
def create_new_user(*, db: Session = Depends(get_db), user: UserCreate):
    existing = get_user_by_email(db, email=user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)
