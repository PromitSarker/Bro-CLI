import PyInstaller.__main__
import sys

PyInstaller.__main__.run([
    'bro_cli/app.py',
    '--name=Bro-CLI',
    '--noconsole',  # Hide the terminal window
    '--onedir',     # Create a directory rather than a single file (starts faster and easier to debug)
    # '--onefile',  # Uncomment this and comment --onedir if you strictly want a single .exe file
    '--add-data=bro_cli/ui;bro_cli/ui',  # Include the UI HTML/CSS files
    '--hidden-import=uvicorn.logging',
    '--hidden-import=uvicorn.loops',
    '--hidden-import=uvicorn.loops.auto',
    '--hidden-import=uvicorn.protocols',
    '--hidden-import=uvicorn.protocols.http',
    '--hidden-import=uvicorn.protocols.http.auto',
    '--hidden-import=uvicorn.protocols.websockets',
    '--hidden-import=uvicorn.protocols.websockets.auto',
    '--hidden-import=uvicorn.lifespan',
    '--hidden-import=uvicorn.lifespan.on',
    '--hidden-import=uvicorn.lifespan.off',
    '--hidden-import=pywebview',
    '--clean',
])
