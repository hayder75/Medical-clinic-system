#!/bin/bash

# Start backend
cd backend
npm start &

# Wait a moment for backend to start
sleep 5

# Start frontend (served by backend)
cd ../frontend
npm run build
npx serve -s dist -l 80
