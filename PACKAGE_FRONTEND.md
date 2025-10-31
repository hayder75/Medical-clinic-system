# How to Package Frontend for Your Employer

## Steps to Create the Zip File

1. **Go to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Make sure .env file exists with VPS URL:**
   - The .env file should contain: `VITE_API_URL=http://15.204.227.47:3001/api`
   - (This is already done)

3. **Create a zip file (on Windows, you can use 7-Zip or WinRAR):**

   **Option A: Using Command Line (Linux/Mac):**
   ```bash
   cd ..
   zip -r medical-frontend.zip frontend -x "frontend/node_modules/*" "frontend/.git/*" "frontend/dist/*"
   ```

   **Option B: Using Windows Explorer:**
   - Right-click on the `frontend` folder
   - Select "Send to" > "Compressed (zipped) folder"
   - Name it: `medical-frontend.zip`
   - **IMPORTANT**: Exclude `node_modules` folder (it's large, not needed)
     - Open the zip file
     - Delete the `node_modules` folder from inside the zip

   **Option C: Using 7-Zip (Recommended for Windows):**
   - Right-click `frontend` folder
   - Select "7-Zip" > "Add to archive..."
   - Name: `medical-frontend.zip`
   - Exclude: `node_modules`, `.git`, `dist`
   - Click OK

4. **Verify the zip includes:**
   - ✅ All .jsx files (src folder)
   - ✅ All .js files (src folder)
   - ✅ package.json
   - ✅ .env file (MUST BE INCLUDED)
   - ✅ vite.config.js
   - ✅ WINDOWS_SETUP.md
   - ✅ QUICK_START.txt
   - ❌ node_modules (exclude this - it's ~200MB+)
   - ❌ dist (exclude this)
   - ❌ .git (exclude this)

## What to Send Your Employer

Send them:
1. **medical-frontend.zip** (the zipped frontend folder)
2. **Instructions to read:** `WINDOWS_SETUP.md` (inside the zip)

## What Your Employer Needs to Do

1. Install Node.js from https://nodejs.org/ (LTS version)
2. Extract the zip file
3. Open Command Prompt in the extracted `frontend` folder
4. Run: `npm install`
5. Run: `npm run dev`
6. Open browser to: `http://localhost:3001`

That's it! The frontend will connect to your VPS backend automatically.

