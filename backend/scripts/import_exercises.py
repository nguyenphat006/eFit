import asyncio
import json
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.fitness import Exercise
from app.models.auth import Role
from app.models.nutrition import FoodCategory
from app.models.nutrition_plan import NutritionPlan

from dotenv import load_dotenv
load_dotenv()

# Create async engine directly to avoid import issues
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://efit_user:efit_password@localhost:5432/efit_db")
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def import_data():
    dataset_path = r"D:\Coder\Github\ERICSS\exercises-dataset\data\exercises.json"
    print(f"Reading dataset from {dataset_path}...")
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} exercises. Inserting into database...")
    
    async with AsyncSessionLocal() as session:
        for index, item in enumerate(data):
            # The JSON schema is:
            # id, name, category, body_part, equipment, instructions, muscle_group, secondary_muscles, target, media_id
            
            ex = Exercise(
                name=item.get("name"),
                category=item.get("category"),
                body_part=item.get("body_part"),
                equipment=item.get("equipment"),
                target=item.get("target"),
                muscle_group=item.get("muscle_group"),
                secondary_muscles=item.get("secondary_muscles"),
                instructions=item.get("instructions"),
                media_id=item.get("media_id")
            )
            session.add(ex)
            
            if index % 100 == 0:
                print(f"Processed {index} records...")
                await session.commit()
                
        await session.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(import_data())
