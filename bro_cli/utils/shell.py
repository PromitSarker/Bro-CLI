import os
import subprocess
from typing import Tuple, Optional
from bro_cli.ui.terminal import console, print_command_panel, Confirm

def run_and_confirm_command(command: str, cwd: Optional[str] = None) -> Tuple[str, Optional[str]]:
    """Displays, confirms, and executes a shell command. Returns (output, updated_cwd)."""
    # Detect potential CWD change (simulation)
    new_cwd = cwd or os.getcwd()
    if command.strip().startswith("cd "):
        try:
            target = command.strip()[3:].strip().split(';')[0].split('&&')[0].strip()
            target = os.path.expanduser(target)
            temp_cwd = os.path.abspath(os.path.join(new_cwd, target))
            if os.path.isdir(temp_cwd):
                new_cwd = temp_cwd
        except Exception:
            pass

    # Auto-sanitize heavy search commands to suppress Permission Denied noise
    search_tools = ["find", "grep", "locate"]
    parts = command.split()
    if parts and parts[0] in search_tools and "2>/dev/null" not in command:
        command = f"{command} 2>/dev/null"

    # Display the command in a clean panel
    print_command_panel(command)
    
    if not Confirm.ask("[prompt]Execute this command?[/prompt]", default=False):
        return "User refused to execute the command.", cwd

    try:
        # Use shell=True for full terminal capability
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=False,
            cwd=cwd
        )
        output = result.stdout + result.stderr
        if not output.strip():
            output = "(Command executed with no output)"
        
        # Show output snippet to the user
        if output.strip():
            console.print("[dim]Output snippet:[/dim]")
            snippet = output.strip()[:500] + ("..." if len(output) > 500 else "")
            console.print(f"[dim]{snippet}[/dim]")

        # Context reduction for the AI
        agent_output = output
        if len(agent_output) > 1000:
            agent_output = agent_output[:1000] + "\n... (omitted for brevity)"
            
        return agent_output, new_cwd
    except Exception as e:
        return f"Error executing command: {str(e)}", cwd
