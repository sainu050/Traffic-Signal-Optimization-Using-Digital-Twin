from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, text
from sqlalchemy.orm import Session
import datetime
import bcrypt
import os
import sys
import threading
import time
import secrets
if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
import traci
from database import engine, Base, get_db

# Declare database models matching schema.sql
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    city = Column(String(15), nullable=True)
    role = Column(String(20), default="PUBLIC", nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    is_first_login = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Intersection(Base):
    __tablename__ = "intersections"
    intersection_id = Column(Integer, primary_key=True, index=True)
    intersection_name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    status = Column(String(30), default="Active")

class OperatorAssignment(Base):
    __tablename__ = "operatorassignment"
    assignment_id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, nullable=False)
    intersection_id = Column(Integer, nullable=False)
    assigned_date = Column(DateTime, default=datetime.datetime.utcnow)

class TrafficData(Base):
    __tablename__ = "trafficdata"
    traffic_id = Column(Integer, primary_key=True, index=True)
    intersection_id = Column(Integer, nullable=False)
    vehicle_count = Column(Integer, default=0)
    queue_length = Column(Integer, default=0)
    waiting_time = Column(Integer, default=0)
    congestion_level = Column(String(20), default="Low")
    density = Column(Numeric, default=0.0)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class TrafficSignal(Base):
    __tablename__ = "trafficsignal"
    signal_id = Column(Integer, primary_key=True, index=True)
    intersection_id = Column(Integer, nullable=False)
    current_state = Column(String(20), default="red")
    green_time = Column(Integer, default=30)
    yellow_time = Column(Integer, default=5)
    red_time = Column(Integer, default=35)
    mode = Column(String(20), default="AUTO")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Incident(Base):
    __tablename__ = "incident"
    incident_id = Column(Integer, primary_key=True, index=True)
    reported_by = Column(Integer, nullable=True)
    intersection_id = Column(Integer, nullable=True)
    type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    status = Column(String(20), default="PENDING")
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_by = Column(Integer, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    time = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    target = Column(String(255), nullable=False)

# Auto generate tables if not loaded
Base.metadata.create_all(bind=engine)

# Instantiate FastAPI
app = FastAPI(title="UrbanFlow backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic validation models
class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    city: str | None = None
    role: str = "PUBLIC"

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class IntersectionCreate(BaseModel):
    name: str

class IntersectionOverride(BaseModel):
    wait: int
    signal: str

class OperatorCreate(BaseModel):
    name: str
    email: EmailStr
    assignedIntersection: str | None = None

class OperatorAssign(BaseModel):
    assignedIntersection: str

class IncidentCreate(BaseModel):
    location: str
    type: str
    priority: str
    reported_by: str
    status: str = "Pending"
    time: str = "Just now"

class AuditLogCreate(BaseModel):
    user_name: str
    action: str
    target: str

# ─── AUTHENTICATION ROUTES ───

@app.post("/api/register")
def register_user(user_data: UserRegisterSchema, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), salt).decode('utf-8')

    role_upper = user_data.role.upper()
    if role_upper not in ["ADMIN", "OPERATOR", "PUBLIC"]:
        role_upper = "PUBLIC"

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        phone=user_data.phone,
        city=user_data.city,
        role=role_upper,
        status="ACTIVE"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Registration successful.",
        "user": {
            "id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "status": new_user.status
        }
    }

@app.post("/api/login")
def login_user(login_data: UserLoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended or is inactive."
        )

    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    return {
        "success": True,
        "message": "Login successful.",
        "user": {
            "id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role.lower(),
            "is_first_login": user.is_first_login,
            "avatar": "".join([part[0] for part in user.name.split()[:2]]).upper()
        }
    }

class UserChangePasswordSchema(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str

@app.post("/api/users/change-password")
def change_password(data: UserChangePasswordSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if not bcrypt.checkpw(data.current_password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data.new_password.encode('utf-8'), salt).decode('utf-8')
    
    user.password = hashed_password
    user.is_first_login = False
    db.commit()
    
    return {"success": True, "message": "Password updated successfully."}

# ─── INTERSECTION ROUTES ───

@app.get("/api/intersections")
def get_intersections(db: Session = Depends(get_db)):
    results = []
    ints = db.query(Intersection).order_by(Intersection.intersection_id).all()
    for i in ints:
        sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == i.intersection_id).order_by(TrafficSignal.signal_id.desc()).first()
        data = db.query(TrafficData).filter(TrafficData.intersection_id == i.intersection_id).order_by(TrafficData.traffic_id.desc()).first()
        
        results.append({
            "id": i.intersection_id,
            "name": i.intersection_name,
            "signal": sig.current_state if sig else "red",
            "congestion": data.congestion_level if data else "Low",
            "vehicles": data.vehicle_count if data else 0,
            "wait": data.waiting_time if data else 0
        })
    return results

@app.post("/api/intersections")
def create_intersection(data: IntersectionCreate, db: Session = Depends(get_db)):
    import random
    cong = random.choice(["Low", "Moderate", "High"])
    veh = random.randint(5, 60)
    wt = random.randint(10, 120)
    sig = random.choice(["red", "yellow", "green"])
    
    intersection = Intersection(
        intersection_name=data.name,
        location="City Road",
        latitude=9.93,
        longitude=76.26,
        status="Active"
    )
    db.add(intersection)
    db.commit()
    db.refresh(intersection)
    
    # Init signal
    tsig = TrafficSignal(
        intersection_id=intersection.intersection_id,
        current_state=sig,
        green_time=wt,
        yellow_time=5,
        red_time=wt+5,
        mode="AUTO"
    )
    db.add(tsig)
    
    # Init trafficdata
    tdata = TrafficData(
        intersection_id=intersection.intersection_id,
        vehicle_count=veh,
        queue_length=veh // 3,
        waiting_time=wt,
        congestion_level=cong,
        density=0.5
    )
    db.add(tdata)
    
    db.commit()
    return {
        "id": intersection.intersection_id,
        "name": intersection.intersection_name,
        "signal": sig,
        "congestion": cong,
        "vehicles": veh,
        "wait": wt
    }

@app.put("/api/intersections/{id}/override")
def override_intersection(id: int, data: IntersectionOverride, db: Session = Depends(get_db)):
    sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == id).order_by(TrafficSignal.signal_id.desc()).first()
    if not sig:
        sig = TrafficSignal(intersection_id=id)
        db.add(sig)
    sig.current_state = data.signal
    sig.green_time = data.wait
    sig.mode = "MANUAL"
    
    # Update latest trafficdata
    tdata = db.query(TrafficData).filter(TrafficData.intersection_id == id).order_by(TrafficData.traffic_id.desc()).first()
    if tdata:
        tdata.waiting_time = data.wait
    
    db.commit()
    return {"success": True}

# ─── CITIZENS (PUBLIC USERS) ROUTE ───

@app.get("/api/simulation/debug")
def debug_simulation(db: Session = Depends(get_db)):
    if not hasattr(sim, "sumo_started") or not sim.sumo_started:
        return {"status": "SUMO not started"}
    try:
        vehs = traci.vehicle.getIDList()
        vehs_details = []
        for v in vehs:
            vehs_details.append({
                "id": v,
                "x": traci.vehicle.getPosition(v)[0],
                "y": traci.vehicle.getPosition(v)[1],
                "angle": traci.vehicle.getAngle(v),
                "type": traci.vehicle.getTypeID(v)
            })
        lights = traci.trafficlight.getRedYellowGreenState("C")
        phase = traci.trafficlight.getPhase("C")
        return {
            "status": "Running",
            "time": traci.simulation.getTime(),
            "active_vehicles": vehs_details,
            "vehicle_count": len(vehs),
            "traffic_light_state": lights,
            "traffic_light_phase": phase,
            "signals": sim.signals
        }
    except Exception as e:
        return {"status": "Error", "error": str(e)}

@app.get("/api/citizens")
def get_citizens(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "PUBLIC").order_by(User.user_id.desc()).all()
    return [{
        "id": f"CIT-{u.user_id}",
        "name": u.name,
        "email": u.email,
        "phone": u.phone or "",
        "city": u.city or "",
        "status": "Active" if u.status == "ACTIVE" else "Suspended",
        "reportsCount": 0,
        "joinedDate": u.created_at.strftime("%Y-%m-%d") if u.created_at else ""
    } for u in users]

# ─── TRAFFIC OPERATOR ROUTES ───

@app.get("/api/operators")
def get_operators(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "OPERATOR").order_by(User.user_id.desc()).all()
    results = []
    for u in users:
        # Find active operator assignment
        assign = db.query(OperatorAssignment).filter(OperatorAssignment.operator_id == u.user_id).first()
        assigned_name = "Unassigned"
        if assign:
            junction = db.query(Intersection).filter(Intersection.intersection_id == assign.intersection_id).first()
            if junction:
                assigned_name = junction.intersection_name
                
        results.append({
            "id": f"OP-{u.user_id}",
            "db_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone or "",
            "city": u.city or "",
            "status": "Online" if u.status == "ACTIVE" else "Offline",
            "assignedIntersection": assigned_name,
            "activeTime": "4h 12m" if u.status == "ACTIVE" else "0m"
        })
    return results

def send_email_notification(recipient: str, subject: str, body: str):
    # Print to the console
    print("\n" + "="*50)
    print(f"SMTP SIMULATOR - EMAIL SENT TO: {recipient}")
    print(f"SUBJECT: {subject}")
    print(f"BODY:\n{body}")
    print("="*50 + "\n")
    
    # Write to a local sent_emails.txt file
    try:
        with open("sent_emails.txt", "a") as f:
            f.write(f"Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"To: {recipient}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Body:\n{body}\n")
            f.write("-" * 50 + "\n\n")
    except Exception:
        pass

@app.post("/api/operators")
def create_operator(data: OperatorCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Operator email already registered.")
    
    # Generate 8-character temporary password
    temp_password = secrets.token_hex(4)
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(temp_password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        phone="",
        role="OPERATOR",
        status="ACTIVE",
        is_first_login=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Join OperatorAssignment
    if data.assignedIntersection and data.assignedIntersection != "Unassigned":
        junction = db.query(Intersection).filter(Intersection.intersection_name == data.assignedIntersection).first()
        if junction:
            assign = OperatorAssignment(
                operator_id=new_user.user_id,
                intersection_id=junction.intersection_id
            )
            db.add(assign)
            db.commit()
            
    # Send email notification containing temporary password via local SMTP Simulator
    email_body = f"""Hello {new_user.name},

You have been registered as a Traffic Operator on the UrbanFlow Digital Twin platform.

Here are your credentials for your first login:
- URL: http://localhost:5173
- Email: {new_user.email}
- Temporary Password: {temp_password}

For security reasons, you will be required to change this password immediately upon logging in.

Best regards,
UrbanFlow Administration System"""
    
    send_email_notification(
        recipient=new_user.email,
        subject="UrbanFlow Traffic Operator Account Created",
        body=email_body
    )
            
    return {
        "success": True, 
        "tempPassword": temp_password,
        "message": "Operator created successfully. Temporary password has been logged to sent_emails.txt."
    }

@app.put("/api/operators/{id}/assign")
def assign_operator(id: int, data: OperatorAssign, db: Session = Depends(get_db)):
    # Clear old assignments
    db.query(OperatorAssignment).filter(OperatorAssignment.operator_id == id).delete()
    
    if data.assignedIntersection and data.assignedIntersection != "Unassigned":
        junction = db.query(Intersection).filter(Intersection.intersection_name == data.assignedIntersection).first()
        if junction:
            assign = OperatorAssignment(
                operator_id=id,
                intersection_id=junction.intersection_id
            )
            db.add(assign)
    db.commit()
    return {"success": True, "message": "Operator assignment updated."}

# ─── INCIDENT ROUTES ───

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.incident_id.desc()).all()
    results = []
    for inc in incidents:
        reporter = "Unknown"
        if inc.reported_by:
            user = db.query(User).filter(User.user_id == inc.reported_by).first()
            if user:
                reporter = user.name
                
        results.append({
            "id": f"INC-{inc.incident_id}",
            "location": inc.location,
            "type": inc.type,
            "priority": inc.priority,
            "reportedBy": reporter,
            "status": inc.status.capitalize(),
            "time": "Just now"
        })
    return results

@app.post("/api/incidents")
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    # Find user ID by reporter name if possible, default None
    user = db.query(User).filter(User.name == data.reported_by).first()
    rep_id = user.user_id if user else None
    
    incident = Incident(
        location=data.location,
        type=data.type,
        priority=data.priority,
        reported_by=rep_id,
        status=data.status.upper(),
        time=data.time
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

# ─── AUDIT LOGS ROUTES ───

@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).all()

@app.post("/api/logs")
def create_log(data: AuditLogCreate, db: Session = Depends(get_db)):
    time_str = datetime.datetime.now().strftime("%H:%M:%S")
    log = AuditLog(
        time=time_str,
        user_name=data.user_name,
        action=data.action,
        target=data.target
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# ─── WEBSOCKET SIMULATION STREAM ───

from database import SessionLocal
from simulation import TrafficSimulation
import asyncio

sim = TrafficSimulation()

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def get_active_intersection_id(db: Session) -> int:
    # Try to find intersection containing 'baker' (case-insensitive), otherwise fall back to first intersection
    intersection = db.query(Intersection).filter(Intersection.intersection_name.ilike("%baker%")).first()
    if not intersection:
        intersection = db.query(Intersection).order_by(Intersection.intersection_id.asc()).first()
    return intersection.intersection_id if intersection else 1

# Global variables to track traffic signal phase state inside the thread loop
current_phase = "north_green"
timer_remaining = 12
step_counter = 0

def run_simulation_thread():
    global sim, current_phase, timer_remaining, step_counter
    
    current_phase = "north_green"
    timer_remaining = 12
    step_counter = 0
    
    while True:
        time.sleep(0.05) # 20 FPS (every 50ms)
        db = SessionLocal()
        try:
            # Read traffic light state from PostgreSQL dynamically
            active_id = get_active_intersection_id(db)
            sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == active_id).order_by(TrafficSignal.signal_id.desc()).first()
            
            if sig:
                if sig.mode == "MANUAL":
                    # --- MANUAL OVERRIDE MODE ---
                    state = sig.current_state
                    if state == "green":
                        current_phase = "north_green"
                    elif state == "red":
                        current_phase = "south_green"
                    else:
                        current_phase = "north_green"
                    
                    # Decrement manual countdown every 20 steps (1s)
                    step_counter += 1
                    if step_counter >= 20:
                        step_counter = 0
                        if sig.green_time and sig.green_time > 0:
                            sig.green_time -= 1
                            db.commit()
                        else:
                            # Override expired: Release back to AUTO mode
                            sig.mode = "AUTO"
                            sig.current_state = "north_green"
                            db.commit()
                            current_phase = "north_green"
                            timer_remaining = 12
                    
                    wait_time = sig.green_time or 0
                    if current_phase == "north_green":
                        signals = {"north": "green", "east": "red", "south": "red", "west": "red"}
                        sim.signal_timers = {"north": wait_time, "east": 0, "south": 0, "west": 0}
                        state_string = "GGGGrrrrrrrrrrrr"
                    else:
                        signals = {"north": "red", "east": "red", "south": "green", "west": "red"}
                        sim.signal_timers = {"north": 0, "east": 0, "south": wait_time, "west": 0}
                        state_string = "rrrrrrrrGGGGrrrr"
                else:
                    # --- AUTO MODE (RULE-BASED ADAPTIVE TRAFFIC CONTROL) ---
                    # Decrement AUTO countdown every 20 steps (1s)
                    step_counter += 1
                    if step_counter >= 20:
                        step_counter = 0
                        timer_remaining -= 1
                        
                        if timer_remaining <= 0:
                            # Transition path: north_green -> north_yellow -> east_green -> east_yellow -> south_green -> south_yellow -> west_green -> west_yellow -> north_green
                            if current_phase == "north_green":
                                current_phase = "north_yellow"
                                timer_remaining = 3
                            elif current_phase == "north_yellow":
                                current_phase = "east_green"
                                
                                # ADAPTIVE RULE: Adjust East green duration based on East queue lengths
                                try:
                                    q = traci.lane.getLastStepHaltingNumber("E2C_0")
                                except Exception:
                                    q = 0
                                    
                                base_duration = 12
                                if q > 3:
                                    timer_remaining = min(base_duration + (q - 3) * 2, 25)
                                    log = SystemLog(
                                        time=datetime.datetime.now().strftime("%H:%M:%S"),
                                        user_name="System (AI Adaptive)",
                                        action=f"Adaptive Control: Extended East Green to {timer_remaining}s",
                                        target=f"Baker Jn (Queue: {q} vehicles)"
                                    )
                                    db.add(log)
                                    db.commit()
                                else:
                                    timer_remaining = base_duration
                                    
                            elif current_phase == "east_green":
                                current_phase = "east_yellow"
                                timer_remaining = 3
                            elif current_phase == "east_yellow":
                                current_phase = "south_green"
                                
                                # ADAPTIVE RULE: Adjust South green duration based on South queue lengths
                                try:
                                    q = traci.lane.getLastStepHaltingNumber("S2C_0")
                                except Exception:
                                    q = 0
                                    
                                base_duration = 12
                                if q > 3:
                                    timer_remaining = min(base_duration + (q - 3) * 2, 25)
                                    log = SystemLog(
                                        time=datetime.datetime.now().strftime("%H:%M:%S"),
                                        user_name="System (AI Adaptive)",
                                        action=f"Adaptive Control: Extended South Green to {timer_remaining}s",
                                        target=f"Baker Jn (Queue: {q} vehicles)"
                                    )
                                    db.add(log)
                                    db.commit()
                                else:
                                    timer_remaining = base_duration
                                    
                            elif current_phase == "south_green":
                                current_phase = "south_yellow"
                                timer_remaining = 3
                            elif current_phase == "south_yellow":
                                current_phase = "west_green"
                                
                                # ADAPTIVE RULE: Adjust West green duration based on West queue lengths
                                try:
                                    q = traci.lane.getLastStepHaltingNumber("W2C_0")
                                except Exception:
                                    q = 0
                                    
                                base_duration = 12
                                if q > 3:
                                    timer_remaining = min(base_duration + (q - 3) * 2, 25)
                                    log = SystemLog(
                                        time=datetime.datetime.now().strftime("%H:%M:%S"),
                                        user_name="System (AI Adaptive)",
                                        action=f"Adaptive Control: Extended West Green to {timer_remaining}s",
                                        target=f"Baker Jn (Queue: {q} vehicles)"
                                    )
                                    db.add(log)
                                    db.commit()
                                else:
                                    timer_remaining = base_duration
                                    
                            elif current_phase == "west_green":
                                current_phase = "west_yellow"
                                timer_remaining = 3
                            elif current_phase == "west_yellow":
                                current_phase = "north_green"
                                
                                # ADAPTIVE RULE: Adjust North green duration based on North queue lengths
                                try:
                                    q = traci.lane.getLastStepHaltingNumber("N2C_0")
                                except Exception:
                                    q = 0
                                    
                                base_duration = 12
                                if q > 3:
                                    timer_remaining = min(base_duration + (q - 3) * 2, 25)
                                    log = SystemLog(
                                        time=datetime.datetime.now().strftime("%H:%M:%S"),
                                        user_name="System (AI Adaptive)",
                                        action=f"Adaptive Control: Extended North Green to {timer_remaining}s",
                                        target=f"Baker Jn (Queue: {q} vehicles)"
                                    )
                                    db.add(log)
                                    db.commit()
                                else:
                                    timer_remaining = base_duration
                            
                            sig.current_state = current_phase
                            sig.green_time = timer_remaining
                            db.commit()
                            
                    # Update real-time countdown values for WebSocket clients
                    T = timer_remaining
                    if current_phase == "north_green":
                        signals = {"north": "green", "east": "red", "south": "red", "west": "red"}
                        sim.signal_timers = {
                            "north": T,
                            "east": T + 3,
                            "south": T + 18,
                            "west": T + 33
                        }
                        state_string = "GGGGrrrrrrrrrrrr"
                    elif current_phase == "north_yellow":
                        signals = {"north": "yellow", "east": "red", "south": "red", "west": "red"}
                        sim.signal_timers = {
                            "north": T,
                            "east": T,
                            "south": T + 15,
                            "west": T + 30
                        }
                        state_string = "yyyyrrrrrrrrrrrr"
                    elif current_phase == "east_green":
                        signals = {"north": "red", "east": "green", "south": "red", "west": "red"}
                        sim.signal_timers = {
                            "north": T + 33,
                            "east": T,
                            "south": T + 3,
                            "west": T + 18
                        }
                        state_string = "rrrrGGGGrrrrrrrr"
                    elif current_phase == "east_yellow":
                        signals = {"north": "red", "east": "yellow", "south": "red", "west": "red"}
                        sim.signal_timers = {
                            "north": T + 30,
                            "east": T,
                            "south": T,
                            "west": T + 15
                        }
                        state_string = "rrrryyyyrrrrrrrr"
                    elif current_phase == "south_green":
                        signals = {"north": "red", "east": "red", "south": "green", "west": "red"}
                        sim.signal_timers = {
                            "north": T + 18,
                            "east": T + 33,
                            "south": T,
                            "west": T + 3
                        }
                        state_string = "rrrrrrrrGGGGrrrr"
                    elif current_phase == "south_yellow":
                        signals = {"north": "red", "east": "red", "south": "yellow", "west": "red"}
                        sim.signal_timers = {
                            "north": T + 15,
                            "east": T + 30,
                            "south": T,
                            "west": T
                        }
                        state_string = "rrrrrrrryyyyrrrr"
                    elif current_phase == "west_green":
                        signals = {"north": "red", "east": "red", "south": "red", "west": "green"}
                        sim.signal_timers = {
                            "north": T + 3,
                            "east": T + 18,
                            "south": T + 33,
                            "west": T
                        }
                        state_string = "rrrrrrrrrrrrGGGG"
                    elif current_phase == "west_yellow":
                        signals = {"north": "red", "east": "red", "south": "red", "west": "yellow"}
                        sim.signal_timers = {
                            "north": T,
                            "east": T + 15,
                            "south": T + 30,
                            "west": T
                        }
                        state_string = "rrrrrrrrrrrryyyy"
                    else:
                        signals = {"north": "red", "east": "red", "south": "red", "west": "red"}
                        sim.signal_timers = {"north": 0, "east": 0, "south": 0, "west": 0}
                        state_string = "rrrrrrrrrrrrrrrr"
            else:
                signals = {"north": "green", "east": "red", "south": "red", "west": "red"}
                sim.signal_timers = {"north": 12, "east": 15, "south": 30, "west": 45}
                state_string = "GGGGrrrrrrrrrrrr"
            
            sim.update_signals(signals, state_string)
        except Exception:
            pass
        finally:
            db.close()
            
        sim.step()
        if main_loop is not None:
            asyncio.run_coroutine_threadsafe(manager.broadcast(sim.get_state()), main_loop)

@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_event_loop()
    
    # Ensure users table has is_first_login column
    db = SessionLocal()
    try:
        try:
            db.execute(text("SELECT is_first_login FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("ALTER TABLE users ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE"))
            db.commit()
    except Exception:
        pass
    finally:
        db.close()
        
    # Force database signal to AUTO and north_green on startup to clear any stuck manual overrides
    db = SessionLocal()
    try:
        active_id = get_active_intersection_id(db)
        sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == active_id).order_by(TrafficSignal.signal_id.desc()).first()
        if sig:
            sig.mode = "AUTO"
            sig.current_state = "north_green"
            db.commit()
    except Exception:
        pass
    finally:
        db.close()
    
    # Start the blocking simulation engine loop in a separate thread
    thread = threading.Thread(target=run_simulation_thread, daemon=True)
    thread.start()

@app.websocket("/api/simulation/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
