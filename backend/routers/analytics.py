"""Analytics and metrics endpoints."""

from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import AnalyticsMetric
from backend.models.schemas import AnalyticsSummary, MetricPoint

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary() -> AnalyticsSummary:
    from analytics.collector import MetricsCollector
    collector = MetricsCollector()
    return collector.get_summary()


@router.get("/metrics/{metric_name}", response_model=List[MetricPoint])
async def get_metric_history(
    metric_name: str,
    hours: int = 24,
    db: AsyncSession = Depends(get_db),
) -> List[MetricPoint]:
    since = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(AnalyticsMetric)
        .where(AnalyticsMetric.metric_name == metric_name)
        .where(AnalyticsMetric.recorded_at >= since)
        .order_by(AnalyticsMetric.recorded_at)
    )
    rows = result.scalars().all()
    return [MetricPoint(timestamp=row.recorded_at, value=row.metric_value) for row in rows]


@router.get("/dashboard")
async def get_dashboard_metrics() -> dict:
    from analytics.collector import MetricsCollector
    collector = MetricsCollector()
    return collector.get_dashboard_data()
