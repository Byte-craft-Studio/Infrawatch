from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.firebase import get_report, update_report_status
from app.services.auth import verify_token

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str

VALID_STATUSES = ["pending", "in_progress", "resolved"]


from app.services.sse import broadcast
import json

@router.patch("/reports/{report_id}/status")
async def update_status(
    report_id: str,
    body: StatusUpdate,
    user: dict = Depends(verify_token)
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {VALID_STATUSES}"
        )

    existing = get_report(report_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")

    updated = update_report_status(report_id, body.status)

    # Broadcast to all connected dashboards
    await broadcast(json.dumps({
        "report_id": report_id,
        "status": body.status,
        "updated_by": user.get("uid")
    }))

    return {"message": "Status updated", "by": user.get("uid"), "report": updated}
from fastapi.responses import StreamingResponse
from app.services.sse import event_generator

@router.get("/events")
async def sse_endpoint():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )