import asyncio
from sqlmodel import select
from app.db.session import async_session
from app.models.auth import Role, Permission, RolePermissionLink
from app.models.fitness import User, Session, Phase, DailyLog, WorkoutProgram, WorkoutDay, WorkoutExercise
from app.models.nutrition import FoodCategory, FoodItem
from app.models.nutrition_plan import NutritionPlan, Meal, MealItem

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
        await session.commit()
        
        # Seed Clients for Admin
        admin_stmt = select(User).where(User.email == "admin@efit.com")
        admin_user = (await session.execute(admin_stmt)).scalar_one_or_none()
        
        if admin_user:
            from app.models.fitness import Client
            clients_to_seed = [
                {
                    "coach_id": admin_user.id,
                    "full_name": "Nguyễn Văn An",
                    "phone": "0901234567",
                    "gender": "Nam",
                    "current_weight": 75.5,
                    "fitness_goal": "Cutting",
                    "status": "Active"
                },
                {
                    "coach_id": admin_user.id,
                    "full_name": "Trần Thị Bích",
                    "phone": "0912345678",
                    "gender": "Nữ",
                    "current_weight": 58.0,
                    "fitness_goal": "Maintaining",
                    "status": "Active"
                }
            ]
            
            for c_data in clients_to_seed:
                client_stmt = select(Client).where(Client.phone == c_data["phone"])
                existing_client = (await session.execute(client_stmt)).scalar_one_or_none()
                if not existing_client:
                    new_client = Client(**c_data)
                    session.add(new_client)
            await session.commit()
            
        # Seed Session Templates for Admin
        if admin_user:
            from app.models.fitness import Session, Phase, WorkoutProgram, WorkoutDay, WorkoutExercise
            from datetime import date, timedelta
            
            # Check if template already exists
            tpl_stmt = select(Session).where(Session.name == "Mẫu: Siết cơ 12 tuần", Session.is_template == True)
            existing_tpl = (await session.execute(tpl_stmt)).scalar_one_or_none()
            
            if not existing_tpl:
                # 1. Create Workout Program Template
                wp_template = WorkoutProgram(
                    user_id=admin_user.id,
                    name="PPL 6 ngày (Template)",
                    frequency_per_week=6,
                    notes="Chương trình Push/Pull/Legs cơ bản",
                    is_template=True
                )
                session.add(wp_template)
                await session.commit()
                await session.refresh(wp_template)
                
                wd = WorkoutDay(program_id=wp_template.id, day_label="Push", order=1)
                session.add(wd)
                await session.commit()
                await session.refresh(wd)
                
                we = WorkoutExercise(workout_day_id=wd.id, exercise_name="Bench Press", order=1, sets=3, reps="8-10")
                session.add(we)
                await session.commit()
                
                # 2. Create Session Template
                tpl_session = Session(
                    user_id=admin_user.id,
                    name="Mẫu: Siết cơ 12 tuần",
                    goal_type="Cutting",
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=84),
                    is_active=False,
                    status="Draft",
                    is_template=True
                )
                session.add(tpl_session)
                await session.commit()
                await session.refresh(tpl_session)
                
                # 3. Create Phases
                p1 = Phase(
                    session_id=tpl_session.id,
                    name="Phase 1 - Thích nghi",
                    description="Làm quen giáo án",
                    order=1,
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=28),
                    target_calories=2000,
                    workout_program_id=wp_template.id
                )
                session.add(p1)
                
                p2 = Phase(
                    session_id=tpl_session.id,
                    name="Phase 2 - Tăng tốc",
                    description="Giảm calories, tăng cường độ",
                    order=2,
                    start_date=date.today() + timedelta(days=29),
                    end_date=date.today() + timedelta(days=56),
                    target_calories=1800,
                    workout_program_id=wp_template.id
                )
                session.add(p2)
                await session.commit()
                
        print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
