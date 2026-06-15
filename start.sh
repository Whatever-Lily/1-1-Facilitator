#!/bin/bash
PROJECT_DIR="/Users/LYU1/Documents/1:1 Facilitator"

# Kill any existing processes on these ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend in screen
screen -dmS backend bash -c "cd '$PROJECT_DIR/backend' && python3 main.py 2>&1 | tee /tmp/backend.log"

# Start frontend in screen
screen -dmS frontend bash -c "cd '$PROJECT_DIR/frontend' && ./node_modules/.bin/vite --port 5173 2>&1 | tee /tmp/frontend.log"

echo "Backend starting... (port 8000)"
echo "Frontend starting... (port 5173)"
echo "Open http://localhost:5173 in your browser"
echo ""
echo "To check status: screen -ls"
echo "To stop: screen -S backend -X quit && screen -S frontend -X quit"
