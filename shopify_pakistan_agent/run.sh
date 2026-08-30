#!/bin/bash
# run.sh
# Run the Shopify Pakistan leads agent once, right now.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/agent.py" "$@"
