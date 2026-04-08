#!/bin/bash
# setup_cron.sh
# Installs a cron job that runs the LinkedIn agent at 4:00 PM every day.
# Run once:  bash setup_cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_SCRIPT="$SCRIPT_DIR/agent.py"
LOG_FILE="$SCRIPT_DIR/outputs/cron.log"
PYTHON_BIN="$(which python3)"

# The cron entry: every day at 16:00 (4 PM)
CRON_ENTRY="0 16 * * * $PYTHON_BIN $AGENT_SCRIPT >> $LOG_FILE 2>&1"

# Check if already installed
if crontab -l 2>/dev/null | grep -qF "$AGENT_SCRIPT"; then
    echo "[setup] Cron job already installed. Nothing changed."
    echo "[setup] Current entry:"
    crontab -l | grep "$AGENT_SCRIPT"
    exit 0
fi

# Install it
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "[setup] Cron job installed successfully!"
echo "[setup] Entry: $CRON_ENTRY"
echo ""
echo "The agent will run every day at 4:00 PM."
echo "Logs will be written to: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Make sure .env is configured: cp .env.example .env && nano .env"
echo "  2. Install dependencies:         pip3 install anthropic python-dotenv"
echo "  3. Test it manually first:        python3 $AGENT_SCRIPT"
echo ""
echo "To remove the cron job:  crontab -e  (then delete the line)"
