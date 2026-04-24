#!/bin/bash

# AI Video Generation Platform - Start Script
# =============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}================================================${NC}"
echo -e "${PURPLE}  AI Video Generation Platform - Starting...     ${NC}"
echo -e "${PURPLE}================================================${NC}"

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}[OK]${NC} Loaded .env file"
else
  echo -e "${RED}[ERROR]${NC} .env file not found!"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Kill processes on used ports
echo -e "${YELLOW}[INFO]${NC} Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT..."

kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}[INFO]${NC} Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}[OK]${NC} Ports cleaned"

# Check PostgreSQL
echo -e "${YELLOW}[INFO]${NC} Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} PostgreSQL is not installed!"
  exit 1
fi

if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -q 2>/dev/null; then
  echo -e "${YELLOW}[INFO]${NC} Starting PostgreSQL..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

# Create database
echo -e "${YELLOW}[INFO]${NC} Setting up database..."
createdb ${DB_NAME:-ai_video_generation} 2>/dev/null || echo -e "${GREEN}[OK]${NC} Database already exists"

# Install backend dependencies
echo -e "${YELLOW}[INFO]${NC} Installing backend dependencies..."
cd backend
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}[OK]${NC} Backend dependencies installed"

# Seed database
echo -e "${YELLOW}[INFO]${NC} Seeding database with 15 items per feature..."
node seeds/seed.js
echo -e "${GREEN}[OK]${NC} Database seeded"

# Start backend with auto-reload
echo -e "${YELLOW}[INFO]${NC} Starting backend on port $BACKEND_PORT with auto-reload..."
npx nodemon server.js &
BACKEND_PID=$!
cd ..

# Install frontend dependencies
echo -e "${YELLOW}[INFO]${NC} Installing frontend dependencies..."
cd frontend
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}[OK]${NC} Frontend dependencies installed"

# Start frontend with auto-reload
echo -e "${YELLOW}[INFO]${NC} Starting frontend on port $FRONTEND_PORT with auto-reload..."
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${PURPLE}================================================${NC}"
echo -e "${GREEN}  AI Video Generation Platform is running!       ${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""
echo -e "  Frontend:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo ""
echo -e "  Login:     ${YELLOW}admin@aivideo.com / admin123${NC}"
echo -e "             (Click 'Fill demo credentials' button)"
echo ""
echo -e "  Both servers auto-reload on code changes."
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services."
echo ""

cleanup() {
  echo ""
  echo -e "${YELLOW}[INFO]${NC} Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  echo -e "${GREEN}[OK]${NC} All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM
wait
