from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import HTMLResponse

from .auth import verify_license_sync
from .main import _load_agent
from .config import load_config, save_config

app = FastAPI(title="Bro API")

# Allow webview or local UI to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    provider: str | None = None
    analyst_mode: bool = False

class ChatResponse(BaseModel):
    response: str
    
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not verify_license_sync():
        raise HTTPException(status_code=403, detail="License invalid or missing")
        
    try:
        agent = _load_agent(provider=req.provider, analyst_mode=req.analyst_mode)
        res = agent.run(req.prompt)
        return ChatResponse(response=str(res))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/api/status")
def status():
    return {"status": "ok", "license_valid": verify_license_sync()}

class ConfigData(BaseModel):
    provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None

@app.get("/api/config")
def get_settings():
    config = load_config()
    return {
        "provider": config.get("provider", "gemini"),
        "gemini_api_key": config.get("gemini_api_key", ""),
        "groq_api_key": config.get("groq_api_key", "")
    }

@app.post("/api/config")
def update_settings(data: ConfigData):
    save_config(
        gemini_api_key=data.gemini_api_key,
        groq_api_key=data.groq_api_key,
        provider=data.provider
    )
    return {"status": "success"}
