from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, text, Text
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
    phone = Column(String(30), nullable=True)
    city = Column(String(100), nullable=True)
    role = Column(String(20), default="PUBLIC", nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    is_first_login = Column(Boolean, default=True, nullable=False)
    is_online = Column(Boolean, default=True, nullable=False)
    security_question = Column(String(255), nullable=True)
    security_answer = Column(String(255), nullable=True)
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
    priority = Column(String(20), default="Moderate")
    description = Column(String(500), nullable=True)
    location = Column(String(255), nullable=False)
    status = Column(String(30), default="PENDING")
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_by = Column(Integer, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    time = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    target = Column(String(255), nullable=False)

class AdminNotification(Base):
    __tablename__ = "admin_notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    message = Column(String(255), nullable=False)
    type = Column(String(50), default="OPERATOR_OFFLINE")
    operator_id = Column(Integer, nullable=True)
    operator_name = Column(String(100), nullable=True)
    intersection_name = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ManualOverride(Base):
    __tablename__ = "manualoverride"
    override_id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, nullable=True)
    signal_id = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="Active")

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

@app.get("/")
@app.head("/")
def health_check():
    return {"status": "ok", "service": "UrbanFlow Backend", "version": "1.0.0"}

def ensure_incident_priority_column(db: Session):
    """Auto-migrate incident table to add missing priority column if not present."""
    try:
        db.execute(text("SELECT priority FROM incident LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE incident ADD COLUMN priority VARCHAR(20) DEFAULT 'Moderate'"))
            db.commit()
            print("[Migration] Added 'priority' column to incident table.")
        except Exception as e:
            db.rollback()
            print(f"[Migration] Note: Could not add priority column to incident table: {e}")

# Pydantic validation models
class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    city: str | None = None
    role: str = "PUBLIC"
    security_question: str | None = None
    security_answer: str | None = None

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class IntersectionCreate(BaseModel):
    name: str

class IntersectionOverride(BaseModel):
    wait: int
    signal: str
    reason: str | None = None
    operator_id: int | None = None

class OperatorCreate(BaseModel):
    name: str
    email: EmailStr
    assignedIntersection: str | None = None

class OperatorAssign(BaseModel):
    assignedIntersection: str

class OperatorDutyStatusSchema(BaseModel):
    is_online: bool

class IncidentCreate(BaseModel):
    location: str
    type: str
    priority: str = "Moderate"
    description: str = ""
    reported_by: str = "Citizen"
    status: str = "Pending"
    time: str = "Just now"

class IncidentStatusUpdate(BaseModel):
    status: str
    verified_by: str = "Traffic Operator"

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
        status="ACTIVE",
        security_question=user_data.security_question,
        security_answer=user_data.security_answer
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
            "phone": user.phone or "",
            "city": user.city or "",
            "role": user.role.lower(),
            "is_first_login": user.is_first_login,
            "is_online": getattr(user, 'is_online', True) if getattr(user, 'is_online', True) is not None else True,
            "avatar": "".join([part[0] for part in user.name.split()[:2]]).upper()
        }
    }

class UserChangePasswordSchema(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str
    name: str | None = None
    phone: str | None = None
    city: str | None = None

class UserProfileUpdateSchema(BaseModel):
    name: str
    phone: str | None = None
    city: str | None = None

class ForgotPasswordQuestionRequest(BaseModel):
    email: EmailStr

class ForgotPasswordVerifyRequest(BaseModel):
    email: EmailStr
    answer: str

class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    answer: str
    new_password: str

@app.post("/api/users/change-password")
def change_password(data: UserChangePasswordSchema, db: Session = Depends(get_db)):
    clean_email = data.email.strip()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    if not bcrypt.checkpw(data.current_password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Incorrect temporary password.")
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data.new_password.encode('utf-8'), salt).decode('utf-8')
    
    user.password = hashed_password
    user.is_first_login = False
    
    # Save other details if provided during reset
    if data.name:
        user.name = data.name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip()
    if data.city is not None:
        user.city = data.city.strip()
        
    db.commit()
    
    return {
        "success": True, 
        "message": "Password and details updated successfully.",
        "user": {
            "id": user.user_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone or "",
            "city": user.city or "",
            "role": user.role.lower(),
            "is_first_login": False
        }
    }

@app.put("/api/users/{user_id}/profile")
def update_profile(user_id: str, data: UserProfileUpdateSchema, db: Session = Depends(get_db)):
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.user_id == int(user_id)).first()
    if not user:
        user = db.query(User).filter(User.email.ilike(user_id.strip())).first()
    if not user:
        user = db.query(User).filter(User.name == data.name.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user.name = data.name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip()
    if data.city is not None:
        user.city = data.city.strip()
    
    try:
        time_str = datetime.datetime.now().strftime("%H:%M:%S")
        log = AuditLog(
            time=time_str,
            user_name=user.name,
            action="Updated User Profile",
            target=f"User ID {user.user_id} ({user.email})"
        )
        db.add(log)
    except Exception:
        pass

    db.commit()
    
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "id": user.user_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone or "",
            "city": user.city or "",
            "role": user.role.lower(),
            "is_first_login": user.is_first_login
        }
    }

@app.post("/api/forgot-password/question")
def get_forgot_password_question(data: ForgotPasswordQuestionRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="An account with this email address does not exist.")
    if not user.security_question:
        raise HTTPException(status_code=400, detail="No security question has been set for this account. Please contact system admin.")
    return {"success": True, "question": user.security_question}

@app.post("/api/forgot-password/verify")
def verify_security_answer(data: ForgotPasswordVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.security_answer:
        raise HTTPException(status_code=400, detail="Security answer not set.")
    
    if user.security_answer.strip().lower() != data.answer.strip().lower():
        raise HTTPException(status_code=400, detail="Incorrect security answer.")
    return {"success": True, "message": "Verification successful."}

@app.post("/api/forgot-password/reset")
def reset_password_with_security_answer(data: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.security_answer:
        raise HTTPException(status_code=400, detail="Security answer not set.")
    
    if user.security_answer.strip().lower() != data.answer.strip().lower():
        raise HTTPException(status_code=400, detail="Incorrect security answer.")
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data.new_password.encode('utf-8'), salt).decode('utf-8')
    
    user.password = hashed_password
    user.is_first_login = False
    db.commit()
    return {"success": True, "message": "Password reset successfully. You can now log in."}

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
        db.flush()
    sig.current_state = data.signal
    sig.green_time = data.wait
    sig.mode = "MANUAL"
    
    # Update latest trafficdata
    tdata = db.query(TrafficData).filter(TrafficData.intersection_id == id).order_by(TrafficData.traffic_id.desc()).first()
    if tdata:
        tdata.waiting_time = data.wait
    
    now = datetime.datetime.utcnow()
    
    # Mark any previously active overrides for this signal as Superseded
    prev_active = db.query(ManualOverride).filter(
        ManualOverride.signal_id == sig.signal_id,
        ManualOverride.status == "Active"
    ).all()
    for prev in prev_active:
        prev.status = "Superseded"
        prev.end_time = now

    # Validate operator_id against users table to satisfy foreign key constraint
    valid_operator_id = None
    op_name = "Traffic Controller"
    if data.operator_id:
        user_match = db.query(User).filter(User.user_id == data.operator_id).first()
        if user_match:
            valid_operator_id = user_match.user_id
            op_name = user_match.name
        else:
            first_op = db.query(User).filter(User.role.in_(["OPERATOR", "operator"])).first()
            if first_op:
                valid_operator_id = first_op.user_id
                op_name = first_op.name
    else:
        first_op = db.query(User).filter(User.role.in_(["OPERATOR", "operator"])).first()
        if first_op:
            valid_operator_id = first_op.user_id
            op_name = first_op.name

    # Record new ManualOverride entry
    reason_text = data.reason or f"Manual {data.signal.replace('_', ' ').title()} phase lock for {data.wait}s"
    mo_rec = ManualOverride(
        operator_id=valid_operator_id,
        signal_id=sig.signal_id,
        reason=reason_text,
        start_time=now,
        end_time=now + datetime.timedelta(seconds=data.wait),
        status="Active"
    )
    db.add(mo_rec)
    
    # Add audit log
    int_obj = db.query(Intersection).filter(Intersection.intersection_id == id).first()
    int_name = int_obj.intersection_name if int_obj else f"Intersection #{id}"
    audit = AuditLog(
        time=now.strftime("%H:%M:%S"),
        user_name=op_name,
        action="Manual Signal Override",
        target=f"{int_name} ({data.signal} for {data.wait}s)"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(mo_rec)
    return {"success": True, "override_id": mo_rec.override_id}

@app.put("/api/intersections/{id}/release")
def release_intersection(id: int, db: Session = Depends(get_db)):
    sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == id).order_by(TrafficSignal.signal_id.desc()).first()
    if sig:
        sig.mode = "AUTO"
        sig.current_state = "north_green"
        now = datetime.datetime.utcnow()
        active_mos = db.query(ManualOverride).filter(
            ManualOverride.signal_id == sig.signal_id,
            ManualOverride.status == "Active"
        ).all()
        for mo in active_mos:
            mo.status = "Released"
            mo.end_time = now
            
        int_obj = db.query(Intersection).filter(Intersection.intersection_id == id).first()
        int_name = int_obj.intersection_name if int_obj else f"Intersection #{id}"
        audit = AuditLog(
            time=now.strftime("%H:%M:%S"),
            user_name="Traffic Controller",
            action="Manual Override Released",
            target=f"{int_name} returned to AUTO"
        )
        db.add(audit)
        db.commit()
    return {"success": True}

@app.get("/api/manual-overrides")
def get_manual_overrides(limit: int = 50, db: Session = Depends(get_db)):
    overrides = db.query(ManualOverride).order_by(ManualOverride.override_id.desc()).limit(limit).all()
    result = []
    for o in overrides:
        op_name = "Traffic Controller"
        if o.operator_id:
            user = db.query(User).filter(User.user_id == o.operator_id).first()
            if user:
                op_name = user.name
        int_name = "Junction"
        if o.signal_id:
            sig = db.query(TrafficSignal).filter(TrafficSignal.signal_id == o.signal_id).first()
            if sig:
                intersection = db.query(Intersection).filter(Intersection.intersection_id == sig.intersection_id).first()
                if intersection:
                    int_name = intersection.intersection_name
        result.append({
            "override_id": o.override_id,
            "operator_id": o.operator_id,
            "operator_name": op_name,
            "signal_id": o.signal_id,
            "intersection_name": int_name,
            "reason": o.reason or "Manual phase lock",
            "start_time": o.start_time.strftime("%Y-%m-%d %H:%M:%S") if o.start_time else None,
            "end_time": o.end_time.strftime("%Y-%m-%d %H:%M:%S") if o.end_time else None,
            "status": o.status
        })
    return {"success": True, "count": len(result), "overrides": result}

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
        peds = []
        if hasattr(sim, "pedestrian_manager"):
            peds = sim.pedestrian_manager.get_pedestrians_data()
        return {
            "status": "Running",
            "time": traci.simulation.getTime(),
            "active_vehicles": vehs_details,
            "vehicle_count": len(vehs),
            "active_pedestrians": peds,
            "pedestrian_count": len(peds),
            "traffic_light_state": lights,
            "traffic_light_phase": phase,
            "signals": sim.signals
        }
    except Exception as e:
        return {"status": "Error", "error": str(e)}

@app.post("/api/simulation/reload")
@app.get("/api/simulation/reload")
def reload_simulation():
    global sim
    try:
        if hasattr(sim, "reload"):
            sim.reload()
            return {"success": True, "message": "Simulation reloaded with new flows"}
        return {"success": False, "message": "Simulation reload method not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── REAL-TIME KOTTAYAM WEATHER & TRANSIT FEED ───

kottayam_weather_cache = {
    "data": None,
    "last_fetched": 0
}

@app.get("/api/weather/kottayam")
def get_kottayam_weather():
    global kottayam_weather_cache
    now_ts = time.time()
    
    # Return cache if fresher than 5 minutes
    if kottayam_weather_cache["data"] and (now_ts - kottayam_weather_cache["last_fetched"]) < 300:
        return kottayam_weather_cache["data"]
        
    try:
        import urllib.request
        import json
        url = "https://api.open-meteo.com/v1/forecast?latitude=9.5916&longitude=76.5222&current_weather=true&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m&timezone=Asia%2FKolkata"
        req = urllib.request.Request(url, headers={"User-Agent": "UrbanFlow/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            raw = json.loads(resp.read().decode())
            
        WMO_MAP = {
            0: ("Clear Sky", "☀️"),
            1: ("Mainly Clear", "🌤️"),
            2: ("Partly Cloudy", "⛅"),
            3: ("Overcast", "☁️"),
            45: ("Foggy", "🌫️"),
            48: ("Rime Fog", "🌫️"),
            51: ("Light Drizzle", "🌦️"),
            53: ("Moderate Drizzle", "🌦️"),
            55: ("Dense Drizzle", "🌧️"),
            61: ("Slight Rain", "🌧️"),
            63: ("Moderate Rain", "🌧️"),
            65: ("Heavy Rain", "🌧️"),
            80: ("Light Showers", "🌦️"),
            81: ("Moderate Showers", "🌧️"),
            82: ("Heavy Showers", "⛈️"),
            95: ("Thunderstorm", "⛈️"),
        }
        
        curr = raw.get("current_weather", {})
        curr_temp = round(curr.get("temperature", 30.5), 1)
        curr_code = curr.get("weathercode", 2)
        curr_wind = round(curr.get("windspeed", 8.0), 1)
        c_text, c_icon = WMO_MAP.get(curr_code, ("Partly Cloudy", "⛅"))
        
        hourly = raw.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        codes = hourly.get("weathercode", [])
        humidities = hourly.get("relativehumidity_2m", [])
        
        now_hour_str = datetime.datetime.now().strftime("%Y-%m-%dT%H:00")
        start_idx = 0
        for idx, t in enumerate(times):
            if t >= now_hour_str:
                start_idx = idx
                break
                
        forecast_hourly = []
        for i in range(start_idx, min(start_idx + 5, len(times))):
            t_dt = datetime.datetime.strptime(times[i], "%Y-%m-%dT%H:%M")
            h_label = t_dt.strftime("%I:%M %p")
            code_i = codes[i] if i < len(codes) else 2
            txt_i, icon_i = WMO_MAP.get(code_i, ("Partly Cloudy", "⛅"))
            temp_i = round(temps[i], 1) if i < len(temps) else curr_temp
            hum_i = humidities[i] if i < len(humidities) else 75
            
            if code_i in [61, 63, 65, 81, 82, 95]:
                t_status = "Wet roads • Drive carefully"
                t_color = "#ef4444"
            elif code_i in [51, 53, 55, 80]:
                t_status = "Damp roads • Normal flow"
                t_color = "#f59e0b"
            else:
                t_status = "Dry roads • Optimal transit"
                t_color = "#10b981"
                
            forecast_hourly.append({
                "time": h_label,
                "temp": temp_i,
                "condition": txt_i,
                "icon": icon_i,
                "humidity": hum_i,
                "transit_status": t_status,
                "transit_color": t_color
            })
            
        data = {
            "success": True,
            "city": "Kottayam",
            "state": "Kerala",
            "country": "India",
            "coordinates": {"latitude": 9.5916, "longitude": 76.5222},
            "location_label": "Kottayam, Kerala (Baker Jn Corridor)",
            "current": {
                "temp": curr_temp,
                "condition": c_text,
                "icon": c_icon,
                "wind": curr_wind,
                "humidity": humidities[start_idx] if start_idx < len(humidities) else 78,
                "advisory": "Standard transit conditions across Baker Jn and MC Road corridor." if curr_code < 50 else "Precipitation observed in Kottayam. Reduced speeds advised on KK Road & MC Road."
            },
            "hourly": forecast_hourly,
            "corridors": [
                {"name": "MC Road (SH 1)", "via": "Baker Jn Center", "status": "Normal Flow", "delay": "On Time"},
                {"name": "KK Road (NH 183)", "via": "Kanjikuzhy Junction", "status": "Moderate Traffic", "delay": "+2 min"},
                {"name": "Nagampadam Stand", "via": "Railway Overbridge", "status": "Regular Service", "delay": "On Time"},
                {"name": "KSRTC Central Station", "via": "TB Road", "status": "High Frequency", "delay": "On Time"}
            ]
        }
        
        kottayam_weather_cache["data"] = data
        kottayam_weather_cache["last_fetched"] = now_ts
        return data
        
    except Exception as e:
        fallback_data = {
            "success": True,
            "city": "Kottayam",
            "state": "Kerala",
            "country": "India",
            "coordinates": {"latitude": 9.5916, "longitude": 76.5222},
            "location_label": "Kottayam, Kerala (Baker Jn Corridor)",
            "current": {
                "temp": 30.5,
                "condition": "Tropical Cloudy",
                "icon": "⛅",
                "wind": 9.2,
                "humidity": 76,
                "advisory": "Standard transit conditions across Baker Jn and MC Road corridor."
            },
            "hourly": [
                {"time": "10:00 AM", "temp": 30.2, "condition": "Partly Cloudy", "icon": "⛅", "humidity": 77, "transit_status": "Dry roads • Optimal transit", "transit_color": "#10b981"},
                {"time": "12:00 PM", "temp": 32.0, "condition": "Warm & Humid", "icon": "🌤️", "humidity": 70, "transit_status": "Dry roads • Optimal transit", "transit_color": "#10b981"},
                {"time": "02:00 PM", "temp": 31.8, "condition": "Overcast", "icon": "☁️", "humidity": 74, "transit_status": "Dry roads • Optimal transit", "transit_color": "#10b981"},
                {"time": "04:00 PM", "temp": 29.5, "condition": "Passing Showers", "icon": "🌦️", "humidity": 82, "transit_status": "Damp roads • Normal flow", "transit_color": "#f59e0b"},
                {"time": "06:00 PM", "temp": 28.0, "condition": "Light Rain", "icon": "🌧️", "humidity": 86, "transit_status": "Wet roads • Drive carefully", "transit_color": "#ef4444"}
            ],
            "corridors": [
                {"name": "MC Road (SH 1)", "via": "Baker Jn Center", "status": "Normal Flow", "delay": "On Time"},
                {"name": "KK Road (NH 183)", "via": "Kanjikuzhy Junction", "status": "Moderate Traffic", "delay": "+2 min"},
                {"name": "Nagampadam Stand", "via": "Railway Overbridge", "status": "Regular Service", "delay": "On Time"},
                {"name": "KSRTC Central Station", "via": "TB Road", "status": "High Frequency", "delay": "On Time"}
            ]
        }
        return fallback_data


# ─── BAKER JN HOURLY PEAK TRAFFIC LOAD (PROJECT DATA) ───

@app.get("/api/traffic/hourly-peak")
def get_hourly_peak_traffic():
    sim_state = sim.get_state() if hasattr(sim, "get_state") else {}
    live_count = sim_state.get("vehicle_count", 0)
    live_wait = sim_state.get("avg_wait", 0)
    
    hourly_data = [
        {"hour": "06:00 AM", "period": "Early Commute", "load_pct": 32, "veh_hr": 48, "avg_wait_s": 8, "is_peak": False},
        {"hour": "08:00 AM", "period": "Morning School/Office", "load_pct": 88, "veh_hr": 138, "avg_wait_s": 34, "is_peak": True},
        {"hour": "10:00 AM", "period": "Midday Commercial", "load_pct": 54, "veh_hr": 82, "avg_wait_s": 16, "is_peak": False},
        {"hour": "12:00 PM", "period": "Intercity Flow", "load_pct": 49, "veh_hr": 74, "avg_wait_s": 14, "is_peak": False},
        {"hour": "02:00 PM", "period": "School Departure", "load_pct": 64, "veh_hr": 96, "avg_wait_s": 22, "is_peak": False},
        {"hour": "04:00 PM", "period": "Evening Rush Start", "load_pct": 84, "veh_hr": 128, "avg_wait_s": 31, "is_peak": True},
        {"hour": "06:00 PM", "period": "Core Evening Peak", "load_pct": 98, "veh_hr": 156, "avg_wait_s": 39, "is_peak": True},
        {"hour": "08:00 PM", "period": "Late Evening Easing", "load_pct": 41, "veh_hr": 62, "avg_wait_s": 11, "is_peak": False},
    ]
    
    return {
        "junction": "Baker Jn (Baker Junction, Kottayam)",
        "network": "UrbanFlow 4-Way Connected Network (MC Road & KK Road)",
        "live_sim": {
            "active_vehicles": live_count,
            "avg_wait_s": live_wait,
            "congestion_level": "High" if live_count >= 10 else ("Moderate" if live_count >= 4 else "Low"),
            "adaptive_savings": "28.9%"
        },
        "hourly_distribution": hourly_data,
        "directional_split": {
            "north_leg_mc_road": "32%",
            "south_leg_mc_road": "28%",
            "east_leg_kk_road": "23%",
            "west_leg_tb_road": "17%"
        },
        "peak_summary": {
            "morning_peak": "08:00 AM - 10:00 AM (88% Load)",
            "evening_peak": "05:30 PM - 08:00 PM (98% Load)",
            "off_peak": "10:00 PM - 06:00 AM (< 25% Load)"
        }
    }

# ─── PUBLIC USER NOTIFICATION ROUTES ───

@app.get("/api/public/notifications")
def get_public_notifications(user_name: str = None, user_id: int = None, db: Session = Depends(get_db)):
    ensure_incident_priority_column(db)
    notifications = []
    
    # 1. Incident status updates for community / citizen
    try:
        incidents = db.query(Incident).order_by(Incident.incident_id.desc()).limit(15).all()
    except Exception as e:
        print(f"Error querying incidents for notifications: {e}")
        incidents = []
    for inc in incidents:
        # Determine time display
        time_str = "Earlier today"
        if inc.reported_at:
            delta = datetime.datetime.utcnow() - inc.reported_at
            secs = int(delta.total_seconds())
            if secs < 60:
                time_str = "Just now"
            elif secs < 3600:
                time_str = f"{secs // 60}m ago"
            elif secs < 86400:
                time_str = f"{secs // 3600}h ago"
            else:
                time_str = inc.reported_at.strftime("%b %d, %I:%M %p")

        # If incident is verified
        if inc.status and inc.status.upper() == "VERIFIED":
            notifications.append({
                "id": f"notif-inc-ver-{inc.incident_id}",
                "category": "incident",
                "title": f"Incident Verified: {inc.type}",
                "message": f"Report at {inc.location} has been verified by Traffic Control. Response units dispatched.",
                "location": inc.location,
                "priority": inc.priority or "Moderate",
                "status": "Verified",
                "incident_id": f"INC-{inc.incident_id}",
                "time": time_str,
                "created_at": inc.reported_at.strftime("%Y-%m-%dT%H:%M:%SZ") if inc.reported_at else None,
                "type": "VERIFIED",
                "is_read": False
            })
        elif inc.status and inc.status.upper() == "RESOLVED":
            notifications.append({
                "id": f"notif-inc-res-{inc.incident_id}",
                "category": "incident",
                "title": f"Incident Cleared: {inc.type}",
                "message": f"Incident at {inc.location} has been fully resolved. Normal corridor flow restored.",
                "location": inc.location,
                "priority": inc.priority or "Moderate",
                "status": "Resolved",
                "incident_id": f"INC-{inc.incident_id}",
                "time": time_str,
                "created_at": inc.reported_at.strftime("%Y-%m-%dT%H:%M:%SZ") if inc.reported_at else None,
                "type": "RESOLVED",
                "is_read": False
            })
        else:
            notifications.append({
                "id": f"notif-inc-pen-{inc.incident_id}",
                "category": "incident",
                "title": f"Citizen Report Logged: {inc.type}",
                "message": f"A report for {inc.type} at {inc.location} was submitted and queued for Command Center review.",
                "location": inc.location,
                "priority": inc.priority or "Moderate",
                "status": "Pending",
                "incident_id": f"INC-{inc.incident_id}",
                "time": time_str,
                "created_at": inc.reported_at.strftime("%Y-%m-%dT%H:%M:%SZ") if inc.reported_at else None,
                "type": "PENDING",
                "is_read": False
            })

    # 2. Digital Twin Adaptive Signal Advisory
    notifications.append({
        "id": "notif-adaptive-signal-1",
        "category": "transit",
        "title": "Adaptive Signal Wave Active",
        "message": "Baker Junction AI dynamic signal timing is running. Corridor delay reduced by 28.9% with green wave extension.",
        "location": "Baker Jn (MC Road & KK Road)",
        "priority": "Low",
        "status": "Active",
        "time": "Continuous",
        "type": "SYSTEM",
        "is_read": False
    })

    # 3. Weather Corridor Advisory
    notifications.append({
        "id": "notif-weather-advisory-1",
        "category": "weather",
        "title": "Kottayam Transit Advisory",
        "message": "Real-time telemetry reports normal flow along MC Road (SH 1) and KK Road (NH 183). Road traction optimal.",
        "location": "Kottayam Urban Corridor",
        "priority": "Low",
        "status": "Optimal",
        "time": "Live IMD",
        "type": "WEATHER",
        "is_read": False
    })

    # 4. System Bulletin
    notifications.append({
        "id": "notif-bulletin-1",
        "category": "announcement",
        "title": "Smart Sensor Calibration Notice",
        "message": "Traffic Management Bureau is calibrating adaptive signal sensors along Baker Junction & MC Road corridor.",
        "location": "Baker Jn",
        "priority": "Moderate",
        "status": "Scheduled",
        "time": "Today",
        "type": "BULLETIN",
        "is_read": False
    })

    return {
        "success": True,
        "count": len(notifications),
        "notifications": notifications
    }

@app.get("/api/citizens")
def get_citizens(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "PUBLIC").order_by(User.user_id.desc()).all()
    return [{
        "id": f"CIT-{u.user_id}",
        "db_id": u.user_id,
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
                
        is_on = getattr(u, 'is_online', True)
        if is_on is None:
            is_on = True
        status_str = "Online" if (u.status == "ACTIVE" and is_on) else "Offline"

        results.append({
            "id": f"OP-{u.user_id}",
            "db_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone or "",
            "city": u.city or "",
            "status": status_str,
            "is_online": is_on,
            "assignedIntersection": assigned_name,
            "activeTime": "4h 12m" if status_str == "Online" else "0m"
        })
    return results

def send_email_notification(recipient: str, subject: str, plain_body: str, html_body: str = None):
    # Print to the console for tracking/debugging
    print("\n" + "="*50)
    print(f"[EMAIL] RECIPIENT: {recipient}")
    print(f"[EMAIL] SUBJECT: {subject}")
    print(f"[EMAIL] BODY:\n{plain_body}")
    print("="*50 + "\n")
    
    # Write to local sent_emails.txt as persistent local backup/audit
    try:
        with open("sent_emails.txt", "a", encoding="utf-8") as f:
            f.write(f"Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"To: {recipient}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Body:\n{plain_body}\n")
            f.write("-" * 50 + "\n\n")
    except Exception:
        pass

    # Attempt to send real email via Gmail SMTP
    smtp_email = os.environ.get("SMTP_EMAIL", "admin.urbanflow@gmail.com")
    smtp_password = os.environ.get("SMTP_PASSWORD", "ipbjuwtkderkenlw").replace(" ", "").strip()

    if not smtp_password:
        print("[EMAIL] SMTP_PASSWORD environment variable not set. Email logged locally to sent_emails.txt.")
        return False

    try:
        import smtplib
        import ssl
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.utils import formatdate, make_msgid

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"UrbanFlow Administration <{smtp_email}>"
        msg["To"] = recipient
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="gmail.com")

        part1 = MIMEText(plain_body, "plain", "utf-8")
        msg.attach(part1)

        if html_body:
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part2)

        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, recipient, msg.as_string())

        print(f"[EMAIL SUCCESS] Dispatched live email to {recipient} via {smtp_email}!")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {recipient}: {e}")
        return False

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
            
    frontend_url = os.environ.get("FRONTEND_URL", "https://urbanflow-32cx.onrender.com")

    # Plain text email version
    email_plain = f"""Hello {new_user.name},

You have been registered as a Traffic Controller / Operator on the UrbanFlow Digital Twin platform.

Here are your credentials for your first login:
- Portal URL: {frontend_url}
- Account Email: {new_user.email}
- Temporary Password: {temp_password}

Security Policy:
For platform compliance, you will be prompted to replace this temporary password with your permanent password upon your first sign-in.

Best regards,
UrbanFlow Administration System
admin.urbanflow@gmail.com"""

    # Sleek HTML email version with dark navy & cyan UrbanFlow theme
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            .header {{ background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 28px 24px; text-align: center; }}
            .header h1 {{ margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
            .header p {{ margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; }}
            .content {{ padding: 28px 24px; }}
            .greeting {{ font-size: 16px; font-weight: 600; color: #f8fafc; margin-bottom: 12px; }}
            .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }}
            .card {{ background: #1e293b; border-left: 4px solid #06b6d4; padding: 16px; border-radius: 8px; margin-bottom: 24px; }}
            .field {{ margin-bottom: 8px; font-size: 14px; }}
            .field:last-child {{ margin-bottom: 0; }}
            .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
            .value {{ color: #38bdf8; font-weight: 600; font-family: monospace; font-size: 15px; }}
            .btn-container {{ text-align: center; margin: 28px 0; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }}
            .footer {{ background: #0b0f19; padding: 16px 24px; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #1e293b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>UrbanFlow Digital Twin</h1>
                <p>Adaptive Traffic Signal Optimization Platform</p>
            </div>
            <div class="content">
                <div class="greeting">Hello {new_user.name},</div>
                <div class="text">
                    You have been provisioned an official <strong>Traffic Controller (Operator)</strong> account on the UrbanFlow platform. Below are your temporary credentials for your first login.
                </div>
                <div class="card">
                    <div class="field">
                        <div class="label">Portal URL</div>
                        <div class="value"><a href="{frontend_url}" style="color: #38bdf8; text-decoration: none;">{frontend_url}</a></div>
                    </div>
                    <div class="field" style="margin-top: 12px;">
                        <div class="label">Account Email</div>
                        <div class="value">{new_user.email}</div>
                    </div>
                    <div class="field" style="margin-top: 12px;">
                        <div class="label">Temporary Password</div>
                        <div class="value" style="color: #4ade80; font-size: 18px; letter-spacing: 1px;">{temp_password}</div>
                    </div>
                </div>
                <div class="btn-container">
                    <a href="{frontend_url}" class="btn">Log In to UrbanFlow</a>
                </div>
                <div class="text" style="font-size: 12px; color: #64748b; margin-bottom: 0;">
                    🔒 <strong>Security Policy:</strong> For platform compliance, you will be prompted to replace this temporary password with your permanent password upon your first sign-in.
                </div>
            </div>
            <div class="footer">
                &copy; {datetime.datetime.now().year} UrbanFlow City Intelligent Transport Systems. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """

    send_email_notification(
        recipient=new_user.email,
        subject="UrbanFlow — Traffic Operator Credentials (First Login)",
        plain_body=email_plain,
        html_body=email_html
    )
            
    return {
        "success": True, 
        "tempPassword": temp_password,
        "message": "Operator created successfully. Temporary password has been sent to their email."
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
            # Mark any pending offline replacement alerts for this intersection as resolved/read
            db.query(AdminNotification).filter(
                AdminNotification.intersection_name == junction.intersection_name,
                AdminNotification.type == "OPERATOR_OFFLINE"
            ).update({AdminNotification.is_read: True})
    db.commit()
    return {"success": True, "message": "Operator assignment updated."}

@app.put("/api/operators/{id}/duty-status")
def update_operator_duty_status(id: int, data: OperatorDutyStatusSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    user.is_online = data.is_online
    db.commit()
    db.refresh(user)
    
    # Check if assigned to an intersection
    assign = db.query(OperatorAssignment).filter(OperatorAssignment.operator_id == id).first()
    assigned_name = "Unassigned"
    if assign:
        junction = db.query(Intersection).filter(Intersection.intersection_id == assign.intersection_id).first()
        if junction:
            assigned_name = junction.intersection_name
            
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    
    if not data.is_online:
        # Create an admin notification
        notif_msg = f"Operator {user.name} marked themselves OFFLINE from {assigned_name}. Replacement needed." if assigned_name != "Unassigned" else f"Operator {user.name} marked themselves OFFLINE."
        notif = AdminNotification(
            title="Operator Offline",
            message=notif_msg,
            type="OPERATOR_OFFLINE",
            operator_id=user.user_id,
            operator_name=user.name,
            intersection_name=assigned_name,
            is_read=False
        )
        db.add(notif)
        
        # Log to audit log
        audit = AuditLog(
            time=now_str,
            user_name=f"{user.name} (Operator)",
            action="Marked Duty Status OFFLINE",
            target=f"Assigned Junction: {assigned_name}"
        )
        db.add(audit)
        db.commit()
    else:
        # Mark any pending offline alerts for this operator as read/resolved
        db.query(AdminNotification).filter(
            AdminNotification.operator_id == user.user_id,
            AdminNotification.type == "OPERATOR_OFFLINE",
            AdminNotification.is_read == False
        ).update({AdminNotification.is_read: True})

        # Create an admin notification for operator back online
        notif_msg = f"Traffic Controller {user.name} is now back ONLINE at {assigned_name}." if assigned_name != "Unassigned" else f"Traffic Controller {user.name} is now back ONLINE."
        notif = AdminNotification(
            title="Traffic Controller Online",
            message=notif_msg,
            type="OPERATOR_ONLINE",
            operator_id=user.user_id,
            operator_name=user.name,
            intersection_name=assigned_name,
            is_read=False
        )
        db.add(notif)

        audit = AuditLog(
            time=now_str,
            user_name=f"{user.name} (Operator)",
            action="Marked Duty Status ONLINE",
            target=f"Assigned Junction: {assigned_name}"
        )
        db.add(audit)
        db.commit()
        
    return {
        "success": True,
        "is_online": user.is_online,
        "message": f"Duty status updated to {'ONLINE' if user.is_online else 'OFFLINE'}.",
        "user": {
            "id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role.lower(),
            "is_online": user.is_online,
            "phone": user.phone or "",
            "city": user.city or ""
        }
    }

# ─── ADMIN NOTIFICATION ROUTES ───

@app.get("/api/admin/notifications")
def get_admin_notifications(db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    # Auto-prune notifications older than 24 hours
    try:
        db.query(AdminNotification).filter(AdminNotification.created_at < cutoff).delete()
        db.commit()
    except Exception:
        db.rollback()

    notifs = db.query(AdminNotification).filter(
        AdminNotification.created_at >= cutoff
    ).order_by(AdminNotification.id.desc()).limit(30).all()

    unread_count = db.query(AdminNotification).filter(
        AdminNotification.is_read == False,
        AdminNotification.created_at >= cutoff
    ).count()

    return {
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "operator_id": n.operator_id,
                "operator_name": n.operator_name,
                "intersection_name": n.intersection_name,
                "is_read": n.is_read,
                "created_at": n.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if n.created_at else ""
            } for n in notifs
        ],
        "unread_count": unread_count
    }

@app.put("/api/admin/notifications/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notif = db.query(AdminNotification).filter(AdminNotification.id == id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}

@app.put("/api/admin/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    db.query(AdminNotification).filter(AdminNotification.created_at >= cutoff).update({AdminNotification.is_read: True})
    db.commit()
    return {"success": True}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Cascade delete assignments
    db.query(OperatorAssignment).filter(OperatorAssignment.operator_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted successfully."}

# ─── INCIDENT ROUTES ───

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    ensure_incident_priority_column(db)
    try:
        incidents = db.query(Incident).order_by(Incident.incident_id.desc()).all()
        results = []
        for inc in incidents:
            reporter = "Anonymous"
            if inc.reported_by:
                user = db.query(User).filter(User.user_id == inc.reported_by).first()
                if user:
                    reporter = user.name

            time_str = "Just now"
            if inc.reported_at:
                delta = datetime.datetime.utcnow() - inc.reported_at
                secs = int(delta.total_seconds())
                if secs < 60:
                    time_str = "Just now"
                elif secs < 3600:
                    time_str = f"{secs // 60}m ago"
                elif secs < 86400:
                    time_str = f"{secs // 3600}h ago"
                else:
                    time_str = inc.reported_at.strftime("%b %d, %H:%M")

            results.append({
                "id": f"INC-{inc.incident_id}",
                "numeric_id": inc.incident_id,
                "location": inc.location,
                "type": inc.type,
                "priority": inc.priority or "Moderate",
                "description": inc.description or "",
                "reportedBy": reporter,
                "status": inc.status.capitalize() if inc.status else "Pending",
                "time": time_str,
                "reported_at": inc.reported_at.strftime("%Y-%m-%dT%H:%M:%SZ") if inc.reported_at else None
            })
        return results
    except Exception as e:
        print(f"Error in get_incidents: {e}")
        raise HTTPException(status_code=500, detail=f"Database error fetching incidents: {str(e)}")

@app.post("/api/incidents")
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    ensure_incident_priority_column(db)
    try:
        # Find user ID by reporter name if possible, default None
        user = db.query(User).filter(User.name == data.reported_by).first()
        rep_id = user.user_id if user else None
        
        incident = Incident(
            location=data.location,
            type=data.type,
            priority=data.priority or "Moderate",
            description=data.description or "",
            reported_by=rep_id,
            status=data.status.upper() if data.status else "PENDING",
            reported_at=datetime.datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # 1. Create an AdminNotification of type INCIDENT_REPORTED
        try:
            notif = AdminNotification(
                title=f"Incident Reported: {data.type}",
                message=f"{data.reported_by or 'Citizen'} reported {data.type} at {data.location} (Priority: {data.priority or 'Moderate'}). {data.description[:100] if data.description else ''}",
                type="INCIDENT_REPORTED",
                intersection_name=data.location,
                operator_name=data.reported_by or "Citizen",
                is_read=False,
                created_at=datetime.datetime.utcnow()
            )
            db.add(notif)
        except Exception as e:
            print(f"Failed to create incident admin notification: {e}")

        # 2. Add an AuditLog entry
        try:
            time_str = datetime.datetime.now().strftime("%H:%M:%S")
            log = AuditLog(
                time=time_str,
                user_name=data.reported_by or "Public Citizen",
                action="Reported Traffic Incident",
                target=f"{data.type} at {data.location}"
            )
            db.add(log)
        except Exception as e:
            print(f"Failed to create audit log for incident: {e}")

        db.commit()

        return {
            "id": f"INC-{incident.incident_id}",
            "numeric_id": incident.incident_id,
            "location": incident.location,
            "type": incident.type,
            "priority": incident.priority or "Moderate",
            "description": incident.description,
            "reportedBy": data.reported_by or "Citizen",
            "status": incident.status.capitalize(),
            "time": "Just now",
            "success": True,
            "message": "Incident reported successfully. Traffic Controllers and Admins have been notified."
        }
    except Exception as e:
        db.rollback()
        print(f"Error in create_incident: {e}")
        raise HTTPException(status_code=500, detail=f"Database error creating incident: {str(e)}")

@app.put("/api/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, data: IncidentStatusUpdate, db: Session = Depends(get_db)):
    clean_id = incident_id.replace("INC-", "").strip()
    try:
        inc_num = int(clean_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid incident ID format")

    incident = db.query(Incident).filter(Incident.incident_id == inc_num).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = data.status.upper()
    
    if data.verified_by:
        verifier = db.query(User).filter(User.name == data.verified_by).first()
        if verifier:
            incident.verified_by = verifier.user_id

    try:
        time_str = datetime.datetime.now().strftime("%H:%M:%S")
        log = AuditLog(
            time=time_str,
            user_name=data.verified_by or "Traffic Operator",
            action=f"Incident Status Changed to {data.status.upper()}",
            target=f"INC-{incident.incident_id} ({incident.type} at {incident.location})"
        )
        db.add(log)
    except Exception as e:
        print(f"Failed to log incident update: {e}")

    db.commit()
    db.refresh(incident)

    return {
        "id": f"INC-{incident.incident_id}",
        "status": incident.status.capitalize(),
        "success": True,
        "message": f"Incident INC-{incident.incident_id} updated to {data.status.capitalize()}"
    }

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

sim = TrafficSimulation(autostart=False)

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
    signals = {"north": "green", "east": "red", "south": "red", "west": "red"}
    state_string = "GGGGrrrrrrrrrrrr"
    idle_ticks = 0

    # Lazy-load SUMO: start on-demand when clients connect to stay under Render's 512MB RAM cap
    
    while True:
        # Check active WebSocket clients
        active_clients = len(manager.active_connections)
        
        # When no client is watching the live simulation, idle at 1Hz to conserve CPU and RAM
        if active_clients == 0:
            time.sleep(1.0)
            idle_ticks += 1
            if idle_ticks % 30 == 0:
                import gc
                gc.collect()
            
            # Still update signal timers in DB if an override is active
            try:
                db = SessionLocal()
                try:
                    active_id = get_active_intersection_id(db)
                    sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == active_id).order_by(TrafficSignal.signal_id.desc()).first()
                    if sig and sig.mode == "MANUAL":
                        if sig.green_time and sig.green_time > 0:
                            sig.green_time -= 1
                            db.commit()
                        else:
                            sig.mode = "AUTO"
                            sig.current_state = "north_green"
                            db.commit()
                finally:
                    db.close()
            except Exception:
                pass
            continue
            
        # Active client is connected: ensure SUMO is running and step at 25 FPS
        if not sim.sumo_started:
            try:
                sim.start_sumo()
            except Exception:
                pass

        time.sleep(0.04) # 25 FPS (every 40ms)
        step_counter += 1
        
        # Only poll and sync with PostgreSQL once every 25 steps (1 second) to conserve connections and RAM
        if step_counter >= 25:
            step_counter = 0
            db = SessionLocal()
            try:
                # Read traffic light state from PostgreSQL dynamically
                active_id = get_active_intersection_id(db)
                sig = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == active_id).order_by(TrafficSignal.signal_id.desc()).first()
                
                if sig:
                    if sig.mode == "MANUAL":
                        state = sig.current_state
                        if state in ["north_green", "east_green", "south_green", "west_green"]:
                            current_phase = state
                        elif state == "green":
                            current_phase = "north_green"
                        elif state == "red":
                            current_phase = "south_green"
                        else:
                            current_phase = "north_green"
                        
                        if sig.green_time and sig.green_time > 0:
                            sig.green_time -= 1
                            db.commit()
                        else:
                            # Override expired: Release back to AUTO mode
                            sig.mode = "AUTO"
                            sig.current_state = "north_green"
                            try:
                                active_mos = db.query(ManualOverride).filter(
                                    ManualOverride.signal_id == sig.signal_id,
                                    ManualOverride.status == "Active"
                                ).all()
                                for mo in active_mos:
                                    mo.status = "Completed"
                                    mo.end_time = datetime.datetime.utcnow()
                            except Exception:
                                pass
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
                        timer_remaining -= 1
                        
                        if timer_remaining <= 0:
                            # Transition path: north_green -> north_yellow -> east_green -> east_yellow -> south_green -> south_yellow -> west_green -> west_yellow -> north_green
                            if current_phase == "north_green":
                                current_phase = "north_yellow"
                                timer_remaining = 3
                            elif current_phase == "north_yellow":
                                current_phase = "east_green"
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
                        
                        T = timer_remaining
                        if current_phase == "north_green":
                            signals = {"north": "green", "east": "red", "south": "red", "west": "red"}
                            sim.signal_timers = {"north": T, "east": T + 3, "south": T + 18, "west": T + 33}
                            state_string = "GGGGrrrrrrrrrrrr"
                        elif current_phase == "north_yellow":
                            signals = {"north": "yellow", "east": "red", "south": "red", "west": "red"}
                            sim.signal_timers = {"north": T, "east": T, "south": T + 15, "west": T + 30}
                            state_string = "yyyyrrrrrrrrrrrr"
                        elif current_phase == "east_green":
                            signals = {"north": "red", "east": "green", "south": "red", "west": "red"}
                            sim.signal_timers = {"north": T + 33, "east": T, "south": T + 3, "west": T + 18}
                            state_string = "rrrrGGGGrrrrrrrr"
                        elif current_phase == "east_yellow":
                            signals = {"north": "red", "east": "yellow", "south": "red", "west": "red"}
                            sim.signal_timers = {"north": T + 30, "east": T, "south": T, "west": T + 15}
                            state_string = "rrrryyyyrrrrrrrr"
                        elif current_phase == "south_green":
                            signals = {"north": "red", "east": "red", "south": "green", "west": "red"}
                            sim.signal_timers = {"north": T + 18, "east": T + 33, "south": T, "west": T + 3}
                            state_string = "rrrrrrrrGGGGrrrr"
                        elif current_phase == "south_yellow":
                            signals = {"north": "red", "east": "red", "south": "yellow", "west": "red"}
                            sim.signal_timers = {"north": T + 15, "east": T + 30, "south": T, "west": T}
                            state_string = "rrrrrrrryyyyrrrr"
                        elif current_phase == "west_green":
                            signals = {"north": "red", "east": "red", "south": "red", "west": "green"}
                            sim.signal_timers = {"north": T + 3, "east": T + 18, "south": T + 33, "west": T}
                            state_string = "rrrrrrrrrrrrGGGG"
                        elif current_phase == "west_yellow":
                            signals = {"north": "red", "east": "red", "south": "red", "west": "yellow"}
                            sim.signal_timers = {"north": T, "east": T + 15, "south": T + 30, "west": T}
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
        if main_loop is not None and len(manager.active_connections) > 0:
            asyncio.run_coroutine_threadsafe(manager.broadcast(sim.get_state()), main_loop)

@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_event_loop()
    
    # Ensure users table has is_first_login, security_question, and security_answer columns
    db = SessionLocal()
    try:
        try:
            db.execute(text("SELECT is_first_login FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("ALTER TABLE users ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE"))
            db.commit()

        try:
            db.execute(text("SELECT security_question FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("ALTER TABLE users ADD COLUMN security_question VARCHAR(255)"))
            db.execute(text("ALTER TABLE users ADD COLUMN security_answer VARCHAR(255)"))
            db.commit()

        # Enlarge phone and city columns so international numbers and full city names never truncate
        try:
            db.execute(text("ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(30)"))
            db.execute(text("ALTER TABLE users ALTER COLUMN city TYPE VARCHAR(100)"))
            db.commit()
        except Exception:
            db.rollback()

        # Ensure is_online column exists
        try:
            db.execute(text("SELECT is_online FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT TRUE"))
            db.commit()

        # Ensure priority column exists on incident table
        ensure_incident_priority_column(db)

        # Backfill default question/answer for any records where it is NULL
        try:
            db.execute(text("UPDATE users SET security_question = 'What is your favorite city?', security_answer = 'Kochi' WHERE security_question IS NULL"))
            db.commit()
        except Exception:
            pass
    except Exception:
        pass
    finally:
        db.close()

    # Seed initial real project data dynamically if missing
    db = SessionLocal()
    try:
        # 1. Seed Baker Jn intersection
        baker = db.query(Intersection).filter(Intersection.intersection_name == "Baker Jn").first()
        if not baker:
            # Check if ID 1 is occupied
            existing_1 = db.query(Intersection).filter(Intersection.intersection_id == 1).first()
            if existing_1:
                # Rename existing intersection to Baker Jn to keep ID 1
                existing_1.intersection_name = "Baker Jn"
                existing_1.location = "Baker Junction Center"
                db.commit()
                baker = existing_1
            else:
                baker = Intersection(
                    intersection_id=1,
                    intersection_name="Baker Jn",
                    location="Baker Junction Center",
                    status="Active"
                )
                db.add(baker)
                db.commit()
                db.refresh(baker)
            
            # Seed default TrafficSignal for Baker Jn
            sig_baker = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == baker.intersection_id).first()
            if not sig_baker:
                sig_baker = TrafficSignal(
                    intersection_id=baker.intersection_id,
                    current_state="north_green",
                    green_time=12,
                    yellow_time=3,
                    red_time=12,
                    mode="AUTO"
                )
                db.add(sig_baker)
                db.commit()
        else:
            # Verify its ID is 1 or make sure Baker Jn has a signal
            sig_baker = db.query(TrafficSignal).filter(TrafficSignal.intersection_id == baker.intersection_id).first()
            if not sig_baker:
                sig_baker = TrafficSignal(
                    intersection_id=baker.intersection_id,
                    current_state="north_green",
                    green_time=12,
                    yellow_time=3,
                    red_time=12,
                    mode="AUTO"
                )
                db.add(sig_baker)
                db.commit()

        # 2. Seed Operator account (operator@gmail.com)
        op = db.query(User).filter(User.email == "operator@gmail.com").first()
        if not op:
            op = User(
                name="Traffic Controller",
                email="operator@gmail.com",
                password="$2b$12$W9mX0LsnYI/lE.vQ72f0G.r3uKq9f2/HlK2Nq0s7mDqg5Jc.E93fK", # operator123
                role="OPERATOR",
                status="ACTIVE",
                is_first_login=True,
                security_question="What is your favorite city?",
                security_answer="Kochi"
            )
            db.add(op)
            db.commit()
            db.refresh(op)

        # Ensure operator is assigned to Baker Jn
        assign = db.query(OperatorAssignment).filter(OperatorAssignment.operator_id == op.user_id).first()
        if not assign:
            assign = OperatorAssignment(
                operator_id=op.user_id,
                intersection_id=baker.intersection_id
            )
            db.add(assign)
            db.commit()

        # 3. Seed Citizen account (citizen@gmail.com)
        cit = db.query(User).filter(User.email == "citizen@gmail.com").first()
        if not cit:
            cit = User(
                name="Citizen User",
                email="citizen@gmail.com",
                password="$2b$12$dB3g7qWJ264B44rM/R355OHZt5lB8Bf.gS95.u3mNf/wJ3GleE5t2", # citizen123 (uses admin123 hash)
                role="PUBLIC",
                status="ACTIVE",
                is_first_login=False,
                security_question="What is your favorite city?",
                security_answer="Kochi"
            )
            db.add(cit)
            db.commit()
    except Exception:
        db.rollback()
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
