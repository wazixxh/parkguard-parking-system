# ParkGuard — Setup & Local Development Guide

### 1. Prerequisites
Ensure the following development prerequisites are installed on your workstation:
- **Python**: Version 3.11, 3.12, 3.13, or 3.14
- **Node.js**: Version 18, 20, or 22 LTS with `npm`
- **Git**: Latest release
- **Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with WebRTC / Camera support for QR scanning.

---

### 2. Repository Setup

Clone the repository and enter the project root:
```bash
git clone https://github.com/wazixxh/parkguard-parking-system.git
cd parkguard-parking-system
```

---

### 3. Backend Setup & Configuration

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create and Activate Python Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` as appropriate:*
   ```ini
   PROJECT_NAME=ParkGuard Parking System
   ENVIRONMENT=development
   DEBUG=true
   SECRET_KEY=generate_a_random_64_character_hex_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480

   # Database URL (SQLite for local dev)
   DATABASE_URL=sqlite:///./parkguard.db

   # CORS Allowed Origins
   ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

   # Super Admin Bootstrap Credentials
   INITIAL_ADMIN_EMAIL=admin@parkguard.com
   INITIAL_ADMIN_PASSWORD=AdminParkGuard2026!
   INITIAL_ADMIN_NAME=ParkGuard Super Administrator
   ```

5. **Initialize Database & Seed Defaults**:
   The backend auto-seeds the Super Admin, default departments, parking areas, and system configuration upon first boot.
   Alternatively, run the dedicated Administrator CLI utility:
   ```bash
   # Reset or initialize administrator account
   python scripts/create_admin.py --email admin@parkguard.com --password AdminParkGuard2026! --name "Chief Administrator"
   ```

6. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The interactive Swagger OpenAPI documentation is accessible at: `http://127.0.0.1:8000/docs`*

---

### 4. Frontend Setup & Configuration

1. **Open a New Terminal and Navigate to `frontend/`**:
   ```bash
   cd frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Content of `frontend/.env`:*
   ```ini
   VITE_API_URL=http://127.0.0.1:8000/api/v1
   ```

4. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   *The web application is now live at: `http://localhost:5173/`*

---

### 5. Default Development Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@parkguard.com` | `AdminParkGuard2026!` | Full administrative controls, reports, settings, audit trail |
| **Parking Staff** | `staff.test@parkguard.com` | `StaffPassword2026!` | Camera scanning, vehicle entry/exit, incident reporting |

---

### 6. Hardware & Scanner Setup
- **Browser Camera Scanning**: Open the **Scan & Verify** tab and grant camera permission in your browser. (Note: Camera access requires HTTPS in production or `localhost` during development).
- **USB / Handheld Barcode Scanners**: Standard USB/Bluetooth barcode guns send keyboard emulation sequences followed by Enter. They can scan directly into the manual identifier input box on any screen.
- **Pass Card Printing**: Navigate to any vehicle in **Vehicles**, click the **ID Card** badge, and press **Print Pass Card**. This formats the high-density card for A4, Letter, or thermal card printers.
