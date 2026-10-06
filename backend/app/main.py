from fastapi import FastAPI
from app.routes import reports, status

app = FastAPI(title="InfraWatch API", version="1.0.0")

# app.include_router(reports.router)   ← commented out until Muguna finishes
app.include_router(status.router)

@app.get("/")
def read_root():
    return {"message": "InfraWatch API is running"}