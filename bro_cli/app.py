import threading
import time
import uvicorn
import webview
from pathlib import Path

from .server import app

def run_server():
    """Run the FastAPI server in a separate thread."""
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

def main():
    """Launch the Desktop Application."""
    # Start the backend API server
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Give uvicorn a second to bind to port 8000
    time.sleep(1)

    # Resolve the absolute path to the beautiful HTML frontend
    current_dir = Path(__file__).parent
    html_path = current_dir / "ui" / "web" / "index.html"
    
    # Create the native desktop window pointing to our local HTML file
    # PyWebView uses the OS native renderer (Edge/WebKit/GTK)
    window = webview.create_window(
        "Bro-CLI", 
        url=f"file:///{html_path.resolve().as_posix()}", 
        width=1000, 
        height=750,
        min_size=(400, 600),
        background_color='#090a0f'
    )
    
    # Start the GUI loop
    webview.start(debug=False)

if __name__ == "__main__":
    main()
