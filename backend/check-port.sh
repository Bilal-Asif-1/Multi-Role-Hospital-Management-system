#!/bin/bash
# Script to check which port the server is running on

echo "Checking for processes on common ports..."
echo ""

# Check port 3000 (default backend port)
PORT_3000=$(lsof -ti:3000)
if [ -z "$PORT_3000" ]; then
  echo "❌ Port 3000: Not in use"
else
  echo "✅ Port 3000: IN USE (PID: $PORT_3000)"
  echo "   Process details:"
  ps -p $PORT_3000 -o pid,command | tail -1
fi

echo ""
echo "Checking all Node.js processes:"
ps aux | grep -E "node|nest" | grep -v grep | head -5

echo ""
echo "To kill process on port 3000, run: npm run stop"

