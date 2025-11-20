═══════════════════════════════════════════════════════
  Medical Clinic System - Installation Guide
═══════════════════════════════════════════════════════

QUICK START:
------------
1. Install Node.js (if not installed)
   Download: https://nodejs.org/
   
2. Install PostgreSQL (if not installed)
   Download: https://www.postgresql.org/download/windows/

3. Run: install-everything.bat (as Administrator)
   This installs all dependencies and sets up the system

4. Configure: backend/.env file
   Set DATABASE_URL, JWT_SECRET, etc.

5. Add License: backend/license.enc
   Get license file from vendor

6. Run: setup-network.bat (as Administrator)
   Configures firewall for network access

7. Run: start-server.bat
   Starts the system

8. Access: http://localhost:5173

AUTO-START:
----------
Run: setup-auto-start.bat (as Administrator)
System will start automatically on Windows boot.

NETWORK ACCESS:
--------------
Server PC: http://localhost:5173
Other PCs: http://SERVER_IP:5173

Find IP: Run find-server-ip.bat
Configure Firewall: Run setup-network.bat

DEFAULT LOGIN:
-------------
Username: admin
Password: admin123
(Change immediately after first login!)

═══════════════════════════════════════════════════════

