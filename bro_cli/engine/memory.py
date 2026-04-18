import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any

class KnowledgeBase:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS episodes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    prompt TEXT,
                    plan TEXT,
                    outcome TEXT,
                    reflection TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS narrative (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic TEXT UNIQUE,
                    content TEXT,
                    updated_at TEXT
                )
            """)

    def add_episode(self, prompt: str, plan: List[str], outcome: str, reflection: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO episodes (timestamp, prompt, plan, outcome, reflection) VALUES (?, ?, ?, ?, ?)",
                (datetime.now().isoformat(), prompt, json.dumps(plan), outcome, reflection)
            )

    def search_episodes(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            # Simple keyword search for now. 
            # In a more advanced version, we'd use embeddings.
            cursor = conn.execute(
                "SELECT prompt, outcome, reflection FROM episodes WHERE prompt LIKE ? OR reflection LIKE ? ORDER BY id DESC LIMIT ?",
                (f"%{query}%", f"%{query}%", limit)
            )
            results = []
            for row in cursor.fetchall():
                results.append({
                    "prompt": row[0],
                    "outcome": row[1],
                    "reflection": row[2]
                })
            return results

    def update_narrative(self, topic: str, content: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO narrative (topic, content, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(topic) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at",
                (topic, content, datetime.now().isoformat())
            )

    def get_narrative(self, topic: str) -> Optional[str]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT content FROM narrative WHERE topic = ?", (topic,))
            row = cursor.fetchone()
            return row[0] if row else None
