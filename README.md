# UrbanFlow: Traffic Signal Optimization Using Digital Twin

A Digital Twin-based adaptive traffic signal optimization system using SUMO (Simulation of Urban MObility) traffic simulation, a FastAPI backend, real-time TraCI-managed control loops, and a React + Vite dashboard.

---

## 🚀 Key Features

### 🖥️ Real-Time 2D WebSocket Simulation Canvas
- **Telemetry Stream**: Live WebSocket stream broadcasting position, angle, vehicle type, and speed from the running SUMO instance.
- **Custom Vector Drawings**: Renders vehicles dynamically (cars, buses, trucks) with detailed paint colors, tire offsets, mirror wings, tail lights, and glowing headlight beams.
- **Smooth Trajectory Turns**: Real-world coordinates are mapped via a single Y-axis inversion conversion layer (`canvas_y = 300 - (y - 300) * 5`). Aligning the SUMO road edge width (`8.0m`) with the canvas lane spacing guarantees smooth, natural bezier curved turns without artificial snapping.

### 🚦 4-Phase Adaptive Traffic Control
- **Single-Direction Green Cycle**: Cycles one green light at a time (**North** ➔ **East** ➔ **South** ➔ **West**) through a 16-link junction state controller.
- **Rule-Based Extensions**: Reads lane halting queues using TraCI (`getLastStepHaltingNumber`). If a lane has $> 3$ halting vehicles, it dynamically extends the green signal duration (up to 25 seconds) and writes an audit entry in the `system_logs` database.
- **Manual Overrides & Auto-Release**: Allows Admins and Operators to lock any lane green. The override counts down in real time and automatically releases control back to `AUTO` mode once the timer hits `0`.

### 🔒 Operator First-Login & Reset Password Workflow
- **Simplified Registration**: Admins add Operators using only their **Name** and **Email Address**.
- **Local SMTP Simulator**: Automatically generates an 8-character temporary password on account creation. Logs credentials to the server console and appends them to a local file at `backend/sent_emails.txt`.
- **Forced Password Reset**: Detects `is_first_login` flags on login. Blocks user interaction with a viewport-wide password change overlay, forcing operators to configure a custom secure password before accessing the system.
- **DB Startup Migrations**: Automatically runs schema-validation check on FastAPI startup, running `ALTER TABLE users ADD COLUMN is_first_login...` if the field is missing.

---

## 📁 Project Structure

```
├── backend/
│   ├── sumo_files/            # Compiled SUMO network xml/rou configs
│   ├── database.py            # SQLAlchemy database connector
│   ├── generate_sumo_files.py # SUMO network node, edge, and flow compiler
│   ├── main.py                # FastAPI server, WebSockets, control threads
│   ├── requirements.txt       # Python package dependencies
│   ├── schema.sql             # SQL schema structure
│   ├── sent_emails.txt        # Local SMTP simulator email log
│   ├── simulation.py          # TraCI runner and coordinate telemetry
│   └── test_simulation.py     # TraCI environment validator
├── src/
│   ├── App.jsx                # Main layout and forced password reset modal
│   ├── AdminDashboard.jsx     # Admin control panel and operator registration
│   ├── SimulationCanvas.jsx   # 2D Canvas WebGL rendering context
│   └── main.jsx               # React entry point
└── package.json               # Node packages and build scripts
```

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **SUMO (Simulation of Urban MObility)**: Ensure `SUMO_HOME` is set in your environment variables.
- **PostgreSQL**: Local database named `urbanflow`.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Compile the SUMO road networks:
   ```powershell
   python generate_sumo_files.py
   ```
4. Start the FastAPI Uvicorn server:
   ```powershell
   python -m uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Navigate to the root directory and install dependencies:
   ```powershell
   npm install
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

