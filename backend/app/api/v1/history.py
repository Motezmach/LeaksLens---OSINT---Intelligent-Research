"""Search history endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from app.api.deps import CurrentUser, DBSession
from app.models.search import SearchQuery
from app.schemas.search import SearchHistoryItem

router = APIRouter()


@router.get("", response_model=List[SearchHistoryItem])
async def list_history(current_user: CurrentUser, db: DBSession) -> list[SearchQuery]:
    result = await db.execute(
        select(SearchQuery)
        .where(SearchQuery.owner_id == current_user.id)
        .order_by(SearchQuery.created_at.desc())
        .limit(200)
    )
    return list(result.scalars().all())


@router.delete("/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    query_id: uuid.UUID, current_user: CurrentUser, db: DBSession
) -> None:
    result = await db.execute(
        select(SearchQuery).where(
            SearchQuery.id == query_id, SearchQuery.owner_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    await db.delete(item)
    await db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(current_user: CurrentUser, db: DBSession) -> None:
    await db.execute(
        delete(SearchQuery).where(SearchQuery.owner_id == current_user.id)
    )
    await db.commit()
