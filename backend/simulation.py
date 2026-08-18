import os
import sys
import math

# Dynamically append SUMO python tools to path
if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
else:
    sys.exit("ERROR: Please set SUMO_HOME environment variable.")

import traci

class TrafficSimulation:
    def __init__(self):
        self.signals = {
            "north": "green",
            "east": "red",
            "south": "red",
            "west": "red"
        }
        self.signal_timers = {
            "north": 12,
            "east": 15,
            "south": 30,
            "west": 45
        }
        self.sumo_started = False
        self.start_sumo()

    def start_sumo(self):
        sumo_binary = os.path.join(os.environ["SUMO_HOME"], "bin", "sumo")
        if os.name == 'nt':
            sumo_binary += ".exe"
            
        sumo_cfg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sumo_files", "sumo.sumocfg")
        
        # Kill any orphaned SUMO processes to free up port 8813
        if os.name == 'nt':
            os.system("taskkill /f /im sumo.exe >nul 2>&1")
            
        # Start SUMO in background via TraCI
        # --no-warnings suppresses console noise, --no-step-log disables step terminal logs
        # --step-length 0.05 sets step duration to 50ms matching our background thread's 20 FPS loop
        traci.start([
            sumo_binary, 
            "-c", sumo_cfg, 
            "--no-warnings", 
            "--no-step-log",
            "--step-length", "0.05"
        ], port=8813)
        self.sumo_started = True

    def update_signals(self, signals: dict, state_string: str):
        self.signals = signals
        
        if not self.sumo_started:
            return
            
        try:
            traci.trafficlight.setRedYellowGreenState("C", state_string)
        except Exception:
            pass

    def step(self):
        if not self.sumo_started:
            return
        try:
            traci.simulationStep()
        except Exception:
            # Attempt to restart SUMO if connection is lost
            self.sumo_started = False
            try:
                traci.close()
            except Exception:
                pass
            self.start_sumo()

    def get_state(self):
        vehicles = []
        if not self.sumo_started:
            return {"signals": self.signals, "vehicles": [], "avg_wait": 0, "vehicle_count": 0}
            
        total_wait = 0
        try:
            # Query active vehicle listings from SUMO
            veh_ids = traci.vehicle.getIDList()
            for veh_id in veh_ids:
                x, y = traci.vehicle.getPosition(veh_id)
                angle = traci.vehicle.getAngle(veh_id)
                vtype = traci.vehicle.getTypeID(veh_id)
                wait = traci.vehicle.getWaitingTime(veh_id)
                total_wait += wait
                
                # Assign visual color and length based on type
                color = "#3b82f6" # default car blue
                size = 24
                if "bus" in vtype:
                    color = "#ef4444" # red
                    size = 36
                elif "truck" in vtype:
                    color = "#06b6d4" # cyan
                    size = 42
                
                vehicles.append({
                    "id": veh_id,
                    "type": vtype,
                    "x": round(x, 2),
                    "y": round(y, 2),
                    "angle": angle,
                    "color": color,
                    "size": size,
                    "wait": wait
                })
        except Exception:
            pass
            
        avg_wait = total_wait / len(vehicles) if len(vehicles) > 0 else 0.0
            
        return {
            "signals": self.signals,
            "timers": getattr(self, "signal_timers", {"horizontal": 12, "vertical": 15}),
            "vehicles": vehicles,
            "avg_wait": round(avg_wait, 1),
            "vehicle_count": len(vehicles)
        }

    def __del__(self):
        try:
            traci.close()
        except Exception:
            pass
