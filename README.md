# 1:1 Facilitator

A tool to structure 1:1 meeting topics, facilitate discussions, track action items, and generate time-based highlight reports.

## Features

- **Topic management** — Add, edit, categorize, and resolve topics during your 1:1
- **Auto carry-forward** — Unresolved topics from the previous meeting automatically flow into the next
- **Action item tracking** — Track action items with status (pending → in_progress → completed/cancelled), assignee, and due date
- **Reports** — Filter by person + date range to get topic highlights, action item status summaries, and meeting stats

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + Vite + Tailwind CSS 4

## Getting Started

```bash
# Clone
git clone https://github.com/Whatever-Lily/1-1-Facilitator.git
cd 1-1-Facilitator

# Install frontend dependencies & build
cd frontend && npm install && npm run build && cd ..

# Run
python3 backend/serve.py
```

Open http://localhost:8000

## Data

All data is stored in `backend/one_on_one.db` (SQLite). Delete this file to reset.
