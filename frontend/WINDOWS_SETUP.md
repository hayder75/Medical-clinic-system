# Frontend Setup Guide for Windows

## Prerequisites
You need to install these programs first:

### 1. Node.js (Required)
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer and follow the instructions
4. Make sure to check "Add to PATH" during installation
5. Restart your computer after installation

### 2. Verify Installation
Open **Command Prompt** (press `Windows Key + R`, type `cmd`, press Enter) and run:
```cmd
node --version
npm --version
```
You should see version numbers. If you see errors, Node.js is not installed correctly.

## Setup Steps

### Step 1: Extract the Zip File
1. Extract the `frontend.zip` file to a folder (e.g., `C:\medical-frontend` or `Desktop\medical-frontend`)
2. Remember where you extracted it

### Step 2: Open Command Prompt in the Frontend Folder
1. Navigate to the extracted `frontend` folder in Windows Explorer
2. Click in the address bar at the top (where it shows the folder path)
3. Type `cmd` and press Enter
   - This opens Command Prompt in that folder

**OR**

1. Open Command Prompt
2. Type: `cd ` (with a space after cd)
3. Drag and drop the `frontend` folder into the Command Prompt window
4. Press Enter

### Step 3: Install Dependencies
In the Command Prompt, type:
```cmd
npm install
```
Wait for it to finish (this may take 2-5 minutes). You'll see a lot of text scrolling.

### Step 4: Start the Frontend
Once installation is complete, type:
```cmd
npm run dev
```

### Step 5: Open in Browser
After running the command, you should see something like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

1. Open your web browser (Chrome, Firefox, or Edge)
2. Go to: `http://localhost:3001`
3. The application should load!

## Important Notes

- **Keep Command Prompt open** - The frontend runs while the window is open. Close it to stop.
- **Backend is already running** - The frontend connects to a server on the internet (VPS), so you don't need to start anything else.
- **To stop the frontend**: Press `Ctrl + C` in the Command Prompt window

## Troubleshooting

### "node is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart your computer

### "npm is not recognized"
- Same as above - Node.js includes npm

### "Port 3001 is already in use"
- Another program is using port 3001
- Close other programs or restart your computer

### "Cannot connect to backend"
- Check your internet connection
- The backend server might be down (contact the developer)

### Installation takes too long
- This is normal, especially the first time
- Make sure you have internet connection
- Don't close the Command Prompt window

## Quick Start (After First Setup)

Once everything is set up, you only need to:
1. Open Command Prompt in the `frontend` folder
2. Type: `npm run dev`
3. Open browser to `http://localhost:3001`

No need to run `npm install` again unless you get new files!

## Need Help?

If you encounter any problems:
1. Take a screenshot of the error message
2. Note which step you were on
3. Contact the developer with the details

