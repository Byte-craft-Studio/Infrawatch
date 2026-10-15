from fastapi import APIRouter, HTTPException
from app.models.report import ReportCreate, ReportResponse
from app.services.firebase import create_report, get_all_reports, get_report

router = APIRouter()

@router.post("/report", response_model=ReportResponse)
def submit_report(report: ReportCreate):
    try:
        created = create_report(report.dict())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")

@router.get("/reports")
def list_reports():
    try:
        return get_all_reports()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/reports/{report_id}")
def get_single_report(report_id: str):
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report