#!/bin/bash

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
WHITE="\033[0;37m"
RESET="\033[0m"

# Global variables
SERVER_PID=""
PORT=8000
PYTHON_CMD="python3"
STATUS_FILE=".app-status"

# Determine the command to open URLs based on the OS
OPEN_CMD=""
# Start checking with 'open' for macOS
if command -v open &> /dev/null; then
    OPEN_CMD="open"
elif [[ "$OSTYPE" == "cygwin"* || "$OSTYPE" == "msys"* ]]; then
    # Windows environment (Git Bash, MSYS)
    if command -v powershell.exe &> /dev/null; then
        OPEN_CMD="powershell.exe start"
    elif command -v explorer.exe &> /dev/null; then
        OPEN_CMD="explorer.exe"
    elif command -v start &> /dev/null; then
        OPEN_CMD="start"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Could be standard Linux or WSL. Check for WSL.
    if grep -q -i microsoft /proc/version &> /dev/null; then
        # WSL detected
        if command -v powershell.exe &> /dev/null; then
            OPEN_CMD="powershell.exe start"
        elif command -v explorer.exe &> /dev/null; then
            OPEN_CMD="explorer.exe"
        elif command -v wslview &> /dev/null; then
             OPEN_CMD="wslview"
        fi
    else
        # Standard Linux, xdg-open should have been caught earlier, but maybe add a fallback?
        # If xdg-open wasn't found, there might not be a GUI.
        : # No specific action needed here if xdg-open wasn't found
    fi
elif command -v start &> /dev/null; then
    # Potentially native Windows cmd, try 'start'
    # If powershell.exe is available, it's likely better, but this is a fallback
    if command -v powershell.exe &> /dev/null; then
        OPEN_CMD="powershell.exe start"
    else
        OPEN_CMD="start"
    fi
fi

# Debug: Print the determined open command
# echo "Debug: Determined OPEN_CMD: $OPEN_CMD"

function check_requirements() {
    local missing_reqs=()
    local install_hints=()

    # 1. Check Python
    if ! command -v "$PYTHON_CMD" &> /dev/null; then
        # Try fallback 'python' if 'python3' isn't found
        if command -v python &> /dev/null; then
             PYTHON_CMD="python"
        else
             missing_reqs+=("Python ($PYTHON_CMD or python)")
             install_hints+=("  - Python: Install from https://www.python.org/ or your system's package manager (e.g., apt, brew, choco).")
        fi
    fi

    # 2. Check lsof (needed for list/stop by port)
    if ! command -v lsof &> /dev/null; then
        missing_reqs+=("lsof")
        # Provide OS-specific hints if possible
        local lsof_hint="  - lsof: Install using your system's package manager (e.g., 'sudo apt install lsof', 'brew install lsof'). Not typically available on standard Windows CMD."
         if [[ "$OSTYPE" == "cygwin"* || "$OSTYPE" == "msys"* ]]; then
             lsof_hint="  - lsof: Might be installable via Cygwin/MSYS package manager, or use alternative tools like 'netstat' (requires script changes)."
         elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
             # Check if it's WSL or standard Linux
             if ! grep -q -i microsoft /proc/version &> /dev/null; then
                 # Standard Linux (grep didn't find microsoft)
                 lsof_hint="  - lsof: Install using 'sudo apt install lsof' or similar Linux package manager."
             # Else: it's WSL, the default hint might be okay, or we could add a WSL-specific hint if needed
             # Currently, no specific WSL hint for lsof, as it's often installed via apt within WSL.
             fi
         elif [[ "$OSTYPE" == "darwin"* ]]; then
             lsof_hint="  - lsof: Usually pre-installed. If missing, try 'brew install lsof'."
         fi
         install_hints+=("$lsof_hint")
    fi

    # 3. Check Browser Opener
    if [ -z "$OPEN_CMD" ]; then
         missing_reqs+=("A command to open web browser (e.g., powershell, open, explorer.exe)")
         install_hints+=("  - Browser Opener: Ensure common commands like 'powershell.exe', 'open', 'explorer.exe', 'start', or 'wslview' are in your PATH.")
    fi

    # Report missing requirements
    if [ ${#missing_reqs[@]} -gt 0 ]; then
        echo -e "${YELLOW}Warning: The following required commands are missing:${RESET}"
        for item in "${missing_reqs[@]}"; do
            echo -e "  - ${WHITE}${item}${RESET}"
        done
        echo ""
        echo -e "${CYAN}Installation hints:${RESET}"
        for hint in "${install_hints[@]}"; do
            echo -e "${hint}"
        done
        echo ""
        
        # Prompt user
        read -p "Proceeding without these may cause errors. Continue anyway? [y/N] " -n 1 -r
        echo # Move to a new line
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Exiting due to missing requirements.${RESET}"
            exit 1
        else
            echo -e "${YELLOW}Proceeding despite missing requirements. Some commands might fail.${RESET}"
        fi
    fi
}

function display_header() {
    echo -e "${MAGENTA}==================================================${RESET}"
    echo -e "${CYAN}Scott Mitting Music Demos Application${RESET}"
    echo -e "${MAGENTA}==================================================${RESET}"
}

function start_server() {
    if [ -n "$SERVER_PID" ]; then
        echo -e "${YELLOW}Warning: Server is already running (PID: $SERVER_PID)${RESET}"
        return 1
    fi

    echo -e "${GREEN}Starting development server on port $PORT...${RESET}"
    
    # Try to start the server and redirect stderr to /dev/null to suppress Python stack traces
    $PYTHON_CMD -m http.server $PORT 2>/dev/null &
    SERVER_PID=$!
    
    # Wait a moment to check if the server started successfully
    sleep 1
    
    # Check if the process is still running
    if ! ps -p $SERVER_PID > /dev/null; then
        echo -e "${RED}Error: Failed to start server on port $PORT${RESET}"
        echo -e "${YELLOW}This might be because:"
        echo -e "  1. The port is already in use"
        echo -e "  2. Python is not installed or not in PATH"
        echo -e "  3. The Python command ($PYTHON_CMD) is incorrect"
        echo -e ""
        echo -e "${CYAN}Try these solutions:${RESET}"
        echo -e "  1. Stop any other server using port $PORT"
        echo -e "  2. Use a different port: ./app.sh start $PORT"
        echo -e "  3. Check if Python is installed and in PATH"
        echo -e "  4. Set the correct Python command: PYTHON_CMD=python ./app.sh start $PORT"
        return 1
    fi

    echo -e "${GREEN}Server started on port $PORT (PID: $SERVER_PID)${RESET}"
    echo -e "${CYAN}Access the site at: http://localhost:$PORT${RESET}"
    save_status
}

function save_status() {
    echo "PID=$SERVER_PID" > "$STATUS_FILE"
    echo "PORT=$PORT" >> "$STATUS_FILE"
}

function load_status() {
    if [ -f "$STATUS_FILE" ]; then
        source "$STATUS_FILE"
        if [ -n "$SERVER_PID" ] && ! ps -p $SERVER_PID > /dev/null; then
            # Clean up stale status file
            rm "$STATUS_FILE"
            SERVER_PID=""
            PORT=8000
        fi
    fi
}

function list_servers() {
    echo -e "${CYAN}Running web servers:${RESET}"
    echo -e "${WHITE}----------------------------------------${RESET}"
    
    # Capture the list of servers first
    local server_list=$(lsof -i -n -P | grep LISTEN | grep -E "python|http.server")
    
    if [ -z "$server_list" ]; then
        echo -e "${YELLOW}(none)${RESET}"
    else
        echo "$server_list" | while IFS= read -r line; do
            local pid=$(echo "$line" | awk '{print $2}')
            local port_info=$(echo "$line" | awk '{print $9}') # e.g., *:8000 or 127.0.0.1:8000
            local port=$(echo "$port_info" | awk -F':' '{print $NF}') # Get the last part after ':'
            echo -e "${GREEN}Port: ${WHITE}$port${GREEN} - PID: ${WHITE}$pid${RESET}"
        done
    fi
    
    echo -e "${WHITE}----------------------------------------${RESET}"
}

function status_server() {
    local target_port=$1

    if [ -n "$target_port" ]; then
        # Check using lsof for the specified port
        local pid=$(lsof -t -i :$target_port)
        if [ -n "$pid" ]; then
            echo -e "${GREEN}Server is running on port $target_port (PID: $pid).${RESET}"
        else
            echo -e "${YELLOW}No server is running on port $target_port.${RESET}"
        fi
    else
        # Fallback to using .app-status file
        load_status
        if [ -n "$SERVER_PID" ] && [ -n "$PORT" ]; then
            echo -e "${GREEN}Tracked server is running on port $PORT (PID: $SERVER_PID).${RESET}"
        else
            echo -e "${YELLOW}No server currently tracked by status file.${RESET}"
        fi
    fi
}

function stop_server() {
    local target_port=$1
    local pid_to_kill=""

    if [ -n "$target_port" ]; then
        # Use lsof to find the PID listening on the target port
        pid_to_kill=$(lsof -t -i :$target_port)
        if [ -z "$pid_to_kill" ]; then
            echo -e "${YELLOW}Warning: No process found on port $target_port.${RESET}"
            return 1
        fi
    else
        # Fallback to using .app-status file
        load_status
        if [ -z "$SERVER_PID" ]; then
            echo -e "${YELLOW}Warning: No server currently tracked by status file.${RESET}"
            return 1
        fi
        pid_to_kill="$SERVER_PID"
    fi

    # Attempt to kill the process
    if kill $pid_to_kill &> /dev/null; then
        echo -e "${GREEN}Successfully stopped server (PID: $pid_to_kill).${RESET}"
        # Clear status file if we used it
        if [ -z "$target_port" ]; then
            echo -n > "$STATUS_FILE"
        fi
    else
        echo -e "${RED}Error: Failed to stop server (PID: $pid_to_kill).${RESET}"
        return 1
    fi
}

function test_site() {
    load_status
    if [ -z "$SERVER_PID" ]; then
        start_server
        # Add a small delay to ensure the server is ready before opening the browser
        sleep 1
    fi

    local url_to_open
    if [ -z "$1" ]; then
        echo -e "${GREEN}Opening main site...${RESET}"
        url_to_open="http://localhost:$PORT"
    else
        echo -e "${GREEN}Opening song player for: $1${RESET}"
        url_to_open="http://localhost:$PORT/demos/player.html#$1"
    fi

    # Use the globally determined OPEN_CMD
    if [ -n "$OPEN_CMD" ]; then
        echo -e "${CYAN}Using command: $OPEN_CMD $url_to_open${RESET}"
        # Execute the command. PowerShell and others should handle the URL directly.
        $OPEN_CMD "$url_to_open"
    else
        echo -e "${YELLOW}Warning: Could not automatically determine command to open browser. Please open manually:${RESET}"
        echo -e "  ${WHITE}$url_to_open${RESET}"
        return 1
    fi
}

function show_help() {
    display_header
    echo -e "${CYAN}Usage: ${WHITE}./app.sh ${CYAN}[command]${RESET}"
    echo -e "${CYAN}Commands:${RESET}"
    echo -e "  ${WHITE}start${RESET} - Start the development server"
    echo -e "  ${WHITE}stop${RESET} - Stop the development server"
    echo -e "  ${WHITE}status${RESET} - Check if the server is running"
    echo -e "  ${WHITE}test${RESET} - Run tests"
    echo -e "  ${WHITE}help${RESET} - Show this help message"
    echo -e ""
    echo -e "${CYAN}Configuration:${RESET}"
    echo -e "  ${WHITE}PORT=${RESET} - Port number (default: 8000)"
    echo -e "  ${WHITE}PYTHON_CMD=${RESET} - Python command (default: python3)"
    echo -e ""
    echo -e "${CYAN}Examples:${RESET}"
    echo -e "  ${WHITE}./app.sh start${RESET} - Start the server on default port"
    echo -e "  ${WHITE}./app.sh start 8080${RESET} - Start the server on port 8080"
    echo -e "  ${WHITE}./app.sh status${RESET} - Check server status"
    echo -e "  ${WHITE}./app.sh list${RESET} - List all running web servers"
    echo -e "  ${WHITE}./app.sh stop${RESET} - Stop the server using saved status"
    echo -e "  ${WHITE}./app.sh stop 2222${RESET} - Stop any server running on port 2222"
    echo -e "  ${WHITE}./app.sh test${RESET} - Test the main site"
    echo -e "  ${WHITE}./app.sh test stay-away-the-sad-ones${RESET} - Test the song player for a specific song"
}

# Main script execution
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

COMMAND=$1
OPTINAL_ARG=$2
shift

# Load server status
load_status

# Check requirements before executing commands
check_requirements

trap 'stop_server' SIGINT SIGTERM

# Execute command
case $COMMAND in
    start)
        if [ $OPTINAL_ARG -gt 1 ]; then
            PORT=$OPTINAL_ARG
            echo -e "${GREEN}Using custom port: $PORT${RESET}"
        fi
        start_server
        ;;
    stop)
        stop_server
        ;;
    test)
        test_site "$@"
        ;;
    status)
        status_server "$@"
        ;;
    list)
        list_servers
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${RESET}"
        show_help
        exit 1
        ;;
esac
