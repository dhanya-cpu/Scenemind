"""Mapping and SLAM endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import MapRecord
from backend.models.schemas import MapInfo, OccupancyGrid, Position

router = APIRouter(prefix="/mapping", tags=["Mapping"])


@router.get("/maps", response_model=List[MapInfo])
async def list_maps(db: AsyncSession = Depends(get_db)) -> List[MapInfo]:
    result = await db.execute(select(MapRecord).order_by(MapRecord.created_at.desc()))
    return list(result.scalars().all())


@router.get("/active", response_model=OccupancyGrid)
async def get_active_map() -> OccupancyGrid:
    from mapping.slam import SLAMManager
    slam = SLAMManager()
    return slam.get_occupancy_grid()


@router.post("/maps/{map_id}/activate")
async def activate_map(map_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    from uuid import UUID
    await db.execute(
        MapRecord.__table__.update().values(is_active=False)
    )
    result = await db.execute(select(MapRecord).where(MapRecord.id == UUID(map_id)))
    map_record = result.scalar_one_or_none()
    if map_record:
        map_record.is_active = True
        await db.commit()
        return {"status": "activated", "map_id": map_id}
    return {"status": "not_found", "map_id": map_id}
