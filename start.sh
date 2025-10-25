#!/bin/bash

# Ensure backend dependencies are installed
echo "Installing backend dependencies..."
cd backend
npm install --omit=dev # Use --omit=dev for production dependencies only
cd ..

# Ensure frontend dependencies are installed and built
echo "Installing frontend dependencies and building..."
cd frontend
npm install
npm run build
cd ..

# Start backend in background
echo "Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend using serve in background
echo "Starting frontend..."
# Ensure serve is available. npx will install it if not found.
cd frontend
npx serve -s dist -l 80 &
FRONTEND_PID=$!
cd ..

# Keep the script running to keep the processes alive
wait $BACKEND_PID $FRONTEND_PID
