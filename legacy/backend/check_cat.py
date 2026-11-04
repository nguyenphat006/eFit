import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:ERICSAMA%40123@localhost:5432/eFit')
    rows = await conn.fetch('SELECT code FROM foodcategory')
    print([r[0] for r in rows])
    await conn.close()

asyncio.run(main())
