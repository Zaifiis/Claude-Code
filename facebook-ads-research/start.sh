#!/bin/bash
set -e

echo "=== Pakistan Facebook Ads Research Tool ==="
echo ""

# Install backend deps
cd "$(dirname "$0")/backend"
echo "[1/3] Installing Python dependencies..."
pip install -r requirements.txt -q

# Start Flask in background
echo "[2/3] Starting Flask backend on port 5000..."
python app.py &
FLASK_PID=$!
echo "      Backend PID: $FLASK_PID"

# Open frontend
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$SCRIPT_DIR/frontend/index.html"

echo "[3/3] Opening frontend..."
echo ""
echo "  Frontend : file://$FRONTEND"
echo "  Backend  : http://localhost:5000"
echo ""
echo "  Press Ctrl+C to stop the server"
echo ""

# Try to open browser
if command -v xdg-open &>/dev/null; then
    xdg-open "$FRONTEND"
elif command -v open &>/dev/null; then
    open "$FRONTEND"
elif command -v python3 &>/dev/null; then
    python3 -m webbrowser "$FRONTEND"
fi

# Keep running
trap "echo ''; echo 'Stopping server...'; kill $FLASK_PID 2>/dev/null; exit 0" INT TERM
wait $FLASK_PID
