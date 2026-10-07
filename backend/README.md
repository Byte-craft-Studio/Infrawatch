# InfraWatch Backend

FastAPI backend for InfraWatch — a citizen infrastructure reporting platform for Machakos Hackfest 2026.

## Overview

This backend receives infrastructure reports from the mobile app, stores them in Firebase, and serves them to the admin dashboard. It also provides real-time updates via Server-Sent Events (SSE).

## Features

- **Report submission** — citizens send reports with photos and GPS coordinates
- **Report retrieval** — dashboard fetches all reports for map display
- **Status updates** — officials mark reports as pending, in progress, or resolved
- **Authentication** — Firebase ID token verification on protected endpoints
- **Real-time updates** — SSE stream pushes changes to the dashboard instantly
- **Mock mode** — runs without Firebase credentials for local development

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI |
| Server | Uvicorn |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Real-time | Server-Sent Events (SSE) |
| Validation | Pydantic |
| Environment | python-dotenv |


## Data Flow

1. Citizen submits report via mobile app
2. Mobile app sends POST /report with photo + GPS + type
3. Backend stores report in Firestore
4. Backend broadcasts event via SSE
5. Dashboard receives real-time update on /events stream
6. Dashboard displays new pin on map
7. Official updates status via PATCH /reports/{id}/status
8. Backend broadcasts status change via SSE
9. Dashboard updates pin color instantly

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/infrawatch-hackathon/infrawatch-backend.git
cd infrawatch-backend
