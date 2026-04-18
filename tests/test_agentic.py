import pytest
import json
from unittest.mock import MagicMock
from bro_cli.core.manager import Manager
from bro_cli.core.knowledge import KnowledgeBase
from pathlib import Path

def test_manager_flow(tmp_path):
    # Setup mocks
    mock_client = MagicMock()
    
    # Sequence of responses:
    # 1. Planner returns JSON list of steps
    # 2. Worker executes step 1
    # 3. Worker executes step 2
    # 4. Reflection module summarizes
    mock_client.ask.side_effect = [
        '["mkdir test_dir", "touch test_dir/file.txt"]', # Planner
        "Directory created.",                           # Worker Step 1
        "File created.",                                # Worker Step 2
        "Successfully created directory and file."      # Reflection
    ]
    
    db_path = tmp_path / "knowledge.db"
    kb = KnowledgeBase(db_path)
    manager = Manager(mock_client, kb)
    
    # Run the manager
    result = manager.run("Setup a test directory")
    
    # Verify results
    assert result == "File created."
    
    # Verify Knowledge Base storage
    episodes = kb.search_episodes("Setup")
    assert len(episodes) == 1
    assert episodes[0]["prompt"] == "Setup a test directory"
    assert episodes[0]["reflection"] == "Successfully created directory and file."
    
    # Verify mock calls
    assert mock_client.ask.call_count == 4

def test_manager_fallback(tmp_path):
    mock_client = MagicMock()
    # Planner returns trash, should fallback to single step
    mock_client.ask.side_effect = [
        "Not a JSON list", # Planner fails
        "Direct result",   # Worker execution of original prompt
        "Reflection"       # Reflection
    ]
    
    kb = KnowledgeBase(tmp_path / "kb.db")
    manager = Manager(mock_client, kb)
    
    result = manager.run("Simple task")
    assert result == "Direct result"

def test_knowledge_base_search(tmp_path):
    kb = KnowledgeBase(tmp_path / "kb.db")
    kb.add_episode("test prompt", ["step1"], "outcome", "reflection")
    
    results = kb.search_episodes("test")
    assert len(results) == 1
    assert results[0]["prompt"] == "test prompt"
    
    results = kb.search_episodes("notfound")
    assert len(results) == 0
