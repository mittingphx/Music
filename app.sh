#!/bin/bash

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
BROWN="\033[0;33m"
GREY="\033[0;37m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
WHITE="\033[0;37m"
RESET="\033[0m"

# Global variables
SERVER_PID=""
PORT=3000
PYTHON_CMD="python3"
SONG_PATH="./public/songs/"
APP_VERSION="0.1.0"

# Functions for colored output
print_warn() { echo -e "${YELLOW}Warning: $1${RESET}"; }
print_info() { echo -e "${CYAN}$1${RESET}"; }
print_error() { echo -e "${RED}Error: $1${RESET}"; }
print_success() { echo -e "${GREEN}$1${RESET}"; }

# Determine the command to open URLs based on availability
OPEN_CMD=""
for cmd in wslview "powershell.exe start" explorer.exe open start; do
    if command -v ${cmd%% *} &> /dev/null; then
        OPEN_CMD=$cmd
        break
    fi
done

# Detect WSL once
IS_WSL=$(grep -qi microsoft /proc/version && echo true || echo false)

function check_requirements() {
    local missing_reqs=()
    local install_hints=()

    # Check if Python is installed
    if ! command -v $PYTHON_CMD &> /dev/null; then
        print_info "Python is not installed. Installing Python..."
        
        # Try to install Python using apt
        if sudo apt-get update && sudo apt-get install -y python3 python3-pip; then
            print_success "Python installation successful"
        else
            print_error "Failed to install Python"
            print_info "Please install Python 3.7 or higher manually"
            exit 1
        fi
    fi

    if ! command -v "$PYTHON_CMD" &> /dev/null; then
        if command -v python &> /dev/null; then
            PYTHON_CMD="python"
        else
            missing_reqs+=("Python ($PYTHON_CMD or python)")
            install_hints+=("  - Python: Install from https://www.python.org/ or your system's package manager.")
        fi
    fi

    if ! command -v lsof &> /dev/null; then
        missing_reqs+=("lsof")
        install_hints+=("  - lsof: Install using 'sudo apt install lsof', 'brew install lsof', or your package manager.")
    fi

    if [ -z "$OPEN_CMD" ]; then
        missing_reqs+=("A command to open web browser")
        install_hints+=("  - Browser Opener: Ensure common commands like 'powershell.exe', 'open', 'explorer.exe', or 'wslview' are in your PATH.")
    fi

    if [ ${#missing_reqs[@]} -gt 0 ]; then
        print_warn "The following required commands are missing:"
        for item in "${missing_reqs[@]}"; do echo -e "  - ${WHITE}${item}${RESET}"; done
        echo ""
        print_info "Installation hints:"
        for hint in "${install_hints[@]}"; do echo -e "$hint"; done
        echo ""

        read -p "Proceeding without these may cause errors. Continue anyway? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Exiting due to missing requirements."
            exit 1
        else
            print_warn "Proceeding despite missing requirements. Some commands might fail."
        fi
    fi
}

function display_header() {
    echo -e "${YELLOW}Music Demos Application${RESET}"
    echo -e "${GREY}v${APP_VERSION} Six of Swords Entertainment${RESET}"
    echo -e ""
}

function find_running_server() {
    local server_info=$(lsof -i -n -P | grep LISTEN | grep -E "python|http.server" | grep ":$PORT")
    if [ -n "$server_info" ]; then
        SERVER_PID=$(echo "$server_info" | awk '{print $2}')
        return 0
    else
        SERVER_PID=""
        return 1
    fi
}

function start_server() {
    find_running_server
    if [ -n "$SERVER_PID" ]; then
        print_warn "Server is already running (PID: $SERVER_PID)"
        return 1
    fi
    
    # Check if public directory exists
    if [ ! -d "public" ]; then
        print_error "Public directory not found. Please create it and add your web files."
        return 1
    fi
    
    print_success "Starting development server on port $PORT..."
    # Change to public directory and start server
    (cd public && $PYTHON_CMD -m http.server $PORT 2>/dev/null) &
    SERVER_PID=$!
    sleep 1
    
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        print_error "Failed to start server on port $PORT"
        return 1
    fi
    
    print_success "Server started on port $PORT (PID: $SERVER_PID)"
    print_info "Access the site at: http://localhost:$PORT"
    print_info "The public directory is the root of the web server"
    print_info "Note: The server serves files from the public directory, so http://localhost:$PORT/ will show public/index.html"
}

function stop_server() {
    if [ -n "$1" ]; then
        # Stop specific port
        find_running_server
        if [ -z "$SERVER_PID" ]; then
            print_warn "No server currently running on port $PORT."
            return 1
        fi
        if kill "$SERVER_PID" &> /dev/null; then
            print_success "Successfully stopped server on port $PORT (PID: $SERVER_PID)."
        else
            print_error "Failed to stop server on port $PORT (PID: $SERVER_PID)."
            return 1
        fi
    else
        # Stop all running servers
        local server_list=$(lsof -i -n -P | grep LISTEN | grep -E "python|http.server")
        if [ -z "$server_list" ]; then
            print_warn "No servers are currently running."
            return 1
        fi
        
        print_info "Stopping all running servers:"
        echo -e "${WHITE}----------------------------------------${RESET}"
        local stopped_servers=0
        local failed_servers=0
        
        echo "$server_list" | while IFS= read -r line; do
            local pid=$(echo "$line" | awk '{print $2}')
            local port_info=$(echo "$line" | awk '{print $9}')
            local port=$(echo "$port_info" | awk -F':' '{print $NF}')
            
            if kill "$pid" &> /dev/null; then
                echo -e "${GREEN}Stopped server on port $port (PID: $pid)${RESET}"
                ((stopped_servers++))
            else
                echo -e "${RED}Failed to stop server on port $port (PID: $pid)${RESET}"
                ((failed_servers++))
            fi
        done
        
        echo -e "${WHITE}----------------------------------------${RESET}"
        if [ $stopped_servers -gt 0 ]; then
            print_success "Successfully stopped $stopped_servers server(s)."
        fi
        if [ $failed_servers -gt 0 ]; then
            print_error "Failed to stop $failed_servers server(s)."
        fi
        
        if [ $failed_servers -eq 0 ]; then
            return 0
        else
            return 1
        fi
    fi
}



function test_site() {
    if [ "$1" == "--no-browser" ]; then return 0; fi
    if [ -z "$SERVER_PID" ]; then
        start_server
        sleep 1
    fi
    local url_to_open="http://localhost:$PORT"
    if [ -n "$1" ]; then
        print_success "Opening song player for: $1"
        url_to_open="http://localhost:$PORT/demos/player.html#$1"
    else
        print_success "Opening main site..."
    fi
    if [ -n "$OPEN_CMD" ]; then
        print_info "Using command: $OPEN_CMD $url_to_open"
        $OPEN_CMD "$url_to_open"
    else
        print_warn "Could not determine a browser opener. Please open manually:"
        echo -e "  ${WHITE}$url_to_open${RESET}"
    fi
}

function show_help() {
    echo -e "${CYAN}Usage:${RESET} ./app.sh [command]"
    echo -e ""
    echo -e "${CYAN}Commands:${RESET}"
    echo -e "  ${WHITE}start${RESET} [port]         Start the server"
    echo -e "  ${WHITE}stop${RESET}                Stop the server"
    echo -e "  ${WHITE}status${RESET}              Show server status"
    echo -e "  ${WHITE}songs${RESET}               List songs with file status"
    echo -e "  ${WHITE}test${RESET} [song|--no-browser]  Open the site or a specific song"
    echo -e "  ${WHITE}restart${RESET}             Restart the server"
    echo -e "  ${WHITE}help${RESET}                Show this help message"
    echo -e ""
}

function list_songs() {
    print_info "Songs in manifest:"
    echo -e "${WHITE}------------------------------------------------------------${RESET}"
    
    # Read manifest file
    local manifest=$(cat "$SONG_PATH/manifest.txt" | grep -v '^$')
    
    if [ -z "$manifest" ]; then
        print_warn "No songs found in manifest"
        return 1
    fi
    
    local max_width=70
    local fixed_width=$((max_width - 30)) # 30 for the three fixed-width columns (8+8+8+6 spaces)

    # Print header with file extensions
    echo -e "$(printf "%-${fixed_width}s | ${WHITE}%3s${RESET} | ${WHITE}%3s${RESET} | ${WHITE}%3s${RESET}" "Name" "mp3" "txt" "jpg")"    
    echo -e "${WHITE}------------------------------------------------------------${RESET}"
    
    # Check each song
    while IFS= read -r song; do
        local audio_file="$SONG_PATH/${song}.mp3"
        local lyrics_file="$SONG_PATH/${song}.txt"
        local image_file="$SONG_PATH/${song}.jpg"
        
        local audio_status="$RED✗$RESET"
        local lyrics_status="$RED✗$RESET"
        local image_status="$RED✗$RESET"
        
        if [ -f "$audio_file" ]; then
            audio_status="$GREEN✓$RESET"
        fi
        
        if [ -f "$lyrics_file" ]; then
            lyrics_status="$GREEN✓$RESET"
        fi
        
        if [ -f "$image_file" ]; then
            image_status="$GREEN✓$RESET"
        fi
        
        # Truncate song name to fit in remaining space
        local song_name="${song:0:$fixed_width}"
        if [ ${#song} -gt $fixed_width ]; then
            song_name="${song_name}..."
        fi
        
        # Print with fixed-width columns
        echo -e "$(printf "%-${fixed_width}s |  %3s  |  %3s  |  %3s " "$song_name" "$audio_status" "$lyrics_status" "$image_status")"
    done <<< "$manifest"
    
    echo -e "${WHITE}------------------------------------------------------------${RESET}"
}

COMMAND=$1
OPTINAL_ARG=$2
shift

check_requirements
display_header
trap 'stop_server' SIGINT SIGTERM

case $COMMAND in
    start)
        if [ -n "$OPTINAL_ARG" ]; then
            if [[ "$OPTINAL_ARG" =~ ^[0-9]+$ ]]; then
                PORT=$OPTINAL_ARG
            else
                print_error "Invalid port number: $OPTINAL_ARG"
                return 1
            fi
        fi
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 1
        start_server
        ;;
    test)
        test_site "$@"
        ;;
    status)
        server_list=$(lsof -i -n -P | grep LISTEN | grep -E "python|http.server")
        if [ -z "$server_list" ]; then
            print_warn "No servers are currently running."
        else
            print_info "Running servers:"
            echo -e "${WHITE}----------------------------------------${RESET}"
            echo "$server_list" | while IFS= read -r line; do
                pid=$(echo "$line" | awk '{print $2}')
                port_info=$(echo "$line" | awk '{print $9}')
                port=$(echo "$port_info" | awk -F':' '{print $NF}')
                echo -e "${GREEN}Port: ${WHITE}$port${GREEN} - PID: ${WHITE}$pid${RESET}"
            done
            echo -e "${WHITE}----------------------------------------${RESET}"
        fi
        ;;
    songs)
        list_songs
        ;;
    help|*)
        show_help
        ;;
esac
