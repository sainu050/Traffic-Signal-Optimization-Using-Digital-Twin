from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, DateTime, Numeric
from sqlalchemy.orm import Session
import datetime
import bcrypt
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
    password: str
    phone: str | None = None
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
            "avatar": "".join([part[0] for part in user.name.split()[:2]]).upper()
        }
    }

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

@app.post("/api/operators")
def create_operator(data: OperatorCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Operator email already registered.")
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        phone=data.phone or "",
        role="OPERATOR",
        status="ACTIVE"
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
            
    return {"success": True, "message": "Operator created successfully."}

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
