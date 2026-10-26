#!/usr/bin/env python3
"""
ParkGuard — Administrative Setup CLI
Securely creates or resets a Super Administrator account without exposing plaintext credentials.
"""

import sys
import os
import getpass
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.audit_log import AuditLog


def setup_admin():
    print("=" * 60)
    print(" PARKGUARD — SUPER ADMINISTRATOR INITIALIZATION & RESET CLI")
    print("=" * 60)

    # Ensure schema exists
    Base.metadata.create_all(bind=engine)

    email = input("Enter Administrator Email [default: admin@parkguard.com]: ").strip() or "admin@parkguard.com"
    full_name = input("Enter Full Name [default: Super Administrator]: ").strip() or "Super Administrator"

    password = getpass.getpass("Enter Secure Password (min 8 characters): ")
    if len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm Secure Password: ")
    if password != confirm_password:
        print("Error: Passwords do not match.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower()).first()
        if user:
            print(f"\nUser '{email}' already exists. Updating password and ensuring super_admin role...")
            user.hashed_password = hash_password(password)
            user.role = "super_admin"
            user.is_active = True
            if full_name:
                user.full_name = full_name
            db.commit()

            audit = AuditLog(
                actor_id=user.id,
                actor_email=user.email,
                action="ADMIN_PASSWORD_RESET_CLI",
                resource_type="auth",
                resource_id=str(user.id),
                outcome="SUCCESS",
                details="Admin credentials updated via CLI tool."
            )
            db.add(audit)
            db.commit()
            print(f"Successfully updated credentials for Super Admin: {email}")
        else:
            new_admin = User(
                email=email.lower(),
                full_name=full_name,
                hashed_password=hash_password(password),
                role="super_admin",
                is_active=True,
                department="Administration"
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)

            audit = AuditLog(
                actor_id=new_admin.id,
                actor_email=new_admin.email,
                action="ADMIN_CREATE_CLI",
                resource_type="auth",
                resource_id=str(new_admin.id),
                outcome="SUCCESS",
                details="Initial Super Admin created via CLI tool."
            )
            db.add(audit)
            db.commit()
            print(f"\nSuccessfully created new Super Administrator: {email}")

    except Exception as e:
        print(f"\nDatabase error occurred: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

    print("\nAdministrator is ready to sign in at http://localhost:5173/")
    print("=" * 60)


if __name__ == "__main__":
    setup_admin()
