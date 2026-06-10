#!/bin/bash
PROJECT_DIR="/Users/LYU1/Documents/Codex/2026-06-10/structure-1-1-topics-facilitate-1"

# Kill any existing processes on these ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
cd "$PROJECT_DIR/backend" && python3 main.py &
BACKEND_PID=$!

# Start frontend
cd "$PROJECT_DIR/frontend" && npx vite --port 5173 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID (port 8000)"
echo "Frontend PID: $FRONTEND_PID (port 5173)"
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop both servers"

# Wait and trap
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
