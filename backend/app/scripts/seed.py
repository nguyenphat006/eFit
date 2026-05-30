import asyncio
from sqlmodel import select
from app.db.session import async_session
from app.models.auth import Role, Permission
from app.models.fitness import User

async def seed_data():
    async with async_session() as session:
        # Define permissions
        permissions = [
            {"name": "manage_users", "description": "Can manage user accounts"},
            {"name": "manage_roles", "description": "Can manage roles and permissions"},
            {"name": "view_logs", "description": "Can view all daily logs"},
            {"name": "manage_own_logs", "description": "Can manage own daily logs"},
        ]
        
        db_permissions = []
        for p in permissions:
            stmt = select(Permission).where(Permission.name == p["name"])
            res = await session.execute(stmt)
            existing_p = res.scalar_one_or_none()
            if not existing_p:
                new_p = Permission(**p)
                session.add(new_p)
                db_permissions.append(new_p)
            else:
                db_permissions.append(existing_p)
                
        await session.commit()
        for p in db_permissions:
            await session.refresh(p)
            
        # Define roles
        admin_perms = db_permissions
        member_perms = [p for p in db_permissions if p.name in ["manage_own_logs"]]
        
        roles = [
            {"name": "Admin", "description": "Administrator with full access", "perms": admin_perms},
            {"name": "Member", "description": "Standard user", "perms": member_perms},
        ]
        
        for r in roles:
            stmt = select(Role).where(Role.name == r["name"])
            res = await session.execute(stmt)
            existing_r = res.scalar_one_or_none()
            if not existing_r:
                new_r = Role(name=r["name"], description=r["description"])
                new_r.permissions = r["perms"]
                session.add(new_r)
                
        await session.commit()
        
        # Seed Admin User
        admin_stmt = select(Role).where(Role.name == "Admin")
        admin_role = (await session.execute(admin_stmt)).scalar_one_or_none()
        
        member_stmt = select(Role).where(Role.name == "Member")
        member_role = (await session.execute(member_stmt)).scalar_one_or_none()
        
        from app.core.security import get_password_hash
        default_password = get_password_hash("admin123") # Reusing password for all seeds for simplicity
        
        users_to_seed = []
        if admin_role:
            users_to_seed.append({
                "email": "admin@efit.com",
                "full_name": "System Admin",
                "hashed_password": default_password,
                "role_id": admin_role.id
            })
            
        if member_role:
            users_to_seed.append({
                "email": "user1@efit.com",
                "full_name": "Test User 1",
                "hashed_password": default_password,
                "role_id": member_role.id
            })
            users_to_seed.append({
                "email": "trainer@efit.com",
                "full_name": "Pro Trainer",
                "hashed_password": default_password,
                "role_id": member_role.id
            })

        for u_data in users_to_seed:
            user_stmt = select(User).where(User.email == u_data["email"])
            existing_user = (await session.execute(user_stmt)).scalar_one_or_none()
            if not existing_user:
                new_user = User(**u_data)
                session.add(new_user)
                
        await session.commit()
                
        print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
