from __future__ import annotations
import os, sys

# Ensure we're in the project root
project_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(project_dir, "..", "frontend", "dist")
sys.path.insert(0, project_dir)
os.chdir(project_dir)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import the API app
from main import app

# Mount static assets
assets_dir = os.path.join(dist_dir, "assets")
app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Catch-all for SPA routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str = ""):
    return FileResponse(os.path.join(dist_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
